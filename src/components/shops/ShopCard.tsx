import React from "react";
import { ShoppingBag, Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArtistWithPricing } from "@/hooks/useArtistsWithPricing";

interface ShopCardProps {
  shop: ArtistWithPricing;
}

const ShopCard = ({ shop }: ShopCardProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const coverImage = shop.featured_image || shop.profile?.avatar_url;

  return (
    <div
      onClick={() => navigate(`/artist/${shop.id}`)}
      className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-md transition-all cursor-pointer border border-border/50 flex gap-3 p-3"
    >
      {/* Shop Image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={shop.profile?.full_name || "Shop"}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-accent/30 to-accent/10 flex items-center justify-center">
            <ShoppingBag className="w-8 h-8 text-accent-foreground/40" />
          </div>
        )}
        <div className="absolute top-1 right-1">
          <FavoriteButton
            itemType="artist"
            itemId={shop.id}
            size="sm"
            className="w-6 h-6 bg-card/80 backdrop-blur-sm"
          />
        </div>
      </div>

      {/* Shop Info */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        <div className="flex items-center gap-1.5">
          <h3 className="font-semibold text-foreground text-sm line-clamp-1">
            {shop.profile?.full_name || "Unknown Shop"}
          </h3>
          <Badge
            variant="outline"
            className="text-[8px] px-1.5 py-0 bg-accent/10 text-accent-foreground border-accent/30 flex-shrink-0"
          >
            <ShoppingBag className="w-2 h-2 mr-0.5" />
            {isRTL ? "متجر" : "Shop"}
          </Badge>
        </div>

        {shop.profile?.location && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground mt-0.5">
            <MapPin className="w-3 h-3 flex-shrink-0" />
            <span className="line-clamp-1">{shop.profile.location}</span>
          </div>
        )}

        <div className="flex items-center gap-3 mt-1.5">
          {shop.rating !== null && (
            <div className="flex items-center gap-1 text-xs">
              <Star className="w-3 h-3 fill-primary text-primary" />
              <span className="font-medium">{Number(shop.rating).toFixed(1)}</span>
              <span className="text-muted-foreground text-[10px]">
                ({shop.total_reviews || 0})
              </span>
            </div>
          )}
          {shop.min_price && (
            <span className="text-xs font-medium text-primary">
              {t.artistsListing?.startingFrom || "From"} {shop.min_price} QAR
            </span>
          )}
        </div>
      </div>

      {/* Action */}
      <div className="flex items-center flex-shrink-0">
        <Button size="sm" variant="outline" className="text-xs px-3 h-8">
          {isRTL ? "تصفح" : "Browse"}
        </Button>
      </div>
    </div>
  );
};

export { ShopCard };
export default ShopCard;
