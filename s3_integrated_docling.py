import json
import logging
import re
import shutil
import subprocess
import os
import random
import sys
from collections.abc import Iterable
from pathlib import Path
from typing import List, Dict, Optional, Tuple, Set
from io import BytesIO, StringIO
from datetime import datetime

# Third-party imports
import boto3
from botocore.exceptions import NoCredentialsError, ClientError
from dotenv import load_dotenv

# Docling Imports
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat, ItemAndImageEnrichmentElement
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
from docling.pipeline.standard_pdf_pipeline import StandardPdfPipeline
from docling.models.base_model import BaseItemAndImageEnrichmentModel
from docling_core.types.doc import (
    ImageRefMode, 
    PictureItem, 
    TableItem, 
    DocItemLabel, 
    DoclingDocument, 
    NodeItem, 
    TextItem
)
from langdetect import detect, DetectorFactory, LangDetectException
from pydantic import BaseModel


# CONFIGURATION & INITIALIZATION

# Load environment variables from .env file
load_dotenv() 

# AWS CREDENTIALS
AWS_ACCESS_KEY_ID = os.getenv("AWS_ACCESS_KEY_ID")
AWS_SECRET_ACCESS_KEY = os.getenv("AWS_SECRET_ACCESS_KEY")
AWS_REGION = os.getenv("AWS_REGION")
S3_BUCKET_NAME = os.getenv("S3_BUCKET_NAME") 

# PIPELINE CONFIGURATION
INPUT_LOCAL_DIR = "Social Science"
INPUT_S3_PREFIX = "input_pdfs7"
OUTPUT_S3_PREFIX = "output_extractions7"
LOCAL_CACHE_DIR = Path(".s3_cache")

# FILTER CONSTANT
IMAGE_SIZE_THRESHOLD_KB = 40 

# Ensure consistent language detection
DetectorFactory.seed = 0

# Setup logging
logging.basicConfig(level=logging.INFO)

# Check for mandatory environment variables
MANDATORY_VARS = {
    "S3_BUCKET_NAME": S3_BUCKET_NAME,
    "AWS_ACCESS_KEY_ID": AWS_ACCESS_KEY_ID,
    "AWS_SECRET_ACCESS_KEY": AWS_SECRET_ACCESS_KEY,
    "AWS_REGION": AWS_REGION
}
missing_vars = [k for k, v in MANDATORY_VARS.items() if not v]

if missing_vars:
    logging.error("--- CRITICAL CONFIGURATION ERROR ---")
    logging.error(f"The following mandatory AWS variables are missing from your .env file: {', '.join(missing_vars)}")
    sys.exit(1)

# Initialize S3 Client
s3_client_params = {
    'aws_access_key_id': AWS_ACCESS_KEY_ID,
    'aws_secret_access_key': AWS_SECRET_ACCESS_KEY,
    'region_name': AWS_REGION,
}

s3_client = None
try:
    s3_client = boto3.client('s3', **s3_client_params)
    logging.info("✓ AWS S3 Client initialized using explicit .env credentials.")
except Exception as e:
    logging.error(f"Could not initialize S3 client: {e}. Double-check your credentials and region in the .env file.")
    sys.exit(1)


# S3 UTILITY FUNCTIONS

def upload_file_to_s3(local_path: Path, bucket_name: str, s3_key: str):
    try:
        s3_client.upload_file(str(local_path), bucket_name, s3_key)
        logging.info(f"(S3) ↑ Uploaded {local_path.name} to s3://{bucket_name}/{s3_key}")
    except (NoCredentialsError, ClientError) as e:
        logging.error(f"S3 Upload failed for {local_path.name}: {e}")
        raise

def download_file_from_s3(bucket_name: str, s3_key: str, local_path: Path):
    local_path.parent.mkdir(parents=True, exist_ok=True)
    try:
        s3_client.download_file(bucket_name, s3_key, str(local_path))
        logging.info(f"(S3) ↓ Downloaded s3://{bucket_name}/{s3_key} to {local_path.name}")
    except ClientError as e:
        if e.response['Error']['Code'] == "404":
            logging.error(f"S3 file not found: {s3_key}")
        else:
            logging.error(f"S3 Download failed for {s3_key}: {e}")
        raise

def upload_folder_to_s3_recursive(local_folder: Path, bucket_name: str, s3_prefix: str):
    for path in local_folder.rglob('*'):
        if path.is_file():
            relative_path = path.relative_to(local_folder)
            s3_key = f"{s3_prefix}/{os.fspath(relative_path).replace(os.path.sep, '/')}" 
            
            try:
                s3_client.upload_file(str(path), bucket_name, str(s3_key))
                logging.info(f"(S3) ↑ Uploaded {relative_path} to S3")
            except (NoCredentialsError, ClientError) as e:
                logging.error(f"S3 Upload failed for {relative_path}: {e}")
                raise

def list_pdfs_in_s3(bucket_name: str, prefix: str) -> List[str]:
    pdfs = []
    paginator = s3_client.get_paginator('list_objects_v2')
    
    try:
        pages = paginator.paginate(Bucket=bucket_name, Prefix=prefix)
        for page in pages:
            if 'Contents' in page:
                for obj in page['Contents']:
                    key = obj['Key']
                    if key.lower().endswith('.pdf') and obj.get('Size', 0) > 0 and not key.endswith('/'):
                        pdfs.append(key)
    except ClientError as e:
        logging.error(f"S3 ListObjectsV2 failed for prefix {prefix}: {e}")
        raise
    
    return pdfs


# FORMULA ENRICHMENT MODELS

class EnhancedFormulaUnderstandingPipelineOptions(PdfPipelineOptions):
    do_formula_understanding: bool = True
    save_formula_images: bool = True

class FormulaUnderstandingEnrichmentModel(BaseItemAndImageEnrichmentModel):
    images_scale = 2.6

    def __init__(self, enabled: bool, save_images: bool = True, output_dir: Optional[Path] = None):
        self.enabled = enabled
        self.save_images = save_images
        self.output_dir = output_dir
        self.formula_counter = 0

    def is_processable(self, doc: DoclingDocument, element: NodeItem) -> bool:
        return (
            self.enabled
            and isinstance(element, TextItem)
            and element.label == DocItemLabel.FORMULA
        )

    def __call__(
        self,
        doc: DoclingDocument,
        element_batch: Iterable[ItemAndImageEnrichmentElement],
    ) -> Iterable[NodeItem]:
        if not self.enabled:
            return

        for enrich_element in element_batch:
            self.formula_counter += 1
            
            if self.save_images and self.output_dir and enrich_element.image:
                try:
                    formula_dir = self.output_dir / "formulas"
                    formula_dir.mkdir(exist_ok=True)
                    
                    img_path = formula_dir / f"formula_{self.formula_counter}.png"
                    enrich_element.image.save(img_path, "PNG")
                    
                    if hasattr(enrich_element.item, 'metadata'):
                        enrich_element.item.metadata = {
                            'formula_image_path': str(img_path),
                            'formula_id': self.formula_counter
                        }
                except Exception as e:
                    logging.warning(f"Could not save formula image: {e}")
            
            yield enrich_element.item


class EnhancedFormulaUnderstandingPipeline(StandardPdfPipeline):
    def __init__(self, pipeline_options: EnhancedFormulaUnderstandingPipelineOptions, output_dir: Optional[Path] = None):
        super().__init__(pipeline_options)
        self.pipeline_options: EnhancedFormulaUnderstandingPipelineOptions
        
        self.enrichment_pipe = [
            FormulaUnderstandingEnrichmentModel(
                enabled=self.pipeline_options.do_formula_understanding,
                save_images=self.pipeline_options.save_formula_images,
                output_dir=output_dir 
            )
        ]
        
        if self.pipeline_options.do_formula_understanding:
            self.keep_backend = True

    @classmethod
    def get_default_options(cls) -> EnhancedFormulaUnderstandingPipelineOptions:
        return EnhancedFormulaUnderstandingPipelineOptions()


# HELPER FUNCTIONS (OCR/Tesseract/Metadata/Lang)

def find_tesseract() -> Optional[str]:
    common_paths = [
        "/opt/homebrew/bin/tesseract", "/usr/local/bin/tesseract", "/usr/bin/tesseract", "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
    ]
    
    for path in common_paths:
        if Path(path).exists():
            if verify_tesseract(path):
                print(f"✓ Found working Tesseract at: {path}")
                return path
    
    try:
        result = shutil.which("tesseract")
        if result and verify_tesseract(result):
            print(f"✓ Found working Tesseract at: {result}")
            return result
    except Exception:
        pass
    
    print(" ⚠️ Tesseract not found or not working. OCR will be disabled.")
    return None


def verify_tesseract(tesseract_path: str) -> bool:
    try:
        result = subprocess.run([tesseract_path, "--version"], capture_output=True, text=True, timeout=5)
        if result.returncode != 0: return False
        
        result = subprocess.run([tesseract_path, "--list-langs"], capture_output=True, text=True, timeout=5)
        
        if result.returncode != 0:
            print(f"⚠️ Tesseract found but language data missing")
            return False
        
        if 'eng' not in result.stdout:
            print(f"⚠️ English language data not found for Tesseract")
            return False
        
        return True
    except Exception as e:
        print(f"⚠️ Tesseract verification failed: {e}")
        return False


class ElementMetadata(BaseModel):
    pdf_id: str
    pdf_path: str
    markdown_path: str
    page_number: int
    element_id: str
    element_type: str
    element_order: int
    content_text: Optional[str] = None
    table_csv_path: Optional[str] = None
    table_image_path: Optional[str] = None
    image_path: Optional[str] = None
    formula_image_path: Optional[str] = None
    caption: Optional[str] = None
    bounding_box: Optional[List[float]] = None
    language: str = "en"
    source_type: str = "docling"
    extraction_timestamp: str


def detect_language_from_pdf(pdf_path: Path, sample_size: int = 200) -> str:
    try:
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False
        pipeline_options.do_table_structure = False
        converter = DocumentConverter(
            format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
        )
        doc = converter.convert(pdf_path).document
        full_text = doc.export_to_markdown()
        clean_text = re.sub(r'[#*_\[\]()!]', '', full_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        if not clean_text or len(clean_text) < 50: return "unknown"
        words = clean_text.split()
        if len(words) > sample_size:
            sample_indices = random.sample(range(len(words)), min(sample_size, len(words)))
            sample_text = ' '.join([words[i] for i in sorted(sample_indices)])
        else:
            sample_text = clean_text
        detected_lang = detect(sample_text)
        print(f"→ Detected language: {detected_lang}")
        return detected_lang
    except Exception as e:
        print(f"⚠️ Language detection failed: {e}")
        return "unknown"


def create_pdf_id(pdf_s3_key: str) -> str:
    pdf_id = Path(pdf_s3_key).stem
    pdf_id = re.sub(r'[^\w\-]', '_', pdf_id)
    return pdf_id


def add_page_headers_to_markdown(md_path: Path):
    """Correctly splits markdown by the Docling page break placeholder."""
    PAGE_BREAK_PLACEHOLDER = ""
    try:
        content = md_path.read_text(encoding="utf-8")
        pages = content.split(PAGE_BREAK_PLACEHOLDER)
        
        numbered_pages = []
        for i, page in enumerate(pages, 1):
            page_content = page.strip()
            if not page_content: continue
            
            page_header = f"# PAGE {i}\n\n"
            numbered_pages.append(page_header + page_content)
        
        if numbered_pages:
            md_path.write_text("\n\n".join(numbered_pages), encoding="utf-8")
            print(f"📝 Added page headers to markdown")
    except Exception as e:
        print(f"⚠️ Could not add page headers: {e}")


def parse_markdown_to_text_elements(
    md_path: Path, pdf_id: str, pdf_s3_key: str, md_s3_key: str, timestamp: str
) -> List[ElementMetadata]:
    try:
        content = md_path.read_text(encoding="utf-8")
        page_pattern = r'# PAGE (\d+)\n\n'
        pages = re.split(page_pattern, content)
        
        text_elements = []
        element_counter = 0
        
        for i in range(1, len(pages), 2):
            page_num = int(pages[i])
            page_content = pages[i + 1] if i + 1 < len(pages) else ""
            
            if not page_content.strip(): continue
            
            sections = split_text_into_sections(page_content)
            
            for section_order, section_text in enumerate(sections, 1):
                # IMPORTANT: Skip text elements that were consumed as captions
                if re.match(r'^\[CAPTION\]: ', section_text.strip(), re.IGNORECASE):
                    continue
                if len(section_text.strip()) < 20: continue
                
                element_counter += 1
                
                element_meta = ElementMetadata(
                    pdf_id=pdf_id, pdf_path=pdf_s3_key, markdown_path=md_s3_key, page_number=page_num,
                    element_id=f"{pdf_id}_p{page_num}_t{section_order}", element_type="text",
                    element_order=section_order, content_text=section_text.strip(),
                    language="en", extraction_timestamp=timestamp
                )
                text_elements.append(element_meta)
        
        return text_elements
    except Exception as e:
        print(f"⚠️ Error parsing markdown: {e}")
        return []


def split_text_into_sections(text: str) -> List[str]:
    sections = re.split(r'\n(#{2,}\s+.+)\n', text)
    result = []
    current_section = ""
    for part in sections:
        if re.match(r'^#{2,}\s+', part):
            if current_section.strip(): result.append(current_section.strip())
            current_section = part + "\n"
        else:
            current_section += part
    if current_section.strip(): result.append(current_section.strip())
    if len(result) <= 1:
        result = [p.strip() for p in text.split('\n\n') if p.strip()]
    return result

# IMAGE LINK FIX AND CONSOLIDATION

def rewrite_markdown_image_links_to_s3(
    md_path: Path, 
    pdf_id: str, 
    bucket_name: str, 
    output_s3_prefix: str,
    final_image_map: Dict[str, str] # {sequential_index_str: final_filename}
):
    """
    Rewrites Docling's image links to the final sequential filenames using the 
    provided map. Links for eliminated images are removed.
    """
    try:
        content = md_path.read_text(encoding='utf-8')
        image_tag_pattern = r'(!\[Image\]\((.+?)\))' 
        s3_base_key = f"{output_s3_prefix}/{pdf_id}/images/"
        
        current_image_index = 0
        
        def replace_link(match):
            nonlocal current_image_index
            
            # Increment counter for every image link found in the document order
            current_image_index += 1
            
            # The key in the final_image_map is the sequential index (1-based)
            sequential_key = str(current_image_index) 

            if sequential_key in final_image_map:
                # Image was saved (passed filter)
                final_filename = final_image_map[sequential_key]
                full_s3_key = f"s3://{bucket_name}/{s3_base_key}{final_filename}"
                return f"![Image]({full_s3_key})"
            else:
                # Image was eliminated (below 40 KB) - remove the link from markdown
                return ""

        final_content = re.sub(image_tag_pattern, replace_link, content)
        
        md_path.write_text(final_content, encoding='utf-8')
        print(f"✅ Markdown image links cleaned (rewritten/eliminated based on size filter).")
    except Exception as e:
        print(f"⚠️ Error cleaning markdown paths: {e}")

def consolidate_local_outputs_for_s3(
    odir_local: Path, 
    doc_id: str, 
    bucket_name: str, 
    output_s3_prefix: str,
    saved_image_map: Dict[int, Path] # {sequential_index: local_path_to_saved_image}
) -> Tuple[Path, Dict[str, str]]:
    """
    Consolidates necessary files, renames saved images to sequential format, 
    and returns the final file map for Markdown link correction.
    """
    clean_odir_local = odir_local.parent / f"{doc_id}_clean_for_upload"
    clean_odir_local.mkdir(parents=True, exist_ok=True)
    clean_img_dir = clean_odir_local / "images"
    clean_img_dir.mkdir(exist_ok=True) 
    
    final_image_map = {} # {sequential_index_str: final_filename}
    
    # 1. Rename and Move ALL SAVED image files to the sequential name
    for sequential_index, local_path in saved_image_map.items():
        new_name = f"{doc_id}_img_{sequential_index}.png"
        shutil.move(local_path, clean_img_dir / new_name)
        final_image_map[str(sequential_index)] = new_name
    
    # 2. Markdown file: Rewrite links using the final_image_map
    md_path = odir_local / f"{doc_id}.md"
    if md_path.exists():
        rewrite_markdown_image_links_to_s3(
            md_path, doc_id, bucket_name, output_s3_prefix, final_image_map
        ) 
        shutil.move(md_path, clean_odir_local / md_path.name)
        
    # 3. Move CSV files
    for f in odir_local.glob('*.csv'):
        shutil.move(f, clean_odir_local / f.name)
        
    # 4. Clean up original working folders
    if (odir_local / "images").exists(): shutil.rmtree(odir_local / "images")
    if (odir_local / "formulas").exists(): shutil.rmtree(odir_local / "formulas")
    if odir_local.exists(): shutil.rmtree(odir_local)
        
    print(f"✨ Consolidated temporary folder created at: {clean_odir_local.name}")
    return clean_odir_local, final_image_map

# CAPTION FIX HELPER

def extract_caption_from_neighbors(
    doc: DoclingDocument, 
    image_item: Optional[PictureItem], 
    items: List[Tuple[NodeItem, Optional[int]]],
    item_index: int
) -> Tuple[Optional[str], int]:
    """
    Scans immediately surrounding items in the document flow for captions.
    Returns the found caption text and the number of text items to skip (to avoid double-counting).
    """
    caption_text = None
    items_to_skip = 0
    
    # A. Check the item immediately *after* the image (index + 1)
    if item_index + 1 < len(items):
        next_item, _ = items[item_index + 1]
        if isinstance(next_item, TextItem):
            text = next_item.text.strip()
            # Look for explicit figure/table labels or short, concentrated text
            if re.match(r'^(fig|table|chart)\.\s*\d+(\.\d+)?', text, re.IGNORECASE) or (len(text.split()) < 30 and len(text) < 150):
                caption_text = text
                items_to_skip = 1
                return caption_text, items_to_skip

    # B. If no caption found immediately after, check the item immediately *before* (index - 1)
    if item_index - 1 >= 0 and items_to_skip == 0:
        prev_item, _ = items[item_index - 1]
        if isinstance(prev_item, TextItem):
            text = prev_item.text.strip()
            # Only consider it a caption if it's very short and looks like one
            if re.match(r'^(fig|table|chart)\.\s*\d+(\.\d+)?', text, re.IGNORECASE) or (len(text.split()) < 30 and len(text) < 150):
                caption_text = text
                # We do NOT skip the preceding item here
                return caption_text, 0
            
    return None, 0


# PDF PROCESSING (FINAL)

def process_single_pdf(
    pdf_local_path: Path,
    pdf_s3_key: str,
    output_local_root: Path,
    bucket_name: str, 
    output_s3_prefix: str,
    ocr_path: Optional[str] = None,
    enable_formula_understanding: bool = True
) -> Tuple[List[ElementMetadata], Path]:
    
    pdf_id = create_pdf_id(pdf_s3_key)
    print(f"\n📄 Processing: {pdf_local_path.name} (ID: {pdf_id})")
    print(f"🖼️ Image Filter: KEEP > {IMAGE_SIZE_THRESHOLD_KB} KB")
    
    odir_local = output_local_root / pdf_id
    odir_local.mkdir(parents=True, exist_ok=True)
    
    # Pipeline Setup
    pipeline_options = EnhancedFormulaUnderstandingPipelineOptions()
    
    if ocr_path and verify_tesseract(ocr_path):
        pipeline_options.do_ocr = True
        pipeline_options.ocr_options = TesseractCliOcrOptions(path=ocr_path, lang=["eng"], force_full_page_ocr=False)
        print(f"✓ OCR enabled with Tesseract")
    else:
        pipeline_options.do_ocr = False
        print(f"⚠️ OCR disabled (processing without OCR)")
    
    pipeline_options.do_formula_understanding = enable_formula_understanding
    pipeline_options.save_formula_images = True
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    pipeline_options.generate_picture_images = True
    pipeline_options.images_scale = 2.0
    pipeline_options.generate_page_images = False
    
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_cls=EnhancedFormulaUnderstandingPipeline,
                pipeline_options=pipeline_options,
                pipeline_args={'output_dir': odir_local} 
            )
        }
    )
    
    try:
        result = converter.convert(pdf_local_path)
        doc = result.document
    except Exception as e:
        print(f"❌ Conversion failed: {e}")
        raise
    
    # Extraction, Filtering, and Caption Grouping
    md_local_path = odir_local / f"{pdf_id}.md" 
    md_s3_key = f"{output_s3_prefix}/{pdf_id}/{pdf_id}.md" 
    
    elements_metadata: List[ElementMetadata] = []
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    table_counter = 0
    image_counter_sequential = 0 
    
    # {sequential_index: local_path_to_saved_image}
    saved_image_map: Dict[int, Path] = {} 
    
    # Get all document items in reading order
    document_items = list(doc.iterate_items())
    
    # Buffers for the final Markdown content and elements to skip
    final_markdown_elements = []
    items_to_skip_in_markdown = set()
    
    # Process items sequentially using the master list index
    for i, (item, _) in enumerate(document_items):
        
        # Skip items marked for elimination (like consumed captions)
        if i in items_to_skip_in_markdown:
            continue
        
        # 1. Handle Tables (Metadata and Local Save)
        if isinstance(item, TableItem):
            
            try:
                df = item.export_to_dataframe()
                if df.empty: continue
                
                table_counter += 1
                csv_local_path = odir_local / f"{pdf_id}_table_{table_counter}.csv"
                csv_s3_key = f"{output_s3_prefix}/{pdf_id}/{csv_local_path.name}" 
                df.to_csv(csv_local_path, index=False)
                
                tbl_image_s3_key = None
                
                # Find caption for the table
                caption_text, items_to_skip = extract_caption_from_neighbors(doc, None, document_items, i)
                if items_to_skip > 0:
                    items_to_skip_in_markdown.add(i + items_to_skip)
                
                table_md = df.to_markdown(index=False)
                
                element_meta = ElementMetadata(
                    pdf_id=pdf_id, pdf_path=pdf_s3_key, markdown_path=md_s3_key, page_number=0, 
                    element_id=f"{pdf_id}_table_{table_counter}", element_type="table",
                    element_order=i, content_text=table_md, table_csv_path=csv_s3_key, 
                    table_image_path=tbl_image_s3_key, caption=caption_text, language="en", extraction_timestamp=timestamp
                )
                elements_metadata.append(element_meta)
                
                # Append formatted content to the final markdown buffer
                final_markdown_elements.append(f"\n\n# TABLE {table_counter}\n")
                if caption_text:
                    final_markdown_elements.append(f"[CAPTION]: {caption_text}\n")
                final_markdown_elements.append(table_md)
                
                print(f"→ Table {table_counter} saved (Caption: {caption_text is not None})")
            except Exception as e:
                print(f"⚠️ Error processing table {i}: {e}")
                continue

        # 2. Handle Images (PictureItem)
        elif isinstance(item, PictureItem):
            try:
                # Get image data and check size filter
                img = item.get_image(doc)
                buf = BytesIO()
                img.save(buf, format="PNG")
                img_data = buf.getvalue()
                file_size_kb = len(img_data) / 1024
                
                img_s3_key = None
                caption_text = None
                
                # Find caption before filtering 
                caption_text, items_to_skip = extract_caption_from_neighbors(doc, item, document_items, i)
                if items_to_skip > 0:
                    items_to_skip_in_markdown.add(i + items_to_skip)
                
                # Filtering Logic
                if file_size_kb > IMAGE_SIZE_THRESHOLD_KB:
                    image_counter_sequential += 1
                    
                    # Save image with a temporary name for sorting later
                    img_local_path = odir_local / "images" / f"temp_img_{image_counter_sequential}.png"
                    img_local_path.parent.mkdir(parents=True, exist_ok=True)
                    img_local_path.write_bytes(img_data)
                    saved_image_map[image_counter_sequential] = img_local_path
                    
                    # S3 key will use the final sequential name
                    final_name = f"{pdf_id}_img_{image_counter_sequential}.png"
                    img_s3_key = f"{output_s3_prefix}/{pdf_id}/images/{final_name}"
                    
                    # Append Image to Markdown Buffer
                    image_tag = f"\n\n![Image](s3://{bucket_name}/{img_s3_key})"
                    if caption_text:
                        image_tag = f"\n\n[CAPTION]: {caption_text}\n" + image_tag
                    final_markdown_elements.append(image_tag)
                    
                    print(f"→ Image saved (Size: {file_size_kb:.2f} KB) (Caption: {caption_text is not None})")
                else:
                    print(f"→ Image ELIMINATED (Size: {file_size_kb:.2f} KB)")
                # End Filtering Logic

                element_meta = ElementMetadata(
                    pdf_id=pdf_id, pdf_path=pdf_s3_key, markdown_path=md_s3_key, page_number=0,
                    element_id=f"{pdf_id}_img_{i}", element_type="image",
                    element_order=i, image_path=img_s3_key, caption=caption_text, language="en", 
                    extraction_timestamp=timestamp
                )
                elements_metadata.append(element_meta)
            except Exception as e:
                print(f"⚠️ Error extracting image {i}: {e}")
                continue

        # 3. Handle Text Items (including Formulas)
        elif isinstance(item, TextItem):
            text = item.text.strip()
            
            # Check if this TextItem should be skipped (consumed as a caption)
            if i in items_to_skip_in_markdown:
                 continue
                 
            # If it's a Formula, save metadata
            if item.label == DocItemLabel.FORMULA:
                formula_counter = len([e for e in elements_metadata if e.element_type == 'formula']) + 1
                
                # Formula Image Filtering
                formula_dir_local = odir_local / "formulas"
                formula_img_local_path = formula_dir_local / f"formula_{formula_counter}.png"
                formula_img_s3_key = None
                
                if formula_img_local_path.exists():
                    file_size_kb = formula_img_local_path.stat().st_size / 1024
                    
                    if file_size_kb > IMAGE_SIZE_THRESHOLD_KB:
                        image_counter_sequential += 1
                        saved_image_map[image_counter_sequential] = formula_img_local_path 
                        
                        final_name = f"{pdf_id}_img_{image_counter_sequential}.png"
                        formula_img_s3_key = f"{output_s3_prefix}/{pdf_id}/images/{final_name}"
                        print(f"→ Formula Image saved (Size: {file_size_kb:.2f} KB)")
                        
                        # Append Formula to Markdown Buffer
                        formula_tag = f"\n\n$$ {text} $$\n"
                        final_markdown_elements.append(formula_tag)
                        
                    else:
                        formula_img_local_path.unlink()
                        print(f"→ Formula Image ELIMINATED (Size: {file_size_kb:.2f} KB)")
                # End Formula Image Filtering

                element_meta = ElementMetadata(
                    pdf_id=pdf_id, pdf_path=pdf_s3_key, markdown_path=md_s3_key, page_number=0, 
                    element_id=f"{pdf_id}_formula_{formula_counter}", element_type="formula",
                    element_order=i, content_text=text, formula_image_path=formula_img_s3_key,
                    language="en", extraction_timestamp=timestamp
                )
                elements_metadata.append(element_meta)
            
            # If it's standard text, headers, or lists
            else:
                final_markdown_elements.append(text)

        # 4. Handle other items (like PictureRef, etc.) by converting them to markdown
        else:
             final_markdown_elements.append(item.export_to_markdown())
        
    # Write the assembled content to the local Markdown file
    md_local_path.write_text('\n\n'.join(final_markdown_elements), encoding="utf-8")
    
    # Rerun page header logic (it cleans up the content flow)
    add_page_headers_to_markdown(md_local_path) 
    
    # Recalculate text elements based on the cleaned Markdown (skipping consumed captions)
    text_elements = parse_markdown_to_text_elements(md_local_path, pdf_id, pdf_s3_key, md_s3_key, timestamp)
    
    # Append the new text elements which have proper section/page grouping
    elements_metadata.extend(text_elements)
    
    # CONSOLIDATION STEP
    # Final image count is the size of the saved map
    image_count = len(saved_image_map) 
    print(f"Extracted {table_counter} tables, {image_count} images saved, {len(text_elements)} text blocks")

    clean_upload_folder, final_image_map = consolidate_local_outputs_for_s3(
        odir_local, pdf_id, bucket_name, output_s3_prefix, saved_image_map
    )
    
    return elements_metadata, clean_upload_folder


# MAIN S3 PIPELINE

def run_s3_docling_pipeline(
    bucket_name: str,
    input_s3_prefix: str,
    output_s3_prefix: str,
    local_cache_dir: Path,
    jsonl_s3_key: str,
    skip_non_english: bool = True,
    ocr_path: Optional[str] = None,
    enable_formula_understanding: bool = True
):
    
    if s3_client is None: return

    local_cache_dir.mkdir(parents=True, exist_ok=True)
    if ocr_path is None:
        ocr_path = find_tesseract()

    pdf_s3_keys = list_pdfs_in_s3(bucket_name, input_s3_prefix)
    print(f"Found {len(pdf_s3_keys)} PDF files in s3://{bucket_name}/{input_s3_prefix}\n")
    
    if not pdf_s3_keys:
        print("No PDF files found in S3 bucket!")
        return

    all_metadata: List[ElementMetadata] = []
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    for pdf_s3_key in pdf_s3_keys:
        pdf_filename = Path(pdf_s3_key).name
        pdf_local_path = local_cache_dir / pdf_filename
        clean_upload_folder = None 
        
        try:
            download_file_from_s3(bucket_name, pdf_s3_key, pdf_local_path)

            if skip_non_english:
                detected_lang = detect_language_from_pdf(pdf_local_path)
                
                if detected_lang not in ['en', 'unknown']:
                    print(f"Skipping non-English PDF (detected: {detected_lang})\n")
                    skipped_count += 1
                    continue
                elif detected_lang == 'unknown':
                    print(f"⚠️ Language unknown, processing anyway...\n")
            
            pdf_output_cache_root = local_cache_dir / "outputs"
            elements, clean_upload_folder = process_single_pdf(
                pdf_local_path, pdf_s3_key, pdf_output_cache_root, bucket_name, output_s3_prefix, 
                ocr_path, enable_formula_understanding=enable_formula_understanding
            )
            
            all_metadata.extend(elements)
            
            pdf_id = create_pdf_id(pdf_s3_key)
            final_s3_key = f"{output_s3_prefix}/{pdf_id}"
            print(f"Uploading consolidated files to s3://{bucket_name}/{final_s3_key}/...")
            upload_folder_to_s3_recursive(clean_upload_folder, bucket_name, final_s3_key)
            
            processed_count += 1
            print(f"✅ Successfully processed and uploaded! (PDF: {pdf_id})\n")
            
        except Exception as e:
            print(f"❌ Error processing {pdf_filename}: {e}\n")
            error_count += 1
            continue
        finally:
            if pdf_local_path.exists():
                pdf_local_path.unlink()
            if clean_upload_folder and clean_upload_folder.exists():
                try:
                    shutil.rmtree(clean_upload_folder)
                except Exception as e:
                    logging.warning(f"Failed to clean up temporary folder: {e}")
                
    # Save and Upload JSONL Metadata
    if all_metadata:
        jsonl_local_path = local_cache_dir / Path(jsonl_s3_key).name
        with open(jsonl_local_path, 'w', encoding='utf-8') as jsonl_file:
            for element in all_metadata:
                jsonl_file.write(element.model_dump_json() + '\n')
        
        upload_file_to_s3(jsonl_local_path, bucket_name, jsonl_s3_key)
        
        if jsonl_local_path.exists():
            jsonl_local_path.unlink()

    # Summary
    print("\n" + "="*60)
    print(f"S3 PIPELINE SUMMARY")
    print("="*60)
    print(f"Total PDFs found in S3: {len(pdf_s3_keys)}")
    print(f"Successfully processed: {processed_count}")
    print(f"Skipped (non-English): {skipped_count}")
    print(f"Errors: {error_count}")
    print(f"Total elements extracted: {len(all_metadata)}")
    print(f"Image Filter: KEEP > {IMAGE_SIZE_THRESHOLD_KB} KB")
    print(f"\n📁 S3 Outputs stored in: s3://{bucket_name}/{output_s3_prefix}/PDF_ID/")
    print(f"- JSONL Metadata: s3://{bucket_name}/{jsonl_s3_key}")
    print("="*60)


if __name__ == "__main__":
    
    # STEP 1: Upload input files from local directory to S3
    print(f"### STEP 1: UPLOADING LOCAL FILES TO S3 ###")
        
    input_local_path = Path(INPUT_LOCAL_DIR)
    
    if input_local_path.exists():
        print(f"Uploading local directory '{INPUT_LOCAL_DIR}' to s3://{S3_BUCKET_NAME}/{INPUT_S3_PREFIX}")
        try:
            upload_folder_to_s3_recursive(input_local_path, S3_BUCKET_NAME, INPUT_S3_PREFIX)
            print("Upload complete.\n")
        except ClientError as e:
            print(f"\nFATAL: S3 Upload Failed (Check IAM Permissions: s3:PutObject): {e}")
            sys.exit(1)
    else:
        print(f"Local input directory '{INPUT_LOCAL_DIR}' not found. Skipping local upload.")
        print("Assuming PDFs are already in S3 input prefix.\n")

    # STEP 2: Run the S3-integrated processing pipeline
    print(f"### STEP 2: RUNNING S3 PROCESSING PIPELINE ###")
    
    JSONL_S3_KEY = f"{OUTPUT_S3_PREFIX}/ncert_metadata.jsonl"
    
    try:
        run_s3_docling_pipeline(
            bucket_name=S3_BUCKET_NAME,
            input_s3_prefix=INPUT_S3_PREFIX,
            output_s3_prefix=OUTPUT_S3_PREFIX,
            local_cache_dir=LOCAL_CACHE_DIR,
            jsonl_s3_key=JSONL_S3_KEY,
            skip_non_english=True,
            ocr_path=None,
            enable_formula_understanding=True
        )
    except ClientError as e:
        print(f"\nFATAL: S3 Pipeline Failed (Check IAM Permissions: s3:ListBucket/s3:GetObject): {e}")
    except Exception as e:
        print(f"\nFATAL: Unhandled Pipeline Error: {e}")
    finally:
        # Final cleanup of the main cache folder
        if LOCAL_CACHE_DIR.exists():
            try:
                print(f"\nCleaning up main local cache directory: {LOCAL_CACHE_DIR}")
                shutil.rmtree(LOCAL_CACHE_DIR)
            except Exception as e:
                print(f"Error cleaning up cache: {e}")