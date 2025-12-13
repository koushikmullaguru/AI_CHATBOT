import os
import uuid
import asyncio
import re
import numpy as np
import logging 
import sys 
from typing import List, Optional, Set, Dict, Any, Tuple
from dotenv import load_dotenv
from datetime import datetime
from pydantic import BaseModel, Field
from db import create_db_and_tables, save_chat_entry, get_chat_history

# Import necessary RAG components
from qdrant_client import QdrantClient, models as qmodels
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core import Settings
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.schema import NodeWithScore, TextNode
from openai import AsyncOpenAI 

# BM25 Imports
from rank_bm25 import BM25Okapi
from nltk.tokenize import word_tokenize
import nltk
from urllib.error import URLError

# We'll handle NLTK download in the initialization function

# Set up logging
logging.basicConfig(level=logging.INFO)

# ==================== CONFIGURATION ====================
load_dotenv()

QDRANT_COLLECTION_NAME = "ncert_multidoc_index2"
QDRANT_CACHE_COLLECTION = "llm_semantic_cache" 
SEMANTIC_CACHE_THRESHOLD = 0.85

EMBED_MODEL_NAME = "BAAI/bge-m3"
RERANKER_MODEL_NAME = "BAAI/bge-reranker-v2-m3"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_API_KEY = os.getenv("OPENROUTER_API_KEY")
LLM_MODEL_NAME = "openai/gpt-oss-20b:free" 

# Retrieval Parameters
INITIAL_RETRIEVAL_K = 12 
FINAL_RERANK_N = 5
CHAT_HISTORY_LIMIT = 7 
HYBRID_KEYWORD_WEIGHT = 0.5
HYBRID_VECTOR_WEIGHT = 0.5
SCORE_THRESHOLD = 0.03 
RERANKER_DEVICE = os.getenv("RERANKER_DEVICE", "cpu") 

# ==================== GLOBAL CLIENTS & DATA ====================
CLIENTS: Dict[str, Any] = {}

# ==================== SCHEMAS ====================
class SearchResultHelper(BaseModel):
    score: float
    source_file: str
    content_type: str
    text_snippet: str
    chunk_id: Any
    
class RAGResponseHelper(BaseModel):
    query: str
    answer: str
    sources: List[str]
    session_id: str
    cache_status: str = "MISS"
    suggested_questions: List[str] = []

# ==================== UTILITY FUNCTIONS ====================
def clean_latex_delimiters(text: str) -> str:
    """Converts academic LaTeX delimiters to display-friendly delimiters."""
    if not text: return ""
    text = re.sub(r'\\\[(.*?)\\\]', r'$$\1$$', text, flags=re.DOTALL)
    text = re.sub(r'\\\((.*?)\\\)', r'$\1$', text, flags=re.DOTALL)
    return text

def min_max_normalize(scores: List[float]) -> List[float]:
    """Applies Min-Max normalization to a list of scores."""
    if not scores: return []
    np_scores = np.array(scores, dtype=np.float32)
    min_val = np.min(np_scores)
    max_val = np.max(np_scores)
    if max_val == min_val: return [1.0] * len(scores)
    return ((np_scores - min_val) / (max_val - min_val)).tolist()


async def expand_query_with_context(query: str, history_records: List[Dict[str, Any]]) -> str:
    """Expands ambiguous follow-up queries using previous conversation context."""
    follow_up_patterns = [
        r'\b(that|this|it|those|these)\b', 
        r'\b(tell me more|more details|simplify|expand)\b', 
        r'\b(what about|regarding|concerning)\b(?!\s+)', 
        r'^(how|why|can you)\b.*\b(that|it)\b', 
        r'^(yes|okay|alright)' 
    ]
    
    query_lower = query.lower()
    is_likely_followup = any(re.search(pattern, query_lower) for pattern in follow_up_patterns)
    
    if is_likely_followup and history_records:
        try:
            last_user_query = history_records[-1].get('user_query', 'previous discussion')
            context_topic = last_user_query[:80]
            expanded_query = f"{query} [Previous context: {context_topic}...]"
            logging.info(f"[QUERY EXPANSION] Expanded: '{expanded_query}'")
            return expanded_query
        except Exception as e:
            logging.warning(f"[QUERY EXPANSION] Error during expansion, returning raw query: {e}")
            return query
            
    return query


def format_chat_history(history_records: List[Dict[str, Any]]) -> str:
    """Formats chat history for the LLM prompt."""
    if not history_records: return "No previous conversation."
    formatted_history = []
    total_turns = len(history_records)
    for i, record in enumerate(history_records, 1):
        is_recent = (i == total_turns)
        marker = "📍 [MOST RECENT]" if is_recent else f"[{i - total_turns}]" 
        response = record.get('llm_response', '')
        if len(response) > 400: response = response[:400] + "..."
        turn = (f"Turn {i} {marker}\n" f"  👤 User: {record.get('user_query', '')}\n" f"  🤖 Assistant: {response}")
        formatted_history.append(turn)
    return "\n\n".join(formatted_history)

# ==================== SEMANTIC CACHE WRAPPER ====================
class SemanticCacheWrapper:
    """A wrapper for semantic cache using Qdrant."""
    def __init__(self, q_client, embed_model, collection_name, threshold):
        self.q_client = q_client
        self.embed_model = embed_model
        self.collection_name = collection_name
        self.threshold = threshold

    async def check_cache(self, query: str) -> Optional[str]:
        if not self.q_client or not self.embed_model: return None
        query_embedding = self.embed_model.get_text_embedding(query)
        
        try:
            search_result = self.q_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding,
                score_threshold=self.threshold,
                limit=1,
                with_payload=True,
            )
            if search_result:
                point = search_result[0]
                logging.info(f"✅ CACHE HIT (Score: {point.score:.4f}, Freq: {point.payload.get('frequency', 0) + 1})")
                self.increment_usage(point.id, point.payload.get('frequency', 0))
                return point.payload.get("llm_answer")
        except Exception as e:
            logging.warning(f"Semantic Cache READ Error: {e}")
            return None
        return None
        
    def increment_usage(self, point_id: str, current_frequency: int):
        """Asynchronously updates the frequency and last_used timestamp of a cache point."""
        if not self.q_client: return 
        asyncio.create_task(self._increment_usage_task(point_id, current_frequency))

    async def _increment_usage_task(self, point_id: str, current_frequency: int):
        """Background task to perform the non-blocking update (LFU/LRU read-and-write)."""
        try:
            self.q_client.set_payload(
                collection_name=self.collection_name,
                payload={
                    "frequency": current_frequency + 1,
                    "last_used_timestamp": datetime.utcnow().timestamp()
                },
                points=[point_id],
                wait=False
            )
        except Exception as e:
            logging.warning(f"LFU Update WRITE Error for {point_id}: {e}")
            pass

    def save_cache(self, query: str, answer: str):
        if not self.q_client or not self.embed_model: 
            logging.info("Skipping cache save: Qdrant or embedding model not available in SemanticCacheWrapper.")
            return 
        asyncio.create_task(self._save_cache_task(query, answer))

    async def _save_cache_task(self, query: str, answer: str):
        try:
            query_embedding = self.embed_model.get_text_embedding(query)
            current_timestamp = datetime.utcnow().timestamp()
            
            point = qmodels.PointStruct(
                id=str(uuid.uuid4()), vector=query_embedding, 
                payload={
                    "user_query": query, 
                    "llm_answer": answer, 
                    "created_at": datetime.utcnow().isoformat(), 
                    "frequency": 1, 
                    "last_used_timestamp": current_timestamp,
                }
            )
            self.q_client.upsert(collection_name=self.collection_name, points=[point], wait=False)
            logging.info("💾 CACHE WRITE successful in background.")
        except Exception as e:
            logging.warning(f"Semantic Cache WRITE Error: {e}")
            pass

# ==================== INITIALIZATION & BM25 BUILD ====================
def build_bm25_index(q_client: QdrantClient):
    """Fetches all payloads from Qdrant and builds/rebuilds the BM25 index."""
    
    print("⏳ Building BM25 index from Qdrant payloads...")
    try:
        scroll_resp = q_client.scroll(
            collection_name=QDRANT_COLLECTION_NAME, with_payload=True, with_vectors=False, limit=10000, 
        )
        points = scroll_resp[0] if isinstance(scroll_resp, (list, tuple)) else scroll_resp
        
        bm25_corpus = []
        bm25_metadata = []

        for p in points:
            payload = getattr(p, "payload", {}) or {}
            text = payload.get("raw_text_content") or payload.get("text") or ""
            if not text: continue
            bm25_corpus.append(text)
            bm25_metadata.append({"source_file": payload.get("source_file", "unknown"), "chunk_id": payload.get("chunk_id", 0), "type": payload.get("type", "text_chunk"),})

        tokenized_corpus = [word_tokenize(doc.lower()) for doc in bm25_corpus]
        bm25_index = BM25Okapi(tokenized_corpus)
        print(f"✅ BM25 index built successfully with {len(bm25_corpus)} documents.")
        return bm25_index, bm25_corpus, bm25_metadata
    except Exception as e:
        print(f"⚠️ BM25 index initialization/rebuild failed: {e}")
        return None, [], []


def initialize_clients() -> Dict[str, Any]:
    """Initializes clients and returns them."""
    
    print("\n--- Initializing RAG Services ---")
    
    # 0. Download NLTK data
    try:
        nltk.data.find('tokenizers/punkt_tab')
    except LookupError:
        try:
            print("Downloading NLTK 'punkt_tab' data...")
            nltk.download('punkt_tab')
        except Exception as e:
            print(f"Error downloading NLTK data: {e}")
    
    # 1. Embedding Model
    embed_model = None
    try:
        # Use GPU if RERANKER_DEVICE suggests it, otherwise fallback to CPU
        device = "cuda" if "cuda" in RERANKER_DEVICE.lower() else "cpu"
        embed_model = HuggingFaceEmbedding( model_name=EMBED_MODEL_NAME, device=device )
        Settings.embed_model = embed_model
        print(f"✅ Embedding model loaded: {EMBED_MODEL_NAME} (Device: {device})")
    except Exception as e:
        print(f"❌ Embedding model load failed: {e}")
        
    # 2. Qdrant client
    qdrant_client = None
    try:
        qdrant_url = os.getenv("QDRANT_CLOUD_URL")
        qdrant_api_key = os.getenv("QDRANT_CLOUD_API_KEY")
        
        if qdrant_url:
            qdrant_client = QdrantClient(url=qdrant_url, api_key=qdrant_api_key)
        else:
            qdrant_client = QdrantClient(
                url=os.getenv("QDRANT_HOST"),
                api_key=qdrant_api_key,
                port=int(os.getenv("QDRANT_PORT", 6333)),
            )
            
        qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
        print(f"✅ Qdrant connected: {QDRANT_COLLECTION_NAME}")
        
        # Cache collection setup 
        try:
            cache_collection_name = QDRANT_CACHE_COLLECTION
            collections_list = qdrant_client.get_collections().collections
            exists = any(c.name == cache_collection_name for c in collections_list)
            
            if not exists:
                qdrant_client.create_collection(
                    collection_name=cache_collection_name, 
                    vectors_config=qmodels.VectorParams(size=1024, distance=qmodels.Distance.COSINE)
                )
                print(f"✅ Qdrant Cache Collection created: {cache_collection_name}")
                
                # Create the payload indices for LFU/LRU tracking
                qdrant_client.create_payload_index(collection_name=cache_collection_name, field_name="frequency", field_schema="integer")
                qdrant_client.create_payload_index(collection_name=cache_collection_name, field_name="last_used_timestamp", field_schema="float")
                print("✅ Created indices for LFU and LRU tracking.")
            else:
                print(f"✅ Qdrant Cache Collection already exists: {cache_collection_name}")

        except Exception as e: logging.warning(f"Could not check/create cache collection: {e}") 

    except Exception as e:
        print(f"❌ Qdrant connection failed: {e}")
        qdrant_client = None

    # 3. LLM client
    llm_client = None
    if LLM_API_KEY:
        try:
            llm_client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=LLM_API_KEY)
            llm_client.extra_headers = {"HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8501"), "X-Title": "Hybrid Qdrant RAG"}
            print(f"✅ LLM client initialized: {LLM_MODEL_NAME}")
        except Exception as e:
            print(f"❌ LLM client init failed: {e}")
    else:
        print("❌ OPENROUTER_API_KEY not found.")

    # 4. Initialize Semantic Cache Wrapper
    semantic_cache = None
    if qdrant_client and embed_model:
        try:
            semantic_cache = SemanticCacheWrapper(q_client=qdrant_client, embed_model=embed_model, collection_name=QDRANT_CACHE_COLLECTION, threshold=SEMANTIC_CACHE_THRESHOLD)
            print("✅ Semantic Cache Wrapper initialized.")
        except Exception as e:
            print(f"❌ Semantic Cache Wrapper initialization failed: {e}")
    else:
        print("❌ Semantic Cache disabled due to missing Qdrant/Embedding client.")

    # 5. Reranker
    reranker = None
    try:
        reranker = SentenceTransformerRerank(model=RERANKER_MODEL_NAME, top_n=FINAL_RERANK_N, device=RERANKER_DEVICE)
        print(f"✅ Reranker initialized: {RERANKER_MODEL_NAME} (Device: {RERANKER_DEVICE})")
    except Exception as e: print(f"⚠️ Reranker init failed: {e} (continuing without reranker)");

    # 6. BM25 Index Build (Synchronous part)
    bm25_index, bm25_corpus, bm25_metadata = build_bm25_index(qdrant_client)
    
    return {
        "qdrant": qdrant_client, "embed": embed_model, "reranker": reranker, 
        "llm": llm_client, "cache": semantic_cache, "bm25_index": bm25_index, 
        "bm25_corpus": bm25_corpus, "bm25_metadata": bm25_metadata,
    }


async def initialize_and_load_clients():
    """Asynchronous entry point to initialize all clients and global data."""
    global CLIENTS
    
    # Database table creation must be awaited
    await create_db_and_tables()
    
    # Run the client initialization
    clients = initialize_clients()
    
    # Ensure the clients are properly stored in the global variable
    CLIENTS.update(clients)
    
    return CLIENTS

# ==================== CORE RETRIEVAL LOGIC ====================
async def search_index_core(q_client: QdrantClient, emb_model, query: str, limit: int) -> List[SearchResultHelper]:
    if not q_client or not emb_model: raise Exception("Service not ready. Qdrant or embedding model not initialized.")
    try:
        query_embedding = emb_model.get_text_embedding(query)
        search_result = q_client.search(
            collection_name=QDRANT_COLLECTION_NAME, query_vector=query_embedding, score_threshold=SCORE_THRESHOLD, limit=limit, with_payload=True,
        )
        results = []
        for point in search_result:
            payload = point.payload or {}
            results.append(SearchResultHelper(score=point.score, source_file=payload.get("source_file", "unknown"), content_type=payload.get("type", "text_chunk"), text_snippet=payload.get("raw_text_content", payload.get("text", "")), chunk_id=payload.get("chunk_id", 0),))
        return results
    except Exception as e:
        print(f"⚠️ Vector search failed: {e}")
        return []

async def bm25_search_core(bm25_idx: BM25Okapi, bm25_meta: List[Dict[str, Any]], bm25_corp: List[str], query: str, limit: int) -> List[SearchResultHelper]:
    if not bm25_idx or not bm25_corp: return []
    try:
        query_tokens = word_tokenize(query.lower())
        scores = bm25_idx.get_scores(query_tokens)
        ranked = sorted(enumerate(scores), key=lambda x: x[1], reverse=True)[:limit]
        results = []
        for idx, score in ranked:
            meta = bm25_meta[idx]
            results.append(SearchResultHelper(score=float(score), source_file=meta["source_file"], content_type=meta["type"], text_snippet=bm25_corp[idx], chunk_id=meta["chunk_id"],))
        return results
    except Exception as e:
        print(f"⚠️ BM25 search failed: {e}")
        return []

async def hybrid_retrieve_and_rerank_chunks(clients: Dict[str, Any], query: str, initial_k: int = INITIAL_RETRIEVAL_K) -> Tuple[List[SearchResultHelper], Set[str]]:

    vector_results, bm25_results = await asyncio.gather(
    search_index_core(clients['qdrant'], clients['embed'], query, initial_k),
    bm25_search_core(clients['bm25_index'], clients['bm25_metadata'], clients['bm25_corpus'], query, initial_k)
    )

    combined: Dict[str, SearchResultHelper] = {}; vector_scores = [r.score for r in vector_results]; bm25_scores = [r.score for r in bm25_results]
    normalized_vector_scores = min_max_normalize(vector_scores); normalized_bm25_scores = min_max_normalize(bm25_scores)
    for i, res in enumerate(vector_results):
        key = f"{res.source_file}-{res.chunk_id}"; res.score = normalized_vector_scores[i]; combined[key] = res
    for i, bm in enumerate(bm25_results):
        key = f"{bm.source_file}-{bm.chunk_id}"; normalized_bm25_score = normalized_bm25_scores[i]
        if key in combined: combined[key].score = (combined[key].score * HYBRID_VECTOR_WEIGHT + normalized_bm25_score * HYBRID_KEYWORD_WEIGHT)
        else: bm.score = normalized_bm25_score * HYBRID_KEYWORD_WEIGHT; combined[key] = bm
    merged_results = sorted(combined.values(), key=lambda r: r.score, reverse=True)

    source_set: Set[str] = set()
    results_to_process = merged_results[:INITIAL_RETRIEVAL_K] 
    if clients.get('reranker'):
        reranker_obj = clients['reranker']; nodes_to_rerank = [NodeWithScore(node=TextNode(text=r.text_snippet, metadata={"source_file": r.source_file, "chunk_id": r.chunk_id}), score=r.score) for r in results_to_process]
        try:
            reranked_nodes = reranker_obj.postprocess_nodes(nodes_to_rerank, query_str=query); reranked_results: List[SearchResultHelper] = []
            for node_with_score in reranked_nodes:
                node = node_with_score.node; meta = node.metadata or {}; text = node.text or ""
                reranked_results.append(SearchResultHelper(score=node_with_score.score, source_file=meta.get("source_file", "unknown"), content_type="text_chunk", text_snippet=text.strip(), chunk_id=meta.get("chunk_id", 0)))
                source_set.add(f"{meta.get('source_file', 'unknown')} (Chunk {meta.get('chunk_id', 0)})")
            return reranked_results, source_set
        except Exception as e:
            print(f"⚠️ Reranker failed: {e}. Falling back to combined sort.")
            for r in merged_results[:FINAL_RERANK_N]: source_set.add(f"{r.source_file} (Chunk {r.chunk_id})")
            return merged_results[:FINAL_RERANK_N], source_set
    else:
        for r in merged_results[:FINAL_RERANK_N]: source_set.add(f"{r.source_file} (Chunk {r.chunk_id})")
        return merged_results[:FINAL_RERANK_N], source_set


# ==================== CORE RAG GENERATION ====================
async def generate_rag_response(clients: Dict[str, Any], query: str, session_id: str, use_retrieval_k: int = INITIAL_RETRIEVAL_K) -> RAGResponseHelper:
    
    if not clients or not clients.get('llm'):
        raise Exception("Service not fully initialized. LLM client is not available.")
    
    cache_wrapper = clients.get('cache')
    
    # PRIMARY CACHE CHECK
    cached_answer_raw = None
    if cache_wrapper:
        cached_answer_raw = await cache_wrapper.check_cache(query)
        if cached_answer_raw:
            logging.info(f"✅ CACHE HIT on RAW query: {query}")
            cached_answer_raw = clean_latex_delimiters(cached_answer_raw)
            await save_chat_entry(session_id, query, cached_answer_raw, ["[Semantic Cache]"], [])
            return RAGResponseHelper(query=query, answer=cached_answer_raw, sources=["[Semantic Cache]"], session_id=session_id, cache_status="HIT")
    
    # EXPAND QUERY
    history_records = await get_chat_history(session_id, CHAT_HISTORY_LIMIT)
    expanded_query = await expand_query_with_context(query, history_records)
    
    # SECONDARY CACHE CHECK
    if expanded_query != query and cache_wrapper:
        cached_answer_expanded = await cache_wrapper.check_cache(expanded_query)
        if cached_answer_expanded:
            logging.info(f"✅ CACHE HIT on EXPANDED query: {expanded_query}")
            cached_answer_expanded = clean_latex_delimiters(cached_answer_expanded)
            await save_chat_entry(session_id, query, cached_answer_expanded, ["[Semantic Cache]"], [])
            return RAGResponseHelper(query=query, answer=cached_answer_expanded, sources=["[Semantic Cache]"], session_id=session_id, cache_status="HIT")

    history_str = format_chat_history(history_records)

    try:
        context_chunks, source_set = await hybrid_retrieve_and_rerank_chunks(clients, expanded_query, initial_k=use_retrieval_k)
    except Exception as e:
        print(f"⚠️ Retrieval failed: {e}")
        context_chunks, source_set = ([], set())

    # Ensure context_chunks is a list of SearchResultHelper, as hybrid_retrieve_and_rerank_chunks was refactored
    context_str = "\n---\n".join([chunk.text_snippet for chunk in context_chunks])

    if not context_str and not history_records:
        return RAGResponseHelper(query=query, answer="No relevant information found. Please try a different query.", sources=[], session_id=session_id, cache_status="MISS")
    
    RAG_PROMPT = f"""
You are an expert Q&A assistant for Indian educational content(NCERT based).

**IMPORTANT FOR FOLLOW-UP QUESTIONS:**
If this appears to be a follow-up to the previous conversation:
- Explicitly reference what was discussed before
- Build upon the established understanding
- Provide additional details, examples, or clarification
- Do NOT repeat the same information word-for-word

**YOUR INSTRUCTIONS:**
1. Read the CONVERSATION HISTORY first to understand context
2. Read the CURRENT CONTEXT for detailed information
3. **Prioritize the most relevant information and rephrase it in your own words.**
4. If asked to elaborate/explain more: add depth and examples
5. If asked for clarification: rephrase in a different way
6. Be friendly, concise, and educational
7. **FORMATTING RULE: Wrap all mathematical and chemical equations in double dollar signs ($$). For example, output $$2H_2 + O_2 \rightarrow 2H_2O$$ for chemical equations and $$E=mc^2$$ for physics. This ensures proper display.**
8. Use standard Markdown tables if necessary to present clear comparative data.

--- CONVERSATION HISTORY ---
{history_str}

--- CURRENT CONTEXT (factual reference material) ---
{context_str or "No specific context retrieved."}

--- USER QUESTION ---
{query}

--- YOUR RESPONSE ---
Answer the question directly and naturally.
"""
    try:
        response = await clients['llm'].chat.completions.create( 
            model=LLM_MODEL_NAME, messages=[{"role": "user", "content": RAG_PROMPT}], temperature=0.1, 
        )
        answer = response.choices[0].message.content.strip() 
        
        # --- CLEANUP PIPELINE ---
        answer = re.sub(r'\\n', '\n', answer)
        answer = re.sub(r'^-+\|(-+\|)+-+\s*$', '', answer, flags=re.MULTILINE).strip()

        answer = clean_latex_delimiters(answer)

        if cache_wrapper: 
            cache_key = query if expanded_query == query else expanded_query
            cache_wrapper.save_cache(cache_key, answer)
        else:
            logging.info("Cache not available, skipping cache save operation")
        
        await save_chat_entry(session_id, query, answer, list(source_set), [c.text_snippet for c in context_chunks])

        return RAGResponseHelper(query=query, answer=answer, sources=list(source_set), session_id=session_id, cache_status="MISS")

    except Exception as e:
        raise Exception(f"LLM generation failed: {e}")