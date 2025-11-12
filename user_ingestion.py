import os
import shutil
from pathlib import Path
from typing import Optional, Dict, Any, Tuple

# Import core functions from existing scripts
from s3_integrated_docling import (
    create_pdf_id,
    upload_file_to_s3,
    upload_folder_to_s3_recursive,
    process_single_pdf,
    find_tesseract,
    LOCAL_CACHE_DIR,
    S3_BUCKET_NAME,
    OUTPUT_S3_PREFIX,
    list_pdfs_in_s3,
    ElementMetadata
)
from ingestion import setup_clients, parse_markdown_with_metadata # Simplified ingest logic
from qdrant_client import models as qmodels
from llama_index.core.embeddings import resolve_embed_model
from llama_index.core import Settings # Import Settings from llama_index.core
import numpy as np
import json
import logging

logging.basicConfig(level=logging.INFO)

# --- Configuration for Pipeline (should match ingestion.py) ---
QDRANT_COLLECTION_NAME = "ncert_multidoc_index9"
EMBED_MODEL_NAME = "BAAI/bge-m3"
VECTOR_SIZE = 1024
JSONL_METADATA_KEY = f"{OUTPUT_S3_PREFIX}/ncert_metadata.jsonl"
# NOTE: Assumed constant for batching from ingestion.py
UPLOAD_BATCH_SIZE = 100 


async def run_ingestion_for_file(
    qdrant_client,
    embed_model,
    markdown_content: str,
    md_file_key: str
) -> int:
    """Embeds and ingests a single markdown document into Qdrant in batches."""
    
    documents_to_ingest = parse_markdown_with_metadata(markdown_content, md_file_key)
    total_chunks = len(documents_to_ingest)
    
    if not documents_to_ingest:
        logging.warning(f"No valid documents parsed for {md_file_key}.")
        return 0

    # Explicitly Embed all documents (Assuming batching happens inside the getter/loop is elsewhere)
    texts = [doc.text for doc in documents_to_ingest]
    embeddings = embed_model.get_text_embedding_batch(texts, show_progress=False)
    
    # Prepare payloads
    final_payloads = [doc.metadata.copy() for doc in documents_to_ingest]

    # --- Qdrant Upload (Batched for reliability) ---
    total_uploaded_count = 0
    
    for i in range(0, total_chunks, UPLOAD_BATCH_SIZE):
        batch_start = i
        batch_end = min(i + UPLOAD_BATCH_SIZE, total_chunks)
        
        # Prepare points for Qdrant upload
        points_to_upload = qmodels.Batch(
            # Using absolute index as ID
            ids=[j for j in range(batch_start, batch_end)], 
            vectors=embeddings[batch_start:batch_end],
            payloads=final_payloads[batch_start:batch_end]
        )
        
        # Upload to Qdrant (This blocks due to wait=True)
        qdrant_client.upsert(
            collection_name=QDRANT_COLLECTION_NAME,
            points=points_to_upload,
            wait=True
        )
        total_uploaded_count += (batch_end - batch_start)
    
    return total_uploaded_count


async def full_pdf_ingestion_pipeline(file_stream: bytes, filename: str) -> Dict[str, Any]:
    """
    Orchestrates the entire PDF pipeline: Docling Extraction -> S3 Upload -> Qdrant Ingestion.
    Returns a status dictionary.
    """
    pdf_id = create_pdf_id(filename)
    
    # --- 1. SETUP CLIENTS & ENVIRONMENT ---
    vector_store, qdrant_client, s3_client = setup_clients()
    if not qdrant_client:
        # If client fails, the status will be caught by the outer try-except block in Streamlit
        raise Exception("Qdrant or S3 client failed to initialize.")
    
    embed_model = Settings.embed_model
    if not embed_model:
        raise Exception("Embedding model failed to initialize.")

    ocr_path = find_tesseract()
    
    # --- 2. LOCAL FILE MANAGEMENT (Temporary) ---
    temp_dir = Path("./temp_uploads") / pdf_id
    temp_dir.mkdir(parents=True, exist_ok=True)
    pdf_local_path = temp_dir / filename
    
    try:
        # Save the uploaded file to a temporary local path
        with open(pdf_local_path, "wb") as f:
            f.write(file_stream)
        logging.info(f"Saved temporary PDF to {pdf_local_path}")
        
        input_s3_key = f"uploaded_pdfs/{pdf_id}/{filename}"
        
        # --- 3. DOCLING EXTRACTION & PROCESSING ---
        output_local_root = temp_dir / "docling_outputs"
        
        elements_metadata, clean_upload_folder = process_single_pdf(
            pdf_local_path,
            input_s3_key, 
            output_local_root,
            S3_BUCKET_NAME,
            OUTPUT_S3_PREFIX,
            ocr_path,
            enable_formula_understanding=True
        )

        md_file_key = f"{OUTPUT_S3_PREFIX}/{pdf_id}/{pdf_id}.md"
        
        # --- 4. UPLOAD DOClING ARTIFACTS TO S3 ---
        final_s3_key_prefix = f"{OUTPUT_S3_PREFIX}/{pdf_id}"
        logging.info(f"Uploading Docling artifacts to s3://{S3_BUCKET_NAME}/{final_s3_key_prefix}/...")
        upload_folder_to_s3_recursive(clean_upload_folder, S3_BUCKET_NAME, final_s3_key_prefix)
        
        # --- 5. INGESTION INTO QDRANT ---
        logging.info("Starting Qdrant ingestion...")
        
        md_local_path = clean_upload_folder / f"{pdf_id}.md"
        markdown_content = md_local_path.read_text(encoding='utf-8')
        
        ingested_count = await run_ingestion_for_file(
            qdrant_client,
            embed_model,
            markdown_content,
            md_file_key
        )
        
        # --- 6. APPEND METADATA TO JSONL FILE ---
        new_jsonl_content = "\n".join([e.model_dump_json() for e in elements_metadata]) + "\n"
        
        try:
            existing_content = ""
            try:
                response = s3_client.get_object(Bucket=S3_BUCKET_NAME, Key=JSONL_METADATA_KEY)
                existing_content = response['Body'].read().decode('utf-8')
            except s3_client.exceptions.NoSuchKey:
                logging.info("Existing JSONL file not found, creating new one.")
                
            final_jsonl_content = existing_content + new_jsonl_content
            
            jsonl_temp_path = temp_dir / "temp_metadata.jsonl"
            jsonl_temp_path.write_text(final_jsonl_content, encoding='utf-8')
            
            upload_file_to_s3(jsonl_temp_path, S3_BUCKET_NAME, JSONL_METADATA_KEY)
            logging.info("Updated main JSONL metadata file.")
            
        except Exception as e:
            logging.error(f"Failed to update global JSONL metadata: {e}")

        
        # This is the SUCCESS return
        return {
            "status": "success",
            "pdf_id": pdf_id,
            "filename": filename,
            "extracted_elements": len(elements_metadata),
            "ingested_chunks": ingested_count,
            "s3_path": f"s3://{S3_BUCKET_NAME}/{final_s3_key_prefix}/"
        }

    except Exception as e:
        raise e

    finally:
        # --- 7. CLEANUP ---
        if temp_dir.exists():
            shutil.rmtree(temp_dir)
            logging.info(f"Cleaned up temporary directory: {temp_dir}")