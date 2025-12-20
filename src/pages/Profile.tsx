import BottomNavigation from "@/components/BottomNavigation";
import { Settings, Heart, CreditCard, Bell, HelpCircle, LogOut, ChevronRight, User, Briefcase } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useProfileStats } from "@/hooks/useProfile";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

import artist3 from "@/assets/artist-3.jpg";

const menuItems = [
  { icon: Heart, label: "Favorites", href: "#" },
  { icon: CreditCard, label: "Payment Methods", href: "#" },
  { icon: Bell, label: "Notifications", href: "#" },
  { icon: Settings, label: "Settings", href: "#" },
  { icon: HelpCircle, label: "Help & Support", href: "#" },
];

const Profile = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading, signOut } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: stats, isLoading: statsLoading } = useProfileStats();
  const { data: artist } = useCurrentArtist();

  const handleSignOut = async () => {
    await signOut();
    toast.success("Signed out successfully");
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
          <h1 className="text-xl font-bold text-foreground mb-6">Profile</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <User className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to view profile</h2>
          <p className="text-muted-foreground mb-6">Create an account or sign in to manage your profile</p>
          <Link to="/">
            <Button>Sign In</Button>
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
          <h1 className="text-xl font-bold text-foreground">Profile</h1>
          <button className="p-2 rounded-full hover:bg-card transition-colors">
            <Settings className="w-5 h-5 text-foreground" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <img
            src={profile?.avatar_url || artist3}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-4 border-card shadow-lg"
          />
          <div>
            <h2 className="text-xl font-bold text-foreground">
              {profile?.full_name || "User"}
            </h2>
            <p className="text-muted-foreground">{profile?.email || user.email}</p>
            <Button variant="outline" size="sm" className="mt-2">
              Edit Profile
            </Button>
          </div>
        </div>
      </header>

      {/* Stats */}
      <div className="px-5 -mt-6">
        <div className="bg-card rounded-2xl border border-border p-4 shadow-md">
          <div className="grid grid-cols-3 divide-x divide-border">
            <div className="text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.bookings || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Bookings</p>
            </div>
            <div className="text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.reviews || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Reviews</p>
            </div>
            <div className="text-center">
              {statsLoading ? (
                <Skeleton className="h-8 w-8 mx-auto mb-1" />
              ) : (
                <p className="text-2xl font-bold text-foreground">{stats?.favorites || 0}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">Favorites</p>
            </div>
          </div>
        </div>
      </div>

      {/* Artist Dashboard Link */}
      {artist && (
        <div className="px-5 pb-2">
          <Link to="/artist-dashboard">
            <button className="w-full flex items-center gap-3 p-4 bg-primary/10 rounded-2xl hover:bg-primary/20 transition-colors">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 text-left font-medium text-primary">Artist Dashboard</span>
              <ChevronRight className="w-5 h-5 text-primary" />
            </button>
          </Link>
        </div>
      )}

      {/* Menu */}
      <div className="px-5 py-6">
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {menuItems.map((item, index) => (
            <button
              key={item.label}
              className={`w-full flex items-center gap-3 p-4 hover:bg-muted/50 transition-colors ${
                index !== menuItems.length - 1 ? "border-b border-border" : ""
              }`}
            >
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <item.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="flex-1 text-left font-medium text-foreground">{item.label}</span>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
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
          <span className="flex-1 text-left font-medium text-destructive">Log Out</span>
        </button>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Profile;
