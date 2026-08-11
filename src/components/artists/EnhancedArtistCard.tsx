import React, { useState, useEffect } from "react";
import { MapPin, Clock, ShoppingBag, Star, Eye, Heart, SealCheck, ArrowRight } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ArtistWithPricing, getArtistPhoto } from "@/hooks/useArtistsWithPricing";
import BrandCover from "@/components/BrandCover";
import { cn } from "@/lib/utils";

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
  const coverImage = getArtistPhoto(artist);
  const hasPortfolioPreviews = artist.portfolio_previews && artist.portfolio_previews.length > 0;

  if (viewMode === "list") {
    return (
      <div
        onClick={() => navigate(`/artist/${artist.id}`)}
        className="bg-white rounded-xl border border-glam-border p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
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
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-white ${
                  availability.isAvailableToday ? "bg-glam-success" : "bg-glam-muted"
                }`}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-glam-ink">
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
              <div className="flex items-center gap-1 text-sm text-glam-muted mt-0.5">
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
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-glam-surface text-glam-muted rounded-full">
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
                <span className="text-sm text-glam-muted">
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
                <img src={img} alt="" loading="lazy" decoding="async" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid View — GLAM reference artist card
  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="bg-white rounded-3xl overflow-hidden shadow-sm border border-glam-border cursor-pointer h-full flex flex-col"
    >
      {/* Cover (no overflow-hidden so the badge can straddle the edge; the card root clips the corners) */}
      <div className="relative h-44 flex-shrink-0">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${artist.profile?.full_name}'s work`}
            loading="lazy"
            decoding="async"
            className="w-full h-full object-cover"
          />
        ) : (
          <BrandCover />
        )}

        {/* Top Rated pill */}
        {(artist.rating ?? 0) >= 4.5 && (
          <span className="absolute top-2.5 start-2.5 flex items-center gap-1 bg-white/95 rounded-full ps-2 pe-2.5 py-1 shadow-sm">
            <Star size={12} weight="fill" className="text-glam-rose" />
            <span className="text-[9px] font-bold tracking-[0.12em] text-glam-ink">
              {isRTL ? "الأعلى تقييمًا" : "TOP RATED"}
            </span>
          </span>
        )}

        {/* Favorite */}
        <div className="absolute top-2.5 end-2.5">
          <FavoriteButton
            itemType="artist"
            itemId={artist.id}
            className="bg-white hover:bg-white w-8 h-8 shadow-sm"
          />
        </div>

        {/* Curated badge straddling the cover edge */}
        <div className="absolute -bottom-7 end-3 z-10 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-white border border-glam-border shadow-md flex flex-col items-center justify-center">
            <Heart size={16} weight="fill" className="text-glam-rose mb-0.5" />
            <span className="text-[9px] font-bold text-glam-ink leading-none">
              {isRTL ? "مختارة" : "Curated"}
            </span>
            <span className="text-[9px] italic font-serif text-glam-secondary leading-none mt-0.5">
              {isRTL ? "بعناية" : "by GLAM"}
            </span>
          </div>
          <div className="w-4 h-2.5 bg-glam-blush-soft [clip-path:polygon(0_0,100%_0,50%_100%)]" />
        </div>
      </div>

      {/* Content */}
      <div className="px-3.5 pt-3 pb-3.5 text-start flex flex-col flex-grow">
        {/* Name + verified */}
        <div className="flex items-center gap-1.5 pe-14">
          <h3 className="font-serif font-bold text-glam-ink text-lg leading-snug line-clamp-1">
            {artist.profile?.full_name || "Unknown Artist"}
          </h3>
          <SealCheck size={20} weight="fill" className="text-glam-rose shrink-0" />
        </div>

        {/* Specialty */}
        {artist.categories && artist.categories.length > 0 && (
          <p className="text-xs text-glam-muted mt-0.5 line-clamp-1">
            {artist.categories.slice(0, 2).map((c) => getCategoryLabel(c)).join(" · ")}
          </p>
        )}

        {/* Rating + location */}
        <div className="flex items-center gap-1.5 mt-2">
          {artist.rating !== null ? (
            <>
              <Star size={14} weight="fill" className="text-glam-rose" />
              <span className="text-sm font-bold text-glam-ink">
                {Number(artist.rating).toFixed(1)}
              </span>
              <span className="text-xs text-glam-muted">({artist.total_reviews || 0})</span>
            </>
          ) : (
            <span className="text-xs text-glam-muted">{t.common?.new || "New"}</span>
          )}
          {artist.profile?.location && (
            <>
              <span className="w-px h-3.5 bg-glam-border mx-1" />
              <MapPin size={14} weight="fill" className="text-glam-rose shrink-0" />
              <span className="text-xs text-glam-secondary line-clamp-1">
                {artist.profile.location}
              </span>
            </>
          )}
        </div>

        {/* Category chips */}
        {artist.categories && artist.categories.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            {artist.categories.slice(0, 3).map((category) => (
              <span
                key={category}
                className="px-2.5 py-1 rounded-full bg-glam-surface text-glam-secondary text-[10px] font-medium"
              >
                {getCategoryLabel(category)}
              </span>
            ))}
            {artist.categories.length > 3 && (
              <span className="px-2.5 py-1 rounded-full bg-glam-surface text-glam-muted text-[10px] font-medium">
                +{artist.categories.length - 3}
              </span>
            )}
          </div>
        )}

        <div className="flex-grow" />

        {/* Actions */}
        <div className="flex gap-2 mt-3">
          <Button
            variant="outline"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(`/artist/${artist.id}`);
            }}
            className="flex-1 h-10 rounded-xl border-glam-ink/20 text-glam-ink hover:bg-glam-porcelain text-xs font-semibold shadow-none"
          >
            <Eye size={16} className="me-1 text-glam-ink" />
            {isRTL ? "عرض الملف" : "View Profile"}
          </Button>
          <Button
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              navigate(isSeller ? `/artist/${artist.id}` : `/booking/${artist.id}`);
            }}
            className="flex-1 h-10 rounded-xl bg-glam-ink hover:bg-glam-ink-pressed text-white text-xs font-semibold shadow-none"
          >
            {buttonLabel || t.bookings.bookNow}
            <ArrowRight className={cn("w-4 h-4 ms-1", isRTL && "rotate-180")} />
          </Button>
        </div>
      </div>
    </div>
  );
};

export { EnhancedArtistCard };
export default EnhancedArtistCard;
