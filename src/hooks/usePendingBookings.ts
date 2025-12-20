import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";

export const usePendingBookingsCount = () => {
  const { user } = useAuth();
  const { isArtist } = useUserRole();

  return useQuery({
    queryKey: ["pending-bookings-count", user?.id, isArtist],
    queryFn: async () => {
      if (!user?.id) return 0;

      if (isArtist) {
        // Get artist's pending bookings
        const { data: artist } = await supabase
          .from("artists")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle();

        if (!artist) return 0;

        const { count, error } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("artist_id", artist.id)
          .eq("status", "pending");

        if (error) throw error;
        return count || 0;
      } else {
        // Get customer's pending bookings
        const { count, error } = await supabase
          .from("bookings")
          .select("*", { count: "exact", head: true })
          .eq("customer_id", user.id)
          .eq("status", "pending");

        if (error) throw error;
        return count || 0;
      }
    },
    enabled: !!user?.id,
    refetchInterval: 30000, // Refetch every 30 seconds
  });
};
