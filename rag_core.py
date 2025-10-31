import os
import uuid
import asyncio
import re
import numpy as np
from typing import List, Optional, Set, Dict, Any, Tuple
from dotenv import load_dotenv
from contextlib import asynccontextmanager

# FastAPI Imports
from fastapi import FastAPI, status, HTTPException
from pydantic import BaseModel, Field


from db import create_db_and_tables, save_chat_entry, get_chat_history

# Qdrant + Embedding + Reranker + LLM imports
from qdrant_client import QdrantClient, models as qmodels
from llama_index.core.embeddings import resolve_embed_model
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.schema import NodeWithScore, TextNode
from openai import AsyncOpenAI

# BM25 Imports
from rank_bm25 import BM25Okapi
from nltk.tokenize import word_tokenize
import nltk
nltk.download("punkt", quiet=True)

# ==================== CONFIGURATION ====================
load_dotenv()

QDRANT_COLLECTION_NAME = "ncert_multidoc_index5"
EMBED_MODEL_NAME = "BAAI/bge-m3"
RERANKER_MODEL_NAME = "BAAI/bge-reranker-v2-m3"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_API_KEY = os.getenv("OPENROUTER_API_KEY")
LLM_MODEL_NAME = "meta-llama/llama-3.3-8b-instruct:free"

# Retrieval Parameters
INITIAL_RETRIEVAL_K = 10  # Increased for better hybrid recall
FINAL_RERANK_N = 5
CHAT_HISTORY_LIMIT = 5
# Weights are now used on *normalized* scores
HYBRID_KEYWORD_WEIGHT = 0.5
HYBRID_VECTOR_WEIGHT = 0.5
SCORE_THRESHOLD = 0.05  # Lowered score threshold to allow more hits for hybrid search
RERANKER_DEVICE = os.getenv("RERANKER_DEVICE", "cpu") # Added flexibility

# ==================== GLOBAL CLIENTS ====================
qdrant_client: Optional[QdrantClient] = None
embed_model = None
llm_client: Optional[AsyncOpenAI] = None
reranker: Optional[SentenceTransformerRerank] = None
# BM25 Globals for in-memory index
bm25_corpus: List[str] = []
bm25_index: Optional[BM25Okapi] = None
bm25_metadata: List[Dict[str, Any]] = []

# ==================== SCHEMAS ====================
class QueryInput(BaseModel):
    query: str
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    top_k: int = 5


class SearchResultHelper(BaseModel):
    score: float
    source_file: str
    content_type: str
    text_snippet: str
    chunk_id: int


class RetrievalResponse(BaseModel):
    query: str
    context_chunks: List[SearchResultHelper]


class RAGResponseHelper(BaseModel):
    query: str
    answer: str
    sources: List[str]
    session_id: str


class HealthCheck(BaseModel):
    status: str
    database: str
    vector_store: str


# ==================== UTILITY FUNCTIONS ====================
def min_max_normalize(scores: List[float]) -> List[float]:
    """Applies Min-Max normalization to a list of scores."""
    if not scores:
        return []
    np_scores = np.array(scores, dtype=np.float32)
    min_val = np.min(np_scores)
    max_val = np.max(np_scores)
    
    # Handle the case where all scores are the same (division by zero)
    if max_val == min_val:
        return [1.0] * len(scores)
    
    return ((np_scores - min_val) / (max_val - min_val)).tolist()


# ==================== INITIALIZATION ====================
async def initialize_clients():
    """Initialize qdrant, embedding model, reranker and LLM client."""
    global qdrant_client, embed_model, reranker, llm_client, bm25_corpus, bm25_index, bm25_metadata
    print("\n--- Initializing RAG Services ---")
    await create_db_and_tables()

    # Qdrant client
    try:
        qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_HOST"),
            api_key=os.getenv("QDRANT_API_KEY"),
            port=int(os.getenv("QDRANT_PORT", 6333)),
        )
        qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
        print(f"✅ Qdrant connected: {QDRANT_COLLECTION_NAME}")
    except Exception as e:
        print(f"❌ Qdrant connection failed: {e}")
        qdrant_client = None

    # Embedding model
    try:
        embed_model = resolve_embed_model(f"local:{EMBED_MODEL_NAME}")
        print(f"✅ Embedding model loaded: {EMBED_MODEL_NAME}")
    except Exception as e:
        print(f"❌ Embedding model load failed: {e}")
        embed_model = None

    # LLM client
    if LLM_API_KEY:
        try:
            llm_client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=LLM_API_KEY)
            llm_client.extra_headers = {
                "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8000"),
                "X-Title": "Hybrid Qdrant RAG",
            }
            print(f"✅ LLM client initialized: {LLM_MODEL_NAME}")
        except Exception as e:
            print(f"❌ LLM client init failed: {e}")
            llm_client = None
    else:
        print("❌ OPENROUTER_API_KEY not found.")
        llm_client = None

    # Reranker
    try:
        # Use RERANKER_DEVICE for flexibility (e.g., 'cuda' or 'cpu')
        reranker = SentenceTransformerRerank(
            model=RERANKER_MODEL_NAME, top_n=FINAL_RERANK_N, device=RERANKER_DEVICE
        )
        print(f"✅ Reranker initialized: {RERANKER_MODEL_NAME} (Device: {RERANKER_DEVICE})")
    except Exception as e:
        print(f"⚠️ Reranker init failed: {e} (continuing without reranker)")
        reranker = None

    # BM25 Index Initialization (load corpus from Qdrant payloads)
    try:
        print("⏳ Building BM25 index from Qdrant payloads...")
        scroll_resp = qdrant_client.scroll(
            collection_name=QDRANT_COLLECTION_NAME,
            with_payload=True,
            with_vectors=False,
            limit=10000, # Increased limit for more comprehensive index
        )
        points = scroll_resp[0] if isinstance(scroll_resp, (list, tuple)) else scroll_resp
        bm25_corpus = []
        bm25_metadata = []

        for p in points:
            payload = getattr(p, "payload", {}) or {}
            text = payload.get("raw_text_content") or payload.get("text") or ""
            if not text:
                continue
            # Store the text chunk and its associated metadata
            bm25_corpus.append(text)
            bm25_metadata.append({
                "source_file": payload.get("source_file", "unknown"),
                "chunk_id": payload.get("chunk_id", 0),
                "type": payload.get("type", "text_chunk"),
            })

        tokenized_corpus = [word_tokenize(doc.lower()) for doc in bm25_corpus]
        bm25_index = BM25Okapi(tokenized_corpus)
        print(f"✅ BM25 index built successfully with {len(bm25_corpus)} documents.")
    except Exception as e:
        print(f"⚠️ BM25 index initialization failed: {e}")
        bm25_index = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    await initialize_clients()
    yield
    print("Shutting down RAG services...")


app = FastAPI(
    title="Hybrid School RAG API",
    version="2.0.2",
    description="Hybrid (Vector + BM25) RAG API using Qdrant, BM25, and Llama-3",
    lifespan=lifespan,
)

# ==================== CORE RETRIEVAL LOGIC ====================
async def search_index_core(query: str, limit: int) -> List[SearchResultHelper]:
    """Performs vector-based retrieval via Qdrant."""
    if not qdrant_client or not embed_model:
        raise Exception("Service not ready. Qdrant or embedding model not initialized.")

    try:
        query_vector = embed_model.get_query_embedding(query)
    except Exception:
        query_vector = (
            embed_model.embed_query(query) if hasattr(embed_model, "embed_query") else None
        )
    if query_vector is None:
        raise Exception("Failed to create query embedding.")

    search_result = qdrant_client.search(
        collection_name=QDRANT_COLLECTION_NAME,
        query_vector=query_vector,
        limit=limit,
        with_payload=True,
        score_threshold=SCORE_THRESHOLD,
    )

    results: List[SearchResultHelper] = []
    for hit in search_result:
        payload = getattr(hit, "payload", {}) or {}
        full_text = payload.get("raw_text_content") or payload.get("text") or ""
        # Qdrant score is typically cosine similarity (0 to 1)
        results.append(
            SearchResultHelper(
                score=getattr(hit, "score", 0.0),
                source_file=payload.get("source_file", "unknown"),
                content_type=payload.get("type", "text_chunk"),
                text_snippet=full_text,
                chunk_id=payload.get("chunk_id", 0),
            )
        )
    return results


async def bm25_search_core(query: str, limit: int) -> List[SearchResultHelper]:
    """BM25 keyword-based retrieval."""
    global bm25_index, bm25_corpus, bm25_metadata
    if not bm25_index or not bm25_corpus:
        # Return empty list if index isn't ready, don't raise an exception
        print("⚠️ BM25 index not initialized, skipping keyword search.")
        return []

    tokenized_query = word_tokenize(query.lower())
    scores = bm25_index.get_scores(tokenized_query)

    # Sort and rank based on BM25 score
    ranked = sorted(
        enumerate(scores), key=lambda x: x[1], reverse=True
    )[:limit]

    results = []
    for idx, score in ranked:
        meta = bm25_metadata[idx]
        # BM25 scores can be large and non-normalized
        results.append(
            SearchResultHelper(
                score=float(score),
                source_file=meta["source_file"],
                content_type=meta["type"],
                text_snippet=bm25_corpus[idx],
                chunk_id=meta["chunk_id"],
            )
        )
    return results


async def hybrid_retrieve_and_rerank_chunks(query: str, initial_k: int = INITIAL_RETRIEVAL_K) -> Tuple[List[SearchResultHelper], Set[str]]:
    """Hybrid search: combines vector + BM25 results, optionally reranks."""
    vector_results = await search_index_core(query, initial_k)
    bm25_results = await bm25_search_core(query, initial_k)

    # 1. Prepare for Combination
    combined: Dict[str, SearchResultHelper] = {}
    
    # Extract scores for normalization
    vector_scores = [r.score for r in vector_results]
    bm25_scores = [r.score for r in bm25_results]
    
    # Normalize scores
    normalized_vector_scores = min_max_normalize(vector_scores)
    normalized_bm25_scores = min_max_normalize(bm25_scores)
    
    # Map normalized scores back to results
    for i, res in enumerate(vector_results):
        key = f"{res.source_file}-{res.chunk_id}"
        # Use the normalized vector score as the base
        res.score = normalized_vector_scores[i]
        combined[key] = res

    # 2. Combine and Re-score
    for i, bm in enumerate(bm25_results):
        key = f"{bm.source_file}-{bm.chunk_id}"
        normalized_bm25_score = normalized_bm25_scores[i]

        if key in combined:
            # Apply hybrid weights to normalized scores
            combined[key].score = (
                combined[key].score * HYBRID_VECTOR_WEIGHT + normalized_bm25_score * HYBRID_KEYWORD_WEIGHT
            )
        else:
            bm.score = normalized_bm25_score * HYBRID_KEYWORD_WEIGHT
            combined[key] = bm

    # 3. Sort by combined normalized score
    merged_results = sorted(
        combined.values(), key=lambda r: r.score, reverse=True
    )

    # 4. Rerank (if available)
    source_set: Set[str] = set()
    results_to_process = merged_results[:INITIAL_RETRIEVAL_K] # Use top K for Reranker

    if reranker:
        nodes_to_rerank = [
            NodeWithScore(
                node=TextNode(
                    text=r.text_snippet,
                    metadata={"source_file": r.source_file, "chunk_id": r.chunk_id},
                ),
                # Note: Reranker ignores this initial score but we include it for completeness
                score=r.score,
            )
            for r in results_to_process
        ]
        try:
            reranked_nodes = reranker.postprocess_nodes(nodes_to_rerank, query_str=query)
            reranked_results: List[SearchResultHelper] = []
            for node_with_score in reranked_nodes:
                node = node_with_score.node
                meta = node.metadata or {}
                text = node.text or ""
                reranked_results.append(
                    SearchResultHelper(
                        score=node_with_score.score,
                        source_file=meta.get("source_file", "unknown"),
                        content_type="text_chunk",
                        text_snippet=text.strip(),
                        chunk_id=meta.get("chunk_id", 0),
                    )
                )
                source_set.add(f"{meta.get('source_file', 'unknown')} (Chunk {meta.get('chunk_id', 0)})")
            
            # The reranker output is already limited to FINAL_RERANK_N
            return reranked_results, source_set
        except Exception as e:
            print(f"⚠️ Reranker failed: {e}. Falling back to combined sort.")
            # Fallback to the merged results, limited by FINAL_RERANK_N
            for r in merged_results[:FINAL_RERANK_N]:
                source_set.add(f"{r.source_file} (Chunk {r.chunk_id})")
            return merged_results[:FINAL_RERANK_N], source_set
    else:
        for r in merged_results[:FINAL_RERANK_N]:
            source_set.add(f"{r.source_file} (Chunk {r.chunk_id})")
        return merged_results[:FINAL_RERANK_N], source_set


# ==================== CORE RAG GENERATION ====================
async def generate_rag_response(query: str, session_id: str, use_retrieval_k: int = INITIAL_RETRIEVAL_K) -> RAGResponseHelper:
    """Main orchestration: retrieve first, then call LLM."""
    if not all([qdrant_client, embed_model, llm_client]):
        raise Exception("Service not fully initialized.")

    history_records = await get_chat_history(session_id, CHAT_HISTORY_LIMIT)
    history_str = "\n".join(
        [f"**Turn {i+1}** (User: {h['user_query']})\n(Assistant: {h['llm_response']})" for i, h in enumerate(history_records)]
    )

    try:
        context_chunks, source_set = await hybrid_retrieve_and_rerank_chunks(query, initial_k=use_retrieval_k)
    except Exception as e:
        print(f"⚠️ Retrieval failed: {e}")
        context_chunks, source_set = ([], set())

    context_str = "\n---\n".join([chunk.text_snippet for chunk in context_chunks])

    if not context_str and not history_records:
        return RAGResponseHelper(query=query, answer="No relevant information found. Please try a different query.", sources=[], session_id=session_id)

    RAG_PROMPT = f"""
    You are an expert Q&A assistant for Indian educational content.

    **CRITICAL INSTRUCTIONS:**
    1. Use CONTEXT if available to answer the QUESTION.
    2. If CONTEXT is empty, use CHAT HISTORY to maintain conversation flow.
    3. If asked to "explain briefly" or a follow-up question is asked, base it on prior chat context.
    4. Be friendly, concise, and professional.
    5. NEVER mention the CONTEXT, CHAT HISTORY, or the source files in the final answer.

--- CHAT HISTORY (for contextual follow-up) ---
{history_str or "No history"}

--- CONTEXT (for grounding the answer) ---
{context_str or "CONTEXT IS EMPTY"}

--- QUESTION ---
{query}
"""

    try:
        response = await llm_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[{"role": "user", "content": RAG_PROMPT}],
            temperature=0.1,
        )
        answer = response.choices[0].message.content.strip()
        # Clean up common LLM formatting issues
        answer = re.sub(r'\\n', ' ', answer)
        answer = re.sub(r'\s+', ' ', answer).strip()

        await save_chat_entry(session_id, query, answer, list(source_set), [c.text_snippet for c in context_chunks])

        return RAGResponseHelper(query=query, answer=answer, sources=list(source_set), session_id=session_id)

    except Exception as e:
        raise Exception(f"LLM generation failed: {e}")


# ==================== API ENDPOINTS ====================
@app.get("/health", response_model=HealthCheck, tags=["System"])
async def check_health():
    db_status = "OK"
    qdrant_status = "OK"
    try:
        # Test DB
        await get_chat_history("health_test", 1)
    except Exception:
        db_status = "FAIL"
    try:
        # Test Qdrant
        if qdrant_client:
            qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
        else:
            qdrant_status = "FAIL"
    except Exception:
        qdrant_status = "FAIL"
    
    overall = "OK" if db_status == "OK" and qdrant_status == "OK" else "DEGRADED"
    return HealthCheck(status=overall, database=db_status, vector_store=qdrant_status)


@app.post("/retrieve", response_model=RetrievalResponse, tags=["RAG"])
async def retrieve_chunks_for_query(request: QueryInput):
    """Retrieves and reranks source chunks using hybrid search."""
    if not embed_model:
        raise HTTPException(status_code=503, detail="Embedding model not initialized.")
    try:
        context_chunks, _ = await hybrid_retrieve_and_rerank_chunks(request.query)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Retrieval error: {e}")

    return RetrievalResponse(query=request.query, context_chunks=context_chunks[:request.top_k])


@app.post("/chat", response_model=RAGResponseHelper, tags=["RAG"])
async def rag_query_endpoint(request: QueryInput):
    """Main RAG endpoint for conversational query and response."""
    try:
        return await generate_rag_response(request.query, request.session_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"LLM generation failed: {e}")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("rag_core:app", host="0.0.0.0", port=8000, reload=True)