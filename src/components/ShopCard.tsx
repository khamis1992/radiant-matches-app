import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, Heart, MapPin, Star, Storefront } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/hooks/useFavorites";
import { getArtistPhoto, type ArtistWithPricing } from "@/hooks/useArtistsWithPricing";
import type { ArtistAvailability } from "@/hooks/useArtistAvailability";

interface ShopCardProps {
  seller: ArtistWithPricing;
  availability?: ArtistAvailability;
}

const isOpenNow = (availability?: ArtistAvailability): boolean | null => {
  if (!availability) return null;
  if (!availability.isAvailableToday || !availability.todayHours) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = availability.todayHours.start.split(":").map(Number);
  const [eh, em] = availability.todayHours.end.split(":").map(Number);
  return mins >= sh * 60 + (sm || 0) && mins <= eh * 60 + (em || 0);
};

export const ShopCard = ({ seller, availability }: ShopCardProps) => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();

  const name = seller.profile?.full_name || (isRTL ? "متجر" : "Shop");
  const photo = getArtistPhoto(seller);
  const avatar = seller.profile?.avatar_url || null;
  const location = seller.profile?.location || null;
  const categories = (seller.categories || [])
    .slice(0, 4)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  const open = isOpenNow(availability);
  const favorite = isFavorite("artist", seller.id);
  const Arrow = isRTL ? ArrowLeft : ArrowRight;

  const goToShop = () => navigate(`/artist/${seller.id}`);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={goToShop}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          goToShop();
        }
      }}
      className="relative flex gap-3.5 rounded-[26px] border border-glam-border/60 bg-white p-3 cursor-pointer transition-transform duration-200 active:scale-[0.99] [box-shadow:0_18px_40px_-18px_rgba(169,71,91,0.22)]"
    >
      {/* Photo + overlapping shop avatar */}
      <div className="relative w-[128px] shrink-0 self-stretch">
        {photo ? (
          <img
            src={photo}
            alt={name}
            loading="lazy"
            draggable={false}
            className="absolute inset-0 h-full w-full rounded-[20px] object-cover"
          />
        ) : (
          <div className="absolute inset-0 rounded-[20px] bg-glam-blush-soft flex items-center justify-center">
            <Storefront size={32} weight="duotone" className="text-white/85" />
          </div>
        )}
        {avatar && (
          <img
            src={avatar}
            alt=""
            aria-hidden="true"
            loading="lazy"
            draggable={false}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 h-16 w-16 rounded-full object-cover ring-[3px] ring-white/80 bg-white/75 backdrop-blur-sm shadow-xl"
          />
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 flex flex-col py-0.5">
        <h3 className="font-serif text-[20px] leading-snug font-bold text-glam-ink truncate pe-10">
          {name}
        </h3>

        <div className="mt-1 flex items-center gap-1.5">
          <Star size={14} weight="fill" className="text-glam-rose" />
          <span className="text-[13px] font-bold text-glam-ink">
            {Number(seller.rating ?? 0).toFixed(1)}
          </span>
          <span className="text-[11px] text-glam-muted">
            ({seller.total_reviews || 0})
          </span>
        </div>

        {location && (
          <div className="mt-1 flex items-center gap-1.5 text-glam-secondary">
            <MapPin size={14} weight="fill" className="text-glam-rose shrink-0" />
            <span className="text-xs truncate">{location}</span>
          </div>
        )}

        {categories.length > 0 && (
          <p className="mt-1 text-[11px] text-glam-muted truncate">
            {categories.join(" • ")}
          </p>
        )}

        {open !== null && (
          <div className="mt-1.5 flex items-center gap-1.5">
            <span
              className={cn(
                "w-1.5 h-1.5 rounded-full",
                open ? "bg-glam-success" : "bg-glam-muted"
              )}
            />
            <span
              className={cn(
                "text-[11px] font-semibold",
                open ? "text-glam-success" : "text-glam-muted"
              )}
            >
              {open
                ? isRTL
                  ? "مفتوح الآن"
                  : "Open now"
                : isRTL
                  ? "مغلق الآن"
                  : "Closed now"}
            </span>
          </div>
        )}

        <button
          onClick={(e) => {
            e.stopPropagation();
            goToShop();
          }}
          className="mt-auto pt-2.5"
        >
          <span className="relative flex h-11 items-center justify-center rounded-full bg-glam-ink text-white text-sm font-semibold transition-all duration-200 hover:bg-glam-ink-pressed active:scale-[0.98] [box-shadow:0_12px_24px_-10px_rgba(16,20,23,0.4),inset_0_1px_0_rgba(255,255,255,0.12)]">
            {isRTL ? "تسوق الآن" : "Shop Now"}
            <span className="absolute end-4 grid place-items-center">
            <Arrow size={18} weight="bold" />
            </span>
          </span>
        </button>
      </div>

      {/* Favorite */}
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite("artist", seller.id);
        }}
        aria-label={
          favorite
            ? isRTL
              ? "إزالة من المفضلة"
              : "Remove from favorites"
            : isRTL
              ? "إضافة إلى المفضلة"
              : "Add to favorites"
        }
        aria-pressed={favorite}
        className="absolute top-3 end-3 h-9 w-9 rounded-full bg-white grid place-items-center transition-transform duration-200 active:scale-90 [box-shadow:0_8px_18px_-6px_rgba(16,20,23,0.2)]"
      >
        <Heart
          size={18}
          weight={favorite ? "fill" : "regular"}
          className="text-glam-rose transition-colors"
        />
      </button>
    </div>
  );
};

export default ShopCard;
