# النشر المجاني الكامل — دليل ضغطة واحدة

> **مجاني 100% — بدون بطاقة — احترافي — جاهز في 5 دقائق**

هذا الدليل يشرح نشر النظام كاملا على خدمات مجانية معتمدة، بدون أي تكلفة.

---

## البنية المجانية (100% مجانية للأبد)

```
[GitHub Pages]  ──HTTPS──>  Frontend (React SPA)
                                │
                                │ VITE_API_URL
                                ▼
[Koyeb Free]    ──HTTPS──>  Backend (FastAPI + Playwright PDF)
                                │
                                ▼
[Neon Free]     ──TLS───>   PostgreSQL 16 (512MB)
```

| الخدمة | المجانية | الرابط | البطاقة |
|---|---|---|---|
| **Frontend** | GitHub Pages (100GB) | `https://aleiwi.github.io/qb-construction-management/` | لا |
| **Backend** | Koyeb Free (512MB, 0.1 CPU) | `https://YOUR-APP.koyeb.app` | لا |
| **Database** | Neon Free (512MB, 1 مشروع) | `ep-xxx.neon.tech` | لا |
| **البديل** | Render Free / Netlify | — | لا |

> **Landing page `/` تعمل بدون backend** — حتى قبل إعداد Koyeb، سيظهر الموقع التسويقي.

---

## الطريقة السريعة (3 خطوات - 5 دقائق)

### 1) فعّل GitHub Pages (30 ثانية)

`GitHub -> aleiwi/qb-construction-management -> Settings -> Pages -> Build and deployment`

* **Source:** `Deploy from a branch` -> `gh-pages` -> `/(root)` -> **Save**
* **أو** `GitHub Actions` (يعمل مع `deploy.yml` تلقائيا)
* انتظر 30s-2د ثم افتح: `https://aleiwi.github.io/qb-construction-management/`

> الفرع `gh-pages` مرفوع مسبقا (`11912bb`) مع `404.html` + `.nojekyll` + `base: /qb-construction-management/`

### 2) أنشئ قاعدة بيانات Neon (60 ثانية)

1. ادخل `https://neon.tech` -> Sign in (GitHub/Google)
2. `Create Project` -> اسم `qb-db` -> Region أقرب لك
3. انسخ `Connection string`:
   ```
   postgresql://user:password@ep-xxx.neon.tech/qb_db?sslmode=require
   ```
4. حوّله لصيغة asyncpg للـ backend:
   ```
   postgresql+asyncpg://user:password@ep-xxx.neon.tech/qb_db?sslmode=require
   ```

### 3) انشر الـ Backend على Koyeb (90 ثانية)

1. ادخل `https://koyeb.com` -> Sign up (GitHub)
2. `Create Service` -> `Docker` -> image: `ghcr.io/aleiwi/qb-backend:latest`
   * اجعل الـ package Public أولا: `https://github.com/aleiwi?tab=packages` -> `qb-backend` -> `Package settings` -> `Change visibility -> Public`
   * البديل: `Create Service -> GitHub -> aleiwi/qb-construction-management -> branch master -> Dockerfile: backend/Dockerfile`
3. `Instance: Free (512MB)` -> `Add environment variables`:

   ```env
   ENVIRONMENT=production
   SECRET_KEY=<openssl rand -hex 48>
   DATABASE_URL=postgresql+asyncpg://...Neon...?sslmode=require
   ALLOWED_ORIGINS=https://aleiwi.github.io
   TRUSTED_HOSTS=*
   SEED_DEFAULT_USERS=false
   FIRST_ADMIN_EMAIL=admin@qb.com
   FIRST_ADMIN_FULL_NAME=مدير النظام
   FIRST_ADMIN_PASSWORD=<كلمة قوية>
   FRONTEND_URL=https://aleiwi.github.io/qb-construction-management
   PUBLIC_API_URL=https://YOUR-APP.koyeb.app
   FORCE_HTTPS=false
   ```

4. `Deploy` -> انتظر healthcheck `GET /api/v1/health` -> 200 OK
5. اختبر: `https://YOUR-APP.koyeb.app/api/v1/health` + `https://YOUR-APP.koyeb.app/docs`

### 4) اربط الواجهة بالخادم (30 ثانية)

1. `GitHub -> Settings -> Secrets and variables -> Actions -> Variables -> New variable`
   * Name: `VITE_API_URL`
   * Value: `https://YOUR-APP.koyeb.app/api/v1`
2. `Actions -> Deploy -> Re-run` أو `git commit --allow-empty -m "trigger deploy" && git push`
3. انتظر بناء Pages (1د) -> حدّث `https://aleiwi.github.io/qb-construction-management/` -> سجّل دخول `admin@qb.com / <FIRST_ADMIN_PASSWORD>`

> **تغيير الـ API بدون إعادة بناء:** افتح console في المتصفح:
> ```js
> localStorage.setItem('QB_API_URL','https://YOUR-APP.koyeb.app/api/v1'); location.reload()
> ```

---

## البدائل المجانية (إن لم يعجبك Koyeb)

### Render (أسهل - يقرأ `render.yaml` تلقائيا)

1. `https://render.com` -> New -> Blueprint -> اربط `aleiwi/qb-construction-management`
2. سيقرأ `render.yaml:1` تلقائيا -> اضبط `DATABASE_URL` فقط -> Deploy
3. مجاني: 512MB، ينام بعد 15د، 750h/شهر

### Netlify (للواجهة فقط)

1. `https://netlify.com` -> Add new site -> Import -> `aleiwi/qb-construction-management`
2. سيقرأ `netlify.toml:6` تلقائيا -> `VITE_API_URL` في Environment variables -> Deploy

### Oracle Cloud Always Free (VPS كامل مع HTTPS)

راجع `deploy/DEPLOYMENT.md:1` - خادم 4 OCPU + 24GB للأبد، مع `deploy/setup.sh` + `Caddyfile` + Let's Encrypt:
```bash
git clone https://github.com/aleiwi/qb-construction-management.git
cd qb-construction-management/deploy
DOMAIN=qb-app.duckdns.org ./setup.sh
```

---

## التحقق

```bash
# Frontend
curl https://aleiwi.github.io/qb-construction-management/   # 200 + HTML

# Backend
curl https://YOUR-APP.koyeb.app/api/v1/health
# {"success":true,"data":{"status":"ok","environment":"production","version":"1.0.0"}}

# Login
curl -X POST https://YOUR-APP.koyeb.app/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@qb.com","password":"<PASSWORD>"}'
```

---

## استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| Pages 404 | فعّل Pages كما في الخطوة 1، انتظر 2د، تأكد من `gh-pages` branch موجود |
| GHCR 404 / pull failed | اجعل package Public: `github.com/aleiwi?tab=packages` |
| Koyeb healthcheck fail | تحقق `DATABASE_URL` صحيح + `SECRET_KEY` طويل + سجلات `koyeb logs` |
| CORS error | `ALLOWED_ORIGINS=https://aleiwi.github.io` بدون مسافة |
| بطء أول PDF | طبيعي - Chromium يحمل أول مرة (300M) على Free 512M |
| Login يفشل على Pages | اضبط `VITE_API_URL` variable وأعد البناء، أو استخدم `localStorage QB_API_URL` |

---

## الملفات

| الملف | الغرض |
|---|---|
| `koyeb.yaml` | Koyeb Free (512M) |
| `render.yaml` | Render Free |
| `netlify.toml` | Netlify |
| `deploy/docker-compose.prod.yml` | Oracle/VPS مع Caddy HTTPS |
| `.github/workflows/deploy.yml` | GH Pages + GHCR تلقائيا |
| `frontend/vite.config.js` | `base: /qb-construction-management/` لـ Pages |
