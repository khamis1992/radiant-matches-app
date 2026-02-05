import { useState, useEffect } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { usePlatformSettings, useUpdatePlatformSettings } from "@/hooks/useAdminSettings";
import { Navigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { Settings, Percent, Clock, Phone, Mail, Building, FileText, Palette, Image, Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
 import { ReportTemplatesManager } from "@/components/admin/ReportTemplatesManager";

const AdminSettings = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { t, isRTL } = useLanguage();
  const { data: settings, isLoading } = usePlatformSettings();
  const updateSettings = useUpdatePlatformSettings();

  const [formData, setFormData] = useState({
    commission_rate: 15,
    min_booking_hours: 24,
    max_booking_days: 30,
    cancellation_hours: 24,
    platform_name: "",
    support_email: "",
    support_phone: "",
    report_logo_url: "",
    report_primary_color: "#8b5cf6",
    report_secondary_color: "#a855f7",
    report_company_name: "Glam",
    report_footer_text: "جميع الحقوق محفوظة",
  });

  const [uploadingLogo, setUploadingLogo] = useState(false);

  useEffect(() => {
    if (settings) {
      setFormData({
        commission_rate: settings.commission_rate,
        min_booking_hours: settings.min_booking_hours,
        max_booking_days: settings.max_booking_days,
        cancellation_hours: settings.cancellation_hours,
        platform_name: settings.platform_name,
        support_email: settings.support_email,
        support_phone: settings.support_phone,
        report_logo_url: settings.report_logo_url || "",
        report_primary_color: settings.report_primary_color || "#8b5cf6",
        report_secondary_color: settings.report_secondary_color || "#a855f7",
        report_company_name: settings.report_company_name || "Glam",
        report_footer_text: settings.report_footer_text || "جميع الحقوق محفوظة",
      });
    }
  }, [settings]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateSettings.mutate(formData);
  };

  const handleChange = (field: string, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast.error("يرجى اختيار ملف صورة");
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast.error("حجم الصورة يجب أن يكون أقل من 2 ميغابايت");
      return;
    }

    setUploadingLogo(true);
    try {
      const fileExt = file.name.split(".").pop();
      const fileName = `report-logo-${Date.now()}.${fileExt}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("banners")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from("banners")
        .getPublicUrl(filePath);

      setFormData((prev) => ({ ...prev, report_logo_url: urlData.publicUrl }));
      toast.success("تم رفع الشعار بنجاح");
    } catch (error) {
      console.error("Error uploading logo:", error);
      toast.error("فشل رفع الشعار");
    } finally {
      setUploadingLogo(false);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />

      <main className={cn("p-8", isRTL ? "mr-64" : "ml-64")}>
        <div className="max-w-4xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-8 w-8" />
              {t.adminSettings.title}
            </h1>
            <p className="text-muted-foreground mt-1">{t.adminSettings.subtitle}</p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    {t.adminSettings.commissionSettings}
                  </CardTitle>
                  <CardDescription>{t.adminSettings.commissionDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="commission_rate">{t.adminSettings.commissionRate}</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={(e) => handleChange("commission_rate", Number(e.target.value))}
                        className="max-w-xs"
                      />
                      <p className="text-sm text-muted-foreground">{t.adminSettings.commissionHelp}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    {t.adminSettings.bookingSettings}
                  </CardTitle>
                  <CardDescription>{t.adminSettings.bookingDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="min_booking_hours">{t.adminSettings.minBookingHours}</Label>
                      <Input
                        id="min_booking_hours"
                        type="number"
                        min="1"
                        value={formData.min_booking_hours}
                        onChange={(e) => handleChange("min_booking_hours", Number(e.target.value))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max_booking_days">{t.adminSettings.maxBookingDays}</Label>
                      <Input
                        id="max_booking_days"
                        type="number"
                        min="1"
                        value={formData.max_booking_days}
                        onChange={(e) => handleChange("max_booking_days", Number(e.target.value))}
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cancellation_hours">{t.adminSettings.cancellationHours}</Label>
                      <Input
                        id="cancellation_hours"
                        type="number"
                        min="0"
                        value={formData.cancellation_hours}
                        onChange={(e) => handleChange("cancellation_hours", Number(e.target.value))}
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {t.adminSettings.platformInfo}
                  </CardTitle>
                  <CardDescription>{t.adminSettings.platformInfoDesc}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="platform_name">{t.adminSettings.platformName}</Label>
                      <Input
                        id="platform_name"
                        value={formData.platform_name}
                        onChange={(e) => handleChange("platform_name", e.target.value)}
                        className="max-w-md"
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="support_email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          {t.adminSettings.platformEmail}
                        </Label>
                        <Input
                          id="support_email"
                          type="email"
                          value={formData.support_email}
                          onChange={(e) => handleChange("support_email", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="support_phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          {t.adminSettings.platformPhone}
                        </Label>
                        <Input
                          id="support_phone"
                          type="tel"
                          dir="ltr"
                          value={formData.support_phone}
                          onChange={(e) => handleChange("support_phone", e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5" />
                    {isRTL ? "تخصيص التقارير" : "Report Customization"}
                  </CardTitle>
                  <CardDescription>
                    {isRTL ? "تخصيص مظهر التقارير المصدرة" : "Customize the appearance of exported reports"}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    {/* Logo Upload */}
                    <div className="grid gap-3">
                      <Label className="flex items-center gap-2">
                        <Image className="h-4 w-4" />
                        {isRTL ? "شعار التقارير" : "Report Logo"}
                      </Label>
                      <div className="flex items-center gap-4">
                        {formData.report_logo_url ? (
                          <div className="relative">
                            <img
                              src={formData.report_logo_url}
                              alt="Report Logo"
                              className="h-16 w-auto max-w-[200px] object-contain rounded-lg border border-border"
                            />
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              className="absolute -top-2 -right-2 h-6 w-6 p-0 rounded-full"
                              onClick={() => setFormData((prev) => ({ ...prev, report_logo_url: "" }))}
                            >
                              ×
                            </Button>
                          </div>
                        ) : (
                          <div className="h-16 w-32 border-2 border-dashed border-border rounded-lg flex items-center justify-center text-muted-foreground">
                            <Image className="h-6 w-6" />
                          </div>
                        )}
                        <div>
                          <input
                            type="file"
                            accept="image/*"
                            id="logo-upload"
                            className="hidden"
                            onChange={handleLogoUpload}
                            disabled={uploadingLogo}
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => document.getElementById("logo-upload")?.click()}
                            disabled={uploadingLogo}
                          >
                            <Upload className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                            {uploadingLogo
                              ? isRTL ? "جاري الرفع..." : "Uploading..."
                              : isRTL ? "رفع شعار" : "Upload Logo"}
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            {isRTL ? "PNG أو JPG، بحد أقصى 2 ميغابايت" : "PNG or JPG, max 2MB"}
                          </p>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Colors */}
                    <div className="grid gap-4">
                      <Label className="flex items-center gap-2">
                        <Palette className="h-4 w-4" />
                        {isRTL ? "ألوان التقارير" : "Report Colors"}
                      </Label>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <Label htmlFor="report_primary_color" className="text-sm text-muted-foreground">
                            {isRTL ? "اللون الرئيسي" : "Primary Color"}
                          </Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              id="report_primary_color"
                              value={formData.report_primary_color}
                              onChange={(e) => handleChange("report_primary_color", e.target.value)}
                              className="h-10 w-14 rounded-md border border-input cursor-pointer"
                            />
                            <Input
                              value={formData.report_primary_color}
                              onChange={(e) => handleChange("report_primary_color", e.target.value)}
                              className="max-w-[120px] font-mono text-sm"
                              dir="ltr"
                            />
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <Label htmlFor="report_secondary_color" className="text-sm text-muted-foreground">
                            {isRTL ? "اللون الثانوي" : "Secondary Color"}
                          </Label>
                          <div className="flex items-center gap-3">
                            <input
                              type="color"
                              id="report_secondary_color"
                              value={formData.report_secondary_color}
                              onChange={(e) => handleChange("report_secondary_color", e.target.value)}
                              className="h-10 w-14 rounded-md border border-input cursor-pointer"
                            />
                            <Input
                              value={formData.report_secondary_color}
                              onChange={(e) => handleChange("report_secondary_color", e.target.value)}
                              className="max-w-[120px] font-mono text-sm"
                              dir="ltr"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <Separator />

                    {/* Company Info */}
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="report_company_name">
                          {isRTL ? "اسم الشركة في التقرير" : "Company Name in Report"}
                        </Label>
                        <Input
                          id="report_company_name"
                          value={formData.report_company_name}
                          onChange={(e) => handleChange("report_company_name", e.target.value)}
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="report_footer_text">
                          {isRTL ? "نص التذييل" : "Footer Text"}
                        </Label>
                        <Input
                          id="report_footer_text"
                          value={formData.report_footer_text}
                          onChange={(e) => handleChange("report_footer_text", e.target.value)}
                        />
                      </div>
                    </div>

                    {/* Preview */}
                    <div className="mt-4 p-4 rounded-lg border border-border bg-muted/30">
                      <p className="text-sm font-medium mb-3">{isRTL ? "معاينة رأس التقرير" : "Report Header Preview"}</p>
                      <div
                        className="rounded-lg overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, ${formData.report_primary_color} 0%, ${formData.report_secondary_color} 100%)`,
                        }}
                      >
                        <div className="p-4 flex items-center justify-between text-white">
                          <div className="flex items-center gap-3">
                            {formData.report_logo_url ? (
                              <img
                                src={formData.report_logo_url}
                                alt="Logo"
                                className="h-8 w-auto max-w-[100px] object-contain"
                              />
                            ) : null}
                            <span className="font-bold">{formData.report_company_name}</span>
                          </div>
                          <span className="text-xs opacity-80">{new Date().toLocaleDateString("ar-QA")}</span>
                        </div>
                      </div>
                      <div className="mt-2 p-2 bg-muted rounded text-center text-xs text-muted-foreground">
                        {formData.report_footer_text}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

               {/* Report Templates */}
               <ReportTemplatesManager />
 
              <div className="flex justify-end">
                <Button type="submit" size="lg" disabled={updateSettings.isPending}>
                  {updateSettings.isPending ? t.adminSettings.saving : t.adminSettings.saveSettings}
                </Button>
              </div>
            </form>
          )}
        </div>
      </main>
    </div>
  );
};

export default AdminSettings;
