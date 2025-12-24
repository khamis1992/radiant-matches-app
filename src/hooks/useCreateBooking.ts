import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface CreateBookingData {
  artist_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  location_type: "artist_studio" | "client_home";
  location_address?: string;
  total_price: number;
  notes?: string;
}

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: booking, error } = await supabase
        .from("bookings")
        .insert({
          customer_id: user.id,
          artist_id: data.artist_id,
          service_id: data.service_id,
          booking_date: data.booking_date,
          booking_time: data.booking_time,
          location_type: data.location_type,
          location_address: data.location_address,
          total_price: data.total_price,
          notes: data.notes,
          status: "pending",
        })
        .select()
        .single();

      if (error) throw error;
      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["artist-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["pending-bookings-count"] });
    },
    onError: (error: Error) => {
      console.error("Booking creation error:", error);
      toast.error("فشل في إنشاء الحجز");
    },
  });
};
