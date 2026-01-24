import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Briefcase, X, ArrowLeft, ArrowRight, Check, Search } from "lucide-react";
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
import { SERVICE_CATEGORIES } from "@/hooks/useArtists";
import { toast } from "sonner";
import { GroupedServicesList } from "@/components/artist/GroupedServicesList";
import { cn } from "@/lib/utils";

interface ServiceForm {
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
  const [searchParams] = useSearchParams();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: services, isLoading: servicesLoading } = useArtistServices();
  const createService = useCreateService();
  const updateService = useUpdateService();
  const deleteService = useDeleteService();
  const { t, isRTL, language } = useLanguage();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<ArtistService | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [serviceForm, setServiceForm] = useState<ServiceForm>({
    name_ar: "",
    name_en: "",
    description_ar: "",
    description_en: "",
    duration_minutes: 60,
    price: 0,
    category: "",
    is_active: true,
  });

  // Check for ?new=true query parameter to auto-open add modal
  // This must be before any conditional returns to follow React's rules of hooks
  useEffect(() => {
    const shouldOpenModal = searchParams.get('new') === 'true';
    if (shouldOpenModal && !authLoading && !artistLoading && user && artist) {
      setIsAddModalOpen(true);
      // Remove the parameter from URL
      const newSearchParams = new URLSearchParams(searchParams);
      newSearchParams.delete('new');
      navigate(`/artist-services${newSearchParams.toString() ? '?' + newSearchParams.toString() : ''}`, { replace: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authLoading, artistLoading, user, artist]);

  // Ensure body scroll is enabled when modal closes
  useEffect(() => {
    return () => {
      // Re-enable scrolling when component unmounts
      document.body.style.overflow = '';
      document.body.style.position = '';
    };
  }, []);

  // Lock/unlock body scroll when modal opens/closes
  useEffect(() => {
    if (isAddModalOpen) {
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.width = '100%';
    } else {
      document.body.style.overflow = '';
      document.body.style.position = '';
      document.body.style.width = '';
    }
  }, [isAddModalOpen]);

  // Filter services by search
  const filteredServices = services
    ? services.filter((service) => {
        const searchLower = searchQuery.toLowerCase();
        const name = (service as any).name_ar || (service as any).name_en || service.name;
        const desc =
          (service as any).description_ar ||
          (service as any).description_en ||
          service.description;
        return (
          name.toLowerCase().includes(searchLower) ||
          (desc && desc.toLowerCase().includes(searchLower))
        );
      })
    : [];

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">
            {t.artistServices.title}
          </h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {t.artistBookings.notAnArtist}
          </h2>
          <p className="text-muted-foreground mb-6">{t.artistBookings.noArtistProfile}</p>
          <Button onClick={() => navigate("/home")}>{t.artistBookings.goHome}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const openAddModal = () => {
    setEditingService(null);
    setCurrentStep(1);
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
    setIsAddModalOpen(true);
  };

  const openEditService = (service: any) => {
    setEditingService(service);
    setCurrentStep(1);
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
    setIsAddModalOpen(true);
  };

  const handleSaveService = async () => {
    if (!serviceForm.name_ar && !serviceForm.name_en) {
      toast.error(
        isRTL
          ? "أدخل اسم الخدمة بلغة واحدة على الأقل"
          : "Enter service name in at least one language"
      );
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
      setIsAddModalOpen(false);
    } catch {
      toast.error(t.artistServices.failedToSave);
    }
  };

  const handleDeleteService = async (serviceId: string) => {
    try {
      await deleteService.mutateAsync(serviceId);
      toast.success(t.artistServices.serviceDeleted);
    } catch {
      toast.error(t.artistServices.failedToDelete);
    }
  };

  const canProceedToStep2 = () => {
    return serviceForm.name_ar || serviceForm.name_en;
  };

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      <div className="px-4 py-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {language === "ar" ? "الخدمات" : "Services"}
          </h2>
          <button
            onClick={openAddModal}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-full text-sm font-medium shadow-md flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            {language === "ar" ? "إضافة خدمة" : "Add Service"}
          </button>
        </div>

        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder={language === "ar" ? "البحث في الخدمات..." : "Search services..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Services List */}
        {servicesLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full rounded-2xl" />)}
          </div>
        ) : (
          <GroupedServicesList
            services={filteredServices}
            onEditService={openEditService}
            onDeleteService={handleDeleteService}
            language={language}
          />
        )}
      </div>

      {/* Add/Edit Service Modal */}
      {isAddModalOpen && (
        <>
          <style>{`
            @keyframes slide-in-bottom {
              from {
                transform: translateY(100%);
              }
              to {
                transform: translateY(0);
              }
            }
            @keyframes fade-in {
              from {
                opacity: 0;
              }
              to {
                opacity: 1;
              }
            }
            .animate-slide-in-bottom {
              animation: slide-in-bottom 0.3s ease-out forwards;
            }
            .animate-fade-in {
              animation: fade-in 0.2s ease-out forwards;
            }
          `}</style>
          <div className="fixed inset-0 z-[60] bg-black/50 flex items-end" onClick={() => setIsAddModalOpen(false)}>
            <div className="w-full max-h-[calc(100vh-2rem)] bg-background rounded-t-3xl overflow-hidden animate-slide-in-bottom flex flex-col" onClick={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <div className="flex items-center justify-between px-4 py-4 border-b border-border">
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted"
              >
                <X className="w-5 h-5" />
              </button>
              <h3 className="text-lg font-semibold">
                {editingService
                  ? (language === "ar" ? "تعديل الخدمة" : "Edit Service")
                  : language === "ar"
                  ? "إضافة خدمة"
                  : "Add Service"}
              </h3>
              <div className="w-8" />
            </div>

            {/* Step Indicator */}
            <div className="flex items-center justify-center gap-2 py-3 border-b border-border">
              {[1, 2, 3].map((step) => (
                <div
                  key={step}
                  className={cn(
                    "w-8 h-1 rounded-full transition-colors",
                    currentStep >= step ? "bg-primary" : "bg-muted"
                  )}
                />
              ))}
            </div>

            {/* Modal Content */}
            <div className="p-4 overflow-y-auto flex-1">
              {currentStep === 1 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <Label htmlFor="name">{language === "ar" ? "اسم الخدمة" : "Service Name"}</Label>
                    <Input
                      id="name"
                      value={language === "ar" ? serviceForm.name_ar : serviceForm.name_en}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          ...(language === "ar"
                            ? { name_ar: e.target.value }
                            : { name_en: e.target.value }),
                        })
                      }
                      placeholder={language === "ar" ? "مثال: مكياج عروس" : "e.g. Bridal Makeup"}
                    />
                  </div>

                  <div>
                    <Label htmlFor="category">{language === "ar" ? "الفئة" : "Category"}</Label>
                    <Select
                      value={serviceForm.category}
                      onValueChange={(value) => setServiceForm({ ...serviceForm, category: value })}
                    >
                      <SelectTrigger>
                        <SelectValue
                          placeholder={language === "ar" ? "اختر الفئة" : "Select category"}
                        />
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

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="price">{language === "ar" ? "السعر (QAR)" : "Price (QAR)"}</Label>
                      <Input
                        id="price"
                        type="number"
                        value={serviceForm.price}
                        onChange={(e) =>
                          setServiceForm({ ...serviceForm, price: parseFloat(e.target.value) || 0 })
                        }
                      />
                    </div>
                    <div>
                      <Label htmlFor="duration">{language === "ar" ? "المدة (دقيقة)" : "Duration (min)"}</Label>
                      <Input
                        id="duration"
                        type="number"
                        value={serviceForm.duration_minutes}
                        onChange={(e) =>
                          setServiceForm({
                            ...serviceForm,
                            duration_minutes: parseInt(e.target.value) || 60,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
              )}

              {currentStep === 2 && (
                <div className="space-y-4 animate-fade-in">
                  <div>
                    <Label htmlFor="description">
                      {language === "ar" ? "الوصف" : "Description"}
                    </Label>
                    <Textarea
                      id="description"
                      value={language === "ar" ? serviceForm.description_ar : serviceForm.description_en}
                      onChange={(e) =>
                        setServiceForm({
                          ...serviceForm,
                          ...(language === "ar"
                            ? { description_ar: e.target.value }
                            : { description_en: e.target.value }),
                        })
                      }
                      placeholder={language === "ar" ? "وصف تفصيلي..." : "Detailed description..."}
                      rows={4}
                    />
                  </div>
                </div>
              )}

              {currentStep === 3 && (
                <div className="space-y-4 animate-fade-in">
                  <div className="bg-muted rounded-xl p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === "ar" ? "الخدمة" : "Service"}
                      </span>
                      <span className="font-medium">
                        {language === "ar" ? serviceForm.name_ar : serviceForm.name_en}
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === "ar" ? "الفئة" : "Category"}
                      </span>
                      <span className="font-medium">{serviceForm.category}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === "ar" ? "السعر" : "Price"}
                      </span>
                      <span className="font-medium">QAR {serviceForm.price}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-sm text-muted-foreground">
                        {language === "ar" ? "المدة" : "Duration"}
                      </span>
                      <span className="font-medium">{serviceForm.duration_minutes} min</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <Label htmlFor="active">{language === "ar" ? "نشط" : "Active"}</Label>
                    <input
                      id="active"
                      type="checkbox"
                      checked={serviceForm.is_active}
                      onChange={(e) => setServiceForm({ ...serviceForm, is_active: e.target.checked })}
                      className="w-5 h-5 accent-primary"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center gap-3 p-4 border-t border-border safe-area-bottom">
              {currentStep > 1 && (
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setCurrentStep(currentStep - 1)}
                >
                  {isRTL ? <ArrowRight className="w-4 h-4 mr-2" /> : <ArrowLeft className="w-4 h-4 mr-2" />}
                  {language === "ar" ? "السابق" : "Back"}
                </Button>
              )}

              {currentStep < 3 ? (
                <Button
                  className="flex-1"
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={currentStep === 1 && !canProceedToStep2()}
                >
                  {language === "ar" ? "التالي" : "Next"}
                  {isRTL ? <ArrowLeft className="w-4 h-4 ml-2" /> : <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              ) : (
                <Button className="flex-1" onClick={handleSaveService}>
                  <Check className="w-4 h-4 mr-2" />
                  {language === "ar" ? "حفظ" : "Save"}
                </Button>
              )}
            </div>
          </div>
        </div>
        </>
      )}

      <BottomNavigation />
    </div>
  );
};

export default ArtistServices;
