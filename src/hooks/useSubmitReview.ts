import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Booking } from "@/hooks/useBookings";

const REVIEW_PHOTOS_BUCKET = "review-photos";
const MAX_REVIEW_PHOTOS = 3;

/** Set of booking ids the current user already reviewed. */
/** True once the review-photos storage bucket exists (migration applied). */
export const useReviewPhotosAvailable = () => {
  return useQuery({
    queryKey: ["review-photos-available"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { error } = await supabase.storage
        .from(REVIEW_PHOTOS_BUCKET)
        .list("", { limit: 1 });
      return !error;
    },
  });
};
export const useReviewedBookingIds = () => {
  return useQuery({
    queryKey: ["reviewed-booking-ids"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return new Set<string>();

      const { data, error } = await supabase
        .from("reviews")
        .select("booking_id")
        .eq("customer_id", user.id);

      if (error) throw error;
      return new Set<string>((data || []).map((r) => r.booking_id as string));
    },
  });
};

interface SubmitReviewInput {
  booking: Booking;
  rating: number;
  comment: string;
  photos: File[];
}

export const useSubmitReview = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ booking, rating, comment, photos }: SubmitReviewInput) => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("not-authenticated");

      // Best-effort photo upload — the review still submits if an upload fails
      const photoUrls: string[] = [];
      for (const [index, file] of photos.slice(0, MAX_REVIEW_PHOTOS).entries()) {
        const ext = file.name.split(".").pop() || "jpg";
        const path = `${user.id}/${booking.id}/${index + 1}-${Date.now()}.${ext}`;
        const { error: uploadError } = await supabase.storage
          .from(REVIEW_PHOTOS_BUCKET)
          .upload(path, file, { cacheControl: "3600", upsert: false });

        if (!uploadError) {
          const {
            data: { publicUrl },
          } = supabase.storage.from(REVIEW_PHOTOS_BUCKET).getPublicUrl(path);
          photoUrls.push(publicUrl);
        }
      }

      const { error } = await supabase.from("reviews").insert({
        booking_id: booking.id,
        customer_id: user.id,
        artist_id: booking.artist_id,
        rating,
        comment: comment.trim() || null,
        photos: photoUrls,
      });

      if (error) throw error;
    },
    onSuccess: (_data, { booking }) => {
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
      queryClient.invalidateQueries({ queryKey: ["reviewed-booking-ids"] });
      queryClient.invalidateQueries({ queryKey: ["artists"] });
      queryClient.invalidateQueries({ queryKey: ["artist", booking.artist_id] });
      queryClient.invalidateQueries({ queryKey: ["artists-with-pricing"] });
    },
  });
};
