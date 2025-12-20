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
}

export const useArtists = () => {
  return useQuery({
    queryKey: ["artists"],
    queryFn: async () => {
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("*")
        .eq("is_available", true)
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

      // Map profiles and featured images to artists
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const featuredMap = new Map(featuredItems?.map(f => [f.artist_id, f.image_url]) || []);
      
      return artists.map(artist => ({
        ...artist,
        profile: profileMap.get(artist.user_id) || null,
        featured_image: featuredMap.get(artist.id) || null,
      })) as Artist[];
    },
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
