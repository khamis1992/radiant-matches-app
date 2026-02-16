

# خطة تنفيذ حظر IP للعملاء

## الهدف
تمكين الأدمن من حظر عناوين IP محددة لمنع المستخدمين المحظورين من التسجيل أو تسجيل الدخول مستقبلاً.

## الخطوات

### 1. إنشاء جدول `blocked_ips` في قاعدة البيانات
- **الأعمدة**: `id`, `ip_address`, `reason`, `blocked_by`, `blocked_user_id` (اختياري - لربط الحظر بمستخدم معين), `created_at`, `is_active`
- سياسات RLS: الأدمن فقط يستطيع القراءة والكتابة والحذف

### 2. إنشاء Edge Function: `check-blocked-ip`
- تستقبل الطلب وتستخرج عنوان IP من headers (مثل `x-forwarded-for`)
- تتحقق من وجود الـ IP في جدول `blocked_ips`
- ترجع حالة الحظر (محظور أو غير محظور)
- لا تحتاج JWT (يتم استدعاؤها قبل تسجيل الدخول)

### 3. تعديل صفحة تسجيل الدخول والتسجيل (`Auth.tsx`)
- قبل تنفيذ `signInWithPassword` أو `signUp`، يتم استدعاء `check-blocked-ip`
- إذا كان IP محظوراً، تظهر رسالة خطأ ويتم منع العملية

### 4. تعديل صفحة تسجيل الخبيرات (`ArtistSignup.tsx`)
- نفس المنطق: فحص IP قبل السماح بالتسجيل

### 5. إضافة واجهة إدارة الحظر في لوحة الأدمن
- إضافة زر "حظر IP" في قائمة إجراءات كل مستخدم في صفحة `AdminUsers`
- عند الضغط، يتم استدعاء edge function تسجل IP المستخدم الحالي (أو يُطلب من الأدمن إدخال IP يدوياً)
- إضافة صفحة أو قسم لعرض قائمة الـ IPs المحظورة مع إمكانية إلغاء الحظر

### 6. إنشاء Edge Function: `manage-blocked-ip`
- إضافة / حذف IP من القائمة
- تتطلب صلاحية أدمن

---

## التفاصيل التقنية

### جدول `blocked_ips`
```text
id            UUID (PK, default gen_random_uuid())
ip_address    TEXT NOT NULL
reason        TEXT
blocked_by    UUID (FK -> auth.users)
blocked_user_id UUID (nullable)
is_active     BOOLEAN DEFAULT true
created_at    TIMESTAMPTZ DEFAULT now()
```

### Edge Function `check-blocked-ip`
- تستخرج IP من: `req.headers.get("x-forwarded-for")` أو `req.headers.get("x-real-ip")`
- تبحث في `blocked_ips` عن تطابق مع `is_active = true`
- ترجع `{ blocked: true/false }`

### Edge Function `manage-blocked-ip`
- تتحقق من صلاحية الأدمن عبر JWT
- تدعم عمليتين: `block` (إضافة IP) و `unblock` (تعطيل IP)

### تعديلات الواجهة
- في `AdminUsers.tsx`: إضافة خيار "حظر IP" في DropdownMenu لكل مستخدم مع dialog لإدخال IP والسبب
- إضافة صفحة جديدة `AdminBlockedIPs.tsx` لعرض وإدارة جميع الـ IPs المحظورة
- إضافة رابط في القائمة الجانبية للأدمن

### ملاحظة مهمة
حظر IP ليس حلاً مثالياً بنسبة 100% لأن المستخدم يمكنه تغيير IP باستخدام VPN، لكنه يوفر طبقة حماية جيدة كخطوة أولى.

