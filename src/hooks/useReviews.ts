import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Review {
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
}

export const useArtistReviews = (artistId: string | undefined) => {
  return useQuery({
    queryKey: ["reviews", artistId],
    queryFn: async () => {
      if (!artistId) return [];
      
      const { data: reviews, error: reviewsError } = await supabase
        .from("reviews")
        .select("*")
        .eq("artist_id", artistId)
        .order("created_at", { ascending: false });

      if (reviewsError) throw reviewsError;
      if (!reviews || reviews.length === 0) return [];

      // Fetch profiles for all reviewers
      const customerIds = reviews.map(r => r.customer_id);
      const { data: profiles, error: profilesError } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url")
        .in("id", customerIds);

      if (profilesError) throw profilesError;

      const profileMap = new Map(profiles?.map(p => [p.id, p]) || []);
      return reviews.map(review => ({
        ...review,
        customer_profile: profileMap.get(review.customer_id) || null,
      })) as Review[];
    },
    enabled: !!artistId,
  });
};
