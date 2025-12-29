import { Loader2, Wallet as WalletIcon, ArrowUpRight, Download, RefreshCw, ArrowDownRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useWallet } from "@/hooks/useWallet";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { toast } from "sonner";

const Wallet = () => {
  const { t, isRTL } = useLanguage();
  const { balance, balanceLoading, transactions, transactionsLoading, topUp, withdraw, isTopUpping, isWithdrawing } = useWallet();

  return (
    <div className="container mx-auto px-4 py-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-foreground">{t.wallet.title}</h1>
      </div>

      {/* Balance Card */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-gradient-to-br from-primary/10 to-primary/5">
          <CardContent className="p-6 text-center">
            <WalletIcon className="w-16 h-16 mx-auto mb-4 text-primary" />
            
            {balanceLoading ? (
              <Skeleton className="h-16 w-32 mx-auto" />
            ) : (
              <>
                <div className="text-5xl font-bold text-foreground mb-2">
                  QAR {balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </div>
                <div className="text-sm text-muted-foreground">
                  {t.wallet.availableBalance}
                </div>
              </>
            )}

            <div className="mt-6 flex gap-2">
              <Button
                onClick={() => {/* Open top up dialog */}
                className="flex-1"
                disabled={isTopUpping}
              >
                <ArrowUpRight className="w-4 h-4 mr-2" />
                {t.wallet.topUp}
              </Button>
              <Button
                onClick={() => {/* Open withdraw dialog */}
                variant="outline"
                className="flex-1"
                disabled={isWithdrawing || balance < 10}
              >
                <ArrowDownRight className="w-4 h-4 mr-2" />
                {t.wallet.withdraw}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t.wallet.thisMonth}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Income</span>
                <span className="text-2xl font-bold text-primary">
                  +QAR 1,250.00
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Expenses</span>
                <span className="text-2xl font-bold text-destructive">
                  -QAR 320.50
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Pending Withdrawal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-foreground">
                QAR 500.00
              </div>
              <div className="text-sm text-muted-foreground">
                Status: Under Review
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Transactions */}
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>{t.wallet.transactions}</CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {/* Handle refresh */}
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              {t.common.refresh}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {transactionsLoading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-4 border-b border-border last:border-0"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${
                        tx.type === 'credit' ? 'bg-green-500' : 'bg-red-500'
                      }`} />
                      <span className="text-sm font-medium">
                        {tx.type === 'credit' ? '+' : '-'}
                      </span>
                      <span className="text-sm text-muted-foreground ml-2">
                        {tx.description || t.wallet[tx.type as keyof typeof t.wallet] || tx.type}
                      </span>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-foreground">
                        QAR {Math.abs(tx.amount || 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </div>
                      <div className="text-xs text-muted-foreground">
                        {format(new Date(tx.created_at), 'MMM d, yyyy')}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              {t.wallet.noTransactions}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Wallet;
