import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useUserRole } from "./useUserRole";
import { toast } from "sonner";

export interface ReviewReply {
  id: string;
  review_id: string;
  artist_id: string;
  reply: string;
  created_at: string;
}

export const useReviewReplies = (reviewId: string | undefined) => {
  return useQuery({
    queryKey: ["review-replies", reviewId],
    queryFn: async () => {
      if (!reviewId) return [];

      const { data, error } = await supabase
        .from("review_replies")
        .select("*")
        .eq("review_id", reviewId)
        .order("created_at", { ascending: true });

      if (error) throw error;
      return data || [];
    },
    enabled: !!reviewId,
  });
};

export const useAddReviewReply = () => {
  const { user } = useAuth();
  const { isArtist } = useUserRole();
  const queryClient = useQueryClient();

  const addReply = useMutation({
    mutationFn: async ({ reviewId, reply }: { reviewId: string; reply: string }) => {
      if (!user) {
        toast.error("Please login first");
        throw new Error("Not logged in");
      }

      if (!isArtist) {
        toast.error("Only artists can reply to reviews");
        throw new Error("Not an artist");
      }

      // Get artist profile
      const { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!artist) {
        toast.error("Artist profile not found");
        throw new Error("Artist not found");
      }

      const { data, error } = await supabase
        .from("review_replies")
        .insert({
          review_id: reviewId,
          artist_id: artist.id,
          reply: reply.trim(),
        })
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["review-replies", data.review_id] });
      toast.success("Reply added successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to add reply");
    },
  });

  return {
    addReply,
    isAdding: addReply.isPending,
  };
};

export const useDeleteReviewReply = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const deleteReply = useMutation({
    mutationFn: async (replyId: string) => {
      if (!user) {
        toast.error("Please login first");
        return;
      }

      // Check if user owns the reply (is artist)
      const { data: artist } = await supabase
        .from("artists")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!artist) {
        toast.error("Unauthorized");
        throw new Error("Unauthorized");
      }

      const { error } = await supabase
        .from("review_replies")
        .delete()
        .eq("id", replyId)
        .eq("artist_id", artist.id);

      if (error) throw error;
    },
    onSuccess: (_, variables) => {
      // Get review_id to invalidate queries
      queryClient.invalidateQueries({ queryKey: ["review-replies"] });
      toast.success("Reply deleted successfully");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to delete reply");
    },
  });

  return {
    deleteReply,
    isDeleting: deleteReply.isPending,
  };
};

