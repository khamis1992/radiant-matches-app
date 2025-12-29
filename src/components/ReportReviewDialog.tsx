import { useState } from "react";
import { AlertTriangle, Flag, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useReportReview } from "@/hooks/useReportReview";
import { useLanguage } from "@/contexts/LanguageContext";
import { Loader2 } from "lucide-react";

const REPORT_REASONS = {
  inappropriate: "inappropriate",
  spam: "spam",
  offensive: "offensive",
  other: "other",
} as const;

export const ReportReviewDialog = ({ reviewId, open, onClose }: { reviewId: string; open: boolean; onClose: () => void }) => {
  const [reason, setReason] = useState("");
  const [selectedReason, setSelectedReason] = useState<string>("");
  const [otherReason, setOtherReason] = useState("");
  const { reportReview, isReporting } = useReportReview();
  const { t, isRTL } = useLanguage();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedReason) {
      return;
    }

    const reportText = selectedReason === "other" ? otherReason : selectedReason;
    await reportReview.mutateAsync({ reviewId, reason: reportText });
    
    // Reset form
    setReason("");
    setSelectedReason("");
    setOtherReason("");
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir={isRTL ? "rtl" : "ltr"}>
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="p-2 bg-destructive/10 rounded-full">
              <Flag className="w-5 h-5 text-destructive" />
            </div>
            <DialogTitle className="text-lg">{t.artist.reportDialog}</DialogTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            {t.artist.reportReasonPlaceholder}
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="space-y-4 py-4">
            <RadioGroup value={selectedReason} onValueChange={setSelectedReason}>
              <div className="space-y-3">
                <Label className="flex items-center gap-3 cursor-pointer border border-border p-3 rounded-lg hover:bg-accent transition-colors">
                  <RadioGroupItem value={REPORT_REASONS.inappropriate}>
                    {t.artist.inappropriate}
                  </RadioGroupItem>
                </Label>
                <Label className="flex items-center gap-3 cursor-pointer border border-border p-3 rounded-lg hover:bg-accent transition-colors">
                  <RadioGroupItem value={REPORT_REASONS.spam}>
                    {t.artist.spam}
                  </RadioGroupItem>
                </Label>
                <Label className="flex items-center gap-3 cursor-pointer border border-border p-3 rounded-lg hover:bg-accent transition-colors">
                  <RadioGroupItem value={REPORT_REASONS.offensive}>
                    {t.artist.offensive}
                  </RadioGroupItem>
                </Label>
                <Label className="flex items-center gap-3 cursor-pointer border border-border p-3 rounded-lg hover:bg-accent transition-colors">
                  <RadioGroupItem value={REPORT_REASONS.other}>
                    {t.artist.other}
                  </RadioGroupItem>
                </Label>
              </div>
            </RadioGroup>

            {selectedReason === "other" && (
              <div className="space-y-2">
                <Label htmlFor="other-reason">{t.artist.reportReason}</Label>
                <Textarea
                  id="other-reason"
                  value={otherReason}
                  onChange={(e) => setOtherReason(e.target.value)}
                  placeholder={t.artist.reportReasonPlaceholder}
                  rows={3}
                  className="resize-none"
                  required
                />
              </div>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isReporting}
            >
              {t.common.cancel}
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={isReporting || !selectedReason || (selectedReason === "other" && !otherReason.trim())}
            >
              {isReporting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  {t.common.processing}
                </>
              ) : (
                <>
                  <AlertTriangle className="w-4 h-4 mr-2" />
                  {t.artist.reportReview}
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

