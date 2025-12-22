import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface ArtistAvailability {
  artistId: string;
  isAvailableToday: boolean;
  todayHours: {
    start: string;
    end: string;
  } | null;
}

export const useArtistAvailability = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["artist-availability", artistId],
    queryFn: async (): Promise<ArtistAvailability | null> => {
      if (!artistId) return null;

      const today = new Date().getDay(); // 0 = Sunday, 1 = Monday, etc.

      const { data, error } = await supabase
        .from("artist_working_hours")
        .select("*")
        .eq("artist_id", artistId)
        .eq("day_of_week", today)
        .maybeSingle();

      if (error) throw error;

      if (!data || !data.is_working) {
        return {
          artistId,
          isAvailableToday: false,
          todayHours: null,
        };
      }

      return {
        artistId,
        isAvailableToday: true,
        todayHours: {
          start: data.start_time || "09:00",
          end: data.end_time || "17:00",
        },
      };
    },
    enabled: !!artistId,
  });
};

// Bulk fetch availability for multiple artists
export const useArtistsAvailability = (artistIds: string[]) => {
  return useQuery({
    queryKey: ["artists-availability", artistIds],
    queryFn: async (): Promise<Map<string, ArtistAvailability>> => {
      if (artistIds.length === 0) return new Map();

      const today = new Date().getDay();

      const { data, error } = await supabase
        .from("artist_working_hours")
        .select("*")
        .in("artist_id", artistIds)
        .eq("day_of_week", today);

      if (error) throw error;

      const availabilityMap = new Map<string, ArtistAvailability>();

      // Initialize all artists as unavailable
      artistIds.forEach((id) => {
        availabilityMap.set(id, {
          artistId: id,
          isAvailableToday: false,
          todayHours: null,
        });
      });

      // Update those who have working hours set
      data?.forEach((wh) => {
        if (wh.is_working) {
          availabilityMap.set(wh.artist_id, {
            artistId: wh.artist_id,
            isAvailableToday: true,
            todayHours: {
              start: wh.start_time || "09:00",
              end: wh.end_time || "17:00",
            },
          });
        }
      });

      return availabilityMap;
    },
    enabled: artistIds.length > 0,
  });
};
