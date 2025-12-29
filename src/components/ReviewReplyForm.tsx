import { useState } from "react";
import { MessageCircle, Send, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAddReviewReply } from "@/hooks/useReviewReplies";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

interface ReviewReplyFormProps {
  reviewId: string;
  artistId: string;
  existingReplies?: any[];
  onSuccess?: () => void;
}

export const ReviewReplyForm = ({ reviewId, artistId, existingReplies = [], onSuccess }: ReviewReplyFormProps) => {
  const [reply, setReply] = useState("");
  const [showForm, setShowForm] = useState(false);
  const { addReply, isAdding } = useAddReviewReply();
  const { t, isRTL } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!reply.trim()) {
      return;
    }

    await addReply.mutateAsync({
      reviewId,
      reply: reply.trim()
    });
    
    setReply("");
    setShowForm(false);
    onSuccess?.();
  };

  return (
    <div className="space-y-3">
      {/* Show Replies */}
      {existingReplies.length > 0 && (
        <div className="space-y-2 ml-8 md:ml-12">
          {existingReplies.map((reply: any) => (
            <div key={reply.id} className="bg-accent/50 p-3 rounded-lg">
              <div className="flex items-start gap-2">
                <div className="font-semibold text-foreground text-sm">
                  Artist Reply
                </div>
                <span className="text-xs text-muted-foreground">
                  {new Date(reply.created_at).toLocaleDateString()}
                </span>
              </div>
              <p className="text-sm text-foreground mt-1">
                {reply.reply}
              </p>
            </div>
          ))}
        </div>
      )}

      {/* Reply Button/Form */}
      {!showForm ? (
        <button
          onClick={() => setShowForm(true)}
          className={`flex items-center gap-2 text-sm text-primary hover:text-primary/80 transition-colors ${isRTL ? "mr-auto" : "ml-auto"}`}
        >
          <MessageCircle className="w-4 h-4" />
          {t.artist.replyToReview}
        </button>
      ) : (
        <div className="ml-8 md:ml-12">
          <form onSubmit={handleSubmit} className="space-y-2">
            <Textarea
              value={reply}
              onChange={(e) => setReply(e.target.value)}
              placeholder={t.artist.replyPlaceholder}
              rows={3}
              className="resize-none"
              dir={isRTL ? "rtl" : "ltr"}
              autoFocus
            />
            <div className="flex gap-2 justify-end">
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => setShowForm(false)}
              >
                <X className="w-4 h-4" />
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isAdding || !reply.trim()}
              >
                {isAdding ? (
                  <>
                    <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                    {t.common.processing}
                  </>
                ) : (
                  <>
                    <Send className="w-3 h-3 mr-1" />
                    {t.artist.addReply}
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ReviewReplyForm;
