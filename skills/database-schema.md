# Database Schema Skill

هذا الملف يوثّق مخطط قاعدة البيانات (ERD) الأساسي لنظام إدارة المقاولات. يجب أن يلتزم به Backend Agent عند إنشاء الـ migrations، بالتوافق الكامل مع `database-conventions.md`.

## الجداول الأساسية والعلاقات

### users
المستخدمون بكل الأدوار (admin, project_manager, engineer, accountant, contractor). حقل `role` يُستخدم مباشرة في RBAC.

### projects
المشروع الرئيسي (مثال: مسقا-32). له حالة (`planning`, `in_progress`, `on_hold`, `completed`, `cancelled`).

### buildings
مبنى واحد ضمن مشروع. **علاقة**: `project_id` → projects (One-to-Many).

### stages
مرحلة إنشائية ضمن مبنى (حفر، أساسات، هيكل...). تحمل:
- `weight_percent`: الوزن النسبي من قيمة العقد
- `progress_percent`: نسبة الإنجاز الفعلية (يرفعها المهندس)
**علاقة**: `building_id` → buildings.

### contractors
بيانات المقاول (شركة/فرد).

### contracts
عقد فرعي بين مقاول ومبنى محدد (وليس المشروع كامل — لأن نفس المقاول قد يكون له عقود منفصلة بمبانٍ مختلفة). يحمل `retention_percent` (نسبة الضمان المحتجزة).
**علاقات**: `contractor_id` → contractors، `building_id` → buildings.

### payments
دفعة مرتبطة بعقد ومرحلة محددة. لا تُصرف الدفعة إلا إذا `stages.progress_percent` للمرحلة المرتبطة وصل للنسبة المطلوبة (منطق يُطبَّق في `services/payment_calculation_service.py` حسب `backend-conventions.md`).
**علاقات**: `contract_id` → contracts، `stage_id` → stages.

### drawings
ملف مخطط CAD (DWG/DXF) مرفوع لمبنى محدد.
**علاقة**: `building_id` → buildings.

### boq_elements
عنصر هندسي مستخرج من مخطط (جدار، عمود، بلاطة...). يطبّق مباشرة استراتيجية `boq-engine-strategy.md`:
- `classification_status`: `auto_classified` | `manually_classified` | `unclassified`
- `source_layer_name`: اسم الطبقة الأصلي من ملف CAD (يُحفظ دائمًا)
- `quantity`: الكمية المحسوبة (مساحة/حجم/طول حسب نوع العنصر)
**علاقة**: `drawing_id` → drawings.

### price_library
مكتبة أسعار الوحدات، منفصلة ومستقلة — تُستخدم وتُحدَّث عبر مشاريع متعددة (وليست مربوطة بمشروع واحد).

### boq_items
ربط بين عنصر BOQ مستخرج وسعر من المكتبة، لحساب التكلفة الفعلية.
**علاقات**: `boq_element_id` → boq_elements، `price_ref_id` → price_library.

### employees / attendance
بيانات الموظفين وسجل الحضور اليومي.
- `employees.salary_type`: ثابت حاليًا على `fixed_monthly` (رواتب شهرية ثابتة للموظفين الدائمين)
- `employees.monthly_salary`: المبلغ الثابت الشهري (`DECIMAL(15,2)`)
- `attendance` يبقى لأغراض تتبع الحضور والانصراف (وليس أساس حساب الراتب، لأن الراتب ثابت لا يومي)

### retention_releases
تتبع تحرير الضمان المحتجز بعد فترة الصيانة.
- `contract_id` → contracts
- `retained_amount`: المبلغ المحتجز (`DECIMAL(15,2)`)
- `maintenance_period_end_date`: تاريخ نهاية فترة الصيانة
- `release_status`: `held` | `released`
- `released_at`: تاريخ التحرير الفعلي (nullable حتى يُحرر)

### quality_checks
فحص جودة إلزامي لكل مرحلة قبل اعتمادها ماليًا.
- `stage_id` → stages
- `inspected_by` → users (المهندس/المسؤول عن الفحص)
- `status`: `pending` | `passed` | `failed`
- `notes`: ملاحظات الفحص
- `checked_at`: تاريخ الفحص

## قواعد إلزامية عند التنفيذ
1. أي عملية تخصم من `boq_elements` بحالة `unclassified` **ممنوعة** ضمن حسابات `boq_items` النهائية (حسب مبدأ `boq-engine-strategy.md`)
2. أي تعديل على `payments` يجب أن يُسجَّل بـ audit trail منفصل (حسب `security-conventions.md`)
3. الحقول المالية جميعها `DECIMAL(15,2)` (حسب `database-conventions.md`)
4. **قاعدة جديدة**: لا يجوز اعتماد أي `payments` لمرحلة معينة إلا إذا كان `quality_checks.status = 'passed'` لتلك المرحلة أولاً — الفحص الهندسي شرط مسبق للصرف المالي
5. **قاعدة جديدة**: `retention_releases.release_status` لا يتحول لـ `released` إلا بعد تجاوز `maintenance_period_end_date` فعليًا (تحقق يدوي أو تلقائي بالتاريخ)

## نقص متعمد بهذه النسخة (يُضاف لاحقًا عند الحاجة)
- تفاصيل حساب البدلات أو الحوافز الإضافية فوق الراتب الثابت (لم تُذكر بعد)
- تفاصيل نوع فحص الجودة (معايير الفحص، قوائم تحقق/checklists مفصّلة لكل نوع مرحلة)
