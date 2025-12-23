import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface AdminReview {
  id: string;
  artist_id: string;
  customer_id: string;
  booking_id: string;
  rating: number;
  comment: string | null;
  photos: string[] | null;
  created_at: string;
  customer_profile?: {
    full_name: string | null;
    avatar_url: string | null;
  } | null;
  artist_profile?: {
    full_name: string | null;
  } | null;
}

export const useAdminReviews = () => {
  const queryClient = useQueryClient();

  const reviewsQuery = useQuery({
    queryKey: ["admin-reviews"],
    queryFn: async () => {
      // Fetch all reviews
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviews || reviews.length === 0) return [];

      // Fetch customer profiles
      const customerIds = [...new Set(reviews.map((r) => r.customer_id))];
      const { data: customerProfiles, error: customersError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", customerIds);

      if (customersError) throw customersError;

      // Fetch artist profiles via artists table
      const artistIds = [...new Set(reviews.map((r) => r.artist_id))];
      const { data: artists, error: artistsError } = await supabase
        .from("artists")
        .select("id, user_id")
        .in("id", artistIds);

      if (artistsError) throw artistsError;

      const artistUserIds = artists?.map((a) => a.user_id) || [];
      const { data: artistProfiles, error: artistProfilesError } = await supabase
        .from("profiles")
        .select("id, full_name")
        .in("id", artistUserIds);

      if (artistProfilesError) throw artistProfilesError;

      // Create maps
      const customerMap = new Map(customerProfiles?.map((p) => [p.id, p]) || []);
      const artistUserMap = new Map(artists?.map((a) => [a.id, a.user_id]) || []);
      const artistProfileMap = new Map(artistProfiles?.map((p) => [p.id, p]) || []);

      return reviews.map((review) => {
        const artistUserId = artistUserMap.get(review.artist_id);
        return {
          ...review,
          customer_profile: customerMap.get(review.customer_id) || null,
          artist_profile: artistUserId ? artistProfileMap.get(artistUserId) : null,
        };
      }) as AdminReview[];
    },
  });

  const deleteReviewMutation = useMutation({
    mutationFn: async (reviewId: string) => {
      const { error } = await supabase
        .from("reviews")
        .delete()
        .eq("id", reviewId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-reviews"] });
      toast.success("تم حذف المراجعة بنجاح");
    },
    onError: (error) => {
      console.error("Error deleting review:", error);
      toast.error("حدث خطأ أثناء حذف المراجعة");
    },
  });

  return {
    reviews: reviewsQuery.data || [],
    isLoading: reviewsQuery.isLoading,
    error: reviewsQuery.error,
    deleteReview: deleteReviewMutation.mutate,
    isDeleting: deleteReviewMutation.isPending,
  };
};
