import os
import uuid
from typing import List, Optional, Set, Dict, Any
from dotenv import load_dotenv

from db import create_db_and_tables, save_chat_entry, get_chat_history 

from openai import AsyncOpenAI

from qdrant_client import QdrantClient
from llama_index.core.embeddings import resolve_embed_model
from llama_index.core.postprocessor import SentenceTransformerRerank
from llama_index.core.schema import NodeWithScore, TextNode
from pydantic import BaseModel

# CONFIGURATION
load_dotenv()

QDRANT_COLLECTION_NAME = "ncert_multidoc_index5"

EMBED_MODEL_NAME = "BAAI/bge-m3" 
RERANKER_MODEL_NAME = "BAAI/bge-reranker-v2-m3" 

OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"
LLM_API_KEY = os.getenv("OPENROUTER_API_KEY")
LLM_MODEL_NAME = "meta-llama/llama-3.3-8b-instruct:free" 

INITIAL_RETRIEVAL_K = 5
FINAL_RERANK_N = 3
CHAT_HISTORY_LIMIT = 3 

# GLOBAL CLIENTS
qdrant_client: Optional[QdrantClient] = None
embed_model = None
llm_client: Optional[AsyncOpenAI] = None
reranker: Optional[SentenceTransformerRerank] = None

# HELPER SCHEMAS
class SearchRequestHelper(BaseModel):
    query: str
    top_k: int = 3

class SearchResultHelper(BaseModel):
    score: float
    source_file: str
    content_type: str
    text_snippet: str
    chunk_id: int
    
class RAGResponseHelper(BaseModel):
    query: str
    answer: str
    sources: List[str]
    session_id: str 


# CORE CLIENT INITIALIZATION
async def initialize_clients():
    """Initializes clients, models, and database."""
    global qdrant_client, embed_model, reranker, llm_client

    if all([qdrant_client, embed_model, llm_client, reranker]):
        print("✅ Clients already initialized.")
        return

    await create_db_and_tables() 

    # 1. Initialize Qdrant Client
    try:
        qdrant_client = QdrantClient(
            url=os.getenv("QDRANT_HOST"),
            api_key=os.getenv("QDRANT_API_KEY"),
            port=int(os.getenv("QDRANT_PORT", 6333)),
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
        try:
            llm_client = AsyncOpenAI(
                base_url=OPENROUTER_BASE_URL,
                api_key=LLM_API_KEY,
            )
            llm_client.extra_headers = {
                "HTTP-Referer": os.getenv("YOUR_SITE_URL", "http://localhost:8000"),
                "X-Title": os.getenv("YOUR_SITE_NAME", "Qdrant RAG API"),
            }
            print(f"✅ Async LLM client initialized for: {LLM_MODEL_NAME}")
        except Exception as e:
            print(f"❌ FATAL: Could not initialize LLM Client: {e}")
            llm_client = None
    else:
        print("❌ FATAL: OPENROUTER_API_KEY not found.")
        llm_client = None
        
    # 4. Initialize Reranker (BGE-Reranker)
    try:
        reranker = SentenceTransformerRerank(
            model=RERANKER_MODEL_NAME,
            top_n=FINAL_RERANK_N,
            device='cpu'
        )
        print(f"✅ Reranker initialized: {RERANKER_MODEL_NAME}")
    except Exception as e:
        print(f"❌ FATAL: Could not initialize Reranker: {e}")
        reranker = None

# CORE RAG LOGIC FUNCTION
async def search_index_core(request: SearchRequestHelper) -> List[SearchResultHelper]:
    """Performs a vector search in Qdrant."""

    if not qdrant_client or not embed_model:
        raise ConnectionError("Service not ready. Qdrant or embedding model not initialized.")

    limit = max(request.top_k, INITIAL_RETRIEVAL_K) 

    try:
        query_vector = embed_model.get_query_embedding(request.query)

        search_result = qdrant_client.search(
            collection_name=QDRANT_COLLECTION_NAME,
            query_vector=query_vector,
            limit=limit,
            with_payload=True,
            score_threshold=0.2
        )

        results = []
        for hit in search_result:
            payload = hit.payload or {}
            snippet = payload.get("raw_text_content") or payload.get("text") or "N/A"

            results.append(
                SearchResultHelper(
                    score=hit.score,
                    source_file=payload.get("source_file", "unknown"),
                    content_type=payload.get("type", "unknown"),
                    text_snippet=snippet,
                    chunk_id=payload.get("chunk_id", 0),
                )
            )
        return results[:request.top_k] 

    except Exception as e:
        raise RuntimeError(f"Search failed: {e}")


async def generate_rag_response(query: str, session_id: str) -> RAGResponseHelper:
    """Performs search, reranks, generates an LLM answer, and saves history."""
    
    if not all([qdrant_client, embed_model, llm_client, reranker]):
        raise ConnectionError("Service not fully initialized.")
        
    # 0. Load Chat History
    history_records: List[Dict[str, Any]] = await get_chat_history(session_id, CHAT_HISTORY_LIMIT)
    
    history_str = ""
    if history_records:
        history_str = "\n".join(
            [f"**Turn {i+1}** (User: {h['user_query']})\n(Assistant: {h['llm_response']})" 
             for i, h in enumerate(history_records)]
        )
    
    # Conditional Retrieval Logic 
    is_simplification_or_vague_followup = any(
        phrase in query.lower() for phrase in ["explain it briefly", "explain it simply", "i don't get it", "what about", "why", "how", "elaborate", "briefly", "one by one", "list the steps"]
    ) and history_records

    context_list = []
    source_set: Set[str] = set()
    
    if not is_simplification_or_vague_followup:
        # 1. Initial Vector Search
        initial_request = SearchRequestHelper(query=query, top_k=INITIAL_RETRIEVAL_K)
        initial_results: List[SearchResultHelper] = await search_index_core(initial_request) 
    
        if initial_results:
            # 2. Prepare Nodes for Reranker
            nodes_to_rerank = []
            for result in initial_results:
                node = TextNode(text=result.text_snippet, metadata={"source_file": result.source_file, "chunk_id": result.chunk_id})
                nodes_to_rerank.append(NodeWithScore(node=node, score=result.score))
                
            # 3. Reranking Step
            reranked_nodes = reranker.postprocess_nodes(nodes_to_rerank, query_str=query)
            
            # 4. Build Final Context and Source List
            for node_with_score in reranked_nodes:
                node = node_with_score.node
                source_file = node.metadata.get("source_file", "unknown")
                chunk_id = node.metadata.get("chunk_id", "unknown")
                
                context_list.append(f"Source {source_file}, Chunk {chunk_id} (Score: {node_with_score.score:.4f}): {node.text}")
                source_set.add(f"{source_file} (Chunk {chunk_id})")

    context_str = "\n---\n".join(context_list)
    
    # Handle case where no context is found for RAG
    if not context_str and not history_records and not is_simplification_or_vague_followup:
        answer_text = "I couldn't find any relevant information in the documents to answer this question."
        return RAGResponseHelper(query=query, answer=answer_text, sources=[], session_id=session_id)
        
    # 5. Construct the Optimized RAG Prompt
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
        # 6. Call the LLM
        response = await llm_client.chat.completions.create(
            model=LLM_MODEL_NAME,
            messages=[{"role": "user", "content": RAG_PROMPT}],
            extra_headers=llm_client.extra_headers, 
            temperature=0.1,
        )
        
        # 7. Check for and return the answer
        answer_message = response.choices[0].message
        answer_text = answer_message.content.strip() if answer_message and answer_message.content else None
        
        if answer_text:
            # POST-PROCESSING FIX
            answer_text = answer_text.replace('\n', ' ').strip()
            
            # 8. Save the conversation turn
            await save_chat_entry(
                session_id=session_id,
                user_query=query,
                llm_response=answer_text,
                sources=list(source_set),
                context_chunks=context_list
            )
            
            return RAGResponseHelper(
                query=query,
                answer=answer_text,
                sources=list(source_set),
                session_id=session_id 
            )
        else:
            raise Exception("LLM returned empty content.")
        
    except Exception as e:
        print(f"❌ CRITICAL LLM ERROR: {e}")
        raise Exception(f"LLM generation failed. Detail: {e}")