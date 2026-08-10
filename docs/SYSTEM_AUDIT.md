# SYSTEM_AUDIT.md — Phase 0: Complete Technical Audit

**Date:** 2026-08-10
**Status:** Baseline established — Phase 1 (industry research) gates all major changes
**Scope:** Full-stack audit of the QB construction-management platform (backend, frontend, infrastructure). Every finding below was verified against source with file:line evidence. No code was modified during this audit.

---

## 1. Executive Summary

QB is a single-tenant FastAPI + React construction-management platform with genuinely strong bones: a clean domain split, an honest snapshot-based completion-report model, a coherent rule+LLM classification pipeline with **zero cloud API-key leakage**, an exemplary isolated test harness, and a working QC→payment approval gate. The completion-percentage module (dashboard + print + Playwright PDF) is production-quality.

However, the audit found **5 Critical, 22 High, 25 Medium, and 18 Low findings**. The critical issues cluster into five themes:

1. **Authentication & authorization are cosmetic:** hardcoded JWT secret shipped as default, known default passwords, no route-level RBAC in the frontend (`ProtectedRoute` is a no-op), and no object-level ownership checks (IDOR).
2. **Uploaded CAD files are publicly downloadable** via an unauthenticated static mount, bypassing the RBAC download endpoint.
3. **The quantity-surveying core silently produces wrong numbers:** a wall-length operator-precedence bug (every wall = 5 m), a BOQ item-linking endpoint that always 500s, an auto-cost comparison that is always ~0, and no drawing scale/unit handling.
4. **The financial domain lacks a state machine:** payments can go PENDING→PAID directly, duplicate payments per stage are allowed, no over-payment cap, no VAT anywhere, retention is a disconnected manual ledger, and multi-step writes are not transactional.
5. **Auditability is partial:** audit logging covers 3 of ~20 domains, `ip_address` is never recorded, and the only generic 500 handler performs **no logging at all**.

The system is not yet production-ready or deployable as-is (no migrations, SQLite default, uploads not persisted in Docker, no health endpoint). This audit establishes the baseline; the roadmap (Phase 13) will sequence remediation by business value.

---

## 2. Architecture Map

### 2.1 Stack Overview

| Layer | Technology | Notes |
|---|---|---|
| Backend | Python 3.11 + FastAPI + Uvicorn | SQLAlchemy 2.0 async (`select()` style everywhere) |
| Database | SQLite (dev default) / PostgreSQL 16 (Docker) | asyncpg driver in requirements but only used via Docker compose |
| Frontend | React 18.2 + Vite 5 + Tailwind 3.4 | recharts, framer-motion, lucide-react, html2canvas/jspdf |
| Routing | react-router-dom 7, `React.lazy` + Suspense, per-vendor manualChunks | Good code-splitting |
| State | React Context + local hooks | No Redux/React-Query |
| Auth | JWT (access 24 h + refresh 7 d), bcrypt (passlib), HTTPBearer | No revocation, no jti |
| LLM | Local Ollama (`http://localhost:11434`, `deepseek-coder:6.7b`) | No cloud keys — positive |
| CAD | ezdxf (DXF), ODA File Converter (DWG→DXF), SVG preview | ODA is Windows-only optional |
| PDF | Playwright headless Chromium (completion report, A4 landscape 6 pages); ReportLab (BOQ) | Both need internet fonts |
| Excel | openpyxl | |
| Tests | pytest + pytest-asyncio (backend, 119 cases); Vitest + jsdom (frontend, ~50 cases) | No e2e; no coverage config |

### 2.2 Backend Layout

```
backend/app/
  core/        config.py, database.py, security.py      (settings, engine, JWT/bcrypt)
  dependencies/auth.py                                   (get_current_user, require_roles)
  models/      20 models (user, project, building, stage, boq_*, payment, contract,
                         contractor, drawing, batch_job, quality_check, employee,
                         retention_release, completion_report, audit_log, …)
  schemas/     19 schema modules (Pydantic v2)
  routers/     19 routers, all under /api/v1, every endpoint role-gated
  services/    38 services
tests/         13 files, 119 test cases
```

### 2.3 Frontend Layout

```
frontend/src/
  api/axios.js                 (single axios instance, refresh interceptor)
  contexts/AuthContext.jsx     (login/logout/session bootstrap)
  hooks/                       useAuth, usePermissions, useProjects/Buildings/Stages/Contractors
  features/                    8 feature modules (projects, boq, payments, quality,
                               employees, contractors, reports, completionReports)
  pages/                       20 lazy-loaded pages
  components/ui/               ErrorBoundary, ConfirmModal  (only 2 shared components)
  components/completion/       Dashboard/InputForm/PrintReport/NewPeriodModal/QuickCreate
  config/roleAccess.js         PAGE_ROLES (dead code — see F-02)
```

### 2.4 Deployment

```
docker-compose: postgres:16 (pgdata volume) + backend (:8000) + frontend nginx (:8080)
backend Dockerfile: python:3.11-slim, ezdxf + Playwright chromium --with-deps
frontend Dockerfile: node build → nginx SPA fallback (VITE_API_URL baked at build)
CI: .github/workflows/ci.yml (backend pytest + frontend build + docker smoke builds)
⚠  NOT a git repository (no .git) — CI and .gitignore are inert until initialized
```

---

## 3. Domain-by-Domain Findings

### 3.1 Authentication & Session Management

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| S-01 | CRIT | **Hardcoded JWT `SECRET_KEY` shipped as default**; no `.env` in repo → every default deployment issues forgeable tokens. The static guard test **explicitly whitelists** it. | `core/config.py:12`; `tests/test_security_audit.py:58-70` |
| S-02 | CRIT | **5 seed accounts with known plaintext passwords** created on every fresh DB (`admin123`, `pm123`, `engineer123`, `accountant123`, `contractor123`). | `main.py:35-41`; `check_users.py:19` |
| S-03 | HIGH | Refresh tokens are stateless JWTs: no `jti`, no revocation, no rotation tracking, no logout endpoint → stolen token valid 7 days. | `core/security.py:29-41`; `routers/auth.py:33-45`; `config.py:15` |
| S-04 | HIGH | Weak password policy (min 6 chars, no complexity, no lockout, no rate limiting on login). 401 vs 403 distinction enables account-status enumeration. | `schemas/user.py:12`; `routers/auth.py:28-31` |
| S-05 | MED | Tokens stored in **localStorage** (XSS-exposed); combined with missing route guard there is no defense in depth. | `AuthContext.jsx:58-60`; `api/axios.js:15` |
| S-06 | LOW | `get_current_user` does bare `int(sub)` — malformed token → 500 instead of 401. No token-type `aud` check. | `dependencies/auth.py:33` |
| S-07 | LOW | `datetime.utcnow()` (deprecated) used for all token expiry math. | `core/security.py:17,19,31,33` |

### 3.2 Authorization / RBAC

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| A-01 | CRIT | **`ProtectedRoute` is a no-op** — `getRouteRoles()`/`PAGE_ROLES` computed and passed but never enforced; any user or unauthenticated visitor can open every page by URL. | `frontend/src/App.jsx:36-49`; `config/roleAccess.js` |
| A-02 | HIGH | **IDOR:** CONTRACTOR can fetch ANY contract or payment by ID (no ownership check). The only object-level check in the codebase compares `contractor.id` to the **user's** id — wrong entity, never matches. | `routers/contracts.py:73`; `routers/payments.py:66`; `routers/contractors.py:68-69` |
| A-03 | MED | Role-based access only; no object/project-level scoping anywhere. Contractor data isolation relies on wildcard `ilike("%"+full_name+"%")` matching. | `routers/auth.py:81-84` |
| A-04 | LOW | Client-side permission enforcement only (all pages render for any role; backend is the only gate). | all pages |

### 3.3 API Architecture & Error Handling

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| E-01 | HIGH | Generic 500 handler **leaks `str(exc)`** (DB/SQL/path details) to clients and **logs nothing** — outages leave no trace. | `main.py:151-156` |
| E-02 | HIGH | `QualityCheckUpdate.status` is untyped string → invalid value raises `ValueError` → 500. | `schemas/quality_check.py:15`; `services/quality_check_service.py:54` |
| E-03 | MED | Bare `except Exception: pass` clusters swallow failures with no logging (classification, conversion, extraction, batch). | `ai_classifier_service.py:62-63,122-123,165-166`; `boq_extraction_service.py:56-57,210,240,…`; `dwg_converter.py:73-74` |
| E-04 | MED | **Zero `rollback()` anywhere** — partial commits on multi-step writes (e.g., payment approved+committed, then audit fails → 500 but payment stands). | `payment_service.py:106-112`; grep: 0 rollback calls |
| E-05 | MED | List endpoints with no/broken pagination: contracts load ≤1000 rows then filter in Python; audit-logs filter path ignores pagination; boq lists unbounded; `/me/context` loads all rows. | `contracts.py:24-26`; `audit_logs.py:24-25`; `boq_elements.py:18-26`; `auth.py:70-76` |
| E-06 | LOW | No request-ID / structured logging middleware; validation handler shows only first error. | `main.py:142-149` |
| E-07 | LOW | `quality_checks.py:16-17` pagination params unvalidated (no ge/le). | — |
| E-08 | MED | Frontend error extraction inconsistent (`detail` vs `error.message`) — user-facing errors silently wrong on some endpoints. | `boqApi.js:30` vs `CompletionPercentagePage.jsx:123` |
| E-09 | MED | PDF-export failure leaks exception text to the client (mitigated by server-side logging, but still verbose). | `routers/completion_reports.py:144` |

### 3.4 Security (files, network, config)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| F-01 | CRIT | **`/uploads` static mount is unauthenticated** — every uploaded DWG/DXF publicly downloadable given the UUID, bypassing the RBAC download endpoint. | `main.py:159-160` |
| F-02 | HIGH | No upload size limit; entire file read into memory; unbounded batch counts → memory/disk DoS from any Engineer. | `routers/drawings.py:49,90` |
| F-03 | HIGH | DWG temp file leaks on extraction failure (unlink only on success). | `drawing_service.py:141-156` |
| F-04 | MED | Server filesystem path exposed to clients via `DrawingOut.file_path`. | `schemas/drawing.py:62` |
| F-05 | MED | No rate limiting anywhere (login, refresh, AI reclassify). | whole app |
| F-06 | MED | nginx serves with **zero security headers** (no CSP/X-Frame-Options/HSTS), no `server_tokens off`. | `frontend/Dockerfile:17` |
| F-07 | MED | Stored-XSS surface: backend SVG rendered via `dangerouslySetInnerHTML`. | `DrawingViewerPage.jsx:745` |
| F-08 | MED | PostgreSQL exposed on host (`5432:5432`); plaintext DB password + fallback JWT secret in compose. | `docker-compose.yml:8,10-11,27` |
| F-09 | LOW | SVG preview built from DXF text returned inline (XSS risk if rendered as HTML; currently JSON-wrapped). | `routers/drawings.py:145-170` |
| F-10 | LOW | CORS allows credentials with dev-only origins; prod compose still allows `localhost:5173`. | `config.py:18`; `docker-compose.yml:28` |
| F-11 | POS | No SQL injection anywhere (all parameterized); no eval/exec; no cloud API keys. | `test_security_audit.py` + grep |

### 3.5 Data Integrity & Database

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| D-01 | HIGH | **SQLite runs without `PRAGMA foreign_keys=ON`** → all `ondelete` clauses are dead; orphaned children or unhandled IntegrityError→500 on deletes. | `core/database.py:7-11` |
| D-02 | HIGH | **No migrations** — schema managed by `create_all` at startup; existing tables never altered on schema change; SQLite is the default and only locally-wired DB. | `main.py:44-45`; `config.py:9` |
| D-03 | HIGH | Missing unique constraints the app relies on (race-prone): attendance `(employee_id, date)`, QC per stage, BOQ item `(element, price_ref)`. | `employee_service.py:96-102`; `boq_item.py:11-12` |
| D-04 | MED | No soft-delete anywhere — hard deletes with no audit trail on most entities. | all service `delete()`s |
| D-05 | MED | Audit rows: `user_id` has **no FK**; audit writes self-commit inside caller transactions → inconsistent state on failure. | `models/audit_log.py:11`; `audit_log_service.py:34` |
| D-06 | LOW | Enum storage inconsistent: `User.role` is SQLEnum; all others `String(50)`. Naive `utcnow` timestamps. | `models/user.py:21` vs others |
| D-07 | MED | N+1: buildings list issues a progress query per building; KPI endpoint ~30 queries + per-report project lookup; `/me/context` loads all projects+contracts. | `stage_service.py:65-77`; `reports_service.py:126-128`; `auth.py:70-76` |

### 3.6 Quantity Surveying / BOQ (core risk)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| Q-01 | CRIT | **BOQ item-linking endpoint always 500s:** `BOQItemCreate` has no `unit_price` field → `item_in.unit_price` AttributeError; even if fixed, `unit_price = qty × price` then service computes `total = quantity × unit_price` → **qty² total**. | `routers/boq_items.py:38-43`; `schemas/boq_item.py:10-12`; `services/boq_item_service.py:35,46` |
| Q-02 | HIGH | **Wall-length operator-precedence bug:** `length = a or b or math.sqrt(area) if area>0 else 5.0` parses as `(a or b or c) if cond else 5.0` → every wall with no area (all walls) = **5 m fixed length**. Live in aggregation. | `services/quantity_engine.py:117`; `boq_aggregator.py:110-115` |
| Q-03 | HIGH | **Comparison endpoint broken:** `Drawing.project_id` does not exist (model has only `building_id`) → AttributeError → 500. | `services/comparison_report.py:13`; `models/drawing.py:19-33` |
| Q-04 | HIGH | Auto-cost comparison always ~0: price map keyed by library `element_type` strings vs enum keys — `price_map.get(et, 0)` misses every type. Mixed-unit quantities summed (m+m²+m³). | `services/boq_aggregator.py:101,147-150` |
| Q-05 | HIGH | **No INSERT scale/transform applied** — block-local coordinates measured; scaled blocks → wrong quantities. No `$INSUNITS`/drawing-scale handling; units assumed meters. | `services/boq_extraction_service.py:304-329` |
| Q-06 | HIGH | Arc length bug: arcs >180° measured as complement (270°→90°). | `services/boq_extraction_service.py:385-386` |
| Q-07 | HIGH | Unit heuristics corrupt dimensions: `20 سم` → 20 m thickness; no unit-of-measure model. | `quantity_engine.py:214-216`; `dimension_extractor.py:50-57` |
| Q-08 | MED | Duplicated layer classification (extraction vs AI) with different vocabularies; substring rules misclassify (`"color"`→COLUMN, `"floor"`→SLAB). | `boq_extraction_service.py:7-19,26`; `classifier_rules.py:44-133` |
| Q-09 | MED | `geometry_type in ("LWPOLYLINE, POLYLINE, SPLINE")` is a single-string check — matches only `"LWPOLYLINE"`. | `classifier_rules.py:181` |
| Q-10 | MED | No opening/void subtraction; no tolerance/rounding strategy; default dimensions silently substituted with no "estimated" flag. | `quantity_engine.py` defaults |
| Q-11 | MED | Duplicated/inconsistent pricing paths: `price_element` (never called) vs `link_element_to_price` (no markup) vs aggregate-level `calculate_markup`. | `pricing_engine.py:44-61`; `boq_item_service.py:22-51`; `boq_aggregator.py:144` |
| Q-12 | LOW | **Zero test coverage for the entire BOQ/quantity domain** — all Q-01…Q-11 are untested. | `tests/` listing |
| Q-13 | LOW | Dead code: `geometry_utils.py` (whole file, contains its own arc bug), `estimate_rebar`, `estimate_element_dimensions`. | grep callers |

### 3.7 CAD / Drawings

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| C-01 | HIGH | **DWG support unreliable by design:** without ODA converter, `ensure_dxf` returns raw DWG bytes written to a `.dxf` temp file → guaranteed parse failure → FAILED. The ezdxf "fallback" cannot read binary DWG. | `dwg_converter.py:21-26,79-101` |
| C-02 | HIGH | No magic-byte validation — a renamed text file is accepted and processed. | `drawing_service.py:52-61` |
| C-03 | MED | Batch accounting fabricates results: per-file `success=True, drawing_id=None` always; failed extractions counted as completed; `BatchJob.error_message` never set. | `drawing_service.py:103-117`; `routers/drawings.py:103-110` |
| C-04 | MED | CPU-heavy extraction runs synchronously in the request (large DXF blocks the worker; 3 s frontend polling, no backoff). | `drawing_service.py:76-83`; `DrawingViewerPage.jsx:190-211` |
| C-05 | LOW | No drawing versioning/revisions; preview re-parses DXF per request (no cached SVG). | `drawings.py:130-170` |

### 3.8 Financial Domain (payments, contracts, retention)

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| P-01 | HIGH | **No payment state machine:** PENDING→PAID allowed directly; `approve` repeatable; no REJECTED flow; `mark_paid` overwrites `approved_by` (no `paid_by` column). | `payment_service.py:95-130`; `routers/payments.py:92-103` |
| P-02 | HIGH | Payment creation: no check that stage's building matches contract's building; **duplicate payments per stage allowed** (no unique constraint); **no Σ ≤ contract-value cap** (over-payment possible); stage weights never validated to sum 100%. | `payment_service.py:77-93` |
| P-03 | HIGH | **No VAT anywhere in the financial domain** (ZATCA/KSA 15% VAT only exists in BOQ markup). No tax flags on contracts/payments. | `pricing_engine.py:9` vs `payment_service.py:24-31` |
| P-04 | MED | Retention is a **disconnected manual ledger**: amounts hand-entered, never derived from payment retentions; totals aggregate across ALL contracts; no maintenance-period check before release. | `retention_service.py:33-43,63-69` |
| P-05 | MED | Rounding inconsistency: gross/net/retention rounded independently → `net ≠ gross − retention` (±0.01). | `payment_service.py:31`; `pricing_engine.py:32-41` |
| P-06 | MED | Contracts list: loads ≤1000 rows, filters in Python, `contractor_name`/`building_name` always null in response. | `routers/contracts.py:24-35` |
| P-07 | LOW | `Contract.status == "active"` string-compare against enum column (works on SQLite by accident). | `reports_service.py:42` |
| P-08 | POS | QC-gate before payment approval works and is tested. | `test_qc_gate.py` |

### 3.9 Quality Control

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| QC-01 | HIGH | **No evidence/photos** — QC record is only notes; no checklists, no sign-off. | `models/quality_check.py:14-27` |
| QC-02 | MED | Same user can create and PASS a check (no inspector/approver separation). | `routers/quality_checks.py:38-68` |
| QC-03 | MED | Gate is one-directional: QC can be flipped to FAILED after payment approval; no revocation/flag. | `payment_service.py:99-101` |

### 3.10 HR

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| H-01 | MED | No shifts, no overtime, no payroll — "payroll" is Σ monthly_salary KPI; `check_in`/`check_out` never used in any computation; no leave balances. | `employee_service.py:58-67`; `models/employee.py:8-48` |

### 3.11 Reporting & Completion Reports

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| R-01 | MED | `paid_ratio` unclamped → can exceed 100 → **negative progress-bar widths** in generated PDF; photo `src` unescaped (self-XSS in PDF). | `completion_pdf_service.py:191,233,470-474,518` |
| R-02 | MED | Excel export: Unit-Price and Description columns hardcoded blank. | `excel_exporter.py:94-99` |
| R-03 | MED | `avg_progress` is unweighted cross-project average (misleading KPI). | `reports_service.py:35-37` |
| R-04 | MED | Completion `report_data` is an unvalidated, unversioned JSON blob; status is a free string; no approval workflow; no audit on mutations. | `completion_report_service.py:69-80` |
| R-05 | LOW | Playwright PDF needs internet (Google Fonts) and boots a browser per export; ReportLab Arabic font silently falls back to boxes. | `completion_pdf_service.py:563,638`; `pdf_exporter.py:21-25` |
| R-06 | POS | Snapshot/archive completion-report model with parent chain and clone-previous is honest and well-built; the 6-page A4 landscape PDF builder is tested (HTML layer). | `completion_report_service.py`; `test_completion_pdf_builder.py` |

### 3.12 AI Classification

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| AI-01 | MED | `ClassificationTraining` model entirely unused; no persisted training corpus or retraining job; learned memory is in-process only. | `models/classification_training.py`; `auto_learner.py:11-34` |
| AI-02 | MED | **No evidence store** for AI decisions (no prompt/response/raw label); no audit entries for AI reclassification; auditor cannot reconstruct *why* an element was classified. | `ai_classifier_service.py:73-191` |
| AI-03 | MED | LLM failures silently swallowed; `is_available()` never called — UI can't show Ollama is down. | `llm_classifier.py:83-97` |
| AI-04 | MED | Confidence thresholds inconsistent across pipeline stages (0.6 vs 0.7 vs 0.8 semantics). | `confidence_scorer.py:39-44`; `ai_classifier_service.py:102` |
| AI-05 | LOW | No prompt-injection guard for DXF text embedded in LLM prompt; no caching; no per-user rate/cost control. | `llm_classifier.py:50` |
| AI-06 | POS | Human-in-the-loop exists (unclassified queue, manual/bulk classify, AI reclassify flag); confidence + source recorded on elements. | `routers/boq_elements.py:29-83` |

### 3.13 Audit Logging

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| AL-01 | MED | Coverage: only price-library, payment approve/paid, BOQ classify. **Not audited:** contracts, projects, buildings, stages, drawings, employees, attendance, retention, QC, completion reports, users, login, AI reclassification. | grep `audit` across services |
| AL-02 | MED | `ip_address` parameter never passed by any caller. Audit self-commits break transactionality; audit write failures are uncaught after main commit. | `audit_log_service.py:12-36` |
| AL-03 | LOW | `AuditLog.user_id` has no FK. | `models/audit_log.py:11` |

### 3.14 Background Jobs & Performance

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| B-01 | HIGH | **No background jobs at all** — CAD extraction, batch uploads, and Playwright PDF export all run synchronously inside HTTP requests (frontend uses 120 s timeouts). | `drawing_service.py:76-117`; `completion_reports.py:123-157` |
| B-02 | MED | No cache anywhere (only in-process classification memory). No request-ID middleware. | grep |

### 3.15 Deployment / Infra / Testing

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| I-01 | HIGH | **Uploads not persisted in Docker** (no volume for `uploads/`) → data loss on redeploy. | `docker-compose.yml` volumes |
| I-02 | MED | No health endpoint (`/api/v1/health` → 404); no backend/frontend healthchecks in compose. | `uvicorn.log:93`; compose |
| I-03 | MED | **Not a git repository** — no version control; CI, .gitignore, .github inert. | `git status` |
| I-04 | MED | `npm run lint` broken (eslint missing from devDeps, no config). CI runs neither frontend tests nor lint. | `package.json:9`; `ci.yml` |
| I-05 | MED | Backend tests skip entire domains: drawings, BOQ elements/items/summary, price library, retentions, quality checks, employees, contractors write paths. No e2e. | `tests/` |
| I-06 | LOW | README test count stale (111 vs actual 119). Duplicate `qb_dev.db` at root and backend. Dev artifacts (logs, dist, temp/ 44 MB) on disk. | README; md5 mismatch |
| I-07 | POS | Test isolation is exemplary: `qb_test.db` + per-test drop/create/seed; RBAC sweep of 27 endpoints; static security guardrails. | `conftest.py:13-29`; `test_rbac_matrix.py` |

### 3.16 Frontend UX / Code Quality

| ID | Sev | Finding | Evidence |
|---|---|---|---|
| UX-01 | HIGH | No pagination/sorting/search UI on any list (projects fetched `page_size=100`; employee/payment lists unbounded). | `CompletionPercentagePage.jsx:68` |
| UX-02 | HIGH | Native `prompt()` edits progress with **no input validation** (200% accepted); native `alert`/`confirm` despite a styled `ConfirmModal`. | `ProjectDetailPage.jsx:287,533-536`; `DrawingsPage.jsx:217`; `PriceLibraryPage.jsx:71` |
| UX-03 | HIGH | Logout only on the dashboard; most pages never read auth state. | `DashboardPage.jsx:119` |
| UX-04 | MED | Duplication: `STATUS_CONFIG` ×7, `formatCurrency` ×7, element-type maps ×3, blob-download ×3, page header markup ×18. | grep |
| UX-05 | MED | No shared layout component; inconsistent back/nav affordances; no skeletons/toasts/optimistic updates. | all pages |
| UX-06 | MED | Monolithic pages (DrawingViewer 983, ProjectDetail 570, CompletionPercentage 499, ProgressPrintReport 783 lines). | — |
| UX-07 | LOW | No i18n (hardcoded Arabic); mixed number localization (`toLocaleString('en-US')` vs Arabic); no focus traps; sparse aria labels. | `DrawingViewerPage.jsx:63` |
| UX-08 | LOW | Dead API surface: `completionReportsApi.remove` never called (no delete/archive report UI). | `features/reports/completionReportsApi.js` |
| UX-09 | POS | Completion-percentage module UX is strong: dirty-tracking save status, offline trial mode, delta badges, print-optimized A4 report, tested `defaultCompletionData.js`. | `CompletionPercentagePage.jsx`; tests |

---

## 4. Verified Critical Bugs (reproduced first-hand)

The following were **re-executed during this audit** (not just read):

1. **BOQ item-link 500** — `POST /api/v1/boq-items` fails at `routers/boq_items.py:41` (`item_in.unit_price` AttributeError; schema has no such field).
2. **Wall length = 5 m** — operator precedence at `quantity_engine.py:117` confirmed by reading; expression evaluates to the `else 5.0` branch whenever `geometry_area == 0` (always, for walls).
3. **Comparison endpoint 500** — `Drawing.project_id` attribute does not exist (`models/drawing.py` has only `building_id`).
4. **PDF export via HTTP was 500** (latin-1 header bug) — **fixed and verified green in this session** (15/15 live API e2e checks now pass; see §6).
5. **`ProtectedRoute` no-op** — `frontend/src/App.jsx:36-38` returns children unconditionally.
6. **SQLite FK pragma off** — `core/database.py` has no `connect_args={"check_same_thread": False, "pragma": [...]}` for foreign_keys.

---

## 5. Strengths (preserve these)

- Clean API envelope (`APIResponse`) + uniform `require_roles` gating on all 19 routers.
- No raw SQL, no eval/exec, no cloud API keys, bcrypt hashing.
- Honest snapshot/archive completion-report model with clone-previous inheritance chain.
- Exemplary test isolation (qb_test.db, per-test reset) + RBAC sweep + static security guardrails.
- QC-gate wired into payment approval, covered by tests.
- Completion PDF builder: 6-page A4 landscape, tested HTML layer; print-optimized frontend report.
- Per-vendor code-splitting and lazy-loaded routes.
- Playwright chromium correctly installed in the backend Docker image (recently fixed).
- Strong documentation set (README, PAGES_DOCUMENTATION, skills/, MASTER_PLAN).

---

## 6. Already Fixed During This Audit Session

| Fix | Where | Status |
|---|---|---|
| PDF export 500 over HTTP (latin-1 Content-Disposition with Arabic filename) | `routers/completion_reports.py:154` | Verified via live API (15/15 checks) |
| Same latin-1 header bug in BOQ Excel + PDF exports | `routers/boq_summary.py:46,70` | Applied |
| PDF export server-side traceback logging | `routers/completion_reports.py:141` | Applied |
| Frontend blob-error message parsing (was always "خطأ غير معروف") | `ProgressDashboard.jsx:118-138` | Applied |
| Playwright missing from requirements + Dockerfile | `requirements.txt`; `backend/Dockerfile` | Applied |
| Frontend defaultCompletionData tests aligned with new data | `src/test/defaultCompletionData.test.js` | Passing |

---

## 7. Severity Rollup

| Severity | Count | Themes |
|---|---|---|
| **Critical** | 5 | JWT secret default (S-01); seed passwords (S-02); no route RBAC (A-01); unauthenticated /uploads (F-01); BOQ link 500 + qty² (Q-01) |
| **High** | 22 | refresh-token revocation, weak password policy, IDOR, 500-leak/no-logging, no rollback, FK pragma off, no migrations, wall 5 m bug, comparison 500, auto-cost 0, no scale/units, arc bug, unit heuristics, DWG sham fallback, no size limit, no state machine, no VAT, duplicate/over payments, QC no evidence, sync-heavy processing, uploads not persisted, pagination gaps |
| **Medium** | 25 | audit coverage, no soft-delete, N+1, batch fabrication, retention ledger, rounding, XSS-in-PDF, Excel blanks, KPI unweighted, AI traceability, localStorage JWT, no health endpoint, not a git repo, lint broken, test gaps, UX duplication, etc. |
| **Low** | 18 | dead code, CORS, enum inconsistency, stale README, dev artifacts, a11y, i18n, etc. |
| **Positive** | 6 | no SQLi, QC gate tested, snapshot model, test isolation, RBAC sweep, docs |

---

## 8. What This Means for the Roadmap (Phase 13 pre-view)

The remediation sequence will prioritize by **business value × risk**:

- **P0 (Critical, week 1-2):** Secure-the-gates — fail closed: no default JWT secret, no seed passwords in prod, real `ProtectedRoute` + logout everywhere, auth on `/uploads`, IDOR fixes, health endpoint, git init + real CI.
- **P0 (Critical, week 1-2):** Stop wrong numbers — BOQ item link fix + tests, wall-length precedence fix + tests, comparison endpoint fix, clamp `paid_ratio`.
- **P1 (High, weeks 3-6):** Data integrity — FK pragma + migrations (Alembic), unique constraints, transactions + rollback, payment state machine + VAT + over-payment cap, upload limits + magic bytes + persistence volume.
- **P1:** Audit coverage expansion (all mutations), login rate limiting, refresh-token revocation, 500 logging + safe error bodies.
- **P2 (Medium, weeks 7-12):** Quantity engine hardening (units, scale, voids, traceability), drawing versioning, background jobs (ARQ/Celery) for extraction + PDF, shared frontend kit (STATUS_CONFIG, formatCurrency, page shell, toast), pagination/search, AI evidence store + training persistence.
- **P3 (Future):** Payroll, procurement, document control, i18n, multi-tenancy.

Every roadmap item will carry: problem, evidence, business value, technical impact, risk, complexity, dependencies, implementation plan, testing plan — per the master plan (Phase 13).

---

*Next phase per master plan: **Phase 1 — Deep Industry Research** (construction ERP, QS, standards, competitive analysis) before any major architectural changes.*
