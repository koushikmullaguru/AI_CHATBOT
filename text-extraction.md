## Text Extraction using Docling

### Brief Overview

This stage handles **structured text extraction** from NCERT PDF books using **Docling**, an open-source document intelligence framework designed for complex layouts such as **bi-column pages, tables, formulas, figures, and images**.

Docling performs multiple pipeline operations including:

* Page layout analysis
* OCR (if needed) using **Tesseract**
* Table structure recognition and cell mapping
* Formula and figure detection
* Markdown export with page-level segmentation
* Metadata-rich JSONL output for downstream RAG indexing

Each PDF file is processed into:

1. A **Markdown file** preserving the original layout and section headers.
2. A set of **images** (figures, diagrams) and **CSV files** (tables).
3. A consolidated **JSONL metadata file** where each record represents a single extracted element (text block, table, or image) from the source PDF.

This ensures that every textual, visual, or tabular component of the study material is preserved and traceable back to its page of origin.

---

### What We Extract

For each PDF:

* **Text Content:** Paragraphs, headers, and inline text, page-wise.
* **Tables:** Exported as both CSV and image snapshots.
* **Images:** Embedded figures, diagrams, and charts extracted with bounding boxes.
* **Page Context:** Page numbering and markdown segmentation using `# PAGE N` headers.

This granular extraction allows downstream systems (e.g., retrieval, embeddings, or QA pipelines) to use accurate page-level provenance and multimodal metadata.

---

### JSONL Metadata Format

Each line in the JSONL file corresponds to one extracted element (text, table, or image) with complete provenance data.
Below is the conceptual structure:

| Field                    | Description                                                               |
| ------------------------ | ------------------------------------------------------------------------- |
| **pdf_id**               | Unique identifier derived from the source filename (e.g., `science_ch8`). |
| **pdf_path**             | Path to the original PDF file.                                            |
| **markdown_path**        | Path to the Markdown file generated for this PDF.                         |
| **page_number**          | Page index from which the element was extracted.                          |
| **element_id**           | Unique ID for the extracted element (`<pdf_id>_p<page>_<type><n>`).       |
| **element_type**         | One of `"text"`, `"table"`, or `"image"`.                                 |
| **element_order**        | Sequential order of the element within its page.                          |
| **content_text**         | Extracted textual content (Markdown formatted if applicable).             |
| **table_csv_path**       | Path to exported CSV file (for tables only).                              |
| **table_image_path**     | Path to table snapshot image (if available).                              |
| **image_path**           | Path to the extracted image file (for figures).                           |
| **caption**              | Caption or nearby descriptive text, if detected.                          |
| **bounding_box**         | Coordinates `[x0, y0, x1, y1]` representing element position on the page. |
| **language**             | Language detected or assumed for the content (default `"en"`).            |
| **source_type**          | Always `"docling"` to indicate the extraction engine.                     |
| **extraction_timestamp** | ISO-8601 timestamp when extraction occurred.                              |

Each record in the JSONL file is **self-contained**, ensuring every element can be used independently for chunking, vectorization, or retrieval without losing document context.

---

### Output Structure

```
outputs/
├── ncert-markdowns/
│   ├── science_ch8/
│   │   ├── science_ch8.md
│   │   ├── science_ch8_table_1.csv
│   │   ├── science_ch8_table_1_image.png
│   │   └── images/
│   │       ├── science_ch8_img_1.png
│   │       ├── science_ch8_img_2.png
│   │       └── ...
│   └── ...
└── ncert_metadata.jsonl   ← consolidated metadata for all PDFs
```
