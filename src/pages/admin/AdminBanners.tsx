import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Calendar } from "@/components/ui/calendar";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
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
import { Plus, Pencil, Trash2, GripVertical, Image, ExternalLink, Eye, CalendarIcon, Clock } from "lucide-react";
import { useAdminBanners } from "@/hooks/useAdminBanners";
import { format, isAfter, isBefore } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
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
  valid_from: Date | undefined;
  valid_until: Date | undefined;
  show_title: boolean;
  show_subtitle: boolean;
  show_button: boolean;
  text_position: string;
  text_alignment: string;
  overlay_opacity: number;
  image_scale: number;
  image_fit: string;
}

const initialFormData: BannerFormData = {
  title: "",
  subtitle: "",
  button_text: "",
  link_url: "",
  image_url: "",
  valid_from: undefined,
  valid_until: undefined,
  show_title: true,
  show_subtitle: true,
  show_button: true,
  text_position: "start",
  text_alignment: "start",
  overlay_opacity: 50,
  image_scale: 100,
  image_fit: "cover",
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
  valid_from: string | null;
  valid_until: string | null;
  created_at: string;
  updated_at: string;
  show_title: boolean;
  show_subtitle: boolean;
  show_button: boolean;
  text_position: string;
  text_alignment: string;
  overlay_opacity: number;
  image_scale: number;
  image_fit: string;
}

interface SortableRowProps {
  banner: BannerData;
  onEdit: (banner: BannerData) => void;
  onDelete: (id: string) => void;
  onToggle: (id: string, isActive: boolean) => void;
  getScheduleStatus: (banner: BannerData) => { label: string; variant: "default" | "secondary" | "destructive" | "outline" };
  t: any;
  dateLocale: typeof ar | typeof enUS;
}

const SortableRow = ({ banner, onEdit, onDelete, onToggle, getScheduleStatus, t, dateLocale }: SortableRowProps) => {
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

  const status = getScheduleStatus(banner);
  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return "-";
    return format(new Date(dateStr), "d MMM yyyy", { locale: dateLocale });
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
      <TableCell className="text-muted-foreground">
        <div className="flex flex-col text-xs">
          <span>{t.adminBanners.from}: {formatDate(banner.valid_from)}</span>
          <span>{t.adminBanners.to}: {formatDate(banner.valid_until)}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant={status.variant}>{status.label}</Badge>
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

  const { t, isRTL, language } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

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
        valid_from: banner.valid_from ? new Date(banner.valid_from) : undefined,
        valid_until: banner.valid_until ? new Date(banner.valid_until) : undefined,
        show_title: banner.show_title ?? true,
        show_subtitle: banner.show_subtitle ?? true,
        show_button: banner.show_button ?? true,
        text_position: banner.text_position || "start",
        text_alignment: banner.text_alignment || "start",
        overlay_opacity: banner.overlay_opacity ?? 50,
        image_scale: banner.image_scale ?? 100,
        image_fit: banner.image_fit || "cover",
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
    // Title is now optional, only image is required

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

      const bannerPayload = {
        title: formData.title,
        subtitle: formData.subtitle || undefined,
        button_text: formData.button_text || undefined,
        link_url: formData.link_url || undefined,
        image_url: imageUrl,
        valid_from: formData.valid_from?.toISOString(),
        valid_until: formData.valid_until?.toISOString() || null,
        show_title: formData.show_title,
        show_subtitle: formData.show_subtitle,
        show_button: formData.show_button,
        text_position: formData.text_position,
        text_alignment: formData.text_alignment,
        overlay_opacity: formData.overlay_opacity,
        image_scale: formData.image_scale,
        image_fit: formData.image_fit,
      };

      if (editingBanner) {
        await updateBanner.mutateAsync({
          id: editingBanner.id,
          ...bannerPayload,
        });
      } else {
        await createBanner.mutateAsync({
          ...bannerPayload,
          display_order: banners.length,
        });
      }

      handleCloseDialog();
    } finally {
      setIsUploading(false);
    }
  };

  const getScheduleStatus = (banner: typeof banners[0]) => {
    const now = new Date();
    const validFrom = banner.valid_from ? new Date(banner.valid_from) : null;
    const validUntil = banner.valid_until ? new Date(banner.valid_until) : null;

    if (validUntil && isBefore(validUntil, now)) {
      return { label: t.adminBanners.expired, variant: "destructive" as const };
    }
    if (validFrom && isAfter(validFrom, now)) {
      return { label: t.adminBanners.scheduled, variant: "secondary" as const };
    }
    if (banner.is_active) {
      return { label: t.adminBanners.activeStatus, variant: "default" as const };
    }
    return { label: t.adminBanners.stoppedStatus, variant: "outline" as const };
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
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      <main className={cn("p-6", isRTL ? "mr-64" : "ml-64")}>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">{t.adminBanners.title}</h1>
            <p className="text-muted-foreground">{t.adminBanners.subtitle}</p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => window.open("/", "_blank")}
            >
              <ExternalLink className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t.adminBanners.previewOnHomepage || "معاينة في الصفحة الرئيسية"}
            </Button>
            <Button onClick={() => handleOpenDialog()}>
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t.adminBanners.addBanner}
            </Button>
          </div>
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
                <h3 className="text-lg font-medium mb-2">{t.adminBanners.noBanners}</h3>
                <p className="text-muted-foreground mb-4">{t.adminBanners.noBannersDesc}</p>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t.adminBanners.addFirstBanner}
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
                      <TableHead className="w-24">{t.adminBanners.image}</TableHead>
                      <TableHead>{t.adminBanners.bannerTitle}</TableHead>
                      <TableHead>{t.adminBanners.schedule}</TableHead>
                      <TableHead>{t.adminBanners.scheduleStatus}</TableHead>
                      <TableHead className="w-20">{t.adminBanners.enabled}</TableHead>
                      <TableHead className="w-24">{t.adminBanners.actions}</TableHead>
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
                          getScheduleStatus={getScheduleStatus}
                          t={t}
                          dateLocale={dateLocale}
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
        <DialogContent className="sm:max-w-[900px] max-h-[90vh] overflow-hidden" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>
              {editingBanner ? t.adminBanners.editBanner : t.adminBanners.addNewBanner}
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="max-h-[calc(90vh-140px)]">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 py-4 px-1">
              {/* Form Fields */}
              <div className="space-y-4">
                {/* Basic Info */}
                <div className="space-y-2">
                  <Label htmlFor="title">{t.adminBanners.bannerTitle}</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder={t.adminBanners.titlePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="subtitle">{t.adminBanners.subtitleLabel}</Label>
                  <Input
                    id="subtitle"
                    value={formData.subtitle}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                    }
                    placeholder={t.adminBanners.subtitlePlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="button_text">{t.adminBanners.buttonText}</Label>
                  <Input
                    id="button_text"
                    value={formData.button_text}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, button_text: e.target.value }))
                    }
                    placeholder={t.adminBanners.buttonTextPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="link_url">{t.adminBanners.linkUrl}</Label>
                  <Input
                    id="link_url"
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                    }
                    placeholder={t.adminBanners.linkUrlPlaceholder}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="image">{t.adminBanners.bannerImage}</Label>
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                </div>

                {/* Customization Controls */}
                <div className="space-y-4 p-4 border rounded-lg bg-muted/30">
                  <h4 className="font-medium text-sm">{isRTL ? "تخصيص العناصر" : "Element Customization"}</h4>
                  
                  {/* Show/Hide Toggles */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isRTL ? "إظهار العنوان" : "Show Title"}</Label>
                      <Switch
                        checked={formData.show_title}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, show_title: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isRTL ? "إظهار العنوان الفرعي" : "Show Subtitle"}</Label>
                      <Switch
                        checked={formData.show_subtitle}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, show_subtitle: checked }))
                        }
                      />
                    </div>
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isRTL ? "إظهار الزر" : "Show Button"}</Label>
                      <Switch
                        checked={formData.show_button}
                        onCheckedChange={(checked) =>
                          setFormData((prev) => ({ ...prev, show_button: checked }))
                        }
                      />
                    </div>
                  </div>

                  {/* Text Position */}
                  <div className="space-y-2">
                    <Label className="text-sm">{isRTL ? "موقع النص" : "Text Position"}</Label>
                    <Select
                      value={formData.text_position}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, text_position: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">{isRTL ? "أعلى" : "Top"}</SelectItem>
                        <SelectItem value="center">{isRTL ? "وسط" : "Center"}</SelectItem>
                        <SelectItem value="end">{isRTL ? "أسفل" : "Bottom"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Text Alignment */}
                  <div className="space-y-2">
                    <Label className="text-sm">{isRTL ? "محاذاة النص" : "Text Alignment"}</Label>
                    <Select
                      value={formData.text_alignment}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, text_alignment: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="start">{isRTL ? "يمين" : "Left"}</SelectItem>
                        <SelectItem value="center">{isRTL ? "وسط" : "Center"}</SelectItem>
                        <SelectItem value="end">{isRTL ? "يسار" : "Right"}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Overlay Opacity */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isRTL ? "شفافية الخلفية" : "Overlay Opacity"}</Label>
                      <span className="text-xs text-muted-foreground">{formData.overlay_opacity}%</span>
                    </div>
                    <Slider
                      value={[formData.overlay_opacity]}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, overlay_opacity: value[0] }))
                      }
                      min={0}
                      max={100}
                      step={5}
                    />
                  </div>

                  {/* Image Fit Mode */}
                  <div className="space-y-2">
                    <Label className="text-sm">{isRTL ? "طريقة عرض الصورة" : "Image Fit Mode"}</Label>
                    <Select
                      value={formData.image_fit}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, image_fit: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="cover">
                          {isRTL ? "ملء البانر (قد يتم قص الصورة)" : "Fill Banner (may crop)"}
                        </SelectItem>
                        <SelectItem value="contain">
                          {isRTL ? "إظهار الصورة كاملة" : "Show Full Image"}
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Image Scale/Zoom */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm">{isRTL ? "حجم الصورة (تكبير/تصغير)" : "Image Scale (Zoom)"}</Label>
                      <span className="text-xs text-muted-foreground">{formData.image_scale}%</span>
                    </div>
                    <Slider
                      value={[formData.image_scale]}
                      onValueChange={(value) =>
                        setFormData((prev) => ({ ...prev, image_scale: value[0] }))
                      }
                      min={50}
                      max={200}
                      step={5}
                    />
                    <p className="text-xs text-muted-foreground">
                      {isRTL 
                        ? "استخدم هذا للتحكم بحجم الصورة بعد اختيار طريقة العرض" 
                        : "Use this to adjust image size after choosing fit mode"}
                    </p>
                  </div>
                </div>

                {/* Scheduling */}
                <div className="space-y-3 p-3 border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Clock className="h-4 w-4" />
                    <span>{t.adminBanners.scheduling}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1">
                      <Label className="text-xs">{t.adminBanners.startDate}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start font-normal h-9 text-xs",
                              !formData.valid_from && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className={cn("h-3 w-3", isRTL ? "ml-2" : "mr-2")} />
                            {formData.valid_from
                              ? format(formData.valid_from, "d MMM yyyy", { locale: dateLocale })
                              : t.adminBanners.selectDate}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.valid_from}
                            onSelect={(date) =>
                              setFormData((prev) => ({ ...prev, valid_from: date }))
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-xs">{t.adminBanners.endDate}</Label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              "w-full justify-start font-normal h-9 text-xs",
                              !formData.valid_until && "text-muted-foreground"
                            )}
                          >
                            <CalendarIcon className={cn("h-3 w-3", isRTL ? "ml-2" : "mr-2")} />
                            {formData.valid_until
                              ? format(formData.valid_until, "d MMM yyyy", { locale: dateLocale })
                              : t.common.notAvailable}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                          <Calendar
                            mode="single"
                            selected={formData.valid_until}
                            onSelect={(date) =>
                              setFormData((prev) => ({ ...prev, valid_until: date }))
                            }
                            disabled={(date) =>
                              formData.valid_from ? isBefore(date, formData.valid_from) : false
                            }
                            initialFocus
                            className="pointer-events-auto"
                          />
                        </PopoverContent>
                      </Popover>
                    </div>
                  </div>
                  {formData.valid_until && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-xs h-7"
                      onClick={() => setFormData((prev) => ({ ...prev, valid_until: undefined }))}
                    >
                      {t.common.remove} {t.adminBanners.endDate}
                    </Button>
                  )}
                </div>
              </div>

              {/* Live Preview */}
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Eye className="h-4 w-4" />
                  <span>{t.common.view} {t.adminBanners.banner}</span>
                </div>
                <div className="relative overflow-hidden rounded-2xl border min-h-[120px] bg-muted">
                  {imagePreview ? (
                    <img 
                      src={imagePreview} 
                      alt="Preview" 
                      className={cn(
                        "absolute inset-0 w-full h-full transition-transform duration-200",
                        formData.image_fit === "cover" ? "object-cover" : "object-contain"
                      )}
                      style={{ 
                        transform: `scale(${formData.image_scale / 100})`,
                        transformOrigin: 'center center'
                      }}
                    />
                  ) : (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                      <Image className="h-8 w-8 text-muted-foreground" />
                    </div>
                  )}
                  {/* Overlay */}
                  <div 
                    className="absolute inset-0 bg-black"
                    style={{ opacity: formData.overlay_opacity / 100 }}
                  />
                  {/* Content */}
                  <div 
                    className={cn(
                      "relative z-10 p-5 flex flex-col min-h-[120px]",
                      formData.text_position === "start" && "justify-start",
                      formData.text_position === "center" && "justify-center",
                      formData.text_position === "end" && "justify-end",
                      formData.text_alignment === "start" && "items-start text-start",
                      formData.text_alignment === "center" && "items-center text-center",
                      formData.text_alignment === "end" && "items-end text-end"
                    )}
                  >
                    <div className="space-y-2">
                      {formData.show_title && (
                        <h3 className="text-xl font-bold text-white drop-shadow-lg">
                          {formData.title || t.adminBanners.bannerTitle}
                        </h3>
                      )}
                      {formData.show_subtitle && formData.subtitle && (
                        <p className="text-sm text-white/90 drop-shadow">
                          {formData.subtitle}
                        </p>
                      )}
                      {formData.show_button && formData.button_text && (
                        <button 
                          className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap"
                          disabled
                        >
                          {formData.button_text}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground text-center">
                  {isRTL ? "هذه معاينة تقريبية لشكل البنر في الصفحة الرئيسية" : "This is an approximate preview of the banner on the homepage"}
                </p>
              </div>
            </div>
          </ScrollArea>
          <DialogFooter>
            <Button variant="outline" onClick={handleCloseDialog}>
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={(!imagePreview && !imageFile) || isUploading}
            >
              {isUploading ? t.common.saving : editingBanner ? t.common.update : t.common.add}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent dir={isRTL ? "rtl" : "ltr"}>
          <AlertDialogHeader>
            <AlertDialogTitle>{t.adminBanners.deleteConfirmTitle}</AlertDialogTitle>
            <AlertDialogDescription>
              {t.adminBanners.deleteConfirmDesc}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {t.common.delete}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default AdminBanners;
