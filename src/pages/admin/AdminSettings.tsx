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
import { Settings, Percent, Clock, Phone, Mail, Building } from "lucide-react";
import { cn } from "@/lib/utils";

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
  });

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

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />

      <main className={cn("p-8", isRTL ? "mr-64" : "ml-64")}>
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Settings className="h-8 w-8" />
              {t.adminNav.settings}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isRTL ? "إدارة إعدادات المنصة العامة" : "Manage platform settings"}
            </p>
          </div>

          {isLoading ? (
            <div className="space-y-6">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-48 rounded-xl" />
              ))}
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Commission Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Percent className="h-5 w-5" />
                    إعدادات العمولة
                  </CardTitle>
                  <CardDescription>
                    تحديد نسبة عمولة المنصة من كل حجز
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4">
                    <div className="grid gap-2">
                      <Label htmlFor="commission_rate">نسبة العمولة (%)</Label>
                      <Input
                        id="commission_rate"
                        type="number"
                        min="0"
                        max="100"
                        value={formData.commission_rate}
                        onChange={(e) =>
                          handleChange("commission_rate", Number(e.target.value))
                        }
                        className="max-w-xs"
                      />
                      <p className="text-sm text-muted-foreground">
                        النسبة المئوية التي تحصل عليها المنصة من كل حجز
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Booking Settings */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    إعدادات الحجز
                  </CardTitle>
                  <CardDescription>
                    تحديد قواعد الحجز والإلغاء
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6 md:grid-cols-3">
                    <div className="grid gap-2">
                      <Label htmlFor="min_booking_hours">
                        الحد الأدنى للحجز المسبق (ساعات)
                      </Label>
                      <Input
                        id="min_booking_hours"
                        type="number"
                        min="1"
                        value={formData.min_booking_hours}
                        onChange={(e) =>
                          handleChange("min_booking_hours", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="max_booking_days">
                        الحد الأقصى للحجز المسبق (أيام)
                      </Label>
                      <Input
                        id="max_booking_days"
                        type="number"
                        min="1"
                        value={formData.max_booking_days}
                        onChange={(e) =>
                          handleChange("max_booking_days", Number(e.target.value))
                        }
                      />
                    </div>
                    <div className="grid gap-2">
                      <Label htmlFor="cancellation_hours">
                        مهلة الإلغاء المجاني (ساعات)
                      </Label>
                      <Input
                        id="cancellation_hours"
                        type="number"
                        min="0"
                        value={formData.cancellation_hours}
                        onChange={(e) =>
                          handleChange("cancellation_hours", Number(e.target.value))
                        }
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Platform Info */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    معلومات المنصة
                  </CardTitle>
                  <CardDescription>
                    المعلومات الأساسية للمنصة والدعم
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-6">
                    <div className="grid gap-2">
                      <Label htmlFor="platform_name">اسم المنصة</Label>
                      <Input
                        id="platform_name"
                        value={formData.platform_name}
                        onChange={(e) =>
                          handleChange("platform_name", e.target.value)
                        }
                        className="max-w-md"
                      />
                    </div>

                    <Separator />

                    <div className="grid gap-6 md:grid-cols-2">
                      <div className="grid gap-2">
                        <Label htmlFor="support_email" className="flex items-center gap-2">
                          <Mail className="h-4 w-4" />
                          بريد الدعم
                        </Label>
                        <Input
                          id="support_email"
                          type="email"
                          value={formData.support_email}
                          onChange={(e) =>
                            handleChange("support_email", e.target.value)
                          }
                        />
                      </div>
                      <div className="grid gap-2">
                        <Label htmlFor="support_phone" className="flex items-center gap-2">
                          <Phone className="h-4 w-4" />
                          هاتف الدعم
                        </Label>
                        <Input
                          id="support_phone"
                          type="tel"
                          dir="ltr"
                          value={formData.support_phone}
                          onChange={(e) =>
                            handleChange("support_phone", e.target.value)
                          }
                        />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Submit Button */}
              <div className="flex justify-end">
                <Button
                  type="submit"
                  size="lg"
                  disabled={updateSettings.isPending}
                >
                  {updateSettings.isPending ? "جاري الحفظ..." : "حفظ الإعدادات"}
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
