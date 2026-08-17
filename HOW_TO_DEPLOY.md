# دليل النشر - QB Construction Management System

## النشر باستخدام Docker (الموصى به)

```bash
# من مجلد المشروع (QB/)
# التأكد من وجود ملف .env في backend/ بقيم الإنتاج

# بناء وجلب الخدمات
docker compose up -d --build

# التحقق من الخدمات
# - Frontend: http://localhost:8080
# - Backend API: http://localhost:8000/docs
# - Health check: http://localhost:8000/api/v1/health
```

### النشر اليدوي (بدون Docker)

#### Backend
```bash
cd backend
# التأكد من ملف .env موجود بقيم الإنتاج
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

#### Frontend
```bash
cd frontend
npm install
npm run build  # builds to dist/
# السيرفر静态 files إلى أي nginx أو مضيف ويب
```

### المتغيرات البيئية الإنتاجية (backend/.env)
```env
DATABASE_URL=postgresql+asyncpg://qb_user:qb_password@localhost:5432/qb_db
SECRET_KEY=مفتاح_طويل_وع_sha256_very_secure_must_change
ALLOWED_ORIGINS=http://yourdomain.com,http://www.yourdomain.com
ENVIRONMENT=production
```

### مجموعة الاختبارات النهائية
```bash
cd backend
pytest -v  # يجب أن تكون جميع الاختبارات 100% خضراء (111 test)
# التحقق الخاص:
python -m pytest tests/test_security_audit.py -v
```
