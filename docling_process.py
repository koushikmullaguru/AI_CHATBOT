"""
Advanced PDF Processing Pipeline with Language Detection and JSONL Metadata Generation

Features:
- Nested directory traversal
- Language detection (skip non-English PDFs)
- Extract text, tables, and images with Docling
- Generate clean Markdown with proper headers and page numbering
- Create JSONL metadata for RAG/chunking pipelines
"""

import json
import base64
import re
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from io import BytesIO
from datetime import datetime
import random

# Third-party imports
from docling.document_converter import DocumentConverter, PdfFormatOption
from docling.datamodel.base_models import InputFormat
from docling.datamodel.pipeline_options import PdfPipelineOptions, TesseractCliOcrOptions
from docling_core.types.doc import ImageRefMode, PictureItem, TableItem
from langdetect import detect, DetectorFactory
from pydantic import BaseModel


# Ensure consistent language detection
DetectorFactory.seed = 0


class ElementMetadata(BaseModel):
    """Structured metadata for each document element"""
    pdf_id: str
    pdf_path: str
    markdown_path: str
    page_number: int
    element_id: str
    element_type: str  # "text", "table", "image"
    element_order: int
    content_text: Optional[str] = None
    table_csv_path: Optional[str] = None
    table_image_path: Optional[str] = None
    image_path: Optional[str] = None
    caption: Optional[str] = None
    bounding_box: Optional[List[float]] = None
    language: str = "en"
    source_type: str = "docling"
    extraction_timestamp: str


def detect_language_from_pdf(pdf_path: Path, sample_size: int = 200) -> str:
    """
    Detect language by sampling random text from PDF.
    Returns 'en' for English, or other ISO language codes.
    """
    try:
        # Quick conversion without OCR for language detection
        pipeline_options = PdfPipelineOptions()
        pipeline_options.do_ocr = False
        pipeline_options.do_table_structure = False
        
        converter = DocumentConverter(
            format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
        )
        
        doc = converter.convert(pdf_path).document
        
        # Extract text from document
        full_text = doc.export_to_markdown()
        
        # Clean text (remove markdown syntax, special chars)
        clean_text = re.sub(r'[#*_\[\]()!]', '', full_text)
        clean_text = re.sub(r'\s+', ' ', clean_text).strip()
        
        if not clean_text or len(clean_text) < 50:
            print(f"  ⚠️  Insufficient text for language detection")
            return "unknown"
        
        # Sample random words
        words = clean_text.split()
        if len(words) > sample_size:
            # Take random sample
            sample_indices = random.sample(range(len(words)), min(sample_size, len(words)))
            sample_words = [words[i] for i in sorted(sample_indices)]
            sample_text = ' '.join(sample_words)
        else:
            sample_text = clean_text
        
        # Detect language
        detected_lang = detect(sample_text)
        print(f"  → Detected language: {detected_lang}")
        return detected_lang
        
    except Exception as e:
        print(f"  ⚠️  Language detection failed: {e}")
        return "unknown"


def find_all_pdfs(root_dir: Path) -> List[Path]:
    """Recursively find all PDF files in directory tree"""
    return list(root_dir.rglob("*.pdf"))


def create_pdf_id(pdf_path: Path) -> str:
    """Create a unique, clean ID from PDF filename"""
    # Remove extension and clean special characters
    pdf_id = pdf_path.stem
    pdf_id = re.sub(r'[^\w\-]', '_', pdf_id)
    return pdf_id


def extract_caption_from_context(doc, element, window: int = 2) -> Optional[str]:
    """
    Try to extract caption by looking at nearby text elements.
    This is a simple heuristic - you may need to customize.
    """
    # This is a placeholder - Docling's API may have better caption detection
    # You would iterate through doc elements and find text near the table/image
    return None


def process_single_pdf(
    pdf_path: Path,
    output_root: Path,
    ocr_path: str = "/opt/homebrew/bin/tesseract"
) -> List[ElementMetadata]:
    """
    Process a single PDF and return list of element metadata.
    """
    pdf_id = create_pdf_id(pdf_path)
    print(f"\n📄 Processing: {pdf_path.name} (ID: {pdf_id})")
    
    # Setup output directory
    odir = output_root / pdf_id
    odir.mkdir(parents=True, exist_ok=True)
    
    # Configure Docling pipeline
    pipeline_options = PdfPipelineOptions()
    pipeline_options.do_ocr = True
    pipeline_options.ocr_options = TesseractCliOcrOptions(
        path=ocr_path,
        lang=["eng"],
        force_full_page_ocr=False
    )
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    pipeline_options.do_formula_enrichment = True
    pipeline_options.generate_picture_images = True
    pipeline_options.images_scale = 2.0
    pipeline_options.generate_page_images = False
    
    converter = DocumentConverter(
        format_options={InputFormat.PDF: PdfFormatOption(pipeline_options=pipeline_options)}
    )
    
    # Convert document
    doc = converter.convert(pdf_path).document
    
    # Markdown output path
    md_path = odir / f"{pdf_id}.md"
    
    # Track metadata for all elements
    elements_metadata: List[ElementMetadata] = []
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    # Track tables and images for later reference
    table_counter = 0
    image_counter = 0
    
    # Process tables
    print(f"  📊 Extracting tables...")
    for idx, tbl in enumerate(doc.tables, start=1):
        df = tbl.export_to_dataframe()
        if df.empty:
            continue
        
        table_counter += 1
        
        # Save CSV
        csv_path = odir / f"{pdf_id}_table_{table_counter}.csv"
        df.to_csv(csv_path, index=False)
        
        # Save table image if available
        tbl_image_path = None
        if isinstance(tbl, TableItem):
            tbl_img = tbl.get_image(doc)
            if tbl_img:
                img_path = odir / f"{pdf_id}_table_{table_counter}_image.png"
                tbl_img.save(img_path, "PNG")
                tbl_image_path = str(img_path)
        
        # Get table as markdown text
        table_md = df.to_markdown(index=False)
        
        # Create metadata entry for table
        element_meta = ElementMetadata(
            pdf_id=pdf_id,
            pdf_path=str(pdf_path.resolve()),
            markdown_path=str(md_path),
            page_number=0,  # Will be updated when we parse markdown
            element_id=f"{pdf_id}_table_{table_counter}",
            element_type="table",
            element_order=idx,
            content_text=table_md,
            table_csv_path=str(csv_path),
            table_image_path=tbl_image_path,
            language="en",
            extraction_timestamp=timestamp
        )
        elements_metadata.append(element_meta)
        print(f"    → Table {table_counter} saved")
    
    # Process images
    print(f"  🖼️  Extracting images...")
    img_dir = odir / "images"
    img_dir.mkdir(exist_ok=True)
    
    for n, (elem, _) in enumerate(doc.iterate_items(), start=1):
        if isinstance(elem, PictureItem):
            image_counter += 1
            
            img = elem.get_image(doc)
            buf = BytesIO()
            img.save(buf, format="PNG")
            data = buf.getvalue()
            
            img_path = img_dir / f"{pdf_id}_img_{image_counter}.png"
            img_path.write_bytes(data)
            
            # Create metadata entry for image
            element_meta = ElementMetadata(
                pdf_id=pdf_id,
                pdf_path=str(pdf_path.resolve()),
                markdown_path=str(md_path),
                page_number=0,  # Will be updated
                element_id=f"{pdf_id}_img_{image_counter}",
                element_type="image",
                element_order=n,
                image_path=str(img_path),
                language="en",
                extraction_timestamp=timestamp
            )
            elements_metadata.append(element_meta)
            print(f"    → Image {image_counter} saved")
    
    # Save markdown with page breaks
    doc.save_as_markdown(
        md_path,
        image_mode=ImageRefMode.REFERENCED,
        page_break_placeholder="<!-- PAGE_BREAK -->"
    )
    
    # Add page numbers and proper headers to markdown
    add_page_headers_to_markdown(md_path)
    
    # Parse markdown to create text element metadata
    text_elements = parse_markdown_to_text_elements(
        md_path, pdf_id, pdf_path, timestamp
    )
    elements_metadata.extend(text_elements)
    
    print(f"  ✅ Processed {table_counter} tables, {image_counter} images, {len(text_elements)} text blocks")
    
    return elements_metadata


def add_page_headers_to_markdown(md_path: Path):
    """
    Split markdown by page breaks and add proper page headers.
    """
    content = md_path.read_text(encoding="utf-8")
    pages = content.split("<!-- PAGE_BREAK -->")
    
    numbered_pages = []
    for i, page in enumerate(pages, 1):
        page_content = page.strip()
        if not page_content:
            continue
        
        # Add clear page header
        page_header = f"# PAGE {i}\n\n"
        numbered_pages.append(page_header + page_content)
    
    md_path.write_text("\n\n".join(numbered_pages), encoding="utf-8")
    print(f"  📝 Added page headers to markdown")


def parse_markdown_to_text_elements(
    md_path: Path,
    pdf_id: str,
    pdf_path: Path,
    timestamp: str
) -> List[ElementMetadata]:
    """
    Parse markdown file to extract text blocks with page numbers.
    """
    content = md_path.read_text(encoding="utf-8")
    
    # Split by page headers
    page_pattern = r'# PAGE (\d+)\n\n'
    pages = re.split(page_pattern, content)
    
    text_elements = []
    element_counter = 0
    
    # Process pairs: page_number, page_content
    for i in range(1, len(pages), 2):
        page_num = int(pages[i])
        page_content = pages[i + 1] if i + 1 < len(pages) else ""
        
        if not page_content.strip():
            continue
        
        # Split page into sections by headers or paragraphs
        sections = split_text_into_sections(page_content)
        
        for section_order, section_text in enumerate(sections, 1):
            if len(section_text.strip()) < 20:  # Skip very short sections
                continue
            
            element_counter += 1
            
            element_meta = ElementMetadata(
                pdf_id=pdf_id,
                pdf_path=str(pdf_path.resolve()),
                markdown_path=str(md_path),
                page_number=page_num,
                element_id=f"{pdf_id}_p{page_num}_t{section_order}",
                element_type="text",
                element_order=section_order,
                content_text=section_text.strip(),
                language="en",
                extraction_timestamp=timestamp
            )
            text_elements.append(element_meta)
    
    return text_elements


def split_text_into_sections(text: str) -> List[str]:
    """
    Split text into logical sections based on headers and paragraphs.
    """
    # Split by markdown headers (##, ###, etc.)
    sections = re.split(r'\n(#{2,}\s+.+)\n', text)
    
    result = []
    current_section = ""
    
    for part in sections:
        if re.match(r'^#{2,}\s+', part):  # It's a header
            if current_section.strip():
                result.append(current_section.strip())
            current_section = part + "\n"
        else:
            current_section += part
    
    if current_section.strip():
        result.append(current_section.strip())
    
    # If no headers found, split by double newlines (paragraphs)
    if len(result) <= 1:
        result = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    return result


def process_pdfs_in_directory(
    input_root: str,
    output_root: str,
    jsonl_output: str,
    skip_non_english: bool = True,
    ocr_path: str = "/opt/homebrew/bin/tesseract"
):
    """
    Main pipeline: process all PDFs in nested directories.
    
    Args:
        input_root: Root directory containing PDFs
        output_root: Directory to store outputs (markdown, images, tables)
        jsonl_output: Path to output JSONL metadata file
        skip_non_english: Whether to skip non-English PDFs
        ocr_path: Path to Tesseract OCR binary
    """
    input_root = Path(input_root)
    output_root = Path(output_root)
    jsonl_output = Path(jsonl_output)
    
    # Create output directories
    output_root.mkdir(parents=True, exist_ok=True)
    jsonl_output.parent.mkdir(parents=True, exist_ok=True)
    
    # Find all PDFs
    pdf_files = find_all_pdfs(input_root)
    print(f"🔍 Found {len(pdf_files)} PDF files in {input_root}\n")
    
    if not pdf_files:
        print("❌ No PDF files found!")
        return
    
    # Open JSONL file for writing
    all_metadata = []
    processed_count = 0
    skipped_count = 0
    
    with open(jsonl_output, 'w', encoding='utf-8') as jsonl_file:
        for pdf_path in pdf_files:
            try:
                # Language detection
                if skip_non_english:
                    detected_lang = detect_language_from_pdf(pdf_path)
                    
                    if detected_lang not in ['en', 'unknown']:
                        print(f"  ⏭️  Skipping non-English PDF (detected: {detected_lang})\n")
                        skipped_count += 1
                        continue
                    elif detected_lang == 'unknown':
                        print(f"  ⚠️  Language unknown, processing anyway...\n")
                
                # Process PDF
                elements = process_single_pdf(pdf_path, output_root, ocr_path)
                
                # Write each element as a line in JSONL
                for element in elements:
                    jsonl_file.write(element.model_dump_json() + '\n')
                
                all_metadata.extend(elements)
                processed_count += 1
                print(f"  ✅ Successfully processed!\n")
                
            except Exception as e:
                print(f"  ❌ Error processing {pdf_path.name}: {e}\n")
                continue
    
    # Summary
    print("\n" + "="*60)
    print(f"📊 PROCESSING SUMMARY")
    print("="*60)
    print(f"Total PDFs found: {len(pdf_files)}")
    print(f"Successfully processed: {processed_count}")
    print(f"Skipped (non-English): {skipped_count}")
    print(f"Total elements extracted: {len(all_metadata)}")
    print(f"  - Text blocks: {sum(1 for e in all_metadata if e.element_type == 'text')}")
    print(f"  - Tables: {sum(1 for e in all_metadata if e.element_type == 'table')}")
    print(f"  - Images: {sum(1 for e in all_metadata if e.element_type == 'image')}")
    print(f"\n📁 Outputs:")
    print(f"  - Markdown files: {output_root}")
    print(f"  - JSONL metadata: {jsonl_output}")
    print("="*60)


# Example usage
if __name__ == "__main__":
    # Configure your paths
    INPUT_DIR = "class10"  # Root directory with nested PDFs
    OUTPUT_DIR = "outputs"     # Where to store markdown, images, tables
    JSONL_FILE = "dataset/ncert_metadata.jsonl"  # Metadata output
    
    # Run the pipeline
    process_pdfs_in_directory(
        input_root=INPUT_DIR,
        output_root=OUTPUT_DIR,
        jsonl_output=JSONL_FILE,
        skip_non_english=True,
        ocr_path="/opt/homebrew/bin/tesseract"  # Adjust for your system
    )