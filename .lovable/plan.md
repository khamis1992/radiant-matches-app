
# خطة حل مشكلة عدم ظهور بيانات في صفحة Finance

## تشخيص المشكلة

بعد التحقيق، وجدت أن:
1. جدول `transactions` فارغ تماماً
2. يوجد 5 حجوزات مكتملة (`completed`) في جدول `bookings` بقيمة إجمالية 1,950 ر.ق
3. الـ Trigger الحالي (`create_booking_transaction_trigger`) يعمل فقط عند **تحديث** حالة الحجز من أي حالة أخرى إلى `completed`
4. الحجوزات الحالية تم إدخالها مباشرة بحالة `completed` (بيانات تجريبية)، لذا لم يُفعَّل الـ trigger

## الحل المقترح

### الخطوة 1: إدراج المعاملات المفقودة للحجوزات المكتملة الحالية

سأقوم بإنشاء migration لإدراج سجلات المعاملات للحجوزات المكتملة الموجودة حالياً:

```sql
-- إدراج المعاملات للحجوزات المكتملة التي لا توجد لها معاملات
INSERT INTO public.transactions (booking_id, artist_id, type, amount, platform_fee, net_amount, status, description)
SELECT 
  b.id,
  b.artist_id,
  'booking_payment',
  b.total_price,
  b.platform_fee,
  b.artist_earnings,
  'completed',
  'Payment for booking #' || LEFT(b.id::TEXT, 8)
FROM public.bookings b
WHERE b.status = 'completed'
  AND NOT EXISTS (
    SELECT 1 FROM public.transactions t WHERE t.booking_id = b.id
  );
```

### الخطوة 2: (اختياري) تحسين الـ Trigger للتعامل مع الإدخال المباشر

لمنع هذه المشكلة مستقبلاً، يمكن تعديل الـ trigger ليعمل أيضاً عند INSERT بحالة `completed`:

```sql
-- إضافة trigger للـ INSERT
CREATE OR REPLACE FUNCTION public.create_booking_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- للتحديثات: فقط عند التغيير إلى completed
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.transactions (...)
    VALUES (...);
  -- للإدخال المباشر بحالة completed
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    INSERT INTO public.transactions (...)
    VALUES (...);
  END IF;
  RETURN NEW;
END;
$$;
```

## النتيجة المتوقعة

بعد تنفيذ الحل:
- ستظهر 5 معاملات في جدول `transactions`
- ستعرض صفحة Finance:
  - إجمالي الإيرادات: 1,950 ر.ق
  - رسوم المنصة: 195 ر.ق
  - أرباح الفنانين: 1,755 ر.ق
  - الرسم البياني الشهري سيعرض البيانات

---

## التفاصيل التقنية

### الملفات المتأثرة:
- ملف migration جديد في `supabase/migrations/`

### الجداول المتأثرة:
- `transactions` (إضافة سجلات)

### الـ Triggers المتأثرة:
- `create_booking_transaction()` (تحديث اختياري)
