import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Pencil, Trash2, Clock, Briefcase, Languages, Loader2 } from "lucide-react";
import { formatQAR } from "@/lib/locale";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  useCurrentArtist,
  useArtistServices,
  useCreateService,
  useUpdateService,
  useDeleteService,
  ArtistService,
} from "@/hooks/useArtistDashboard";
import { useTranslateService } from "@/hooks/useTranslateService";
import { SERVICE_CATEGORIES } from "@/hooks/useArtists";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

interface BilingualServiceForm {
  name_ar: string;
  name_en: string;
  description_ar: string;
  description_en: string;
  duration_minutes: number;
  price: number;
  category: string;
  is_active: boolean;
}

const ArtistServices = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: services, isLoading: servicesLoading } = useArtistServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { translate, isTranslating } = useTranslateService();
  const { t, isRTL, language } = useLanguage();

  const [serviceDialogOpen, setServiceDialogOpen] = useState(false);
  const [editingService, setEditingService] = useState<ArtistService | null>(null);
  const [activeTab, setActiveTab] = useState<"ar" | "en">(language === "ar" ? "ar" : "en");
  const [serviceForm, setServiceForm] = useState<BilingualServiceForm>({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    duration_minutes: 60,
    price: 0,
    category: "",
    is_active: true,
  });

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.artistServices.title}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.artistBookings.notAnArtist}</h2>
          <p className="text-muted-foreground mb-6">{t.artistBookings.noArtistProfile}</p>
          <Button onClick={() => navigate("/home")}>{t.artistBookings.goHome}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const openServiceDialog = (service?: ArtistService) => {
    if (service) {
      setEditingService(service);
      setServiceForm({
        name_ar: (service as any).name_ar || service.name || "",
        name_en: (service as any).name_en || "",
        description_ar: (service as any).description_ar || service.description || "",
        description_en: (service as any).description_en || "",
        duration_minutes: service.duration_minutes,
        price: service.price,
        category: service.category || "",
        is_active: service.is_active ?? true,
      });
    } else {
      setEditingService(null);
      setServiceForm({
        name_ar: "",
        name_en: "",
        description_ar: "",
        description_en: "",
        duration_minutes: 60,
        price: 0,
        category: "",
        is_active: true,
      });
    }
    setActiveTab(language === "ar" ? "ar" : "en");
    setServiceDialogOpen(true);
  };

  const handleAutoTranslate = async () => {
    const currentLang = activeTab;
    const targetLang = currentLang === "ar" ? "en" : "ar";
    
    const nameToTranslate = currentLang === "ar" ? serviceForm.name_ar : serviceForm.name_en;
    const descToTranslate = currentLang === "ar" ? serviceForm.description_ar : serviceForm.description_en;

    if (!nameToTranslate && !descToTranslate) {
      toast.error(isRTL ? "أدخل النص أولاً" : "Enter text first");
      return;
    }

    const [translatedName, translatedDesc] = await Promise.all([
      nameToTranslate ? translate(nameToTranslate, targetLang) : null,
      descToTranslate ? translate(descToTranslate, targetLang) : null,
    ]);

    setServiceForm(prev => ({
      ...prev,
      ...(targetLang === "ar" ? {
        name_ar: translatedName || prev.name_ar,
        description_ar: translatedDesc || prev.description_ar,
      } : {
        name_en: translatedName || prev.name_en,
        description_en: translatedDesc || prev.description_en,
      }),
    }));

    toast.success(isRTL ? "تمت الترجمة بنجاح" : "Translation completed");
    setActiveTab(targetLang);
  };

  const handleServiceSave = async () => {
    // Validate at least one language has name
    if (!serviceForm.name_ar && !serviceForm.name_en) {
      toast.error(isRTL ? "أدخل اسم الخدمة بلغة واحدة على الأقل" : "Enter service name in at least one language");
      return;
    }

    try {
      const serviceData = {
        name: serviceForm.name_ar || serviceForm.name_en,
        description: serviceForm.description_ar || serviceForm.description_en,
        name_ar: serviceForm.name_ar || null,
        name_en: serviceForm.name_en || null,
        description_ar: serviceForm.description_ar || null,
        description_en: serviceForm.description_en || null,
        duration_minutes: serviceForm.duration_minutes,
        price: serviceForm.price,
        category: serviceForm.category,
        is_active: serviceForm.is_active,
      };

      if (editingService) {
        await updateService.mutateAsync({ id: editingService.id, ...serviceData });
        toast.success(t.artistServices.serviceUpdated);
      } else {
        await createService.mutateAsync(serviceData);
        toast.success(t.artistServices.serviceCreated);
      }
      setServiceDialogOpen(false);
    } catch {
      toast.error(t.artistServices.failedToSave);
    }
  };

  const handleServiceDelete = async (serviceId: string) => {
    try {
      await deleteService.mutateAsync(serviceId);
      toast.success(t.artistServices.serviceDeleted);
    } catch {
      toast.error(t.artistServices.failedToDelete);
    }
  };

  const getServiceDisplayName = (service: ArtistService) => {
    const s = service as any;
    if (language === "ar") {
      return s.name_ar || s.name_en || service.name;
    }
    return s.name_en || s.name_ar || service.name;
  };

  const getServiceDisplayDescription = (service: ArtistService) => {
    const s = service as any;
    if (language === "ar") {
      return s.description_ar || s.description_en || service.description;
    }
    return s.description_en || s.description_ar || service.description;
  };

  const iconMargin = isRTL ? "ml-1" : "mr-1";

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      <div className="px-5 py-4 space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">{t.artistServices.yourServices}</h2>
          <Dialog open={serviceDialogOpen} onOpenChange={setServiceDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" onClick={() => openServiceDialog()}>
                <Plus className={`w-4 h-4 ${iconMargin}`} />
                {t.artistServices.addService}
              </Button>
            </DialogTrigger>
            <DialogContent dir={isRTL ? "rtl" : "ltr"} className="max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{editingService ? t.artistServices.editService : t.artistServices.addNewService}</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                {/* Language Tabs */}
                <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "ar" | "en")}>
                  <div className="flex items-center justify-between mb-2">
                    <TabsList className="grid grid-cols-2 w-[200px]">
                      <TabsTrigger value="ar">العربية</TabsTrigger>
                      <TabsTrigger value="en">English</TabsTrigger>
                    </TabsList>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={handleAutoTranslate}
                      disabled={isTranslating}
                    >
                      {isTranslating ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <>
                          <Languages className="w-4 h-4 me-1" />
                          {isRTL ? "ترجمة تلقائية" : "Auto Translate"}
                        </>
                      )}
                    </Button>
                  </div>

                  <TabsContent value="ar" className="space-y-4 mt-0">
                    <div>
                      <Label htmlFor="name_ar">{t.artistServices.serviceName} (العربية)</Label>
                      <Input
                        id="name_ar"
                        value={serviceForm.name_ar}
                        onChange={(e) => setServiceForm({ ...serviceForm, name_ar: e.target.value })}
                        placeholder="مثال: مكياج عروس كامل"
                        dir="rtl"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description_ar">{t.artistServices.description} (العربية)</Label>
                      <Textarea
                        id="description_ar"
                        value={serviceForm.description_ar}
                        onChange={(e) => setServiceForm({ ...serviceForm, description_ar: e.target.value })}
                        placeholder="وصف تفصيلي للخدمة..."
                        dir="rtl"
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="en" className="space-y-4 mt-0">
                    <div>
                      <Label htmlFor="name_en">{t.artistServices.serviceName} (English)</Label>
                      <Input
                        id="name_en"
                        value={serviceForm.name_en}
                        onChange={(e) => setServiceForm({ ...serviceForm, name_en: e.target.value })}
                        placeholder="e.g. Full Bridal Makeup"
                        dir="ltr"
                      />
                    </div>
                    <div>
                      <Label htmlFor="description_en">{t.artistServices.description} (English)</Label>
                      <Textarea
                        id="description_en"
                        value={serviceForm.description_en}
                        onChange={(e) => setServiceForm({ ...serviceForm, description_en: e.target.value })}
                        placeholder="Detailed service description..."
                        dir="ltr"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="price">{t.artistServices.price}</Label>
                    <Input
                      id="price"
                      type="number"
                      value={serviceForm.price}
                      onChange={(e) => setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })}
                      dir="ltr"
                    />
                  </div>
                  <div>
                    <Label htmlFor="duration">{t.artistServices.duration}</Label>
                    <Input
                      id="duration"
                      type="number"
                      value={serviceForm.duration_minutes}
                      onChange={(e) => setServiceForm({ ...serviceForm, duration_minutes: parseInt(e.target.value) || 60 })}
                      dir="ltr"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="category">{t.artistServices.category}</Label>
                  <Select
                    value={serviceForm.category}
                    onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder={t.artistServices.selectCategory} />
                    </SelectTrigger>
                    <SelectContent>
                      {SERVICE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat} value={cat}>
                          {cat}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <Label htmlFor="active">{t.artistServices.active}</Label>
                  <Switch
                    id="active"
                    checked={serviceForm.is_active}
                    onCheckedChange={(checked) => setServiceForm({ ...serviceForm, is_active: checked })}
                  />
                </div>
                <Button className="w-full" onClick={handleServiceSave}>
                  {t.artistServices.save}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {servicesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : services && services.length > 0 ? (
          <div className="space-y-3">
            {services.map((service) => (
              <div key={service.id} className={`bg-card rounded-2xl border border-border p-4 shadow-sm ${!service.is_active ? "opacity-50" : ""}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-foreground">{getServiceDisplayName(service)}</h3>
                      {!service.is_active && (
                        <span className="px-2 py-0.5 text-xs bg-muted text-muted-foreground rounded-full">
                          {isRTL ? "غير مفعّلة" : "Inactive"}
                        </span>
                      )}
                    </div>
                    {service.category && (
                      <span className="text-xs text-primary">{service.category}</span>
                    )}
                    {getServiceDisplayDescription(service) && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{getServiceDisplayDescription(service)}</p>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <span className="font-medium text-foreground">{formatQAR(service.price)}</span>
                      </div>
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        <span>{service.duration_minutes} {t.artistServices.minutes}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button 
                      onClick={() => openServiceDialog(service)}
                      className="p-2 rounded-full hover:bg-muted transition-colors"
                    >
                      <Pencil className="w-4 h-4 text-muted-foreground" />
                    </button>
                    <button 
                      onClick={() => handleServiceDelete(service.id)}
                      className="p-2 rounded-full hover:bg-destructive/10 transition-colors"
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.artistServices.noServicesYet}</p>
            <p className="text-sm mt-1">{t.artistServices.addFirstService}</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistServices;
