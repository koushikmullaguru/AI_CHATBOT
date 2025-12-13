# import os
# import uuid
# from fastapi import FastAPI, HTTPException, Body
# from pydantic import BaseModel, Field
# from typing import List, Optional
# import uvicorn
# import logging
# from rag_logic import initialize_and_load_clients, generate_rag_response, RAGResponseHelper, CLIENTS

# # Setup logging
# logging.basicConfig(level=logging.INFO)
# logger = logging.getLogger(__name__)

# # --- FastAPI Setup ---
# app = FastAPI(
#     title="Hybrid RAG Chatbot API",
#     description="A Hybrid RAG API service for educational content (NCERT) using Qdrant, BM25, and OpenRouter.",
#     version="1.0.0",
# )

# # --- Schemas for API ---
# class ChatRequest(BaseModel):
#     session_id: str = Field(..., description="Unique ID for the conversation session (e.g., UUID).")
#     query: str = Field(..., description="The user's question or prompt.")

# class ChatResponse(BaseModel):
#     answer: str = Field(..., description="The LLM's generated response to the query.")
#     sources: List[str] = Field(..., description="A list of source files and chunk IDs used for grounding the answer.")
#     cache_status: str = Field(..., description="Indicates if the response was a 'HIT' (from cache) or 'MISS'.")
    
# # --- Startup Event ---
# @app.on_event("startup")
# async def startup_event():
#     """Initializes RAG clients and database connection synchronously."""
#     logger.info("Starting RAG service initialization...")
#     try:
#         initialize_and_load_clients()
#         if not CLIENTS.get("llm") or not CLIENTS.get("qdrant"):
#             logger.error("Critical RAG clients (LLM/Qdrant) failed to initialize. Check logs/environment.")
#         else:
#             logger.info("RAG services initialized successfully.")
#     except Exception as e:
#         logger.error(f"Fatal error during startup: {e}")

# # --- Health Check Endpoint ---
# @app.get("/health")
# async def health_check():
#     """Simple health check to verify service is running."""
#     status = "healthy" if CLIENTS.get("llm") and CLIENTS.get("qdrant") else "degraded"
#     return {"status": status, "message": "RAG services operational." if status == "healthy" else "Check LLM/Qdrant connection."}


# # --- Main Chat Endpoint ---
# @app.post("/chat", response_model=ChatResponse)
# async def chat_endpoint(request: ChatRequest):
#     """
#     Processes a user query, performs hybrid RAG retrieval, and generates an LLM response.
#     """
#     if not CLIENTS.get("llm"):
#          raise HTTPException(status_code=503, detail="LLM service is not configured or failed to start.")
#     if not CLIENTS.get("qdrant"):
#         raise HTTPException(status_code=503, detail="Vector Database (Qdrant) is not configured or failed to start.")
        
#     try:
#         # Generate the response using the core logic
#         response_helper: RAGResponseHelper = await generate_rag_response(
#             clients=CLIENTS,
#             query=request.query,
#             session_id=request.session_id,
#         )
        
#         # Map the helper response to the API response model
#         return ChatResponse(
#             answer=response_helper.answer,
#             sources=response_helper.sources,
#             cache_status=response_helper.cache_status
#         )
#     except Exception as e:
#         logger.error(f"Error during RAG generation for session {request.session_id}: {e}")
#         raise HTTPException(status_code=500, detail=f"Internal RAG error: {e}")

import os
import uuid
from fastapi import FastAPI, HTTPException, Body
from pydantic import BaseModel, Field
from typing import List, Optional
import uvicorn
import logging
from fastapi.middleware.cors import CORSMiddleware # FIX 1: Import CORS Middleware

from rag_logic import initialize_and_load_clients, generate_rag_response, RAGResponseHelper, CLIENTS

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- FastAPI Setup ---
app = FastAPI(
    title="Hybrid RAG Chatbot API",
    description="A Hybrid RAG API service for educational content (NCERT) using Qdrant, BM25, and OpenRouter.",
    version="1.0.0",
)

# FIX 2: Apply CORS Middleware to allow cross-origin requests (localhost:3000 -> localhost:8501)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://127.0.0.1:3000", "http://localhost:5173", "http://localhost:3003"],
    allow_credentials=True,
    allow_methods=["*"], # Allows POST and OPTIONS (the preflight request)
    allow_headers=["*"],
)

# --- Schemas for API (MATCH RAGResponseHelper with new fields) ---
class ChatRequest(BaseModel):
    session_id: str = Field(..., description="Unique ID for the conversation session (e.g., UUID).")
    query: str = Field(..., description="The user's question or prompt.")

class ChatResponse(BaseModel):
    answer: str = Field(..., description="The LLM's generated response to the query.")
    sources: List[str] = Field(default_factory=list, description="A list of source files and chunk IDs used for grounding the answer.")
    cache_status: str = Field(..., description="Indicates if the response was a 'HIT' (from cache) or 'MISS'.")
    suggested_questions: List[str] = Field(default_factory=list, description="3-4 contextual follow-up questions from the LLM.") # FIX 3: Added suggested_questions
    
# --- Startup Event ---
@app.on_event("startup")
async def startup_event():
    """Initializes RAG clients and database connection asynchronously."""
    logger.info("Starting RAG service initialization...")
    try:
        await initialize_and_load_clients()
        if not CLIENTS.get("llm") or not CLIENTS.get("qdrant"):
            logger.error("Critical RAG clients (LLM/Qdrant) failed to initialize. Check logs/environment.")
        else:
            logger.info("RAG services initialized successfully.")
    except Exception as e:
        logger.error(f"Fatal error during startup: {e}")

# --- Health Check Endpoint ---
@app.get("/health")
async def health_check():
    """Simple health check to verify service is running."""
    status = "healthy" if CLIENTS.get("llm") and CLIENTS.get("qdrant") else "degraded"
    return {"status": status, "message": "RAG services operational." if status == "healthy" else "Check LLM/Qdrant connection."}


# --- Main Chat Endpoint ---
@app.post("/chat", response_model=ChatResponse)
async def chat_endpoint(request: ChatRequest):
    """
    Processes a user query, performs hybrid RAG retrieval, and generates an LLM response.
    """
    if not CLIENTS.get("llm"):
         raise HTTPException(status_code=503, detail="LLM service is not configured or failed to start.")
    if not CLIENTS.get("qdrant"):
        raise HTTPException(status_code=503, detail="Vector Database (Qdrant) is not configured or failed to start.")
        
    try:
        # Generate the response using the core logic
        response_helper: RAGResponseHelper = await generate_rag_response(
            clients=CLIENTS,
            query=request.query,
            session_id=request.session_id,
        )
        
        # FIX 4: Map all fields, including the newly requested ones
        return ChatResponse(
            answer=response_helper.answer,
            sources=response_helper.sources,
            cache_status=response_helper.cache_status,
            suggested_questions=response_helper.suggested_questions
        )
    except Exception as e:
        logger.error(f"Error during RAG generation for session {request.session_id}: {e}")
        # Return a generic error if the RAG pipeline fails
        raise HTTPException(status_code=500, detail=f"Internal RAG pipeline failure.")

# Note: The Uvicorn run block is omitted as Docker handles execution.