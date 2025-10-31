# School RAG

### Step 1 - Text Extraction
To learn more - [text-extraction.md](text-extraction.md)

## Core Components

### s3_integrated_docling.py
PDF processing pipeline that:
- Downloads PDFs from S3
- Extracts text, tables, images, and formulas using Docling
- Filters content by language and image size
- Converts to structured markdown
- Uploads processed content back to S3

### rag_core.py
FastAPI RAG system that:
- Implements hybrid search(vector + keyword)
- Uses Qdrant for vector storage and retrieval
- Integrates with Llama-3 via OpenRouter API
- Provides `/retrieve` and `/chat` endpoints
- Maintains conversation history

### ingestion.py
Data ingestion pipeline that:
- Fetches processed markdown from S3
- Creates text chunks with optimal overlap
- Generates embeddings using BGE-M3 model
- Stores vectors in Qdrant database
- Verifies data integrity

### db.py
Database interface that:
- Manages PostgreSQL connection with SQLAlchemy
- Stores conversation history with metadata
- Tracks queries, responses, and sources
- Supports session-based history retrieval

## Flow
1. Process PDFs with s3_integrated_docling.py
2. Ingest content with ingestion.py
3. Query via rag_core.py API endpoints
4. Store conversations with db.py