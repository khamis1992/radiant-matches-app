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
import { Plus, Pencil, Trash2, GripVertical, Image, ExternalLink, Eye, CalendarIcon, Clock, Layout, Palette } from "lucide-react";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
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
  banner_height: number;
  position_x: number;
  position_y: number;
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
  banner_height: 160,
  position_x: 50,
  position_y: 50,
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
  banner_height: number;
  position_x: number;
  position_y: number;
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
  const [mobilePreview, setMobilePreview] = useState(false);
  const [activeTab, setActiveTab] = useState("content");

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
        banner_height: banner.banner_height ?? 160,
        position_x: banner.position_x ?? 50,
        position_y: banner.position_y ?? 50,
      });
      setImagePreview(banner.image_url);
    } else {
      setEditingBanner(null);
      setFormData(initialFormData);
      setImagePreview("");
    }
    setImageFile(null);
    setIsDialogOpen(true);
    setActiveTab("content");
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
        image_scale: Math.round(formData.image_scale),
        banner_height: Math.round(formData.banner_height),
        position_x: Math.round(formData.position_x),
        position_y: Math.round(formData.position_y),
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
          <Button onClick={() => handleOpenDialog()}>
            <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
            {t.adminBanners.addBanner}
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

      {/* Add/Edit Dialog with Tabs */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[1000px] max-h-[95vh] overflow-hidden p-0" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader className="px-6 pt-6 pb-2">
            <DialogTitle className="text-xl">
              {editingBanner ? t.adminBanners.editBanner : t.adminBanners.addNewBanner}
            </DialogTitle>
          </DialogHeader>
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <div className="px-6">
              <TabsList className="grid w-full grid-cols-3 mb-4">
                <TabsTrigger value="content" className="gap-2">
                  <Layout className="h-4 w-4" />
                  {isRTL ? "المحتوى" : "Content"}
                </TabsTrigger>
                <TabsTrigger value="design" className="gap-2">
                  <Palette className="h-4 w-4" />
                  {isRTL ? "التصميم" : "Design"}
                </TabsTrigger>
                <TabsTrigger value="schedule" className="gap-2">
                  <Clock className="h-4 w-4" />
                  {isRTL ? "الجدولة" : "Schedule"}
                </TabsTrigger>
              </TabsList>
            </div>
            
            <ScrollArea className="h-[calc(95vh-240px)] overflow-y-auto">
              <div className="px-6 pb-6">
                {/* Content Tab */}
                <TabsContent value="content" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Form Fields */}
                    <div className="space-y-5">
                      {/* Image Upload */}
                      <Card className="p-4 border-dashed border-2 hover:border-primary/50 transition-colors">
                        <div className="space-y-3">
                          <div className="flex items-center gap-2">
                            <Image className="h-5 w-5 text-primary" />
                            <Label htmlFor="image" className="font-medium">{t.adminBanners.bannerImage}</Label>
                          </div>
                          <Input
                            id="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="cursor-pointer"
                          />
                          <p className="text-xs text-muted-foreground">
                            {isRTL 
                              ? "الأبعاد المثالية: 1200×400 بكسل للحصول على أفضل جودة"
                              : "Recommended: 1200×400px for best quality"}
                          </p>
                        </div>
                      </Card>

                      {/* Text Content */}
                      <Card className="p-4">
                        <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                          <Layout className="h-4 w-4 text-primary" />
                          {isRTL ? "محتوى البانر" : "Banner Content"}
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="title" className="text-sm">{t.adminBanners.bannerTitle}</Label>
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
                            <Label htmlFor="subtitle" className="text-sm">{t.adminBanners.subtitleLabel}</Label>
                            <Input
                              id="subtitle"
                              value={formData.subtitle}
                              onChange={(e) =>
                                setFormData((prev) => ({ ...prev, subtitle: e.target.value }))
                              }
                              placeholder={t.adminBanners.subtitlePlaceholder}
                            />
                          </div>
                          
                          <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-2">
                              <Label htmlFor="button_text" className="text-sm">{t.adminBanners.buttonText}</Label>
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
                              <Label htmlFor="link_url" className="text-sm">{t.adminBanners.linkUrl}</Label>
                              <Input
                                id="link_url"
                                value={formData.link_url}
                                onChange={(e) =>
                                  setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                                }
                                placeholder={t.adminBanners.linkUrlPlaceholder}
                              />
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Visibility Controls */}
                      <Card className="p-4">
                        <h4 className="font-medium text-sm mb-3 flex items-center gap-2">
                          <Eye className="h-4 w-4 text-primary" />
                          {isRTL ? "إظهار/إخفاء العناصر" : "Show/Hide Elements"}
                        </h4>
                        <div className="space-y-2">
                          {[
                            { key: 'show_title', label: isRTL ? "إظهار العنوان" : "Show Title" },
                            { key: 'show_subtitle', label: isRTL ? "إظهار العنوان الفرعي" : "Show Subtitle" },
                            { key: 'show_button', label: isRTL ? "إظهار الزر" : "Show Button" },
                          ].map((item, index) => (
                            <div key={item.key} className={`flex items-center justify-between py-2 ${index > 0 ? 'border-t' : ''}`}>
                              <Label className="text-sm">{item.label}</Label>
                              <Switch
                                checked={formData[item.key as keyof BannerFormData] as boolean}
                                onCheckedChange={(checked) =>
                                  setFormData((prev) => ({ ...prev, [item.key]: checked }))
                                }
                              />
                            </div>
                          ))}
                        </div>
                      </Card>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="lg:sticky lg:top-0 h-fit">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Eye className="h-4 w-4 text-primary" />
                            <span>{t.adminBanners.preview || (isRTL ? "معاينة" : "Preview")}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                            <span className={`text-xs px-2 py-1 rounded transition-all ${!mobilePreview ? 'bg-background shadow-sm' : ''}`}>
                              {isRTL ? "سطح المكتب" : "Desktop"}
                            </span>
                            <Switch
                              checked={mobilePreview}
                              onCheckedChange={setMobilePreview}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className={`text-xs px-2 py-1 rounded transition-all ${mobilePreview ? 'bg-background shadow-sm' : ''}`}>
                              {isRTL ? "الجوال" : "Mobile"}
                            </span>
                          </div>
                        </div>
                        
                        <div 
                          className={cn(
                            "relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-muted mx-auto transition-all duration-300 shadow-lg",
                            mobilePreview ? "max-w-[375px]" : "w-full"
                          )}
                          style={{ minHeight: `${formData.banner_height}px` }}
                        >
                          {/* Grid Overlay for Positioning */}
                          <div className="absolute inset-0 z-20 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                              {[...Array(9)].map((_, i) => (
                                <div key={i} className="border border-white/20" />
                              ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/50 rounded-full" />
                          </div>
                          
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
                              style={{ 
                                transform: `scale(${formData.image_scale / 100})`,
                                objectPosition: `${formData.position_x}% ${formData.position_y}%`,
                              }}
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Position Indicator */}
                          {imagePreview && (
                            <div 
                              className="absolute z-10 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg pointer-events-none transition-all duration-200"
                              style={{
                                left: `${formData.position_x}%`,
                                top: `${formData.position_y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          )}
                          
                          {/* Overlay */}
                          <div 
                            className="absolute inset-0 bg-black"
                            style={{ opacity: formData.overlay_opacity / 100 }}
                          />
                          
                          {/* Content */}
                          <div 
                            className={cn(
                              "relative z-10 p-5 flex flex-col",
                              formData.text_position === "start" && "justify-start",
                              formData.text_position === "center" && "justify-center",
                              formData.text_position === "end" && "justify-end",
                              formData.text_alignment === "start" && (isRTL ? "items-end text-end" : "items-start text-start"),
                              formData.text_alignment === "center" && "items-center text-center",
                              formData.text_alignment === "end" && (isRTL ? "items-start text-start" : "items-end text-end")
                            )}
                            style={{ minHeight: `${formData.banner_height}px` }}
                          >
                            <div className="space-y-2">
                              {formData.show_title && (
                                <h3 className="text-xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                  {formData.title || t.adminBanners.bannerTitle}
                                </h3>
                              )}
                              {formData.show_subtitle && formData.subtitle && (
                                <p className="text-sm text-white/90 drop-shadow" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                  {formData.subtitle}
                                </p>
                              )}
                              {formData.show_button && formData.button_text && (
                                <button 
                                  className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-lg"
                                  disabled
                                >
                                  {formData.button_text}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {isRTL 
                              ? `الموضع: X=${formData.position_x}%, Y=${formData.position_y}%` 
                              : `Position: X=${formData.position_x}%, Y=${formData.position_y}%`}
                          </span>
                          <span>
                            {mobilePreview 
                              ? (isRTL ? "معاينة الجوال (375px)" : "Mobile Preview (375px)")
                              : (isRTL ? "معاينة سطح المكتب" : "Desktop Preview")
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Design Tab */}
                <TabsContent value="design" className="mt-0">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left Column - Design Controls */}
                    <div className="space-y-5">
                      {/* Text Styling */}
                      <Card className="p-4">
                        <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                          <Palette className="h-4 w-4 text-primary" />
                          {isRTL ? "نمط النص" : "Text Styling"}
                        </h4>
                        <div className="space-y-4">
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
                        </div>
                      </Card>

                      {/* Overlay Settings */}
                      <Card className="p-4">
                        <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                          <Palette className="h-4 w-4 text-primary" />
                          {isRTL ? "إعدادات الخلفية" : "Background Settings"}
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{isRTL ? "شفافية الخلفية" : "Overlay Opacity"}</Label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{formData.overlay_opacity}%</span>
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
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>{isRTL ? "شفاف" : "Transparent"}</span>
                              <span>{isRTL ? "غامق" : "Dark"}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{isRTL ? "ارتفاع البانر" : "Banner Height"}</Label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{formData.banner_height}px</span>
                            </div>
                            <Slider
                              value={[formData.banner_height]}
                              onValueChange={(value) =>
                                setFormData((prev) => ({ ...prev, banner_height: value[0] }))
                              }
                              min={80}
                              max={400}
                              step={10}
                            />
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>80px</span>
                              <span>240px</span>
                              <span>400px</span>
                            </div>
                          </div>
                        </div>
                      </Card>

                      {/* Image Positioning */}
                      <Card className="p-4">
                        <div className="flex items-center justify-between mb-4">
                          <h4 className="font-medium text-sm flex items-center gap-2">
                            <span>🎯</span>
                            {isRTL ? "موضع الصورة" : "Image Position"}
                          </h4>
                          {(formData.position_x !== 50 || formData.position_y !== 50) && (
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              className="h-7 text-xs text-primary"
                              onClick={() => setFormData((prev) => ({ ...prev, position_x: 50, position_y: 50 }))}
                            >
                              {isRTL ? "إعادة للوسط" : "Reset to Center"}
                            </Button>
                          )}
                        </div>
                        
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{isRTL ? "الموضع الأفقي" : "Horizontal Position"}</Label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{formData.position_x}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{isRTL ? "يسار" : "Left"}</span>
                              <Slider
                                value={[formData.position_x]}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({ ...prev, position_x: value[0] }))
                                }
                                min={0}
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-muted-foreground">{isRTL ? "يمين" : "Right"}</span>
                            </div>
                          </div>

                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{isRTL ? "الموضع العمودي" : "Vertical Position"}</Label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{formData.position_y}%</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs text-muted-foreground">{isRTL ? "أعلى" : "Top"}</span>
                              <Slider
                                value={[formData.position_y]}
                                onValueChange={(value) =>
                                  setFormData((prev) => ({ ...prev, position_y: value[0] }))
                                }
                                min={0}
                                max={100}
                                step={1}
                                className="flex-1"
                              />
                              <span className="text-xs text-muted-foreground">{isRTL ? "أسفل" : "Bottom"}</span>
                            </div>
                          </div>

                          {/* Position Presets */}
                          <div className="grid grid-cols-3 gap-2 pt-2">
                            {[
                              { key: "top-left", label: "↖" },
                              { key: "top", label: "↑" },
                              { key: "top-right", label: "↗" },
                              { key: "left", label: "←" },
                              { key: "center", label: "•" },
                              { key: "right", label: "→" },
                              { key: "bottom-left", label: "↙" },
                              { key: "bottom", label: "↓" },
                              { key: "bottom-right", label: "↘" },
                            ].map((preset) => {
                              const presetValues: Record<string, { x: number; y: number }> = {
                                "top-left": { x: 0, y: 0 },
                                "top": { x: 50, y: 0 },
                                "top-right": { x: 100, y: 0 },
                                "left": { x: 0, y: 50 },
                                "center": { x: 50, y: 50 },
                                "right": { x: 100, y: 50 },
                                "bottom-left": { x: 0, y: 100 },
                                "bottom": { x: 50, y: 100 },
                                "bottom-right": { x: 100, y: 100 },
                              };
                              const isActive = formData.position_x === presetValues[preset.key].x && 
                                              formData.position_y === presetValues[preset.key].y;
                              return (
                                <Button
                                  key={preset.key}
                                  type="button"
                                  variant={isActive ? "default" : "outline"}
                                  size="sm"
                                  className="h-10 text-lg"
                                  onClick={() => {
                                    const { x, y } = presetValues[preset.key];
                                    setFormData((prev) => ({ ...prev, position_x: x, position_y: y }));
                                  }}
                                >
                                  {preset.label}
                                </Button>
                              );
                            })}
                          </div>
                        </div>
                      </Card>

                      {/* Image Scale */}
                      <Card className="p-4">
                        <h4 className="font-medium text-sm mb-4 flex items-center gap-2">
                          <span>🔍</span>
                          {isRTL ? "تكبير/تصغير" : "Zoom"}
                        </h4>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <div className="flex items-center justify-between">
                              <Label className="text-sm">{isRTL ? "مستوى التكبير" : "Zoom Level"}</Label>
                              <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">{formData.image_scale}%</span>
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
                            <div className="flex justify-between text-[10px] text-muted-foreground">
                              <span>50%</span>
                              <span>100%</span>
                              <span>200%</span>
                            </div>
                          </div>
                          <Button 
                            type="button" 
                            variant="outline" 
                            size="sm" 
                            className="w-full"
                            onClick={() => setFormData((prev) => ({ ...prev, image_scale: 100 }))}
                          >
                            {isRTL ? "إعادة تعيين إلى 100%" : "Reset to 100%"}
                          </Button>
                        </div>
                      </Card>
                    </div>

                    {/* Right Column - Preview */}
                    <div className="lg:sticky lg:top-0 h-fit">
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm font-medium">
                            <Eye className="h-4 w-4 text-primary" />
                            <span>{t.adminBanners.preview || (isRTL ? "معاينة" : "Preview")}</span>
                          </div>
                          <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                            <span className={`text-xs px-2 py-1 rounded transition-all ${!mobilePreview ? 'bg-background shadow-sm' : ''}`}>
                              {isRTL ? "سطح المكتب" : "Desktop"}
                            </span>
                            <Switch
                              checked={mobilePreview}
                              onCheckedChange={setMobilePreview}
                              className="data-[state=checked]:bg-primary"
                            />
                            <span className={`text-xs px-2 py-1 rounded transition-all ${mobilePreview ? 'bg-background shadow-sm' : ''}`}>
                              {isRTL ? "الجوال" : "Mobile"}
                            </span>
                          </div>
                        </div>
                        
                        <div 
                          className={cn(
                            "relative overflow-hidden rounded-2xl border-2 border-primary/20 bg-muted mx-auto transition-all duration-300 shadow-lg",
                            mobilePreview ? "max-w-[375px]" : "w-full"
                          )}
                          style={{ minHeight: `${formData.banner_height}px` }}
                        >
                          {/* Grid Overlay for Positioning */}
                          <div className="absolute inset-0 z-20 pointer-events-none opacity-0 hover:opacity-100 transition-opacity">
                            <div className="w-full h-full grid grid-cols-3 grid-rows-3">
                              {[...Array(9)].map((_, i) => (
                                <div key={i} className="border border-white/20" />
                              ))}
                            </div>
                            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-4 h-4 border-2 border-white/50 rounded-full" />
                          </div>
                          
                          {imagePreview ? (
                            <img 
                              src={imagePreview} 
                              alt="Preview" 
                              className="absolute inset-0 w-full h-full object-cover transition-all duration-200"
                              style={{ 
                                transform: `scale(${formData.image_scale / 100})`,
                                objectPosition: `${formData.position_x}% ${formData.position_y}%`,
                              }}
                              draggable={false}
                            />
                          ) : (
                            <div className="absolute inset-0 bg-gradient-to-r from-primary/20 to-primary/5 flex items-center justify-center">
                              <Image className="h-8 w-8 text-muted-foreground" />
                            </div>
                          )}
                          
                          {/* Position Indicator */}
                          {imagePreview && (
                            <div 
                              className="absolute z-10 w-4 h-4 bg-primary border-2 border-white rounded-full shadow-lg pointer-events-none transition-all duration-200"
                              style={{
                                left: `${formData.position_x}%`,
                                top: `${formData.position_y}%`,
                                transform: 'translate(-50%, -50%)'
                              }}
                            />
                          )}
                          
                          {/* Overlay */}
                          <div 
                            className="absolute inset-0 bg-black"
                            style={{ opacity: formData.overlay_opacity / 100 }}
                          />
                          
                          {/* Content */}
                          <div 
                            className={cn(
                              "relative z-10 p-5 flex flex-col",
                              formData.text_position === "start" && "justify-start",
                              formData.text_position === "center" && "justify-center",
                              formData.text_position === "end" && "justify-end",
                              formData.text_alignment === "start" && (isRTL ? "items-end text-end" : "items-start text-start"),
                              formData.text_alignment === "center" && "items-center text-center",
                              formData.text_alignment === "end" && (isRTL ? "items-start text-start" : "items-end text-end")
                            )}
                            style={{ minHeight: `${formData.banner_height}px` }}
                          >
                            <div className="space-y-2">
                              {formData.show_title && (
                                <h3 className="text-xl font-bold text-white drop-shadow-lg" style={{ textShadow: '0 2px 4px rgba(0,0,0,0.5)' }}>
                                  {formData.title || t.adminBanners.bannerTitle}
                                </h3>
                              )}
                              {formData.show_subtitle && formData.subtitle && (
                                <p className="text-sm text-white/90 drop-shadow" style={{ textShadow: '0 1px 2px rgba(0,0,0,0.5)' }}>
                                  {formData.subtitle}
                                </p>
                              )}
                              {formData.show_button && formData.button_text && (
                                <button 
                                  className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap shadow-lg"
                                  disabled
                                >
                                  {formData.button_text}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center justify-between text-xs text-muted-foreground">
                          <span>
                            {isRTL 
                              ? `الموضع: X=${formData.position_x}%, Y=${formData.position_y}%` 
                              : `Position: X=${formData.position_x}%, Y=${formData.position_y}%`}
                          </span>
                          <span>
                            {mobilePreview 
                              ? (isRTL ? "معاينة الجوال (375px)" : "Mobile Preview (375px)")
                              : (isRTL ? "معاينة سطح المكتب" : "Desktop Preview")
                            }
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                {/* Schedule Tab */}
                <TabsContent value="schedule" className="mt-0">
                  <div className="max-w-md mx-auto">
                    <Card className="p-6">
                      <h4 className="font-medium text-base mb-6 flex items-center gap-2">
                        <Clock className="h-5 w-5 text-primary" />
                        {isRTL ? "جدولة عرض البانر" : "Banner Schedule"}
                      </h4>
                      
                      <div className="space-y-6">
                        <div className="space-y-3">
                          <Label className="text-sm font-medium">{t.adminBanners.startDate}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start font-normal h-11",
                                  !formData.valid_from && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                {formData.valid_from
                                  ? format(formData.valid_from, "PPP", { locale: dateLocale })
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

                        <div className="space-y-3">
                          <Label className="text-sm font-medium">{t.adminBanners.endDate}</Label>
                          <Popover>
                            <PopoverTrigger asChild>
                              <Button
                                variant="outline"
                                className={cn(
                                  "w-full justify-start font-normal h-11",
                                  !formData.valid_until && "text-muted-foreground"
                                )}
                              >
                                <CalendarIcon className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                                {formData.valid_until
                                  ? format(formData.valid_until, "PPP", { locale: dateLocale })
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
                          {formData.valid_until && (
                            <Button
                              variant="ghost"
                              size="sm"
                              className="text-xs h-8"
                              onClick={() => setFormData((prev) => ({ ...prev, valid_until: undefined }))}
                            >
                              {t.common.remove} {t.adminBanners.endDate}
                            </Button>
                          )}
                        </div>

                        <div className="pt-4 border-t">
                          <p className="text-sm text-muted-foreground">
                            {isRTL 
                              ? "اترك تاريخ الانتهاء فارغاً لجعل البانر متاحاً بشكل دائم"
                              : "Leave end date empty to make the banner available indefinitely"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </div>
                </TabsContent>
              </div>
            </ScrollArea>
          </Tabs>
          
          <DialogFooter className="px-6 py-4 border-t">
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
