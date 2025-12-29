import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, X, ArrowRight, Calendar } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import artist1 from "@/assets/artist-1.jpg";
import { Separator } from "@/components/ui/separator";

interface ArtistWithProfile {
  id: string;
  bio: string | null;
  rating: number | null;
  total_reviews: number | null;
  experience_years: number | null;
  is_available: boolean | null;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
  } | null;
}

const CompareArtists = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, isRTL } = useLanguage();
  
  const artistIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  // Fetch artists data with separate profile query
  const { data: artists, isLoading } = useQuery({
    queryKey: ["compare-artists", artistIds],
    queryFn: async () => {
      if (artistIds.length === 0 || artistIds.length > 3) return [];
      
      const { data: artistsData, error } = await supabase
        .from("artists")
        .select("id, bio, rating, total_reviews, experience_years, is_available, user_id")
        .in("id", artistIds);

      if (error) throw error;
      if (!artistsData) return [];

      // Fetch profiles separately
      const userIds = artistsData.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      // Map profiles to artists
      return artistsData.map(artist => ({
        ...artist,
        profile: profiles?.find(p => p.id === artist.user_id) || null
      })) as ArtistWithProfile[];
    },
    enabled: artistIds.length > 0 && artistIds.length <= 3,
  });

  const handleRemoveArtist = (artistId: string) => {
    const newIds = artistIds.filter(id => id !== artistId);
    if (newIds.length > 0) {
      navigate(`/compare?ids=${newIds.join(",")}`, { replace: true });
    } else {
      navigate("/makeup-artists", { replace: true });
    }
  };

  const handleBookArtist = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  if (artistIds.length === 0) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title={t.compare.title} showBack style="modern" />
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <p className="text-muted-foreground mb-4">{t.compare.noArtists}</p>
          <Button onClick={() => navigate("/makeup-artists")}>
            {t.compare.browseArtists}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <AppHeader title={t.compare.title} showBack style="modern" />
        <div className="px-5 py-6 space-y-4">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-64 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <AppHeader title={t.compare.title} showBack style="modern" />

      <div className="px-5 py-6">
        <div className="flex items-center justify-between mb-6">
          <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
            {t.common.back}
          </Button>
          <Button size="sm" onClick={() => navigate("/makeup-artists")}>
            {t.compare.addArtist}
          </Button>
        </div>

        <div className="space-y-4">
          {artists?.map((artist) => (
            <Card key={artist.id} className="rounded-2xl overflow-hidden border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 text-center">
                    <Avatar className="w-20 h-20 mx-auto mb-3 ring-2 ring-primary/20">
                      <AvatarImage 
                        src={artist.profile?.avatar_url || artist1} 
                        alt={artist.profile?.full_name || "Artist"} 
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold text-xl">
                        {artist.profile?.full_name?.charAt(0) || "A"}
                      </AvatarFallback>
                    </Avatar>
                    <h3 className="text-lg font-bold text-foreground mb-1">
                      {artist.profile?.full_name || t.artist.anonymous}
                    </h3>
                    {artist.profile?.location && (
                      <div className="flex items-center justify-center gap-1 text-sm text-muted-foreground">
                        <MapPin className="w-3 h-3 text-primary" />
                        <span>{artist.profile.location}</span>
                      </div>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveArtist(artist.id)}
                    className="text-muted-foreground hover:text-red-500"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>

                <Separator className="my-4" />

                <div className="flex items-center justify-center gap-2 mb-3">
                  <div className="flex items-center gap-0.5 bg-yellow-500/10 px-3 py-1.5 rounded-full">
                    <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                    <span className="font-bold text-foreground">
                      {Number(artist.rating || 0).toFixed(1)}
                    </span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    ({artist.total_reviews || 0} {t.artist.reviews})
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div className="bg-primary/5 rounded-xl p-3">
                    <Clock className="w-5 h-5 text-primary mb-1" />
                    <p className="text-xs text-muted-foreground mb-0.5">{t.artist.yearsExperience}</p>
                    <p className="font-bold text-foreground">
                      {artist.experience_years || 0} {t.artist.yearsExperience}
                    </p>
                  </div>
                  <div className="bg-blue-500/5 rounded-xl p-3">
                    <MapPin className="w-5 h-5 text-blue-500 mb-1" />
                    <p className="text-xs text-muted-foreground mb-0.5">{t.compare.distance}</p>
                    <p className="font-bold text-foreground">
                      {t.compare.distanceUnknown}
                    </p>
                  </div>
                </div>

                {artist.bio && (
                  <div className="mb-4">
                    <p className="text-sm text-muted-foreground line-clamp-3">
                      {artist.bio}
                    </p>
                  </div>
                )}

                <Button
                  className="w-full"
                  onClick={() => handleBookArtist(artist.id)}
                >
                  <Calendar className="w-4 h-4 me-2" />
                  {t.compare.bookNow}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 bg-gradient-to-r from-primary/10 to-primary/5 rounded-2xl p-4 border border-primary/20">
          <p className="text-sm text-muted-foreground">
            {t.compare.tipText}
          </p>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default CompareArtists;
