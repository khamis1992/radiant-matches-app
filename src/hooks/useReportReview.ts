import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { toast } from "sonner";

export const useReportReview = () => {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const reportReview = useMutation({
    mutationFn: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      if (!user) {
        toast.error("Please login first");
        throw new Error("Not logged in");
      }

      if (!reason.trim()) {
        toast.error("Please provide a reason");
        throw new Error("Reason required");
      }

      const { data, error } = await supabase
        .from("reviews")
        .update({
          is_reported: true,
          report_reason: reason.trim(),
          report_status: "pending",
        })
        .eq("id", reviewId)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["artist-reviews"] });
      toast.success("Review reported successfully. Thank you for helping us improve our platform.");
    },
    onError: (error: any) => {
      toast.error(error.message || "Failed to report review");
    },
  });

  return {
    reportReview,
    isReporting: reportReview.isPending,
  };
};

