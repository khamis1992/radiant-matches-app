import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "@/hooks/use-toast";

export const useReviewHelpful = (reviewId: string | undefined) => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: hasVoted = false } = useQuery({
    queryKey: ["review-helpful-vote", reviewId, user?.id],
    queryFn: async () => {
      if (!reviewId || !user?.id) return false;

      const { data, error } = await supabase
        .from("review_helpful_votes")
        .select("id")
        .eq("review_id", reviewId)
        .eq("user_id", user.id)
        .maybeSingle();

      if (error) throw error;
      return !!data;
    },
    enabled: !!reviewId && !!user?.id,
  });

  const toggleVote = useMutation({
    mutationFn: async () => {
      if (!reviewId || !user?.id) {
        throw new Error("Must be logged in to vote");
      }

      if (hasVoted) {
        // Remove vote
        const { error } = await supabase
          .from("review_helpful_votes")
          .delete()
          .eq("review_id", reviewId)
          .eq("user_id", user.id);

        if (error) throw error;
      } else {
        // Add vote
        const { error } = await supabase
          .from("review_helpful_votes")
          .insert({
            review_id: reviewId,
            user_id: user.id,
          });

        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["review-helpful-vote", reviewId] });
      queryClient.invalidateQueries({ queryKey: ["reviews"] });
    },
    onError: (error) => {
      console.error("Error toggling vote:", error);
      toast({
        title: "حدث خطأ",
        description: "يجب تسجيل الدخول للتصويت",
        variant: "destructive",
      });
    },
  });

  return {
    hasVoted,
    toggleVote,
    isVoting: toggleVote.isPending,
  };
};
