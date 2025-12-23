import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

interface TopService {
  id: string;
  name: string;
  category: string | null;
  bookingsCount: number;
  totalRevenue: number;
  artistName: string | null;
}

interface TopArtist {
  id: string;
  name: string | null;
  avatarUrl: string | null;
  totalBookings: number;
  completedBookings: number;
  totalRevenue: number;
  rating: number | null;
  totalReviews: number | null;
}

export const useTopServices = (limit = 10) => {
  return useQuery({
    queryKey: ["top-services", limit],
    queryFn: async (): Promise<TopService[]> => {
      // Get all completed bookings with service info
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("service_id, total_price, status")
        .eq("status", "completed")
        .not("service_id", "is", null);

      if (error) throw error;

      // Aggregate by service
      const serviceStats: Record<string, { count: number; revenue: number }> = {};
      (bookings || []).forEach((booking) => {
        if (booking.service_id) {
          if (!serviceStats[booking.service_id]) {
            serviceStats[booking.service_id] = { count: 0, revenue: 0 };
          }
          serviceStats[booking.service_id].count += 1;
          serviceStats[booking.service_id].revenue += Number(booking.total_price || 0);
        }
      });

      // Sort by count and get top services
      const sortedServiceIds = Object.entries(serviceStats)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, limit)
        .map(([id]) => id);

      if (sortedServiceIds.length === 0) return [];

      // Fetch service details
      const { data: services, error: servicesError } = await supabase
        .from("services")
        .select("id, name, category, artist_id")
        .in("id", sortedServiceIds);

      if (servicesError) throw servicesError;

      // Fetch artist names
      const enrichedServices = await Promise.all(
        (services || []).map(async (service) => {
          const { data: artist } = await supabase
            .from("artists")
            .select("user_id")
            .eq("id", service.artist_id)
            .maybeSingle();

          let artistName = null;
          if (artist?.user_id) {
            const { data: profile } = await supabase
              .from("profiles")
              .select("full_name")
              .eq("id", artist.user_id)
              .maybeSingle();
            artistName = profile?.full_name;
          }

          return {
            id: service.id,
            name: service.name,
            category: service.category,
            bookingsCount: serviceStats[service.id]?.count || 0,
            totalRevenue: serviceStats[service.id]?.revenue || 0,
            artistName,
          };
        })
      );

      return enrichedServices.sort((a, b) => b.bookingsCount - a.bookingsCount);
    },
  });
};

export const useTopArtists = (limit = 10) => {
  return useQuery({
    queryKey: ["top-artists", limit],
    queryFn: async (): Promise<TopArtist[]> => {
      // Get all bookings with artist info
      const { data: bookings, error } = await supabase
        .from("bookings")
        .select("artist_id, total_price, status");

      if (error) throw error;

      // Aggregate by artist
      const artistStats: Record<string, { total: number; completed: number; revenue: number }> = {};
      (bookings || []).forEach((booking) => {
        if (!artistStats[booking.artist_id]) {
          artistStats[booking.artist_id] = { total: 0, completed: 0, revenue: 0 };
        }
        artistStats[booking.artist_id].total += 1;
        if (booking.status === "completed") {
          artistStats[booking.artist_id].completed += 1;
          artistStats[booking.artist_id].revenue += Number(booking.total_price || 0);
        }
      });

      // Sort by completed bookings and get top artists
      const sortedArtistIds = Object.entries(artistStats)
        .sort(([, a], [, b]) => b.completed - a.completed)
        .slice(0, limit)
        .map(([id]) => id);

      if (sortedArtistIds.length === 0) return [];

      // Fetch artist details
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("id, user_id, rating, total_reviews")
        .in("id", sortedArtistIds);

      if (artistsError) throw artistsError;

      // Fetch profile details
      const enrichedArtists = await Promise.all(
        (artists || []).map(async (artist) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("full_name, avatar_url")
            .eq("id", artist.user_id)
            .maybeSingle();

          return {
            id: artist.id,
            name: profile?.full_name || null,
            avatarUrl: profile?.avatar_url || null,
            totalBookings: artistStats[artist.id]?.total || 0,
            completedBookings: artistStats[artist.id]?.completed || 0,
            totalRevenue: artistStats[artist.id]?.revenue || 0,
            rating: artist.rating,
            totalReviews: artist.total_reviews,
          };
        })
      );

      return enrichedArtists.sort((a, b) => b.completedBookings - a.completedBookings);
    },
  });
};
