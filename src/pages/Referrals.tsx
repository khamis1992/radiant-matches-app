import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Gift, Users, TrendingUp, Share2, Copy, CheckCircle, Clock, Award, Zap, ChevronRight, Plus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

const REWARD_AMOUNT = 50; // ر.ق لكل إحالة ناجحة
const MIN_WITHDRAW_AMOUNT = 100; // الحد الأدنى للسحب

// إحصائيات الإحالات
const ReferralStats = ({ stats, isLoading }: { stats: any; isLoading: boolean }) => {
  const { t, language } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  if (isLoading) {
    return (
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-gradient-to-br from-card to-card/50 border-border/50">
            <CardContent className="p-4">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
      <Card className="bg-gradient-to-br from-primary/10 to-primary/5 border-primary/20 hover:border-primary/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-5 h-5 text-primary" />
            <p className="text-xs text-muted-foreground">{t.referral.totalReferrals}</p>
          </div>
          <p className="text-2xl font-bold text-primary">
            {stats?.total_referrals || 0}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/20 hover:border-green-500/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle className="w-5 h-5 text-green-500" />
            <p className="text-xs text-muted-foreground">{t.referral.successful_referrals}</p>
          </div>
          <p className="text-2xl font-bold text-green-600">
            {stats?.successful_referrals || 0}
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-yellow-500/10 to-yellow-500/5 border-yellow-500/20 hover:border-yellow-500/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <Gift className="w-5 h-5 text-yellow-500" />
            <p className="text-xs text-muted-foreground">{t.referral.earned}</p>
          </div>
          <p className="text-2xl font-bold text-yellow-600">
            {stats?.total_earned || 0} ر.ق
          </p>
        </CardContent>
      </Card>

      <Card className="bg-gradient-to-br from-purple-500/10 to-purple-500/5 border-purple-500/20 hover:border-purple-500/30 transition-all">
        <CardContent className="p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-5 h-5 text-purple-500" />
            <p className="text-xs text-muted-foreground">{t.referral.conversionRate}</p>
          </div>
          <p className="text-2xl font-bold text-purple-600">
            {stats?.successful_referrals && stats?.total_referrals
              ? `${((stats.successful_referrals / stats.total_referrals) * 100).toFixed(1)}%`
              : "0%"
            }
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

// بطاقة رابط الإحالة
const ReferralLinkCard = ({ referralCode, onCopy }: { referralCode: string; onCopy: () => void }) => {
  const { t, language } = useLanguage();
  const [copied, setCopied] = useState(false);

  const referralUrl = `${window.location.origin}/auth?ref=${referralCode}`;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(referralUrl);
      setCopied(true);
      onCopy();
      
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      toast.error(t.referral.copyFailed);
    }
  };

  return (
    <Card className="mb-6 border-2 border-primary/20 hover:border-primary/40 transition-all">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Share2 className="w-5 h-5 text-primary" />
          {t.referral.yourReferralLink}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-muted/50 rounded-lg p-4 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-mono text-foreground break-all">
                {referralUrl}
              </p>
            </div>
            <Button
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
              variant={copied ? "default" : "outline"}
            >
              {copied ? (
                <>
                  <CheckCircle className="w-4 h-4 mr-2" />
                  {t.common.linkCopied}
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 mr-2" />
                  {t.referral.copy}
                </>
              )}
            </Button>
          </div>
        </div>
        
        <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
          <div className="flex items-start gap-2">
            <Zap className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-foreground mb-1">
                {t.referral.howItWorks}
              </p>
              <p className="text-sm text-muted-foreground">
                {t.referral.howItWorksDesc}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// تاريخ الإحالات
const ReferralHistory = ({ referrals, isLoading }: { referrals: any[]; isLoading: boolean }) => {
  const { t, language, isRTL } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2, 3].map((i) => (
          <Card key={i} className="border-border/50">
            <CardContent className="p-4">
              <Skeleton className="h-5 w-40 mb-2" />
              <Skeleton className="h-4 w-24" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (referrals.length === 0) {
    return (
      <Card className="border-border/50">
        <CardContent className="py-12 text-center">
          <Gift className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-foreground mb-2">
            {t.referral.noReferralsYet}
          </h3>
          <p className="text-sm text-muted-foreground mb-4 max-w-md mx-auto">
            {t.referral.noReferralsYetDesc}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-3">
      {referrals.map((referral) => (
        <Card key={referral.id} className="border-border/50 hover:border-primary/30 transition-all">
          <CardContent className="p-4">
            <div className="flex items-start justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-semibold text-foreground">
                    {referral.referred_profile?.full_name || t.referral.unknownUser}
                  </p>
                  <Badge
                    variant={referral.status === "completed" ? "default" : "secondary"}
                    className={
                      referral.status === "completed"
                        ? "bg-green-500/10 text-green-600 border-green-500/20"
                        : "bg-yellow-500/10 text-yellow-600 border-yellow-500/20"
                    }
                  >
                    {referral.status === "completed" ? t.referral.completed : t.referral.pending}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {referral.created_at
                    ? format(new Date(referral.created_at), "PPP", { locale: dateLocale })
                    : ""
                  }
                </p>
              </div>
              
              {referral.status === "completed" && (
                <div className="flex items-center gap-2">
                  <Award className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      {t.referral.reward}
                    </p>
                    <p className="font-bold text-primary">
                      {referral.reward_amount} ر.ق
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};

const Referrals = () => {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const [activeTab, setActiveTab] = useState<"stats" | "history">("stats");

  // جلب كود الإحالة الخاص بالمستخدم
  const { data: referralCode, isLoading: codeLoading } = useQuery({
    queryKey: ["referral-code", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      const { data, error } = await supabase
        .from("referral_codes")
        .select("code")
        .eq("user_id", user.id)
        .single();

      if (error) {
        // إذا لم يوجد كود، سننشئ واحد
        if (error.code === "PGRST116") {
          return null;
        }
        throw error;
      }

      return data?.code || null;
    },
    enabled: !!user?.id,
  });

  // إنشاء كود إحالة جديد إذا لم يوجد
  const createReferralMutation = useMutation({
    mutationFn: async () => {
      if (!user?.id) throw new Error("User not logged in");

      // توليد كود عشوائي فريد
      const code = Math.random().toString(36).substring(2, 8).toUpperCase();

      const { error } = await supabase.from("referral_codes").insert({
        user_id: user.id,
        code,
        active: true,
      });

      if (error) throw error;
      return code;
    },
    onSuccess: (code) => {
      queryClient.invalidateQueries({ queryKey: ["referral-code", user?.id] });
      toast.success(t.referral.codeCreated);
    },
    onError: () => {
      toast.error(t.referral.codeCreationFailed);
    },
  });

  // جلب إحصائيات الإحالات
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["referral-stats", user?.id],
    queryFn: async () => {
      if (!user?.id) return null;

      // جلب الإحالات الناجحة
      const { data: referrals, error } = await supabase
        .from("referrals")
        .select("*")
        .eq("referrer_id", user.id);

      if (error) throw error;

      const successful = referrals?.filter(r => r.status === "completed") || [];
      
      return {
        total_referrals: referrals?.length || 0,
        successful_referrals: successful.length,
        total_earned: successful.reduce((sum, r) => sum + (r.reward_amount || 0), 0),
        conversion_rate: referrals?.length > 0
          ? (successful.length / referrals.length) * 100
          : 0,
      };
    },
    enabled: !!user?.id,
  });

  // جلب تاريخ الإحالات
  const { data: referrals, isLoading: referralsLoading } = useQuery({
    queryKey: ["referral-history", user?.id],
    queryFn: async () => {
      if (!user?.id) return [];

      const { data, error } = await supabase
        .from("referrals")
        .select(`
          *,
          referred_profile:profiles (
            full_name
          )
        `)
        .eq("referrer_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      return data || [];
    },
    enabled: !!user?.id && activeTab === "history",
  });

  // تأكيد إنشاء كود الإحالة
  const handleCreateReferralCode = () => {
    createReferralMutation.mutate();
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <AppHeader title={t.referral.title} style="modern" />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Gift className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t.profile.signInToView}</h2>
          <p className="text-muted-foreground text-center mb-4">{t.profile.signInDesc}</p>
          <Button onClick={() => navigate("/auth")}>{t.auth.login}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // إنشاء كود تلقائياً إذا لم يوجد
  if (!codeLoading && !referralCode && !createReferralMutation.isPending) {
    handleCreateReferralCode();
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <AppHeader title={t.referral.title} style="modern" />

      <div className="px-5 py-6">
        {/* Stats */}
        <ReferralStats stats={stats} isLoading={statsLoading} />

        {/* Referral Link */}
        {referralCode && (
          <ReferralLinkCard
            referralCode={referralCode}
            onCopy={() => toast.success(t.referral.linkCopied)}
          />
        )}

        {/* Tabs */}
        <div className="mb-6">
          <div className="flex gap-2 border-b border-border/50">
            <button
              onClick={() => setActiveTab("stats")}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "stats"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.referral.stats}
            </button>
            <button
              onClick={() => setActiveTab("history")}
              className={`pb-3 px-4 text-sm font-medium transition-colors ${
                activeTab === "history"
                  ? "text-primary border-b-2 border-primary"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.referral.history}
            </button>
          </div>
        </div>

        {/* Content */}
        {activeTab === "stats" && (
          <div>
            {/* Rewards Info */}
            <Card className="mb-6 bg-gradient-to-br from-primary/5 to-primary/0 border-primary/10">
              <CardContent className="p-6">
                <div className="flex items-start gap-3">
                  <Award className="w-6 h-6 text-primary flex-shrink-0" />
                  <div className="flex-1">
                    <h3 className="font-semibold text-foreground mb-2">
                      {t.referral.rewardsProgram}
                    </h3>
                    <div className="space-y-1 text-sm">
                      <p className="text-muted-foreground">
                        • {t.referral.rewardPerReferral}: {REWARD_AMOUNT} ر.ق
                      </p>
                      <p className="text-muted-foreground">
                        • {t.referral.minWithdraw}: {MIN_WITHDRAW_AMOUNT} ر.ق
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Share Buttons */}
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold text-foreground mb-4">
                  {t.referral.shareAndEarn}
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/makeup-artists")}
                  >
                    <Users className="w-4 h-4 mr-2" />
                    {t.referral.inviteFriends}
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full justify-start"
                    onClick={() => navigate("/messages")}
                  >
                    <Share2 className="w-4 h-4 mr-2" />
                    {t.referral.shareInSocial}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "history" && (
          <ReferralHistory referrals={referrals || []} isLoading={referralsLoading} />
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Referrals;

