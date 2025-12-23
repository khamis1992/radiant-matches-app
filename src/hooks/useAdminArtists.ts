import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface AdminArtist {
  id: string;
  user_id: string;
  bio: string | null;
  experience_years: number | null;
  rating: number | null;
  total_reviews: number | null;
  is_available: boolean | null;
  studio_address: string | null;
  created_at: string;
  profile: {
    full_name: string | null;
    email: string | null;
    phone: string | null;
    avatar_url: string | null;
  } | null;
  services_count: number;
  bookings_count: number;
  total_earnings: number;
}

export const useAdminArtists = (search?: string) => {
  return useQuery({
    queryKey: ["admin-artists", search],
    queryFn: async (): Promise<AdminArtist[]> => {
      const { data: artists, error } = await supabase
        .from("artists")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Enrich with profile, services, bookings data
      const enrichedArtists = await Promise.all(
        (artists || []).map(async (artist) => {
          const [profileResult, servicesResult, bookingsResult] = await Promise.all([
            supabase
              .from("profiles")
              .select("full_name, email, phone, avatar_url")
              .eq("id", artist.user_id)
              .maybeSingle(),
            supabase
              .from("services")
              .select("id", { count: "exact", head: true })
              .eq("artist_id", artist.id),
            supabase
              .from("bookings")
              .select("total_price, artist_earnings, status")
              .eq("artist_id", artist.id),
          ]);

          const completedBookings = (bookingsResult.data || []).filter(
            (b) => b.status === "completed"
          );
          const totalEarnings = completedBookings.reduce(
            (sum, b) => sum + Number(b.artist_earnings || b.total_price || 0),
            0
          );

          return {
            ...artist,
            profile: profileResult.data,
            services_count: servicesResult.count || 0,
            bookings_count: (bookingsResult.data || []).length,
            total_earnings: totalEarnings,
          };
        })
      );

      // Filter by search
      if (search) {
        const searchLower = search.toLowerCase();
        return enrichedArtists.filter(
          (artist) =>
            artist.profile?.full_name?.toLowerCase().includes(searchLower) ||
            artist.profile?.email?.toLowerCase().includes(searchLower) ||
            artist.profile?.phone?.includes(search)
        );
      }

      return enrichedArtists;
    },
  });
};

export const useToggleArtistAvailability = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ artistId, isAvailable }: { artistId: string; isAvailable: boolean }) => {
      const { error } = await supabase
        .from("artists")
        .update({ is_available: isAvailable })
        .eq("id", artistId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-artists"] });
    },
  });
};
