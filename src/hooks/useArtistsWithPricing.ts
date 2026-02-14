import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Artist } from "./useArtists";

export interface ArtistWithPricing extends Artist {
  min_price?: number | null;
  portfolio_previews?: string[];
  service_areas?: string[] | null;
}

export const useArtistsWithPricing = () => {
  return useQuery({
    queryKey: ["artists-with-pricing"],
    queryFn: async () => {
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .eq("is_available", true)
        .neq("account_type", "seller")
        .order("rating", { ascending: false });

      if (artistsError) throw artistsError;
      if (!artists || artists.length === 0) return [];

      const userIds = artists.map(a => a.user_id);
      const artistIds = artists.map(a => a.id);
      
      // Fetch profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Fetch featured portfolio images
      const { data: featuredItems, error: featuredError } = await supabase
        .from("portfolio_items")
        .select("artist_id, image_url")
        .in("artist_id", artistIds)
        .eq("is_featured", true);

      if (featuredError) throw featuredError;

      // Fetch portfolio previews (first 3 images per artist)
      const { data: portfolioItems, error: portfolioError } = await supabase
        .from("portfolio_items")
        .select("artist_id, image_url, display_order")
        .in("artist_id", artistIds)
        .order("display_order", { ascending: true });

      if (portfolioError) throw portfolioError;

      // Fetch services with min price
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("artist_id, category, price")
        .in("artist_id", artistIds)
        .eq("is_active", true);

      if (servicesError) throw servicesError;

      // Create maps
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const featuredMap = new Map(featuredItems?.map(f => [f.artist_id, f.image_url]) || []);
      
      // Group categories by artist
      const categoriesMap = new Map<string, Set<string>>();
      const minPriceMap = new Map<string, number>();
      
      services?.forEach(s => {
        if (s.category) {
          if (!categoriesMap.has(s.artist_id)) {
            categoriesMap.set(s.artist_id, new Set());
          }
          categoriesMap.get(s.artist_id)!.add(s.category);
        }
        // Track min price
        const currentMin = minPriceMap.get(s.artist_id);
        if (currentMin === undefined || s.price < currentMin) {
          minPriceMap.set(s.artist_id, s.price);
        }
      });

      // Group portfolio previews (first 3 per artist)
      const portfolioPreviewsMap = new Map<string, string[]>();
      portfolioItems?.forEach(item => {
        if (!portfolioPreviewsMap.has(item.artist_id)) {
          portfolioPreviewsMap.set(item.artist_id, []);
        }
        const previews = portfolioPreviewsMap.get(item.artist_id)!;
        if (previews.length < 3) {
          previews.push(item.image_url);
        }
      });
      
      return artists.map(artist => ({
        ...artist,
        profile: profileMap.get(artist.user_id) || null,
        featured_image: featuredMap.get(artist.id) || null,
        categories: Array.from(categoriesMap.get(artist.id) || []),
        min_price: minPriceMap.get(artist.id) || null,
        portfolio_previews: portfolioPreviewsMap.get(artist.id) || [],
      })) as ArtistWithPricing[];
    },
  });
};
