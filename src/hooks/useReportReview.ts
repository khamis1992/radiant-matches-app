import { toast } from "sonner";

/**
 * Hook for reporting reviews
 * Note: This feature would require report columns on reviews table
 */
export const useReportReview = () => {
  const reportReview = {
    mutate: ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      console.log("Review reported:", reviewId, reason);
      toast.success("تم الإبلاغ عن المراجعة بنجاح");
    },
    mutateAsync: async ({ reviewId, reason }: { reviewId: string; reason: string }) => {
      console.log("Review reported:", reviewId, reason);
      toast.success("تم الإبلاغ عن المراجعة بنجاح");
      return null;
    },
    isPending: false,
  };

  return {
    reportReview,
    isReporting: false,
  };
};
