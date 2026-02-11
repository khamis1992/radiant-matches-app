

## خطة توسيع صفحة Add New Banner

### التغييرات المطلوبة

سأقوم بتوسيع حجم الـ Dialog ليصبح أكبر وأكثر راحة للاستخدام:

| الخاصية | القيمة الحالية | القيمة الجديدة |
|---------|---------------|----------------|
| العرض الأقصى | `sm:max-w-[1000px]` | `sm:max-w-[1200px]` |
| الارتفاع الأقصى | `max-h-[95vh]` | `max-h-[98vh]` |
| ارتفاع منطقة التمرير | `h-[calc(95vh-240px)]` | `h-[calc(98vh-200px)]` |

### الملف المتأثر

```
src/pages/admin/AdminBanners.tsx
```

### التفاصيل التقنية

**السطر 506** - تعديل DialogContent:
```tsx
// من
<DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-hidden p-0">

// إلى  
<DialogContent className="sm:max-w-[1200px] max-h-[98vh] overflow-hidden p-0">
```

**السطر 531** - تعديل ScrollArea:
```tsx
// من
<ScrollArea className="h-[calc(95vh-240px)] overflow-y-auto">

// إلى
<ScrollArea className="h-[calc(98vh-200px)] overflow-y-auto">
```

هذه التغييرات ستجعل الحوار أعرض بـ 200 بكسل وأطول بـ 3% من ارتفاع الشاشة، مع مساحة تمرير أكبر للمحتوى.

