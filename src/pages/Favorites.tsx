import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Heart } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import PageHeader from "@/components/layout/PageHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import artist1 from "@/assets/artist-1.jpg";

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { t } = useLanguage();

  useSwipeBack();

  const artistFavorites = favorites.filter((f) => f.item_type === "artist");

  // Fetch favorite artists with details
  const { data: favoriteArtists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ["favorite-artists", artistFavorites.map((f) => f.item_id)],
    queryFn: async () => {
      if (artistFavorites.length === 0) return [];
      
      const artistIds = artistFavorites.map((f) => f.item_id);
      
      // Fetch artists
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .in("id", artistIds);

      if (artistsError) throw artistsError;
      if (!artists || artists.length === 0) return [];

      // Fetch profiles for artists
      const userIds = artists.map(a => a.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Combine artists with their profiles
      return artists.map(artist => ({
        ...artist,
        profile: profiles?.find(p => p.id === artist.user_id) || null
      }));
    },
    enabled: artistFavorites.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <PageHeader title={t.favorites.title} />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.auth.login}</h2>
          <p className="text-muted-foreground mb-6">
            {t.favorites.noFavoritesDesc}
          </p>
          <Button onClick={() => navigate("/auth")}>
            {t.auth.login}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const isLoading = favoritesLoading || artistsLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <PageHeader title={t.favorites.title} />

      <div className="px-5 py-6">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : favoriteArtists.length > 0 ? (
          <div className="space-y-3">
            {favoriteArtists.map((artist: any) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <Avatar className="w-16 h-16 border-2 border-primary/20">
                  <AvatarImage 
                    src={artist.profile?.avatar_url || artist1} 
                    alt={artist.profile?.full_name || "Artist"} 
                  />
                  <AvatarFallback>
                    {artist.profile?.full_name?.charAt(0) || "A"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {artist.profile?.full_name || t.favorites.unknownArtist}
                  </h3>
                  <p className="text-sm text-muted-foreground truncate">
                    {artist.experience_years || 0} {t.artist.yearsExperience}
                  </p>
                  <div className="flex items-center gap-3 mt-1">
                    <div className="flex items-center gap-1">
                      <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                      <span className="text-sm font-medium">
                        {Number(artist.rating || 0).toFixed(1)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        ({artist.total_reviews || 0})
                      </span>
                    </div>
                    {artist.profile?.location && (
                      <div className="flex items-center gap-1 text-muted-foreground">
                        <MapPin className="w-3 h-3" />
                        <span className="text-xs truncate">
                          {artist.profile.location}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-2">
                  <FavoriteButton itemType="artist" itemId={artist.id} size="sm" />
                  <Button size="sm" variant="outline">
                    {t.artist.viewProfile}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Heart className="w-12 h-12 text-muted-foreground/50 mb-3" />
            <p className="text-muted-foreground">{t.favorites.noFavorites}</p>
            <p className="text-sm text-muted-foreground mt-1">
              {t.favorites.noFavoritesDesc}
            </p>
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => navigate("/home")}
            >
              {t.favorites.discoverArtists}
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Favorites;
