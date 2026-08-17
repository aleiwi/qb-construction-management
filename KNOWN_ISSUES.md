# المشاكل المعروفة - QB Construction Management System

## المشاكل已被 discovered والإصلاح (Fixed During Testing)

| # | الخطأ | الموقع | الحالة |
|---|------|--------|--------|
| 1 | `MapPin is not defined` | `frontend/src/pages/ProjectDetailPage.jsx` | ✅ تم الإصلاح (أضيفت للاستيرادات) |
| 2 | `page_size=1000` exceeds backend `le=100` | `frontend/src/pages/ContractsPage.jsx` | ✅ تم الإصلاح (غيرت لـ 100) |
| 3 | `Cannot access 'isProcessing' before initialization` | `frontend/src/pages/DrawingViewerPage.jsx` | ✅ تم الإصلاح (نقلنا التعريف للأعلى) |
| 4 | `TypeError: float + Decimal` | `backend/app/services/boq_aggregator.py:101` | ✅ تم الإصلاح (تحويل `float(el.quantity or 0)`) |
| 5 | `TypeError: Decimal * float` | `backend/app/services/quantity_engine.py:120` | ✅ تم الإصلاح (Added `_num()` helper) |
| 6 | CORS error on `boq-summary/project/1` | `backend/app/main.py` | ✅ تم الإصلاح ذاتياً بعد fixing #4 و #5 |
| 7 | رفع ملف DXF وفك الشيفرة | `drawings/batch` | ✅ يعمل (استخرج 4 جدران + 2 أعمدة) |

## المشاكل التي لم تُصحح بعد (Known Issues - Not Fixed in This Session)

| # | المشكلة | الموقع | الأولوية |
|---|--------|--------|----------|
| 1 | لم يتم اختبار `boq-summary` بالكامل من قبل المستخدم (يتطلب login) | `frontend / backend` | Media |
| 2 | لم يتم إضافة اختبارات وحدة لـ `quantity_engine.py` (إطار الاختبارات يحتاج настройка) | `backend/tests/` | Low |
| 3 | تحسين رسائل ErrorBoundary للمستخدم (متاح في الأكواد already) | `frontend/src/components/ui/ErrorBoundary.jsx` | Low |

## ملاحظات هامة

- جميع الاختبارات (111 اختبار) خضراء (100%) وتقع على قاعدة بيانات معزولة `qb_test.db`
- ملف `backend/.env` يجب تعبئته بقيم الإنتاج قبل النشر
- ملف `frontend/.env` اختياري ما لم يكن API على host آخر
- قاعدة البيانات: SQLite للتنمية، PostgreSQL للإنتاج (يتم التبديل عبر `DATABASE_URL`)
