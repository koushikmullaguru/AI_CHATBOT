# import os
# import uuid
# import asyncio
# import re
# import numpy as np
# from typing import List, Optional, Set, Dict, Any, Tuple
# from dotenv import load_dotenv
# from contextlib import asynccontextmanager

# # FastAPI Imports
# from fastapi import FastAPI, status, HTTPException
# from pydantic import BaseModel, Field


# from db import create_db_and_tables, save_chat_entry, get_chat_history

# # Qdrant + Embedding + Reranker + LLM imports
# from qdrant_client import QdrantClient, models as qmodels
# from llama_index.core.embeddings import resolve_embed_model
# from llama_index.core.postprocessor import SentenceTransformerRerank
# from llama_index.core.schema import NodeWithScore, TextNode
# from openai import AsyncOpenAI

# # BM25 Imports
# from rank_bm25 import BM25Okapi
# from nltk.tokenize import word_tokenize
# import nltk
# nltk.download("punkt", quiet=True)

# # ==================== CONFIGURATION ====================
# load_dotenv()

# QDRANT_COLLECTION_NAME = "ncert_multidoc_index5"
# EMBED_MODEL_NAME = "BAAI/bge-m3"
# RERANKER_MODEL_NAME = "BAAI/bge-reranker-v2-m3"
# OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
# LLM_API_KEY = os.getenv("OPENROUTER_API_KEY")
# LLM_MODEL_NAME = "meta-llama/llama-3.3-8b-instruct:free"

# # Retrieval Parameters
# INITIAL_RETRIEVAL_K = 10  # Increased for better hybrid recall
# FINAL_RERANK_N = 5
# CHAT_HISTORY_LIMIT = 5
# # Weights are now used on *normalized* scores
# HYBRID_KEYWORD_WEIGHT = 0.5
# HYBRID_VECTOR_WEIGHT = 0.5
# SCORE_THRESHOLD = 0.05  # Lowered score threshold to allow more hits for hybrid search
# RERANKER_DEVICE = os.getenv("RERANKER_DEVICE", "cpu") # Added flexibility

# # ==================== GLOBAL CLIENTS ====================
# qdrant_client: Optional[QdrantClient] = None
# embed_model = None
# llm_client: Optional[AsyncOpenAI] = None
# reranker: Optional[SentenceTransformerRerank] = None
# # BM25 Globals for in-memory index
# bm25_corpus: List[str] = []
# bm25_index: Optional[BM25Okapi] = None
# bm25_metadata: List[Dict[str, Any]] = []

# # ==================== SCHEMAS ====================
# class QueryInput(BaseModel):
#     query: str
#     session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
#     top_k: int = 5


# class SearchResultHelper(BaseModel):
#     score: float
#     source_file: str
#     content_type: str
#     text_snippet: str
#     chunk_id: int


# class RetrievalResponse(BaseModel):
#     query: str
#     context_chunks: List[SearchResultHelper]


# class RAGResponseHelper(BaseModel):
#     query: str
#     answer: str
#     sources: List[str]
#     session_id: str


# class HealthCheck(BaseModel):
#     status: str
#     database: str
#     vector_store: str


# # ==================== UTILITY FUNCTIONS ====================
# def min_max_normalize(scores: List[float]) -> List[float]:
#     """Applies Min-Max normalization to a list of scores."""
#     if not scores:
#         return []
#     np_scores = np.array(scores, dtype=np.float32)
#     min_val = np.min(np_scores)
#     max_val = np.max(np_scores)
    
#     # Handle the case where all scores are the same (division by zero)
#     if max_val == min_val:
#         return [1.0] * len(scores)
    
#     return ((np_scores - min_val) / (max_val - min_val)).tolist()


# # ==================== INITIALIZATION ====================
# async def initialize_clients():
#     """Initialize qdrant, embedding model, reranker and LLM client."""
#     global qdrant_client, embed_model, reranker, llm_client, bm25_corpus, bm25_index, bm25_metadata
#     print("\n--- Initializing RAG Services ---")
#     await create_db_and_tables()

#     # Qdrant client
#     try:
#         qdrant_client = QdrantClient(
#             url=os.getenv("QDRANT_HOST"),
#             api_key=os.getenv("QDRANT_API_KEY"),
#             port=int(os.getenv("QDRANT_PORT", 6333)),
#         )
#         qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
#         print(f"✅ Qdrant connected: {QDRANT_COLLECTION_NAME}")
#     except Exception as e:
#         print(f"❌ Qdrant connection failed: {e}")
#         qdrant_client = None

#     # Embedding model
#     try:
#         embed_model = resolve_embed_model(f"local:{EMBED_MODEL_NAME}")
#         print(f"✅ Embedding model loaded: {EMBED_MODEL_NAME}")
#     except Exception as e:
#         print(f"❌ Embedding model load failed: {e}")
#         embed_model = None

#     # LLM client
#     if LLM_API_KEY:
#         try:
#             llm_client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=LLM_API_KEY)
#             llm_client.extra_headers = {
#                 "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8000"),
#                 "X-Title": "Hybrid Qdrant RAG",
#             }
#             print(f"✅ LLM client initialized: {LLM_MODEL_NAME}")
#         except Exception as e:
#             print(f"❌ LLM client init failed: {e}")
#             llm_client = None
#     else:
#         print("❌ OPENROUTER_API_KEY not found.")
#         llm_client = None

#     # Reranker
#     try:
#         # Use RERANKER_DEVICE for flexibility (e.g., 'cuda' or 'cpu')
#         reranker = SentenceTransformerRerank(
#             model=RERANKER_MODEL_NAME, top_n=FINAL_RERANK_N, device=RERANKER_DEVICE
#         )
#         print(f"✅ Reranker initialized: {RERANKER_MODEL_NAME} (Device: {RERANKER_DEVICE})")
#     except Exception as e:
#         print(f"⚠️ Reranker init failed: {e} (continuing without reranker)")
#         reranker = None

#     # BM25 Index Initialization (load corpus from Qdrant payloads)
#     try:
#         print("⏳ Building BM25 index from Qdrant payloads...")
#         scroll_resp = qdrant_client.scroll(
#             collection_name=QDRANT_COLLECTION_NAME,
#             with_payload=True,
#             with_vectors=False,
#             limit=10000, # Increased limit for more comprehensive index
#         )
#         points = scroll_resp[0] if isinstance(scroll_resp, (list, tuple)) else scroll_resp
#         bm25_corpus = []
#         bm25_metadata = []

#         for p in points:
#             payload = getattr(p, "payload", {}) or {}
#             text = payload.get("raw_text_content") or payload.get("text") or ""
#             if not text:
#                 continue
#             # Store the text chunk and its associated metadata
#             bm25_corpus.append(text)
#             bm25_metadata.append({
#                 "source_file": payload.get("source_file", "unknown"),
#                 "chunk_id": payload.get("chunk_id", 0),
#                 "type": payload.get("type", "text_chunk"),
#             })

#         tokenized_corpus = [word_tokenize(doc.lower()) for doc in bm25_corpus]
#         bm25_index = BM25Okapi(tokenized_corpus)
#         print(f"✅ BM25 index built successfully with {len(bm25_corpus)} documents.")
#     except Exception as e:
#         print(f"⚠️ BM25 index initialization failed: {e}")
#         bm25_index = None


# @asynccontextmanager
# async def lifespan(app: FastAPI):
#     await initialize_clients()
#     yield
#     print("Shutting down RAG services...")


# app = FastAPI(
#     title="Hybrid School RAG API",
#     version="2.0.2",
#     description="Hybrid (Vector + BM25) RAG API using Qdrant, BM25, and Llama-3",
#     lifespan=lifespan,
# )

# # ==================== CORE RETRIEVAL LOGIC ====================
# async def search_index_core(query: str, limit: int) -> List[SearchResultHelper]:
#     """Performs vector-based retrieval via Qdrant."""
#     if not qdrant_client or not embed_model:
#         raise Exception("Service not ready. Qdrant or embedding model not initialized.")

#     try:
#         query_vector = embed_model.get_query_embedding(query)
#     except Exception:
#         query_vector = (
#             embed_model.embed_query(query) if hasattr(embed_model, "embed_query") else None
#         )
#     if query_vector is None:
#         raise Exception("Failed to create query embedding.")

#     search_result = qdrant_client.search(
#         collection_name=QDRANT_COLLECTION_NAME,
#         query_vector=query_vector,
#         limit=limit,
#         with_payload=True,
#         score_threshold=SCORE_THRESHOLD,
#     )

#     results: List[SearchResultHelper] = []
#     for hit in search_result:
#         payload = getattr(hit, "payload", {}) or {}
#         full_text = payload.get("raw_text_content") or payload.get("text") or ""
#         # Qdrant score is typically cosine similarity (0 to 1)
#         results.append(
#             SearchResultHelper(
#                 score=getattr(hit, "score", 0.0),
#                 source_file=payload.get("source_file", "unknown"),
#                 content_type=payload.get("type", "text_chunk"),
#                 text_snippet=full_text,
#                 chunk_id=payload.get("chunk_id", 0),
#             )
#         )
#     return results


# async def bm25_search_core(query: str, limit: int) -> List[SearchResultHelper]:
#     """BM25 keyword-based retrieval."""
#     global bm25_index, bm25_corpus, bm25_metadata
#     if not bm25_index or not bm25_corpus:
#         # Return empty list if index isn't ready, don't raise an exception
#         print("⚠️ BM25 index not initialized, skipping keyword search.")
#         return []

#     tokenized_query = word_tokenize(query.lower())
#     scores = bm25_index.get_scores(tokenized_query)

#     # Sort and rank based on BM25 score
#     ranked = sorted(
#         enumerate(scores), key=lambda x: x[1], reverse=True
#     )[:limit]

#     results = []
#     for idx, score in ranked:
#         meta = bm25_metadata[idx]
#         # BM25 scores can be large and non-normalized
#         results.append(
#             SearchResultHelper(
#                 score=float(score),
#                 source_file=meta["source_file"],
#                 content_type=meta["type"],
#                 text_snippet=bm25_corpus[idx],
#                 chunk_id=meta["chunk_id"],
#             )
#         )
#     return results


# async def hybrid_retrieve_and_rerank_chunks(query: str, initial_k: int = INITIAL_RETRIEVAL_K) -> Tuple[List[SearchResultHelper], Set[str]]:
#     """Hybrid search: combines vector + BM25 results, optionally reranks."""
#     vector_results = await search_index_core(query, initial_k)
#     bm25_results = await bm25_search_core(query, initial_k)

#     # 1. Prepare for Combination
#     combined: Dict[str, SearchResultHelper] = {}
    
#     # Extract scores for normalization
#     vector_scores = [r.score for r in vector_results]
#     bm25_scores = [r.score for r in bm25_results]
    
#     # Normalize scores
#     normalized_vector_scores = min_max_normalize(vector_scores)
#     normalized_bm25_scores = min_max_normalize(bm25_scores)
    
#     # Map normalized scores back to results
#     for i, res in enumerate(vector_results):
#         key = f"{res.source_file}-{res.chunk_id}"
#         # Use the normalized vector score as the base
#         res.score = normalized_vector_scores[i]
#         combined[key] = res

#     # 2. Combine and Re-score
#     for i, bm in enumerate(bm25_results):
#         key = f"{bm.source_file}-{bm.chunk_id}"
#         normalized_bm25_score = normalized_bm25_scores[i]

#         if key in combined:
#             # Apply hybrid weights to normalized scores
#             combined[key].score = (
#                 combined[key].score * HYBRID_VECTOR_WEIGHT + normalized_bm25_score * HYBRID_KEYWORD_WEIGHT
#             )
#         else:
#             bm.score = normalized_bm25_score * HYBRID_KEYWORD_WEIGHT
#             combined[key] = bm

#     # 3. Sort by combined normalized score
#     merged_results = sorted(
#         combined.values(), key=lambda r: r.score, reverse=True
#     )

#     # 4. Rerank (if available)
#     source_set: Set[str] = set()
#     results_to_process = merged_results[:INITIAL_RETRIEVAL_K] # Use top K for Reranker

#     if reranker:
#         nodes_to_rerank = [
#             NodeWithScore(
#                 node=TextNode(
#                     text=r.text_snippet,
#                     metadata={"source_file": r.source_file, "chunk_id": r.chunk_id},
#                 ),
#                 # Note: Reranker ignores this initial score but we include it for completeness
#                 score=r.score,
#             )
#             for r in results_to_process
#         ]
#         try:
#             reranked_nodes = reranker.postprocess_nodes(nodes_to_rerank, query_str=query)
#             reranked_results: List[SearchResultHelper] = []
#             for node_with_score in reranked_nodes:
#                 node = node_with_score.node
#                 meta = node.metadata or {}
#                 text = node.text or ""
#                 reranked_results.append(
#                     SearchResultHelper(
#                         score=node_with_score.score,
#                         source_file=meta.get("source_file", "unknown"),
#                         content_type="text_chunk",
#                         text_snippet=text.strip(),
#                         chunk_id=meta.get("chunk_id", 0),
#                     )
#                 )
#                 source_set.add(f"{meta.get('source_file', 'unknown')} (Chunk {meta.get('chunk_id', 0)})")
            
#             # The reranker output is already limited to FINAL_RERANK_N
#             return reranked_results, source_set
#         except Exception as e:
#             print(f"⚠️ Reranker failed: {e}. Falling back to combined sort.")
#             # Fallback to the merged results, limited by FINAL_RERANK_N
#             for r in merged_results[:FINAL_RERANK_N]:
#                 source_set.add(f"{r.source_file} (Chunk {r.chunk_id})")
#             return merged_results[:FINAL_RERANK_N], source_set
#     else:
#         for r in merged_results[:FINAL_RERANK_N]:
#             source_set.add(f"{r.source_file} (Chunk {r.chunk_id})")
#         return merged_results[:FINAL_RERANK_N], source_set


# # ==================== CORE RAG GENERATION ====================
# async def generate_rag_response(query: str, session_id: str, use_retrieval_k: int = INITIAL_RETRIEVAL_K) -> RAGResponseHelper:
#     """Main orchestration: retrieve first, then call LLM."""
#     if not all([qdrant_client, embed_model, llm_client]):
#         raise Exception("Service not fully initialized.")

#     history_records = await get_chat_history(session_id, CHAT_HISTORY_LIMIT)
#     history_str = "\n".join(
#         [f"**Turn {i+1}** (User: {h['user_query']})\n(Assistant: {h['llm_response']})" for i, h in enumerate(history_records)]
#     )

#     try:
#         context_chunks, source_set = await hybrid_retrieve_and_rerank_chunks(query, initial_k=use_retrieval_k)
#     except Exception as e:
#         print(f"⚠️ Retrieval failed: {e}")
#         context_chunks, source_set = ([], set())

#     context_str = "\n---\n".join([chunk.text_snippet for chunk in context_chunks])

#     if not context_str and not history_records:
#         return RAGResponseHelper(query=query, answer="No relevant information found. Please try a different query.", sources=[], session_id=session_id)

#     RAG_PROMPT = f"""
#     You are an expert Q&A assistant for Indian educational content.

#     **CRITICAL INSTRUCTIONS:**
#     1. Use CONTEXT if available to answer the QUESTION.
#     2. If CONTEXT is empty, use CHAT HISTORY to maintain conversation flow.
#     3. If asked to "explain briefly" or a follow-up question is asked, base it on prior chat context.
#     4. Be friendly, concise, and professional.
#     5. NEVER mention the CONTEXT, CHAT HISTORY, or the source files in the final answer.

# --- CHAT HISTORY (for contextual follow-up) ---
# {history_str or "No history"}

# --- CONTEXT (for grounding the answer) ---
# {context_str or "CONTEXT IS EMPTY"}

# --- QUESTION ---
# {query}
# """

#     try:
#         response = await llm_client.chat.completions.create(
#             model=LLM_MODEL_NAME,
#             messages=[{"role": "user", "content": RAG_PROMPT}],
#             temperature=0.1,
#         )
#         answer = response.choices[0].message.content.strip()
#         # Clean up common LLM formatting issues
#         answer = re.sub(r'\\n', ' ', answer)
#         answer = re.sub(r'\s+', ' ', answer).strip()

#         await save_chat_entry(session_id, query, answer, list(source_set), [c.text_snippet for c in context_chunks])

#         return RAGResponseHelper(query=query, answer=answer, sources=list(source_set), session_id=session_id)

#     except Exception as e:
#         raise Exception(f"LLM generation failed: {e}")


# # ==================== API ENDPOINTS ====================
# @app.get("/health", response_model=HealthCheck, tags=["System"])
# async def check_health():
#     db_status = "OK"
#     qdrant_status = "OK"
#     try:
#         # Test DB
#         await get_chat_history("health_test", 1)
#     except Exception:
#         db_status = "FAIL"
#     try:
#         # Test Qdrant
#         if qdrant_client:
#             qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
#         else:
#             qdrant_status = "FAIL"
#     except Exception:
#         qdrant_status = "FAIL"
    
#     overall = "OK" if db_status == "OK" and qdrant_status == "OK" else "DEGRADED"
#     return HealthCheck(status=overall, database=db_status, vector_store=qdrant_status)


# @app.post("/retrieve", response_model=RetrievalResponse, tags=["RAG"])
# async def retrieve_chunks_for_query(request: QueryInput):
#     """Retrieves and reranks source chunks using hybrid search."""
#     if not embed_model:
#         raise HTTPException(status_code=503, detail="Embedding model not initialized.")
#     try:
#         context_chunks, _ = await hybrid_retrieve_and_rerank_chunks(request.query)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"Retrieval error: {e}")

#     return RetrievalResponse(query=request.query, context_chunks=context_chunks[:request.top_k])


# @app.post("/chat", response_model=RAGResponseHelper, tags=["RAG"])
# async def rag_query_endpoint(request: QueryInput):
#     """Main RAG endpoint for conversational query and response."""
#     try:
#         return await generate_rag_response(request.query, request.session_id)
#     except Exception as e:
#         raise HTTPException(status_code=500, detail=f"LLM generation failed: {e}")


# if __name__ == "__main__":
#     import uvicorn
#     uvicorn.run("rag_core:app", host="0.0.0.0", port=8000, reload=True)


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

# Fallback import for ingestion
try:
    from pipeline_service import full_pdf_ingestion_pipeline
except ImportError:
    logging.warning("Could not import pipeline_service. PDF ingestion will be disabled.")
    full_pdf_ingestion_pipeline = None

# Qdrant + Embedding + Reranker + LLM imports
from qdrant_client import QdrantClient, models as qmodels
from llama_index.core.embeddings import resolve_embed_model
from llama_index.core import Settings
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.schema import NodeWithScore, TextNode
from openai import AsyncOpenAI 

# BM25 Imports
from rank_bm25 import BM25Okapi
from nltk.tokenize import word_tokenize
import nltk
try:
    nltk.data.find('tokenizers/punkt')
except nltk.downloader.DownloadError:
    nltk.download("punkt", quiet=True)

# Set up logging
logging.basicConfig(level=logging.INFO)

# ==================== CONFIGURATION ====================
load_dotenv()

QDRANT_COLLECTION_NAME = "ncert_multidoc_index9"
# CONFIGURATION FOR SEMANTIC CACHE
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

# ==================== SEMANTIC CACHE WRAPPER (TTL REMOVED) ====================
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
        if not self.q_client or not self.embed_model: return 
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
# ==================== END SEMANTIC CACHE WRAPPER ====================


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
    """
    Expands ambiguous follow-up queries using previous conversation context.
    
    MODIFIED: Uses safer regex patterns.
    """
    follow_up_patterns = [
        r'\b(that|this|it|those|these)\b', # Direct Pronouns/Referential
        r'\b(tell me more|more details|simplify|expand)\b', # Strong Conversational Cues
        r'\b(what about|regarding|concerning)\b(?!\s+)', # Conversational Framing
        r'^(how|why|can you)\b.*\b(that|it)\b', # Conditional/Referential Questions
        r'^(yes|okay|alright)' # Affirmative Follow-ups
    ]
    
    query_lower = query.lower()
    is_likely_followup = any(re.search(pattern, query_lower) for pattern in follow_up_patterns)
    
    # Check if expansion is necessary
    if is_likely_followup and history_records:
        try:
            # Get the previous user query's topic (first 80 characters)
            last_user_query = history_records[-1].get('user_query', 'previous discussion')
            context_topic = last_user_query[:80]
            
            # Construct the expanded query
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
        turn = (f"Turn {i} {marker}\n" f"  👤 User: {record.get('user_query', '')}\n" f"  🤖 Assistant: {response}")
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
    """
    Conceptual function to check cache size and alert if eviction is missed.
    This runs every RAG query.
    """
    if clients.get('qdrant'):
        try:
            count_result = clients['qdrant'].count(collection_name=QDRANT_CACHE_COLLECTION, exact=True)
            current_size = count_result.count
            
            if current_size > MAX_CACHE_CAPACITY:
                logging.warning(f"CACHE EVICTION ALERT: Size is {current_size}, exceeding max capacity {MAX_CACHE_CAPACITY}. LFU/LRU sweep is required!")
            else:
                logging.debug(f"Cache size is healthy: {current_size} points.")
                
        except Exception as e:
            logging.error(f"Failed to check cache eviction status: {e}")

# ==================== END UTILITY FUNCTIONS ====================


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
    """
    Initializes clients and assigns them to module-level globals.
    
    TTL REMOVED: Cache collection setup no longer creates or references the expiry_timestamp index.
    """
    global qdrant_client, embed_model, reranker, llm_client, semantic_cache
    
    print("\n--- Initializing RAG Services ---")
    
    # 1. Embedding Model
    try:
        embed_model = resolve_embed_model(f"local:{EMBED_MODEL_NAME}")
        Settings.embed_model = embed_model
        print(f"✅ Embedding model loaded: {EMBED_MODEL_NAME}")
    except Exception as e:
        print(f"❌ Embedding model load failed: {e}")
        embed_model = None
        
    # 2. Qdrant client
    try:
        qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_HOST"), api_key=os.getenv("QDRANT_API_KEY"), port=int(os.getenv("QDRANT_PORT", 6333)),
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
                
                # Create the payload indices for LFU/LRU tracking (TTL index removed)
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
            llm_client.extra_headers = {"HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8000"), "X-Title": "Hybrid Qdrant RAG"}
            print(f"✅ LLM client initialized: {LLM_MODEL_NAME}")
        except Exception as e: print(f"❌ LLM client init failed: {e}"); llm_client = None
    else: print("❌ OPENROUTER_API_KEY not found."); llm_client = None

    # 4. Initialize Semantic Cache Wrapper
    if qdrant_client and embed_model:
        semantic_cache = SemanticCacheWrapper(q_client=qdrant_client, embed_model=embed_model, collection_name=QDRANT_CACHE_COLLECTION, threshold=SEMANTIC_CACHE_THRESHOLD)
        print("✅ Semantic Cache Wrapper initialized.")
    else: print("❌ Semantic Cache disabled due to missing Qdrant/Embedding client.")

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
    """
    Initializes all RAG components. Clears cache to rebuild BM25 index if ingestion_done flag is set.
    """
    # 1. Reruns based on ingestion_done flag
    if st.session_state.get('ingestion_done', False):
        print("\n--- CACHE CLEAR TRIGGERED ---")
        setup_rag_services.clear() 
        st.session_state.ingestion_done = False # Reset the flag
    
    async def run_initialization():
        # Await DB setup and client initialization
        await create_db_and_tables() 
        return await initialize_clients()
        
    print("Starting synchronous RAG service setup...")
    try:
        # --- START: WINDOWS EVENT LOOP FIX APPLIED HERE ---
        if sys.platform == "win32":
            loop = asyncio.SelectorEventLoop()
            asyncio.set_event_loop(loop)
        else:
            loop = asyncio.get_event_loop()
        # --- END: WINDOWS EVENT LOOP FIX APPLIED HERE ---
        
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        
    clients = loop.run_until_complete(run_initialization())
    
    # 2. Build BM25 Index using the initialized Qdrant client
    if clients.get('qdrant'):
        build_bm25_index(clients['qdrant']) 
    
    print("RAG service setup complete.")
    
    return clients


# ==================== CORE RETRIEVAL LOGIC (MODIFIED TO ACCEPT CLIENTS) ====================
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
    
    # 1. Retrieve using explicit clients
    vector_results = await search_index_core(clients['qdrant'], clients['embed'], query, initial_k)
    bm25_results = await bm25_search_core(clients['bm25_index'], clients['bm25_metadata'], clients['bm25_corpus'], query, initial_k)

    # 2. Prepare for Combination
    combined: Dict[str, SearchResultHelper] = {}; vector_scores = [r.score for r in vector_results]; bm25_scores = [r.score for r in bm25_results]
    normalized_vector_scores = min_max_normalize(vector_scores); normalized_bm25_scores = min_max_normalize(bm25_scores)
    for i, res in enumerate(vector_results):
        key = f"{res.source_file}-{res.chunk_id}"; res.score = normalized_vector_scores[i]; combined[key] = res
    for i, bm in enumerate(bm25_results):
        key = f"{bm.source_file}-{bm.chunk_id}"; normalized_bm25_score = normalized_bm25_scores[i]
        if key in combined: combined[key].score = (combined[key].score * HYBRID_VECTOR_WEIGHT + normalized_bm25_score * HYBRID_KEYWORD_WEIGHT)
        else: bm.score = normalized_bm25_score * HYBRID_KEYWORD_WEIGHT; combined[key] = bm
    merged_results = sorted(combined.values(), key=lambda r: r.score, reverse=True)

    # 3. Rerank using explicit clients
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


# ==================== CORE RAG GENERATION (MODIFIED FOR HYBRID CACHING) ====================
async def generate_rag_response(clients: Dict[str, Any], query: str, session_id: str, use_retrieval_k: int = INITIAL_RETRIEVAL_K) -> RAGResponseHelper:
    
    # 1. Check if all required clients were passed and exist
    required_keys = ['llm', 'cache']
    if not all(clients.get(k) is not None for k in required_keys):
        raise Exception("Service not fully initialized or Semantic Cache is disabled. Check LLM/Cache clients.")

    # 1.5 LOG EVICTION STATUS (Conceptual check)
    await log_cache_eviction_status(clients)

    # 2. PRIMARY CACHE CHECK: Check the cache using the RAW, unexpanded query (for semantic similarity/repetition)
    cached_answer_raw = await clients['cache'].check_cache(query) 
    if cached_answer_raw:
        logging.info(f"✅ CACHE HIT on RAW query: {query}")
        await save_chat_entry(session_id, query, cached_answer_raw, ["[Semantic Cache]"], [])
        return RAGResponseHelper(query=query, answer=cached_answer_raw, sources=["[Semantic Cache]"], session_id=session_id, cache_status="HIT")
    
    # 3. EXPAND QUERY
    history_records = await get_chat_history(session_id, CHAT_HISTORY_LIMIT)
    expanded_query = await expand_query_with_context(query, history_records)
    
    # 4. SECONDARY CACHE CHECK (Only needed if expansion occurred)
    if expanded_query != query:
        cached_answer_expanded = await clients['cache'].check_cache(expanded_query) 
        if cached_answer_expanded:
            logging.info(f"✅ CACHE HIT on EXPANDED query: {expanded_query}")
            await save_chat_entry(session_id, query, cached_answer_expanded, ["[Semantic Cache]"], [])
            return RAGResponseHelper(query=query, answer=cached_answer_expanded, sources=["[Semantic Cache]"], session_id=session_id, cache_status="HIT")


    # --- RAG Execution continues if both cache checks fail ---

    history_str = format_chat_history(history_records)

    try:
        # Use the expanded_query for retrieval (critical for contextual searches)
        context_chunks, source_set = await hybrid_retrieve_and_rerank_chunks(clients, expanded_query, initial_k=use_retrieval_k)
    except Exception as e:
        print(f"⚠️ Retrieval failed: {e}")
        context_chunks, source_set = ([], set())

    context_str = "\n---\n".join([chunk.text_snippet for chunk in context_chunks])

    if not context_str and not history_records:
        return RAGResponseHelper(query=query, answer="No relevant information found. Please try a different query.", sources=[], session_id=session_id, cache_status="MISS")
    
    # *** RAG PROMPT MODIFICATION: ALLOWING TABLES ***
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
3. **Prioritize the most relevant information and rephrase it in your own words. Do NOT directly copy text chunks that contain formatting markers (like ###, ##, or multiple dashes) from the context.**
4. If asked to elaborate/explain more: add depth and examples
5. If asked for clarification: rephrase in a different way
6. Be friendly, concise, and educational
7. Use examples when helpful
8. Keep technical jargon minimal
9. Crucially, if the CURRENT CONTEXT contains the description of a chemical reaction (e.g., reactants and products in words) but the symbolic equation is missing or only partially extracted, you MUST use your internal chemistry knowledge of the subject matter to reconstruct and generate the correct, balanced symbolic equation as part of your answer, if relevant to the user's question.
10. **FORMATTING RULE: Wrap all mathematical and chemical equations in double dollar signs ($$). For example, output $$2H_2 + O_2 \rightarrow 2H_2O$$ for chemical equations and $$E=mc^2$$ for physics. This ensures proper display.**

**ABSOLUTELY DO NOT:**
- Mention the CONTEXT source or format (This prevents "NCERT style," "in NCERT textbooks," etc., from appearing in the output.)
- Reveal the CONVERSATION HISTORY structure
- Make up information not in context or history
- Provide incomplete or vague answers
- Repeat previous answers without adding value
- **Use Markdown headings (e.g., #, ##, ###) for structuring the answer. Instead, use bolding, lists, and horizontal rules for separation.**
- Summarize the answers at last of response unless user asks for it.

--- CONVERSATION HISTORY ---
{history_str}

--- CURRENT CONTEXT (factual reference material) ---
{context_str or "No specific context retrieved."}

--- USER QUESTION ---
{query}

--- YOUR RESPONSE ---
Answer the question directly and naturally. Use standard **Markdown tables** if only necessary to present clear comparative data (like element counts), as the display system is configured to render them.
"""
    try:
        response = await clients['llm'].chat.completions.create( 
            model=LLM_MODEL_NAME, messages=[{"role": "user", "content": RAG_PROMPT}], temperature=0.1, 
        )
        answer = response.choices[0].message.content.strip()   
        answer = re.sub(r'\\n', '\n', answer); 
        answer = re.sub(r'^-+\|(-+\|)+-+\s*$', '', answer, flags=re.MULTILINE).strip()


        # --- HYBRID CACHE WRITE STRATEGY ---
        cache_key = query if expanded_query == query else expanded_query
        clients['cache'].save_cache(cache_key, answer) 
        
        # Save to database (chat history)
        await save_chat_entry(session_id, query, answer, list(source_set), [c.text_snippet for c in context_chunks])

        return RAGResponseHelper(query=query, answer=answer, sources=list(source_set), session_id=session_id, cache_status="MISS")

    except Exception as e:
        raise Exception(f"LLM generation failed: {e}")


# ==================== NEW RENDERING UTILITY (Table Detection and st.table rendering) ====================
def parse_markdown_table(text: str) -> Optional[Tuple[str, List[str], List[List[str]]]]:
    """
    Detects and parses the first standard Markdown table in a block of text.
    Returns (full_table_text, headers, rows) or None if no table is found.
    """
    lines = text.strip().split('\n')
    
    # Check for the separator line (---)
    separator_line_index = -1
    for i, line in enumerate(lines):
        if re.match(r'^\s*\|?[-:]+\s*\|?([-:\|\s]*)$', line.strip()):
            separator_line_index = i
            break
            
    if separator_line_index < 1:
        return None
        
    header_line = lines[separator_line_index - 1].strip()
    
    # Function to clean and parse a table row
    def parse_row(row_text):
        # Remove leading/trailing pipes and trim whitespace from cells
        cells = [cell.strip() for cell in row_text.strip().strip('|').split('|')]
        # Filter out empty cells that might result from double piping or malformed rows
        return [cell for cell in cells if cell]

    # Parse headers
    headers = parse_row(header_line)
    if not headers:
        return None

    # Find the extent of the table data
    data_rows = []
    current_table_lines = [header_line, lines[separator_line_index]]
    
    # Process lines after the separator
    for line in lines[separator_line_index + 1:]:
        parsed_row = parse_row(line)
        # Check if the parsed row has the correct number of columns
        if len(parsed_row) == len(headers):
            data_rows.append(parsed_row)
            current_table_lines.append(line)
        else:
            break

    if not data_rows:
        return None
        
    full_table_text = '\n'.join(current_table_lines)
    return full_table_text, headers, data_rows


def render_llm_response(raw_text: str):
    """
    Renders the LLM response, prioritizing table detection, then LaTeX, then markdown.
    
    Uses st.table for rendering detected tables (list of lists).
    """
    
    # 1. TABLE DETECTION
    table_result = parse_markdown_table(raw_text)
    
    if table_result:
        full_table_text, headers, data_rows = table_result
        
        # Split text around the first occurrence of the table
        parts = re.split(re.escape(full_table_text), raw_text, 1)
        pre_table_text = parts[0] if len(parts) > 0 else ""
        post_table_text = parts[1] if len(parts) > 1 else ""

        # Render pre-table text recursively
        if pre_table_text.strip():
            render_llm_response(pre_table_text.strip())
            
        # Render the table as a Streamlit Table
        if data_rows:
            # Prepare data for st.table (list of lists, including header)
            table_data = [headers] + data_rows
            
            try:
                # Use st.table as requested
                st.table(table_data) 
            except Exception as e:
                # Fallback to markdown if st.table fails
                st.markdown(full_table_text, unsafe_allow_html=False)
                logging.warning(f"Failed to render table using st.table: {e}. Falling back to markdown.")

        # Render post-table text recursively
        if post_table_text.strip():
            render_llm_response(post_table_text.strip())
            
        return

    # Pattern to find content wrapped in $$ 
    parts = re.split(r'(\$\$.*?\$\$)', raw_text, flags=re.DOTALL)
    
    for part in parts:
        if part.startswith('$$') and part.endswith('$$'):
            # This is a LaTeX string. Remove the $$ delimiters.
            latex_content = part.strip('$').strip()
            st.latex(latex_content)
        elif part:
            st.markdown(part, unsafe_allow_html=False)

# ==================== END NEW RENDERING UTILITY ====================


# ==================== STREAMLIT UI IMPLEMENTATION ====================

# Initialize Session State (Must be done first to support caching logic)
if "session_id" not in st.session_state: st.session_state["session_id"] = str(uuid.uuid4())
if "chat_history" not in st.session_state: st.session_state["chat_history"] = []
if "show_debug" not in st.session_state: st.session_state["show_debug"] = False
if "ingestion_done" not in st.session_state: st.session_state["ingestion_done"] = False

# Initialize RAG Services and get components
rag_clients = setup_rag_services()
bm25_corpus = rag_clients['bm25_corpus'] 

# --- UI Layout ---
st.set_page_config(page_title="Hybrid RAG Chatbot", layout="wide")

st.title("📚 Hybrid RAG Chatbot")
st.caption(f"Session ID: {st.session_state.session_id}")

# Sidebar for controls
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
        
    # --- PDF Upload Section ---
    st.header("⬆️ Ingest PDF")
    uploaded_file = st.file_uploader(
        "Upload PDF for indexing", type="pdf", key="pdf_uploader"
    )
    
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
                    
                    # --- CRITICAL RERUN LOGIC ---
                    st.session_state.ingestion_done = True # Set the flag
                    st.info("Re-running app to rebuild BM25 index...")
                    st.rerun() # Force restart
                    
                except Exception as e:
                    st.error(f"Ingestion failed: {e}")
                    logging.error(f"PDF pipeline failed for {filename}: {e}")
    elif uploaded_file and not full_pdf_ingestion_pipeline:
        st.warning("Ingestion pipeline is disabled. Check `pipeline_service.py` import.")


# Main Chat Area
for message in st.session_state.chat_history:
    with st.chat_message(message["role"]):
        if message["role"] == "assistant":
            render_llm_response(message["content"])
        else:
            # Use standard markdown for the user's query
            st.markdown(message["content"])
            
        if message.get("sources"):
            with st.expander("Sources & Cache Status"):
                st.markdown(f"**Status:** {message['cache_status']}")
                st.markdown("**Context Sources:**")
                st.code('\n'.join(message["sources"]))

def handle_user_input(prompt):
    """Processes the user query and updates chat history."""
    if not prompt: return

    st.session_state.chat_history.append({"role": "user", "content": prompt})
    
    with st.spinner("Thinking... Retrieving context and generating response..."):
        try:
            response_helper = asyncio.run(
                generate_rag_response(rag_clients, prompt, st.session_state.session_id)
            )
            
            st.session_state.chat_history.append({
                "role": "assistant", "content": response_helper.answer,
                "sources": response_helper.sources, "cache_status": response_helper.cache_status
            })
            
        except Exception as e:
            error_message = f"An error occurred: {e}"
            st.session_state.chat_history.append({
                "role": "assistant", "content": error_message, "sources": [], "cache_status": "ERROR"
            })
    
    st.rerun() 

# The main chat input area
prompt = st.chat_input("Ask a question about the NCERT documents...")
if prompt:
    handle_user_input(prompt)


# --- Debugging and Retrieval Panel ---
st.divider()
st.toggle("Show Debug & Retrieval Panel", value=st.session_state.show_debug, key="show_debug") 

if st.session_state.show_debug:
    st.header("🛠️ Debug and Retrieval Tools")
    
    # 1. Retrieval Tester 
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
                    
                    #keep st.dataframe here for the debug panel as it is a standard and robust view for tabular data
                    st.dataframe(chunk_data, use_container_width=True) 
                    st.caption("Expand 'Full Content' in the table to see entire chunk text.")
                    
                except Exception as e:
                    st.error(f"Retrieval Test Failed: {e}")

    # 2. Session Summary 
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