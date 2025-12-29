import { useState } from "react";
import { 
  Wallet as WalletIcon, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trophy, 
  Star, 
  Gift, 
  Sparkles,
  Plus,
  History,
  TrendingUp,
  Crown,
  ChevronRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useWallet } from "@/hooks/useWallet";
import { useLoyaltyPoints, TIER_BENEFITS } from "@/hooks/useLoyaltyPoints";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

const QuickAmount = ({ amount, selected, onClick, disabled }: { 
  amount: number; 
  selected: boolean; 
  onClick: () => void;
  disabled?: boolean;
}) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={`
      px-4 py-3 rounded-xl text-center transition-all font-medium
      ${selected 
        ? 'bg-primary text-primary-foreground shadow-lg scale-105' 
        : 'bg-muted hover:bg-muted/80 text-foreground'
      }
      ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
    `}
  >
    {amount} QAR
  </button>
);

const Wallet = () => {
  const { t, isRTL } = useLanguage();
  const { balance, balanceLoading, transactions, transactionsLoading, topUp, isTopUpping } = useWallet();
  const { 
    points, 
    tier, 
    tierBenefits, 
    transactions: loyaltyTransactions, 
    isLoading: loyaltyLoading,
    redeemPoints,
    isRedeeming,
    getNextTierProgress 
  } = useLoyaltyPoints();

  const [showTopUp, setShowTopUp] = useState(false);
  const [topUpAmount, setTopUpAmount] = useState<number>(50);
  const [customAmount, setCustomAmount] = useState("");
  const [selectedRedeemAmount, setSelectedRedeemAmount] = useState<number | null>(null);
  
  const nextTierProgress = getNextTierProgress();
  const quickAmounts = [25, 50, 100, 200];
  const redeemOptions = [100, 500, 1000, 2500];

  const handleTopUp = () => {
    const amount = customAmount ? parseFloat(customAmount) : topUpAmount;
    if (amount > 0) {
      topUp({ amount, description: "Wallet top-up" });
      setShowTopUp(false);
      setCustomAmount("");
    }
  };

  const handleRedeem = () => {
    if (selectedRedeemAmount && selectedRedeemAmount <= points) {
      redeemPoints(selectedRedeemAmount);
      setSelectedRedeemAmount(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title={t.wallet?.title || "Wallet"} showBack />
      
      <div className="px-4 py-4" dir={isRTL ? "rtl" : "ltr"}>
        {/* Main Balance Card */}
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-primary/90 to-primary/70 p-6 mb-6 shadow-xl">
          {/* Decorative elements */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-primary-foreground/10 rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary-foreground/10 rounded-full translate-y-1/2 -translate-x-1/2" />
          
          <div className="relative">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-2xl bg-primary-foreground/20 flex items-center justify-center backdrop-blur-sm">
                <WalletIcon className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <p className="text-primary-foreground/70 text-sm">{t.wallet?.availableBalance || "Available Balance"}</p>
                {balanceLoading ? (
                  <Skeleton className="h-9 w-32 bg-primary-foreground/20" />
                ) : (
                  <h1 className="text-3xl font-bold text-primary-foreground">
                    {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })} <span className="text-lg font-normal">QAR</span>
                  </h1>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button 
                onClick={() => setShowTopUp(true)}
                className="flex-1 bg-primary-foreground text-primary hover:bg-primary-foreground/90 rounded-xl h-12 font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                {t.wallet?.topUp || "Top Up"}
              </Button>
              <Button 
                variant="outline"
                className="flex-1 bg-transparent border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 rounded-xl h-12 font-medium"
                disabled={balance < 10}
              >
                <ArrowDownRight className="w-5 h-5 mr-2" />
                {t.wallet?.withdraw || "Withdraw"}
              </Button>
            </div>
          </div>
        </div>

        {/* Loyalty Points Quick View */}
        <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-2xl p-4 mb-6 border border-amber-500/20">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
                <Crown className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{points.toLocaleString()}</span>
                  <span className="text-sm text-muted-foreground">{t.wallet?.points || "points"}</span>
                </div>
                <Badge variant="secondary" className={`text-xs ${tierBenefits.bgColor} ${tierBenefits.color}`}>
                  {tierBenefits.name} {t.wallet?.member || "Member"}
                </Badge>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-muted-foreground" />
          </div>
          
          {nextTierProgress.nextTier && (
            <div className="mt-3">
              <Progress value={nextTierProgress.progress} className="h-1.5" />
              <p className="text-xs text-muted-foreground mt-1">
                {nextTierProgress.pointsNeeded.toLocaleString()} {t.wallet?.pointsToNextTier || "points to"} {TIER_BENEFITS[nextTierProgress.nextTier as keyof typeof TIER_BENEFITS].name}
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <Tabs defaultValue="transactions" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-4 bg-muted/50 p-1 rounded-xl">
            <TabsTrigger value="transactions" className="rounded-lg gap-2 data-[state=active]:bg-background">
              <History className="w-4 h-4" />
              {t.wallet?.transactions || "History"}
            </TabsTrigger>
            <TabsTrigger value="rewards" className="rounded-lg gap-2 data-[state=active]:bg-background">
              <Gift className="w-4 h-4" />
              {t.wallet?.rewards || "Rewards"}
            </TabsTrigger>
          </TabsList>

          {/* Transactions Tab */}
          <TabsContent value="transactions" className="mt-0">
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">{t.wallet?.recentTransactions || "Recent Transactions"}</h3>
              </div>
              
              {transactionsLoading ? (
                <div className="p-4 space-y-3">
                  {[1, 2, 3].map((i) => (
                    <div key={i} className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-full" />
                      <div className="flex-1">
                        <Skeleton className="h-4 w-24 mb-1" />
                        <Skeleton className="h-3 w-16" />
                      </div>
                      <Skeleton className="h-5 w-16" />
                    </div>
                  ))}
                </div>
              ) : transactions.length > 0 ? (
                <div className="divide-y divide-border">
                  {transactions.slice(0, 10).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-4">
                      <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                        tx.amount > 0 
                          ? 'bg-green-500/10 text-green-600' 
                          : 'bg-red-500/10 text-red-600'
                      }`}>
                        {tx.amount > 0 ? (
                          <ArrowDownRight className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">
                          {tx.description || (tx.type === 'topup' ? 'Top Up' : tx.type)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, yyyy • h:mm a')}
                        </p>
                      </div>
                      <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {tx.amount > 0 ? '+' : ''}{tx.amount.toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="w-16 h-16 rounded-full bg-muted mx-auto mb-4 flex items-center justify-center">
                    <History className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <p className="text-muted-foreground">
                    {t.wallet?.noTransactions || "No transactions yet"}
                  </p>
                  <Button 
                    variant="outline" 
                    className="mt-4"
                    onClick={() => setShowTopUp(true)}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    {t.wallet?.addFunds || "Add Funds"}
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Rewards Tab */}
          <TabsContent value="rewards" className="mt-0 space-y-4">
            {/* Redeem Points Card */}
            <div className="bg-card rounded-2xl border border-border p-4">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <Sparkles className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-semibold">{t.wallet?.redeemPoints || "Redeem Points"}</h3>
                  <p className="text-xs text-muted-foreground">100 {t.wallet?.pointsEqual || "points"} = 1 QAR</p>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-2 mb-4">
                {redeemOptions.map((amount) => (
                  <button
                    key={amount}
                    onClick={() => setSelectedRedeemAmount(amount)}
                    disabled={amount > points}
                    className={`
                      py-3 rounded-xl text-center transition-all
                      ${selectedRedeemAmount === amount 
                        ? 'bg-primary text-primary-foreground shadow-lg' 
                        : 'bg-muted hover:bg-muted/80'
                      }
                      ${amount > points ? 'opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="font-bold text-sm">{amount}</div>
                    <div className="text-xs opacity-70">{(amount / 100).toFixed(0)} QAR</div>
                  </button>
                ))}
              </div>

              <Button
                onClick={handleRedeem}
                disabled={!selectedRedeemAmount || isRedeeming}
                className="w-full rounded-xl h-11"
              >
                {isRedeeming ? t.common?.processing || "Processing..." : t.wallet?.redeemNow || "Redeem Now"}
              </Button>
            </div>

            {/* Tier Benefits */}
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-semibold">{t.wallet?.tierBenefits || "Membership Tiers"}</h3>
              </div>
              <div className="divide-y divide-border">
                {(Object.keys(TIER_BENEFITS) as Array<keyof typeof TIER_BENEFITS>).map((tierKey) => {
                  const tierInfo = TIER_BENEFITS[tierKey];
                  const isCurrentTier = tier === tierKey;
                  return (
                    <div
                      key={tierKey}
                      className={`p-4 ${isCurrentTier ? 'bg-primary/5' : ''}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <Trophy className={`w-5 h-5 ${tierInfo.color}`} />
                          <span className="font-medium">{tierInfo.name}</span>
                          {isCurrentTier && (
                            <Badge className="text-xs bg-primary/20 text-primary border-0">
                              {t.wallet?.currentTier || "You"}
                            </Badge>
                          )}
                        </div>
                        <span className="text-sm text-muted-foreground">
                          {tierInfo.minPoints.toLocaleString()}+ pts
                        </span>
                      </div>
                      <div className="flex gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3" />
                          {tierInfo.discountPercent}% off
                        </span>
                        <span className="flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          {tierInfo.pointsMultiplier}x points
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Points History */}
            {loyaltyTransactions.length > 0 && (
              <div className="bg-card rounded-2xl border border-border overflow-hidden">
                <div className="p-4 border-b border-border">
                  <h3 className="font-semibold">{t.wallet?.pointsHistory || "Points History"}</h3>
                </div>
                <div className="divide-y divide-border">
                  {loyaltyTransactions.slice(0, 5).map((tx) => (
                    <div key={tx.id} className="flex items-center gap-3 p-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        tx.points > 0 ? 'bg-green-500/10 text-green-600' : 'bg-amber-500/10 text-amber-600'
                      }`}>
                        <Star className="w-4 h-4" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{tx.description || tx.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {format(new Date(tx.created_at), 'MMM d, yyyy')}
                        </p>
                      </div>
                      <span className={`font-bold text-sm ${tx.points > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                        {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      {/* Top Up Dialog */}
      <Dialog open={showTopUp} onOpenChange={setShowTopUp}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {t.wallet?.topUp || "Top Up Wallet"}
            </DialogTitle>
            <DialogDescription>
              {t.wallet?.selectAmount || "Select an amount or enter a custom value"}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-4 gap-2">
              {quickAmounts.map((amount) => (
                <QuickAmount
                  key={amount}
                  amount={amount}
                  selected={topUpAmount === amount && !customAmount}
                  onClick={() => {
                    setTopUpAmount(amount);
                    setCustomAmount("");
                  }}
                />
              ))}
            </div>

            <div className="relative">
              <Input
                type="number"
                placeholder={t.wallet?.customAmount || "Custom amount"}
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="h-12 text-lg pr-16"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground font-medium">
                QAR
              </span>
            </div>

            <Button 
              onClick={handleTopUp}
              disabled={isTopUpping || (!customAmount && !topUpAmount)}
              className="w-full h-12 text-base"
            >
              {isTopUpping ? (
                t.common?.processing || "Processing..."
              ) : (
                <>
                  {t.wallet?.addFunds || "Add"} {customAmount || topUpAmount} QAR
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default Wallet;