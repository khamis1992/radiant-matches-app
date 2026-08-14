import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const useAdminOperations = () => {
  return useQuery({
    queryKey: ["admin-operations-queue"],
    queryFn: async () => {
      const since = new Date();
      since.setDate(since.getDate() - 30);
      const [bookingsResult, artistsResult, eventsResult] = await Promise.all([
        supabase
          .from("bookings")
          .select("id, booking_date, booking_time, status, rebooking_eligible, artist_response_at, total_price")
          .in("status", ["pending", "cancelled"])
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("artists")
          .select("id, user_id, onboarding_status, created_at")
          .eq("onboarding_status", "pending_review")
          .order("created_at", { ascending: true })
          .limit(20),
        supabase
          .from("product_events")
          .select("event_name")
          .gte("created_at", since.toISOString()),
      ]);

      if (bookingsResult.error) throw bookingsResult.error;
      if (artistsResult.error) throw artistsResult.error;
      if (eventsResult.error) throw eventsResult.error;

      const eventCounts = (eventsResult.data || []).reduce<Record<string, number>>((counts, event) => {
        counts[event.event_name] = (counts[event.event_name] || 0) + 1;
        return counts;
      }, {});

      return {
        bookings: bookingsResult.data || [],
        pendingArtists: artistsResult.data || [],
        eventCounts,
      };
    },
  });
};
