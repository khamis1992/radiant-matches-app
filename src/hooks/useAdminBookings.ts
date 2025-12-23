import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface AdminBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  location_type: string;
  location_address: string | null;
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  artist: {
    id: string;
    user_id: string;
    profile: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number;
  } | null;
}

export const useAdminBookings = (
  statusFilter: BookingStatus | "all" = "all",
  searchQuery: string = ""
) => {
  return useQuery({
    queryKey: ["admin-bookings", statusFilter, searchQuery],
    queryFn: async () => {
      // Fetch all bookings
      let query = supabase
        .from("bookings")
        .select(`
          id,
          booking_date,
          booking_time,
          status,
          total_price,
          location_type,
          location_address,
          notes,
          created_at,
          customer_id,
          artist_id,
          service_id
        `)
        .order("created_at", { ascending: false });

      if (statusFilter !== "all") {
        query = query.eq("status", statusFilter);
      }

      const { data: bookings, error } = await query;

      if (error) throw error;

      // Get unique IDs
      const customerIds = [...new Set(bookings.map((b) => b.customer_id))];
      const artistIds = [...new Set(bookings.map((b) => b.artist_id))];
      const serviceIds = [...new Set(bookings.map((b) => b.service_id).filter(Boolean))];

      // Fetch related data in parallel
      const [customersRes, artistsRes, servicesRes] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, full_name, email, phone")
          .in("id", customerIds),
        supabase
          .from("artists")
          .select("id, user_id")
          .in("id", artistIds),
        serviceIds.length > 0
          ? supabase
              .from("services")
              .select("id, name, price")
              .in("id", serviceIds as string[])
          : { data: [], error: null },
      ]);

      // Get artist profiles
      const artistUserIds = artistsRes.data?.map((a) => a.user_id) || [];
      const artistProfilesRes = await supabase
        .from("profiles")
        .select("id, full_name, email")
        .in("id", artistUserIds);

      // Create lookup maps
      const customersMap = new Map(
        customersRes.data?.map((c) => [c.id, c]) || []
      );
      const artistsMap = new Map(
        artistsRes.data?.map((a) => [a.id, a]) || []
      );
      const artistProfilesMap = new Map(
        artistProfilesRes.data?.map((p) => [p.id, p]) || []
      );
      const servicesMap = new Map<string, { id: string; name: string; price: number }>(
        (servicesRes.data || []).map((s) => [s.id, s] as [string, { id: string; name: string; price: number }])
      );

      // Combine data
      let enrichedBookings: AdminBooking[] = bookings.map((booking) => {
        const artist = artistsMap.get(booking.artist_id);
        const artistProfile = artist
          ? artistProfilesMap.get(artist.user_id)
          : null;

        return {
          id: booking.id,
          booking_date: booking.booking_date,
          booking_time: booking.booking_time,
          status: booking.status,
          total_price: booking.total_price,
          location_type: booking.location_type,
          location_address: booking.location_address,
          notes: booking.notes,
          created_at: booking.created_at,
          customer: customersMap.get(booking.customer_id) || null,
          artist: artist
            ? {
                id: artist.id,
                user_id: artist.user_id,
                profile: artistProfile || null,
              }
            : null,
          service: booking.service_id
            ? servicesMap.get(booking.service_id) || null
            : null,
        };
      });

      // Apply search filter
      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        enrichedBookings = enrichedBookings.filter((booking) => {
          return (
            booking.customer?.full_name?.toLowerCase().includes(query) ||
            booking.customer?.email?.toLowerCase().includes(query) ||
            booking.customer?.phone?.includes(query) ||
            booking.artist?.profile?.full_name?.toLowerCase().includes(query) ||
            booking.service?.name.toLowerCase().includes(query) ||
            booking.id.toLowerCase().includes(query)
          );
        });
      }

      return enrichedBookings;
    },
  });
};

export const useUpdateBookingStatus = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      bookingId,
      status,
    }: {
      bookingId: string;
      status: BookingStatus;
    }) => {
      const { error } = await supabase
        .from("bookings")
        .update({ status })
        .eq("id", bookingId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-bookings"] });
      toast.success("تم تحديث حالة الحجز بنجاح");
    },
    onError: (error) => {
      console.error("Error updating booking status:", error);
      toast.error("فشل تحديث حالة الحجز");
    },
  });
};
