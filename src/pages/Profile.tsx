import BottomNavigation from "@/components/BottomNavigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Settings, Heart, MessageCircle, HelpCircle, LogOut, ChevronRight, ChevronLeft, User, Briefcase, Shield, Gift, Wallet, Plus, Languages } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useProfileStats } from "@/hooks/useProfile";
import { useWallet } from "@/hooks/useWallet";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import { useUserRole } from "@/hooks/useUserRole";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

import artist3 from "@/assets/artist-3.jpg";

const menuItems = [
  { icon: Heart, labelKey: "favorites" as const, path: "/favorites" },
  { icon: MessageCircle, labelKey: "messages" as const, path: "/messages" },
  { icon: Wallet, labelKey: "wallet" as const, path: "/wallet" },
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

  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-12 px-5">
          <Skeleton className="h-6 w-20 mb-6" />
          <div className="flex items-center gap-4">
            <Skeleton className="w-20 h-20 rounded-full" />
            <div className="space-y-2">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-4 w-40" />
            </div>
          </div>
        </header>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-12 px-5">
          <h1 className="text-xl font-bold text-foreground mb-6">{t.nav.profile}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.profile.signInToView}</h2>
          <p className="text-muted-foreground mb-6">{t.profile.signInDesc}</p>
          <Link to="/">
            <Button>{t.auth.login}</Button>
          </Link>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-12 px-5">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-bold text-foreground">{t.nav.profile}</h1>
          <button 
            onClick={() => navigate("/settings")}
            className="p-2 rounded-full hover:bg-card transition-colors"
          >
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || artist3}
            alt={t.nav.profile}
            className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {profile?.full_name || "User"}
            </h2>
            <p className="text-muted-foreground">{profile?.email || user.email}</p>
            <Button 
              variant="outline" 
              size="sm" 
              className="mt-2"
              onClick={() => navigate("/edit-profile")}
            >
              {t.profile.editProfile}
            </Button>
          </div>
        </div>
      </header>

      {/* Wallet Balance */}
      <div className="px-5 -mt-6 mb-3">
        <div className="bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-4 shadow-md">
          <div className="flex items-center justify-between">
            <button 
              onClick={() => navigate("/wallet")}
              className={`flex items-center gap-3 flex-1 ${isRTL ? "flex-row-reverse" : ""}`}
            >
              <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-primary-foreground" />
              </div>
              <div className={isRTL ? "text-right" : "text-left"}>
                <p className="text-xs text-primary-foreground/80">{t.profile.wallet}</p>
                {balanceLoading ? (
                  <Skeleton className="h-6 w-20 bg-primary-foreground/20" />
                ) : (
                  <p className="text-xl font-bold text-primary-foreground">{balance} QAR</p>
                )}
              </div>
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                navigate("/wallet?action=topup");
              }}
              className="flex items-center gap-1.5 bg-primary-foreground text-primary px-3 py-2 rounded-xl text-sm font-medium hover:bg-primary-foreground/90 transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>{t.wallet?.topUp || "Top Up"}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="px-5">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-md">
          <div className={`grid grid-cols-3 ${isRTL ? "divide-x-reverse" : ""} divide-x divide-border`}>
            <div className="text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.bookings || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t.profile.bookings}</p>
            </div>
            <div className="text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.reviews || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t.profile.reviews}</p>
            </div>
            <div className="text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.favorites || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">{t.profile.favorites}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Admin Dashboard Link */}
      {role === "admin" && (
        <div className="px-5 pb-2">
          <Link to="/admin">
            <button className="w-full flex items-center gap-3 p-4 bg-destructive/10 rounded-2xl hover:bg-destructive/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-destructive" />
              </div>
              <span className={`flex-1 ${isRTL ? "text-right" : "text-left"} font-medium text-destructive`}>{t.profile.adminDashboard}</span>
              <ChevronIcon className="w-5 h-5 text-destructive" />
            </button>
          </Link>
        </div>
      )}

      {/* Artist Dashboard Link */}
      {artist && (
        <div className="px-5 pb-2">
          <Link to="/artist-dashboard">
            <button className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-2xl hover:bg-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <span className={`flex-1 ${isRTL ? "text-right" : "text-left"} font-medium text-primary`}>{t.profile.artistDashboard}</span>
              <ChevronIcon className="w-5 h-5 text-primary" />
            </button>
          </Link>
        </div>
      )}

      {/* Menu */}
      <div className="px-5 py-6">
        {/* Language Switcher */}
        <div className="bg-card rounded-2xl border border-border overflow-hidden mb-4">
          <div className="w-full flex items-center gap-3 p-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <Languages className="w-5 h-5 text-primary" />
            </div>
            <span className={`flex-1 ${isRTL ? "text-right" : "text-left"} font-medium text-foreground`}>{t.profile.language || "Language"}</span>
            <LanguageSwitcher />
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.labelKey}
              onClick={() => navigate(item.path)}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className={`flex-1 ${isRTL ? "text-right" : "text-left"} font-medium text-foreground`}>{t.profile[item.labelKey]}</span>
              <ChevronIcon className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>

        <button 
          onClick={handleSignOut}
          className="w-full flex items-center gap-3 p-4 mt-4 bg-destructive/10 rounded-2xl hover:bg-destructive/20 transition-colors"
        >
          <div className="w-10 h-10 rounded-full bg-destructive/20 flex items-center justify-center">
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className={`flex-1 ${isRTL ? "text-right" : "text-left"} font-medium text-destructive`}>{t.profile.logOut}</span>
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
