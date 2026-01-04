import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  ImagePlus,
  X,
  ShoppingBag,
  Gift,
  FileDigit,
  Boxes,
  Star,
  ChevronLeft,
} from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useArtistProducts,
  useAddProduct,
  useUpdateProduct,
  useDeleteProduct,
  useUploadProductImage,
  Product,
  ProductInsert,
} from "@/hooks/useArtistProducts";

const productTypes = [
  { value: "physical", labelEn: "Physical Product", labelAr: "منتج فيزيائي", icon: Package },
  { value: "digital", labelEn: "Digital Product", labelAr: "منتج رقمي", icon: FileDigit },
  { value: "bundle", labelEn: "Bundle", labelAr: "باقة", icon: Boxes },
  { value: "gift_card", labelEn: "Gift Card", labelAr: "بطاقة هدية", icon: Gift },
];

const categories = [
  { value: "makeup_kit", labelEn: "Makeup Kit", labelAr: "طقم مكياج" },
  { value: "brushes", labelEn: "Brushes", labelAr: "فرش" },
  { value: "skincare", labelEn: "Skincare", labelAr: "العناية بالبشرة" },
  { value: "lashes", labelEn: "Lashes", labelAr: "رموش" },
  { value: "tutorial", labelEn: "Tutorial", labelAr: "دروس" },
  { value: "consultation", labelEn: "Consultation", labelAr: "استشارة" },
  { value: "other", labelEn: "Other", labelAr: "أخرى" },
];

const ArtistProducts = () => {
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const { data: products = [], isLoading } = useArtistProducts();
  const addProduct = useAddProduct();
  const updateProduct = useUpdateProduct();
  const deleteProduct = useDeleteProduct();
  const uploadImage = useUploadProductImage();

  const [sheetOpen, setSheetOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<ProductInsert>({
    title: "",
    description: "",
    product_type: "physical",
    category: "other",
    price_qar: 0,
    compare_at_price: undefined,
    images: [],
    inventory_count: 0,
    digital_content_url: "",
    is_active: true,
    is_featured: false,
  });

  const resetForm = () => {
    setForm({
      title: "",
      description: "",
      product_type: "physical",
      category: "other",
      price_qar: 0,
      compare_at_price: undefined,
      images: [],
      inventory_count: 0,
      digital_content_url: "",
      is_active: true,
      is_featured: false,
    });
    setEditingProduct(null);
  };

  const handleOpenSheet = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setForm({
        title: product.title,
        description: product.description || "",
        product_type: product.product_type,
        category: product.category,
        price_qar: product.price_qar,
        compare_at_price: product.compare_at_price || undefined,
        images: product.images || [],
        inventory_count: product.inventory_count,
        digital_content_url: product.digital_content_url || "",
        is_active: product.is_active,
        is_featured: product.is_featured,
      });
    } else {
      resetForm();
    }
    setSheetOpen(true);
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadImage.mutateAsync(file);
        urls.push(url);
      }
      setForm((prev) => ({
        ...prev,
        images: [...(prev.images || []), ...urls],
      }));
      toast.success(isRTL ? "تم رفع الصور بنجاح" : "Images uploaded successfully");
    } catch (error) {
      toast.error(isRTL ? "فشل في رفع الصور" : "Failed to upload images");
    }
  };

  const handleRemoveImage = (index: number) => {
    setForm((prev) => ({
      ...prev,
      images: prev.images?.filter((_, i) => i !== index) || [],
    }));
  };

  const handleSubmit = async () => {
    if (!form.title.trim()) {
      toast.error(isRTL ? "يرجى إدخال اسم المنتج" : "Please enter product title");
      return;
    }
    if (form.price_qar <= 0) {
      toast.error(isRTL ? "يرجى إدخال سعر صحيح" : "Please enter a valid price");
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingProduct) {
        await updateProduct.mutateAsync({
          id: editingProduct.id,
          ...form,
        });
        toast.success(isRTL ? "تم تحديث المنتج بنجاح" : "Product updated successfully");
      } else {
        await addProduct.mutateAsync(form);
        toast.success(isRTL ? "تم إضافة المنتج بنجاح" : "Product added successfully");
      }
      setSheetOpen(false);
      resetForm();
    } catch (error) {
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!productToDelete) return;
    try {
      await deleteProduct.mutateAsync(productToDelete);
      toast.success(isRTL ? "تم حذف المنتج" : "Product deleted");
      setDeleteDialogOpen(false);
      setProductToDelete(null);
    } catch (error) {
      toast.error(isRTL ? "فشل في حذف المنتج" : "Failed to delete product");
    }
  };

  const confirmDelete = (productId: string) => {
    setProductToDelete(productId);
    setDeleteDialogOpen(true);
  };

  const getProductTypeLabel = (type: string) => {
    const pt = productTypes.find((p) => p.value === type);
    return language === "ar" ? pt?.labelAr : pt?.labelEn;
  };

  const getCategoryLabel = (cat: string) => {
    const c = categories.find((c) => c.value === cat);
    return language === "ar" ? c?.labelAr : c?.labelEn;
  };

  const getProductTypeIcon = (type: string) => {
    const pt = productTypes.find((p) => p.value === type);
    return pt?.icon || Package;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="p-4 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate(-1)}
              className="shrink-0"
            >
              <ChevronLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
            </Button>
            <div>
              <h1 className="text-xl font-bold text-foreground">
                {isRTL ? "متجر المنتجات" : "Products Store"}
              </h1>
              <p className="text-sm text-muted-foreground">
                {products.length} {isRTL ? "منتج" : "products"}
              </p>
            </div>
          </div>
          <Button onClick={() => handleOpenSheet()} size="sm">
            <Plus className="w-4 h-4 me-1" />
            {isRTL ? "إضافة" : "Add"}
          </Button>
        </div>
      </header>

      {/* Products Grid */}
      <div className="p-4">
        {products.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              {isRTL ? "لا توجد منتجات" : "No Products Yet"}
            </h2>
            <p className="text-muted-foreground mb-6 max-w-xs mx-auto">
              {isRTL
                ? "أضيفي منتجاتك الرقمية والفيزيائية لبيعها لعملائك"
                : "Add your digital and physical products to sell to your clients"}
            </p>
            <Button onClick={() => handleOpenSheet()}>
              <Plus className="w-4 h-4 me-2" />
              {isRTL ? "إضافة منتج" : "Add Product"}
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {products.map((product) => {
              const TypeIcon = getProductTypeIcon(product.product_type);
              return (
                <Card
                  key={product.id}
                  className={`relative overflow-hidden ${
                    !product.is_active ? "opacity-60" : ""
                  }`}
                >
                  {product.is_featured && (
                    <div className="absolute top-2 end-2 z-10">
                      <Badge className="bg-primary/90 text-primary-foreground">
                        <Star className="w-3 h-3 me-1 fill-current" />
                        {isRTL ? "مميز" : "Featured"}
                      </Badge>
                    </div>
                  )}

                  {/* Product Image */}
                  <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <TypeIcon className="w-12 h-12 text-muted-foreground/50" />
                      </div>
                    )}
                    {!product.is_active && (
                      <div className="absolute inset-0 bg-background/50 flex items-center justify-center">
                        <Badge variant="secondary">
                          {isRTL ? "غير نشط" : "Inactive"}
                        </Badge>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0 flex-1">
                        <h3 className="font-semibold text-foreground truncate">
                          {product.title}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="outline" className="text-xs">
                            <TypeIcon className="w-3 h-3 me-1" />
                            {getProductTypeLabel(product.product_type)}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                      {product.description || (isRTL ? "لا يوجد وصف" : "No description")}
                    </p>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-primary">
                          {product.price_qar} QAR
                        </span>
                        {product.compare_at_price && (
                          <span className="text-sm text-muted-foreground line-through ms-2">
                            {product.compare_at_price} QAR
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenSheet(product)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => confirmDelete(product.id)}
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>

                    {product.product_type === "physical" && (
                      <p className="text-xs text-muted-foreground mt-2">
                        {isRTL ? "المخزون:" : "Stock:"} {product.inventory_count}
                      </p>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Add/Edit Sheet */}
      <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
        <SheetContent
          side="bottom"
          className="h-[90vh] rounded-t-3xl overflow-y-auto"
          dir={isRTL ? "rtl" : "ltr"}
        >
          <SheetHeader className="pb-4">
            <SheetTitle>
              {editingProduct
                ? isRTL
                  ? "تعديل المنتج"
                  : "Edit Product"
                : isRTL
                ? "إضافة منتج جديد"
                : "Add New Product"}
            </SheetTitle>
            <SheetDescription>
              {isRTL
                ? "أضف تفاصيل المنتج أدناه"
                : "Fill in the product details below"}
            </SheetDescription>
          </SheetHeader>

          <div className="space-y-5 pb-8">
            {/* Images */}
            <div>
              <Label className="mb-2 block">
                {isRTL ? "صور المنتج" : "Product Images"}
              </Label>
              <div className="flex flex-wrap gap-2">
                {form.images?.map((url, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-xl overflow-hidden">
                    <img src={url} alt="" className="w-full h-full object-cover" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="absolute top-1 end-1 p-1 bg-destructive text-destructive-foreground rounded-full"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
                <label className="w-20 h-20 rounded-xl border-2 border-dashed border-border flex items-center justify-center cursor-pointer hover:bg-muted transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={handleImageUpload}
                  />
                  <ImagePlus className="w-6 h-6 text-muted-foreground" />
                </label>
              </div>
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">{isRTL ? "اسم المنتج" : "Product Name"} *</Label>
              <Input
                id="title"
                value={form.title}
                onChange={(e) => setForm({ ...form, title: e.target.value })}
                placeholder={isRTL ? "مثال: طقم مكياج احترافي" : "e.g., Professional Makeup Kit"}
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">{isRTL ? "الوصف" : "Description"}</Label>
              <Textarea
                id="description"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder={isRTL ? "وصف تفصيلي للمنتج..." : "Detailed product description..."}
                rows={3}
                className="mt-1"
              />
            </div>

            {/* Type & Category */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{isRTL ? "نوع المنتج" : "Product Type"}</Label>
                <Select
                  value={form.product_type}
                  onValueChange={(value: ProductInsert["product_type"]) =>
                    setForm({ ...form, product_type: value })
                  }
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {productTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        <div className="flex items-center gap-2">
                          <type.icon className="w-4 h-4" />
                          {language === "ar" ? type.labelAr : type.labelEn}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>{isRTL ? "الفئة" : "Category"}</Label>
                <Select
                  value={form.category}
                  onValueChange={(value) => setForm({ ...form, category: value })}
                >
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {language === "ar" ? cat.labelAr : cat.labelEn}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Pricing */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">{isRTL ? "السعر (ر.ق)" : "Price (QAR)"} *</Label>
                <Input
                  id="price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price_qar}
                  onChange={(e) =>
                    setForm({ ...form, price_qar: parseFloat(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="compare_price">
                  {isRTL ? "السعر قبل الخصم" : "Compare at Price"}
                </Label>
                <Input
                  id="compare_price"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.compare_at_price || ""}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      compare_at_price: parseFloat(e.target.value) || undefined,
                    })
                  }
                  className="mt-1"
                  placeholder={isRTL ? "اختياري" : "Optional"}
                />
              </div>
            </div>

            {/* Inventory (for physical products) */}
            {form.product_type === "physical" && (
              <div>
                <Label htmlFor="inventory">{isRTL ? "كمية المخزون" : "Inventory Count"}</Label>
                <Input
                  id="inventory"
                  type="number"
                  min="0"
                  value={form.inventory_count}
                  onChange={(e) =>
                    setForm({ ...form, inventory_count: parseInt(e.target.value) || 0 })
                  }
                  className="mt-1"
                />
              </div>
            )}

            {/* Digital URL (for digital products) */}
            {form.product_type === "digital" && (
              <div>
                <Label htmlFor="digital_url">
                  {isRTL ? "رابط المحتوى الرقمي" : "Digital Content URL"}
                </Label>
                <Input
                  id="digital_url"
                  type="url"
                  value={form.digital_content_url}
                  onChange={(e) =>
                    setForm({ ...form, digital_content_url: e.target.value })
                  }
                  placeholder="https://..."
                  className="mt-1"
                />
              </div>
            )}

            {/* Toggles */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between">
                <div>
                  <Label>{isRTL ? "نشط" : "Active"}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "إظهار المنتج للعملاء" : "Show product to customers"}
                  </p>
                </div>
                <Switch
                  checked={form.is_active}
                  onCheckedChange={(checked) => setForm({ ...form, is_active: checked })}
                />
              </div>
              <div className="flex items-center justify-between">
                <div>
                  <Label>{isRTL ? "مميز" : "Featured"}</Label>
                  <p className="text-xs text-muted-foreground">
                    {isRTL ? "عرض في المنتجات المميزة" : "Display in featured products"}
                  </p>
                </div>
                <Switch
                  checked={form.is_featured}
                  onCheckedChange={(checked) => setForm({ ...form, is_featured: checked })}
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              className="w-full h-12"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? isRTL
                  ? "جاري الحفظ..."
                  : "Saving..."
                : editingProduct
                ? isRTL
                  ? "تحديث المنتج"
                  : "Update Product"
                : isRTL
                ? "إضافة المنتج"
                : "Add Product"}
            </Button>
          </div>
        </SheetContent>
      </Sheet>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {isRTL ? "حذف المنتج" : "Delete Product"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {isRTL
                ? "هل أنت متأكد من حذف هذا المنتج؟ لا يمكن التراجع عن هذا الإجراء."
                : "Are you sure you want to delete this product? This action cannot be undone."}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{isRTL ? "إلغاء" : "Cancel"}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isRTL ? "حذف" : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNavigation />
    </div>
  );
};

export default ArtistProducts;
