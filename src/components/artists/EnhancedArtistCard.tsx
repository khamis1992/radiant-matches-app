import React, { useState, useEffect } from "react";
import { MapPin, Clock, GitCompare, ShoppingBag, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ArtistWithPricing } from "@/hooks/useArtistsWithPricing";

interface EnhancedArtistCardProps {
  artist: ArtistWithPricing;
  availability?: {
    isAvailableToday: boolean;
    todayHours?: { start: string; end: string } | null;
  };
  viewMode: "grid" | "list";
  buttonLabel?: string;
}

const MAX_COMPARE_COUNT = 3;

const EnhancedArtistCard = ({
  artist,
  availability,
  viewMode,
  buttonLabel,
}: EnhancedArtistCardProps) => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { t, isRTL } = useLanguage();

  // Get current compare IDs from URL
  const [compareIds, setCompareIds] = useState<string[]>(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    return ids;
  });

  // Update compare IDs when URL changes
  useEffect(() => {
    const ids = searchParams.get("ids")?.split(",").filter(Boolean) || [];
    setCompareIds(ids);
  }, [searchParams]);

  const isCompared = compareIds.includes(artist.id);
  const canAddToCompare = compareIds.length < MAX_COMPARE_COUNT;

  const handleToggleCompare = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click

    let newIds: string[];
    if (isCompared) {
      // Remove from compare
      newIds = compareIds.filter(id => id !== artist.id);
    } else if (canAddToCompare) {
      // Add to compare
      newIds = [...compareIds, artist.id];
    } else {
      return; // Cannot add more than 3
    }

    // Update URL
    const newUrl = newIds.length > 0
      ? `/compare?ids=${newIds.join(",")}`
      : "/makeup-artists";

    navigate(newUrl, { replace: true });
  };

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      "Makeup": t.categories.makeup,
      "Hair Styling": t.categories.hairStyling,
      "Henna": t.categories.henna,
      "Lashes & Brows": t.categories.lashesBrows,
      "Nails": t.categories.nails,
      "Bridal": t.categories.bridal,
      "Photoshoot": t.categories.photoshoot,
    };
    return categoryMap[category] || category;
  };

  const isSeller = (artist as ArtistWithPricing & { account_type?: string }).account_type === "seller";
  const coverImage = artist.featured_image || artist.profile?.avatar_url;
  const hasPortfolioPreviews = artist.portfolio_previews && artist.portfolio_previews.length > 0;

  if (viewMode === "list") {
    return (
      <div
        onClick={() => navigate(`/artist/${artist.id}`)}
        className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-glam-blush-soft">
              <AvatarImage 
                src={artist.profile?.avatar_url || undefined} 
                alt={artist.profile?.full_name || "Artist"} 
              />
              <AvatarFallback className="text-lg bg-glam-blush-soft text-glam-ink">
                {artist.profile?.full_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            {availability && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
                  availability.isAvailableToday ? "bg-glam-success" : "bg-muted-foreground"
                }`}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">
                {artist.profile?.full_name || "Unknown Artist"}
              </h3>
              <Badge
                className={`text-[10px] px-1.5 py-0 ${
                  isSeller
                    ? "bg-glam-surface text-glam-secondary border border-glam-border"
                    : "bg-glam-porcelain text-glam-rose border border-glam-border"
                }`}
              >
                {isSeller ? (
                  <><ShoppingBag className="w-2.5 h-2.5 mr-0.5" />{isRTL ? "متجر" : "Shop"}</>
                ) : (
                  <>{isRTL ? "خبيرة" : "Expert"}</>
                )}
              </Badge>
              {availability?.isAvailableToday && (
                <Badge className="bg-glam-success hover:bg-glam-success text-white text-[10px] px-1.5 py-0">
                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                  {availability.todayHours
                    ? `${formatTime(availability.todayHours.start)} - ${formatTime(availability.todayHours.end)}`
                    : t.availability?.open || "Open"}
                </Badge>
              )}
            </div>
            
            {artist.profile?.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{artist.profile.location}</span>
              </div>
            )}
            
            {/* Categories */}
            {artist.categories && artist.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {artist.categories.slice(0, 3).map((category) => (
                  <span
                    key={category}
                    className="px-2 py-0.5 text-[10px] font-medium bg-glam-blush-soft text-glam-ink rounded-full"
                  >
                    {getCategoryLabel(category)}
                  </span>
                ))}
                {artist.categories.length > 3 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-full">
                    +{artist.categories.length - 3}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              {artist.rating !== null && (
                <div className="flex items-center gap-1 text-sm">
                  <span className="font-semibold text-glam-ink">{Number(artist.rating).toFixed(1)}</span>
                  {artist.total_reviews !== null && artist.total_reviews > 0 && (
                    <span className="text-glam-muted">({artist.total_reviews})</span>
                  )}
                </div>
              )}
              {artist.experience_years !== null && artist.experience_years > 0 && (
                <span className="text-sm text-muted-foreground">
                  {artist.experience_years} {artist.experience_years === 1 ? t.artistsListing.yearExp : t.artistsListing.yearsExp}
                </span>
              )}
              {artist.min_price && (
                <span className="text-sm font-medium text-glam-rose">
                  {t.artistsListing?.startingFrom || "From"} {artist.min_price} QAR
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <FavoriteButton itemType="artist" itemId={artist.id} size="sm" />
            <Button size="sm" className="shrink-0 bg-glam-ink hover:bg-glam-ink-pressed text-white">
              {t.artistsListing.view}
            </Button>
          </div>
        </div>

        {/* Portfolio Previews */}
        {hasPortfolioPreviews && (
          <div className="flex gap-2 mt-3 overflow-hidden">
            {artist.portfolio_previews!.slice(0, 3).map((img, idx) => (
              <div key={idx} className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid View
  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="bg-white rounded-xl overflow-hidden shadow-sm border border-glam-border cursor-pointer h-full flex flex-col"
    >
      {/* Cover Image */}
      <div className="relative h-24 sm:h-28 overflow-hidden flex-shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${artist.profile?.full_name}'s work`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full bg-muted" />
        )}
        
        {/* Favorite */}
        <div className={`absolute top-2 ${isRTL ? "left-2" : "right-2"}`}>
          <FavoriteButton
            itemType="artist"
            itemId={artist.id}
            className="bg-white/95 hover:bg-white w-7 h-7 shadow-sm"
          />
        </div>
      </div>

      {/* Avatar overlapping the cover's bottom-start edge */}
      <div className="relative flex justify-start ps-4 -mt-6">
        <Avatar className="w-12 h-12 border-2 border-card">
          <AvatarImage src={artist.profile?.avatar_url || undefined} alt={artist.profile?.full_name || ""} className="object-cover" />
          <AvatarFallback className="text-sm font-medium bg-glam-blush-soft text-glam-ink">
            {artist.profile?.full_name?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="px-3 pt-1.5 pb-3 text-start flex flex-col flex-grow">
        <h3 className="font-semibold text-foreground text-sm line-clamp-1">
          {artist.profile?.full_name || "Unknown Artist"}
        </h3>
        
        {/* Specialty text */}
        {artist.categories && artist.categories.length > 0 && (
          <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">
            {artist.categories.slice(0, 2).map(c => getCategoryLabel(c)).join(" · ")}
          </p>
        )}

        {/* Rating */}
        <div className="flex items-center gap-1 mt-1.5">
          {artist.rating !== null ? (
            <>
              <Star className="w-3 h-3 fill-glam-rose text-glam-rose" />
              <span className="text-xs font-semibold text-glam-ink">{Number(artist.rating).toFixed(1)}</span>
              <span className="text-glam-muted text-[10px]">({artist.total_reviews || 0})</span>
            </>
          ) : (
            <span className="text-[10px] text-muted-foreground">{t.common?.new || "New"}</span>
          )}
        </div>

        {/* Location */}
        {artist.profile?.location && (
          <div className="flex items-center gap-1 mt-1 text-glam-muted text-[11px]">
            <MapPin className="w-3 h-3" />
            <span className="line-clamp-1">{artist.profile.location}</span>
          </div>
        )}

        {/* Price */}
        {artist.min_price && (
          <p className="text-xs font-medium text-glam-rose mt-1">
            {t.artistsListing?.startingFrom || "From"} {artist.min_price} QAR
          </p>
        )}

        <div className="flex-grow" />

        {/* Book Button */}
        <Button className="w-full mt-2 text-xs h-9 rounded-full bg-glam-blush-soft text-glam-ink hover:bg-glam-blush font-semibold shadow-none" size="sm">
          {buttonLabel || t.bookings.bookNow}
        </Button>
      </div>
    </div>
  );
};

export { EnhancedArtistCard };
export default EnhancedArtistCard;
