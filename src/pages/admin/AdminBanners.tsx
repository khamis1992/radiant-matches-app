import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Pencil, Trash2, GripVertical, Image, ExternalLink } from "lucide-react";
import { useAdminBanners } from "@/hooks/useAdminBanners";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface BannerFormData {
  title: string;
  subtitle: string;
  button_text: string;
  link_url: string;
  image_url: string;
}

const initialFormData: BannerFormData = {
  title: "",
  subtitle: "",
  button_text: "",
  link_url: "",
  image_url: "",
};

interface BannerData {
  id: string;
  title: string;
  subtitle: string | null;
  button_text: string | null;
  image_url: string;
  link_url: string | null;
  is_active: boolean;
  display_order: number;
}

interface SortableRowProps {
  banner: BannerData;
  onEdit: (banner: BannerData) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
}

const SortableRow = ({ banner, onEdit, onDelete, onToggle }: SortableRowProps) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: banner.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button
          {...attributes}
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 hover:bg-muted rounded"
        >
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell>
        <div className="w-20 h-12 rounded-lg overflow-hidden bg-muted">
          <img
            src={banner.image_url}
            alt={banner.title}
            className="w-full h-full object-cover"
          />
        </div>
      </TableCell>
      <TableCell className="font-medium">{banner.title}</TableCell>
      <TableCell className="text-muted-foreground max-w-[200px] truncate">
        {banner.subtitle || "-"}
      </TableCell>
      <TableCell>{banner.button_text || "-"}</TableCell>
      <TableCell>
        {banner.link_url ? (
          <a
            href={banner.link_url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline flex items-center gap-1"
          >
            <ExternalLink className="h-3 w-3" />
            رابط
          </a>
        ) : (
          "-"
        )}
      </TableCell>
      <TableCell>
        <Switch
          checked={banner.is_active}
          onCheckedChange={(checked) => onToggle(banner.id, checked)}
        />
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onEdit(banner)}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="text-destructive hover:text-destructive"
            onClick={() => onDelete(banner.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
};

const AdminBanners = () => {
  const {
    banners,
    isLoading,
    createBanner,
    updateBanner,
    deleteBanner,
    toggleBannerStatus,
    reorderBanners,
    uploadBannerImage,
  } = useAdminBanners();

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [selectedBannerId, setSelectedBannerId] = useState<string | null>(null);
  const [editingBanner, setEditingBanner] = useState<{ id: string } | null>(null);
  const [formData, setFormData] = useState<BannerFormData>(initialFormData);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [isUploading, setIsUploading] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = banners.findIndex((b) => b.id === active.id);
      const newIndex = banners.findIndex((b) => b.id === over.id);
      const newOrder = arrayMove(banners, oldIndex, newIndex);
      reorderBanners.mutate(newOrder.map((b) => b.id));
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleOpenDialog = (banner?: typeof banners[0]) => {
    if (banner) {
      setEditingBanner({ id: banner.id });
      setFormData({
        title: banner.title,
        subtitle: banner.subtitle || "",
        button_text: banner.button_text || "",
        link_url: banner.link_url || "",
        image_url: banner.image_url,
      });
      setImagePreview(banner.image_url);
    } else {
      setEditingBanner(null);
      setFormData(initialFormData);
      setImagePreview("");
    }
    setImageFile(null);
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingBanner(null);
    setFormData(initialFormData);
    setImageFile(null);
    setImagePreview("");
  };

  const handleSubmit = async () => {
    if (!formData.title) return;

    setIsUploading(true);
    try {
      let imageUrl = formData.image_url;

      if (imageFile) {
        imageUrl = await uploadBannerImage(imageFile);
      }

      if (!imageUrl) {
        setIsUploading(false);
        return;
      }

      if (editingBanner) {
        await updateBanner.mutateAsync({
          id: editingBanner.id,
          title: formData.title,
          subtitle: formData.subtitle || undefined,
          button_text: formData.button_text || undefined,
          link_url: formData.link_url || undefined,
          image_url: imageUrl,
        });
      } else {
        await createBanner.mutateAsync({
          title: formData.title,
          subtitle: formData.subtitle || undefined,
          button_text: formData.button_text || undefined,
          link_url: formData.link_url || undefined,
          image_url: imageUrl,
          display_order: banners.length,
        });
      }

      handleCloseDialog();
    } finally {
      setIsUploading(false);
    }
  };

  const handleDelete = (id: string) => {
    setSelectedBannerId(id);
    setIsDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (selectedBannerId) {
      await deleteBanner.mutateAsync(selectedBannerId);
      setIsDeleteDialogOpen(false);
      setSelectedBannerId(null);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      <main className="mr-64 p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">إدارة البنرات الإعلانية</h1>
            <p className="text-muted-foreground">إضافة وتعديل وترتيب البنرات المعروضة في الصفحة الرئيسية</p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="h-4 w-4 ml-2" />
            إضافة بنر
          </Button>
        </div>

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-16 w-full" />
                ))}
              </div>
            ) : banners.length === 0 ? (
              <div className="p-12 text-center">
                <Image className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">لا توجد بنرات</h3>
                <p className="text-muted-foreground mb-4">أضف بنرات إعلانية لعرضها في الصفحة الرئيسية</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="h-4 w-4 ml-2" />
                  إضافة أول بنر
                </Button>
              </div>
            ) : (
              <DndContext
                sensors={sensors}
                collisionDetection={closestCenter}
                onDragEnd={handleDragEnd}
              >
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-12"></TableHead>
                      <TableHead className="w-24">الصورة</TableHead>
                      <TableHead>العنوان</TableHead>
                      <TableHead>النص الثانوي</TableHead>
                      <TableHead>نص الزر</TableHead>
                      <TableHead>الرابط</TableHead>
                      <TableHead className="w-20">الحالة</TableHead>
                      <TableHead className="w-24">الإجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <SortableContext
                      items={banners.map((b) => b.id)}
                      strategy={verticalListSortingStrategy}
                    >
                      {banners.map((banner) => (
                        <SortableRow
                          key={banner.id}
                          banner={banner}
                          onEdit={handleOpenDialog}
                          onDelete={handleDelete}
                          onToggle={(id, isActive) =>
                            toggleBannerStatus.mutate({ id, is_active: isActive })
                          }
                        />
                      ))}
                    </SortableContext>
                  </TableBody>
                </Table>
              </DndContext>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? "تعديل البنر" : "إضافة بنر جديد"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="title">العنوان *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, title: e.target.value }))
                }
                placeholder="أدخل عنوان البنر"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="subtitle">النص الثانوي</Label>
              <Input
                id="subtitle"
                value={formData.subtitle}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                }
                placeholder="أدخل النص الثانوي"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="button_text">نص الزر</Label>
              <Input
                id="button_text"
                value={formData.button_text}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, button_text: e.target.value }))
                }
                placeholder="مثال: احجز الآن"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="link_url">رابط الزر</Label>
              <Input
                id="link_url"
                value={formData.link_url}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                }
                placeholder="/makeup-artists"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="image">صورة البنر *</Label>
              <Input
                id="image"
                type="file"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div className="mt-2 rounded-lg overflow-hidden border">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="w-full h-32 object-cover"
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              إلغاء
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!formData.title || (!imagePreview && !imageFile) || isUploading}
            >
              {isUploading ? "جاري الحفظ..." : editingBanner ? "تحديث" : "إضافة"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir="rtl">
          <AlertDialogHeader>
            <AlertDialogTitle>هل أنت متأكد من الحذف؟</AlertDialogTitle>
            <AlertDialogDescription>
              سيتم حذف هذا البنر نهائياً ولن تتمكن من استعادته.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>إلغاء</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              حذف
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBanners;
