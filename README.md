# نظام إدارة المقاولات المتكامل (QB)

[![CI](https://github.com/aleiwi/qb-construction-management/actions/workflows/ci.yml/badge.svg)](https://github.com/aleiwi/qb-construction-management/actions/workflows/ci.yml)
[![Deploy](https://github.com/aleiwi/qb-construction-management/actions/workflows/deploy.yml/badge.svg)](https://github.com/aleiwi/qb-construction-management/actions/workflows/deploy.yml)
[![Live Demo](https://img.shields.io/badge/demo-GitHub%20Pages-blue)](https://aleiwi.github.io/qb-construction-management/)
[![GHCR](https://img.shields.io/badge/GHCR-qb--backend-blue?logo=docker)](https://github.com/aleiwi/qb-construction-management/pkgs/container/qb-backend)

نظام ويب متكامل لإدارة شركة مقاولات: مشاريع، مباني، مراحل، مقاولون، عقود، BOQ من CAD، مستحقات، ضمان محتجز، فحوصات جودة، HR، تقارير/KPIs، ونسب الإنجاز.

> **🚀 Live Demo (مجاني):** `https://aleiwi.github.io/qb-construction-management/` — انظر `FREE_DEPLOYMENT.md` للنشر بضغطة واحدة (GH Pages + Koyeb + Neon، مجاني 100%)

> **📊 الحالة:** Frontend مرفوع على `gh-pages` (1.5M) + Backend يبنى على `ghcr.io/aleiwi/qb-backend:latest` — فعّل Pages من `Settings -> Pages` ليصبح الرابط حيا.

## Tech Stack
- **Backend**: FastAPI + SQLAlchemy (async) + JWT auth
- **DB**: SQLite (dev) / PostgreSQL (prod) — switch via `DATABASE_URL`
- **Frontend**: React 18 + Tailwind + Vite + Recharts + framer-motion + html2canvas/jsPDF
- **CAD parsing**: ezdxf

## Project Layout
```
backend/   FastAPI app (routers, services, models, schemas)
frontend/  React SPA
skills/    Mandatory conventions & domain references
tests/     pytest suite (111 tests — isolated qb_test.db)
.github/workflows/ci.yml   GitHub Actions: backend tests + frontend build + docker smoke
```

## Quick Start (Local Dev)

### Backend
```powershell
cd backend
pip install -r requirements.txt
uvicorn app.main:app --reload
# API at http://localhost:8000/docs
# Default admin: admin@qb.com / admin123
```

### Frontend
```powershell
cd frontend
npm install
npm run dev
# UI at http://localhost:5173
```

For a custom backend URL (e.g. when the API is on another host), copy `frontend/.env.example` to `frontend/.env` and set `VITE_API_URL`.

## Deployment — Free (ضغطة واحدة)

**الأسرع (GitHub Pages + Koyeb + Neon — مجاني 100% وبدون بطاقة):**

```powershell
# Windows PowerShell
powershell -ExecutionPolicy Bypass -File scripts/free-deploy.ps1

# أو Linux/macOS
bash scripts/free-deploy.sh
```
ثم فعّل Pages: `Settings -> Pages -> gh-pages` -> `https://aleiwi.github.io/qb-construction-management/` حية.
التفاصيل الكاملة: `FREE_DEPLOYMENT.md` + `koyeb.yaml` + `render.yaml` + `netlify.toml`

## Deployment — Docker (Local / Oracle Free VPS)

```bash
# 1. Copy & edit env
cp .env.example .env
# edit SECRET_KEY in .env to a long random string

# 2. Bring up the full stack (PostgreSQL + backend + frontend)
docker compose up -d --build

# 3. Verify
# Frontend: http://localhost:8080
# Backend:  http://localhost:8000/docs
# Login:    admin@qb.com / admin123
```

للـ VPS المجاني للأبد (Oracle 4 OCPU/24GB): `deploy/DEPLOYMENT.md` + `deploy/setup.sh` (Caddy HTTPS تلقائي).

The compose file spins up:
- `db` (PostgreSQL 16) — persistent volume `pgdata`
- `backend` (FastAPI/uvicorn) — connects to `db`, seeded with admin on first boot
- `frontend` (nginx serving Vite build) — proxies SPA routes

## CI/CD
`.github/workflows/ci.yml` runs on every push/PR to `main|master`:
1. `backend-test` — installs deps, runs `pytest tests/` (must be 100% green)
2. `frontend-build` — installs deps, runs `npm run build`
3. `docker-build` — builds both Docker images as a smoke test (only after 1 & 2 pass)

## Test Suite (111 tests)
```
tests/test_auth.py                     11   login + token lifecycle + role contexts
tests/test_projects.py                 14   projects CRUD + RBAC + validation edges
tests/test_completion_reports.py       21   lifecycle + clone-previous + formula (0/50/100) + RBAC
tests/test_reports_kpis.py              4   KPIs regression (F2 500 bug) + completion tracking
tests/test_payments_contracts.py       11   contracts/payments CRUD + RBAC + zero/negative edges
tests/test_rbac_matrix.py              27   role × endpoint access matrix
tests/test_completion_reports_clone.py  4   snapshot inheritance chain
tests/test_audit_log.py                 4   audit log on financial ops (admin-only)
tests/test_payments.py                  5   payment calc edge cases
tests/test_qc_gate.py                   3   QC must pass before payment approve
tests/test_security_audit.py            7   static guardrails (no raw SQL / plaintext / secrets)
```
Run (safe by design):
```powershell
cd backend
python -m pytest -v
```
Every test runs against the isolated `backend/qb_test.db` (recreated before each
test — the dev database `qb_dev.db` is **never** touched). Per-test DB reset is
provided by the autouse `setup_db` fixture in `backend/conftest.py`.

## Frontend Modules
`Dashboard` (role-gated cards) · `Projects` · `Project Detail` · `Contractors` · `Contracts` · `Drawings` · `BOQ Review` · `Payments` · `Quality Checks` · `Employees` · `Reports & KPIs` · `Completion Percentage` (PDF export) · `Audit Logs` (admin-only)

## Security (per `skills/security-conventions.md`)
- bcrypt password hashing
- JWT access tokens (24h) — refresh tokens (7d)
- RBAC enforced in **backend** on every endpoint (`require_roles` dependency)
- Contractor RLS: contractor can only access own records (enforced in route, not just UI)
- **Audit log**: every payment approve/mark-paid records user, action, entity, old value, new value → `GET /api/v1/audit-logs` (admin-only)
- No secrets in code; all via env vars (`.env.example` template)
- ORM parameterized queries only — no raw SQL

## Default Admin
- Email: `admin@qb.com`
- Password: `admin123`
- **Change immediately in production** (create new admin, disable seed admin).