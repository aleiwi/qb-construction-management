# حالة النشر — QB (محدث تلقائيا)

> آخر تحديث: 2026-10-10 — كوميت `92a7cef` على master (CI ✅ + Deploy ✅)

## الملخص التنفيذي

| المرحلة | الحالة | التفاصيل |
|---|---|---|
| **الكود على GitHub** | ✅ محدث | 68 كوميت دُفعت (تحسينات المشاريع، estimator، BOQ keyset pagination، أمان) |
| **CI** | ✅ success | Backend tests + Frontend build + Docker smoke (بعد إصلاح peer-deps) |
| **Frontend (GH Pages)** | ✅ حي | `https://aleiwi.github.io/qb-construction-management/` — bundle `index-D0CMO5l9.js` |
| **Backend (localtunnel)** | 🟡 مؤقت | `https://moody-hoops-love.loca.lt` — يعمل من جهاز المستخدم، يتوقف عند إطفاء الجهاز |
| **Backend دائم (Koyeb+Neon)** | ⬜ ينتظر حسابات | الخطوة الوحيدة المتبقية — دليل `FREE_DEPLOYMENT.md` (~5 دقائق) |
| **Docker Prod** | ✅ جاهز | `deploy/docker-compose.prod.yml` |

## سجل إصلاحات اليوم (2026-10-10)

1. **إصلاح فشل CI**: حزم `@react-three/drei@10/fiber@9/rapier@2` تتطلب peer `react@^19` بينما المشروع React 18 → خفضت إلى `fiber 8.18.0 / drei 9.122.0 / rapier 1.5.0`
2. **دفع 68 كوميت** كانت متأخرة عن origin/master منذ 2026-09-22
3. **حماية `backend/token.txt`** (JWT سري) في `.gitignore`
4. **أداء BOQ**: keyset pagination بدل OFFSET (O(n²)→O(n)) لملايين العناصر + مهلة 300ث في العميل
5. **إحياء Backend للنسخة الحية**: tunnel جديد + إضافة `https://aleiwi.github.io` إلى `ALLOWED_ORIGINS` في `backend/.env` + تحديث متغير GitHub `VITE_API_URL` + إعادة نشر

## التحقق الفعلي (متصفح حي)

- ✅ صفحة الهبوط تعمل بلا أخطاء
- ✅ تسجيل الدخول `admin@qb.com` ناجح (JWT حقيقي)
- ✅ لوحة التحكم تعرض بيانات فعلية (1 مشروع، 1 عقد، 5 مستخدمين)
- ✅ CORS preflight من `aleiwi.github.io` → 200
- ✅ جميع الوحدات الـ 12 ظاهرة والصلاحيات تعمل

## ⚠️ تحذير مهم — الطبيعة المؤقتة للـ Backend الحالي

الـ backend الحي يعمل عبر **localtunnel من جهاز المستخدم**:
- يعمل فقط ما دام `uvicorn` + `npx localtunnel --port 8000` شغالين على الجهاز
- عنوان الـ tunnel يتغير عند إعادة تشغيله → يجب تحديث `VITE_API_URL` وإعادة النشر (Deploy workflow)
- الحل الدائم: Koyeb + Neon حسب `FREE_DEPLOYMENT.md` — لا يتغير عنوانه أبداً

## خطوات إعادة إحياء الـ tunnel (إن توقف)

```bash
# 1) من مجلد backend
"C:/Users/abood/Desktop/QB/.venv/Scripts/python.exe" -m uvicorn app.main:app --port 8000

# 2) من مجلد المشروع
npx localtunnel --port 8000   # انسخ الرابط الجديد

# 3) حدّث المتغير وأعد النشر
gh variable set VITE_API_URL --body "https://NEW-URL.loca.lt/api/v1"
gh workflow run Deploy --ref master
```

## الروابط الحية

* **Frontend:** `https://aleiwi.github.io/qb-construction-management/`
* **Backend (مؤقت):** `https://moody-hoops-love.loca.lt/api/v1/health`
* **API Docs:** `https://moody-hoops-love.loca.lt/docs`

## الخطوة التالية الوحيدة المتبقية (للمستخدم)

إنشاء حسابي **Neon** (قاعدة بيانات دائمة) و**Koyeb** (استضافة backend دائمة) — 5 دقائق حسب `FREE_DEPLOYMENT.md` — ثم يتصل frontend بـ backend دائم لا يتوقف أبداً.
