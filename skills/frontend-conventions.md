# Frontend Conventions Skill

هذا الملف يحدد المعايير التقنية الداخلية لبناء الـ Frontend (React + Tailwind) في نظام إدارة المقاولات. يكمّل ملف `ui-ux-guidelines.md` (الذي يغطي التصميم وتجربة المستخدم) بتحديد كيف يُنظَّم الكود من الداخل.

## 1. هيكلة المجلدات (Project Structure)
```
frontend/
├── src/
│   ├── components/         # مكونات قابلة لإعادة الاستخدام (Button, Card, Table)
│   │   ├── ui/              # مكونات عامة صغيرة
│   │   └── shared/           # مكونات مشتركة بين عدة صفحات
│   ├── pages/               # صفحة كاملة = ملف واحد (Dashboard, ProjectDetails)
│   ├── features/            # منطق مرتبط بميزة كاملة (projects/, contractors/, payments/)
│   │   └── projects/
│   │       ├── ProjectList.jsx
│   │       ├── useProjects.js      # custom hook لجلب/إدارة بيانات المشاريع
│   │       └── projectsApi.js       # استدعاءات API الخاصة بالمشاريع فقط
│   ├── hooks/                # hooks عامة مشتركة (useAuth, usePermissions)
│   ├── lib/                  # أدوات مساعدة (formatters, validators)
│   ├── api/                  # إعداد axios/fetch instance موحّد + interceptors
│   └── contexts/              # Context API (Auth, Theme)
└── tests/
```

## 2. إدارة الحالة (State Management)
- **حالة محلية بسيطة** (فتح/إغلاق modal، قيمة input): `useState` مباشرة
- **حالة مشتركة عبر الصفحة** (بيانات مستخدم، صلاحيات): Context API
- **حالة بيانات من السيرفر** (قوائم مشاريع، مقاولين): مكتبة جلب بيانات مخصصة (مثل React Query) بدل تخزينها يدويًا بـ useState — لتفادي مشاكل التزامن وإعادة الجلب

لا نستخدم مكتبة إدارة حالة ثقيلة (Redux) إلا إذا تعقّد المشروع فعليًا لاحقًا — نبدأ بسيط.

## 3. التعامل مع الـ API
- كل نداء API يمر عبر instance واحد موحّد في `api/` (يحمل الـ token تلقائيًا، يتعامل مع انتهاء الجلسة)
- كل feature له ملف `*Api.js` منفصل يحتوي دوال الاتصال الخاصة فيه فقط — لا نداءات API متفرقة داخل الـ components مباشرة
- الالتزام الكامل بشكل الاستجابة الموحّد المعرّف في `api-structure.md` (قراءة `data`/`error` بشكل موحّد)

## 4. معالجة الأخطاء والتحميل (Loading/Error States)
- كل شاشة تعرض بيانات من السيرفر تلتزم بثلاث حالات إلزامية: **تحميل (Loading)**، **خطأ (Error)**، **بيانات فارغة (Empty State)** — لا يُسمح بشاشة فاضية بدون رسالة عند عدم وجود بيانات
- رسائل الخطأ المعروضة للمستخدم بالعربي دائمًا (مطابقة لمبدأ `ui-ux-guidelines.md`)

## 5. الصلاحيات على مستوى الواجهة
- إخفاء عناصر الواجهة حسب الدور (مثال: زر "حذف مشروع" لا يظهر إلا للمدير) — لكن هذا **مكمّل فقط** وليس بديلاً عن التحقق الفعلي بالـ Backend
- استخدام hook موحّد `usePermissions()` بدل تكرار شروط `if (role === "admin")` بكل مكان

## 6. التسمية
- المكونات (Components): PascalCase — `ProjectCard.jsx`
- الـ Hooks: تبدأ بـ `use` دائمًا — `useProjects.js`
- الملفات المساعدة: camelCase — `formatCurrency.js`

## 7. التصميم (Tailwind)
- الالتزام بـ design tokens الموحّدة المعرّفة من UI/UX Agent (ألوان، مسافات) — لا قيم عشوائية مباشرة بالكلاسات (تجنب `bg-[#3a3a3a]` المتكرر، استخدم متغيرات موحّدة)
- دعم RTL كامل بكل مكون جديد (مطابقة لـ `ui-ux-guidelines.md`)

## 8. الاختبار
- كل مكون رئيسي جديد يُختبر أساسيًا (rendering + تفاعل بسيط) قبل الدمج، بالتنسيق مع `testing-conventions.md`
