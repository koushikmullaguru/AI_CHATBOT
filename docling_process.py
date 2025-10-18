"""
Advanced PDF Processing Pipeline with Formula Understanding for Math/Science PDFs

Features:
- Nested directory traversal
- Language detection (skip non-English PDFs)
- Extract text, tables, images, and mathematical formulas with Docling
- Enhanced formula understanding for math/science PDFs
- Generate clean Markdown with proper headers and page numbering
- Create JSONL metadata for RAG/chunking pipelines
- Improved error handling and Tesseract detection
"""

import json
import logging
import re
import shutil
import subprocess
from collections.abc import Iterable
from pathlib import Path
from typing import List, Dict, Optional, Tuple
from io import BytesIO
from datetime import datetime
import random

# Third-party imports
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


# Ensure consistent language detection
DetectorFactory.seed = 0

# Setup logging
logging.basicConfig(level=logging.INFO)


# ==================== FORMULA ENRICHMENT MODELS ====================

class EnhancedFormulaUnderstandingPipelineOptions(PdfPipelineOptions):
    """Extended pipeline options with formula understanding"""
    do_formula_understanding: bool = True
    save_formula_images: bool = True  # Save cropped formula images


class FormulaUnderstandingEnrichmentModel(BaseItemAndImageEnrichmentModel):
    """
    Enrichment model for processing mathematical formulas.
    Extracts and processes formula items from documents.
    """
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
            
            # Save formula image if requested
            if self.save_images and self.output_dir and enrich_element.image:
                try:
                    formula_dir = self.output_dir / "formulas"
                    formula_dir.mkdir(exist_ok=True)
                    
                    img_path = formula_dir / f"formula_{self.formula_counter}.png"
                    enrich_element.image.save(img_path, "PNG")
                    
                    # Add metadata to the element if possible
                    if hasattr(enrich_element.item, 'metadata'):
                        enrich_element.item.metadata = {
                            'formula_image_path': str(img_path),
                            'formula_id': self.formula_counter
                        }
                except Exception as e:
                    logging.warning(f"Could not save formula image: {e}")
            
            yield enrich_element.item


class EnhancedFormulaUnderstandingPipeline(StandardPdfPipeline):
    """Extended pipeline with formula understanding capabilities"""
    
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
        
        # Keep backend alive for formula processing
        if self.pipeline_options.do_formula_understanding:
            self.keep_backend = True

    @classmethod
    def get_default_options(cls) -> EnhancedFormulaUnderstandingPipelineOptions:
        return EnhancedFormulaUnderstandingPipelineOptions()


# ==================== HELPER FUNCTIONS ====================

def find_tesseract() -> Optional[str]:
    """Find Tesseract installation and verify it works."""
    common_paths = [
        "/opt/homebrew/bin/tesseract",
        "/usr/local/bin/tesseract",
        "/usr/bin/tesseract",
        "C:\\Program Files\\Tesseract-OCR\\tesseract.exe",
    ]
    
    for path in common_paths:
        if Path(path).exists():
            if verify_tesseract(path):
                print(f"  ✓ Found working Tesseract at: {path}")
                return path
    
    try:
        result = shutil.which("tesseract")
        if result and verify_tesseract(result):
            print(f"  ✓ Found working Tesseract at: {result}")
            return result
    except Exception:
        pass
    
    print("  ⚠️  Tesseract not found or not working. OCR will be disabled.")
    return None


def verify_tesseract(tesseract_path: str) -> bool:
    """Verify Tesseract can run and has language data."""
    try:
        result = subprocess.run(
            [tesseract_path, "--version"],
            capture_output=True,
            text=True,
            timeout=5
        )
        if result.returncode != 0:
            return False
        
        result = subprocess.run(
            [tesseract_path, "--list-langs"],
            capture_output=True,
            text=True,
            timeout=5
        )
        
        if result.returncode != 0:
            print(f"    ⚠️  Tesseract found but language data missing")
            return False
        
        if 'eng' not in result.stdout:
            print(f"    ⚠️  English language data not found for Tesseract")
            return False
        
        return True
    except Exception as e:
        print(f"    ⚠️  Tesseract verification failed: {e}")
        return False


# ==================== METADATA MODEL ====================

class ElementMetadata(BaseModel):
    """Structured metadata for each document element"""
    pdf_id: str
    pdf_path: str
    markdown_path: str
    page_number: int
    element_id: str
    element_type: str  # "text", "table", "image", "formula"
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


# ==================== LANGUAGE DETECTION ====================

def detect_language_from_pdf(pdf_path: Path, sample_size: int = 200) -> str:
    """Detect language by sampling random text from PDF."""
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
        
        if not clean_text or len(clean_text) < 50:
            print(f"  ⚠️  Insufficient text for language detection")
            return "unknown"
        
        words = clean_text.split()
        if len(words) > sample_size:
            sample_indices = random.sample(range(len(words)), min(sample_size, len(words)))
            sample_words = [words[i] for i in sorted(sample_indices)]
            sample_text = ' '.join(sample_words)
        else:
            sample_text = clean_text
        
        detected_lang = detect(sample_text)
        print(f"  → Detected language: {detected_lang}")
        return detected_lang
        
    except LangDetectException as e:
        print(f"  ⚠️  Language detection error: {e}")
        return "unknown"
    except Exception as e:
        print(f"  ⚠️  Language detection failed: {e}")
        return "unknown"


def find_all_pdfs(root_dir: Path) -> List[Path]:
    """Recursively find all PDF files in directory tree"""
    pdfs = list(root_dir.rglob("*.pdf"))
    pdfs.extend(root_dir.rglob("*.PDF"))
    return sorted(set(pdfs))


def create_pdf_id(pdf_path: Path) -> str:
    """Create a unique, clean ID from PDF filename"""
    pdf_id = pdf_path.stem
    pdf_id = re.sub(r'[^\w\-]', '_', pdf_id)
    return pdf_id


# ==================== PDF PROCESSING ====================

def process_single_pdf(
    pdf_path: Path,
    output_root: Path,
    ocr_path: Optional[str] = None,
    enable_formula_understanding: bool = True
) -> List[ElementMetadata]:
    """Process a single PDF with enhanced formula understanding."""
    pdf_id = create_pdf_id(pdf_path)
    print(f"\n📄 Processing: {pdf_path.name} (ID: {pdf_id})")
    
    # Setup output directory
    odir = output_root / pdf_id
    odir.mkdir(parents=True, exist_ok=True)
    
    # Configure enhanced pipeline options
    pipeline_options = EnhancedFormulaUnderstandingPipelineOptions()
    
    # OCR configuration
    enable_ocr = False
    if ocr_path:
        try:
            if verify_tesseract(ocr_path):
                pipeline_options.do_ocr = True
                pipeline_options.ocr_options = TesseractCliOcrOptions(
                    path=ocr_path,
                    lang=["eng"],
                    force_full_page_ocr=False
                )
                enable_ocr = True
                print(f"  ✓ OCR enabled with Tesseract")
        except Exception as e:
            print(f"  ⚠️  OCR verification failed: {e}")
    
    if not enable_ocr:
        pipeline_options.do_ocr = False
        print(f"  ⚠️  OCR disabled (processing without OCR)")
    
    # Enable formula understanding for math/science PDFs
    pipeline_options.do_formula_understanding = enable_formula_understanding
    pipeline_options.save_formula_images = True
    
    # Other pipeline options
    pipeline_options.do_table_structure = True
    pipeline_options.table_structure_options.do_cell_matching = True
    pipeline_options.generate_picture_images = True
    pipeline_options.images_scale = 2.0
    pipeline_options.generate_page_images = False
    
    if enable_formula_understanding:
        print(f"  ✓ Formula understanding enabled")
    
    # Create converter with enhanced pipeline
    converter = DocumentConverter(
        format_options={
            InputFormat.PDF: PdfFormatOption(
                pipeline_cls=EnhancedFormulaUnderstandingPipeline,
                pipeline_options=pipeline_options,
            )
        }
    )
    
    # Convert document
    try:
        result = converter.convert(pdf_path)
        doc = result.document
    except Exception as e:
        print(f"  ❌ Conversion failed: {e}")
        raise
    
    # Markdown output path
    md_path = odir / f"{pdf_id}.md"
    
    # Track metadata
    elements_metadata: List[ElementMetadata] = []
    timestamp = datetime.utcnow().isoformat() + "Z"
    
    table_counter = 0
    image_counter = 0
    formula_counter = 0
    
    # Process tables
    print(f"  📊 Extracting tables...")
    for idx, tbl in enumerate(doc.tables, start=1):
        try:
            df = tbl.export_to_dataframe()
            if df.empty:
                continue
            
            table_counter += 1
            csv_path = odir / f"{pdf_id}_table_{table_counter}.csv"
            df.to_csv(csv_path, index=False)
            
            tbl_image_path = None
            if isinstance(tbl, TableItem):
                try:
                    tbl_img = tbl.get_image(doc)
                    if tbl_img:
                        img_path = odir / f"{pdf_id}_table_{table_counter}_image.png"
                        tbl_img.save(img_path, "PNG")
                        tbl_image_path = str(img_path)
                except Exception as e:
                    print(f"    ⚠️  Could not extract table image: {e}")
            
            table_md = df.to_markdown(index=False)
            
            element_meta = ElementMetadata(
                pdf_id=pdf_id,
                pdf_path=str(pdf_path.resolve()),
                markdown_path=str(md_path),
                page_number=0,
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
        except Exception as e:
            print(f"    ⚠️  Error processing table {idx}: {e}")
            continue
    
    # Process images and formulas
    print(f"  🖼️  Extracting images and formulas...")
    img_dir = odir / "images"
    img_dir.mkdir(exist_ok=True)
    
    for n, (elem, _) in enumerate(doc.iterate_items(), start=1):
        # Handle formulas
        if isinstance(elem, TextItem) and elem.label == DocItemLabel.FORMULA:
            try:
                formula_counter += 1
                formula_text = elem.text if hasattr(elem, 'text') else ""
                
                # Check for saved formula image
                formula_img_path = None
                formula_dir = odir / "formulas"
                if formula_dir.exists():
                    potential_img = formula_dir / f"formula_{formula_counter}.png"
                    if potential_img.exists():
                        formula_img_path = str(potential_img)
                
                element_meta = ElementMetadata(
                    pdf_id=pdf_id,
                    pdf_path=str(pdf_path.resolve()),
                    markdown_path=str(md_path),
                    page_number=0,
                    element_id=f"{pdf_id}_formula_{formula_counter}",
                    element_type="formula",
                    element_order=n,
                    content_text=formula_text,
                    formula_image_path=formula_img_path,
                    language="en",
                    extraction_timestamp=timestamp
                )
                elements_metadata.append(element_meta)
                print(f"    → Formula {formula_counter} saved")
            except Exception as e:
                print(f"    ⚠️  Error extracting formula {n}: {e}")
                continue
        
        # Handle images
        elif isinstance(elem, PictureItem):
            try:
                image_counter += 1
                
                img = elem.get_image(doc)
                buf = BytesIO()
                img.save(buf, format="PNG")
                data = buf.getvalue()
                
                img_path = img_dir / f"{pdf_id}_img_{image_counter}.png"
                img_path.write_bytes(data)
                
                element_meta = ElementMetadata(
                    pdf_id=pdf_id,
                    pdf_path=str(pdf_path.resolve()),
                    markdown_path=str(md_path),
                    page_number=0,
                    element_id=f"{pdf_id}_img_{image_counter}",
                    element_type="image",
                    element_order=n,
                    image_path=str(img_path),
                    language="en",
                    extraction_timestamp=timestamp
                )
                elements_metadata.append(element_meta)
                print(f"    → Image {image_counter} saved")
            except Exception as e:
                print(f"    ⚠️  Error extracting image {n}: {e}")
                continue
    
    # Save markdown
    try:
        doc.save_as_markdown(
            md_path,
            image_mode=ImageRefMode.REFERENCED,
            page_break_placeholder="<!-- PAGE_BREAK -->"
        )
    except Exception as e:
        print(f"  ⚠️  Error saving markdown: {e}")
        md_path.write_text(doc.export_to_markdown(), encoding="utf-8")
    
    add_page_headers_to_markdown(md_path)
    
    text_elements = parse_markdown_to_text_elements(
        md_path, pdf_id, pdf_path, timestamp
    )
    elements_metadata.extend(text_elements)
    
    print(f"  ✅ Processed {table_counter} tables, {image_counter} images, {formula_counter} formulas, {len(text_elements)} text blocks")
    
    return elements_metadata


def add_page_headers_to_markdown(md_path: Path):
    """Split markdown by page breaks and add proper page headers."""
    try:
        content = md_path.read_text(encoding="utf-8")
        pages = content.split("<!-- PAGE_BREAK -->")
        
        numbered_pages = []
        for i, page in enumerate(pages, 1):
            page_content = page.strip()
            if not page_content:
                continue
            
            page_header = f"# PAGE {i}\n\n"
            numbered_pages.append(page_header + page_content)
        
        if numbered_pages:
            md_path.write_text("\n\n".join(numbered_pages), encoding="utf-8")
            print(f"  📝 Added page headers to markdown")
    except Exception as e:
        print(f"  ⚠️  Could not add page headers: {e}")


def parse_markdown_to_text_elements(
    md_path: Path,
    pdf_id: str,
    pdf_path: Path,
    timestamp: str
) -> List[ElementMetadata]:
    """Parse markdown file to extract text blocks with page numbers."""
    try:
        content = md_path.read_text(encoding="utf-8")
        page_pattern = r'# PAGE (\d+)\n\n'
        pages = re.split(page_pattern, content)
        
        text_elements = []
        element_counter = 0
        
        for i in range(1, len(pages), 2):
            page_num = int(pages[i])
            page_content = pages[i + 1] if i + 1 < len(pages) else ""
            
            if not page_content.strip():
                continue
            
            sections = split_text_into_sections(page_content)
            
            for section_order, section_text in enumerate(sections, 1):
                if len(section_text.strip()) < 20:
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
    except Exception as e:
        print(f"  ⚠️  Error parsing markdown: {e}")
        return []


def split_text_into_sections(text: str) -> List[str]:
    """Split text into logical sections based on headers and paragraphs."""
    sections = re.split(r'\n(#{2,}\s+.+)\n', text)
    
    result = []
    current_section = ""
    
    for part in sections:
        if re.match(r'^#{2,}\s+', part):
            if current_section.strip():
                result.append(current_section.strip())
            current_section = part + "\n"
        else:
            current_section += part
    
    if current_section.strip():
        result.append(current_section.strip())
    
    if len(result) <= 1:
        result = [p.strip() for p in text.split('\n\n') if p.strip()]
    
    return result


# ==================== MAIN PIPELINE ====================

def process_pdfs_in_directory(
    input_root: str,
    output_root: str,
    jsonl_output: str,
    skip_non_english: bool = True,
    ocr_path: Optional[str] = None,
    enable_formula_understanding: bool = True
):
    """Main pipeline: process all PDFs with formula understanding."""
    input_root = Path(input_root)
    output_root = Path(output_root)
    jsonl_output = Path(jsonl_output)
    
    if ocr_path is None:
        ocr_path = find_tesseract()
    
    output_root.mkdir(parents=True, exist_ok=True)
    jsonl_output.parent.mkdir(parents=True, exist_ok=True)
    
    pdf_files = find_all_pdfs(input_root)
    print(f"🔍 Found {len(pdf_files)} PDF files in {input_root}\n")
    
    if not pdf_files:
        print("❌ No PDF files found!")
        return
    
    all_metadata = []
    processed_count = 0
    skipped_count = 0
    error_count = 0
    
    with open(jsonl_output, 'w', encoding='utf-8') as jsonl_file:
        for pdf_path in pdf_files:
            try:
                if skip_non_english:
                    detected_lang = detect_language_from_pdf(pdf_path)
                    
                    if detected_lang not in ['en', 'unknown']:
                        print(f"  ⏭️  Skipping non-English PDF (detected: {detected_lang})\n")
                        skipped_count += 1
                        continue
                    elif detected_lang == 'unknown':
                        print(f"  ⚠️  Language unknown, processing anyway...\n")
                
                elements = process_single_pdf(
                    pdf_path, 
                    output_root, 
                    ocr_path,
                    enable_formula_understanding=enable_formula_understanding
                )
                
                for element in elements:
                    jsonl_file.write(element.model_dump_json() + '\n')
                
                all_metadata.extend(elements)
                processed_count += 1
                print(f"  ✅ Successfully processed!\n")
                
            except Exception as e:
                print(f"  ❌ Error processing {pdf_path.name}: {e}\n")
                error_count += 1
                continue
    
    # Summary
    print("\n" + "="*60)
    print(f"📊 PROCESSING SUMMARY")
    print("="*60)
    print(f"Total PDFs found: {len(pdf_files)}")
    print(f"Successfully processed: {processed_count}")
    print(f"Skipped (non-English): {skipped_count}")
    print(f"Errors: {error_count}")
    print(f"Total elements extracted: {len(all_metadata)}")
    print(f"  - Text blocks: {sum(1 for e in all_metadata if e.element_type == 'text')}")
    print(f"  - Tables: {sum(1 for e in all_metadata if e.element_type == 'table')}")
    print(f"  - Images: {sum(1 for e in all_metadata if e.element_type == 'image')}")
    print(f"  - Formulas: {sum(1 for e in all_metadata if e.element_type == 'formula')}")
    print(f"\n📁 Outputs:")
    print(f"  - Markdown files: {output_root}")
    print(f"  - JSONL metadata: {jsonl_output}")
    print("="*60)


if __name__ == "__main__":
    INPUT_DIR = "class10"
    OUTPUT_DIR = "outputs"
    JSONL_FILE = "dataset/ncert_metadata.jsonl"
    
    process_pdfs_in_directory(
        input_root=INPUT_DIR,
        output_root=OUTPUT_DIR,
        jsonl_output=JSONL_FILE,
        skip_non_english=True,
        ocr_path=None,  # Auto-detect
        enable_formula_understanding=True  # Enable for math/science PDFs
    )
