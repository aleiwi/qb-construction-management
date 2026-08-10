# API Structure Skill

هذا الملف يحدد الشكل الموحّد لأي API endpoint في نظام إدارة المقاولات (FastAPI). يجب على Agent الـ Backend الالتزام بهذا الهيكل لكل endpoint جديد.

## 1. تسمية المسارات (Routes)
- بصيغة الجمع، snake_case أو kebab-case: `/api/v1/projects`, `/api/v1/contractors`
- الموارد الفرعية: `/api/v1/projects/{project_id}/payments`
- لا نستخدم أفعال بالمسار (تجنب `/api/v1/getProjects`) — الفعل يُحدَّد عبر HTTP method (GET/POST/PUT/DELETE)

## 2. الإصدار (Versioning)
- كل الـ endpoints تحت `/api/v1/` من البداية، لتسهيل الترقية مستقبلًا دون كسر التوافق

## 3. شكل الاستجابة الموحّد (Response Shape)
كل استجابة ناجحة:
```json
{
  "success": true,
  "data": { ... },
  "message": "تم بنجاح"
}
```
كل استجابة خطأ:
```json
{
  "success": false,
  "error": {
    "code": "PROJECT_NOT_FOUND",
    "message": "المشروع غير موجود"
  }
}
```

## 4. الصلاحيات (Authorization)
- كل endpoint يجب أن يحدد صراحة الأدوار المسموح لها بالوصول عبر dependency injection في FastAPI
- الأدوار الأساسية: `admin`, `project_manager`, `engineer`, `accountant`, `contractor`
- المقاول (`contractor`) له وصول محدود فقط لبياناته الخاصة (مشاريعه، مستحقاته) — لا يرى بيانات مقاولين آخرين

## 5. الترقيم (Pagination)
- أي endpoint يرجع قائمة يدعم `?page=1&page_size=20` كمعيار افتراضي
- الاستجابة تتضمن `total_count`, `page`, `page_size`

## 6. التحقق من المدخلات (Validation)
- كل مدخل يُتحقق منه عبر Pydantic models قبل الوصول لمنطق العمل (business logic)
- رسائل الخطأ للمستخدم النهائي تكون بالعربي، ورسائل الـ logs الداخلية بالإنجليزي

## 7. التوثيق التلقائي
- كل endpoint يحتوي docstring واضح يظهر في Swagger (`/docs`) يشرح الغرض والمدخلات والمخرجات
