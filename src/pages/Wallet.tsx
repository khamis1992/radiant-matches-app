import { useState } from "react";
import { Loader2, Wallet as WalletIcon, ArrowUpRight, RefreshCw, ArrowDownRight, Trophy, Star, Gift, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useWallet } from "@/hooks/useWallet";
import { useLoyaltyPoints, TIER_BENEFITS } from "@/hooks/useLoyaltyPoints";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

const Wallet = () => {
  const { t, isRTL } = useLanguage();
  const { balance, balanceLoading, transactions, transactionsLoading, isTopUpping, isWithdrawing } = useWallet();
  const { 
    points, 
    lifetimePoints, 
    tier, 
    tierBenefits, 
    transactions: loyaltyTransactions, 
    isLoading: loyaltyLoading,
    redeemPoints,
    isRedeeming,
    getNextTierProgress 
  } = useLoyaltyPoints();

  const [selectedRedeemAmount, setSelectedRedeemAmount] = useState<number | null>(null);
  const nextTierProgress = getNextTierProgress();

  const redeemOptions = [100, 500, 1000, 2500];

  const handleRedeem = () => {
    if (selectedRedeemAmount && selectedRedeemAmount <= points) {
      redeemPoints(selectedRedeemAmount);
      setSelectedRedeemAmount(null);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title={t.wallet?.title || "Wallet"} showBack />
      
      <div className="container mx-auto px-4 py-6" dir={isRTL ? "rtl" : "ltr"}>
        <Tabs defaultValue="wallet" className="w-full">
          <TabsList className="grid w-full grid-cols-2 mb-6">
            <TabsTrigger value="wallet" className="gap-2">
              <WalletIcon className="w-4 h-4" />
              {t.wallet?.balance || "Wallet"}
            </TabsTrigger>
            <TabsTrigger value="loyalty" className="gap-2">
              <Trophy className="w-4 h-4" />
              {t.wallet?.loyaltyPoints || "Loyalty"}
            </TabsTrigger>
          </TabsList>

          {/* Wallet Tab */}
          <TabsContent value="wallet" className="space-y-6">
            {/* Balance Card */}
            <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20">
              <CardContent className="p-6 text-center">
                <WalletIcon className="w-12 h-12 mx-auto mb-4 text-primary" />
                
                {balanceLoading ? (
                  <Skeleton className="h-14 w-32 mx-auto" />
                ) : (
                  <>
                    <div className="text-4xl font-bold text-foreground mb-1">
                      QAR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {t.wallet?.availableBalance || "Available Balance"}
                    </div>
                  </>
                )}

                <div className="mt-6 flex gap-3">
                  <Button className="flex-1" disabled={isTopUpping}>
                    <ArrowUpRight className="w-4 h-4 mr-2" />
                    {t.wallet?.topUp || "Top Up"}
                  </Button>
                  <Button
                    variant="outline"
                    className="flex-1"
                    disabled={isWithdrawing || balance < 10}
                  >
                    <ArrowDownRight className="w-4 h-4 mr-2" />
                    {t.wallet?.withdraw || "Withdraw"}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Transactions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.wallet?.transactions || "Transactions"}</CardTitle>
              </CardHeader>
              <CardContent>
                {transactionsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : transactions.length > 0 ? (
                  <div className="space-y-2">
                    {transactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.amount > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
                          }`}>
                            {tx.amount > 0 ? <ArrowDownRight className="w-4 h-4" /> : <ArrowUpRight className="w-4 h-4" />}
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {tx.description || tx.type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {tx.amount > 0 ? '+' : ''}QAR {Math.abs(tx.amount).toFixed(2)}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t.wallet?.noTransactions || "No transactions yet"}
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Points Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            {/* Tier Card */}
            <Card className={`${tierBenefits.bgColor} border-0`}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-full ${tierBenefits.bgColor} flex items-center justify-center`}>
                      <Trophy className={`w-6 h-6 ${tierBenefits.color}`} />
                    </div>
                    <div>
                      <Badge className={`${tierBenefits.bgColor} ${tierBenefits.color} border-0`}>
                        {tierBenefits.name} {t.wallet?.member || "Member"}
                      </Badge>
                      <div className="text-sm text-muted-foreground mt-1">
                        {tierBenefits.discountPercent}% {t.wallet?.discountOnBookings || "discount on bookings"}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Points Display */}
                <div className="text-center py-4">
                  <div className="flex items-center justify-center gap-2 mb-1">
                    <Sparkles className="w-6 h-6 text-primary" />
                    <span className="text-4xl font-bold">{points.toLocaleString()}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    {t.wallet?.availablePoints || "Available Points"}
                  </div>
                </div>

                {/* Progress to next tier */}
                {nextTierProgress.nextTier && (
                  <div className="mt-4 space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>{t.wallet?.progressToNextTier || "Progress to"} {TIER_BENEFITS[nextTierProgress.nextTier as keyof typeof TIER_BENEFITS].name}</span>
                      <span>{Math.round(nextTierProgress.progress)}%</span>
                    </div>
                    <Progress value={nextTierProgress.progress} className="h-2" />
                    <div className="text-xs text-muted-foreground text-center">
                      {nextTierProgress.pointsNeeded.toLocaleString()} {t.wallet?.pointsToNextTier || "points to next tier"}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Redeem Points */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Gift className="w-5 h-5" />
                  {t.wallet?.redeemPoints || "Redeem Points"}
                </CardTitle>
                <CardDescription>
                  100 {t.wallet?.pointsEqual || "points"} = 1 QAR
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  {redeemOptions.map((amount) => (
                    <Button
                      key={amount}
                      variant={selectedRedeemAmount === amount ? "default" : "outline"}
                      onClick={() => setSelectedRedeemAmount(amount)}
                      disabled={amount > points}
                      className="h-16 flex-col"
                    >
                      <span className="font-bold">{amount.toLocaleString()}</span>
                      <span className="text-xs opacity-70">= {(amount / 100).toFixed(0)} QAR</span>
                    </Button>
                  ))}
                </div>
                <Button
                  onClick={handleRedeem}
                  disabled={!selectedRedeemAmount || isRedeeming}
                  className="w-full"
                >
                  {isRedeeming ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      {t.common?.processing || "Processing..."}
                    </>
                  ) : (
                    t.wallet?.redeemNow || "Redeem Now"
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Points History */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.wallet?.pointsHistory || "Points History"}</CardTitle>
              </CardHeader>
              <CardContent>
                {loyaltyLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-12 w-full" />
                    ))}
                  </div>
                ) : loyaltyTransactions.length > 0 ? (
                  <div className="space-y-2">
                    {loyaltyTransactions.slice(0, 10).map((tx) => (
                      <div
                        key={tx.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                            tx.points > 0 ? 'bg-green-100 text-green-600' : 'bg-amber-100 text-amber-600'
                          }`}>
                            <Star className="w-4 h-4" />
                          </div>
                          <div>
                            <div className="font-medium text-sm">
                              {tx.description || tx.type}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {format(new Date(tx.created_at), 'MMM d, yyyy')}
                            </div>
                          </div>
                        </div>
                        <div className={`font-bold ${tx.points > 0 ? 'text-green-600' : 'text-amber-600'}`}>
                          {tx.points > 0 ? '+' : ''}{tx.points.toLocaleString()} pts
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-muted-foreground py-8">
                    {t.wallet?.noPointsHistory || "No points earned yet"}
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Tier Benefits */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">{t.wallet?.tierBenefits || "Tier Benefits"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(Object.keys(TIER_BENEFITS) as Array<keyof typeof TIER_BENEFITS>).map((tierKey) => {
                    const tierInfo = TIER_BENEFITS[tierKey];
                    const isCurrentTier = tier === tierKey;
                    return (
                      <div
                        key={tierKey}
                        className={`p-3 rounded-lg border ${isCurrentTier ? 'border-primary bg-primary/5' : 'border-border'}`}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className={`w-4 h-4 ${tierInfo.color}`} />
                            <span className="font-medium">{tierInfo.name}</span>
                            {isCurrentTier && (
                              <Badge variant="secondary" className="text-xs">
                                {t.wallet?.currentTier || "Current"}
                              </Badge>
                            )}
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {tierInfo.minPoints.toLocaleString()}+ pts
                          </span>
                        </div>
                        <div className="mt-2 text-sm text-muted-foreground">
                          {tierInfo.discountPercent}% discount • {tierInfo.pointsMultiplier}x points
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Wallet;
