import { useState, useRef, useEffect } from "react";
import { Clock, ChevronDown, ChevronRight, Pencil, Trash2, Check, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatQAR } from "@/lib/locale";

interface ServiceCardProps {
  name: string;
  description?: string;
  price: number;
  duration: number;
  category?: string;
  isActive: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive?: () => void;
}

export const SwipeableServiceCard = ({
  name,
  description,
  price,
  duration,
  category,
  isActive,
  onEdit,
  onDelete,
  onToggleActive,
}: ServiceCardProps) => {
  const [translateX, setTranslateX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actionType, setActionType] = useState<"edit" | "delete" | null>(null);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const cardRef = useRef<HTMLDivElement>(null);
  const actionTriggeredRef = useRef(false);

  const SWIPE_THRESHOLD = 80;
  const ACTION_WIDTH = 80;

  const handleTouchStart = (e: React.TouchEvent) => {
    if (actionTriggeredRef.current) return;
    const touch = e.touches[0];
    touchStartX.current = touch.clientX;
    touchStartY.current = touch.clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging || actionTriggeredRef.current) return;

    const touch = e.touches[0];
    const deltaX = touch.clientX - touchStartX.current;
    const deltaY = Math.abs(touch.clientY - touchStartY.current);

    // Only process horizontal swipes
    if (deltaY < 50) {
      const clampedX = Math.max(-ACTION_WIDTH, Math.min(ACTION_WIDTH, deltaX));
      setTranslateX(clampedX);

      // Show action preview
      if (clampedX > 40) {
        setActionType("edit");
        setShowActions(true);
      } else if (clampedX < -40) {
        setActionType("delete");
        setShowActions(true);
      } else {
        setActionType(null);
        setShowActions(false);
      }
    }
  };

  const handleTouchEnd = () => {
    if (!isDragging || actionTriggeredRef.current) return;

    setIsDragging(false);

    // Trigger action if threshold passed
    if (Math.abs(translateX) > SWIPE_THRESHOLD) {
      actionTriggeredRef.current = true;

      if (translateX > 0) {
        onEdit();
      } else {
        onDelete();
      }

      // Reset after action
      setTimeout(() => {
        setTranslateX(0);
        setShowActions(false);
        setActionType(null);
        actionTriggeredRef.current = false;
      }, 300);
    } else {
      // Spring back
      setTranslateX(0);
      setShowActions(false);
      setActionType(null);
    }
  };

  const handleLongPress = () => {
    // Show quick actions menu (can be implemented later)
    if (onToggleActive) {
      onToggleActive();
    }
  };

  let longPressTimer: NodeJS.Timeout;
  const handleMouseDown = () => {
    longPressTimer = setTimeout(handleLongPress, 500);
  };

  const handleMouseUp = () => {
    clearTimeout(longPressTimer);
  };

  return (
    <div
      ref={cardRef}
      className={cn(
        "relative overflow-hidden rounded-xl transition-transform active:scale-[0.98]",
        !isActive && "opacity-60"
      )}
      style={{ minHeight: "88px" }}
    >
      {/* Swipe Actions Background */}
      <div className="absolute inset-0 flex">
        {/* Edit Action (Left/Right based on RTL) */}
        <div
          className={cn(
            "absolute inset-y-0 flex items-center justify-center transition-colors",
            actionType === "edit" ? "bg-green-500" : "bg-green-500/80"
          )}
          style={{ width: ACTION_WIDTH, right: 0 }}
        >
          <Pencil className="w-5 h-5 text-white" />
        </div>

        {/* Delete Action */}
        <div
          className={cn(
            "absolute inset-y-0 flex items-center justify-center transition-colors",
            actionType === "delete" ? "bg-destructive" : "bg-destructive/80"
          )}
          style={{ width: ACTION_WIDTH, left: 0 }}
        >
          <Trash2 className="w-5 h-5 text-white" />
        </div>
      </div>

      {/* Card Content */}
      <div
        className={cn(
          "relative bg-card border border-border rounded-xl p-4 transition-transform duration-200",
          isDragging && "transition-none"
        )}
        style={{
          transform: `translateX(${translateX}px)`,
        }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseDown={handleMouseDown}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Active Status Indicator */}
        <div
          className={cn(
            "absolute left-0 top-0 bottom-0 w-1 rounded-l-xl",
            isActive ? "bg-primary" : "bg-muted-foreground"
          )}
        />

        {/* Content */}
        <div className="pl-3">
          {/* Top Row: Name + Price */}
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground text-base truncate pr-2">
                {name}
              </h3>
              {category && (
                <span className="text-xs text-primary mt-0.5 inline-block">
                  {category}
                </span>
              )}
            </div>
            <div className="text-right shrink-0">
              <div className="font-bold text-primary text-lg">
                {formatQAR(price)}
              </div>
            </div>
          </div>

          {/* Description (if exists) */}
          {description && (
            <p className="text-sm text-muted-foreground mt-1 line-clamp-1 pr-2">
              {description}
            </p>
          )}

          {/* Bottom Row: Duration + Inactive Badge */}
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
              <Clock className="w-3.5 h-3.5" />
              <span>{duration} min</span>
            </div>

            {!isActive && (
              <span className="text-xs bg-muted text-muted-foreground px-2 py-0.5 rounded-full">
                Inactive
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Swipe Hints */}
      {showActions && !actionTriggeredRef.current && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-between px-4">
          {translateX < 0 && (
            <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded">
              ← Delete
            </span>
          )}
          {translateX > 0 && (
            <span className="text-white text-xs font-medium bg-black/30 px-2 py-1 rounded">
              Edit →
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default SwipeableServiceCard;
