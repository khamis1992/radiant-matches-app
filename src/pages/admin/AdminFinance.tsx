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

  const dateLocale = language === "ar" ? ar : enUS;

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex" dir={isRTL ? "rtl" : "ltr"}>
        <AdminSidebar />
        <main className={cn("flex-1 p-8", isRTL ? "mr-64" : "ml-64")}>
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
        return <Badge className="bg-green-500 hover:bg-green-600">{t.adminFinance.statusCompleted}</Badge>;
      case "pending":
        return <Badge variant="secondary">{t.adminFinance.statusPending}</Badge>;
      case "refunded":
        return <Badge variant="destructive">{t.adminFinance.statusRefunded}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case "booking_payment":
        return t.adminFinance.typeBookingPayment;
      case "platform_fee":
        return t.adminFinance.typePlatformFee;
      case "artist_payout":
        return t.adminFinance.typeArtistPayout;
      case "subscription":
        return t.adminFinance.typeSubscription;
      default:
        return type;
    }
  };

  const formatCurrency = (amount: number) => {
    const currency = language === "ar" ? "ر.ق" : "QAR";
    return `${amount.toFixed(2)} ${currency}`;
  };

  const handleExportTransactions = () => {
    if (!transactions?.length) {
      toast.error(t.adminFinance.noTransactionsToExport);
      return;
    }
    exportToCSV(
      transactions,
      [
        { header: t.adminFinance.colDate, accessor: (row) => format(new Date(row.created_at), "yyyy-MM-dd HH:mm") },
        { header: t.adminFinance.colType, accessor: (row) => getTypeLabel(row.type) },
        { header: t.adminFinance.colArtist, accessor: (row) => row.artist?.profiles?.full_name || t.common.unknown },
        { header: t.adminFinance.colAmount, accessor: (row) => row.amount },
        { header: t.adminFinance.colFee, accessor: (row) => row.platform_fee },
        { header: t.adminFinance.colNet, accessor: (row) => row.net_amount },
        { header: t.adminFinance.colStatus, accessor: (row) => row.status },
      ],
      "transactions"
    );
    toast.success(t.adminFinance.exportTransactionsSuccess);
  };

  const handleExportArtistPayouts = () => {
    if (!artistPayouts?.length) {
      toast.error(t.adminFinance.noPayoutsToExport);
      return;
    }
    exportToCSV(
      artistPayouts,
      [
        { header: t.adminFinance.colArtist, accessor: (row) => row.full_name },
        { header: t.adminFinance.colEmail, accessor: (row) => row.email },
        { header: t.adminFinance.colTransactionsCount, accessor: (row) => row.transactions_count },
        { header: t.adminFinance.colTotalFees, accessor: (row) => row.total_fees },
        { header: t.adminFinance.colTotalEarnings, accessor: (row) => row.total_earnings },
      ],
      "artist_payouts"
    );
    toast.success(t.adminFinance.exportPayoutsSuccess);
  };

  const handleExportTransactionsPDF = () => {
    if (!transactions?.length) {
      toast.error(t.adminFinance.noTransactionsToExport);
      return;
    }

    const typeLabelsMap: Record<string, string> = {
      booking_payment: t.adminFinance.typeBookingPayment,
      platform_fee: t.adminFinance.typePlatformFee,
      artist_payout: t.adminFinance.typeArtistPayout,
      subscription: t.adminFinance.typeSubscription,
    };

    exportTransactionsToPDF(transactions, typeLabelsMap);
    toast.success(t.adminFinance.exportPdfSuccess);
  };

  const handleExportPayoutsPDF = () => {
    if (!artistPayouts?.length) {
      toast.error(t.adminFinance.noPayoutsToExport);
      return;
    }
    exportArtistPayoutsToPDF(artistPayouts);
    toast.success(t.adminFinance.exportPdfSuccess);
  };

  const monthLabelFor = (month: string) => {
    const [yearStr, monthStr] = month.split("-");
    const year = Number(yearStr);
    const m = Number(monthStr);
    if (!Number.isFinite(year) || !Number.isFinite(m)) return month;
    const d = new Date(year, m - 1, 1);
    return format(d, "MMM", { locale: dateLocale });
  };

  const chartData =
    stats?.monthlyRevenue.map((item) => ({
      ...item,
      name: monthLabelFor(item.month),
    })) || [];

  const iconSpacing = isRTL ? "ml-2" : "mr-2";
  const thAlign = isRTL ? "text-right" : "text-left";

  return (
    <div className="min-h-screen bg-background flex" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />

      <main className={cn("flex-1 p-8", isRTL ? "mr-64" : "ml-64")}>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-foreground">{t.adminFinance.title}</h1>
          <p className="text-muted-foreground mt-1">{t.adminFinance.subtitle}</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatsCard
            title={t.adminFinance.totalRevenue}
            value={statsLoading ? "..." : formatCurrency(stats?.totalRevenue || 0)}
            icon={<DollarSign className="h-5 w-5" />}
            trend={{ value: 12, isPositive: true }}
          />
          <StatsCard
            title={t.adminFinance.platformFees}
            value={statsLoading ? "..." : formatCurrency(stats?.totalPlatformFees || 0)}
            icon={<TrendingUp className="h-5 w-5" />}
            trend={{ value: 8, isPositive: true }}
          />
          <StatsCard
            title={t.adminFinance.artistPayouts}
            value={statsLoading ? "..." : formatCurrency(stats?.totalArtistPayouts || 0)}
            icon={<Users className="h-5 w-5" />}
          />
          <StatsCard
            title={t.adminFinance.pendingPayouts}
            value={statsLoading ? "..." : formatCurrency(stats?.pendingPayouts || 0)}
            icon={<Clock className="h-5 w-5" />}
            className={stats?.pendingPayouts ? "border-yellow-500/50" : ""}
          />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Chart */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">{t.adminFinance.monthlyRevenue}</h3>
            <div className="h-[300px]">
              {statsLoading ? (
                <Skeleton className="h-full w-full" />
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                    <XAxis dataKey="name" className="text-xs" />
                    <YAxis className="text-xs" />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number) => [formatCurrency(value), t.adminFinance.revenue]}
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
            <h3 className="text-lg font-semibold text-foreground mb-4">{t.adminFinance.revenueVsFees}</h3>
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
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                      formatter={(value: number, name: string) => [
                        formatCurrency(value),
                        name === "revenue" ? t.adminFinance.revenue : t.adminFinance.fees,
                      ]}
                    />
                    <Legend formatter={(value) => (value === "revenue" ? t.adminFinance.revenue : t.adminFinance.fees)} />
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
              <TabsTrigger value="transactions">{t.adminFinance.recentTransactions}</TabsTrigger>
              <TabsTrigger value="artists">{t.adminFinance.artistPayoutsTab}</TabsTrigger>
            </TabsList>
            <div className="flex gap-2 flex-wrap">
              <Button variant="outline" size="sm" onClick={handleExportTransactions}>
                <Download className={cn("h-4 w-4", iconSpacing)} />
                {t.adminFinance.exportTransactionsCsv}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportTransactionsPDF}>
                <FileDown className={cn("h-4 w-4", iconSpacing)} />
                {t.adminFinance.exportTransactionsPdf}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportArtistPayouts}>
                <Download className={cn("h-4 w-4", iconSpacing)} />
                {t.adminFinance.exportPayoutsCsv}
              </Button>
              <Button variant="outline" size="sm" onClick={handleExportPayoutsPDF}>
                <FileDown className={cn("h-4 w-4", iconSpacing)} />
                {t.adminFinance.exportPayoutsPdf}
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
                      <TableHead className={thAlign}>{t.adminFinance.colDate}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colType}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colArtist}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colAmount}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colFee}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colNet}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colStatus}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {transactions.map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell className="text-muted-foreground">
                          {format(new Date(transaction.created_at), "dd MMM yyyy", { locale: dateLocale })}
                        </TableCell>
                        <TableCell>{getTypeLabel(transaction.type)}</TableCell>
                        <TableCell>{transaction.artist?.profiles?.full_name || t.common.unknown}</TableCell>
                        <TableCell className="font-medium">
                          <div className="flex items-center gap-1">
                            <ArrowUpRight className="h-4 w-4 text-green-500" />
                            {formatCurrency(transaction.amount)}
                          </div>
                        </TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(transaction.platform_fee)}</TableCell>
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
                  <p className="text-muted-foreground">{t.adminFinance.noTransactionsYet}</p>
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
                      <TableHead className={thAlign}>{t.adminFinance.colArtist}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colEmail}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colTransactionsCount}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colTotalFees}</TableHead>
                      <TableHead className={thAlign}>{t.adminFinance.colTotalEarnings}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {artistPayouts.map((artist) => (
                      <TableRow key={artist.artist_id}>
                        <TableCell className="font-medium">{artist.full_name}</TableCell>
                        <TableCell className="text-muted-foreground">{artist.email}</TableCell>
                        <TableCell>{artist.transactions_count}</TableCell>
                        <TableCell className="text-muted-foreground">{formatCurrency(artist.total_fees)}</TableCell>
                        <TableCell className="font-medium text-green-600">{formatCurrency(artist.total_earnings)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              ) : (
                <div className="p-12 text-center">
                  <p className="text-muted-foreground">{t.adminFinance.noPayoutsYet}</p>
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

