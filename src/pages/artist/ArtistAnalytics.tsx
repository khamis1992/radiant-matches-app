import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, DollarSign, Calendar, BarChart3, Star, Users, Clock, Download } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatQAR } from "@/lib/locale";
import { format, subDays, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { ArtistTabBar } from "@/components/artist/ArtistTabBar";

type ReportPeriod = "7days" | "30days" | "90days" | "all";

const ArtistAnalytics = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  const [period, setPeriod] = useState<ReportPeriod>("30days");
  const [activeTab, setActiveTab] = useState("overview");

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
        <AppHeader title={t.artistReports?.title || "Analytics"} style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t.artistReports?.signIn || "Sign In"}</h2>
          <p className="text-muted-foreground text-center mb-4">{t.artistReports?.signInToView || "Please sign in to view analytics"}</p>
          <Button onClick={() => navigate("/auth")}>{t.artistReports?.signIn || "Sign In"}</Button>
        </div>
        <ArtistTabBar />
      </div>
    );
  }

  const getStartDate = () => {
    const now = new Date();
    if (period === "7days") return subDays(now, 7);
    if (period === "30days") return subDays(now, 30);
    if (period === "90days") return subDays(now, 90);
    return new Date(2020, 0, 1); // All time
  };

  // Fetch earnings data
  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["artist-analytics-earnings", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return null;

      const startDate = getStartDate();

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("total_price, created_at, status, service_id")
        .eq("artist_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalEarnings = bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
      const completedBookings = bookings?.length || 0;
      const avgRevenue = completedBookings > 0 ? totalEarnings / completedBookings : 0;

      // Group by day for chart data
      const dailyData: Record<string, number> = {};
      bookings?.forEach((booking) => {
        const day = format(new Date(booking.created_at), "yyyy-MM-dd");
        dailyData[day] = (dailyData[day] || 0) + (booking.total_price || 0);
      });

      return {
        totalRevenue: totalEarnings,
        totalBookings: completedBookings,
        avgRevenue,
        dailyData,
        bookings: bookings || [],
      };
    },
    enabled: !!user?.id,
  });

  // Fetch top services
  const { data: topServices, isLoading: servicesLoading } = useQuery({
    queryKey: ["artist-top-services", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return [];

      const startDate = getStartDate();

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          service_id,
          total_price,
          services:service_id (name, name_ar)
        `)
        .eq("artist_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      // Group by service
      const serviceStats: Record<string, { name: string; nameAr: string; count: number; revenue: number }> = {};
      bookings?.forEach((booking) => {
        const serviceId = booking.service_id;
        if (serviceId) {
          if (!serviceStats[serviceId]) {
            const service = booking.services as { name: string; name_ar: string } | null;
            serviceStats[serviceId] = {
              name: service?.name || "Unknown",
              nameAr: service?.name_ar || service?.name || "غير معروف",
              count: 0,
              revenue: 0,
            };
          }
          serviceStats[serviceId].count++;
          serviceStats[serviceId].revenue += booking.total_price || 0;
        }
      });

      return Object.values(serviceStats).sort((a, b) => b.revenue - a.revenue).slice(0, 5);
    },
    enabled: !!user?.id,
  });

  // Fetch customer stats
  const { data: customerStats, isLoading: customersLoading } = useQuery({
    queryKey: ["artist-customer-stats", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return { total: 0, returning: 0 };

      const startDate = getStartDate();

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("customer_id")
        .eq("artist_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString());

      if (error) throw error;

      const customerCounts: Record<string, number> = {};
      bookings?.forEach((booking) => {
        customerCounts[booking.customer_id] = (customerCounts[booking.customer_id] || 0) + 1;
      });

      const totalCustomers = Object.keys(customerCounts).length;
      const returningCustomers = Object.values(customerCounts).filter((count) => count > 1).length;

      return {
        total: totalCustomers,
        returning: returningCustomers,
      };
    },
    enabled: !!user?.id,
  });

  const totalRevenue = earningsData?.totalRevenue || 0;
  const totalBookings = earningsData?.totalBookings || 0;
  const avgRevenue = earningsData?.avgRevenue || 0;

  const periodLabels: Record<ReportPeriod, string> = {
    "7days": isRTL ? "آخر 7 أيام" : "Last 7 Days",
    "30days": isRTL ? "آخر 30 يوم" : "Last 30 Days",
    "90days": isRTL ? "آخر 90 يوم" : "Last 90 Days",
    "all": isRTL ? "كل الوقت" : "All Time",
  };

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <AppHeader title={isRTL ? "التقارير والتحليلات" : "Reports & Analytics"} style="modern" />

      <div className="px-4 py-4">
        {/* Period Filter */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">
              {isRTL ? "نظرة عامة" : "Overview"}
            </h2>
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{periodLabels["7days"]}</SelectItem>
              <SelectItem value="30days">{periodLabels["30days"]}</SelectItem>
              <SelectItem value="90days">{periodLabels["90days"]}</SelectItem>
              <SelectItem value="all">{periodLabels["all"]}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-2 gap-3 mb-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-xl flex items-center justify-center">
                  <DollarSign className="w-5 h-5 text-green-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي الإيرادات" : "Total Revenue"}</p>
              {earningsLoading ? (
                <Skeleton className="h-7 w-24 mt-1" />
              ) : (
                <p className="text-xl font-bold text-green-600">{formatQAR(totalRevenue)}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-xl flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-blue-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي الحجوزات" : "Total Bookings"}</p>
              {earningsLoading ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-xl font-bold text-blue-600">{totalBookings}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-xl flex items-center justify-center">
                  <Star className="w-5 h-5 text-purple-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{isRTL ? "متوسط الحجز" : "Avg. Booking"}</p>
              {earningsLoading ? (
                <Skeleton className="h-7 w-20 mt-1" />
              ) : (
                <p className="text-xl font-bold text-purple-600">{formatQAR(avgRevenue)}</p>
              )}
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-4">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-10 h-10 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-xl flex items-center justify-center">
                  <Users className="w-5 h-5 text-orange-600" />
                </div>
              </div>
              <p className="text-xs text-muted-foreground">{isRTL ? "العملاء" : "Customers"}</p>
              {customersLoading ? (
                <Skeleton className="h-7 w-16 mt-1" />
              ) : (
                <p className="text-xl font-bold text-orange-600">{customerStats?.total || 0}</p>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3 mb-4">
            <TabsTrigger value="overview">{isRTL ? "نظرة عامة" : "Overview"}</TabsTrigger>
            <TabsTrigger value="services">{isRTL ? "الخدمات" : "Services"}</TabsTrigger>
            <TabsTrigger value="customers">{isRTL ? "العملاء" : "Customers"}</TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <TrendingUp className="w-4 h-4 text-primary" />
                  {isRTL ? "اتجاه الإيرادات" : "Revenue Trend"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {earningsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3, 4].map((i) => (
                      <Skeleton key={i} className="h-8 w-full" />
                    ))}
                  </div>
                ) : totalBookings === 0 ? (
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "لا توجد حجوزات مكتملة بعد" : "No completed bookings yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {Object.entries(earningsData?.dailyData || {})
                      .slice(0, 7)
                      .map(([date, amount]) => (
                        <div key={date} className="flex items-center justify-between py-2 border-b border-border/50 last:border-0">
                          <span className="text-sm text-muted-foreground">
                            {format(new Date(date), "dd MMM", { locale: dateLocale })}
                          </span>
                          <span className="text-sm font-semibold text-foreground">{formatQAR(amount)}</span>
                        </div>
                      ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Services Tab */}
          <TabsContent value="services" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Star className="w-4 h-4 text-primary" />
                  {isRTL ? "أفضل الخدمات" : "Top Services"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {servicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : !topServices?.length ? (
                  <div className="text-center py-8">
                    <Star className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-sm text-muted-foreground">
                      {isRTL ? "لا توجد بيانات خدمات" : "No service data yet"}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {topServices.map((service, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <span className="w-6 h-6 bg-primary/10 text-primary rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </span>
                          <div>
                            <p className="text-sm font-medium">{isRTL ? service.nameAr : service.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {service.count} {isRTL ? "حجز" : "bookings"}
                            </p>
                          </div>
                        </div>
                        <span className="text-sm font-semibold text-green-600">{formatQAR(service.revenue)}</span>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Customers Tab */}
          <TabsContent value="customers" className="space-y-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <Users className="w-4 h-4 text-primary" />
                  {isRTL ? "إحصائيات العملاء" : "Customer Stats"}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customersLoading ? (
                  <div className="space-y-3">
                    {[1, 2].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-blue-500/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-500/20 rounded-full flex items-center justify-center">
                          <Users className="w-5 h-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isRTL ? "إجمالي العملاء" : "Total Customers"}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? "عملاء فريدون" : "Unique customers"}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-blue-600">{customerStats?.total || 0}</span>
                    </div>

                    <div className="flex items-center justify-between p-4 bg-green-500/10 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                          <TrendingUp className="w-5 h-5 text-green-600" />
                        </div>
                        <div>
                          <p className="text-sm font-medium">{isRTL ? "عملاء متكررون" : "Returning Customers"}</p>
                          <p className="text-xs text-muted-foreground">{isRTL ? "أكثر من حجز واحد" : "More than 1 booking"}</p>
                        </div>
                      </div>
                      <span className="text-2xl font-bold text-green-600">{customerStats?.returning || 0}</span>
                    </div>

                    {customerStats && customerStats.total > 0 && (
                      <div className="text-center pt-2">
                        <p className="text-sm text-muted-foreground">
                          {isRTL ? "معدل الاحتفاظ" : "Retention Rate"}:{" "}
                          <span className="font-bold text-primary">
                            {Math.round((customerStats.returning / customerStats.total) * 100)}%
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Quick Actions */}
        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/artist-bookings")}>
            <Calendar className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {isRTL ? "عرض الحجوزات" : "View Bookings"}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/artist-services")}>
            <Star className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {isRTL ? "إدارة الخدمات" : "Manage Services"}
          </Button>
        </div>
      </div>

      <ArtistTabBar />
    </div>
  );
};

export default ArtistAnalytics;
