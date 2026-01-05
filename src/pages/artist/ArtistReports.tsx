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
import { TrendingUp, DollarSign, Calendar, Download, Filter, BarChart3, Clock, Users, Star } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatQAR } from "@/lib/locale";
import { format, subDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

type ReportPeriod = "7days" | "30days" | "90days" | "all";
type ReportType = "earnings" | "services" | "clients" | "performance";

const ArtistReports = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  const [period, setPeriod] = useState<ReportPeriod>("30days");
  const [reportType, setReportType] = useState<ReportType>("earnings");
  const [isExporting, setIsExporting] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
        <AppHeader title={t.artistReports.title} style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <BarChart3 className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t.artistReports.signIn}</h2>
          <p className="text-muted-foreground text-center mb-4">{t.artistReports.signInToView}</p>
          <Button onClick={() => navigate("/auth")}>{t.artistReports.signIn}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const { data: earningsData, isLoading: earningsLoading } = useQuery({
    queryKey: ["artist-earnings", user?.id, period],
    queryFn: async () => {
      if (!user?.id) return null;

      let startDate = new Date();
      if (period === "7days") {
        startDate = subDays(startDate, 7);
      } else if (period === "30days") {
        startDate = subDays(startDate, 30);
      } else if (period === "90days") {
        startDate = subDays(startDate, 90);
      }

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("total_price, created_at, status")
        .eq("artist_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalEarnings = bookings?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;
      const completedBookings = bookings?.length || 0;
      const avgRevenue = completedBookings > 0 ? totalEarnings / completedBookings : 0;

      return {
        totalRevenue: totalEarnings,
        totalBookings: completedBookings,
        avgRevenue,
        bookings: bookings || [],
      };
    },
    enabled: !!user?.id,
  });

  const totalRevenue = earningsData?.totalRevenue || 0;
  const totalBookings = earningsData?.totalBookings || 0;
  const avgRevenue = earningsData?.avgRevenue || 0;

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <AppHeader title={t.artistReports.title} style="modern" />

      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <BarChart3 className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              {t.artistReports.title}
            </h2>
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{t.artistReports.last7Days}</SelectItem>
              <SelectItem value="30days">{t.artistReports.last30Days}</SelectItem>
              <SelectItem value="90days">{t.artistReports.last90Days}</SelectItem>
              <SelectItem value="all">{t.artistReports.allTime}</SelectItem>
            </SelectContent>
          </Select>

          <Select value={reportType} onValueChange={(v) => setReportType(v as ReportType)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="earnings">{t.artistReports.earnings}</SelectItem>
              <SelectItem value="services">{t.artistReports.topServices}</SelectItem>
              <SelectItem value="clients">{t.artistReports.customers}</SelectItem>
              <SelectItem value="performance">{t.artistReports.analytics}</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" size="icon" onClick={() => navigate("/artist-services")}>
            <Filter className="w-6 h-6" />
          </Button>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-7 h-7 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.artistReports.totalRevenue}</p>
                  <p className="text-3xl font-bold text-green-600">{formatQAR(totalRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-7 h-7 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.artistReports.totalBookings}</p>
                  <p className="text-3xl font-bold text-blue-600">{totalBookings}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <Star className="w-7 h-7 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.artistReports.averageRevenue}</p>
                  <p className="text-3xl font-bold text-purple-600">{formatQAR(avgRevenue)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-14 h-14 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-7 h-7 text-orange-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground">{t.artistReports.bestDay}</p>
                  <p className="text-3xl font-bold text-orange-600">{t.artistReports.today}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {reportType === "earnings" && (
          <Card className="border-border/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5 text-primary" />
                {t.artistReports.earningsTrend}
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              {earningsLoading ? (
                <div className="space-y-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="h-8 w-8" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-24" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <BarChart3 className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-foreground mb-2">{t.artistReports.noEarningsYet}</h3>
                  <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                    {t.artistReports.completeFirstBooking}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        <div className="flex gap-3 mt-6">
          <Button variant="outline" className="flex-1" onClick={() => navigate("/artist-bookings")}>
            <Calendar className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t.artistReports.viewBookings}
          </Button>
          <Button variant="outline" className="flex-1" onClick={() => navigate("/artist-services")}>
            <Filter className={cn("w-4 h-4", isRTL ? "ml-2" : "mr-2")} />
            {t.artistReports.manageServices}
          </Button>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistReports;
