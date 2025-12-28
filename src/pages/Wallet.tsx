import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Wallet as WalletIcon, Gift, TrendingUp, Plus, History, ArrowRight, CheckCircle, Calendar, RefreshCw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { formatQAR } from "@/lib/locale";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

const MIN_WITHDRAW_AMOUNT = 50;
const PROCESSING_TIME = 7 * 24 * 60 * 1000;

const Wallet = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  const [withdrawDialogOpen, setWithdrawDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"balance" | "transactions" | "points" | "promos">("balance");
  const [amount, setAmount] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [bankName, setBankName] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title={t.wallet.title} style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <WalletIcon className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t.profile.signInToView}</h2>
          <p className="text-muted-foreground text-center mb-4">{t.profile.signInDesc}</p>
          <Button onClick={() => navigate("/auth")}>{t.auth.login}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleWithdraw = async () => {
    toast.info("Withdrawal feature coming soon!");
    setWithdrawDialogOpen(false);
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader
        title={t.wallet.title}
        style="modern"
      />

      <div className="px-5 py-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <WalletIcon className="w-6 h-6 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.wallet.currentBalance}
                  </p>
                  <p className="text-3xl font-bold text-foreground">
                    0.00 ر.ق
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setWithdrawDialogOpen(true)}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <Gift className="w-6 h-6 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.wallet.loyaltyPoints}
                  </p>
                  <p className="text-3xl font-bold text-purple-600">
                    0
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/30 transition-all">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500/20 to-green-500/10 rounded-2xl flex items-center justify-center flex-shrink-0">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <p className="text-sm text-muted-foreground mb-1">
                    {t.wallet.referrals}
                  </p>
                  <p className="text-3xl font-bold text-green-600">
                    0
                  </p>
                </div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/referrals")}
              >
                <ArrowRight className="w-4 h-4" />
              </Button>
            </CardContent>
          </Card>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 border-b border-border/50">
            <button
              onClick={() => setActiveTab("balance")}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "balance"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.wallet.balance}
            </button>
            <button
              onClick={() => setActiveTab("transactions")}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "transactions"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.wallet.transactions}
            </button>
            <button
              onClick={() => setActiveTab("points")}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "points"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.wallet.points}
            </button>
            <button
              onClick={() => setActiveTab("promos")}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "promos"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.wallet.promos}
            </button>
          </div>
        </div>

        {activeTab === "balance" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {t.wallet.totalBalance}
              </h2>
              <Button
                variant="outline"
                onClick={() => setWithdrawDialogOpen(true)}
              >
                {t.wallet.withdraw}
              </Button>
            </div>

            <Card className="bg-gradient-to-br from-primary/5 to-primary/0 border-primary/10">
              <CardContent className="text-center py-12">
                <WalletIcon className="w-20 h-20 text-muted-foreground/20 mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t.wallet.walletComing}
                </h3>
                <p className="text-muted-foreground mb-4 max-w-md mx-auto">
                  {t.wallet.walletComingDesc}
                </p>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "transactions" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {t.wallet.recentTransactions}
              </h2>
            </div>
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <History className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t.wallet.noTransactions}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {t.wallet.noTransactionsDesc}
                </p>
              </CardContent>
            </Card>
          </>
        )}

        {activeTab === "points" && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {t.wallet.howToEarnPoints}
              </h2>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Gift className="w-12 h-12 bg-gradient-to-br from-purple-500/20 to-purple-500/10 rounded-2xl flex items-center justify-center flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t.wallet.referralReward}
                      </p>
                      <p className="text-4xl font-bold text-purple-600">
                        +50
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.wallet.perReferral}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/20">
                <CardContent className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <Calendar className="w-12 h-12 bg-gradient-to-br from-blue-500/20 to-blue-500/10 rounded-2xl flex items-center justify-center flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-muted-foreground mb-2">
                        {t.wallet.bookingReward}
                      </p>
                      <p className="text-4xl font-bold text-blue-600">
                        +10
                      </p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {t.wallet.perBooking}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "promos" && (
          <>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-foreground">
                {t.wallet.availablePromos}
              </h2>
            </div>
            <Card className="border-border/50">
              <CardContent className="py-12 text-center">
                <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  {t.wallet.noPromos}
                </h3>
                <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
                  {t.wallet.noPromosDesc}
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      <BottomNavigation />

      <Dialog open={withdrawDialogOpen} onOpenChange={setWithdrawDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <WalletIcon className="w-5 h-5 text-primary" />
              {t.wallet.withdrawal}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="amount">
                {t.wallet.withdrawalAmount}
              </Label>
              <Input
                id="amount"
                type="number"
                placeholder={`${MIN_WITHDRAW_AMOUNT} ${formatQAR(MIN_WITHDRAW_AMOUNT)}`}
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min={MIN_WITHDRAW_AMOUNT}
                step="0.01"
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountNumber">
                {t.wallet.accountNumber}
              </Label>
              <Input
                id="accountNumber"
                type="text"
                placeholder={t.wallet.accountNumberPlaceholder}
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="accountName">
                {t.wallet.accountHolderName}
              </Label>
              <Input
                id="accountName"
                type="text"
                placeholder={t.wallet.accountNamePlaceholder}
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="bankName">
                {t.wallet.bankName}
              </Label>
              <Input
                id="bankName"
                type="text"
                placeholder={t.wallet.bankNamePlaceholder}
                value={bankName}
                onChange={(e) => setBankName(e.target.value)}
                disabled={isProcessing}
              />
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setWithdrawDialogOpen(false)}
              disabled={isProcessing}
            >
              {t.common.cancel}
            </Button>
            <Button
              onClick={handleWithdraw}
              disabled={!amount || !accountNumber || isProcessing}
              className="bg-primary hover:bg-primary/90"
            >
              {isProcessing ? t.common.processing : t.wallet.requestWithdrawal}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Wallet;
