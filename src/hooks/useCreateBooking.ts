import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { sendEmail } from "@/lib/email";

interface CreateBookingData {
  artist_id: string;
  service_id: string;
  booking_date: string;
  booking_time: string;
  location_type: "artist_studio" | "client_home";
  location_address?: string;
  notes?: string;
  payment_method: "cash" | "sadad";
}

const bookingErrorMessage = (code: string) => {
  const messages: Record<string, string> = {
    slot_no_longer_available: "هذا الموعد لم يعد متاحًا. اختاري وقتًا آخر.",
    artist_unavailable_on_date: "الفنانة غير متاحة في هذا التاريخ.",
    artist_not_working_on_date: "الفنانة لا تعمل في هذا التاريخ.",
    slot_outside_working_hours: "اختاري وقتًا ضمن ساعات عمل الفنانة.",
    booking_outside_allowed_window: "هذا الموعد خارج نافذة الحجز المسموح بها.",
    booking_exceeds_service_day: "مدة الخدمة لا تتناسب مع ساعات العمل المتاحة.",
  };
  return messages[code] || "تعذر تأكيد الحجز. يرجى المحاولة مرة أخرى.";
};

export const useCreateBooking = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateBookingData) => {
      const { data: response, error } = await supabase.functions.invoke("create-secure-booking", {
        body: {
          artistId: data.artist_id,
          serviceId: data.service_id,
          bookingDate: data.booking_date,
          bookingTime: data.booking_time,
          locationType: data.location_type,
          locationAddress: data.location_address,
          notes: data.notes,
          paymentMethod: data.payment_method,
        },
      });

      if (error) throw new Error(error.message || "booking_creation_failed");
      if (!response?.success || !response.booking) {
        throw new Error(response?.error || "booking_creation_failed");
      }

      const booking = response.booking;

      // The notification is deliberately non-blocking: booking integrity has
      // already been enforced by the server-side booking function.
      try {
        const [{ data: auth }, serviceRes, artistRes] = await Promise.all([
          supabase.auth.getUser(),
          supabase.from("services").select("name").eq("id", data.service_id).single(),
          supabase.from("artists").select("user_id").eq("id", data.artist_id).single(),
        ]);
        const customerId = auth.user?.id;
        const profileRes = customerId
          ? await supabase.from("profiles").select("full_name, email").eq("id", customerId).single()
          : { data: null };
        const artistProfile = artistRes.data?.user_id
          ? (await supabase.from("profiles").select("full_name").eq("id", artistRes.data.user_id).single()).data
          : null;

        if (profileRes.data?.email) {
          sendEmail({
            type: "booking_created",
            to: profileRes.data.email,
            data: {
              customerName: profileRes.data.full_name || "",
              artistName: artistProfile?.full_name || "",
              serviceName: serviceRes.data?.name || "",
              bookingDate: data.booking_date,
              bookingTime: data.booking_time,
              totalPrice: String(booking.total_price),
            },
          });
        }
      } catch (emailErr) {
        console.error("Booking notification failed (non-blocking):", emailErr);
      }

      return booking;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["artist-bookings"] });
      queryClient.invalidateQueries({ queryKey: ["pending-bookings-count"] });
      queryClient.invalidateQueries({ queryKey: ["artist-availability"] });
      queryClient.invalidateQueries({ queryKey: ["artists-availability"] });
    },
    onError: (error: Error) => {
      console.error("Booking creation error:", error.message);
      toast.error(bookingErrorMessage(error.message));
    },
  });
};
