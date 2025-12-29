import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navigate } from "react-router-dom";
import { useAdminFinance, useTransactions, useArtistPayouts } from "@/hooks/useAdminFinance";
import { StatsCard } from "@/components/admin/StatsCard";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  Download,
  FileDown,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
  Legend,
} from "recharts";
import { exportToCSV } from "@/lib/csvExport";
import { exportTransactionsToPDF, exportArtistPayoutsToPDF } from "@/lib/pdfExport";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminFinance = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { t, isRTL, language } = useLanguage();
  const { data: stats, isLoading: statsLoading } = useAdminFinance();
  const { data: transactions, isLoading: transactionsLoading } = useTransactions(20);
  const { data: artistPayouts, isLoading: payoutsLoading } = useArtistPayouts();

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex">
        <AdminSidebar />
        <main className="flex-1 mr-64 p-8">
          <Skeleton className="h-8 w-48 mb-8" />
          <div className="grid grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96 w-full" />
        </main>
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed":
        return <Badge className="bg-green-500 hover:bg-green-600">مكتمل</Badge>;
      case "pending":
        return <Badge variant="secondary">قيد الانتظار</Badge>;
      case "refunded":
        return <Badge variant="destructive">مسترد</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "booking_payment":
        return "دفعة حجز";
      case "platform_fee":
        return "عمولة المنصة";
      case "artist_payout":
        return "دفعة للفنان";
      case "subscription":
        return "اشتراك";
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toFixed(2)} ر.ق`;
  };

  const handleExportTransactions = () => {
    if (!transactions?.length) {
      toast.error("لا توجد معاملات للتصدير");
      return;
    }
    exportToCSV(
      transactions,
      [
        { header: "التاريخ", accessor: (t) => format(new Date(t.created_at), "yyyy-MM-dd HH:mm") },
        { header: "النوع", accessor: (t) => getTypeLabel(t.type) },
        { header: "الفنان", accessor: (t) => t.artist?.profiles?.full_name || "غير معروف" },
        { header: "المبلغ", accessor: (t) => t.amount },
        { header: "العمولة", accessor: (t) => t.platform_fee },
        { header: "الصافي", accessor: (t) => t.net_amount },
        { header: "الحالة", accessor: (t) => t.status },
      ],
      "transactions"
    );
    toast.success("تم تصدير المعاملات بنجاح");
  };

  const handleExportArtistPayouts = () => {
    if (!artistPayouts?.length) {
      toast.error("لا توجد مدفوعات للتصدير");
      return;
    }
    exportToCSV(
      artistPayouts,
      [
        { header: "الفنان", accessor: (a) => a.full_name },
        { header: "البريد الإلكتروني", accessor: (a) => a.email },
        { header: "عدد المعاملات", accessor: (a) => a.transactions_count },
        { header: "إجمالي العمولات", accessor: (a) => a.total_fees },
        { header: "إجمالي الأرباح", accessor: (a) => a.total_earnings },
      ],
      "artist_payouts"
    );
    toast.success("تم تصدير مدفوعات الفنانين بنجاح");
  };

  const handleExportTransactionsPDF = () => {
    if (!transactions?.length) {
      toast.error("لا توجد معاملات للتصدير");
      return;
    }
    const typeLabelsMap: Record<string, string> = {
      booking_payment: "دفعة حجز",
      platform_fee: "عمولة المنصة",
      artist_payout: "دفعة للفنان",
      subscription: "اشتراك",
    };
    exportTransactionsToPDF(transactions, typeLabelsMap);
    toast.success("تم تصدير التقرير بصيغة PDF");
  };

  const handleExportPayoutsPDF = () => {
    if (!artistPayouts?.length) {
      toast.error("لا توجد مدفوعات للتصدير");
      return;
    }
    exportArtistPayoutsToPDF(artistPayouts);
    toast.success("تم تصدير التقرير بصيغة PDF");
  };

  const monthNames: { [key: string]: string } = {
    '01': 'يناير', '02': 'فبراير', '03': 'مارس', '04': 'أبريل',
    '05': 'مايو', '06': 'يونيو', '07': 'يوليو', '08': 'أغسطس',
    '09': 'سبتمبر', '10': 'أكتوبر', '11': 'نوفمبر', '12': 'ديسمبر'
  };

  const chartData = stats?.monthlyRevenue.map(item => ({
    ...item,
    name: monthNames[item.month.split('-')[1]] || item.month,
  })) || [];

  return (
    <div className="min-h-screen bg-background flex" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      
      <main className={cn("flex-1 p-8", isRTL ? "mr-64" : "ml-64")}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">الإدارة المالية</h1>
          <p className="text-muted-foreground mt-1">تتبع الإيرادات والعمولات والمدفوعات</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title="إجمالي الإيرادات"
            value={statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title="عمولات المنصة"
            value={statsLoading ? "..." : formatCurrency(stats?.totalPlatformFees || 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title="مدفوعات الفنانين"
            value={statsLoading ? "..." : formatCurrency(stats?.totalArtistPayouts || 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title="مدفوعات معلقة"
            value={statsLoading ? "..." : formatCurrency(stats?.pendingPayouts || 0)}
            icon={<Clock className="h-5 w-5" />}
            className={stats?.pendingPayouts ? "border-yellow-500/50" : ""}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">الإيرادات الشهرية</h3>
            <div className="h-[300px]">
              {statsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number) => [formatCurrency(value), 'الإيرادات']}
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
          </div>

          {/* Commission Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">الإيرادات مقابل العمولات</h3>
            <div className="h-[300px]">
              {statsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData}>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--card))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value), 
                        name === 'revenue' ? 'الإيرادات' : 'العمولات'
                      ]}
                    />
                    <Legend 
                      formatter={(value) => value === 'revenue' ? 'الإيرادات' : 'العمولات'}
                    />
                    <Bar dataKey="revenue" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="fees" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          </div>
        </div>

        {/* Tabs for Transactions and Artist Payouts */}
        <Tabs defaultValue="transactions" className="space-y-4">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="transactions">المعاملات الأخيرة</TabsTrigger>
              <TabsTrigger value="artists">مدفوعات الفنانين</TabsTrigger>
            </TabsList>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                <Download className="h-4 w-4 ml-2" />
                CSV معاملات
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportTransactionsPDF}>
                <FileDown className="h-4 w-4 ml-2" />
                PDF معاملات
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportArtistPayouts}>
                <Download className="h-4 w-4 ml-2" />
                CSV مدفوعات
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPayoutsPDF}>
                <FileDown className="h-4 w-4 ml-2" />
                PDF مدفوعات
              </Button>
            </div>
          </div>

          <TabsContent value="transactions">
            <div className="bg-card rounded-xl border border-border">
              {transactionsLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : transactions && transactions.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">التاريخ</TableHead>
                      <TableHead className="text-right">النوع</TableHead>
                      <TableHead className="text-right">الفنان</TableHead>
                      <TableHead className="text-right">المبلغ</TableHead>
                      <TableHead className="text-right">العمولة</TableHead>
                      <TableHead className="text-right">الصافي</TableHead>
                      <TableHead className="text-right">الحالة</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transaction.created_at), "dd MMM yyyy", { locale: ar })}
                        </TableCell>
                        <TableCell>{getTypeLabel(transaction.type)}</TableCell>
                        <TableCell>
                          {transaction.artist?.profiles?.full_name || "غير معروف"}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                            {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(transaction.platform_fee)}
                        </TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <ArrowDownRight className="h-4 w-4 text-primary" />
                            {formatCurrency(transaction.net_amount)}
                          </div>
                        </TableCell>
                        <TableCell>{getStatusBadge(transaction.status)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">لا توجد معاملات بعد</p>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="artists">
            <div className="bg-card rounded-xl border border-border">
              {payoutsLoading ? (
                <div className="p-8 space-y-4">
                  {[...Array(5)].map((_, i) => (
                    <Skeleton key={i} className="h-16 w-full" />
                  ))}
                </div>
              ) : artistPayouts && artistPayouts.length > 0 ? (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right">الفنان</TableHead>
                      <TableHead className="text-right">البريد الإلكتروني</TableHead>
                      <TableHead className="text-right">عدد المعاملات</TableHead>
                      <TableHead className="text-right">إجمالي العمولات</TableHead>
                      <TableHead className="text-right">إجمالي الأرباح</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artistPayouts.map((artist) => (
                      <TableRow key={artist.artist_id}>
                        <TableCell className="font-medium">{artist.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{artist.email}</TableCell>
                        <TableCell>{artist.transactions_count}</TableCell>
                        <TableCell className="text-muted-foreground">
                          {formatCurrency(artist.total_fees)}
                        </TableCell>
                        <TableCell className="font-medium text-green-600">
                          {formatCurrency(artist.total_earnings)}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">لا توجد مدفوعات للفنانين بعد</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default AdminFinance;
