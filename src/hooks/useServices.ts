import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Service {
  id: string;
  artist_id: string;
  name: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  category: string | null;
  image_url: string | null;
  is_active: boolean | null;
}

export interface ServiceWithArtist extends Service {
  artist?: {
    id: string;
    rating: number | null;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
}

export const useArtistServices = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["services", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .eq("artist_id", artistId)
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (error) throw error;
      return data as Service[];
    },
    enabled: !!artistId,
  });
};

export const useServicesByCategory = (category: string | null) => {
  return useQuery({
    queryKey: ["services", "category", category],
    queryFn: async () => {
      if (!category) return [];

      // Fetch services in this category
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("*")
        .eq("category", category)
        .eq("is_active", true)
        .order("price", { ascending: true });

      if (servicesError) throw servicesError;
      if (!services || services.length === 0) return [];

      // Get unique artist IDs
      const artistIds = [...new Set(services.map(s => s.artist_id))];

      // Fetch artists
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("id, rating, user_id")
        .in("id", artistIds)
        .eq("is_available", true);

      if (artistsError) throw artistsError;

      // Fetch profiles for artists
      const userIds = artists?.map(a => a.user_id) || [];
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      if (profilesError) throw profilesError;

      // Map profiles to artists
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const artistMap = new Map(
        artists?.map(a => [
          a.id,
          {
            id: a.id,
            rating: a.rating,
            profile: profileMap.get(a.user_id) || null,
          },
        ]) || []
      );

      // Combine services with artist data
      return services
        .filter(s => artistMap.has(s.artist_id))
        .map(service => ({
          ...service,
          artist: artistMap.get(service.artist_id) || null,
        })) as ServiceWithArtist[];
    },
    enabled: !!category,
  });
};
