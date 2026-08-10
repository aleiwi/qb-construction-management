# AI-Powered BOQ Engine — Development Plan

**Project:** QB Construction Management System  
**Phase:** Intelligent BOQ Extraction & Pricing  
**Version:** 1.0  
**Date:** 2026-07-27  

---

## 1. Vision

Build an automated BOQ engine capable of:
- Receiving thousands of CAD drawings (DXF/DWG)
- Automatically extracting construction elements
- Classifying them with high accuracy (walls, columns, slabs, beams, foundations, openings, doors, windows)
- Calculating quantities (lengths, areas, volumes, counts)
- Pricing projects accurately via a unit price database
- Generating professional BOQ reports (PDF/Excel)

---

## 2. System Architecture

```
BOQ Engine
│
├── 2.1 Extraction Layer
│   ├── Enhanced DXF Parser
│   ├── DWG → DXF Converter
│   ├── Entity Handler (POLYLINE, SPLINE, ELLIPSE, MTEXT, DIMENSION, BLOCK, INSERT)
│   ├── Geometry Calculator (areas, volumes, lengths, angles)
│   └── Batch Processing Queue
│
├── 2.2 Classification Engine
│   ├── Rule-Based Classifier (Tier 1 — fast rules)
│   ├── LLM Classifier (Tier 2 — Ollama for ambiguous elements)
│   ├── Context Analyzer (layer + nearby text + geometry + neighbors)
│   ├── Confidence Scorer
│   └── Auto-Learning Loop (feedback → improved future classification)
│
├── 2.3 Quantification Engine
│   ├── Quantity Rules (per ElementType)
│   ├── Unit Converter
│   └── Waste Factor
│
├── 2.4 Pricing Engine
│   ├── Price Library (unit price database)
│   ├── Regional Rates
│   ├── Markup Calculator (profit, overhead, contingency)
│   ├── Escalation Factor (long-term contracts)
│   └── Total Cost Aggregator
│
└── 2.5 Reporting & Export
    ├── Excel Report
    ├── PDF Report
    ├── FIDIC/SBC Format
    ├── Manual vs Auto Comparison Report
    └── Audit Trail
```

---

## 3. Execution Phases

### Phase 1: Extraction Engine Upgrade (Week 1)

**Goal:** Handle real-world CAD files robustly.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | Support more entity types: POLYLINE, SPLINE, ELLIPSE, MTEXT, DIMENSION | `boq_extraction_service.py` | 🔴 Critical |
| 1.2 | Parse BLOCK/INSERT references — extract inner entities | `boq_extraction_service.py` | 🔴 Critical |
| 1.3 | DWG → DXF converter via ODA File Converter or ezdxf | `dwg_converter.py` (new) | 🟡 High |
| 1.4 | Improved area calculation for irregular polygons (SPLINE, fitted POLYLINE) | `boq_extraction_service.py` | 🔴 Critical |
| 1.5 | Volume calculation using height/thickness from adjacent text or layer | `geometry_utils.py` (new) | 🟡 High |
| 1.6 | Batch processing queue with status tracking | `batch_processor.py` (new) + `models/batch_job.py` | 🟡 High |
| 1.7 | Multi-file upload (drag & drop multiple drawings) | Update `DrawingsPage.jsx` + `drawing_service.py` | 🟢 Nice |
| 1.8 | Real-time progress UI (per-file status bar) | Update `DrawingsPage.jsx` | 🟢 Nice |

**Phase 1 Tests:**
- Upload 50 real DXF files, verify element extraction
- Test all entity types
- Validate area/length calculation accuracy

---

### Phase 2: AI-Powered Classification (Week 2)

**Goal:** ≥ 90% classification accuracy with zero manual intervention.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 2.1 | Build enhanced rule-based classifier (100+ rules) | `classifier_rules.py` (new) | 🔴 Critical |
| 2.2 | Integrate Ollama LLM (DeepSeek/Llama) for uncertain elements | `llm_classifier.py` (new) | 🔴 Critical |
| 2.3 | Context Analyzer: layer + text + geometry + neighbors | `context_analyzer.py` (new) | 🟡 High |
| 2.4 | Confidence scoring system (probabilistic) | `confidence_scorer.py` (new) | 🟡 High |
| 2.5 | Auto-Learning: save manual classifications as training data | `auto_learner.py` (new) | 🟢 Nice |
| 2.6 | Bulk re-classify all unclassified elements with one click | Update `BOQReviewPage.jsx` + `boq_elements.py` | 🟢 Nice |
| 2.7 | BOQ classification dashboard (classified%, confidence%, element distribution) | Update `ReportsPage.jsx` + `reports_service.py` | 🟢 Nice |

**LLM Classifier Details:**
- Model: `deepseek-coder` or `llama3` via Ollama (local, free, private)
- Prompt:
```
You are a construction engineering expert. Classify the following CAD element:

Layer name: {layer_name}
Geometry type: {geometry_type} (Polyline/Circle/Line/Text)
Dimensions: {width}x{height}x{depth} meters
Nearby text labels: {text_labels}
Building element type: {suggested_type}

Choose exactly one from: [WALL, COLUMN, SLAB, BEAM, FOUNDATION, DOOR, WINDOW, STAIRS, ROOF, PARTITION, OPENING, OTHER]
Return only the type name, nothing else.
```

**Phase 2 Tests:**
- Classification accuracy on 500 real elements
- Rule-Based vs LLM vs Hybrid accuracy comparison
- Response time per element

---

### Phase 3: Quantification & Pricing (Week 3)

**Goal:** Convert classified elements into priced quantities.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 3.1 | Quantity Rules Engine (formulas per ElementType) | `quantity_engine.py` (new) | 🔴 Critical |
| 3.2 | Auto-dimension extraction from DIMENSION entities + MTEXT | `dimension_extractor.py` (new) | 🔴 Critical |
| 3.3 | Price Library CRUD + seed with Saudi market rates | Update `price_library.py` + frontend | 🔴 Critical |
| 3.4 | Auto-pricing: link elements to price items automatically | Update `boq_item_service.py` | 🟡 High |
| 3.5 | Markup Calculator (profit, overhead, contingency) | `pricing_engine.py` (new) | 🟡 High |
| 3.6 | Project-level cost aggregation | `boq_aggregator.py` (new) | 🟡 High |
| 3.7 | Full BOQ summary page with manual override | `BOQSummaryPage.jsx` (new) | 🟢 Nice |

**Quantity Rules:**

| ElementType | Formula | Unit |
|------------|---------|------|
| WALL | `length × height × thickness` | m³ |
| COLUMN | `width × depth × height` | m³ |
| SLAB | `area × thickness` | m³ |
| BEAM | `width × depth × length` | m³ |
| FOUNDATION | `area × depth` | m³ |
| DOOR | `count` | pc |
| WINDOW | `count` | pc |
| STAIRS | `width × length × height / 2` | m³ |
| ROOF | `area × thickness` | m³ |
| PARTITION | `length × height` | m² |
| OPENING | `width × height` | m² |

**Sample Unit Prices (Saudi Market — Approximate):**

| Item | Price (SAR) | Unit |
|------|------------|------|
| Reinforced concrete — walls | 450-550 | m³ |
| Reinforced concrete — columns | 500-600 | m³ |
| Reinforced concrete — slabs | 400-500 | m³ |
| Reinforced concrete — beams | 480-580 | m³ |
| Reinforcement steel | 2500-3500 | ton |
| Plastering | 25-35 | m² |
| Painting | 15-25 | m² |
| Floor tiling | 60-120 | m² |

---

### Phase 4: Reporting & Export (Week 4)

**Goal:** Professional BOQ reports ready for printing and submission.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 4.1 | Excel export: full BOQ table with quantities, prices, totals | `excel_exporter.py` (new) | 🔴 Critical |
| 4.2 | PDF export: professional report with cover page | `pdf_exporter.py` (new) | 🔴 Critical |
| 4.3 | Comparison report: Auto BOQ vs Manual BOQ (variances) | `comparison_report.py` (new) | 🟡 High |
| 4.4 | BOQ audit trail: every classification/edit logged | Update `audit_log_service.py` | 🟡 High |
| 4.5 | Print directly from browser | Update `BOQSummaryPage.jsx` | 🟢 Nice |

**Excel Format:**
```
| #  | Item     | Description         | Unit | Quantity | Unit Price | Total     |
|----|----------|---------------------|------|----------|------------|-----------|
| 1  | WALL     | 20cm concrete wall  | m³   | 150.00   | 500.00     | 75,000.00 |
```

**PDF Layout:**
- Cover page: project name, date, contractor, company logo
- BOQ table: styled similar to Excel
- Summary: total cost, contingency %, net amount
- Signature block

---

## 4. Database Changes

### 4.1 New Tables

| Table | Fields | Purpose |
|-------|--------|---------|
| `batch_jobs` | id, created_by, total_files, completed_files, status, timestamps | Batch processing tracking |
| `batch_job_items` | id, job_id, drawing_id, status, error_message | Per-file batch status |
| `boq_projects` | id, project_id, created_by, total_items, total_cost, status | Per-project BOQ summary |
| `classification_training` | id, layer_name, geometry_type, dimensions, manual_classification, confidence, classified_by | Training data for AI |
| `price_escalation` | id, region, material_type, base_price, current_price, date | Material price index |

### 4.2 Existing Table Extensions

| Table | New Fields | Purpose |
|-------|------------|---------|
| `drawings` | batch_job_id, confidence_avg, processing_time | Processing stats |
| `boq_elements` | ai_confidence, auto_classified_type, dimensions_json, audit_log_id | AI accuracy tracking |
| `boq_items` | waste_factor, total_with_waste, markup_percent | Detailed pricing |

---

## 5. New Frontend Pages

| Page | Route | Description |
|------|-------|-------------|
| `BOQSummaryPage.jsx` | `/boq-summary/:projectId` | Full BOQ display with edit/print |
| `BatchUploadPage.jsx` | `/drawings/batch` | Multi-file upload with progress |
| `PriceLibraryPage.jsx` | `/price-library` | Unit price management (CRUD) |
| `ClassificationDashboard.jsx` | `/boq-analytics` | AI accuracy stats & charts |

---

## 6. Test Plan

| Phase | Type | Files | Coverage |
|-------|------|-------|----------|
| 1 | Unit | `test_dxf_extraction.py` | 20+ tests per entity type |
| 1 | Integration | `test_drawing_upload.py` | Real file upload & verify |
| 2 | Unit | `test_classifier.py` | Accuracy, speed |
| 2 | Integration | `test_llm_classifier.py` | Ollama integration |
| 3 | Unit | `test_quantity_engine.py` | Quantity calculation accuracy |
| 3 | Integration | `test_pricing_engine.py` | End-to-end costing |
| 4 | Integration | `test_boq_export.py` | Excel/PDF file integrity |
| ALL | E2E | Frontend + Backend | Upload → Classify → Price → Export |

---

## 7. Timeline

```
Week 1:  ████████████████░░░░░░░░░░░░   Phase 1 (Extraction)
Week 2:  ░░░░░░░░░░████████████░░░░░░   Phase 2 (AI Classification)
Week 3:  ░░░░░░░░░░░░░░░░████████████   Phase 3 (Pricing)
Week 4:  ░░░░░░░░░░░░░░░░░░░░░░██████   Phase 4 (Reports)
Week 5:  ░░░░░░░░░░░░░░░░░░░░░░░░░░██   Testing & Polish
```

---

## 8. Technologies & Libraries

| Technology | Use | Notes |
|-----------|-----|-------|
| `ezdxf` | DXF file parsing | Existing, upgrade |
| `ODA File Converter` | DWG → DXF conversion | Free for individual use |
| `Ollama` | Local LLM for classification | Free, private |
| `OpenPyXL` | Excel export | Pure Python |
| `ReportLab` | PDF export | Free, professional |
| `httpx` (Async) | Ollama API communication | Async for speed |
| `shapely` | Complex geometry analysis | Union/Difference/Intersection |
| `numpy` | Fast numerical calculations | Common dependency |

---

## 9. Deployment Requirements

| Requirement | Description | Status |
|------------|-------------|--------|
| Ollama server | deepseek-coder or llama3 model | ⬜ New |
| Disk space | CAD file storage + thumbnails | ⬜ Plan |
| RAM | 8GB+ for local LLM | ⬜ Plan |
| GPU (optional) | Accelerated LLM inference | ⬜ Enhancement |

---

## 10. Key Notes

1. **Privacy:** Everything runs locally — no data leaves the server. Critical for drawing confidentiality.
2. **Incremental value:** Phase 1 alone is a major improvement. Project can stop after any phase with usable output.
3. **Extensibility:** New element types can be added without touching core code.
4. **Documentation:** All APIs are Swagger-documented (already set up).
5. **Performance:** 1000 drawings × 500 elements = 500,000 items. Async processing is mandatory.

---

**Appendix: Projected File Structure After Development**

```
backend/app/
├── services/
│   ├── boq_extraction_service.py    (upgraded)
│   ├── boq_element_service.py       (upgraded)
│   ├── boq_item_service.py          (upgraded)
│   ├── drawing_service.py           (upgraded)
│   ├── reports_service.py           (upgraded)
│   ├── classifier_rules.py          ● new
│   ├── llm_classifier.py            ● new
│   ├── context_analyzer.py          ● new
│   ├── confidence_scorer.py         ● new
│   ├── auto_learner.py              ● new
│   ├── batch_processor.py           ● new
│   ├── quantity_engine.py           ● new
│   ├── pricing_engine.py            ● new
│   ├── dwg_converter.py             ● new
│   ├── geometry_utils.py            ● new
│   ├── dimension_extractor.py       ● new
│   ├── boq_aggregator.py            ● new
│   ├── excel_exporter.py            ● new
│   └── pdf_exporter.py              ● new
│
└── models/
    ├── batch_job.py                 ● new
    ├── boq_project.py               ● new
    └── classification_training.py   ● new

frontend/src/
├── pages/
│   ├── DrawingsPage.jsx             (upgraded)
│   ├── BOQReviewPage.jsx            (upgraded)
│   ├── BOQSummaryPage.jsx           ● new
│   ├── BatchUploadPage.jsx          ● new
│   ├── PriceLibraryPage.jsx         ● new
│   └── ClassificationDashboard.jsx  ● new
│
└── features/
    └── boq/
        └── boqApi.js                (upgraded)
```
