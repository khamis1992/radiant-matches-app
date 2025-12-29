import { useState, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Star, MapPin, Clock, X, Calendar, Plus, Check, Search, DollarSign } from "lucide-react";
import { Tables } from "@/integrations/supabase/types";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import artist1 from "@/assets/artist-1.jpg";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ArtistWithProfile {
  id: string;
  bio?: string | null;
  rating: number | null;
  total_reviews: number | null;
  experience_years?: number | null;
  is_available?: boolean | null;
  user_id: string;
  profile: {
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
  } | null;
}

const MAX_COMPARE = 3;

const CompareArtists = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { t, isRTL } = useLanguage();
  const [sheetOpen, setSheetOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const artistIds = searchParams.get("ids")?.split(",").filter(Boolean) || [];

  // Fetch selected artists
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

      const userIds = artistsData.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      return artistsData.map(artist => ({
        ...artist,
        profile: profiles?.find(p => p.id === artist.user_id) || null
      })) as ArtistWithProfile[];
    },
    enabled: artistIds.length > 0 && artistIds.length <= 3,
  });

  // Fetch services for selected artists
  const { data: services } = useQuery({
    queryKey: ["compare-services", artistIds],
    queryFn: async () => {
      if (artistIds.length === 0) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .in("artist_id", artistIds)
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data as Tables<"services">[];
    },
    enabled: artistIds.length > 0,
  });

  // Group services by category
  const servicesByCategory = useMemo(() => {
    if (!services) return {};
    const grouped: Record<string, Tables<"services">[]> = {};
    services.forEach(service => {
      const category = service.category || "Other";
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(service);
    });
    return grouped;
  }, [services]);

  // Get unique service names across all artists for table rows
  const allServiceNames = useMemo(() => {
    if (!services) return [];
    const names = new Set<string>();
    services.forEach(s => names.add(s.name));
    return Array.from(names);
  }, [services]);

  // Fetch all available artists for adding
  const { data: allArtists } = useQuery({
    queryKey: ["all-artists-for-compare"],
    queryFn: async () => {
      const { data: artistsData, error } = await supabase
        .from("artists")
        .select("id, rating, total_reviews, user_id")
        .eq("is_available", true);

      if (error) throw error;
      if (!artistsData) return [];

      const userIds = artistsData.map(a => a.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      return artistsData.map(artist => ({
        ...artist,
        profile: profiles?.find(p => p.id === artist.user_id) || null
      })) as ArtistWithProfile[];
    },
  });

  const handleRemoveArtist = (artistId: string) => {
    const newIds = artistIds.filter(id => id !== artistId);
    if (newIds.length > 0) {
      setSearchParams({ ids: newIds.join(",") });
    } else {
      navigate("/makeup-artists", { replace: true });
    }
  };

  const handleAddArtist = (artistId: string) => {
    if (artistIds.length >= MAX_COMPARE) return;
    if (artistIds.includes(artistId)) return;
    
    const newIds = [...artistIds, artistId];
    setSearchParams({ ids: newIds.join(",") });
    setSheetOpen(false);
    setSearchQuery("");
  };

  const handleBookArtist = (artistId: string) => {
    navigate(`/artist/${artistId}`);
  };

  // Artists not yet selected, filtered by search
  const availableToAdd = useMemo(() => {
    const notSelected = allArtists?.filter(a => !artistIds.includes(a.id)) || [];
    if (!searchQuery.trim()) return notSelected;
    
    const query = searchQuery.toLowerCase();
    return notSelected.filter(a => 
      a.profile?.full_name?.toLowerCase().includes(query) ||
      a.profile?.location?.toLowerCase().includes(query)
    );
  }, [allArtists, artistIds, searchQuery]);

  const canAddMore = artistIds.length < MAX_COMPARE;

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
        {/* Header with count and Add button */}
        <div className="flex items-center justify-between mb-6">
          <p className="text-sm text-muted-foreground">
            {artistIds.length} / {MAX_COMPARE} {t.compare.title}
          </p>
          
          {canAddMore && (
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
              <SheetTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                  <Plus className="w-4 h-4" />
                  {t.compare.addArtist}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
                <SheetHeader className="pb-4">
                  <SheetTitle>{t.compare.addArtist}</SheetTitle>
                </SheetHeader>
                
                {/* Search */}
                <div className="relative mb-4">
                  <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
                  <Input
                    placeholder={t.artistsListing?.searchPlaceholder || "Search artists..."}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={isRTL ? "pr-10" : "pl-10"}
                  />
                </div>
                
                {/* Artists List */}
                <ScrollArea className="h-[calc(80vh-180px)]">
                  <div className="space-y-2 pr-4">
                    {availableToAdd.length === 0 ? (
                      <p className="text-center text-muted-foreground py-8">
                        {t.common?.noResults || "No artists found"}
                      </p>
                    ) : (
                      availableToAdd.map((artist) => (
                        <button
                          key={artist.id}
                          onClick={() => handleAddArtist(artist.id)}
                          className="w-full flex items-center gap-3 p-3 rounded-xl border border-border hover:border-primary/50 hover:bg-primary/5 transition-all text-start"
                        >
                          <Avatar className="w-12 h-12 ring-2 ring-primary/10 flex-shrink-0">
                            <AvatarImage 
                              src={artist.profile?.avatar_url || undefined} 
                              alt={artist.profile?.full_name || "Artist"} 
                              className="object-cover"
                            />
                            <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                              {artist.profile?.full_name?.charAt(0) || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-foreground truncate">
                              {artist.profile?.full_name || t.artist.anonymous}
                            </p>
                            {artist.profile?.location && (
                              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                                <MapPin className="w-3 h-3" />
                                {artist.profile.location}
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-1 text-sm">
                            <Star className="w-4 h-4 fill-yellow-500 text-yellow-500" />
                            <span className="font-medium">{Number(artist.rating || 0).toFixed(1)}</span>
                            <span className="text-muted-foreground text-xs">({artist.total_reviews || 0})</span>
                          </div>
                          <Plus className="w-5 h-5 text-primary flex-shrink-0" />
                        </button>
                      ))
                    )}
                  </div>
                </ScrollArea>
              </SheetContent>
            </Sheet>
          )}
        </div>

        {/* Selected Artists for Comparison */}
        <div className="space-y-4">
          {artists?.map((artist) => (
            <Card key={artist.id} className="rounded-2xl overflow-hidden border-2 border-primary/20">
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 text-center">
                    <div className="relative inline-block">
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
                      <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                        <Check className="w-3.5 h-3.5 text-primary-foreground" />
                      </div>
                    </div>
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

        {/* Services & Prices Comparison Table */}
        {artists && artists.length > 1 && allServiceNames.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-4">
              <DollarSign className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-foreground">
                {isRTL ? "مقارنة الخدمات والأسعار" : "Services & Prices Comparison"}
              </h2>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[400px]">
                <thead>
                  <tr className="bg-muted/50">
                    <th className={`p-3 text-sm font-semibold text-foreground ${isRTL ? "text-right" : "text-left"} border-b border-border`}>
                      {isRTL ? "الخدمة" : "Service"}
                    </th>
                    {artists.map((artist) => (
                      <th key={artist.id} className="p-3 text-sm font-semibold text-foreground text-center border-b border-border min-w-[120px]">
                        <div className="flex flex-col items-center gap-1">
                          <Avatar className="w-8 h-8">
                            <AvatarImage src={artist.profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-primary/10 text-primary text-xs">
                              {artist.profile?.full_name?.charAt(0) || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <span className="truncate max-w-[100px]">
                            {artist.profile?.full_name?.split(" ")[0] || t.artist.anonymous}
                          </span>
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {allServiceNames.map((serviceName, idx) => (
                    <tr key={serviceName} className={idx % 2 === 0 ? "bg-background" : "bg-muted/30"}>
                      <td className={`p-3 text-sm font-medium text-foreground ${isRTL ? "text-right" : "text-left"} border-b border-border/50`}>
                        {serviceName}
                      </td>
                      {artists.map((artist) => {
                        const service = services?.find(
                          s => s.artist_id === artist.id && s.name === serviceName
                        );
                        return (
                          <td key={artist.id} className="p-3 text-center border-b border-border/50">
                            {service ? (
                              <div className="flex flex-col items-center">
                                <span className="font-bold text-primary">
                                  {service.price} {isRTL ? "ر.ق" : "QAR"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {service.duration_minutes} {isRTL ? "دقيقة" : "min"}
                                </span>
                              </div>
                            ) : (
                              <span className="text-muted-foreground">—</span>
                            )}
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Price Summary */}
            <div className="mt-4 grid gap-3" style={{ gridTemplateColumns: `repeat(${artists.length}, 1fr)` }}>
              {artists.map((artist) => {
                const artistServices = services?.filter(s => s.artist_id === artist.id) || [];
                const minPrice = artistServices.length > 0 
                  ? Math.min(...artistServices.map(s => s.price)) 
                  : 0;
                const maxPrice = artistServices.length > 0 
                  ? Math.max(...artistServices.map(s => s.price)) 
                  : 0;
                
                return (
                  <Card key={artist.id} className="rounded-xl border-primary/20">
                    <CardContent className="p-3 text-center">
                      <p className="text-xs text-muted-foreground mb-1">
                        {isRTL ? "نطاق الأسعار" : "Price Range"}
                      </p>
                      <p className="font-bold text-foreground">
                        {artistServices.length > 0 ? (
                          <>
                            {minPrice} - {maxPrice} <span className="text-xs">{isRTL ? "ر.ق" : "QAR"}</span>
                          </>
                        ) : (
                          <span className="text-muted-foreground text-sm">
                            {isRTL ? "لا توجد خدمات" : "No services"}
                          </span>
                        )}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        )}

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
