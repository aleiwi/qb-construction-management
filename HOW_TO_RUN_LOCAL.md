# دليل التشغيل المحلي - QB Construction Management System

## المتطلبات الأساسية
- Docker (مع PostgreSQL)
- Python 3.11+
- Node.js 18+ + npm

## الخطوات:

### 1. تشغيل backend
```bash
cd backend
# إنشاء وتنشيط البيئة (اختياري - المشروع لديه .venv pré-installé)
cp .env.example .env  # أو تأكد من وجود .env بقيم الإنتاج
# أو استخدم القيم الافتراضية من fichier .env الموجود

# تركيبDependencies (إن لم تكن في .venv)
pip install -r requirements.txt

# تشغيل السيرفر
uvicorn app.main:app --reload --port 8000
# API will be available at: http://localhost:8000/docs
# صحة الدخول: admin@qb.com / admin123
```

### 2. تشغيل frontend
```bash
cd frontend
npm install
npm run dev
# UI will be available at: http://localhost:5173 (أو http://localhost:3001)
```

### 3. التشغيل الكامل بـ Docker
```bash
# من مجلد المشروع (QB/)
docker compose up -d --build
# ستظهر الخدمات:
# - Frontend: http://localhost:8080
# - Backend:  http://localhost:8000/docs
# - PostgreSQL: محلي على port 5432
```

### 4. تشغيل الاختبارات
```bash
# من مجلد backend
pytest -v  # 111 test Should be 100% green
# أو اختبارات محددة:
pytest tests/test_auth.py -v
```

### 5. متغيرات البيئة الهامة
- `SECRET_KEY`: يجب تغييرها لقيمة طويلة وآمنة في الإنتاج (نستبدل CHANGE_THIS_TO_A_LONG...)
- `DATABASE_URL`: التبديل بين SQLite (dev) و PostgreSQL (prod) عبر هذه المتغير
- `ALLOWED_ORIGINS`:Origins مفصولة بفواصل بدون spacese.g: http://localhost:5173,http://localhost:3000
