import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useFavorites, FavoriteItemType } from "@/hooks/useFavorites";
import { cn } from "@/lib/utils";

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
  const isFav = isFavorite(itemType, itemId);

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    toggleFavorite(itemType, itemId);
  };

  return (
    <Button
      size={size}
      variant={variant}
      onClick={handleClick}
      className={cn(
        "transition-all",
        isFav && "text-destructive hover:text-destructive/80",
        className
      )}
      aria-label={isFav ? "Remove from favorites" : "Add to favorites"}
    >
      <Heart
        className={cn(
          "w-5 h-5 transition-all",
          isFav && "fill-current"
        )}
      />
    </Button>
  );
};
