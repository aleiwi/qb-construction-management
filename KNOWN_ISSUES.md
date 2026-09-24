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

## إصلاحات BOQ عميقة (P0/P1 — جلسة Sep 2026)

| # | المشكلة | الموقع | الحالة |
|---|--------|--------|--------|
| B1 | `estimated_auto_cost` ~0 دائمًا: مفاتيح `SEED_PRICES` (`concrete_wall`...) لا تطابق `ElementType` (`wall`...) | `backend/app/services/boq_aggregator.py` (`ELEMENT_TO_PRICE_KEYS`) | ✅ تم الإصلاح |
| B2 | الإجمالي المالي ناقص بصمت (عناصر غير مصنفة/بلا سعر/تخمينية) | `boq_aggregator.py` (`unpriced_count/estimated_count/is_partial`) + بانر `BOQSummaryPage.jsx` | ✅ تم الإصلاح |
| B3 | المحاسب يستطيع التصدير ولا يستطيع العرض (`403` على GET) | `backend/app/routers/boq_summary.py` + اختبار `test_boq_summary_accountant_can_view` | ✅ تم الإصلاح |
| B4 | `DrawingViewerPage` يستخدم `footing/staircase` بدل `foundation/stairs` → سقوط على `أخرى` | `elementTypes.js` (مصدر موحد) + `elementTypeStyles.js` | ✅ تم الإصلاح |
| B5 | قيم افتراضية مخترعة (طول 5م/مساحة 10م²) بلا وسم | `quantity_engine.py` (`params["is_estimated"]`) | ✅ تم الإصلاح |
| B6 | `Semaphore(1)` يجمد طابور المعالجة + معاينة SVG بلا cache | `routers/drawings.py` (3 + `.preview.svg`) + مسح الجانبيات عند الحذف | ✅ تم الإصلاح |
| B7 | `pool_size/max_overflow` بلا شرط تكسر SQLite + استعلام ميت + تحميل كل العناصر دفعة واحدة | `core/database.py` (بوابة dialect) + تجميع بدفعات 2000/IN-500 | ✅ تم الإصلاح |
| B8 | منطق رفع مكرر بلا حد حجم + `uploadBatch` يبلغ نجاحًا كاذبًا | `boqApi.js` (`validateCadFile` + حد 50MB + توازي 3) + الصفحتان | ✅ تم الإصلاح |
| B9 | `DrawingViewerPage.jsx` ملف 1196 سطرًا | استخراج `DrawingViewerWidgets.jsx` + `elementTypeStyles.js` (خطوة 1) | 🟡 جزئي |
| B10 | `docker-compose.yml` يحمل `version` مهملًا | حذف السطر | ✅ تم الإصلاح |

## تحقق UX حي ببيانات حقيقية (مخطط 118k عنصر — Sep 2026)

فتح فعلي بالكونسول: الدخول، `/drawings`، `/drawings/1`، `/boq-review`، `/boq-summary/1`، `/drawings/batch`، `/price-library` — صفر أخطاء بعد الإصلاحات:

| # | الملاحظة الحية | الإصلاح |
|---|---|---|
| U1 | العارض يعرض `222.9 ث` والقائمة `3.7 د` لنفس الزمن | `formatDuration` مشترك في `DrawingViewerWidgets.jsx` |
| U2 | أعداد بلا فواصل (`117964`, `96391`) غير مقروءة | `formatCount` في القائمة والعارض |
| U3 | المراجعة تعرض `200` كأنه كل الطابور (الحقيقي 96,391) بلا ترقيم | `GET /unclassified/count` + `unclassifiedCount()` + زر `عرض المزيد` + عدّاد `عرض X من Y` |
| U4 | عدّادات المخطط المخزنة تنحرف عن التجميع الحي بعد أي تصنيف يدوي | مزامنة تزايدية في `classify/bulk_classify/reclassify_unclassified` + اختبار `test_manual_classify_syncs_drawing_counters` |
| U5 | البحث العربي `أساس/درج` يطابق `footing/staircase` (لا نتائج) | aliases قانونية `foundation/stairs` |
| U6 | فتح الواجهة عبر `127.0.0.1` مع `.env.example` يعطي فشل CORS مبهم | إضافة نظيري `127.0.0.1` في `.env.example` |
| U7 | `boq-summary` لمشروع ضخم كان يعلق (كود قديم بلا دفعات) | الكود الجديد جمع 118k عنصر بنجاح + بانر `الإجمالي جزئي` يعرض `96,391 غير مصنف · 21,573 بلا سعر · 98,248 تقديرية` والتكلفة `0 ر.س` بصدق |
| U8 | أعداد خام بلا فواصل في الملخص/التحليلات/المراجعة + زر `تحديد الكل` يوهم بشمول الطابور كله | `formatCount` في `BOQSummary/ClassificationDashboard/Review/Viewer` + زر `تحديد المعروض (200)` — متحقق حيًا (`117,964`، `96,391`) بصفر أخطاء |
| U9 | طبقات الشرح (`S-DIMENSION`...) وكيانات `DIMENSION` تُغرق المراجعة بخردة (6,746 عنصر خردة مؤكدة على نسخة بيانات حقيقية) | الاستخراج يستبعدها مع بقاء ربط القياسات (`all_dims`) + اختبارا `test_annotation_*` + سكربت `backend/tools/cleanup_annotation_elements.py` (يجبر `--db-url`، تجفيف افتراضي، لا يمس المصنف/المسعر) |
| T1 | نتيجة `pytest` تعتمد على مجلد التشغيل: من `backend/` تُقرأ `backend/.env` (`ENVIRONMENT=production`) فتتعطل البذور ويفشل كل دخول | `conftest.py` يثبت `ENVIRONMENT=development` — متحقق بالتشغيل من المجلدين |

> ملاحظة تحليلية (بيانات حقيقية): ~90k من الطابور طبقات أثاث/تجهيزات (`a-fixtures`، `A-FIXTURE`، `G-IMPT`) — ليست خردة بل أصناف بلا نوع. المسار الحالي: تحديد مجمع كـ`أخرى` لكل مجموعة طبقة. الخيار المقترح (يتطلب قرارًا منك): نوع `furniture` يُعدّ بالقطعة.

## دمج المشروع القديم QuantumBuild (Supabase) — Sep 2026

المصدر: `Downloads/QB-main.zip` (واجهة React + دوال Supabase، بلا باكند Python). ما نُقل فعلًا بعد الفحص — الأفكار القابلة للتنفيذ فقط، Supabase/RLS والمزايا الغامضة (مساعد ذكي) رُفضت:

| # | الفكرة من القديم | الدمج في مشروعنا | الحالة |
|---|---|---|---|
| M1 | `arabic-reshaper` + خط Amiri للعربية في PDF | كشف أن تصدير BOQ PDF كان **مكسورًا أصلًا**: `reportlab` غير مثبت وغير مذكور في `requirements` (زر التصدير = 500) + لا تشكيل عربي + لا خط عربي مضمن. الإصلاح: تثبيت `reportlab + arabic-reshaper + python-bidi`، وحدة `arabic_pdf.py` مشتركة، خط Amiri (OFL) مستخرج من `AmiriFont.js` القديم إلى `app/assets/` | ✅ + اختبار `test_arabic_pdf.py` |
| M2 | جدول `price_history` (المكتبة كانت تُكتب فوق الأسعار بصمت) | موديل `PriceHistory` بلا FK (يبقى بعد الحذف) + تسجيل تلقائي create/update/delete + `GET /price-library/{id}/history` + timeline في صفحة المكتبة | ✅ + اختبار `test_price_history.py` |
| M3 | ثوابت `engineeringStandards` (معدلات الحديد) | `estimate_rebar` كانت ميتة (لا منادٍ لها) — أُحييت داخل ملخص BOQ: `rebar_kg` لكل نوع + `total_rebar_tons` + بطاقة وعمود `حديد تقديري` موسوم **تقدير تخطيطي، ليس تصميمًا**. المعدلات نفسها لم تتغير (توثيق SBC فقط) | ✅ موسع في `test_boq_summary_accountant_can_view` |
| M4 | نوع `furniture` (طابور الـ90k أثاث/تجهيزات) | `ElementType.FURNITURE` عدّي (`قطعة`) + قواعد استخراج + `classifier_rules` قبل البادئات الفضفاضة + عربي/ألوان/مكتبة + `rebar=0` + استثناء صريح من خصم الفتحات | ✅ 3 اختبارات جديدة |
| M5 | حاسبة التكاليف (QuantumBuildCalculator + `calculatorLogic` + `calculationConstants`) — لا مقابل لها في مشروعنا | حاسبة تقديرية أصلية على معماريتنا (`/estimate/catalog` + `/estimate/calculate` بلا تخزين + صفحة `/quick-estimator` في مجموعة المالية) بنفس معادلات القديم حرفيًا (خرسانة/حديد بالنسب/بلوك/مصنعية/ربح/م² + معامل التحويل القابل للتحرير وقفله `0 (ثابت)` + مسطح المصاعد اليدوي) وتعبئة أسعار من بنك الأسعار | ✅ 7 اختبارات + تحقق حي (القواعد 25م³/3.75طن = 21,250 ← 23,375 بربح 10%) |

### التحقق (جلسة الدمج)
- Backend كامل: **232 passed, exit 0** · بناء الواجهة: ناجح · ملفات M1–M3 الجديدة كلها مختبرة

### التحقق (UX session)
- Backend كامل: **218+ passed** · `vite build`: ناجح · متصفح حي: **0 أخطاء كونسول** على كل صفحات BOQ السبع
- تنبيه بيئي: `backend/.env` يحمل بيانات Neon إنتاجية حية — لا تشغّل كود تجريبي ضدها (التحقق تم على SQLite محلي). يُوصى بنقل الأسرار لمدير أسرار.

### التحقق (Sep 2026)
- Backend كامل: **219 passed** · Frontend vitest: **49 passed** · `vite build`: ناجح
- `docker compose config`: صالح (فشل `SECRET_KEY` بدونه مقصود fail-closed)
- `docker compose up --build`: متعذر في هذه البيئة — الحاويات بلا إنترنت (`pip` يفشل بـ Network unreachable). البناء نفسه سليم ويحتاج بيئة فيها registry/PyPI.

## ملاحظات هامة

- جميع الاختبارات (111 اختبار) خضراء (100%) وتقع على قاعدة بيانات معزولة `qb_test.db`
- ملف `backend/.env` يجب تعبئته بقيم الإنتاج قبل النشر
- ملف `frontend/.env` اختياري ما لم يكن API على host آخر
- قاعدة البيانات: SQLite للتنمية، PostgreSQL للإنتاج (يتم التبديل عبر `DATABASE_URL`)
