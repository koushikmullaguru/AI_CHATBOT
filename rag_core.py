import os
import uuid
import asyncio
from typing import List, Optional, Set, Dict, Any, Tuple
from dotenv import load_dotenv
from contextlib import asynccontextmanager
import re

# FastAPI Imports
from fastapi import FastAPI, status, HTTPException
from pydantic import BaseModel, Field

# Core Imports
from db import create_db_and_tables, save_chat_entry, get_chat_history 
from openai import AsyncOpenAI
from qdrant_client import QdrantClient
from llama_index.core.embeddings import resolve_embed_model
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.schema import NodeWithScore, TextNode

# ==================== CONFIGURATION & CLIENTS ====================
load_dotenv()

QDRANT_COLLECTION_NAME = "ncert_multidoc_index5"

EMBED_MODEL_NAME = "BAAI/bge-m3" 
RERANKER_MODEL_NAME = "BAAI/bge-reranker-v2-m3" 

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_API_KEY = os.getenv("OPENROUTER_API_KEY")
LLM_MODEL_NAME = "meta-llama/llama-3.3-8b-instruct:free" 

INITIAL_RETRIEVAL_K = 5
FINAL_RERANK_N = 5
CHAT_HISTORY_LIMIT = 5

# GLOBAL CLIENTS
qdrant_client: Optional[QdrantClient] = None
embed_model = None
llm_client: Optional[AsyncOpenAI] = None
reranker: Optional[SentenceTransformerRerank] = None

# ==================== HELPER SCHEMAS (API) ====================

# Input Model for all Query Endpoints
class QueryInput(BaseModel):
    query: str = Field(..., description="The user's question or prompt.")
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()), description="Unique ID for conversation history.")
    top_k: int = 5

# Output Model for Retrieval Only (/retrieve)
class SearchResultHelper(BaseModel):
    score: float
    source_file: str
    content_type: str
    text_snippet: str
    chunk_id: int

class RetrievalResponse(BaseModel):
    query: str
    context_chunks: List[SearchResultHelper] = Field(..., description="Top K relevant chunks retrieved and reranked.")

# Output Model for Full RAG (/chat)
class RAGResponseHelper(BaseModel):
    query: str
    answer: str
    sources: List[str]
    session_id: str 
    
# Health Check Model
class HealthCheck(BaseModel):
    status: str
    database: str
    vector_store: str


# ==================== CORE CLIENT INITIALIZATION & LIFESPAN ====================

async def initialize_clients():
    """Initializes clients, models, and database."""
    global qdrant_client, embed_model, reranker, llm_client

    print("\n--- Initializing RAG Services ---")
    await create_db_and_tables() 

    # 1. Initialize Qdrant Client
    try:
        qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_HOST"), api_key=os.getenv("QDRANT_API_KEY"), port=int(os.getenv("QDRANT_PORT", 6333)),
        )
        qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
        print(f"✅ Qdrant client connected: {QDRANT_COLLECTION_NAME}")
    except Exception as e:
        print(f"❌ FATAL: Could not connect to Qdrant: {e}")
        qdrant_client = None

    # 2. Initialize Embedding Model (BGE-M3)
    try:
        embed_model = resolve_embed_model(f"local:{EMBED_MODEL_NAME}") 
        print(f"✅ Embedding model loaded: {EMBED_MODEL_NAME}")
    except Exception as e:
        print(f"❌ FATAL: Could not load embedding model: {e}")
        embed_model = None
        
    # 3. Initialize Async LLM Client (OpenRouter/Mistral)
    if LLM_API_KEY:
        llm_client = AsyncOpenAI(base_url=OPENROUTER_BASE_URL, api_key=LLM_API_KEY)
        llm_client.extra_headers = {"HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8000"), "X-Title": os.getenv("YOUR_SITE_NAME", "Qdrant RAG API")}
        print(f"✅ Async LLM client initialized for: {LLM_MODEL_NAME}")
    else:
        print("❌ FATAL: OPENROUTER_API_KEY not found.")
        llm_client = None
        
    # 4. Initialize Reranker (BGE-Reranker)
    try:
        reranker = SentenceTransformerRerank(model=RERANKER_MODEL_NAME, top_n=FINAL_RERANK_N, device='cpu')
        print(f"✅ Reranker initialized: {RERANKER_MODEL_NAME}")
    except Exception as e:
        print(f"❌ FATAL: Could not initialize Reranker: {e}")
        reranker = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Handles startup and shutdown events for the application."""
    await initialize_clients()
    yield
    print("Shutting down RAG services...")


# Initialize FastAPI Application
app = FastAPI(
    title="School RAG API",
    version="1.0.0",
    description="RAG API for educational content using Qdrant and LLama-3.",
    lifespan=lifespan
)


# ==================== CORE RAG LOGIC FUNCTIONS (Internal) ====================

async def search_index_core(query: str, limit: int) -> List[SearchResultHelper]:
    """Performs a vector search in Qdrant."""

    if not qdrant_client or not embed_model:
        # Changed from ConnectionError to raise Exception compatible with HTTPException below
        raise Exception("Service not ready. Qdrant or embedding model not initialized.")

    limit = max(limit, INITIAL_RETRIEVAL_K) 

    try:
        query_vector = embed_model.get_query_embedding(query)

        search_result = qdrant_client.search(
            collection_name=QDRANT_COLLECTION_NAME, query_vector=query_vector, limit=limit, with_payload=True, score_threshold=0.2
        )

        results = []
        for hit in search_result:
            payload = hit.payload or {}
            snippet = payload.get("raw_text_content") or payload.get("text") or "N/A"

            results.append(SearchResultHelper(
                    score=hit.score, source_file=payload.get("source_file", "unknown"),
                    content_type=payload.get("type", "unknown"), text_snippet=snippet,
                    chunk_id=payload.get("chunk_id", 0),
                )
            )
        return results
    except Exception as e:
        raise Exception(f"Search failed: {e}")


async def retrieve_and_rerank_chunks(query: str) -> Tuple[List[str], Set[str]]:
    """Performs initial retrieval, reranking, and prepares context/source lists."""
    
    # Use search_index_core with the API's error handling now wrapped around it.
    initial_results: List[SearchResultHelper] = await search_index_core(query, INITIAL_RETRIEVAL_K) 

    if not initial_results:
        return [], set()

    nodes_to_rerank = []
    for result in initial_results:
        node = TextNode(text=result.text_snippet, metadata={"source_file": result.source_file, "chunk_id": result.chunk_id})
        nodes_to_rerank.append(NodeWithScore(node=node, score=result.score))
        
    reranker = SentenceTransformerRerank(model=RERANKER_MODEL_NAME, top_n=FINAL_RERANK_N, device='cpu')
    reranked_nodes = reranker.postprocess_nodes(nodes_to_rerank, query_str=query)
    
    context_list = []
    source_set: Set[str] = set()

    for node_with_score in reranked_nodes:
        node = node_with_score.node
        source_file = node.metadata.get("source_file", "unknown")
        chunk_id = node.metadata.get("chunk_id", "unknown")
        
        context_list.append(f"Source {source_file}, Chunk {chunk_id} (Score: {node_with_score.score:.4f}): {node.text}")
        source_set.add(f"{source_file} (Chunk {chunk_id})")

    return context_list, source_set


async def generate_rag_response(query: str, session_id: str) -> RAGResponseHelper:
    """Performs search, reranks, generates an LLM answer, and saves history."""
    
    if not all([qdrant_client, embed_model, llm_client, reranker]):
        raise Exception("Service not fully initialized.")
        
    history_records: List[Dict[str, Any]] = await get_chat_history(session_id, CHAT_HISTORY_LIMIT)
    
    history_str = ""
    if history_records:
        history_str = "\n".join(
            [f"**Turn {i+1}** (User: {h['user_query']})\n(Assistant: {h['llm_response']})" 
             for i, h in enumerate(history_records)]
        )
    
    is_simplification_or_vague_followup = any(
        phrase in query.lower() for phrase in ["explain it briefly", "explain it simply", "i don't get it", "what about", "why", "how", "elaborate", "briefly", "one by one", "list the steps"]
    ) and history_records

    context_list = []
    source_set: Set[str] = set()
    
    if not is_simplification_or_vague_followup:
        context_list, source_set = await retrieve_and_rerank_chunks(query)

    context_str = "\n---\n".join(context_list)
    
    if not context_str and not history_records and not is_simplification_or_vague_followup:
        answer_text = "I couldn't find any relevant information in the documents to answer this question."
        return RAGResponseHelper(query=query, answer=answer_text, sources=[], session_id=session_id)
        
    RAG_PROMPT = f"""
    You are an expert Q&A assistant for Indian educational content.
    
    **CRITICAL INSTRUCTIONS:**
    1.  **Primary Constraint (RAG):** If the CONTEXT is NOT empty, answer the current QUESTION ONLY using that context.
    2.  **History/Follow-up Constraint:** If the CONTEXT IS EMPTY, refer to the CHAT HISTORY to understand the question.
    3.  **Simplification Rule (Stricter):** If the question asks to explain, summarize, or list steps regarding the previous answer, you MUST base your response on the topic and details found in the CHAT HISTORY. If the history is too vague or if the topic requires structured information not present in the history, then use your internal, general knowledge to provide a simplified, academically accurate explanation.
    
    ---
    
    4.  **Tone:** Respond in a friendly, conversational tone.
    5.  **Formatting:** Do NOT use introductory phrases ("Based on the context," etc.) at the beginning.
    6.  **Failure Case:** If the context is empty AND the history can't resolve the query, state the answer can't be found in sources.
    
    --- CHAT HISTORY (Last {CHAT_HISTORY_LIMIT} Turns) ---
    {history_str if history_str else "No prior history in this session."}
    
    --- CONTEXT (Top {FINAL_RERANK_N} Reranked Chunks) ---
    {context_str if context_str else "CONTEXT IS EMPTY. You must rely on CHAT HISTORY and internal knowledge for follow-ups."}
    
    --- CURRENT QUESTION ---
    {query}
    """
    
    try:
        response = await llm_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[{"role": "user", "content": RAG_PROMPT}],
            extra_headers=llm_client.extra_headers, 
            temperature=0.1,
        )
        
        answer_message = response.choices[0].message
        answer_text = answer_message.content.strip() if answer_message and answer_message.content else None
        
        if answer_text:
            answer_text = answer_text.replace('\n', ' ').strip()
            
            await save_chat_entry(
                session_id=session_id, user_query=query, llm_response=answer_text,
                sources=list(source_set), context_chunks=context_list
            )
            
            return RAGResponseHelper(
                query=query, answer=answer_text, sources=list(source_set), session_id=session_id 
            )
        else:
            raise Exception("LLM returned empty content.")
        
    except Exception as e:
        print(f"❌ CRITICAL LLM ERROR: {e}")
        raise Exception(f"LLM generation failed. Detail: {e}")


# ==================== API ENDPOINTS ====================

@app.get("/health", response_model=HealthCheck, status_code=status.HTTP_200_OK, tags=["System"])
async def check_health() -> HealthCheck:
    """Checks the health of the core components (DB, Qdrant, Models)."""
    db_status = "OK"
    qdrant_status = "OK"
    
    # Check Database Connection
    try: await get_chat_history("health_check_test_session", limit=1)
    except Exception: db_status = "FAIL"

    # Check Qdrant Connection
    try:
        if qdrant_client: qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
        else: qdrant_status = "FAIL"
    except Exception: qdrant_status = "FAIL"
        
    final_status = "OK" if db_status == "OK" and qdrant_status == "OK" else "DEGRADED"

    return HealthCheck(status=final_status, database=db_status, vector_store=qdrant_status)


@app.post("/retrieve", response_model=RetrievalResponse, tags=["RAG"])
async def retrieve_chunks_for_query(request: QueryInput) -> RetrievalResponse:
    """Retrieves and reranks chunks based on query, showing the context before LLM generation."""
    
    if not embed_model or not reranker:
        raise HTTPException(status_code=503, detail="Embedding or Reranker model not initialized.")

    try:
        context_list, _ = await retrieve_and_rerank_chunks(request.query)
    except Exception as e:
        # Catch internal logic exceptions and surface them as 500
        raise HTTPException(status_code=500, detail=f"Retrieval error: {e}")

    if not context_list:
        raise HTTPException(status_code=404, detail="No relevant context chunks found in the index.")
    
    # Re-package context_list into the response schema format
    results = []
    for line in context_list:
        # Parse the custom format: Source S, Chunk C (Score: X.XXXX): Text
        match = re.search(r"Source (.*?), Chunk (\d+) \(Score: ([\d.]+)\): (.*)", line)
        if match:
             results.append(SearchResultHelper(
                 score=float(match.group(3)), source_file=match.group(1),
                 chunk_id=int(match.group(2)), text_snippet=match.group(4).strip(),
                 content_type="text_chunk"
             ))

    return RetrievalResponse(
        query=request.query,
        context_chunks=results[:request.top_k]
    )


@app.post("/chat", response_model=RAGResponseHelper, tags=["RAG"])
async def rag_query_endpoint(request: QueryInput) -> RAGResponseHelper:
    """Handles a user query, retrieves context, incorporates chat history, and generates a final LLM answer."""
    
    try:
        response = await generate_rag_response(request.query, request.session_id)
        return response
    except Exception as e:
        # Catch all exceptions (including those raised internally from generate_rag_response)
        error_detail = str(e)
        status_code = status.HTTP_500_INTERNAL_SERVER_ERROR
        
        # Check for specific initialization error
        if "Service not fully initialized" in error_detail:
            status_code = status.HTTP_503_SERVICE_UNAVAILABLE
        
        raise HTTPException(status_code=status_code, detail=f"LLM generation failed: {error_detail}")


if __name__ == "__main__":
    import uvicorn
    # To run this file: uvicorn rag_core:app --reload
    uvicorn.run("rag_core:app", host="0.0.0.0", port=8000, reload=True)