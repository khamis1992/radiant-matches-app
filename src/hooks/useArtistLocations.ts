import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

/**
 * Hook to fetch unique locations from artist profiles
 * Used for the location filter dropdown
 */
export const useArtistLocations = () => {
  return useQuery({
    queryKey: ["artist-locations"],
    queryFn: async () => {
      // Get all artist user IDs first
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("user_id")
        .eq("is_available", true);

      if (artistsError) throw artistsError;
      if (!artists || artists.length === 0) return [];

      const userIds = artists.map((a) => a.user_id);

      // Fetch unique locations from profiles
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("location")
        .in("id", userIds)
        .not("location", "is", null);

      if (profilesError) throw profilesError;

      // Extract unique locations
      const locations = new Set<string>();
      profiles?.forEach((p) => {
        if (p.location && p.location.trim()) {
          locations.add(p.location.trim());
        }
      });

      return Array.from(locations).sort();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes cache
  });
};

