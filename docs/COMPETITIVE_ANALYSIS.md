# COMPETITIVE_ANALYSIS.md — Feature Gap Matrix

**Date:** 2026-08-10
**Sources:** docs/SYSTEM_AUDIT.md (our system, verified), docs/RESEARCH_LIBRARY.md (industry best practice, sourced)
**Method:** Feature → Our System (verified current state) → Industry Best Practice → Gap → Priority (P0/P1/P2/P3) → Recommended Implementation.

---

## A. CORE SECURITY & PLATFORM

| # | Feature | Our System (verified) | Industry Best Practice | Gap | Priority | Recommended Implementation |
|---|---------|----------------------|------------------------|-----|----------|------------------------------|
| 1 | Authentication | JWT bearer; login works; sessions survive only in memory | Multi-factor auth (TOTP), session revocation | MFA absent; no token revocation; token expiry config hardcoded | P1 | Add TOTP MFA (pyotp, stdlib-only), refresh-token rotation, per-user revocation list; make expiry configurable |
| 2 | Authorization | Role-based (admin/PM/engineer/accountant/contractor); roleAccess.js dead; ProtectedRoute is no-op (`App.jsx:36-38`) | Route guards server + client; job-level security (Vista); least privilege | Client guard broken; no project-scoped access | **P0** | Implement real route guard + server-side project-scope checks (ProjectMember table), role→permission matrix in one place |
| 3 | Secrets | SECRET_KEY default hardcoded (`config.py:12`); served in dev and prod | Externalized secrets, fail-closed in prod | Fail-open default | **P0** | Fail-closed JWT secret: raise RuntimeError in prod if unset; env-based config; document .env template |
| 4 | Error handling | `main.py:151-156` generic 500 leaks `str(exc)`, no logging | Structured logging, sanitized errors, trace IDs | Full exception disclosure to clients; zero observability | **P0** | Global handler: log `logger.exception`, return generic message + trace ID header; structured logging (JSON) |
| 5 | Static file access | `/uploads` mounted unauthenticated (`main.py:159-160`) | Signed URLs / auth-guarded files | Any uploaded PDF/photo readable by anyone | **P0** | Remove static mount; authenticated download endpoint with per-project access checks |
| 6 | Audit logging | `audit/` module covers 3/20 domains (buildings, stages, reports) | ISO 27001 8.15: append-only, tamper-evident, admin-immune | No log integrity; most domains unlogged | P1 | Full-domain audit middleware; HMAC-chained/append-only store; export API |
| 7 | Migrations | `create_all` only; no schema versioning | Versioned migrations (Alembic) | Breaking changes with existing data | P1 | Alembic baseline + per-release migrations |
| 8 | Referential integrity | SQLite FK pragma off (`database.py`) | FK enforcement | Orphans possible | P1 | PRAGMA foreign_keys=ON via event listener |
| 9 | Version control | Not a git repo | Git + CI | No history, no review | **P0** | `git init`, .gitignore, first commit; CI (GitHub Actions) for backend+frontend |
| 10 | Health/readiness | None | `/health` + `/readyz` liveness/readiness | Ops blind to dead server | P0 | Health endpoint (DB ping, deps), used by docker-compose healthcheck |

## B. BOQ / QUANTITIES / COST ENGINE (CORE DOMAIN)

| # | Feature | Our System (verified) | Industry Best Practice | Gap | Priority | Recommended Implementation |
|---|---------|----------------------|------------------------|-----|----------|------------------------------|
| 11 | Wall length calc | `quantity_engine.py:117` precedence bug → wall always 5.0 m | Accurate geometry + scale calibration (Bluebeam/CostX) | **Critical math bug** | **P0** | Fix precedence; add unit tests incl. regression |
| 12 | BOQ item price | `boq_items.py:41` `item_in.unit_price` AttributeError → link always 500; schema lacks unit_price; naive fix squares quantity | Clean link BOQ←price with quantity preserved | **Critical** | **P0** | Add `unit_price` to schema + service; verify quantity not double-applied; regression test |
| 13 | Drawing comparison | `comparison_report.py:13` `Drawing.project_id` → always 500 | Auto-revision compare (CostX) | **Critical** | **P0** | Join via `building_id`; add drawing revision semantics |
| 14 | Geometry classifier | `classifier_rules.py:181` single-string `in` check → never matches multi types | Symbol/tag recognition with confidence | **Critical** | **P0** | Split string; parse multi-entity; confidence flags |
| 15 | Pricing engine | Hardcoded 15/10/5/15% O&P; margin on CAD vs on raw (unclear) | Configurable rate build-up (materials+wastage+labour+plant+O&P, per-market) | Rigid, opaque rates | P1 | Configurable rate templates per project; document formula; defaults per market (KSA O&P ~5-15%) |
| 16 | Measurement standards | None | NRM2/CESMM4 item references; rebar in tonnes | No standard linkage | P1 | Add optional measurement-rule reference + unit taxonomy per item |
| 17 | Scale handling | None (lengths assumed metric/plan units) | Explicit scale calibration (PlanSwift/Bluebeam) | Dimension errors on scaled drawings | P1 | Sheet-level scale input; engine applies scale; default 1:1 with warning |
| 18 | Takeoff accuracy | AI classifier + human review queue | Human-in-the-loop + confidence flags + benchmark acceptance (~3-5%) | No confidence signal in review queue | P2 | Confidence % per item; reviewer decision recorded; provenance tuple (RICS AI standard) |

## C. COMPLETION / PAYMENTS / FINANCIALS

| # | Feature | Our System (verified) | Industry Best Practice | Gap | Priority | Recommended Implementation |
|---|---------|----------------------|------------------------|-----|----------|------------------------------|
| 19 | Progress reports | Draft/approved lifecycle, KPI dashboard, PDF/Excel export | Baseline-anchored IPC cycle (FIDIC 28d) | No baseline; no submittal/approval cycle | P1 | Report cycle tied to schedule baseline; formal submit→review→certify states |
| 20 | EVM KPIs | Single composite score, opaque | SPI/CPI/SV/CV/EAC/TCPI with definitions | No formulas, no baselines | P1 | KPI engine with standard EVM formulas; document definition/source/owner per KPI |
| 21 | Retention | Retention % on reports; **no ledger, no release logic** | 50% at taking-over, balance after defects (FIDIC); integrated in AR (Jonas) | Disconnected from ledger | P1 | Retention ledger; release workflow per contract terms |
| 22 | Payment state machine | Single approve flow | Advance/partial/final payments, AIA-style certification, compliance gates before pay (ACC, Sage) | No advance repayment, no certification workflow | P1 | Payment state machine; configurable advance repayment schedule; VAT-on-retention handling (ZATCA tax point = completion report) |
| 23 | VAT | Not modeled in financial domain | 15% KSA standard-rated, tax point at completion-report issuance, reverse charge for non-resident | No VAT field/ledger | P1 | VAT fields on invoices/reports; report approval → VAT trigger; configurable rate |
| 24 | Change orders | Absent | PCO→CCO/OCO tiering with budget-code linkage (Procore) | No change module | P2 | Change module: variation routes (contract rates → analogous → fair valuation), cost-code linkage |
| 25 | WIP analysis | None | Over/under-billing WIP reports (Buildertrend) | No WIP view | P2 | WIP report: billed vs earned vs incurred per project |

## D. QUALITY / DOCUMENT CONTROL

| # | Feature | Our System (verified) | Industry Best Practice | Gap | Priority | Recommended Implementation |
|---|---------|----------------------|------------------------|-----|----------|------------------------------|
| 26 | Drawing versions | Single drawing records; no revision codes | Version (system) vs revision (Aconex); P/C codes + S0-S7 (ISO 19650); issue codes IFC/IFR/IFA/IFT | No revision model | P1 | Revision field + status codes on drawings; versioning of uploads |
| 27 | Submittal/transmittal | Absent | Submittal = approval doc; transmittal = custody (AIA/Crossrail) | No document workflows | P2 | Submittal/transmittal entities; approval states A/B/C/E (USACE) |
| 28 | QC/ITP module | Absent | ITP→work lots→checklists→evidence (RIB CX); inspections/observations (Procore) | No QC | P2 | ITP module with checklists + photo evidence; NCR/CAPA aligned to ISO 9001 10.2 |
| 29 | RFI module | Absent | Draft→Open→In Review→Responded→Resolved (AIA G716); RFI ≠ cost change | No RFI | P2 | RFI lifecycle; owner/ball-in-court; link to drawings |

## E. AI / FUTURE-PROOFING

| # | Feature | Our System (verified) | Industry Best Practice | Gap | Priority | Recommended Implementation |
|---|---------|----------------------|------------------------|-----|----------|------------------------------|
| 30 | LLM classifier security | DXF text pasted into prompts (`llm_classifier.py`) | OWASP LLM01: treat docs as untrusted; indirect injection via drawings | Prompt-injection risk | P1 | Mark external content as untrusted, deterministic extraction, output validation, citations |
| 31 | AI evidence store | None | RICS responsible-AI: provenance tuple (source+revision+rule set+model version+confidence+reviewer+audit) | No provenance | P1 | Evidence table for every AI output; reviewer decision recorded |
| 32 | AI takeoff | Classifier with review queue | AI-assisted + human-in-the-loop; ~90-95% accuracy clean vector plans; acceptance tolerance | Confidence absent in queue | P2 | Confidence scores; dip-sampling benchmarks; go/no-go acceptance criteria |

## F. PLATFORM / UX

| # | Feature | Our System (verified) | Industry Best Practice | Gap | Priority | Recommended Implementation |
|---|---------|----------------------|------------------------|-----|----------|------------------------------|
| 33 | Responsive UX | CSS via Tailwind (index.css), JSX pages; on-chrome tested, some inline window widths | Mobile-first for field users (Fieldwire offline-first) | No mobile field UX | P3 | Responsive pass; offline field mode later |
| 34 | Background jobs | Heavy CAD extraction + PDF generation synchronous → request hangs | Async job queue with status | Long requests | P2 | Celery/FastAPI BackgroundTasks; job status endpoint |
| 35 | Data retention | No retention policy | Records ≥6 yrs (KSA practice), ISO 27001 8.10 | Compliance gap | P3 | Retention config + archival job |

---

## PRIORITY SUMMARY

- **P0 (do first — broken or insecure):** #2,3,4,5,9,11,12,13,14 → security gates + core math fixes
- **P1 (strengthen core):** #1,6,7,8,10,15,16,17,19,20,21,22,23,30,31
- **P2 (grow domain):** #18,24,25,27,28,29,32,34
- **P3 (polish):** #33,35

## MARKET POSITIONING TAKEAWAY

- Our differentiator vs Procore/ACC: **CAD-native quantity extraction** (auto BQ from drawings) — the incumbents still require manual/2D-3D takeoff tools. The AI classifier (with human-in-the-loop) is the wedge.
- Our weakness vs SMB tools (Buildertrend/CoConstruct): portals, financials depth (WIP/AIA), and polish.
- KSA angle: none of the global tools are ZATCA-integrated natively; BuildSmart claims KSA tax approval — our VAT/completion-report tax-point handling is a defensible local edge (P1).
- Recommendation: win on "BOQ from drawing in minutes + KSA-compliant reporting", partner-wise on financials (don't rebuild GL/AP/AR — expose cost+payment APIs for Sage/Jonas-style integration in P3).
