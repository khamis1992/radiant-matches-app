import { useState, useEffect, useCallback, useRef } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight, X, Pencil, Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";

interface ImageLightboxProps {
  images: { url: string; title?: string | null; category?: string; isFeatured?: boolean }[];
  initialIndex: number;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  editable?: boolean;
  categories?: readonly string[];
  onUpdateImage?: (index: number, updates: { title?: string; category?: string; isFeatured?: boolean }) => void;
}

const ImageLightbox = ({ 
  images, 
  initialIndex, 
  open, 
  onOpenChange,
  editable = false,
  categories = [],
  onUpdateImage,
}: ImageLightboxProps) => {
  const { t, isRTL } = useLanguage();
  const [currentIndex, setCurrentIndex] = useState(initialIndex);
  const [scale, setScale] = useState(1);
  const [isEditing, setIsEditing] = useState(false);
  const [editTitle, setEditTitle] = useState("");
  const [editCategory, setEditCategory] = useState("");
  const touchStartX = useRef<number | null>(null);
  const touchEndX = useRef<number | null>(null);
  const initialPinchDistance = useRef<number | null>(null);
  const lastScale = useRef(1);
  const minSwipeDistance = 50;

  useEffect(() => {
    setCurrentIndex(initialIndex);
    setScale(1);
    lastScale.current = 1;
    setIsEditing(false);
  }, [initialIndex]);

  // Reset zoom and editing when image changes
  useEffect(() => {
    setScale(1);
    lastScale.current = 1;
    setIsEditing(false);
    if (images[currentIndex]) {
      setEditTitle(images[currentIndex].title || "");
      setEditCategory(images[currentIndex].category || "");
    }
  }, [currentIndex, images]);

  const goToPrevious = useCallback(() => {
    setCurrentIndex((prev) => (prev > 0 ? prev - 1 : images.length - 1));
  }, [images.length]);

  const goToNext = useCallback(() => {
    setCurrentIndex((prev) => (prev < images.length - 1 ? prev + 1 : 0));
  }, [images.length]);

  const getDistance = (touches: React.TouchList) => {
    return Math.hypot(
      touches[0].clientX - touches[1].clientX,
      touches[0].clientY - touches[1].clientY
    );
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      initialPinchDistance.current = getDistance(e.touches);
      lastScale.current = scale;
    } else if (e.touches.length === 1 && scale === 1) {
      touchEndX.current = null;
      touchStartX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && initialPinchDistance.current) {
      const currentDistance = getDistance(e.touches);
      const newScale = lastScale.current * (currentDistance / initialPinchDistance.current);
      setScale(Math.min(Math.max(newScale, 1), 4));
    } else if (e.touches.length === 1 && scale === 1) {
      touchEndX.current = e.targetTouches[0].clientX;
    }
  };

  const handleTouchEnd = () => {
    if (initialPinchDistance.current) {
      initialPinchDistance.current = null;
      lastScale.current = scale;
      return;
    }

    if (!touchStartX.current || !touchEndX.current || scale !== 1) return;
    
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

  const lastTap = useRef<number>(0);
  const handleDoubleTap = () => {
    const now = Date.now();
    if (now - lastTap.current < 300) {
      setScale(scale === 1 ? 2 : 1);
      lastScale.current = scale === 1 ? 2 : 1;
    }
    lastTap.current = now;
  };

  const handleStartEdit = () => {
    if (!editable || !onUpdateImage) return;
    setEditTitle(images[currentIndex]?.title || "");
    setEditCategory(images[currentIndex]?.category || "");
    setIsEditing(true);
  };

  const handleSaveEdit = () => {
    if (!onUpdateImage) return;
    onUpdateImage(currentIndex, {
      title: editTitle,
      category: editCategory,
    });
    setIsEditing(false);
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!open) return;
      
      if (isEditing) {
        if (e.key === "Escape") {
          setIsEditing(false);
        } else if (e.key === "Enter") {
          handleSaveEdit();
        }
        return;
      }
      
      if (e.key === "ArrowLeft") {
        goToPrevious();
      } else if (e.key === "ArrowRight") {
        goToNext();
      } else if (e.key === "Escape") {
        onOpenChange(false);
      } else if (e.key === "e" && editable) {
        handleStartEdit();
      } else if (e.key === "f" && editable && onUpdateImage) {
        onUpdateImage(currentIndex, { isFeatured: !images[currentIndex]?.isFeatured });
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [open, goToPrevious, goToNext, onOpenChange, isEditing, editable]);

  if (!images.length) return null;

  const currentImage = images[currentIndex];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] max-h-[95vh] p-0 bg-background/95 backdrop-blur-xl border-none overflow-hidden">
        {/* Close Button */}
        <button
          onClick={() => onOpenChange(false)}
          className={`absolute top-4 ${isRTL ? "left-4" : "right-4"} z-50 p-2 rounded-full bg-background/80 hover:bg-background transition-colors`}
          aria-label={t.common.close}
        >
          <X className="w-5 h-5 text-foreground" />
        </button>

        {/* Featured Toggle Button */}
        {editable && onUpdateImage && !isEditing && (
          <button
            onClick={() => onUpdateImage(currentIndex, { isFeatured: !currentImage.isFeatured })}
            className={cn(
              `absolute top-4 ${isRTL ? "left-16" : "right-16"} z-50 p-2 rounded-full transition-colors`,
              currentImage.isFeatured 
                ? "bg-yellow-500 text-white hover:bg-yellow-600" 
                : "bg-background/80 hover:bg-background"
            )}
            title={currentImage.isFeatured ? t.artist.featured : t.artist.featured}
            aria-label={t.artist.featured}
          >
            <Star className={cn("w-5 h-5", currentImage.isFeatured ? "fill-current" : "text-foreground")} />
          </button>
        )}

        {/* Edit Button */}
        {editable && onUpdateImage && !isEditing && (
          <button
            onClick={handleStartEdit}
            className={`absolute top-4 ${isRTL ? "left-28" : "right-28"} z-50 p-2 rounded-full bg-background/80 hover:bg-background transition-colors`}
            title={t.common.edit}
            aria-label={t.common.edit}
          >
            <Pencil className="w-5 h-5 text-foreground" />
          </button>
        )}

        {/* Navigation Arrows */}
        {images.length > 1 && (
          <>
            <button
              onClick={isRTL ? goToNext : goToPrevious}
              className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 hover:bg-background transition-colors`}
              aria-label={t.common.previous}
            >
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <button
              onClick={isRTL ? goToPrevious : goToNext}
              className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 z-50 p-3 rounded-full bg-background/80 hover:bg-background transition-colors`}
              aria-label={t.common.next}
            >
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </>
        )}

        {/* Image Container */}
        <div 
          className="flex items-center justify-center w-full h-[85vh] p-8 touch-none"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={handleDoubleTap}
        >
          <img
            src={currentImage.url}
            alt={currentImage.title || "Portfolio image"}
            className="max-w-full max-h-full object-contain rounded-lg animate-fade-in select-none transition-transform duration-100"
            style={{ transform: `scale(${scale})` }}
            draggable={false}
          />
        </div>

        {/* Image Info & Dots */}
        <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background to-transparent p-6">
          {/* Editing Form */}
          {isEditing ? (
            <div className={`flex items-center justify-center gap-2 mb-4 max-w-md mx-auto ${isRTL ? "flex-row-reverse" : ""}`}>
              <Input
                value={editTitle}
                onChange={(e) => setEditTitle(e.target.value)}
                placeholder={t.common.titleOptional}
                className="flex-1 bg-background/80"
                autoFocus
                dir={isRTL ? "rtl" : "ltr"}
              />
              {categories.length > 0 && (
                <Select value={editCategory} onValueChange={setEditCategory}>
                  <SelectTrigger className="w-[140px] bg-background/80">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              <Button size="icon" onClick={handleSaveEdit} title={t.common.save} aria-label={t.common.save}>
                <Check className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            /* Title & Category Display */
            (currentImage.title || currentImage.category) && (
              <div className="text-center mb-4">
                {currentImage.title && (
                  <h3 className="text-lg font-semibold text-foreground">{currentImage.title}</h3>
                )}
                {currentImage.category && (
                  <p className="text-sm text-muted-foreground">{currentImage.category}</p>
                )}
              </div>
            )
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
