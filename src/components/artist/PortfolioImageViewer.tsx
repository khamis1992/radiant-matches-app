import { useState, useEffect, useRef } from "react";
import { X, Star, Edit, ArrowUpDown, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

interface PortfolioItem {
  id: string;
  image_url: string;
  category: string;
  title?: string;
  is_featured: boolean;
}

interface PortfolioImageViewerProps {
  isOpen: boolean;
  items: PortfolioItem[];
  currentIndex: number;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onFeature: (item: PortfolioItem) => void;
  onEdit: (item: PortfolioItem) => void;
  onDelete: (item: PortfolioItem) => void;
  onReorder: () => void;
  isDeleting?: boolean;
  language?: string;
}

export const PortfolioImageViewer = ({
  isOpen,
  items,
  currentIndex,
  onClose,
  onNavigate,
  onFeature,
  onEdit,
  onDelete,
  onReorder,
  isDeleting = false,
  language = "en",
}: PortfolioImageViewerProps) => {
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [showOverlays, setShowOverlays] = useState(true);
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const overlaysTimeoutRef = useRef<NodeJS.Timeout>();

  const currentItem = items[currentIndex];
  const isRTL = language === "ar";

  // Lock body scroll when viewer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Auto-hide overlays after 3 seconds
  useEffect(() => {
    if (isOpen) {
      setShowOverlays(true);
      if (overlaysTimeoutRef.current) {
        clearTimeout(overlaysTimeoutRef.current);
      }
      overlaysTimeoutRef.current = setTimeout(() => {
        setShowOverlays(false);
      }, 3000);
    }
    return () => {
      if (overlaysTimeoutRef.current) {
        clearTimeout(overlaysTimeoutRef.current);
      }
    };
  }, [isOpen, currentIndex]);

  // Reset zoom when image changes
  useEffect(() => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  }, [currentIndex]);

  if (!isOpen || !currentItem) return null;

  const handleDoubleTap = () => {
    if (scale === 1) {
      setScale(2);
    } else {
      setScale(1);
      setPosition({ x: 0, y: 0 });
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setTouchStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
    }
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStart && e.touches.length === 0) {
      const deltaX = Math.abs(e.changedTouches[0].clientX - touchStart.x);
      const deltaY = Math.abs(e.changedTouches[0].clientY - touchStart.y);

      // Detect swipe for navigation
      if (deltaX > 50 && deltaY < 30) {
        const direction = e.changedTouches[0].clientX > touchStart.x;
        if (direction && !isRTL) {
          // Swipe right (or left in RTL)
          if (currentIndex > 0) onNavigate(currentIndex - 1);
        } else if (!direction && !isRTL) {
          // Swipe left (or right in RTL)
          if (currentIndex < items.length - 1) onNavigate(currentIndex + 1);
        }
      }

      // Detect swipe down to close
      if (deltaY > 100 && deltaX < 50) {
        onClose();
      }
    }
    setTouchStart(null);
  };

  const handlePrev = () => {
    if (currentIndex > 0) {
      onNavigate(currentIndex - 1);
    }
  };

  const handleNext = () => {
    if (currentIndex < items.length - 1) {
      onNavigate(currentIndex + 1);
    }
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      dir={isRTL ? "rtl" : "ltr"}
    >
      {/* Top Overlay */}
      <div
        className={cn(
          "flex items-center justify-between px-4 py-4 transition-opacity duration-300",
          showOverlays ? "opacity-100" : "opacity-0"
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-top), 16px)" }}
      >
        <button
          onClick={onClose}
          className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 bg-primary text-white text-xs font-medium rounded-full">
            {currentItem.category}
          </span>
        </div>

        <span className="text-white text-sm font-medium">
          {currentIndex + 1}/{items.length}
        </span>
      </div>

      {/* Image Container */}
      <div className="flex-1 relative overflow-hidden">
        <div
          className={cn(
            "absolute inset-0 flex items-center justify-center transition-transform duration-200",
            scale !== 1 && "cursor-grab active:cursor-grabbing"
          )}
          style={{
            transform: `scale(${scale}) translate(${position.x}px, ${position.y}px)`,
          }}
          onClick={() => setShowOverlays(!showOverlays)}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <img
            src={currentItem.image_url}
            alt={currentItem.title || currentItem.category}
            className="max-w-full max-h-full object-contain"
            onDoubleClick={handleDoubleTap}
            draggable={false}
          />
        </div>

        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button
            onClick={handlePrev}
            className={cn(
              "absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-opacity",
              showOverlays ? "opacity-100" : "opacity-0"
            )}
          >
            <ChevronLeft className={cn("w-6 h-6", isRTL && "rotate-180")} />
          </button>
        )}

        {currentIndex < items.length - 1 && (
          <button
            onClick={handleNext}
            className={cn(
              "absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center text-white transition-opacity",
              showOverlays ? "opacity-100" : "opacity-0"
            )}
          >
            <ChevronRight className={cn("w-6 h-6", isRTL && "rotate-180")} />
          </button>
        )}
      </div>

      {/* Progress Dots */}
      <div
        className={cn(
          "flex justify-center gap-1.5 py-2 transition-opacity duration-300",
          showOverlays ? "opacity-100" : "opacity-0"
        )}
      >
        {items.map((_, index) => (
          <div
            key={index}
            className={cn(
              "w-1.5 h-1.5 rounded-full transition-all",
              index === currentIndex
                ? "bg-primary w-4"
                : "bg-white/30"
            )}
          />
        ))}
      </div>

      {/* Actions Bar */}
      <div
        className={cn(
          "bg-black/80 backdrop-blur-lg border-t border-white/10 transition-opacity duration-300",
          showOverlays ? "opacity-100" : "opacity-0"
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 16px)" }}
      >
        <div className="px-6 py-4 space-y-3">
          {/* First Row - Main Actions */}
          <div className="flex items-center justify-center gap-4">
            {/* Feature Button */}
            <button
              onClick={() => onFeature(currentItem)}
              className={cn(
                "w-14 h-14 rounded-full flex items-center justify-center transition-transform active:scale-95",
                currentItem.is_featured
                  ? "bg-primary text-white"
                  : "bg-white text-black"
              )}
            >
              <Star className={cn("w-6 h-6", currentItem.is_featured && "fill-current")} />
            </button>

            {/* Edit Button */}
            <button
              onClick={() => onEdit(currentItem)}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black transition-transform active:scale-95"
            >
              <Edit className="w-6 h-6" />
            </button>

            {/* Reorder Button */}
            <button
              onClick={onReorder}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center text-black transition-transform active:scale-95"
            >
              <ArrowUpDown className="w-6 h-6" />
            </button>
          </div>

          {/* Second Row - Delete */}
          <button
            onClick={() => onDelete(currentItem)}
            disabled={isDeleting}
            className="w-full py-3 rounded-xl bg-destructive text-white font-medium flex items-center justify-center gap-2 transition-transform active:scale-[0.98] disabled:opacity-50"
          >
            {isDeleting ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Deleting...
              </>
            ) : (
              <>
                <Trash2 className="w-4 h-4" />
                Delete Photo
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default PortfolioImageViewer;
