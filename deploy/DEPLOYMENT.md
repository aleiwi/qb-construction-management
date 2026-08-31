# دليل النشر الاحترافي المجاني — QB Construction Management System

هذا الدليل يشرح نشر النظام كاملاً (PostgreSQL + FastAPI backend + React frontend + HTTPS)
على خادم مجاني للأبد بدون أي تكلفة، باستخدام **Docker Compose + Caddy**.

---

## 0. البنية المعتمدة للنشر

```
                        ┌─────────────────────────────┐
   المتصفح  ──HTTPS──▶  │  Caddy (reverse proxy + TLS) │
                        │   ports: 80 / 443           │
                        └──────┬──────────────┬───────┘
                     /api/*    │              │   (الباقي = SPA)
                        ┌──────▼──────┐   ┌───▼────────┐
                        │  backend    │   │  frontend  │
                        │  FastAPI    │   │  nginx/SPA │
                        └──────┬──────┘   └────────────┘
                        ┌──────▼──────┐
                        │  db         │
                        │  PostgreSQL │
                        └─────────────┘
```

- **مصلحة نفس النطاق (same-origin)**: الـ frontend يستدعي `/api/v1` على نفس الدومين،
  فيمرّ عبر Caddy إلى الـ backend — **بدون CORS** وبدون عنوان مضمن في الكود.
- لا توجد منافذ مكشوفة للمستخدم سوى `80` و `443` (الـ db والـ backend لا يُنشران خارجياً).
- **HTTPS تلقائي**: Caddy يُصدر شهادة Let's Encrypt مجانية ويجدّدها بنفسه.

---

## 1. اختيار بيئة الاستضافة (الخيار المجاني الموصى به)

**Oracle Cloud — Always Free Tier** (مجاني للأبد، بلا حد زمني):

- خادم **ARM Ampere A1**: حتى 4 أنوية OCPU + 24 GB RAM + 200 GB تخزين.
  (المشروع يحتاج RAM كافٍ لتوليد PDF عبر Chromium داخل الـ backend.)
- مطلوب بطاقة بنكية **للتحقق فقط** عند التسجيل — لا يُخصم أي مبلغ.
- بدائل مجانية: Google Cloud `e2-micro` (مجاني للأبد)، أو أي VPS لديك.

> ملاحظة أداء: على Oracle ARM قد يطول بناء صورة الـ backend أول مرة
> (تثبيت Playwright Chromium + التبعيات). البناء اللاحق يستخدم ذاكرة Docker المؤقتة.

---

## 2. إنشاء الخادم وفتح المنافذ

1. أنشئ VM بنظام **Ubuntu 22.04/24.04** (ARM أو x86).
2. في **Security List / Firewall** افتح المنافذ:
   - `22` (SSH) — احصره على IP الخاص بك إن أمكن.
   - `80` و `443` (HTTP/HTTPS).
3. (For Windows) اربط عبر `ssh ubuntu@<IP>`.

### تثبيت Docker (مرة واحدة)

```bash
curl -fsSL https://get.docker.com | sh
sudo usermod -aG docker $USER   # ثم أعد تسجيل الدخول (logout/login)
docker --version && docker compose version
```

---

## 3. ربط نطاق مجاني (اختياري لكن موصى به لـ HTTPS)

بدون دومين، سيعمل الموقع على `http://IP` **بدون HTTPS**. لأجل HTTPS مجاني:

1. أنشئ حساب على [DuckDNS](https://www.duckdns.org) (دخول عبر Google/GitHub).
2. أضف نطاقاً فرعياً مثل `qb-app.duckdns.org` ووجّهه إلى IP الخادم.
3. (بديل) لديك دومين مدفوع؟ وجّه سجل `A` إلى IP الخادم.

---

## 4. النشر بأمر واحد

```bash
# على الخادم
git clone https://github.com/aleiwi/qb-construction-management.git
cd qb-construction-management/deploy

# تفاعلي (سيسألك عن الدومين):
./setup.sh

# أو غير تفاعلي بدومين محدد:
DOMAIN=qb-app.duckdns.org ./setup.sh
```

`setup.sh` يقوم تلقائياً بـ:
- توليد `SECRET_KEY` و `POSTGRES_PASSWORD` و `FIRST_ADMIN_PASSWORD` قوية وعشوائية.
- كتابة `deploy/.env` (صلاحيات `600`).
- بناء ورفع الحاويات (`docker compose -f docker-compose.prod.yml up -d --build`).

بعد انتهاء التشغيل ستظهر رسالة فيها **رابط التطبيق + بيانات دخول المدير الأول**.

---

## 5. التحقق من التشغيل

```bash
# حالة الحاويات (يجب أن تكون جميعها healthy/running)
docker compose -f docker-compose.prod.yml ps

# السجلات
docker compose -f docker-compose.prod.yml logs -f

# فحص صحة الـ API مباشرة عبر Caddy
curl https://YOUR_DOMAIN/api/v1/health
# متوقع: {"success": true, "data": {"status": "ok", "environment": "production", ...}}
```

---

## 6. بيانات الدخول الأول والأمان

- عند أول تشغيل، يُنشأ **مدير أوّل** من متغيرات البيئة `FIRST_ADMIN_*`
  (بكلمة مرور عشوائية مطبوعة في نهاية `setup.sh` ومحفوظة في `deploy/.admin_password`).
- **مهم جداً بعد أول دخول:**
  1. سجّل الدخول بالمدير الأول.
  2. غيّر كلمة المرور (أو أنشئ حساب مدير شخصي من صفحة المستخدمين).
  3. احذف ملف `deploy/.admin_password` بعد حفظ كلمة المرور في مدير كلمات مرور.
- المستخدمون الإضافيون يُنشؤون من قبل **المدير** (صفحة Users) — لا يوجد تسجيل ذاتي عام.

---

## 7. البريد الإلكتروني (اختياري)

بدون إعداد SMTP، تُطبع رسائل التفعيل/إعادة التعيين في **سجلات الـ backend**
بدلاً من إرسالها. لتفعيل بريد حقيقي (مثل [Resend](https://resend.com) — يقدم طبقة مجانية):

```bash
# عدّل deploy/.env ثم أعد تشغيل backend
SMTP_HOST=smtp.resend.com
SMTP_PORT=587
SMTP_USER=resend
SMTP_PASSWORD=re_xxxxxxxx
SMTP_FROM=QB System <no-reply@your-domain.com>
```

```bash
docker compose -f docker-compose.prod.yml up -d backend
```

---

## 8. التحديثات والنسخ الاحتياطي

```bash
# تحديث الكود إلى آخر إصدار
git pull
docker compose -f docker-compose.prod.yml up -d --build

# نسخ احتياطي لقاعدة البيانات
docker compose -f docker-compose.prod.yml exec -T db \
  pg_dump -U qb_user qb_db > backup_$(date +%F).sql

# نسخ احتياطي للمرفوعات (المخططات/ملفات CAD)
docker run --rm -v qb-prod_uploads_data:/data -v "$PWD":/backup alpine \
  tar czf /backup/uploads_$(date +%F).tar.gz -C /data .
```

---

## 9. استكشاف الأخطاء

| المشكلة | الحل |
|---|---|
| `SECRET_KEY` or `FIRST_ADMIN_PASSWORD is required` | لا يوجد `deploy/.env` — شغّل `./setup.sh` أو انسخ `.env.prod.example` إلى `.env` واملأه. |
| الشهادة لا تصدر / `too many requests` | تأكد أن الدومين موجّه على IP الخادم، والمنفذان `80` و`443` مفتوحان. |
| `رفض بدء التشغيل: مستخدم admin@qb.com ... بكلمة المرور الافتراضية` | يوجد admin افتراضي من بيئة قديمة — غيّر كلمته أو احذف الحاوية وأعد إنشاء المجلد `pgdata`. |
| 502 عند فتح `/api` | الـ backend لم يبدأ بعد — شاهد `docker compose logs backend`. |
| بطء أول عملية PDF | Chromium يحمَّل عند أول استخدام — طبيعي. |

---

## 10. ملخص الملفات المضافة

| الملف | الغرض |
|---|---|
| `deploy/docker-compose.prod.yml` | حزمة الإنتاج (db + backend + frontend + caddy) |
| `deploy/Caddyfile` | الـ reverse proxy + HTTPS التلقائي |
| `deploy/setup.sh` | النشر بأمر واحد (توليد الأسرار + بناء + تشغيل) |
| `deploy/.env.prod.example` | قالب متغيرات الإنتاج |
| `deploy/DEPLOYMENT.md` | هذا الدليل |
| `backend/app/core/config.py` + `backend/app/main.py` | إضافة `FIRST_ADMIN_*` (bootstrap المدير الأول) |