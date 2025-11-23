import os
import uuid
import asyncio
import re
import numpy as np
import logging 
from typing import List, Optional, Set, Dict, Any, Tuple
from dotenv import load_dotenv
from datetime import datetime, timedelta
import sys 
import streamlit as st 
from pydantic import BaseModel, Field
from db import create_db_and_tables, save_chat_entry, get_chat_history

try:
    from user_ingestion import full_pdf_ingestion_pipeline
except ImportError:
    logging.warning("Could not import pipeline_service. PDF ingestion will be disabled.")
    full_pdf_ingestion_pipeline = None

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

try:
    nltk.download('punkt')
except URLError as e:
    print(f"Network error during download: {e}")
except Exception as e:
    print(f"An unexpected error occurred: {e}")

# Set up logging
logging.basicConfig(level=logging.INFO)

# ==================== CONFIGURATION ====================
load_dotenv()

QDRANT_COLLECTION_NAME = "ncert_multidoc_index2"
QDRANT_CACHE_COLLECTION = "llm_semantic_cache" 
SEMANTIC_CACHE_THRESHOLD = 0.85

MAX_CACHE_CAPACITY = 10000

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

# ==================== GLOBAL CLIENTS (FOR INITIALIZATION ONLY) ====================
qdrant_client: Optional[QdrantClient] = None
embed_model = None
llm_client: Optional[AsyncOpenAI] = None
reranker: Optional[SentenceTransformerRerank] = None
semantic_cache: Optional['SemanticCacheWrapper'] = None 
bm25_corpus: List[str] = []
bm25_index: Optional[BM25Okapi] = None
bm25_metadata: List[Dict[str, Any]] = []

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

class SessionSummary(BaseModel):
    session_id: str
    total_turns: int
    first_question: Optional[str]
    last_question: Optional[str]
    topics_covered: List[str]
    avg_answer_length: float

# ==================== NEW HELPER: LATEX CLEANER ====================
def clean_latex_delimiters(text: str) -> str:
    """
    Safety Net: Converts academic LaTeX delimiters \[ \] and \( \) 
    to Streamlit-friendly $$ $$ and $ $.
    """
    if not text: return ""
    # Replace \[ ... \] with $$ ... $$ (Block math)
    text = re.sub(r'\\\[(.*?)\\\]', r'$$\1$$', text, flags=re.DOTALL)
    # Replace \( ... \) with $ ... $ (Inline math)
    text = re.sub(r'\\\((.*?)\\\)', r'$\1$', text, flags=re.DOTALL)
    return text

# ==================== SEMANTIC CACHE WRAPPER ====================
class SemanticCacheWrapper:
    """A robust wrapper that handles semantic cache lookup and persistence using Qdrant."""
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
                
                # --- LFU/LRU TRACKING UPDATE ---
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
            # Synchronous Qdrant call run in an asyncio task for non-blocking execution.
            self.q_client.set_payload(
                collection_name=self.collection_name,
                payload={
                    "frequency": current_frequency + 1,
                    "last_used_timestamp": datetime.utcnow().timestamp()
                },
                points=[point_id],
                wait=False
            )
            logging.debug(f"📈 CACHE HIT update successful for {point_id}. New Freq: {current_frequency + 1}")
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
            
            # --- LFU/LRU INITIALIZATION ---
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
            logging.info("💾 CACHE WRITE successful in background. (LFU Tracked)")
        except Exception as e:
            logging.warning(f"Semantic Cache WRITE Error: {e}")
            pass

# ==================== UTILITY FUNCTIONS ====================
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
            
    logging.info(f"[QUERY EXPANSION] No expansion applied. Returning raw query: '{query}'")
    return query


def format_chat_history(history_records: List[Dict[str, Any]]) -> str:
    """Formats chat history in a clear, structured way that helps LLM understand context."""
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


async def get_session_summary(session_id: str) -> SessionSummary:
    """Provides a summary of the conversation."""
    history = await get_chat_history(session_id, 10)
    topics_covered = []
    total_response_length = 0
    for h in history:
        question = h.get('user_query', ''); response = h.get('llm_response', '')
        if question: topics_covered.append(question[:50])
        total_response_length += len(response)
    avg_length = total_response_length / len(history) if history else 0
    return SessionSummary(
        session_id=session_id,
        total_turns=len(history),
        first_question=history[0].get('user_query') if history else None,
        last_question=history[-1].get('user_query') if history else None,
        topics_covered=topics_covered,
        avg_answer_length=avg_length
    )

async def log_cache_eviction_status(clients: Dict[str, Any]):
    """Conceptual function to check cache size and alert if eviction is missed."""
    if clients.get('qdrant') and clients.get('cache'): 
        try:
            count_result = clients['qdrant'].count(collection_name=QDRANT_CACHE_COLLECTION, exact=True)
            current_size = count_result.count
            
            if current_size > MAX_CACHE_CAPACITY:
                logging.warning(f"CACHE EVICTION ALERT: Size is {current_size}, exceeding max capacity {MAX_CACHE_CAPACITY}. LFU/LRU sweep is required!")
            else:
                logging.debug(f"Cache size is healthy: {current_size} points.")
                
        except Exception as e:
            logging.error(f"Failed to check cache eviction status: {e}")
    elif not clients.get('cache'):
        logging.debug("Cache not available, skipping cache eviction status check")


# ==================== INITIALIZATION & BM25 BUILD ====================

def build_bm25_index(q_client: QdrantClient):
    """Fetches all payloads from Qdrant and builds/rebuilds the BM25 index."""
    global bm25_corpus, bm25_index, bm25_metadata
    
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
        return len(bm25_corpus)
    except Exception as e:
        print(f"⚠️ BM25 index initialization/rebuild failed: {e}")
        bm25_index = None
        return 0


async def initialize_clients():
    """Initializes clients and assigns them to module-level globals."""
    global qdrant_client, embed_model, reranker, llm_client, semantic_cache
    
    print("\n--- Initializing RAG Services ---")
    
    # 1. Embedding Model
    try:
        embed_model = HuggingFaceEmbedding( model_name=EMBED_MODEL_NAME, device="cuda" )
        Settings.embed_model = embed_model
        print(f"✅ Embedding model loaded: {EMBED_MODEL_NAME}")
    except Exception as e:
        print(f"❌ Embedding model load failed: {e}")
        embed_model = None
        
    # 2. Qdrant client
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
    if LLM_API_KEY:
        try:
            llm_client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=LLM_API_KEY)
            llm_client.extra_headers = {"HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8501"), "X-Title": "Hybrid Qdrant RAG"}
            print(f"✅ LLM client initialized: {LLM_MODEL_NAME}")
        except Exception as e:
            print(f"❌ LLM client init failed: {e}")
            llm_client = None
    else:
        print("❌ OPENROUTER_API_KEY not found.")
        llm_client = None

    # 4. Initialize Semantic Cache Wrapper
    if qdrant_client and embed_model:
        try:
            semantic_cache = SemanticCacheWrapper(q_client=qdrant_client, embed_model=embed_model, collection_name=QDRANT_CACHE_COLLECTION, threshold=SEMANTIC_CACHE_THRESHOLD)
            print("✅ Semantic Cache Wrapper initialized.")
        except Exception as e:
            print(f"❌ Semantic Cache Wrapper initialization failed: {e}")
            semantic_cache = None
    else:
        print("❌ Semantic Cache disabled due to missing Qdrant/Embedding client.")
        semantic_cache = None

    # 5. Reranker
    try:
        reranker = SentenceTransformerRerank(model=RERANKER_MODEL_NAME, top_n=FINAL_RERANK_N, device=RERANKER_DEVICE)
        print(f"✅ Reranker initialized: {RERANKER_MODEL_NAME} (Device: {RERANKER_DEVICE})")
    except Exception as e: print(f"⚠️ Reranker init failed: {e} (continuing without reranker)"); reranker = None
    
    return {
        "qdrant": qdrant_client, "embed": embed_model, "reranker": reranker, 
        "llm": llm_client, "cache": semantic_cache, "bm25_index": bm25_index, 
        "bm25_corpus": bm25_corpus, "bm25_metadata": bm25_metadata,
    }

    
@st.cache_resource
def setup_rag_services():
    """Initializes all RAG components."""
    if st.session_state.get('ingestion_done', False):
        print("\n--- CACHE CLEAR TRIGGERED ---")
        setup_rag_services.clear() 
        st.session_state.ingestion_done = False 
    
    async def run_initialization():
        await create_db_and_tables() 
        return await initialize_clients()
        
    print("Starting synchronous RAG service setup...")
    try:
        if sys.platform == "win32":
            loop = asyncio.SelectorEventLoop()
            asyncio.set_event_loop(loop)
        else:
            loop = asyncio.get_event_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    clients = loop.run_until_complete(run_initialization())
    
    if clients.get('qdrant'):
        build_bm25_index(clients['qdrant']) 
    
    print("RAG service setup complete.")
    
    return clients


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
    if clients['reranker']:
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
    
    if clients.get('llm') is None:
        raise Exception("Service not fully initialized. LLM client is not available.")
    
    cache_wrapper = clients.get('cache')
    if cache_wrapper is None:
        logging.warning("Semantic Cache is disabled. The application will continue without caching.")

    await log_cache_eviction_status(clients)

    # PRIMARY CACHE CHECK
    cached_answer_raw = None
    if cache_wrapper:
        cached_answer_raw = await cache_wrapper.check_cache(query)
        if cached_answer_raw:
            logging.info(f"✅ CACHE HIT on RAW query: {query}")
            # Apply LaTeX Clean to cached answer just in case old cache has bad delimiters
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


# ==================== RENDERING UTILITY (LATEX + TABLE) ====================
def parse_markdown_table(text: str) -> Optional[Tuple[str, List[str], List[List[str]]]]:
    """
    Detects and parses the first standard Markdown table in a block of text.
    """
    lines = text.strip().split('\n')
    separator_line_index = -1
    for i, line in enumerate(lines):
        if re.match(r'^\s*\|?[-:|\s]+\s*\|?([-:\|\s]*)$', line.strip()):
            separator_line_index = i
            break
            
    if separator_line_index < 1: return None
        
    header_line = lines[separator_line_index - 1].strip()
    
    def parse_row(row_text):
        cells = [cell.strip() for cell in row_text.strip().strip('|').split('|')]
        return cells

    headers = [h for h in parse_row(header_line) if h] 
    if not headers: return None

    data_rows = []
    current_table_lines = [header_line, lines[separator_line_index]]
    
    for line in lines[separator_line_index + 1:]:
        parsed_row = parse_row(line)
        if len(parsed_row) == len(headers):
            data_rows.append(parsed_row)
            current_table_lines.append(line)
        elif len([cell for cell in parsed_row if cell]) == len(headers):
             data_rows.append([cell for cell in parsed_row if cell])
             current_table_lines.append(line)
        else:
            break

    if not data_rows: return None
    full_table_text = '\n'.join(current_table_lines)
    return full_table_text, headers, data_rows


def render_llm_response(raw_text: str):
    """
    Renders the LLM response. 
    Includes Safe-Guard to fix LaTeX delimiters before checking for tables.
    """
    
    # 1. CLEAN LATEX FIRST
    raw_text = clean_latex_delimiters(raw_text)
    
    # 2. TABLE DETECTION
    table_result = parse_markdown_table(raw_text)
    
    if table_result:
        full_table_text, headers, data_rows = table_result
        parts = re.split(re.escape(full_table_text), raw_text, 1)
        pre_table_text = parts[0] if len(parts) > 0 else ""
        post_table_text = parts[1] if len(parts) > 1 else ""

        if pre_table_text.strip():
            render_llm_response(pre_table_text.strip())
            
        if data_rows:
            table_data = [headers] + data_rows
            try:
                st.table(table_data) 
            except Exception as e:
                st.markdown(full_table_text, unsafe_allow_html=True)
                logging.warning(f"Failed to render table using st.table: {e}. Falling back to markdown.")

        if post_table_text.strip():
            render_llm_response(post_table_text.strip())
        return

    st.markdown(raw_text, unsafe_allow_html=True)


# ==================== STREAMLIT UI IMPLEMENTATION ====================

if "session_id" not in st.session_state: st.session_state["session_id"] = str(uuid.uuid4())
if "chat_history" not in st.session_state: st.session_state["chat_history"] = []
if "show_debug" not in st.session_state: st.session_state["show_debug"] = False
if "ingestion_done" not in st.session_state: st.session_state["ingestion_done"] = False

rag_clients = setup_rag_services()
bm25_corpus = rag_clients['bm25_corpus'] 

st.set_page_config(page_title="Hybrid RAG Chatbot", layout="wide")
st.title("📚 Hybrid RAG Chatbot")
st.caption(f"Session ID: {st.session_state.session_id}")

with st.sidebar:
    st.header("System Status")
    status_emoji = "🟢" if all(rag_clients.values()) else "🔴"
    st.markdown(f"**RAG Services:** {status_emoji}")
    st.markdown(f"**Qdrant:** {'✅' if rag_clients['qdrant'] else '❌'}")
    st.markdown(f"**BM25 Index Size:** {len(bm25_corpus)}")
    st.markdown(f"**LLM Model:** `{LLM_MODEL_NAME.split('/')[-1]}`")
    
    if st.button("Start New Session"):
        st.session_state.session_id = str(uuid.uuid4())
        st.session_state.chat_history = []
        st.rerun()
        
    st.header("⬆️ Ingest PDF")
    uploaded_file = st.file_uploader("Upload PDF for indexing", type="pdf", key="pdf_uploader")
    
    if uploaded_file and full_pdf_ingestion_pipeline:
        if st.button("Start Ingestion", key="ingest_button"):
            file_content = uploaded_file.read()
            filename = uploaded_file.name
            with st.spinner(f"Processing and ingesting '{filename}'..."):
                try:
                    pipeline_result = asyncio.run(
                        full_pdf_ingestion_pipeline(file_content, filename)
                    )
                    st.success(f"✅ Ingestion Complete! Chunks: {pipeline_result.get('ingested_chunks', 0)}")
                    st.session_state.ingestion_done = True 
                    st.info("Re-running app to rebuild BM25 index...")
                    st.rerun() 
                except Exception as e:
                    st.error(f"Ingestion failed: {e}")
                    logging.error(f"PDF pipeline failed for {filename}: {e}")
    elif uploaded_file and not full_pdf_ingestion_pipeline:
        st.warning("Ingestion pipeline is disabled. Check `pipeline_service.py` import.")


for message in st.session_state.chat_history:
    with st.chat_message(message["role"]):
        if message["role"] == "assistant":
            if st.session_state.get('show_debug') and message.get('raw_llm_output'):
                 with st.expander("DEBUG: Raw LLM Output"):
                    st.code(message['raw_llm_output'], language='markdown')
            render_llm_response(message["content"])
        else:
            st.markdown(message["content"])
            
        if message.get("sources"):
            with st.expander("Sources & Cache Status"):
                st.markdown(f"**Status:** {message['cache_status']}")
                st.markdown("**Context Sources:**")
                st.code('\n'.join(message["sources"]))

def handle_user_input(prompt):
    if not prompt: return
    st.session_state.chat_history.append({"role": "user", "content": prompt})
    
    with st.spinner("Thinking... Retrieving context and generating response..."):
        try:
            response_helper = asyncio.run(
                generate_rag_response(rag_clients, prompt, st.session_state.session_id)
            )
            
            assistant_message = {
                "role": "assistant", 
                "content": response_helper.answer,
                "sources": response_helper.sources, 
                "cache_status": response_helper.cache_status,
            }
            
            if st.session_state.get('show_debug'):
                 assistant_message['raw_llm_output'] = response_helper.answer
            
            st.session_state.chat_history.append(assistant_message)
            
        except Exception as e:
            error_message = f"An error occurred: {e}"
            st.session_state.chat_history.append({
                "role": "assistant", "content": error_message, "sources": [], "cache_status": "ERROR"
            })
    
    st.rerun() 

prompt = st.chat_input("Ask a question about the NCERT documents...")
if prompt:
    handle_user_input(prompt)


st.divider()
st.toggle("Show Debug & Retrieval Panel", value=st.session_state.show_debug, key="show_debug") 

if st.session_state.show_debug:
    st.header("🛠️ Debug and Retrieval Tools")
    
    st.subheader("1. Context Retrieval Test")
    retrieval_query = st.text_input("Enter query to test retrieval:", key="retrieval_query")
    k_retrieve = st.slider("Initial K (Vector/BM25):", 1, 30, INITIAL_RETRIEVAL_K)
    
    if st.button("Run Hybrid Retrieval"):
        if not retrieval_query:
            st.warning("Please enter a query.")
        else:
            with st.spinner("Running Hybrid Search (Vector + BM25 + Rerank)..."):
                try:
                    chunks, _ = asyncio.run(
                        hybrid_retrieve_and_rerank_chunks(rag_clients, retrieval_query, initial_k=k_retrieve)
                    )
                    st.success(f"Retrieved and Reranked {len(chunks)} Chunks")
                    chunk_data = [{
                        "Score": f"{c.score:.4f}", "Source": c.source_file, "Chunk ID": c.chunk_id, 
                        "Snippet": c.text_snippet[:150] + "...", "Full Content": c.text_snippet,
                    } for c in chunks]
                    st.dataframe(chunk_data, use_container_width=True) 
                    st.caption("Expand 'Full Content' in the table to see entire chunk text.")
                except Exception as e:
                    st.error(f"Retrieval Test Failed: {e}")

    st.subheader("2. Conversation History Summary")
    if st.session_state.session_id:
        try:
            summary = asyncio.run(get_session_summary(st.session_state.session_id))
            col1, col2, col3 = st.columns(3)
            col1.metric("Total Turns", summary.total_turns)
            col2.metric("Avg Answer Length", f"{summary.avg_answer_length:.1f} chars")
            col3.metric("Last Question", summary.last_question or "N/A")
            st.markdown("**Topics Covered (First 50 chars):**")
            st.json(summary.topics_covered)
        except Exception as e:
            st.error(f"Could not load session summary: {e}")