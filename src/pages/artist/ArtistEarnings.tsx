import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { TrendingUp, TrendingDown, Briefcase, Star, Wallet, Clock, CheckCircle, XCircle, ArrowDownToLine, Package, ShoppingBag, Eye, Check, X, BarChart3, ChevronRight } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist, useArtistBookings, useArtistEarnings, useUpdateBookingStatus } from "@/hooks/useArtistDashboard";
import { useArtistWithdrawals, useCreateWithdrawal } from "@/hooks/useWithdrawals";
import { useArtistProducts } from "@/hooks/useArtistProducts";
import { useLanguage } from "@/contexts/LanguageContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatQAR } from "@/lib/locale";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";

const ArtistEarnings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: bookings } = useArtistBookings();
  const { data: earnings, isLoading: earningsLoading } = useArtistEarnings();
  const { data: withdrawals = [] } = useArtistWithdrawals(artist?.id);
  const { data: products = [], isLoading: productsLoading } = useArtistProducts();
  const createWithdrawal = useCreateWithdrawal();
  const updateBookingStatus = useUpdateBookingStatus();
  const { t, isRTL, language } = useLanguage();

  const { upcoming = [], past = [] } = bookings || {};
  const dateLocale = language === "ar" ? ar : enUS;

  // حالة Dialog السحب
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [earningsDetailsOpen, setEarningsDetailsOpen] = useState(false);
  const [pendingEarningsDetailsOpen, setPendingEarningsDetailsOpen] = useState(false);
  const [upcomingDetailsOpen, setUpcomingDetailsOpen] = useState(false);
  const [withdrawForm, setWithdrawForm] = useState({
    amount: "",
    bank_name: "",
    account_number: "",
    account_holder_name: "",
    notes: "",
  });

  // الرصيد المتاح (مؤقتاً من الأرباح المكتملة)
  const availableBalance = (artist as any)?.available_balance || earnings?.totalEarnings || 0;
  const pendingBalance = (artist as any)?.pending_balance || 0;

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
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
      <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.earnings.title}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.artistProfile.notAnArtist}</h2>
          <p className="text-muted-foreground mb-6">{t.artistProfile.noArtistProfile}</p>
          <Button onClick={() => navigate("/home")}>{t.artistProfile.goHome}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleBookingAction = async (bookingId: string, status: "confirmed" | "cancelled" | "completed") => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status });
      const messages: Record<string, string> = {
        confirmed: language === "ar" ? "تم تأكيد الحجز" : "Booking confirmed",
        cancelled: language === "ar" ? "تم إلغاء الحجز" : "Booking declined",
        completed: language === "ar" ? "تم إكمال الحجز" : "Booking completed",
      };
      toast.success(messages[status]);
    } catch {
      toast.error(language === "ar" ? "فشل تحديث الحالة" : "Failed to update status");
    }
  };

  const handleWithdrawSubmit = async () => {
    const amount = parseFloat(withdrawForm.amount);
    
    if (!amount || amount <= 0) {
      return;
    }
    
    if (amount > availableBalance) {
      return;
    }

    if (!withdrawForm.bank_name || !withdrawForm.account_number || !withdrawForm.account_holder_name) {
      return;
    }

    await createWithdrawal.mutateAsync({
      artist_id: artist.id,
      amount,
      bank_name: withdrawForm.bank_name,
      account_number: withdrawForm.account_number,
      account_holder_name: withdrawForm.account_holder_name,
      notes: withdrawForm.notes,
    });

    setWithdrawDialogOpen(false);
    setWithdrawForm({
      amount: "",
      bank_name: "",
      account_number: "",
      account_holder_name: "",
      notes: "",
    });
  };

  const getStatusBadge = (status: string) => {
    const iconMargin = isRTL ? "ml-1" : "mr-1";
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className={`w-3 h-3 ${iconMargin}`} />{t.earnings.statusPending}</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className={`w-3 h-3 ${iconMargin}`} />{t.earnings.statusApproved}</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className={`w-3 h-3 ${iconMargin}`} />{t.earnings.statusCompleted}</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className={`w-3 h-3 ${iconMargin}`} />{t.earnings.statusRejected}</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      {/* Stats Overview */}
      <div className="px-5 py-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className={`grid grid-cols-3 ${isRTL ? "divide-x-reverse" : ""} divide-x divide-border`}>
            <div 
              className="text-center cursor-pointer hover:bg-muted/10 transition-colors rounded p-1"
              onClick={() => setUpcomingDetailsOpen(true)}
            >
              <div className="flex items-center justify-center gap-1">
                <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
                <Eye className="w-3 h-3 text-muted-foreground opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.earnings.upcoming}</p>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1">
                <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                <p className="text-2xl font-bold text-foreground">{artist.rating || 0}</p>
              </div>
              <p className="text-xs text-muted-foreground mt-1">{t.earnings.rating}</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{artist.total_reviews || 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{t.earnings.reviews}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="px-5 space-y-4">
        {earningsLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-32 w-full rounded-2xl" />
            <Skeleton className="h-48 w-full rounded-2xl" />
          </div>
        ) : (
          <>
            {/* Balance and withdraw button */}
            <div className="bg-gradient-to-br from-primary to-primary/80 rounded-2xl p-5 text-white shadow-lg">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  <span className="font-medium">{t.earnings.availableBalance}</span>
                </div>
                <Button 
                  size="sm" 
                  variant="secondary"
                  onClick={() => setWithdrawDialogOpen(true)}
                  disabled={availableBalance <= 0}
                  className="gap-1"
                >
                  <ArrowDownToLine className="w-4 h-4" />
                  {t.earnings.withdraw}
                </Button>
              </div>
              <p className="text-3xl font-bold">{formatQAR(availableBalance)}</p>
              {pendingBalance > 0 && (
                <p className="text-sm text-white/70 mt-2">
                  <Clock className={`w-3 h-3 inline ${isRTL ? "ml-1" : "mr-1"}`} />
                  {formatQAR(pendingBalance)} {t.earnings.pendingWithdrawal}
                </p>
              )}
            </div>

            {/* Revenue Stats */}
            <div className="grid grid-cols-2 gap-3">
              <div 
                className="bg-card rounded-2xl border border-border p-4 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setEarningsDetailsOpen(true)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t.earnings.totalEarnings}</p>
                  <Eye className="w-4 h-4 text-muted-foreground opacity-50" />
                </div>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatQAR(earnings?.totalEarnings || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {earnings?.completedBookings || 0} {t.earnings.completedBookings}
                </p>
              </div>
              <div 
                className="bg-card rounded-2xl border border-border p-4 shadow-sm cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => setPendingEarningsDetailsOpen(true)}
              >
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">{t.earnings.pendingEarnings}</p>
                  <Eye className="w-4 h-4 text-muted-foreground opacity-50" />
                </div>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatQAR(earnings?.pendingEarnings || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.earnings.confirmedBookings}
                </p>
              </div>
            </div>

            {/* Products Stats */}
            {!productsLoading && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                    <h3 className="font-semibold text-foreground">
                      {isRTL ? "متجر المنتجات" : "Products Store"}
                    </h3>
                  </div>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => navigate("/artist-products")}
                  >
                    <Eye className="w-4 h-4 me-1" />
                    {isRTL ? "عرض" : "View"}
                  </Button>
                </div>
                
                <div className={`grid grid-cols-3 ${isRTL ? "divide-x-reverse" : ""} divide-x divide-border`}>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Package className="w-4 h-4 text-muted-foreground" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">{products.length}</p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "إجمالي المنتجات" : "Total Products"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {products.filter(p => p.is_active).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "نشط" : "Active"}</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center justify-center gap-1 mb-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                    </div>
                    <p className="text-2xl font-bold text-foreground">
                      {products.filter(p => p.is_featured).length}
                    </p>
                    <p className="text-xs text-muted-foreground">{isRTL ? "مميز" : "Featured"}</p>
                  </div>
                </div>

                {products.length > 0 && (
                  <div className="mt-4 pt-4 border-t border-border">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">
                        {isRTL ? "إجمالي قيمة المنتجات" : "Total Products Value"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatQAR(products.reduce((sum, p) => sum + (p.is_active ? p.price_qar : 0), 0))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-muted-foreground">
                        {isRTL ? "متوسط سعر المنتج" : "Average Product Price"}
                      </span>
                      <span className="font-semibold text-foreground">
                        {formatQAR(products.length > 0 ? products.reduce((sum, p) => sum + p.price_qar, 0) / products.length : 0)}
                      </span>
                    </div>
                    {products.some(p => p.product_type === "physical") && (
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-muted-foreground">
                          {isRTL ? "إجمالي المخزون" : "Total Inventory"}
                        </span>
                        <span className="font-semibold text-foreground">
                          {products.filter(p => p.product_type === "physical").reduce((sum, p) => sum + p.inventory_count, 0)} {isRTL ? "قطعة" : "items"}
                        </span>
                      </div>
                    )}
                  </div>
                )}

                {products.length === 0 && (
                  <div className="text-center py-4">
                    <p className="text-sm text-muted-foreground mb-2">
                      {isRTL ? "لم تضف أي منتجات بعد" : "No products added yet"}
                    </p>
                    <Button 
                      size="sm" 
                      onClick={() => navigate("/artist-products")}
                    >
                      {isRTL ? "إضافة منتج" : "Add Product"}
                    </Button>
                  </div>
                )}
              </div>
            )}

            {/* Recent withdrawal requests */}
            {withdrawals.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">{t.earnings.withdrawalRequests}</h3>
                <div className="space-y-3">
                  {withdrawals.slice(0, 3).map((withdrawal) => (
                    <div key={withdrawal.id} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                      <div>
                        <p className="font-medium text-foreground">{formatQAR(withdrawal.amount)}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(withdrawal.created_at), "d MMM yyyy", { locale: dateLocale })}
                        </p>
                      </div>
                      {getStatusBadge(withdrawal.status)}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Monthly Comparison - Clickable to Analytics */}
            <div 
              className="bg-card rounded-2xl border border-border p-4 shadow-sm cursor-pointer hover:shadow-md hover:border-primary/30 transition-all duration-200 active:scale-[0.98]"
              onClick={() => navigate("/artist-analytics")}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === "Enter" && navigate("/artist-analytics")}
            >
              <h3 className="font-semibold text-foreground mb-3">{t.earnings.thisMonth}</h3>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-3xl font-bold text-foreground">
                    {formatQAR(earnings?.thisMonthEarnings || 0)}
                  </p>
                  {earnings && earnings.lastMonthEarnings > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      {earnings.thisMonthEarnings >= earnings.lastMonthEarnings ? (
                        <>
                          <TrendingUp className="w-4 h-4 text-green-500" />
                          <span className="text-sm text-green-500">
                            +{(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(0)}%
                          </span>
                        </>
                      ) : (
                        <>
                          <TrendingDown className="w-4 h-4 text-destructive" />
                          <span className="text-sm text-destructive">
                            {(((earnings.thisMonthEarnings - earnings.lastMonthEarnings) / earnings.lastMonthEarnings) * 100).toFixed(0)}%
                          </span>
                        </>
                      )}
                      <span className="text-sm text-muted-foreground">{t.earnings.vsLastMonth}</span>
                    </div>
                  )}
                </div>
                <div className={isRTL ? "text-left" : "text-right"}>
                  <p className="text-sm text-muted-foreground">{t.earnings.lastMonth}</p>
                  <p className="text-lg font-medium text-muted-foreground">
                    {formatQAR(earnings?.lastMonthEarnings || 0)}
                  </p>
                </div>
              </div>
            </div>

            {/* Analytics Link Button */}
            <button
              onClick={() => navigate("/artist-analytics")}
              className="w-full flex items-center justify-between p-4 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent rounded-2xl border border-primary/20 hover:border-primary/40 hover:shadow-md transition-all duration-200 active:scale-[0.98] group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-primary/20 to-primary/10 rounded-xl flex items-center justify-center">
                  <BarChart3 className="w-5 h-5 text-primary" />
                </div>
                <div className={isRTL ? "text-right" : "text-left"}>
                  <p className="font-semibold text-foreground">{isRTL ? "التقارير والتحليلات" : "Reports & Analytics"}</p>
                  <p className="text-xs text-muted-foreground">{isRTL ? "عرض تفاصيل الأداء" : "View detailed performance"}</p>
                </div>
              </div>
              <ChevronRight className={`w-5 h-5 text-primary group-hover:translate-x-1 transition-transform ${isRTL ? "rotate-180 group-hover:-translate-x-1" : ""}`} />
            </button>

            {/* Earnings Chart */}
            {earnings && earnings.monthlyTrend.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-4">{t.earnings.revenueTrend}</h3>
                <div className="h-48">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={earnings.monthlyTrend}>
                      <defs>
                        <linearGradient id="earningsGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <XAxis 
                        dataKey="month" 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                      />
                      <YAxis 
                        axisLine={false} 
                        tickLine={false}
                        tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                        tickFormatter={(value) => `${value}`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--card))",
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px",
                        }}
                        formatter={(value: number) => [formatQAR(value), t.earnings.title]}
                      />
                      <Area
                        type="monotone"
                        dataKey="earnings"
                        stroke="hsl(var(--primary))"
                        strokeWidth={2}
                        fill="url(#earningsGradient)"
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            )}

            {/* Service Breakdown */}
            {earnings && earnings.serviceBreakdown.length > 0 && (
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <h3 className="font-semibold text-foreground mb-3">{t.earnings.topServices}</h3>
                <div className="space-y-3">
                  {earnings.serviceBreakdown.slice(0, 5).map((service) => (
                    <div key={service.name} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{service.name}</p>
                        <p className="text-sm text-muted-foreground">{service.count} {t.earnings.bookings}</p>
                      </div>
                      <p className="font-semibold text-foreground">{formatQAR(service.earnings)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Empty State */}
            {earnings && earnings.completedBookings === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Briefcase className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>{t.earnings.noEarningsYet}</p>
                <p className="text-sm mt-1">{t.earnings.completeFirstBooking}</p>
              </div>
            )}
          </>
        )}
      </div>

      {/* Withdrawal Request Dialog */}
      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        {/* ... content ... */}
      </Dialog>

      {/* Earnings Details Dialog */}
      <Dialog open={earningsDetailsOpen} onOpenChange={setEarningsDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.earnings.totalEarnings}</DialogTitle>
            <DialogDescription>
              {isRTL ? "تفاصيل الحجوزات المكتملة" : "Completed bookings details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {past.filter(b => b.status === "completed").length > 0 ? (
              <div className="space-y-3">
                {past.filter(b => b.status === "completed").map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{booking.service?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(booking.booking_date), "d MMM yyyy", { locale: dateLocale })}
                        {" • "}
                        {booking.customer?.full_name || (isRTL ? "عميل" : "Customer")}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">{formatQAR(booking.total_price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{t.earnings.noEarningsYet}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Pending Earnings Details Dialog */}
      <Dialog open={pendingEarningsDetailsOpen} onOpenChange={setPendingEarningsDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.earnings.pendingEarnings}</DialogTitle>
            <DialogDescription>
              {isRTL ? "تفاصيل الحجوزات المؤكدة (المعلقة)" : "Pending (confirmed) bookings details"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {[...upcoming, ...past].filter(b => b.status === "confirmed").length > 0 ? (
              <div className="space-y-3">
                {[...upcoming, ...past].filter(b => b.status === "confirmed").map((booking) => (
                  <div key={booking.id} className="flex justify-between items-center p-3 bg-muted/50 rounded-lg">
                    <div>
                      <p className="font-medium text-sm">{booking.service?.name}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(booking.booking_date), "d MMM yyyy", { locale: dateLocale })}
                        {" • "}
                        {booking.customer?.full_name || (isRTL ? "عميل" : "Customer")}
                      </p>
                    </div>
                    <span className="font-semibold text-primary">{formatQAR(booking.total_price)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{isRTL ? "لا توجد أرباح معلقة" : "No pending earnings"}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Upcoming Bookings Details Dialog */}
      <Dialog open={upcomingDetailsOpen} onOpenChange={setUpcomingDetailsOpen}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.earnings.upcoming}</DialogTitle>
            <DialogDescription>
              {isRTL ? "إدارة الحجوزات القادمة" : "Manage upcoming bookings"}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            {upcoming.length > 0 ? (
              <div className="space-y-3">
                {upcoming.map((booking) => (
                  <div key={booking.id} className="p-3 bg-muted/50 rounded-lg border border-border/50">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium text-sm">{booking.service?.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(booking.booking_date), "d MMM yyyy", { locale: dateLocale })}
                          {" • "}
                          {booking.booking_time}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {booking.customer?.full_name || (isRTL ? "عميل" : "Customer")}
                        </p>
                      </div>
                      <Badge variant={booking.status === "confirmed" ? "default" : "secondary"} className={booking.status === "confirmed" ? "bg-green-500 hover:bg-green-600" : "bg-yellow-500 hover:bg-yellow-600"}>
                        {booking.status === "confirmed" 
                          ? (isRTL ? "مؤكد" : "Confirmed")
                          : (isRTL ? "قيد الانتظار" : "Pending")
                        }
                      </Badge>
                    </div>
                    
                    <div className="flex gap-2 mt-3 pt-2 border-t border-border/50">
                      {booking.status === "pending" && (
                        <>
                          <Button 
                            size="sm" 
                            className="flex-1 h-8 bg-green-600 hover:bg-green-700 text-white"
                            onClick={() => handleBookingAction(booking.id, "confirmed")}
                            disabled={updateBookingStatus.isPending}
                          >
                            <Check className="w-3 h-3 mr-1" />
                            {isRTL ? "قبول" : "Accept"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="destructive"
                            className="flex-1 h-8"
                            onClick={() => handleBookingAction(booking.id, "cancelled")}
                            disabled={updateBookingStatus.isPending}
                          >
                            <X className="w-3 h-3 mr-1" />
                            {isRTL ? "رفض" : "Decline"}
                          </Button>
                        </>
                      )}
                      
                      {booking.status === "confirmed" && (
                        <>
                          <Button 
                             size="sm"
                             className="flex-1 h-8 bg-primary hover:bg-primary/90"
                             onClick={() => handleBookingAction(booking.id, "completed")}
                             disabled={updateBookingStatus.isPending}
                          >
                            <CheckCircle className="w-3 h-3 mr-1" />
                            {isRTL ? "إكمال" : "Complete"}
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            className="flex-1 h-8 text-destructive hover:bg-destructive/10 border-destructive/20"
                            onClick={() => handleBookingAction(booking.id, "cancelled")}
                            disabled={updateBookingStatus.isPending}
                          >
                            <X className="w-3 h-3 mr-1" />
                            {isRTL ? "إلغاء" : "Cancel"}
                          </Button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>{isRTL ? "لا توجد حجوزات قادمة" : "No upcoming bookings"}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default ArtistEarnings;
