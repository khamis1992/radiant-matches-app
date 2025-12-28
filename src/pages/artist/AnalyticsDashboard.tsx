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
import { TrendingUp, DollarSign, Calendar, Filter, ArrowRight, Eye, Star, Clock, Users } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatQAR } from "@/lib/locale";
import { format, subDays } from "date-fns";
import { ar, enUS } from "date-fns/locale";

type ReportPeriod = "7days" | "30days" | "90days" | "all";

const AnalyticsDashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  const [period, setPeriod] = useState<ReportPeriod>("30days");
  const [reportType, setReportType] = useState<"earnings" | "bookings" | "services" | "clients">("earnings");

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title="Analytics" style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign In</h2>
          <p className="text-muted-foreground text-center mb-4">Please sign in to view your analytics</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
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

      const { data, error } = await supabase
        .from("bookings")
        .select("total_price, created_at")
        .eq("artist_id", user.id)
        .eq("status", "completed")
        .gte("created_at", startDate.toISOString())
        .order("created_at", { ascending: false });

      if (error) throw error;

      const totalEarnings = data?.reduce((sum, booking) => sum + (booking.total_price || 0), 0) || 0;

      return {
        total: totalEarnings,
        bookings: data?.length || 0,
        period: period,
      };
    },
    enabled: !!user?.id,
  });

  const totalRevenue = earningsData?.total || 0;
  const totalBookings = earningsData?.bookings || 0;
  const avgRevenue = totalBookings > 0 ? totalRevenue / totalBookings : 0;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title="Analytics" style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <TrendingUp className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">Sign In</h2>
          <p className="text-muted-foreground text-center mb-4">Please sign in to view your analytics</p>
          <Button onClick={() => navigate("/auth")}>Sign In</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title="Analytics" style="modern" />

      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-6 h-6 text-primary" />
            <h2 className="text-2xl font-bold text-foreground">
              Earnings
            </h2>
          </div>

          <Select value={period} onValueChange={(v) => setPeriod(v as ReportPeriod)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">Last 7 Days</SelectItem>
              <SelectItem value="30days">Last 30 Days</SelectItem>
              <SelectItem value="90days">Last 90 Days</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Total Revenue
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    {formatQAR(totalRevenue)}
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20 hover:border-blue-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
              <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Total Bookings
                  </p>
                  <p className="text-3xl font-bold text-blue-600">
                    {totalBookings}
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Star className="w-6 h-6 text-purple-600" />
                </div>
              <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Average Revenue
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    {formatQAR(avgRevenue)}
                  </p>
                </div>
            </div>
            </CardContent>
          </Card>

        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/20 hover:border-orange-500/30 transition-all">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-500/20 to-orange-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-orange-600" />
                </div>
              <div className="flex-1">
                  <p className="text-sm text-muted-foreground">
                    Best Day
                  </p>
                  <p className="text-3xl font-bold text-orange-600">
                    Today
                  </p>
                </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default AnalyticsDashboard;


