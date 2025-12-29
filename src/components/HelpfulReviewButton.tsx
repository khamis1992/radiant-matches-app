import { ThumbsUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReviewHelpful } from "@/hooks/useReviewHelpful";
import { useLanguage } from "@/contexts/LanguageContext";

interface HelpfulReviewButtonProps {
  reviewId: string;
  helpfulCount?: number;
  isCompact?: boolean;
}

export const HelpfulReviewButton = ({ reviewId, helpfulCount = 0, isCompact = false }: HelpfulReviewButtonProps) => {
  const { hasVoted, toggleVote, isVoting } = useReviewHelpful(reviewId);
  const { t, isRTL } = useLanguage();

  return (
    <Button
      variant={hasVoted ? "default" : "outline"}
      size={isCompact ? "sm" : "default"}
      onClick={() => toggleVote.mutate()}
      disabled={isVoting}
      className={`${isCompact ? "gap-1.5" : "gap-2"} ${isRTL ? "flex-row-reverse" : ""}`}
    >
      <ThumbsUp className={isCompact ? "w-4 h-4" : "w-5 h-5"} />
      {!isCompact && (
        <span className="text-sm">
          {hasVoted ? t.artist?.notHelpful || "Not Helpful" : t.artist?.helpful || "Helpful"}
        </span>
      )}
      <span className="text-xs text-muted-foreground bg-accent/50 px-2 py-0.5 rounded-full">
        {helpfulCount}
      </span>
    </Button>
  );
};

export default HelpfulReviewButton;
