import BottomNavigation from "@/components/BottomNavigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import {
  Settings, Heart, MessageCircle, HelpCircle, LogOut, ChevronRight, ChevronLeft,
  User, Briefcase, Shield, Gift, Wallet, Plus, Languages, ShoppingBag, Package,
  Calendar, Star, Pencil,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useProfileStats } from "@/hooks/useProfile";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import { useUserRole } from "@/hooks/useUserRole";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import BackButton from "@/components/BackButton";
import { cn } from "@/lib/utils";

import artist3 from "@/assets/artist-3.jpg";

const quickActions = [
  { icon: Heart, labelKey: "favorites" as const, path: "/favorites" },
  { icon: ShoppingBag, labelKey: "cart" as const, path: "/cart" },
  { icon: Package, labelKey: "myOrders" as const, path: "/orders" },
  { icon: MessageCircle, labelKey: "messages" as const, path: "/messages" },
];

const moreItems = [
  { icon: Gift, labelKey: "referrals" as const, path: "/referrals" },
  { icon: Settings, labelKey: "settings" as const, path: "/settings" },
  { icon: HelpCircle, labelKey: "helpSupport" as const, path: "/help" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { balance, balanceLoading } = useWallet();
  const { data: artist } = useCurrentArtist();
  const { role } = useUserRole();
  const { t, isRTL } = useLanguage();

  const ChevronIcon = isRTL ? ChevronLeft : ChevronRight;

  const handleSignOut = async () => {
    await signOut();
    toast.success(t.profile.signedOut);
    navigate("/");
  };

  const statItems = [
    { icon: Calendar, value: stats?.bookings ?? 0, label: t.profile.bookings },
    { icon: Star, value: stats?.reviews ?? 0, label: t.profile.reviews },
    { icon: Heart, value: stats?.favorites ?? 0, label: t.profile.favorites },
  ];

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-glam-porcelain pb-32">
        <div className="rounded-b-[36px] bg-glam-ink px-5 pt-8 pb-20">
          <div className="flex items-center justify-between">
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
            <Skeleton className="h-10 w-10 rounded-full bg-white/10" />
          </div>
          <div className="mt-6 flex flex-col items-center">
            <Skeleton className="h-24 w-24 rounded-full bg-white/10" />
            <Skeleton className="mt-3 h-5 w-32 bg-white/10" />
            <Skeleton className="mt-2 h-3 w-44 bg-white/10" />
          </div>
        </div>
        <div className="mx-5 -mt-8 rounded-3xl border border-glam-border/60 bg-white p-5 shadow-lg">
          <div className="grid grid-cols-3 gap-2">
            {[0, 1, 2].map((i) => (
              <div key={i} className="flex flex-col items-center gap-2">
                <Skeleton className="h-9 w-9 rounded-full" />
                <Skeleton className="h-4 w-8" />
                <Skeleton className="h-3 w-14" />
              </div>
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-glam-porcelain pb-32">
        <div className="flex min-h-[70vh] flex-col items-center justify-center px-8 text-center">
          <img src="/brand/glam-logo-light.png" alt="GLAM" className="h-10 object-contain" />
          <div className="mt-8 grid h-20 w-20 place-items-center rounded-full bg-glam-blush-soft/60">
            <User className="h-9 w-9 text-glam-rose" strokeWidth={1.75} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-glam-ink">{t.profile.signInToView}</h2>
          <p className="mt-2 text-sm text-glam-muted">{t.profile.signInDesc}</p>
          <Link
            to="/"
            className="mt-7 flex h-12 items-center rounded-full bg-glam-ink px-10 text-sm font-bold text-white transition-transform active:scale-95"
          >
            {t.auth.login}
          </Link>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-glam-porcelain pb-32">
      {/* Premium ink hero */}
      <header className="safe-area-top relative overflow-hidden rounded-b-[36px] bg-glam-ink px-5 pb-20 pt-4">
        <div className="pointer-events-none absolute -top-20 -end-16 h-52 w-52 rounded-full bg-glam-rose/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -start-12 h-48 w-48 rounded-full bg-glam-blush/10 blur-3xl" />

        <div className="relative flex items-center justify-between">
          <BackButton variant="overlay" />
          <button
            onClick={() => navigate("/settings")}
            aria-label={t.profile.settings}
            className="grid h-10 w-10 place-items-center rounded-full bg-white/10 text-white backdrop-blur-sm transition-transform active:scale-90"
          >
            <Settings className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>

        <div className="relative mt-4 flex flex-col items-center text-center">
          <div className="relative">
            <img
              src={profile?.avatar_url || artist3}
              alt={t.nav.profile}
              className="h-24 w-24 rounded-full object-cover ring-4 ring-glam-blush/60"
            />
            <button
              onClick={() => navigate("/edit-profile")}
              aria-label={t.profile.editProfile}
              className="absolute -bottom-1 -end-1 grid h-8 w-8 place-items-center rounded-full border-[3px] border-glam-ink bg-glam-rose text-white transition-transform active:scale-90"
            >
              <Pencil className="h-3.5 w-3.5" strokeWidth={2.25} />
            </button>
          </div>
          <h2 className="mt-3.5 text-xl font-bold text-white">{profile?.full_name || "User"}</h2>
          <p className="mt-1 text-xs text-white/55">{profile?.email || user.email}</p>
        </div>
      </header>

      {/* Stats strip (overlapping) */}
      <div className="relative z-10 mx-5 -mt-10 rounded-3xl border border-glam-border/60 bg-white p-4 shadow-lg">
        <div className="grid grid-cols-3">
          {statItems.map((s) => (
            <div key={s.label} className="flex flex-col items-center gap-1.5">
              <span className="grid h-9 w-9 place-items-center rounded-full bg-glam-blush-soft/60">
                <s.icon className="h-4 w-4 text-glam-rose" strokeWidth={2} />
              </span>
              {statsLoading ? (
                <Skeleton className="h-5 w-8" />
              ) : (
                <p className="text-lg font-black leading-none text-glam-ink">{s.value}</p>
              )}
              <p className="text-[11px] font-medium text-glam-muted">{s.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Wallet */}
      <div className="mx-5 mt-3 flex items-center gap-3 rounded-3xl border border-glam-border/60 bg-white p-4 shadow-sm">
        <button onClick={() => navigate("/wallet")} className="flex flex-1 items-center gap-3 text-start">
          <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-glam-blush-soft/60">
            <Wallet className="h-5 w-5 text-glam-rose" strokeWidth={1.75} />
          </span>
          <span>
            <span className="block text-[11px] font-medium text-glam-muted">{t.wallet.balance}</span>
            {balanceLoading ? (
              <Skeleton className="mt-1 h-5 w-20" />
            ) : (
              <span className="block text-lg font-black text-glam-ink">{balance} QAR</span>
            )}
          </span>
        </button>
        <button
          onClick={() => navigate("/wallet?action=topup")}
          aria-label={t.wallet.topUp}
          className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-glam-ink text-white transition-transform active:scale-90"
        >
          <Plus className="h-5 w-5" strokeWidth={2.25} />
        </button>
      </div>

      {/* Quick actions */}
      <div className="mx-5 mt-3 rounded-3xl border border-glam-border/60 bg-white p-4 shadow-sm">
        <div className="grid grid-cols-4 gap-2">
          {quickActions.map((a) => (
            <button key={a.labelKey} onClick={() => navigate(a.path)} className="group flex flex-col items-center gap-2">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-glam-blush-soft/50 transition-all group-active:scale-90 group-active:bg-glam-blush-soft">
                <a.icon className="h-5 w-5 text-glam-rose" strokeWidth={1.75} />
              </span>
              <span className="text-[11px] font-semibold text-glam-ink">{t.profile[a.labelKey]}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Dashboard shortcuts */}
      {(artist || role === "admin") && (
        <div className="mx-5 mt-3 space-y-3">
          {artist && (
            <Link to="/artist-dashboard" className="flex items-center gap-3 rounded-3xl border border-glam-rose/25 bg-glam-blush-soft/40 p-4 transition-transform active:scale-[0.98]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-glam-rose text-white">
                <Briefcase className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-sm font-bold text-glam-ink">{t.profile.artistDashboard}</span>
              <ChevronIcon className="h-5 w-5 text-glam-rose" />
            </Link>
          )}
          {role === "admin" && (
            <Link to="/admin" className="flex items-center gap-3 rounded-3xl border border-glam-ink/15 bg-white p-4 transition-transform active:scale-[0.98]">
              <span className="grid h-11 w-11 place-items-center rounded-full bg-glam-ink text-white">
                <Shield className="h-5 w-5" strokeWidth={1.75} />
              </span>
              <span className="flex-1 text-sm font-bold text-glam-ink">{t.profile.adminDashboard}</span>
              <ChevronIcon className="h-5 w-5 text-glam-muted" />
            </Link>
          )}
        </div>
      )}

      {/* More */}
      <div className="mx-5 mt-3 overflow-hidden rounded-3xl border border-glam-border/60 bg-white shadow-sm">
        {moreItems.map((item, index) => (
          <button
            key={item.labelKey}
            onClick={() => navigate(item.path)}
            className={cn(
              "flex w-full items-center gap-3 p-4 text-start transition-colors hover:bg-glam-surface/60",
              index !== moreItems.length - 1 && "border-b border-glam-border/50"
            )}
          >
            <span className="grid h-10 w-10 place-items-center rounded-full bg-glam-surface">
              <item.icon className="h-[18px] w-[18px] text-glam-ink" strokeWidth={1.75} />
            </span>
            <span className="flex-1 text-sm font-semibold text-glam-ink">{t.profile[item.labelKey]}</span>
            <ChevronIcon className="h-4 w-4 text-glam-muted" />
          </button>
        ))}
        <div className="flex w-full items-center gap-3 border-t border-glam-border/50 p-4">
          <span className="grid h-10 w-10 place-items-center rounded-full bg-glam-surface">
            <Languages className="h-[18px] w-[18px] text-glam-ink" strokeWidth={1.75} />
          </span>
          <span className="flex-1 text-sm font-semibold text-glam-ink">{t.profile.language}</span>
          <LanguageSwitcher />
        </div>
      </div>

      {/* Sign out */}
      <button
        onClick={handleSignOut}
        className="mx-auto mt-6 flex items-center gap-2 rounded-full px-6 py-2.5 text-sm font-semibold text-glam-muted transition-colors hover:text-glam-ink"
      >
        <LogOut className="h-4 w-4" />
        {t.profile.logOut}
      </button>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
