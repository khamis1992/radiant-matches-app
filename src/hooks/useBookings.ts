import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useEffect } from "react";

export interface Booking {
  id: string;
  customer_id: string;
  artist_id: string;
  service_id: string | null;
  booking_date: string;
  booking_time: string;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  total_price: number;
  location_type: string;
  location_address: string | null;
  notes: string | null;
  created_at: string;
  artist?: {
    id: string;
    user_id: string;
    profile?: {
      full_name: string | null;
      avatar_url: string | null;
    } | null;
  } | null;
  service?: {
    name: string;
  } | null;
}

export const useUserBookings = () => {
  const queryClient = useQueryClient();

  // Set up real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel('bookings-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'bookings'
        },
        () => {
          // Invalidate and refetch bookings when any change occurs
          queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
          queryClient.invalidateQueries({ queryKey: ["pending-bookings-count"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  return useQuery({
    queryKey: ["user-bookings"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return { upcoming: [], past: [] };
      
      // Fetch bookings
      const { data: bookings, error: bookingsError } = await supabase
        .from("bookings")
        .select("*")
        .eq("customer_id", user.id)
        .order("booking_date", { ascending: false });

      if (bookingsError) throw bookingsError;
      if (!bookings || bookings.length === 0) return { upcoming: [], past: [] };

      // Fetch artists
      const artistIds = [...new Set(bookings.map(b => b.artist_id))];
      const { data: artists } = await supabase
        .from("artists")
        .select("id, user_id")
        .in("id", artistIds);

      // Fetch profiles
      const userIds = artists?.map(a => a.user_id) || [];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", userIds);

      // Fetch services
      const serviceIds = bookings.map(b => b.service_id).filter(Boolean) as string[];
      const { data: services } = await supabase
        .from("services")
        .select("id, name")
        .in("id", serviceIds);

      // Build maps
      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      const artistMap = new Map(artists?.map(a => [a.id, { 
        ...a, 
        profile: profileMap.get(a.user_id) 
      }]) || []);
      const serviceMap = new Map(services?.map(s => [s.id, s]) || []);

      const enrichedBookings: Booking[] = bookings.map(booking => ({
        ...booking,
        status: booking.status as Booking["status"],
        artist: artistMap.get(booking.artist_id) || null,
        service: booking.service_id ? serviceMap.get(booking.service_id) || null : null,
      }));

      const now = new Date();
      now.setHours(0, 0, 0, 0);
      
      const upcoming = enrichedBookings.filter(b => 
        new Date(b.booking_date) >= now && 
        ["pending", "confirmed"].includes(b.status)
      );
      const past = enrichedBookings.filter(b => 
        new Date(b.booking_date) < now || 
        ["completed", "cancelled"].includes(b.status)
      );
      
      return { upcoming, past };
    },
  });
};
