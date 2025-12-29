import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useReviewHelpful = (reviewId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const checkHasVoted = useQuery({
    queryKey: ["review-helpful", reviewId],
    queryFn: async () => {
      if (!reviewId || !user) return false;

      const { data, error } = await supabase
        .from("review_helpful_votes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id);

      if (error) throw error;
      return (data?.length || 0) > 0;
    },
    enabled: !!reviewId && !!user,
  });

  const toggleVote = useMutation({
    mutationFn: async () => {
      if (!user || !reviewId) {
        toast.error("Please login first");
        return;
      }

      const { data: existing } = await supabase
        .from("review_helpful_votes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id);

      if (existing && existing.length > 0) {
        // Remove vote
        const { error } = await supabase
          .from("review_helpful_votes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id);

        if (error) throw error;

        // Decrement helpful count
        await supabase.rpc("decrement_helpful_count", {
          review_id: reviewId
        });
      } else {
        // Add vote
        const { error } = await supabase
          .from("review_helpful_votes")
          .insert({
            review_id: reviewId,
            user_id: user.id,
          });

        if (error) throw error;

        // Increment helpful count
        await supabase.rpc("increment_helpful_count", {
          review_id: reviewId
        });
      }

      queryClient.invalidateQueries({ queryKey: ["review-helpful", reviewId] });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-reviews"] });
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to update helpful vote");
    },
  });

  return {
    hasVoted: checkHasVoted.data,
    toggleVote,
    isVoting: toggleVote.isPending,
  };
};

