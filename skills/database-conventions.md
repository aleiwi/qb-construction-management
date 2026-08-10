# Database Conventions Skill

هذا الملف يحدد المعايير الموحّدة لأي جدول أو عمود يُنشأ في قاعدة بيانات نظام إدارة المقاولات. يجب على أي Agent (Backend/DB) الالتزام بهذه المعايير قبل كتابة أي migration أو schema.

## 1. تسمية الجداول (Tables)
- بصيغة الجمع، بالإنجليزية، snake_case: `projects`, `contractors`, `payments`, `employees`
- لا نستخدم بادئات مثل `tbl_` أو `t_`

## 2. تسمية الأعمدة (Columns)
- snake_case دائمًا: `created_at`, `contractor_id`, `project_status`
- المفتاح الأساسي دائمًا: `id` (UUID أو BIGINT auto-increment — يُحدَّد لاحقًا)
- المفاتيح الأجنبية: `<singular_table_name>_id` مثل `project_id`, `contractor_id`
- الحقول الزمنية: `created_at`, `updated_at` (مطلوبة بكل جدول)
- الحقول المنطقية (Boolean): تبدأ بـ `is_` أو `has_` مثل `is_active`, `has_completed`

## 3. العلاقات (Relationships)
- كل علاقة Many-to-Many تُنشأ عبر جدول وسيط صريح، مثل `project_contractors` وليس علاقة ضمنية
- Foreign keys دائمًا مع `ON DELETE` محدد بوضوح (RESTRICT أو CASCADE حسب الحالة، ويُذكر السبب في تعليق بالكود)

## 4. الحقول المالية (Financial Fields)
- المبالغ المالية تُخزَّن كـ `DECIMAL(15,2)` وليس `FLOAT` (لتجنب أخطاء التقريب)
- كل حقل مالي يُذكر بجانبه العملة إذا كان النظام يدعم أكثر من عملة (افتراضيًا SAR)

## 5. الحالات (Status Fields)
- تُستخدم قيم نصية محددة مسبقًا (Enum) وليس أرقام مجردة، مثل:
  `project_status`: `planning`, `in_progress`, `on_hold`, `completed`, `cancelled`

## 6. التعليقات والتوثيق
- كل جدول جديد يُرفق بتعليق سطر واحد يشرح الغرض منه في ملف الـ migration

## 7. الفهرسة (Indexing)
- كل foreign key يجب أن يكون مفهرسًا (indexed) تلقائيًا
- الحقول المستخدمة كثيرًا في البحث/الفلترة (مثل `project_status`, `contractor_id`) تُفهرس أيضًا
