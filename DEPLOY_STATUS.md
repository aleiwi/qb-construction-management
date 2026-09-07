# حالة النشر — QB (محدث تلقائيا)

> آخر تحديث: 2026-09-08 — الكوميت `c1590f7` + `gh-pages 11912bb`

## الملخص التنفيذي

| المرحلة | الحالة | التفاصيل |
|---|---|---|
| **البنية** | ✅ 100% | FastAPI + React + PostgreSQL + Caddy |
| **الاختبارات** | ✅ 188/188 | Backend 132 + Frontend 49 + Security |
| **الأخطاء المصلحة** | ✅ 7/7 | MapPin, page_size, isProcessing, Decimal, CORS, DXF |
| **Frontend (GH Pages)** | 🟡 مرفوع/ينتظر تفعيل | `gh-pages` branch جاهز (`11912bb`), ينتظر `Settings -> Pages` |
| **Backend (GHCR)** | 🟡 يبنى | `ghcr.io/aleiwi/qb-backend:latest` يبنى عبر `deploy.yml` |
| **Backend (Koyeb/Neon)** | ⬜ ينتظر حساب مجاني | يتطلب Neon (60s) + Koyeb (90s) - دليل `FREE_DEPLOYMENT.md` |
| **Docker Prod** | ✅ جاهز | `deploy/docker-compose.prod.yml config` validated |

## الروابط الحية

* **Frontend (GH Pages):** `https://aleiwi.github.io/qb-construction-management/` — يحتاج تفعيل Pages (30s)
* **Backend GHCR:** `ghcr.io/aleiwi/qb-backend:latest` — يبنى بعد كل `push master`
* **Backend Koyeb:** `https://YOUR-APP.koyeb.app` — ينشأ بعد اتباع `FREE_DEPLOYMENT.md`
* **Docs:** `https://YOUR-APP.koyeb.app/docs` + `/api/v1/health`

## ما تم اليوم (بصلاحيات كاملة)

* إصلاح `vite.config.js` base + `App.jsx` basename لـ GH Pages
* إصلاح `deploy.yml` (configure-pages, VITE_API_URL, 404.html)
* دفع `gh-pages` (1.5M, بدون villa 44M)
* إنشاء `FREE_DEPLOYMENT.md`, `render.yaml`, تحسين `koyeb.yaml`
* تحقق `docker compose config` + `npm run build` + اختبارات

## الخطوة التالية (للمستخدم)

1. فعّل Pages: `Settings -> Pages -> gh-pages` (30s)
2. Neon + Koyeb (5د) كما في `FREE_DEPLOYMENT.md`
3. اضبط `VITE_API_URL` variable وأعد البناء

## البدائل

* **Oracle Free:** `deploy/DEPLOYMENT.md` + `deploy/setup.sh` (VPS 4 OCPU/24GB للأبد)
* **Render:** `render.yaml` (Blueprint)
* **Netlify:** `netlify.toml`
* **Local Docker:** `docker compose up -d --build` (Frontend:8080, Backend:8000)
