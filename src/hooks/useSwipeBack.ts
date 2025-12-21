import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";

interface SwipeBackOptions {
  threshold?: number;
  enabled?: boolean;
  onSwipeBack?: () => void;
}

export function useSwipeBack({
  threshold = 100,
  enabled = true,
  onSwipeBack,
}: SwipeBackOptions = {}) {
  const navigate = useNavigate();
  const touchStartX = useRef<number | null>(null);
  const touchStartY = useRef<number | null>(null);

  useEffect(() => {
    if (!enabled) return;

    const handleTouchStart = (e: TouchEvent) => {
      touchStartX.current = e.touches[0].clientX;
      touchStartY.current = e.touches[0].clientY;
    };

    const handleTouchEnd = (e: TouchEvent) => {
      if (touchStartX.current === null || touchStartY.current === null) return;

      const touchEndX = e.changedTouches[0].clientX;
      const touchEndY = e.changedTouches[0].clientY;
      
      const deltaX = touchEndX - touchStartX.current;
      const deltaY = Math.abs(touchEndY - touchStartY.current);

      // Only trigger if horizontal swipe is dominant and starts from left edge
      if (deltaX > threshold && deltaY < 100 && touchStartX.current < 50) {
        if (onSwipeBack) {
          onSwipeBack();
        } else {
          navigate(-1);
        }
      }

      touchStartX.current = null;
      touchStartY.current = null;
    };

    document.addEventListener("touchstart", handleTouchStart, { passive: true });
    document.addEventListener("touchend", handleTouchEnd, { passive: true });

    return () => {
      document.removeEventListener("touchstart", handleTouchStart);
      document.removeEventListener("touchend", handleTouchEnd);
    };
  }, [enabled, threshold, navigate, onSwipeBack]);
}
