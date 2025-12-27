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
import { TrendingUp, TrendingDown, Briefcase, Star, Wallet, Clock, CheckCircle, XCircle, ArrowDownToLine } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist, useArtistBookings, useArtistEarnings } from "@/hooks/useArtistDashboard";
import { useArtistWithdrawals, useCreateWithdrawal } from "@/hooks/useWithdrawals";
import { useLanguage } from "@/contexts/LanguageContext";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatQAR } from "@/lib/locale";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const ArtistEarnings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: bookings } = useArtistBookings();
  const { data: earnings, isLoading: earningsLoading } = useArtistEarnings();
  const { data: withdrawals = [] } = useArtistWithdrawals(artist?.id);
  const createWithdrawal = useCreateWithdrawal();
  const { t, isRTL, language } = useLanguage();

  const { upcoming = [] } = bookings || {};
  const dateLocale = language === "ar" ? ar : enUS;

  // حالة Dialog السحب
  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
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
      <div className="min-h-screen bg-background pb-24">
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
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">Earnings</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Not an Artist</h2>
          <p className="text-muted-foreground mb-6">You don't have an artist profile yet</p>
          <Button onClick={() => navigate("/home")}>Go Home</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

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
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      {/* Stats Overview */}
      <div className="px-5 py-4">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
          <div className={`grid grid-cols-3 ${isRTL ? "divide-x-reverse" : ""} divide-x divide-border`}>
            <div className="text-center">
              <p className="text-2xl font-bold text-foreground">{upcoming.length}</p>
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
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{t.earnings.totalEarnings}</p>
                <p className="text-2xl font-bold text-foreground mt-1">
                  {formatQAR(earnings?.totalEarnings || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {earnings?.completedBookings || 0} {t.earnings.completedBookings}
                </p>
              </div>
              <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                <p className="text-sm text-muted-foreground">{t.earnings.pendingEarnings}</p>
                <p className="text-2xl font-bold text-primary mt-1">
                  {formatQAR(earnings?.pendingEarnings || 0)}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  {t.earnings.confirmedBookings}
                </p>
              </div>
            </div>

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

            {/* Monthly Comparison */}
            <div className="bg-card rounded-2xl border border-border p-4 shadow-sm">
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
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ArrowDownToLine className="h-5 w-5" />
              {t.earnings.requestWithdrawal}
            </DialogTitle>
            <DialogDescription>
              {t.earnings.availableBalance}: {formatQAR(availableBalance)}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="amount">{t.earnings.amount}</Label>
              <Input
                id="amount"
                type="number"
                placeholder="0.00"
                value={withdrawForm.amount}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, amount: e.target.value })}
                max={availableBalance}
                dir="ltr"
              />
              <Button 
                type="button" 
                variant="ghost" 
                size="sm"
                onClick={() => setWithdrawForm({ ...withdrawForm, amount: availableBalance.toString() })}
              >
                {t.earnings.withdrawAll}
              </Button>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bank_name">{t.earnings.bankName}</Label>
              <Input
                id="bank_name"
                placeholder={t.earnings.bankNamePlaceholder}
                value={withdrawForm.bank_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, bank_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_number">{t.earnings.accountNumber}</Label>
              <Input
                id="account_number"
                placeholder={t.earnings.accountNumberPlaceholder}
                value={withdrawForm.account_number}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_number: e.target.value })}
                dir="ltr"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="account_holder_name">{t.earnings.accountHolderName}</Label>
              <Input
                id="account_holder_name"
                placeholder={t.earnings.accountHolderPlaceholder}
                value={withdrawForm.account_holder_name}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, account_holder_name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">{t.earnings.notes}</Label>
              <Textarea
                id="notes"
                placeholder={t.earnings.notesPlaceholder}
                value={withdrawForm.notes}
                onChange={(e) => setWithdrawForm({ ...withdrawForm, notes: e.target.value })}
                rows={2}
              />
            </div>

            <Button 
              onClick={handleWithdrawSubmit}
              disabled={createWithdrawal.isPending || !withdrawForm.amount || !withdrawForm.bank_name || !withdrawForm.account_number || !withdrawForm.account_holder_name}
              className="w-full"
            >
              {createWithdrawal.isPending ? t.earnings.submitting : t.earnings.submitWithdrawal}
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              {t.earnings.reviewTime}
            </p>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default ArtistEarnings;
