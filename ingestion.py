import os
import re
import boto3
import numpy as np
from typing import List
from dotenv import load_dotenv

# --- Qdrant and LlamaIndex Imports ---
from llama_index.core import Document, Settings, VectorStoreIndex
from llama_index.vector_stores.qdrant import QdrantVectorStore
from llama_index.embeddings.huggingface import HuggingFaceEmbedding
from llama_index.core.node_parser import SentenceSplitter  # 👈 NEW: Sentence Splitter

from qdrant_client import QdrantClient, models 
from qdrant_client.http.exceptions import UnexpectedResponse

# 1. Load Environment Variables
load_dotenv()

# --- Configuration ---
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME", "askandlearn")
S3_BASE_PATH = "output_extractions6/"
QDRANT_COLLECTION_NAME = "ncert_multidoc_index5" 
VECTOR_SIZE = 1024 # BGE-M3 dimension

# --- RAG OPTIMIZATION SETTINGS ---
CHUNK_SIZE = 256
CHUNK_OVERLAP = 25
EMBED_MODEL_NAME = "BAAI/bge-m3"
EMBED_BATCH_SIZE = 4 
QDRANT_UPLOAD_TIMEOUT = 120 


# 2. Custom Markdown and Image Metadata Parser (MODIFIED)
def parse_markdown_with_metadata(markdown_text: str, file_key: str) -> List[Document]:
    """
    Parses markdown, extracting image metadata and then splitting text into optimized chunks.
    """
    documents = []
    
    # Initialize the Sentence Splitter for text chunking
    text_splitter = SentenceSplitter(
        chunk_size=CHUNK_SIZE,
        chunk_overlap=CHUNK_OVERLAP,
    )

    # Regex to find image tags and captions
    image_pattern = re.compile(
        r"\[CAPTION\]:\s*(.*?)\s*\n\s*!\[Image\]\((s3://.*?)\)", 
        re.DOTALL
    )

    last_end = 0
    # Process image metadata first
    for match in image_pattern.finditer(markdown_text):
        
        # Split and process the text PRECEDING the image
        preceding_text = markdown_text[last_end:match.start()].strip()
        if preceding_text:
            #Use SentenceSplitter on the raw text
            text_nodes = text_splitter.get_nodes_from_documents([Document(text=preceding_text)])
            for node in text_nodes:
                 # The 'text' and 'metadata' are now correctly in the node
                 documents.append(Document(text=node.text, metadata={"source_file": file_key, "type": "text_chunk"}))


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
                "raw_text_content": f"Image: {caption}. This image is linked to the source file: {file_key}." # Store for retrieval
            }
        )
        documents.append(image_doc)
        last_end = match.end()

    # Split and process the REMAINING text after the last image (or the whole text if no images)
    remaining_text = markdown_text[last_end:].strip()
    if remaining_text:
        text_nodes = text_splitter.get_nodes_from_documents([Document(text=remaining_text)])
        for node in text_nodes:
            # The 'text' and 'metadata' are now correctly in the node
            documents.append(Document(text=node.text, metadata={"source_file": file_key, "type": "text_chunk"}))
            
    # Assign chunk_id after all text and images are parsed
    final_documents = []
    text_chunk_count = 0
    for doc in documents:
        if doc.metadata["type"] == "text_chunk":
            doc.metadata["chunk_id"] = text_chunk_count
            doc.metadata["raw_text_content"] = doc.text
            text_chunk_count += 1
        elif doc.metadata["type"] == "image_metadata":
             # Assign a unique ID to image metadata chunks (or use 0 if there's only one per file)
             doc.metadata["chunk_id"] = 0 
        
        final_documents.append(doc)

    return final_documents

def setup_clients():
    """Configures the embedding model, Qdrant client, and Boto3 client."""
    
    # --- 1. Initialize Embedding Model ---
    print(f"\n[SETUP LOG] Loading and initializing embedding model: {EMBED_MODEL_NAME}...")
    embed_model = HuggingFaceEmbedding(
        model_name=EMBED_MODEL_NAME,
        embed_batch_size=EMBED_BATCH_SIZE
    )
    Settings.embed_model = embed_model
    
    # --- 2. Initialize Qdrant Client ---
    print("[SETUP LOG] Initializing Qdrant client...")
    qdrant_client = QdrantClient(
        url=os.getenv("QDRANT_HOST"),
        api_key=os.getenv("QDRANT_API_KEY"),
        port=int(os.getenv("QDRANT_PORT", 6333)) 
    )
    
    # --- 3. Check/Create Collection ---
    try:
        collections = qdrant_client.get_collections().collections
        if not any(c.name == QDRANT_COLLECTION_NAME for c in collections):
            print(f"[SETUP LOG] Collection '{QDRANT_COLLECTION_NAME}' not found. Creating it...")
            qdrant_client.recreate_collection(
                collection_name=QDRANT_COLLECTION_NAME,
                vectors_config=models.VectorParams(size=VECTOR_SIZE, distance=models.Distance.COSINE),
            )
            print(f"Successfully created collection: {QDRANT_COLLECTION_NAME}")
    except Exception as e:
        print(f"FATAL Qdrant setup error: {e}. Check QDRANT_HOST/API_KEY permissions.")
        return None, None, None

    vector_store = QdrantVectorStore(
        client=qdrant_client, 
        collection_name=QDRANT_COLLECTION_NAME
    )
    
    # --- 4. Initialize Boto3 S3 Client ---
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
        print(f"Error connecting to S3 or listing prefixes. Check AWS config: {e}")
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
        
        # Access the embed model via Settings
        embeddings = Settings.embed_model.get_text_embedding_batch(texts, show_progress=True)

        if not embeddings:
            raise ValueError("Embedding model returned no vectors. Check local resources (RAM/CPU).")
            
        # --- NEW DIAGNOSTICS: CHECK EMBEDDING INTEGRITY ---
        embeddings_array = np.array(embeddings)
        print(f"[DEBUG LOG] Embedding array shape: {embeddings_array.shape}")
        
        is_all_zeros = not np.any(embeddings_array)
        if is_all_zeros:
            raise ValueError("🚨 Embedding model generated vectors, but they are ALL ZEROS! Model loading/weights failed.")
        # ----------------------------------------------------

        #Prepare payloads including the raw text content
        final_payloads = []
        for doc in all_documents_to_ingest:
            payload = doc.metadata.copy() 
            final_payloads.append(payload)
        # -----------------------------------------------------------

        # 2. Upload to Qdrant using the client's optimized upsert method
        print(f"[UPLOAD LOG] Uploading {len(embeddings)} vectors and full payloads in an optimized batch...")
        
        points_to_upload = models.Batch(
            ids=[i for i in range(len(embeddings))],
            vectors=embeddings,
            payloads=final_payloads
        )
        
        # Perform the upsert with a long timeout
        upsert_result = qdrant_client.upsert(
            collection_name=QDRANT_COLLECTION_NAME,
            points=points_to_upload,
            wait=True 
        )

        print(f"Bulk Ingestion successful! Qdrant Status: {upsert_result.status.name}")

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
        if count_result.count == len(all_documents_to_ingest):
              print("Count matches documents prepared. Data is confirmed present.")
        else:
              print(f"⚠️ WARNING: Count mismatch. Expected {len(all_documents_to_ingest)} but found {count_result.count}. This is the critical problem!")
              
    except Exception as e:
        print(f"General Verification Error: {e}")


if __name__ == "__main__":
    main_ingestion()