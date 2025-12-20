import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  images: { url: string; title?: string | null; category?: string }[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const ImageLightbox = ({ images, initialIndex, open, onOpenChange }: ImageLightboxProps) => {
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
  }, [initialIndex]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const handleTouchStart = (e: React.TouchEvent) => {
    touchEndX.current = null;
    touchStartX.current = e.targetTouches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX;
  };

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return;
    
    const distance = touchStartX.current - touchEndX.current;
    const isSwipe = Math.abs(distance) > minSwipeDistance;
    
    if (isSwipe) {
      if (distance > 0) {
        goToNext();
      } else {
        goToPrevious();
      }
    }
    
    touchStartX.current = null;
    touchEndX.current = null;
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        onOpenChange(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrevious, goToNext, onOpenChange]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-xl border-none overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute top-4 right-4 z-50 p-2 rounded-full bg-background/80 hover:bg-background transition-colors"
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={goToPrevious}
              className="absolute left-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={goToNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 hover:bg-background transition-colors"
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </>
        )}

        {/* Image Container */}
        <div 
          className="flex items-center justify-center w-full h-[85vh] p-8"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentImage.url}
            alt={currentImage.title || "Portfolio image"}
            className="max-w-full max-h-full object-contain rounded-lg animate-fade-in select-none"
            draggable={false}
          />
        </div>

        {/* Image Info & Dots */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background to-transparent p-6">
          {/* Title & Category */}
          {(currentImage.title || currentImage.category) && (
            <div className="text-center mb-4">
              {currentImage.title && (
                <h3 className="text-lg font-semibold text-foreground">{currentImage.title}</h3>
              )}
              {currentImage.category && (
                <p className="text-sm text-muted-foreground">{currentImage.category}</p>
              )}
            </div>
          )}

          {/* Pagination Dots */}
          {images.length > 1 && (
            <div className="flex items-center justify-center gap-2">
              {images.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentIndex(index)}
                  className={cn(
                    "w-2 h-2 rounded-full transition-all",
                    index === currentIndex
                      ? "bg-primary w-4"
                      : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
                  )}
                />
              ))}
            </div>
          )}

          {/* Counter */}
          {images.length > 1 && (
            <p className="text-center text-sm text-muted-foreground mt-2">
              {currentIndex + 1} / {images.length}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ImageLightbox;
