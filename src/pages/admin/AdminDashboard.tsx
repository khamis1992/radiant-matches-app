import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { StatsCard } from "@/components/admin/StatsCard";
import { useAdminStats, useRecentBookings, useMonthlyRevenue } from "@/hooks/useAdminStats";
import { useTopServices, useTopArtists, DateRange } from "@/hooks/useAdvancedReports";
import { useUserRole } from "@/hooks/useUserRole";
import { Navigate } from "react-router-dom";
import {
  Users,
  Palette,
  Calendar as CalendarIcon,
  DollarSign,
  TrendingUp,
  Clock,
  CheckCircle,
  Star,
  Award,
  Briefcase,
  CalendarDays,
  Download,
  FileText,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { format, subDays, subMonths, startOfMonth, endOfMonth, startOfYear } from "date-fns";
import { ar } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { exportToCSV } from "@/lib/csvExport";
import { exportTopServicesToPDF, exportTopArtistsToPDF } from "@/lib/pdfExport";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  completed: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

const statusLabels: Record<string, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغي",
};

const AdminDashboard = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { data: stats, isLoading: statsLoading } = useAdminStats();
  const { data: recentBookings, isLoading: bookingsLoading } = useRecentBookings(5);
  const { data: monthlyRevenue, isLoading: revenueLoading } = useMonthlyRevenue();

  // Date range state for advanced reports
  const [dateRange, setDateRange] = useState<DateRange>({
    from: undefined,
    to: undefined,
  });
  const [activePreset, setActivePreset] = useState<string>("all");

  const { data: topServices, isLoading: topServicesLoading } = useTopServices(5, dateRange);
  const { data: topArtists, isLoading: topArtistsLoading } = useTopArtists(5, dateRange);

  const handlePresetClick = (preset: string) => {
    setActivePreset(preset);
    const today = new Date();
    
    switch (preset) {
      case "7days":
        setDateRange({ from: subDays(today, 7), to: today });
        break;
      case "30days":
        setDateRange({ from: subDays(today, 30), to: today });
        break;
      case "thisMonth":
        setDateRange({ from: startOfMonth(today), to: endOfMonth(today) });
        break;
      case "lastMonth":
        const lastMonth = subMonths(today, 1);
        setDateRange({ from: startOfMonth(lastMonth), to: endOfMonth(lastMonth) });
        break;
      case "thisYear":
        setDateRange({ from: startOfYear(today), to: today });
        break;
      case "all":
      default:
        setDateRange({ from: undefined, to: undefined });
        break;
    }
  };

  const getDateRangeLabel = () => {
    if (!dateRange.from || !dateRange.to) return "";
    return `${format(dateRange.from, "d MMMM yyyy", { locale: ar })} - ${format(dateRange.to, "d MMMM yyyy", { locale: ar })}`;
  };

  const handleExportServicesCSV = () => {
    if (!topServices?.length) return;
    exportToCSV(
      topServices,
      [
        { header: "#", accessor: (_, i) => (i !== undefined ? i + 1 : "") },
        { header: "الخدمة", accessor: (s) => s.name },
        { header: "الفئة", accessor: (s) => s.category || "-" },
        { header: "الفنانة", accessor: (s) => s.artistName || "غير معروف" },
        { header: "الحجوزات", accessor: (s) => s.bookingsCount },
        { header: "الإيرادات (ر.ق)", accessor: (s) => s.totalRevenue.toFixed(0) },
      ],
      "top_services_report"
    );
  };

  const handleExportServicesPDF = () => {
    if (!topServices?.length) return;
    exportTopServicesToPDF(topServices, getDateRangeLabel());
  };

  const handleExportArtistsCSV = () => {
    if (!topArtists?.length) return;
    exportToCSV(
      topArtists,
      [
        { header: "#", accessor: (_, i) => (i !== undefined ? i + 1 : "") },
        { header: "الفنانة", accessor: (a) => a.name || "غير معروف" },
        { header: "الحجوزات", accessor: (a) => a.totalBookings },
        { header: "المكتملة", accessor: (a) => a.completedBookings },
        { header: "التقييم", accessor: (a) => a.rating?.toFixed(1) || "-" },
        { header: "التقييمات", accessor: (a) => a.totalReviews || 0 },
        { header: "الإيرادات (ر.ق)", accessor: (a) => a.totalRevenue.toFixed(0) },
      ],
      "top_artists_report"
    );
  };

  const handleExportArtistsPDF = () => {
    if (!topArtists?.length) return;
    exportTopArtistsToPDF(topArtists, getDateRangeLabel());
  };

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

  const revenueTrend = stats
    ? stats.lastMonthRevenue > 0
      ? Math.round(((stats.thisMonthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
      : stats.thisMonthRevenue > 0
      ? 100
      : 0
    : 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />

      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-foreground">لوحة التحكم</h1>
            <p className="text-muted-foreground mt-1">
              مرحباً بك في لوحة إدارة المنصة
            </p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statsLoading ? (
              <>
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-32 rounded-xl" />
                ))}
              </>
            ) : (
              <>
                <StatsCard
                  title="إجمالي المستخدمين"
                  value={stats?.totalUsers || 0}
                  icon={<Users className="h-6 w-6" />}
                />
                <StatsCard
                  title="إجمالي الفنانين"
                  value={stats?.totalArtists || 0}
                  icon={<Palette className="h-6 w-6" />}
                />
                <StatsCard
                  title="إجمالي الحجوزات"
                  value={stats?.totalBookings || 0}
                  icon={<CalendarIcon className="h-6 w-6" />}
                />
                <StatsCard
                  title="إيرادات المنصة"
                  value={`${stats?.platformEarnings?.toFixed(0) || 0} ر.ق`}
                  icon={<DollarSign className="h-6 w-6" />}
                  trend={
                    revenueTrend !== 0
                      ? { value: Math.abs(revenueTrend), isPositive: revenueTrend > 0 }
                      : undefined
                  }
                />
              </>
            )}
          </div>

          {/* Secondary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {statsLoading ? (
              <>
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-24 rounded-xl" />
                ))}
              </>
            ) : (
              <>
                <StatsCard
                  title="الحجوزات المعلقة"
                  value={stats?.pendingBookings || 0}
                  icon={<Clock className="h-6 w-6" />}
                />
                <StatsCard
                  title="الحجوزات المكتملة"
                  value={stats?.completedBookings || 0}
                  icon={<CheckCircle className="h-6 w-6" />}
                />
                <StatsCard
                  title="إيرادات هذا الشهر"
                  value={`${stats?.thisMonthRevenue?.toFixed(0) || 0} ر.ق`}
                  icon={<TrendingUp className="h-6 w-6" />}
                />
              </>
            )}
          </div>

          {/* Charts and Tables */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Revenue Chart */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                الإيرادات الشهرية
              </h2>
              {revenueLoading ? (
                <Skeleton className="h-64" />
              ) : (
                <ResponsiveContainer width="100%" height={250}>
                  <AreaChart data={monthlyRevenue}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        background: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [`${value} ر.ق`, "الإيرادات"]}
                    />
                    <Area
                      type="monotone"
                      dataKey="revenue"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorRevenue)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </div>

            {/* Recent Bookings */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h2 className="text-lg font-semibold text-foreground mb-4">
                آخر الحجوزات
              </h2>
              {bookingsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">العميل</TableHead>
                      <TableHead className="text-right">الفنانة</TableHead>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {recentBookings?.map((booking) => (
                      <TableRow key={booking.id}>
                        <TableCell className="font-medium">
                          {booking.customer?.full_name || "غير معروف"}
                        </TableCell>
                        <TableCell>
                          {booking.artist?.full_name || "غير معروف"}
                        </TableCell>
                        <TableCell>
                          {format(new Date(booking.booking_date), "d MMM", {
                            locale: ar,
                          })}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="secondary"
                            className={statusColors[booking.status]}
                          >
                            {statusLabels[booking.status]}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!recentBookings || recentBookings.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center text-muted-foreground">
                          لا توجد حجوزات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>

          {/* Advanced Reports - Top Services & Top Artists */}
          <div className="mt-8">
            {/* Date Range Filter */}
            <div className="bg-card rounded-xl border border-border p-4 mb-6">
              <div className="flex flex-wrap items-center gap-3">
                <div className="flex items-center gap-2">
                  <CalendarDays className="h-5 w-5 text-primary" />
                  <span className="font-medium text-foreground">الفترة الزمنية:</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant={activePreset === "all" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick("all")}
                  >
                    الكل
                  </Button>
                  <Button
                    variant={activePreset === "7days" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick("7days")}
                  >
                    آخر 7 أيام
                  </Button>
                  <Button
                    variant={activePreset === "30days" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick("30days")}
                  >
                    آخر 30 يوم
                  </Button>
                  <Button
                    variant={activePreset === "thisMonth" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick("thisMonth")}
                  >
                    هذا الشهر
                  </Button>
                  <Button
                    variant={activePreset === "lastMonth" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick("lastMonth")}
                  >
                    الشهر الماضي
                  </Button>
                  <Button
                    variant={activePreset === "thisYear" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetClick("thisYear")}
                  >
                    هذه السنة
                  </Button>
                </div>

                {/* Custom Date Picker */}
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant={activePreset === "custom" ? "default" : "outline"}
                      size="sm"
                      className="gap-2"
                    >
                      <CalendarIcon className="h-4 w-4" />
                      {dateRange.from && dateRange.to && activePreset === "custom"
                        ? `${format(dateRange.from, "d MMM", { locale: ar })} - ${format(dateRange.to, "d MMM", { locale: ar })}`
                        : "فترة مخصصة"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="range"
                      selected={{ from: dateRange.from, to: dateRange.to }}
                      onSelect={(range) => {
                        setDateRange({ from: range?.from, to: range?.to });
                        if (range?.from && range?.to) {
                          setActivePreset("custom");
                        }
                      }}
                      numberOfMonths={2}
                      className={cn("p-3 pointer-events-auto")}
                    />
                  </PopoverContent>
                </Popover>

                {/* Show selected range */}
                {dateRange.from && dateRange.to && (
                  <Badge variant="secondary" className="text-sm">
                    {format(dateRange.from, "d MMMM yyyy", { locale: ar })} - {format(dateRange.to, "d MMMM yyyy", { locale: ar })}
                  </Badge>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Top Services */}
              <div className="bg-card rounded-xl border border-border p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-primary" />
                    <h2 className="text-lg font-semibold text-foreground">
                      أكثر الخدمات طلبًا
                    </h2>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportServicesCSV}
                      disabled={!topServices?.length}
                      className="gap-1"
                    >
                      <Download className="h-4 w-4" />
                      CSV
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleExportServicesPDF}
                      disabled={!topServices?.length}
                      className="gap-1"
                    >
                      <FileText className="h-4 w-4" />
                      PDF
                    </Button>
                  </div>
                </div>
                {topServicesLoading ? (
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <Skeleton key={i} className="h-12" />
                    ))}
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="text-right">#</TableHead>
                        <TableHead className="text-right">الخدمة</TableHead>
                        <TableHead className="text-right">الفنانة</TableHead>
                        <TableHead className="text-right">الحجوزات</TableHead>
                        <TableHead className="text-right">الإيرادات</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {topServices?.map((service, index) => (
                        <TableRow key={service.id}>
                          <TableCell className="font-bold text-primary">
                            {index + 1}
                          </TableCell>
                          <TableCell>
                            <div>
                              <p className="font-medium">{service.name}</p>
                              {service.category && (
                                <Badge variant="secondary" className="text-xs mt-1">
                                  {service.category}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>{service.artistName || "غير معروف"}</TableCell>
                          <TableCell className="font-medium">
                            {service.bookingsCount}
                          </TableCell>
                          <TableCell className="text-green-600 font-medium">
                            {service.totalRevenue.toFixed(0)} ر.ق
                          </TableCell>
                        </TableRow>
                      ))}
                      {(!topServices || topServices.length === 0) && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground">
                            لا توجد بيانات
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                )}
              </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-semibold text-foreground">
                    أفضل الفنانات أداءً
                  </h2>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportArtistsCSV}
                    disabled={!topArtists?.length}
                    className="gap-1"
                  >
                    <Download className="h-4 w-4" />
                    CSV
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleExportArtistsPDF}
                    disabled={!topArtists?.length}
                    className="gap-1"
                  >
                    <FileText className="h-4 w-4" />
                    PDF
                  </Button>
                </div>
              </div>
              {topArtistsLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-12" />
                  ))}
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">#</TableHead>
                      <TableHead className="text-right">الفنانة</TableHead>
                      <TableHead className="text-right">الحجوزات</TableHead>
                      <TableHead className="text-right">التقييم</TableHead>
                      <TableHead className="text-right">الإيرادات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topArtists?.map((artist, index) => (
                      <TableRow key={artist.id}>
                        <TableCell className="font-bold text-primary">
                          {index + 1}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Avatar className="h-8 w-8">
                              <AvatarImage src={artist.avatarUrl || ""} />
                              <AvatarFallback>
                                {artist.name?.charAt(0) || "؟"}
                              </AvatarFallback>
                            </Avatar>
                            <span className="font-medium">{artist.name || "غير معروف"}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className="font-medium">{artist.completedBookings}</span>
                          <span className="text-muted-foreground text-sm"> / {artist.totalBookings}</span>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                            <span>{artist.rating?.toFixed(1) || "—"}</span>
                            {artist.totalReviews !== null && (
                              <span className="text-muted-foreground text-xs">
                                ({artist.totalReviews})
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-green-600 font-medium">
                          {artist.totalRevenue.toFixed(0)} ر.ق
                        </TableCell>
                      </TableRow>
                    ))}
                    {(!topArtists || topArtists.length === 0) && (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          لا توجد بيانات
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </div>
          </div>
        </div>
        </div>
      </main>
    </div>
  );
};

export default AdminDashboard;
