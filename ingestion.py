import os
import re
import boto3
import numpy as np
import logging
from typing import List, Optional, Set, Dict, Any, Tuple
from dotenv import load_dotenv

# --- Qdrant and LlamaIndex Imports ---
from llama_index.core import Document, Settings
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import SentenceSplitter

from qdrant_client import QdrantClient, models
from qdrant_client.http.exceptions import UnexpectedResponse 

# Set up logging
logging.basicConfig(level=logging.INFO)

# Load Environment Variables
load_dotenv()

# --- Configuration ---
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "askandlearn")
S3_BASE_PATH = "output_extractions9/"
QDRANT_COLLECTION_NAME = "ncert_multidoc_index9"
VECTOR_SIZE = 1024 

# --- RAG OPTIMIZATION SETTINGS ---
CHUNK_SIZE = 256
CHUNK_OVERLAP = 25
EMBED_MODEL_NAME = "BAAI/bge-m3"
EMBED_BATCH_SIZE = 4

# Increased timeout and batch size for robust upload
QDRANT_CLIENT_TIMEOUT = 100 
UPLOAD_BATCH_SIZE = 100

# =================================================================
# 2. Custom Markdown and Image Metadata Parser (CONTEXT-AWARE CHUNKING)
# =================================================================
def parse_markdown_with_metadata(markdown_text: str, file_key: str) -> List[Document]:
    """
    Parses markdown, extracting image metadata and splitting text into context-aware chunks.
    """
    documents = []
    
    text_splitter = SentenceSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    last_chunk_text = ""

    # Regex to find image tags and captions
    image_pattern = re.compile(
        r"\[CAPTION\]:\s*(.*?)\s*\n\s*!\[Image\]\((s3://.*?)\)",
        re.DOTALL
    )

    last_end = 0
    # Process text preceding the image and the image metadata itself
    for match in image_pattern.finditer(markdown_text):
        
        preceding_text = markdown_text[last_end:match.start()].strip()
        if preceding_text:
            text_nodes = text_splitter.get_nodes_from_documents([Document(text=preceding_text)])
            for node in text_nodes:
                # Add preceding context snippet to the text for better embedding
                enriched_text = node.text
                if last_chunk_text:
                    enriched_text = f"[PREVIOUS CONTEXT: {last_chunk_text[:150].strip()}...] {node.text}"
                    node.metadata["preceding_text_snippet"] = last_chunk_text[:150].strip()
                
                documents.append(Document(text=enriched_text, metadata={"source_file": file_key, "type": "text_chunk"}))
                last_chunk_text = node.text 

        # Process the image metadata
        caption = match.group(1).strip()
        s3_url = match.group(2).strip()
        
        image_doc = Document(
            text=f"Image: {caption}. This image is linked to the source file: {file_key}.",
            metadata={
                "type": "image_metadata",
                "caption": caption,
                "image_url": s3_url,
                "source_file": file_key,
                "raw_text_content": f"Image: {caption}. This image is linked to the source file: {file_key}."
            }
        )
        documents.append(image_doc)

        last_end = match.end()

    # Process remaining text after the last image
    remaining_text = markdown_text[last_end:].strip()
    if remaining_text:
        text_nodes = text_splitter.get_nodes_from_documents([Document(text=remaining_text)])
        for node in text_nodes:
            enriched_text = node.text
            if last_chunk_text:
                enriched_text = f"[PREVIOUS CONTEXT: {last_chunk_text[:150].strip()}...] {node.text}"
                node.metadata["preceding_text_snippet"] = last_chunk_text[:150].strip()
                
            documents.append(Document(text=enriched_text, metadata={"source_file": file_key, "type": "text_chunk"}))
            last_chunk_text = node.text 
            
    # Assign sequential chunk_id and store the enriched text as raw_text_content
    final_documents = []
    text_chunk_count = 0
    for doc in documents:
        if doc.metadata["type"] == "text_chunk":
            doc.metadata["chunk_id"] = text_chunk_count
            doc.metadata["raw_text_content"] = doc.text
            text_chunk_count += 1
        elif doc.metadata["type"] == "image_metadata":
             doc.metadata["chunk_id"] = 0
        
        final_documents.append(doc)

    return final_documents

# =================================================================
# 3. Setup Clients 
# =================================================================

def setup_clients():
    """Configures the embedding model, Qdrant client, and Boto3 client."""
    
    # 1. Initialize Embedding Model
    print(f"\n[SETUP LOG] Loading and initializing embedding model: {EMBED_MODEL_NAME}...")
    embed_model = HuggingFaceEmbedding(
        model_name=EMBED_MODEL_NAME,
        embed_batch_size=EMBED_BATCH_SIZE
    )
    Settings.embed_model = embed_model
    
    # 2. Initialize Qdrant Client
    print(f"[SETUP LOG] Initializing Qdrant client with timeout={QDRANT_CLIENT_TIMEOUT}s...")
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_HOST"),
        api_key=os.getenv("QDRANT_API_KEY"),
        port=int(os.getenv("QDRANT_PORT", 6333)),
        timeout=QDRANT_CLIENT_TIMEOUT 
    )
    
    # 3. Check/Create Collection (Handles older client versions without UnexpectedStatus)
    try:
        qdrant_client.get_collection(QDRANT_COLLECTION_NAME)
        print(f"[SETUP LOG] Collection '{QDRANT_COLLECTION_NAME}' already exists. Proceeding with upsert.")
    
    except Exception as e:
        # Check for existence failure by inspecting error message
        if "not found" in str(e).lower() or "404" in str(e).lower():
            print(f"[SETUP LOG] Collection '{QDRANT_COLLECTION_NAME}' not found. Creating it...")
            try:
                qdrant_client.create_collection(
                    collection_name=QDRANT_COLLECTION_NAME,
                    vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
                )
                print(f"Successfully created collection: {QDRANT_COLLECTION_NAME}")
            except Exception as create_e:
                print(f"FATAL Qdrant creation error: {create_e}")
                return None, None, None
        else:
            # Handle other connection/setup errors
            print(f"FATAL Qdrant setup error during collection check: {e}. Check QDRANT_HOST/API_KEY permissions.")
            return None, None, None

    vector_store = QdrantVectorStore(
        client=qdrant_client,
        collection_name=QDRANT_COLLECTION_NAME
    )
    
    # 4. Initialize Boto3 S3 Client
    s3_client = boto3.client(
        's3',
        aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
        aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
        region_name=os.getenv("AWS_REGION", "ap-south-1")
    )
    
    return vector_store, qdrant_client, s3_client


# 4. Main Ingestion Logic
def main_ingestion():
    vector_store, qdrant_client, s3_client = setup_clients()
    if not qdrant_client:
        return
        
    all_documents_to_ingest = []
    
    print("\n[MAIN LOG] Attempting to list S3 directories...")
    
    # --- S3 Data Gathering ---
    try:
        response = s3_client.list_objects_v2(
            Bucket=S3_BUCKET_NAME,
            Prefix=S3_BASE_PATH,
            Delimiter='/'
        )
        sub_folders = [p.get('Prefix') for p in response.get('CommonPrefixes', [])]

    except Exception as e:
        print(f"Error connecting to S3 or listing prefixes: {e}")
        return

    print(f"[MAIN LOG] Found {len(sub_folders)} directories to process.")
    
    for folder_prefix in sub_folders:
        folder_name = folder_prefix.strip('/').split('/')[-1]
        md_file_key = f"{folder_prefix}{folder_name}.md"
        
        print(f"\n--- Processing: {md_file_key} ---")
        
        try:
            print(f"[S3 LOG] Fetching {md_file_key}...")
            s3_object = s3_client.get_object(
                Bucket=S3_BUCKET_NAME,
                Key=md_file_key
            )
            markdown_content = s3_object['Body'].read().decode('utf-8')
            
            if markdown_content:
                documents_for_file = parse_markdown_with_metadata(markdown_content, md_file_key)
                print(f"[S3 LOG] Prepared {len(documents_for_file)} total chunks (text + metadata).")
                all_documents_to_ingest.extend(documents_for_file)

        except s3_client.exceptions.NoSuchKey:
             print(f"[S3 LOG] Skipping {md_file_key}: Markdown file not found.")
        except Exception as e:
            print(f"An unexpected error occurred while processing {md_file_key}: {e}")

    if not all_documents_to_ingest:
        print("\n No documents were successfully prepared. Aborting ingestion.")
        return

    print(f"\n Total documents prepared across all files: {len(all_documents_to_ingest)}")
    
    # 5. Robust Ingest: Explicit Embedding and Direct Upload
    print(f"\n[INGEST LOG] Starting vector creation and robust ingestion into Qdrant collection: {QDRANT_COLLECTION_NAME}...")

    try:
        # 1. Explicitly Embed all documents
        print("[EMBED LOG] Embedding documents (using local BGE-M3 model)...")
        texts = [doc.text for doc in all_documents_to_ingest]
        embeddings = Settings.embed_model.get_text_embedding_batch(texts, show_progress=True)

        if not embeddings:
            raise ValueError("Embedding model returned no vectors.")
            
        embeddings_array = np.array(embeddings)
        print(f"[DEBUG LOG] Embedding array shape: {embeddings_array.shape}")
        
        if not np.any(embeddings_array):
            raise ValueError("🚨 Embedding model generated vectors, but they are ALL ZEROS!")

        # Prepare payloads
        final_payloads = [doc.metadata.copy() for doc in all_documents_to_ingest]

        # 2. Upload to Qdrant using smaller, manageable batches
        total_points = len(embeddings)
        print(f"[UPLOAD LOG] Uploading {total_points} vectors in batches of {UPLOAD_BATCH_SIZE}...")
        
        for i in range(0, total_points, UPLOAD_BATCH_SIZE):
            batch_start = i
            batch_end = min(i + UPLOAD_BATCH_SIZE, total_points)
            batch_num = i // UPLOAD_BATCH_SIZE + 1
            
            print(f"  > Batch {batch_num}: Uploading points {batch_start} to {batch_end - 1}...")

            points_to_upload = models.Batch(
                ids=[j for j in range(batch_start, batch_end)],
                vectors=embeddings[batch_start:batch_end],
                payloads=final_payloads[batch_start:batch_end]
            )
            
            qdrant_client.upsert(
                collection_name=QDRANT_COLLECTION_NAME,
                points=points_to_upload,
                wait=True
            )

            print(f"  > Batch {batch_num} successful.")

        print("Bulk Ingestion successful across all batches!")

    except Exception as e:
        print(f"An error occurred during Qdrant ingestion (Upload failure): {e}")
        
    # 6. Verification Step
    print("\n--- Verifying Qdrant Data Count ---")
    try:
        count_result = qdrant_client.count(
            collection_name=QDRANT_COLLECTION_NAME,
            exact=True
        )
        print(f"Verification Success! Collection '{QDRANT_COLLECTION_NAME}' has {count_result.count} points.")
        if count_result.count != len(all_documents_to_ingest):
             print(f"⚠️ WARNING: Count mismatch. Expected {len(all_documents_to_ingest)} but found {count_result.count}.")
             
    except Exception as e:
        print(f"General Verification Error: {e}")


if __name__ == "__main__":
    main_ingestion()