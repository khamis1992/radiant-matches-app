import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Artist {
  id: string;
  user_id: string;
  bio: string | null;
  experience_years: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_available: boolean | null;
  studio_address: string | null;
  portfolio_images: string[] | null;
  profile?: {
    full_name: string | null;
    avatar_url: string | null;
    location: string | null;
  } | null;
  featured_image?: string | null;
  categories?: string[];
}

export const SERVICE_CATEGORIES = [
  "Makeup",
  "Hair Styling",
  "Henna",
  "Lashes & Brows",
  "Nails",
  "Bridal",
  "Photoshoot",
] as const;

export type ServiceCategory = typeof SERVICE_CATEGORIES[number];

export const useArtists = () => {
  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .eq("is_available", true)
        .eq("account_type", "artist")
        .order("rating", { ascending: false });

      if (artistsError) throw artistsError;
      if (!artists || artists.length === 0) return [];

      // Fetch profiles for all artists
      const userIds = artists.map(a => a.user_id);
      const artistIds = artists.map(a => a.id);
      
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Fetch featured portfolio images for all artists
      const { data: featuredItems, error: featuredError } = await supabase
        .from("portfolio_items")
        .select("artist_id, image_url")
        .in("artist_id", artistIds)
        .eq("is_featured", true);

      if (featuredError) throw featuredError;

      // Fetch services to get categories for each artist
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("artist_id, category")
        .in("artist_id", artistIds)
        .eq("is_active", true);

      if (servicesError) throw servicesError;

      // Map profiles, featured images, and categories to artists
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const featuredMap = new Map(featuredItems?.map(f => [f.artist_id, f.image_url]) || []);
      
      // Group categories by artist
      const categoriesMap = new Map<string, Set<string>>();
      services?.forEach(s => {
        if (s.category) {
          if (!categoriesMap.has(s.artist_id)) {
            categoriesMap.set(s.artist_id, new Set());
          }
          categoriesMap.get(s.artist_id)!.add(s.category);
        }
      });
      
      return artists.map(artist => ({
        ...artist,
        profile: profileMap.get(artist.user_id) || null,
        featured_image: featuredMap.get(artist.id) || null,
        categories: Array.from(categoriesMap.get(artist.id) || []),
      })) as Artist[];
    },
  });
};

export const useArtistsByCategory = (category: string | null) => {
  return useQuery({
    queryKey: ["artists", "category", category],
    queryFn: async () => {
      if (!category) return [];

      // First get artist IDs that have services in this category
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("artist_id")
        .eq("category", category)
        .eq("is_active", true);

      if (servicesError) throw servicesError;
      if (!services || services.length === 0) return [];

      const artistIds = [...new Set(services.map(s => s.artist_id))];

      // Fetch those artists
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .in("id", artistIds)
        .eq("is_available", true)
        .eq("account_type", "artist")
        .order("rating", { ascending: false });

      if (artistsError) throw artistsError;
      if (!artists || artists.length === 0) return [];

      // Fetch profiles
      const userIds = artists.map(a => a.user_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Fetch featured images
      const { data: featuredItems, error: featuredError } = await supabase
        .from("portfolio_items")
        .select("artist_id, image_url")
        .in("artist_id", artistIds)
        .eq("is_featured", true);

      if (featuredError) throw featuredError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const featuredMap = new Map(featuredItems?.map(f => [f.artist_id, f.image_url]) || []);

      return artists.map(artist => ({
        ...artist,
        profile: profileMap.get(artist.user_id) || null,
        featured_image: featuredMap.get(artist.id) || null,
      })) as Artist[];
    },
    enabled: !!category,
  });
};

export const useArtist = (id: string | undefined) => {
  return useQuery({
    queryKey: ["artist", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data: artist, error: artistError } = await supabase
        .from("artists")
        .select("*")
        .eq("id", id)
        .maybeSingle();

      if (artistError) throw artistError;
      if (!artist) return null;

      // Fetch profile for this artist
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, location")
        .eq("id", artist.user_id)
        .maybeSingle();

      if (profileError) throw profileError;

      return {
        ...artist,
        profile: profile || null,
      } as Artist;
    },
    enabled: !!id,
  });
};
