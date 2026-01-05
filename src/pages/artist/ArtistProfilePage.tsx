import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Briefcase, LogOut } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import { useArtistReviews } from "@/hooks/useReviews";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { ProfileSummary } from "@/components/artist/ProfileSummary";
import { cn } from "@/lib/utils";

const ArtistProfilePage = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: reviews = [], isLoading: reviewsLoading } = useArtistReviews(artist?.id);
  const { t, isRTL, language } = useLanguage();

  const [availabilityToggling, setAvailabilityToggling] = useState(false);

  const isAvailable = artist?.is_available ?? true;

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <div className="space-y-2">
            {[1, 2, 3, 4, 5, 6].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl" />)}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.artistProfile.title}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.artistProfile.notAnArtist}</h2>
          <p className="text-muted-foreground mb-6">{t.artistProfile.noArtistProfile}</p>
          <button
            onClick={() => navigate("/home")}
            className="px-6 py-3 bg-primary text-primary-foreground rounded-full font-medium"
          >
            {t.artistProfile.goHome}
          </button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleToggleAvailability = async () => {
    setAvailabilityToggling(true);
    try {
      const { error } = await supabase
        .from("artists")
        .update({ is_available: !isAvailable })
        .eq("id", artist.id);

      if (error) throw error;

      toast.success(
        !isAvailable
          ? (language === "ar" ? "أنت الآن متاح للحجوزات" : "You're now available for bookings")
          : (language === "ar" ? "أنت الآن غير متاح" : "You're now unavailable")
      );
    } catch (error) {
      console.error("Error toggling availability:", error);
      toast.error(language === "ar" ? "فشل التحديث" : "Failed to update availability");
    } finally {
      setAvailabilityToggling(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate("/");
    } catch (error) {
      toast.error("Failed to sign out");
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      <div className="px-4 py-4">
        {/* Profile Summary */}
        <ProfileSummary
          artist={{
            full_name: profile?.full_name || "",
            avatar_url: profile?.avatar_url,
            rating: artist.rating,
            total_reviews: artist.total_reviews,
            location: profile?.location,
            is_available: artist.is_available,
            bio: artist.bio,
            experience_years: artist.experience_years,
            studio_address: artist.studio_address,
          }}
          reviews={reviews}
          language={language}
          isRTL={isRTL}
          onToggleAvailability={handleToggleAvailability}
          onNavigate={navigate}
        />
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistProfilePage;
