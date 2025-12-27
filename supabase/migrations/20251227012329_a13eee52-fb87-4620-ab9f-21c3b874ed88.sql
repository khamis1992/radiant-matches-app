-- إضافة أعمدة اللغتين لجدول الخدمات
ALTER TABLE public.services
ADD COLUMN IF NOT EXISTS name_ar TEXT,
ADD COLUMN IF NOT EXISTS name_en TEXT,
ADD COLUMN IF NOT EXISTS description_ar TEXT,
ADD COLUMN IF NOT EXISTS description_en TEXT;

-- نقل البيانات الحالية (نفترض أن البيانات الحالية بالعربية كافتراضي)
UPDATE public.services
SET name_ar = name,
    description_ar = description
WHERE name_ar IS NULL;