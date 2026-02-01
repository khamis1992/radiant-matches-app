import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Heart, Sparkles, Clock, X } from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import artist1 from "@/assets/artist-1.jpg";
import { useState, useMemo } from "react";
import { Input } from "@/components/ui/input";

const Favorites = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const { t, isRTL } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");

  useSwipeBack();

  // Filter to get only artist favorites
  const artistFavorites = useMemo(() => {
    return favorites.filter((f) => f.item_type === "artist");
  }, [favorites]);

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

  // Filter artists by search
  const filteredArtists = useMemo(() => {
    if (!searchQuery.trim()) return favoriteArtists;
    const query = searchQuery.toLowerCase();
    return favoriteArtists.filter((artist: any) =>
      artist.profile?.full_name?.toLowerCase().includes(query) ||
      artist.profile?.location?.toLowerCase().includes(query) ||
      artist.specialties?.some((s: string) => s.toLowerCase().includes(query))
    );
  }, [favoriteArtists, searchQuery]);

  // NOW we can do conditional returns after all hooks are called

  // Show loading while auth is being checked
  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5">
        <AppHeader title={t.favorites.title} style="modern" showBack={true} />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="flex flex-col items-center gap-4">
            <div className="w-12 h-12 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
            <p className="text-sm text-muted-foreground">{t.common.loading}</p>
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  // If user is not logged in
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32">
        <AppHeader title={t.favorites.title} style="modern" showBack={true} />
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <div className="relative mb-6">
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-primary/5 rounded-full blur-2xl" />
            <div className="relative w-24 h-24 bg-gradient-to-br from-primary/10 to-primary/5 rounded-full flex items-center justify-center">
              <Heart className="w-12 h-12 text-primary fill-primary/20" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            {t.auth.login}
          </h2>
          <p className="text-muted-foreground mb-8 max-w-sm">
            {t.favorites.noFavoritesDesc}
          </p>
          <Button 
            onClick={() => navigate("/auth")}
            className="shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30 transition-all"
          >
            <Heart className="w-4 h-4 mr-2" />
            {t.auth.login}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const isLoading = favoritesLoading || artistsLoading;

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32">
      {/* Header */}
      <AppHeader title={t.favorites.title} style="modern" showBack={true} />

      <div className="px-5 py-6">
        {/* Search Bar */}
        {favoriteArtists.length > 0 && (
          <div className="relative mb-6 animate-in fade-in slide-in-from-top-2 duration-300" style={{ animationDelay: "100ms" }}>
            <Sparkles className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
            <Input
              placeholder={t.favorites.searchPlaceholder}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`h-12 ${isRTL ? "pr-10 pl-10" : "pl-10 pr-10"} bg-card/50 backdrop-blur-sm border-border/50 rounded-2xl text-sm focus:border-primary/50 transition-all`}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 p-1.5 hover:bg-muted rounded-full transition-colors`}
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
          </div>
        )}

        {/* Content */}
        {isLoading ? (
          <div className="space-y-4 animate-in fade-in duration-300">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/30">
                <div className="flex items-center gap-4">
                  <Skeleton className="w-16 h-16 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-48" />
                  </div>
                  <Skeleton className="w-20 h-8 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredArtists.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 animate-in fade-in slide-in-from-top-2 duration-500" style={{ animationDelay: "200ms" }}>
            {filteredArtists.map((artist: any, index) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="group relative bg-gradient-to-br from-card via-card to-card/50 backdrop-blur-sm rounded-2xl p-4 border border-border/50 shadow-sm hover:shadow-xl hover:border-primary/30 transition-all duration-300 cursor-pointer overflow-hidden"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Shimmer Effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                
                <div className="relative">
                  <div className="flex items-start gap-3">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="w-16 h-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all duration-300">
                        <AvatarImage 
                          src={artist.profile?.avatar_url || artist1} 
                          alt={artist.profile?.full_name || "Artist"} 
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                          {artist.profile?.full_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      {/* Rating Badge */}
                      <div className="absolute -bottom-1 -right-1 bg-gradient-to-br from-yellow-500 to-yellow-600 text-white px-2 py-0.5 rounded-full text-xs font-bold shadow-lg">
                        <div className="flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-white" />
                          {Number(artist.rating || 0).toFixed(1)}
                        </div>
                      </div>
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h3 className="font-bold text-foreground text-base mb-1 truncate group-hover:text-primary transition-colors">
                        {artist.profile?.full_name || t.favorites.unknownArtist}
                      </h3>
                      
                      {/* Location */}
                      {artist.profile?.location && (
                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-2">
                          <MapPin className="w-3 h-3 text-primary" />
                          <span className="truncate">
                            {artist.profile.location}
                          </span>
                        </div>
                      )}

                      {/* Experience & Reviews */}
                      <div className="flex items-center gap-3 text-xs">
                        <div className="flex items-center gap-1 bg-primary/10 px-2 py-1 rounded-full text-primary font-medium">
                          <Clock className="w-3 h-3" />
                          {artist.experience_years || 0} {t.artist.yearsExperience}
                        </div>
                        <div className="flex items-center gap-1 text-muted-foreground">
                          <Star className="w-3 h-3 fill-primary text-primary" />
                          <span className="font-medium">
                            {artist.total_reviews || 0}
                          </span>
                          <span>{t.artist.reviews}</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-4 pt-3 border-t border-border/30">
                    <FavoriteButton 
                      itemType="artist" 
                      itemId={artist.id} 
                      size="sm"
                      className="flex-1"
                    />
                    <Button 
                      size="sm" 
                      variant="outline"
                      className="flex-1 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/artist/${artist.id}`);
                      }}
                    >
                      {t.artist.viewProfile}
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          /* Empty State */
          <div className="flex flex-col items-center justify-center py-12 text-center animate-in fade-in duration-300">
            <div className="relative mb-6">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent rounded-full blur-3xl" />
              <div className="relative w-24 h-24 bg-gradient-to-br from-primary/5 to-primary/0 rounded-full flex items-center justify-center">
                <Heart className="w-12 h-12 text-muted-foreground/50" />
              </div>
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">
              {searchQuery ? t.favorites.noResults : t.favorites.noFavorites}
            </h3>
            <p className="text-muted-foreground mb-6 max-w-sm">
              {searchQuery ? t.favorites.noResultsDesc : t.favorites.noFavoritesDesc}
            </p>
            <Button 
              variant="outline" 
              className="group shadow-sm hover:shadow-md transition-all"
              onClick={() => {
                searchQuery ? setSearchQuery("") : navigate("/home");
              }}
            >
              {searchQuery ? (
                <>
                  <X className="w-4 h-4 mr-2" />
                  {t.favorites.clearSearch}
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                  {t.favorites.discoverArtists}
                </>
              )}
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Favorites;
