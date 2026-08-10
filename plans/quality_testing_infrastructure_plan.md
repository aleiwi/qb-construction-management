# QB Quality & Test Infrastructure Plan

**Project:** QB Construction Management System
**Phase:** Test Infrastructure + Hardening
**Version:** 1.0
**Date:** 2026-08-09
**Status:** Approved — awaiting execution

---

## 1. Vision

Turn QB from a working-but-unprotected system into a **verified system**:

- Every backend endpoint covered by automated tests (unit + integration + RBAC), per `skills/testing-conventions.md`
- Every page enforced to the mandatory **Loading / Error / Empty** three-state contract (`skills/frontend-conventions.md` §4)
- A CI gate that makes it **impossible** to merge code that breaks the build or fails tests
- Eliminate the class of bugs that already bit us in production:
  - `500: name 'drawings_total' is not defined` on the Reports KPIs page (survived to production — zero tests existed)
  - `npm run build` silently broken by an unclosed `<div>` in `ProgressDashboard.jsx`
  - Stale aggregates (`projects.avg_progress` stuck at `0.0` forever)

---

## 2. Findings Summary (Evidence)

| # | Finding | Severity | Evidence |
|---|---------|----------|----------|
| F1 | No automated tests anywhere (backend or frontend) | 🔴 | `backend/tests/` does not exist; no test script in `package.json` |
| F2 | Undefined variable crash in KPI aggregation | 🔴 | `reports_service.py` referenced `drawings_total` that was never defined → HTTP 500 |
| F3 | Build had zero guardrails | 🔴 | `ProgressDashboard.jsx` unclosed `<div>` broke `vite build`; no lint, no CI |
| F4 | Stale aggregate: `projects.avg_progress` never updated | 🟡 | Reports radial chart showed 0% while completion reports showed 94.8% |
| F5 | Dead code accumulates (unused imports/vars) | 🟡 | `usePermissions` unused in `ReportsPage.jsx`; likely more |
| F6 | SQLite single-writer locks at scale | 🟢 | Async sessions + SQLite; Postgres is the stated target in existing plans |
| F7 | Non-3-state screens risk silent failures | 🟡 | Error states exist on Reports page but not enforced project-wide |

---

## 3. Execution Phases

### Phase 1: Backend Test Infrastructure (pytest)

**Goal:** First test suite, wired to conventions.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 1.1 | Add `pytest`, `pytest-asyncio`, `httpx` to `backend/requirements-dev.txt` | `backend/requirements-dev.txt` | 🔴 |
| 1.2 | Test DB strategy: file-based SQLite `qb_test.db` per session + `create_all` fixture; **never** touches `qb_dev.db` | `backend/tests/conftest.py` | 🔴 |
| 1.3 | Auth fixture: create users for every role (ADMIN, PROJECT_MANAGER, ENGINEER, ACCOUNTANT, CONTRACTOR) with realistic Arabic seed data per `testing-conventions.md` §5 | `backend/tests/conftest.py` | 🔴 |
| 1.4 | **Integration suite: every API endpoint** — happy path + 401 (no token) + 403 (wrong role), using the exact RBAC matrix from each router's `require_roles` | `backend/tests/test_api_*.py` | 🔴 |
| 1.5 | **Mandatory edge cases** (`testing-conventions.md` §1): 0% / 100% progress, zero and negative amounts, missing resources → 404 | `backend/tests/test_api_*.py` | 🔴 |
| 1.6 | **Unit tests for financial math**: stage payment calculation, completion overall formula (structure×0.5 + finishing×0.5), partial/over-payment rejection | `backend/tests/test_services.py` | 🔴 |
| 1.7 | Regression tests for F2: `GET /reports/kpis` returns 200 with `drawings`, `boq`, `completion` blocks populated | `backend/tests/test_api_reports.py` | 🔴 |
| 1.8 | `pytest` + `pytest --cov` runnable via one command; document in README | `backend/README.md` | 🟡 |

**Acceptance:** `pytest` green on CI-clean checkout; every router in `app/routers/` has ≥1 happy + ≥1 RBAC test.

---

### Phase 2: Latent-Bug Sweep (Backend Audit)

**Goal:** Hunt every remaining `drawings_total`-class bug.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 2.1 | Static audit: every service function that builds a response dict → verify every referenced name is assigned on all paths (`ruff` + manual review) | `backend/app/services/*.py` | 🔴 |
| 2.2 | Audit all `except Exception` blocks → no silent `pass` (per `backend-conventions.md` §3); log explicitly | `backend/app/services/*.py` | 🟡 |
| 2.3 | Fix stale aggregate: sync `projects.avg_progress` (and completion) on report save/update instead of leaving table columns frozen | `completion_report_service.py`, `project_service.py` | 🟡 |
| 2.4 | Verify every write path is wrapped in an explicit transaction (per `backend-conventions.md` §4) | `backend/app/services/*.py` | 🟡 |
| 2.5 | Confirm all settings/secrets come from env via `core/config.py` (per `backend-conventions.md` §5) | `backend/app/core/config.py` | 🟡 |

---

### Phase 3: Frontend Quality Gates

**Goal:** Components and pages covered; three-state contract enforced.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 3.1 | Add `vitest` + `@testing-library/react` + `jsdom`; `npm test` script | `frontend/package.json`, `frontend/vite.config.js` | 🔴 |
| 3.2 | Component smoke tests (per `frontend-conventions.md` §8): render + minimal interaction for key components — `ProgressInputForm`, `ProgressDashboard`, `NewPeriodModal`, `KPICard` | `frontend/src/components/**/*.test.jsx` | 🔴 |
| 3.3 | Page contract tests: every data page renders all three states — Loading spinner / Error (with retry button) / Empty state message | `frontend/src/pages/*.test.jsx` | 🟡 |
| 3.4 | Add ESLint (+ `react-hooks` rules) and Prettier; fix existing warnings (dead imports like `usePermissions` in ReportsPage) | `frontend/eslint.config.js`, `.prettierrc` | 🟡 |
| 3.5 | Guardrail script: `npm run build` must pass before any merge — wire into Phase 4 | `frontend/package.json` | 🔴 |

---

### Phase 4: CI & Guardrails

**Goal:** No regression ships again.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 4.1 | GitHub Actions workflow `ci.yml`: `npm ci` → `npm run lint` → `npm test` → `npm run build`; `pip install -r requirements-dev.txt` → `pytest` | `.github/workflows/ci.yml` | 🔴 |
| 4.2 | Pre-commit hook (or `husky`): lint + build gate locally | `.pre-commit-config.yaml` / `frontend/package.json` | 🟢 |
| 4.3 | Document the full check flow in `README.md` (one command to verify everything) | `README.md` | 🟡 |

---

### Phase 5: Data-Layer Hardening (Postgres Path)

**Goal:** Make the stated Postgres migration real, safely.

| # | Task | Files | Priority |
|---|------|-------|----------|
| 5.1 | DB URL from env (already via config) + `asyncpg` optional dependency; document `DATABASE_URL=postgresql+asyncpg://...` | `backend/app/core/config.py` | 🟢 |
| 5.2 | Add lightweight migration path (Alembic baseline) so schema changes stop being hand-applied to `qb_dev.db` | `backend/alembic/` | 🟢 |
| 5.3 | Test suite runs against SQLite (fast) with one CI job against Postgres (parity) | CI config | 🟢 |

---

## 4. Test Matrix (mandatory minimum, per `testing-conventions.md`)

| Level | Scope | Minimum cases |
|-------|-------|---------------|
| Unit | Services (financial math, overall-progress, clone-previous logic) | 0% / 100% / partial / over-payment rejected / zero amounts |
| Integration | Every `@router` endpoint | happy path, 404 missing resource |
| RBAC | Every protected endpoint | correct role → 200; wrong role → 403; no/invalid token → 401 |
| Frontend | Key components + all pages | render, loading, error, empty; one interaction each |
| E2E smoke | Puppeteer-core script (already proven in session) | login → reports page 200 → completion flow → zero console errors |

**Acceptance criteria (from `testing-conventions.md` §4):**
- 100% pass rate on existing tests before any merge
- Any new financial feature ships with minimum coverage or it does not ship

---

## 5. Verification Plan (manual, post-implementation)

1. Fresh `git clone` → run `pytest` → all green with zero test-time access to `qb_dev.db`.
2. Run `npm test && npm run lint && npm run build` → all green.
3. `GET /api/v1/reports/kpis` with ADMIN/PM/ACCOUNTANT → 200; ENGINEER → 403; no token → 401 (scripted).
4. Create → clone → update → delete a completion report via API; KPIs reflect it live; DB returns to original state.
5. Headless smoke (Chrome + puppeteer-core): login → `/reports` (completion section visible, 94.8%) → `/completion-percentage` → enter project → NewPeriodModal suggests next month → **zero console errors**.
6. Break a line on purpose → CI must fail.

---

## 6. Risks & Mitigations

| Risk | Mitigation |
|------|-----------|
| Test DB pollution / data loss | Tests use isolated `qb_test.db`; fixture recreates schema each run |
| Async SQLAlchemy + pytest complexity | `pytest-asyncio` with a single event-loop-scoped session fixture pattern |
| Time cost of full endpoint coverage | Phase 1 targets critical modules first (completion-reports, reports/kpis, payments, auth); breadth in follow-up |
| CI not available (no remote yet) | Guardrails still enforced locally via scripts; CI yaml ready for when repo is pushed |

---

## 7. Out of Scope (this phase)

- Rewriting state management (React Query adoption is separate, per `frontend-conventions.md` §2)
- Full Postgres migration execution (only the path + baseline)
- New product features — hardening only

---

*Aligned with: `skills/testing-conventions.md`, `skills/backend-conventions.md`, `skills/frontend-conventions.md`, `skills/security-conventions.md`, `skills/api-structure.md`.*
