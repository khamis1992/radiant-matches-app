/**
 * Hook for review helpful votes
 * Note: This feature requires review_helpful_votes table to be created
 */
export const useReviewHelpful = (_reviewId: string | undefined) => {
  const toggleVote = {
    mutate: () => {
      console.log("Review helpful votes not configured - table not available");
    },
    isPending: false,
  };

  return {
    hasVoted: false,
    toggleVote,
    isVoting: false,
  };
};
