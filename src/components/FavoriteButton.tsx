import { useRef, useState } from "react";
import { Heart } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useFavorites, FavoriteItemType } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

interface FavoriteButtonProps {
  itemType: FavoriteItemType;
  itemId: string;
  size?: "sm" | "default" | "lg" | "icon";
  variant?: "default" | "ghost" | "outline";
  className?: string;
}

export const FavoriteButton = ({
  itemType,
  itemId,
  size = "icon",
  variant = "ghost",
  className,
}: FavoriteButtonProps) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useLanguage();
  const isFav = isFavorite(itemType, itemId);
  const [burst, setBurst] = useState(false);
  const burstTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    if (!isFav) {
      // uiverse-style like burst: pop + ripple ring
      setBurst(true);
      if (burstTimer.current) clearTimeout(burstTimer.current);
      burstTimer.current = setTimeout(() => setBurst(false), 550);
    }
    toggleFavorite(itemType, itemId);
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className={cn(
        "relative transition-all",
        isFav && "text-glam-rose hover:text-glam-rose-pressed",
        className
      )}
      aria-label={isFav ? t.favorites.removeFromFavorites : t.favorites.addToFavorites}
    >
      {burst && <span className="fav-ring" aria-hidden="true" />}
      <Heart
        size={20}
        weight={isFav ? "fill" : "regular"}
        className={cn("transition-all", burst && "fav-burst")}
      />
    </Button>
  );
};
