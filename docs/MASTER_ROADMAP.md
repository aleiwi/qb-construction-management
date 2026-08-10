# MASTER_ROADMAP.md — QB System Upgrade Roadmap

**Date:** 2026-08-10
**Inputs:** docs/SYSTEM_AUDIT.md (findings A-01…UX-04), docs/RESEARCH_LIBRARY.md, docs/COMPETITIVE_ANALYSIS.md
**Principle:** Fix broken and insecure first (P0), then strengthen the core domain (P1), then grow the domain (P2), then polish (P3). Every item lands with automated tests; a verification step closes each phase.

---

## PHASE 0 — FOUNDATION (security gates + math correctness) — priority P0

**Goal: no 500s in the core domain, no obvious security holes, repo under version control.**

| Item | Work | Tests |
|------|------|-------|
| R-01 | `git init` + .gitignore (venv, __pycache__, node_modules, *.db, uploads) + first commit | — |
| R-02 | Real auth: frontend route guard (replace ProtectedRoute no-op `App.jsx:36-38`), logout button, role→permission map in one module; server-side enforcement where exposed | frontend tests + e2e |
| R-03 | Fail-closed JWT secret (`config.py:12`): RuntimeError in prod if unset; .env template + docs | unit |
| R-04 | Global error handler (`main.py:151-156`): log exceptions, return generic message + trace ID; no `str(exc)` leakage | unit + e2e |
| R-05 | `/uploads` behind auth with project-scope check (`main.py:159-160`) | e2e (401/403) |
| R-06 | Health endpoint (`/api/v1/health`: DB ping, version) + docker-compose healthcheck | e2e |
| R-07 | **BOQ link fix**: add `unit_price` to `schemas/boq_item.py` + service (`boq_items.py:41`); ensure quantity preserved (no squaring); regression test | unit |
| R-08 | **Quantity engine fix**: operator-precedence bug `quantity_engine.py:117` (wall length always 5.0 m) | unit regression |
| R-09 | **Comparison report fix**: `comparison_report.py:13` join via `building_id` (no `Drawing.project_id`) | unit regression |
| R-10 | **Classifier fix**: `classifier_rules.py:181` split multi-type string matching | unit regression |
| R-11 | **Paid-ratio clamp**: paid % never exceeds 100 (completion_reports) | unit regression |

**Verification:** backend suite exit 0; frontend suite + build; live e2e (15+ checks) green; manual BOQ link + export smoke on qb_dev.db.

---

## PHASE 1 — CORE STRENGTHENING (data integrity + financials) — priority P1

**Goal: trustworthy numbers, configurable contracts, compliance-ready reporting.**

| Item | Work | Tests |
|------|------|-------|
| S-01 | Alembic migrations baseline (replace create_all) | migration test |
| S-02 | SQLite FK pragma ON via event listener (`database.py`) | unit |
| S-03 | Audit logging: extend `audit/` to ALL mutating endpoints; append-only HMAC chain (ISO 27001 8.15); export API | unit + e2e |
| S-04 | KPI engine: EVM formulas (SPI/CPI/SV/CV/EAC/TCPI) with baseline; each KPI documented (definition/formula/source/unit/frequency/owner) | unit |
| S-05 | Retention ledger + release workflow (50% taking-over / balance after defects — configurable per contract, FIDIC-style) | unit |
| S-06 | Payment state machine (advance/partial/final; advance repayment schedule; compliance gates before pay — ACC/Vista pattern) | unit |
| S-07 | VAT on financial domain: rate field (KSA 15% default, configurable), tax point = completion-report issuance, VAT on retained portion | unit |
| S-08 | Configurable pricing-engine rate templates (materials+wastage+labour+plant+O&P) replacing hardcoded 15/10/5/15% | unit |
| S-09 | Measurement-standard linkage (NRM2/CESMM4 reference + unit taxonomy) + sheet-level scale calibration | unit |
| S-10 | AI security: `llm_classifier.py` — mark drawing text as untrusted (OWASP LLM01), output validation, evidence store (provenance tuple per RICS AI standard) | unit |
| S-11 | MFA (TOTP) + refresh-token rotation + revocation | unit + e2e |

**Verification:** full suites; migration applies to qb_dev.db without data loss; live e2e extended (VAT/retention/payment happy paths).

---

## PHASE 2 — DOMAIN GROWTH (QC, documents, changes) — priority P2

**Goal: cover the PM lifecycle a contractor actually runs.**

| Item | Work | Tests |
|------|------|-------|
| G-01 | Drawing revision model (system version vs revision; issue codes IFC/IFR/IFA/IFT; status S0-S7 — ISO 19650) | unit |
| G-02 | Change-order module: PCO→CCO/OCO tiering, valuation routes (contract rates→analogous→fair), cost-code linkage | unit |
| G-03 | WIP report (billed vs earned vs incurred; over/under-billing) | unit |
| G-04 | RFI module (draft→open→review→responded→resolved; RFI ≠ cost change) | unit |
| G-05 | Submittal/transmittal entities + approval states (USACE A/B/C/E) | unit |
| G-06 | QC module: ITP→work lots→checklists→evidence (RIB CX pattern); NCR/CAPA (ISO 9001 10.2) | unit |
| G-07 | Background jobs (FastAPI BackgroundTasks) for CAD extraction + PDF generation; job status endpoint | e2e |
| G-08 | Takeoff confidence: per-item confidence %, reviewer decision recorded, dip-sampling benchmark | unit |

**Verification:** full suites; demo workflow: upload drawing → auto-quantity → change order → RFI → submittal → WIP report.

---

## PHASE 3 — SCALE & POLISH (compliance + UX + ops) — priority P3

**Goal: production hardening and field readiness.**

| Item | Work | Tests |
|------|------|-------|
| H-01 | ZATCA e-invoicing (Fatoora): UBL 2.1 XML, CSID, QR — audit §8 pre-req: VAT model (S-07) must be live | integration (sandbox) |
| H-02 | Data retention policy + archival job (≥6 yrs KSA practice, ISO 27001 8.10) | unit |
| H-03 | Responsive/mobile-first UX pass for field users (Fieldwire pattern); offline mode research | manual + visual |
| H-04 | HR/payroll hooks: configurable GOSI rates, WPS export (⚠️ rates need official-source re-verification) | unit |
| H-05 | Performance: N+1 elimination (buildings/stages/reports), DB indexing, query profiling | load test |
| H-06 | Financial API for partner integrations (cost + payment endpoints) — don't rebuild GL/AP/AR (Vista/Sage territory) | contract test |

**Verification:** full suites; sandbox e-invoicing dry-run; load test targets (<500ms p95 on report list with 1k projects).

---

## EXECUTION ORDER & COMMITMENT

1. **Phase 0 first, exclusively** — every item lands with tests before the next phase starts.
2. Each phase ends with a **verification checklist** (suites + live smoke) recorded in docs/IMPLEMENTATION_STATUS.md.
3. Decisions recorded in docs/ARCHITECTURE_DECISIONS.md as they're made (ADR style).
4. KSA legal/financial defaults (retention %, advance %, VAT, GOSI) are **configurable per contract**, never hardcoded — documented with source references from RESEARCH_LIBRARY.md §7 flags.

## RISKS

- ISO 9001:2026 (Sept 2026) and ISO/DIS 45001 changes may shift QC/HSE alignments — pin clauses to current editions.
- ZATCA wave deadlines vendor-reported — verify against zatca.gov.sa before H-01 scheduling.
- GOSI rate conflict (22% vs 21.6%) — requires official GOSI source before H-04.
- SQLite→Postgres migration likely needed before multi-user production (defer decision to S-01 Alembic work; default Postgres in docker-compose).
