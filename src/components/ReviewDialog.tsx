import { useEffect, useRef, useState } from "react";
import { Camera, CircleNotch, Star, X } from "@phosphor-icons/react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useReviewPhotosAvailable, useSubmitReview } from "@/hooks/useSubmitReview";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import type { Booking } from "@/hooks/useBookings";

const MAX_PHOTOS = 3;

interface ReviewDialogProps {
  booking: Booking | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface PhotoDraft {
  file: File;
  preview: string;
}

const ReviewDialog = ({ booking, open, onOpenChange }: ReviewDialogProps) => {
  const { t } = useLanguage();
  const submitReview = useSubmitReview();
  const { data: photosAvailable = false } = useReviewPhotosAvailable();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState("");
  const [photos, setPhotos] = useState<PhotoDraft[]>([]);

  // Reset the form every time the dialog opens for a new booking
  useEffect(() => {
    if (open) {
      setRating(0);
      setComment("");
      setPhotos((prev) => {
        prev.forEach((p) => URL.revokeObjectURL(p.preview));
        return [];
      });
    }
  }, [open, booking?.id]);

  const artistName = booking?.artist?.profile?.full_name || "";
  const artistAvatar = booking?.artist?.profile?.avatar_url || undefined;
  const serviceName = booking?.service?.name || "";

  const addPhotos = (files: FileList | null) => {
    if (!files) return;
    const room = MAX_PHOTOS - photos.length;
    const next = Array.from(files)
      .slice(0, room)
      .map((file) => ({ file, preview: URL.createObjectURL(file) }));
    setPhotos((prev) => [...prev, ...next].slice(0, MAX_PHOTOS));
  };

  const removePhoto = (index: number) => {
    setPhotos((prev) => {
      URL.revokeObjectURL(prev[index].preview);
      return prev.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = () => {
    if (!booking || rating === 0 || submitReview.isPending) return;

    submitReview.mutate(
      {
        booking,
        rating,
        comment,
        photos: photos.map((p) => p.file),
      },
      {
        onSuccess: () => {
          toast.success(t.reviews.successToast);
          onOpenChange(false);
        },
        onError: () => {
          toast.error(t.reviews.errorToast);
        },
      },
    );
  };

  const ratingLabels = t.reviews.ratingLabels as string[];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[calc(100vw-2rem)] rounded-[28px] border-glam-border p-5 sm:max-w-md">
        <DialogHeader className="items-center text-center">
          <Avatar className="h-16 w-16 ring-2 ring-glam-blush">
            <AvatarImage src={artistAvatar} alt={artistName} className="object-cover" />
            <AvatarFallback className="bg-glam-blush-soft text-lg font-semibold text-glam-ink">
              {artistName.charAt(0) || "?"}
            </AvatarFallback>
          </Avatar>
          <DialogTitle className="pt-1 text-lg font-bold text-glam-ink">
            {t.reviews.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-glam-secondary">
            {t.reviews.subtitle} {artistName}
            {serviceName ? ` · ${serviceName}` : ""}
          </DialogDescription>
        </DialogHeader>

        {/* Stars */}
        <div className="mt-2 flex items-center justify-center gap-1.5" role="radiogroup" aria-label={t.reviews.title}>
          {[1, 2, 3, 4, 5].map((value) => {
            const active = value <= rating;
            return (
              <button
                key={value}
                type="button"
                role="radio"
                aria-checked={rating === value}
                aria-label={ratingLabels[value]}
                onClick={() => setRating(value)}
                className="grid h-11 w-11 place-items-center rounded-full transition-transform active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose"
              >
                <Star
                  size={32}
                  weight={active ? "fill" : "regular"}
                  className={active ? "text-glam-rose" : "text-glam-border"}
                  aria-hidden="true"
                />
              </button>
            );
          })}
        </div>
        <p className="min-h-5 text-center text-xs font-semibold text-glam-rose" aria-live="polite">
          {rating > 0 ? ratingLabels[rating] : ""}
        </p>

        {/* Comment */}
        <div className="mt-3 text-start">
          <label htmlFor="review-comment" className="mb-1.5 block text-xs font-semibold text-glam-ink">
            {t.reviews.commentLabel}
          </label>
          <textarea
            id="review-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={t.reviews.commentPlaceholder}
            rows={3}
            maxLength={500}
            className="w-full resize-none rounded-2xl border border-glam-border bg-glam-surface px-3.5 py-3 text-sm text-glam-ink placeholder:text-glam-muted focus:border-glam-rose focus:outline-none focus:ring-2 focus:ring-glam-rose/30"
          />
        </div>

        {/* Photos — shown once the review-photos bucket migration is applied */}
        {photosAvailable && (
        <div className="mt-3">
          <div className="mb-1.5 flex items-baseline justify-between">
            <span className="text-xs font-semibold text-glam-ink">{t.reviews.photosLabel}</span>
            <span className="text-[11px] text-glam-muted">{t.reviews.photosHint}</span>
          </div>
          <div className="flex items-center gap-2.5">
            {photos.map((photo, index) => (
              <div key={photo.preview} className="relative h-16 w-16 shrink-0">
                <img
                  src={photo.preview}
                  alt=""
                  className="h-full w-full rounded-2xl border border-glam-border object-cover"
                />
                <button
                  type="button"
                  onClick={() => removePhoto(index)}
                  aria-label="Remove photo"
                  className="absolute -end-1.5 -top-1.5 grid h-5 w-5 place-items-center rounded-full bg-glam-ink text-white shadow-sm transition-transform active:scale-90"
                >
                  <X size={11} weight="bold" aria-hidden="true" />
                </button>
              </div>
            ))}
            {photos.length < MAX_PHOTOS && (
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl border border-dashed border-glam-border text-glam-muted transition-colors hover:border-glam-rose hover:text-glam-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose"
              >
                <Camera size={22} aria-hidden="true" />
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={(e) => {
                addPhotos(e.target.files);
                e.target.value = "";
              }}
            />
          </div>
        </div>

        )}

        {/* Submit */}
        <button
          type="button"
          onClick={handleSubmit}
          disabled={rating === 0 || submitReview.isPending}
          className="mt-4 flex h-12 w-full items-center justify-center gap-2 rounded-full bg-glam-ink text-sm font-semibold text-white transition-colors hover:bg-glam-ink-pressed active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
        >
          {submitReview.isPending && (
            <CircleNotch size={18} className="animate-spin" aria-hidden="true" />
          )}
          {submitReview.isPending ? t.reviews.submitting : t.reviews.submit}
        </button>
      </DialogContent>
    </Dialog>
  );
};

export default ReviewDialog;
