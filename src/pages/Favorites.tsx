import { useState } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, Clock, Heart } from "lucide-react";
import BackButton from "@/components/BackButton";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useFavorites } from "@/hooks/useFavorites";
import { useAuth } from "@/hooks/useAuth";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { formatQAR } from "@/lib/locale";
import artist1 from "@/assets/artist-1.jpg";

const Favorites = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { favorites, isLoading: favoritesLoading } = useFavorites();
  const [activeTab, setActiveTab] = useState<"services" | "artists">("services");

  useSwipeBack();

  const serviceFavorites = favorites.filter((f) => f.item_type === "service");
  const artistFavorites = favorites.filter((f) => f.item_type === "artist");

  // Fetch favorite services with details
  const { data: favoriteServices = [], isLoading: servicesLoading } = useQuery({
    queryKey: ["favorite-services", serviceFavorites.map((f) => f.item_id)],
    queryFn: async () => {
      if (serviceFavorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select(`
          *,
          artist:artists(
            id,
            rating,
            profile:profiles(full_name, avatar_url, location)
          )
        `)
        .in("id", serviceFavorites.map((f) => f.item_id));

      if (error) throw error;
      return data || [];
    },
    enabled: serviceFavorites.length > 0,
  });

  // Fetch favorite artists with details
  const { data: favoriteArtists = [], isLoading: artistsLoading } = useQuery({
    queryKey: ["favorite-artists", artistFavorites.map((f) => f.item_id)],
    queryFn: async () => {
      if (artistFavorites.length === 0) return [];
      
      const { data, error } = await supabase
        .from("artists")
        .select(`
          *,
          profile:profiles(full_name, avatar_url, location)
        `)
        .in("id", artistFavorites.map((f) => f.item_id));

      if (error) throw error;
      return data || [];
    },
    enabled: artistFavorites.length > 0,
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">Favorites</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Heart className="w-16 h-16 text-muted-foreground/50 mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign in to save favorites</h2>
          <p className="text-muted-foreground mb-6">
            Create an account to save your favorite services and artists
          </p>
          <Button onClick={() => navigate("/auth")}>
            Sign In
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const isLoading = favoritesLoading || servicesLoading || artistsLoading;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold text-foreground">Favorites</h1>
        </div>
      </header>

      <div className="px-5 py-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "services" | "artists")}>
          <TabsList className="w-full mb-4">
            <TabsTrigger value="services" className="flex-1">
              Services ({serviceFavorites.length})
            </TabsTrigger>
            <TabsTrigger value="artists" className="flex-1">
              Artists ({artistFavorites.length})
            </TabsTrigger>
          </TabsList>

          {/* Services Tab */}
          <TabsContent value="services" className="mt-0">
            {isLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl" />
                ))}
              </div>
            ) : favoriteServices.length > 0 ? (
              <div className="space-y-3">
                {favoriteServices.map((service: any) => (
                  <div
                    key={service.id}
                    onClick={() => navigate(`/artist/${service.artist_id}`)}
                    className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-12 h-12 border-2 border-primary/20">
                        <AvatarImage 
                          src={service.artist?.profile?.avatar_url || artist1} 
                          alt={service.artist?.profile?.full_name || "Artist"} 
                        />
                        <AvatarFallback>
                          {service.artist?.profile?.full_name?.charAt(0) || "A"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground">{service.name}</h3>
                        <p className="text-sm text-muted-foreground truncate">
                          by {service.artist?.profile?.full_name || "Unknown Artist"}
                        </p>
                        {service.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {service.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 mt-2">
                          <div className="flex items-center gap-1 text-sm">
                            <span className="font-semibold text-foreground">{formatQAR(service.price)}</span>
                          </div>
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="w-3.5 h-3.5" />
                            <span>{service.duration_minutes} min</span>
                          </div>
                          {service.artist?.rating && (
                            <div className="flex items-center gap-1 text-sm">
                              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                              <span>{Number(service.artist.rating).toFixed(1)}</span>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <FavoriteButton itemType="service" itemId={service.id} size="sm" />
                        <Button size="sm" className="shrink-0">
                          Book
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No favorite services yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse categories and tap the heart to save services
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/categories")}
                >
                  Browse Services
                </Button>
              </div>
            )}
          </TabsContent>

          {/* Artists Tab */}
          <TabsContent value="artists" className="mt-0">
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
                        {artist.profile?.full_name || "Unknown Artist"}
                      </h3>
                      <p className="text-sm text-muted-foreground truncate">
                        {artist.experience_years || 0} years experience
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
                        View
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Heart className="w-12 h-12 text-muted-foreground/50 mb-3" />
                <p className="text-muted-foreground">No favorite artists yet</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Browse artists and tap the heart to save them
                </p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => navigate("/home")}
                >
                  Browse Artists
                </Button>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Favorites;
