# Backend Conventions Skill

هذا الملف يحدد المعايير التقنية الداخلية لبناء الـ Backend (FastAPI) في نظام إدارة المقاولات. يكمّل ملف `api-structure.md` (الذي يغطي شكل الـ API الخارجي) بتحديد كيف يُنظَّم الكود من الداخل.

## 1. هيكلة المجلدات (Project Structure)
```
backend/
├── app/
│   ├── main.py                 # نقطة الدخول الرئيسية
│   ├── core/                   # الإعدادات، الأمان، اتصال قاعدة البيانات
│   │   ├── config.py
│   │   ├── security.py
│   │   └── database.py
│   ├── models/                 # SQLAlchemy models (جدول واحد = ملف واحد)
│   │   ├── project.py
│   │   ├── contractor.py
│   │   └── payment.py
│   ├── schemas/                 # Pydantic schemas (Request/Response)
│   │   ├── project.py
│   │   └── contractor.py
│   ├── routers/                 # نقاط الـ API فقط (لا منطق عمل هنا)
│   │   ├── projects.py
│   │   └── contractors.py
│   ├── services/                # منطق العمل (Business Logic) — هنا فقط
│   │   ├── project_service.py
│   │   └── payment_calculation_service.py
│   └── dependencies/            # Dependency injection (auth, permissions)
│       └── auth.py
└── tests/
```

## 2. مبدأ الفصل الصارم بين الطبقات
- **Router**: يستقبل الطلب، يتحقق من الصلاحية عبر dependency، يستدعي الـ Service، يرجّع الاستجابة — **لا يحتوي منطق عمل أبدًا**
- **Service**: يحتوي كل منطق العمل الفعلي (مثل حساب المستحقات المرحلية) — قابل لإعادة الاستخدام ومستقل عن HTTP
- **Model**: تعريف الجدول فقط (بدون منطق عمل داخله)
- **Schema**: تعريف شكل البيانات الداخل والخارج (منفصل تمامًا عن الـ Model)

مثال قاعدة: أي دالة فيها `if/else` معقد لحساب شيء مالي → تروح بـ `services/`، مو داخل `routers/`.

## 3. معالجة الأخطاء (Error Handling)
- استخدام Custom Exceptions معرّفة مركزيًا (مثل `ProjectNotFoundException`, `InsufficientPermissionException`)
- معالج أخطاء عام (global exception handler) يحوّل كل استثناء لشكل الاستجابة الموحّد المعرّف في `api-structure.md`
- لا يُسمح بـ `try/except: pass` بأي مكان — كل استثناء يُسجَّل أو يُرفع بشكل صريح

## 4. إدارة الاتصال بقاعدة البيانات
- استخدام SQLAlchemy ORM مع async session
- كل عملية كتابة (write) تُغلَّف بـ transaction صريح، خصوصًا العمليات المالية (لضمان عدم حفظ جزء من العملية عند فشلها)

## 5. الإعدادات والأسرار (Configuration)
- كل الإعدادات (اتصال قاعدة البيانات، مفاتيح JWT) تُقرأ من environment variables عبر ملف `core/config.py` باستخدام Pydantic Settings
- ممنوع كتابة أي قيمة حساسة مباشرة بالكود

## 6. التسمية داخل الكود
- أسماء الدوال بالإنجليزي وواضحة الغرض: `calculate_stage_payment()` وليس `calc()` أو `do_payment()`
- كل service class تنتهي بـ `Service`: `PaymentCalculationService`

## 7. الاعتماديات الخارجية (Dependencies)
- أي مكتبة جديدة تُضاف لازم تُذكر بسبب واضح في PR — تجنب إضافة مكتبات لحل مشاكل بسيطة يمكن حلها بكود مباشر
