import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CaretDown,
  Check,

  Heart,
  MagnifyingGlass,
  MapPin,
  SealCheck,
  ShieldCheck,
  ShoppingBag,
  SlidersHorizontal,
  Truck,
  Star,
  Storefront,
} from "@phosphor-icons/react";
import BottomNavigation from "@/components/BottomNavigation";
import { CategoryVideoCover } from "@/components/CategoryVideoCover";
import {
  useArtistsWithPricing,
  type ArtistWithPricing,
} from "@/hooks/useArtistsWithPricing";
import {
  useArtistsAvailability,
  type ArtistAvailability,
} from "@/hooks/useArtistAvailability";
import { useFavorites } from "@/hooks/useFavorites";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

/* ─────────────────────────── helpers ─────────────────────────── */

const isOpenNow = (availability?: ArtistAvailability): boolean | null => {
  if (!availability) return null;
  if (!availability.isAvailableToday || !availability.todayHours) return false;
  const now = new Date();
  const mins = now.getHours() * 60 + now.getMinutes();
  const [sh, sm] = availability.todayHours.start.split(":").map(Number);
  const [eh, em] = availability.todayHours.end.split(":").map(Number);
  return mins >= sh * 60 + (sm || 0) && mins <= eh * 60 + (em || 0);
};

const getSellerMeta = (seller: ArtistWithPricing, isRTL: boolean) => {
  const name = seller.profile?.full_name || (isRTL ? "محل" : "Shop");
  const photo =
    seller.featured_image ??
    seller.portfolio_previews?.[0] ??
    seller.profile?.avatar_url ??
    null;
  const avatar = seller.profile?.avatar_url || null;
  const location = seller.profile?.location || null;
  const categories = (seller.categories || [])
    .slice(0, 4)
    .map((c) => c.charAt(0).toUpperCase() + c.slice(1));
  return {
    name,
    photo,
    avatar,
    initials: name.trim().charAt(0),
    location,
    categories,
    rating: Number(seller.rating ?? 0),
    reviews: seller.total_reviews || 0,
  };
};

/* ─────────────────────────── pieces ─────────────────────────── */

const FilterPill = ({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: typeof Star;
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "flex h-10 shrink-0 items-center gap-1.5 rounded-full px-4 text-[13px] whitespace-nowrap transition-all duration-200 active:scale-95",
      selected
        ? "bg-glam-blush-soft text-glam-ink font-semibold"
        : "bg-white border border-glam-border/60 text-glam-secondary font-medium"
    )}
  >
    <Icon
      size={15}
      weight={selected ? "fill" : "regular"}
      className={selected ? "text-glam-rose" : "text-glam-muted"}
    />
    {label}
  </button>
);

const TrustPill = ({
  icon: Icon,
  label,
}: {
  icon: typeof Star;
  label: string;
}) => (
  <div className="flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-white border border-glam-border/60 px-4 text-[13px] font-medium text-glam-secondary whitespace-nowrap">
    <Icon size={15} className="text-glam-rose" />
    {label}
  </div>
);

const FeaturedShopCard = ({
  seller,
  availability,
}: {
  seller: ArtistWithPricing;
  availability?: ArtistAvailability;
}) => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const meta = getSellerMeta(seller, isRTL);
  const open = isOpenNow(availability);
  const favorite = isFavorite("artist", seller.id);
  const topRated = meta.rating >= 4.5;
  const goToShop = () => navigate(`/artist/${seller.id}`);

  return (
    <div className="rounded-[28px] border border-glam-border/60 bg-white p-3 [box-shadow:0_24px_48px_-20px_rgba(169,71,91,0.25)]">
      {/* Cover */}
      <div className="relative">
        {meta.photo ? (
          <img
            src={meta.photo}
            alt={meta.name}
            loading="lazy"
            className="w-full h-[224px] rounded-[20px] object-cover"
          />
        ) : (
          <div className="w-full h-[224px] rounded-[20px] bg-glam-blush-soft grid place-items-center">
            <Storefront size={44} weight="duotone" className="text-white/85" />
          </div>
        )}
        {topRated && (
          <span className="absolute top-3 start-3 flex h-8 items-center gap-1.5 rounded-full bg-white/95 backdrop-blur px-3 text-[11px] font-bold tracking-wide text-glam-ink shadow-md">
            <Star size={13} weight="fill" className="text-glam-rose" />
            {isRTL ? "الأعلى تقييمًا" : "TOP RATED"}
          </span>
        )}
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

      {/* Avatar + name */}
      <div className="relative z-10 -mt-9 flex items-end gap-3 px-2">
        {meta.avatar ? (
          <img
            src={meta.avatar}
            alt=""
            loading="lazy"
            className="h-[76px] w-[76px] shrink-0 rounded-full object-cover ring-4 ring-white bg-white shadow-lg"
          />
        ) : (
          <div className="grid h-[76px] w-[76px] shrink-0 place-items-center rounded-full bg-glam-blush-soft ring-4 ring-white shadow-lg">
            <span className="font-serif text-2xl font-bold text-glam-ink">
              {meta.initials}
            </span>
          </div>
        )}
        <div className="min-w-0 pb-1.5">
          <h3 className="flex items-center gap-1.5 font-serif text-[22px] leading-snug font-bold text-glam-ink">
            <span className="truncate">{meta.name}</span>
            <SealCheck size={20} weight="fill" className="shrink-0 text-glam-rose" />
          </h3>
          {meta.categories.length > 0 && (
            <p className="mt-0.5 truncate text-xs text-glam-muted">
              {meta.categories.join(" • ")}
            </p>
          )}
        </div>
      </div>

      {/* Meta row */}
      <div className="mt-3 flex items-center gap-1.5 px-2 text-[13px]">
        <Star size={15} weight="fill" className="text-glam-rose" />
        <span className="font-bold text-glam-ink">{meta.rating.toFixed(1)}</span>
        <span className="text-glam-muted">({meta.reviews})</span>
        {meta.location && (
          <>
            <span className="mx-1 h-3.5 w-px bg-glam-border" />
            <MapPin size={15} weight="fill" className="text-glam-rose shrink-0" />
            <span className="truncate text-glam-secondary">{meta.location}</span>
          </>
        )}
        {open !== null && (
          <span
            className={cn(
              "ms-auto flex shrink-0 items-center gap-1.5 text-[11px] font-semibold",
              open ? "text-glam-success" : "text-glam-muted"
            )}
          >
            <span
              className={cn(
                "h-1.5 w-1.5 rounded-full",
                open ? "bg-glam-success" : "bg-glam-muted"
              )}
            />
            {open
              ? isRTL
                ? "مفتوح الآن"
                : "Open now"
              : isRTL
                ? "مغلق الآن"
                : "Closed"}
          </span>
        )}
      </div>

      {/* Chips */}
      {meta.categories.length > 0 && (
        <div className="mt-3 flex flex-wrap gap-1.5 px-2">
          {meta.categories.map((c) => (
            <span
              key={c}
              className="rounded-full bg-glam-blush-soft/60 px-3 py-1 text-[11px] font-medium text-glam-ink"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Actions */}
      <div className="mt-4 flex gap-2.5 px-1 pb-1">

        <button
          onClick={goToShop}
          className="flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-glam-ink text-sm font-semibold text-white transition-all hover:bg-glam-ink-pressed active:scale-[0.98] [box-shadow:0_14px_28px_-12px_rgba(16,20,23,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
        >
          <ShoppingBag size={17} weight="bold" />
          {isRTL ? "تسوقي الآن" : "Shop Now"}
        </button>
      </div>
    </div>
  );
};

const CompactShopCard = ({
  seller,
}: {
  seller: ArtistWithPricing;
}) => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { isFavorite, toggleFavorite } = useFavorites();
  const meta = getSellerMeta(seller, isRTL);
  const favorite = isFavorite("artist", seller.id);
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
      className="relative flex gap-3 rounded-[24px] border border-glam-border/60 bg-white p-2.5 cursor-pointer transition-transform duration-200 active:scale-[0.99] [box-shadow:0_14px_30px_-16px_rgba(169,71,91,0.18)]"
    >
      {/* Photo + avatar on the corner */}
      <div className="relative w-[108px] shrink-0 self-stretch">
        {meta.photo ? (
          <img
            src={meta.photo}
            alt={meta.name}
            loading="lazy"
            className="absolute inset-0 h-full w-full rounded-[16px] object-cover"
          />
        ) : (
          <div className="absolute inset-0 rounded-[16px] bg-glam-blush-soft grid place-items-center">
            <Storefront size={28} weight="duotone" className="text-white/85" />
          </div>
        )}
        <div className="absolute -bottom-2 -end-3 h-12 w-12 overflow-hidden rounded-full ring-[3px] ring-white bg-white shadow-md grid place-items-center">
          {meta.avatar ? (
            <img
              src={meta.avatar}
              alt=""
              loading="lazy"
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="grid h-full w-full place-items-center bg-glam-blush-soft font-serif text-base font-bold text-glam-ink">
              {meta.initials}
            </span>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="min-w-0 flex-1 py-1 pe-8 ps-2">
        <h3 className="flex items-center gap-1 font-serif text-[17px] leading-snug font-bold text-glam-ink">
          <span className="truncate">{meta.name}</span>
          <SealCheck size={16} weight="fill" className="shrink-0 text-glam-rose" />
        </h3>
        {meta.categories.length > 0 && (
          <p className="mt-0.5 truncate text-[11px] text-glam-muted">
            {meta.categories.slice(0, 2).join(" • ")}
          </p>
        )}
        <div className="mt-1.5 flex items-center gap-1.5 text-[12px]">
          <Star size={13} weight="fill" className="text-glam-rose shrink-0" />
          <span className="font-bold text-glam-ink">{meta.rating.toFixed(1)}</span>
          <span className="text-glam-muted">({meta.reviews})</span>
          {meta.location && (
            <>
              <span className="mx-0.5 h-3 w-px bg-glam-border" />
              <MapPin size={13} weight="fill" className="text-glam-rose shrink-0" />
              <span className="truncate text-glam-secondary">{meta.location}</span>
            </>
          )}
        </div>
        {meta.categories.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1">
            {meta.categories.slice(0, 4).map((c) => (
              <span
                key={c}
                className="rounded-full bg-glam-blush-soft/60 px-2 py-0.5 text-[10px] font-medium text-glam-ink"
              >
                {c}
              </span>
            ))}
          </div>
        )}
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
        className="absolute top-2.5 end-2.5 grid h-8 w-8 place-items-center rounded-full transition-transform duration-200 active:scale-90"
      >
        <Heart
          size={19}
          weight={favorite ? "fill" : "regular"}
          className={cn(
            "transition-colors",
            favorite ? "text-glam-rose" : "text-glam-muted"
          )}
        />
      </button>
    </div>
  );
};

/* ─────────────────────────── page ─────────────────────────── */

type SortKey = "rating" | "reviews" | "name";

const SORT_OPTIONS: { key: SortKey; en: string; ar: string }[] = [
  { key: "rating", en: "Highest Rated", ar: "الأعلى تقييمًا" },
  { key: "reviews", en: "Most Reviewed", ar: "الأكثر مراجعات" },
  { key: "name", en: "Name A–Z", ar: "الاسم أ–ي" },
];

const Shops = () => {
  const navigate = useNavigate();
  const { isRTL } = useLanguage();
  const { data: artists, isLoading } = useArtistsWithPricing();
  const [searchQuery, setSearchQuery] = useState("");
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [nearbyOnly, setNearbyOnly] = useState(false);
  const [sortBy, setSortBy] = useState<SortKey>("rating");
  const [sortOpen, setSortOpen] = useState(false);
  const debouncedSearch = useDebounce(searchQuery, 300);
  const BackArrow = ArrowLeft;

  const sellers = useMemo(() => {
    if (!artists) return [];
    let result = artists.filter(
      (artist) =>
        (artist as ArtistWithPricing & { account_type?: string }).account_type === "seller"
    );
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.profile?.full_name?.toLowerCase().includes(q) ||
          a.profile?.location?.toLowerCase().includes(q) ||
          a.bio?.toLowerCase().includes(q)
      );
    }
    if (topRatedOnly) {
      result = result.filter((a) => Number(a.rating ?? 0) >= 4.5);
    }
    if (nearbyOnly) {
      result = result.filter((a) => !!a.profile?.location);
    }
    const sorted = [...result];
    if (sortBy === "rating") {
      sorted.sort((a, b) => Number(b.rating ?? 0) - Number(a.rating ?? 0));
    } else if (sortBy === "reviews") {
      sorted.sort((a, b) => (b.total_reviews || 0) - (a.total_reviews || 0));
    } else {
      sorted.sort((a, b) =>
        (a.profile?.full_name || "").localeCompare(b.profile?.full_name || "")
      );
    }
    return sorted;
  }, [artists, debouncedSearch, topRatedOnly, nearbyOnly, sortBy]);

  const sellerIds = useMemo(() => sellers.map((s) => s.id), [sellers]);
  const { data: availabilityMap } = useArtistsAvailability(sellerIds);

  const [featured, ...rest] = sellers;

  return (
    <div className="min-h-screen bg-glam-porcelain pb-32">
      {/* ─── Header ─── */}
      <div className="relative px-5 pt-[410px]">
        <div className="safe-area-top absolute inset-x-5 top-0 z-20 flex items-center justify-between pt-4">
          <button
            onClick={() => navigate(-1)}
            aria-label={isRTL ? "رجوع" : "Back"}
            className="grid h-11 w-11 place-items-center rounded-full border border-glam-border/60 bg-white/95 shadow-md backdrop-blur-sm transition-transform active:scale-95"
          >
            <BackArrow
              size={18}
              className={cn("text-glam-ink", isRTL && "rotate-180")}
            />
          </button>
          <img
            src="/brand/glam-logo-light.png"
            alt="GLAM"
            className="box-content h-7 rounded-full border border-glam-border/60 bg-white/95 px-4 py-2 object-contain shadow-md backdrop-blur-sm"
          />
        </div>

        <div className="absolute inset-x-0 top-0 h-[390px] overflow-hidden rounded-b-[36px] bg-glam-surface shadow-sm">
          <CategoryVideoCover
            src="/videos/shops/shops-hero.mp4"
            poster="/videos/shops/shops-hero-start.png"
            label={isRTL ? "مجموعة منتجات تجميل مختارة" : "Curated beauty product collection"}
            className="object-[58%_center]"
          />
          <div className="hidden">
            <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-glam-ink">
              {isRTL ? "مختارات GLAM" : "THE GLAM EDIT"}
            </span>
          </div>
        </div>

        <div className="absolute right-4 top-[92px] z-20 w-[47%] rounded-3xl border border-white/70 bg-white/78 p-4 text-right shadow-md backdrop-blur-md">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-glam-rose">
            {isRTL ? "متاجر GLAM" : "GLAM SHOPS"}
          </p>
          <h1 className="mt-3 font-serif text-[32px] font-bold leading-[1.15] tracking-tight text-glam-ink">
            {isRTL ? "الجمال، بانتقاءٍ يليق بكِ." : "Beauty, beautifully curated."}
          </h1>
          <p className="mt-3 text-[12px] font-medium leading-relaxed text-glam-ink">
            {isRTL
              ? "محلات مستقلة، وتوصيلٌ منّا لبابك."
              : "Independent shops, delivered to your door."}
          </p>
        </div>

        {/* ─── Filter pills ─── */}
        <div className="mt-5 -mx-5 px-5 flex gap-2 overflow-x-auto scrollbar-hide pb-1">
          <FilterPill
            icon={Star}
            label={isRTL ? "الأعلى تقييمًا" : "Top Rated"}
            selected={topRatedOnly}
            onClick={() => setTopRatedOnly((v) => !v)}
          />
          <FilterPill
            icon={MapPin}
            label={isRTL ? "القريبة" : "Nearby"}
            selected={nearbyOnly}
            onClick={() => setNearbyOnly((v) => !v)}
          />
          <TrustPill
            icon={ShieldCheck}
            label={isRTL ? "دفع آمن" : "Secure payment"}
          />
          <TrustPill
            icon={Truck}
            label={isRTL ? "توصيل لبابك" : "Doorstep delivery"}
          />
        </div>

        {/* ─── Search + sort ─── */}
        <div className="mt-4 flex items-center gap-2.5">
          <div className="relative flex-1">
            <MagnifyingGlass
              size={17}
              className="absolute start-4 top-1/2 -translate-y-1/2 text-glam-muted"
            />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isRTL ? "ابحثي عن محلات في قطر.." : "Search shops in Qatar.."
              }
              className="h-12 w-full rounded-full bg-white border border-glam-border/60 ps-11 pe-4 text-sm text-glam-ink shadow-sm outline-none transition-colors placeholder:text-glam-muted focus:border-glam-ink/30"
            />
          </div>
          <div className="relative">
            <button
              onClick={() => setSortOpen((v) => !v)}
              aria-label={isRTL ? "ترتيب" : "Sort"}
              aria-expanded={sortOpen}
              className="grid h-12 w-12 place-items-center rounded-full bg-glam-ink text-white transition-all hover:bg-glam-ink-pressed active:scale-95 [box-shadow:0_12px_24px_-10px_rgba(16,20,23,0.45),inset_0_1px_0_rgba(255,255,255,0.12)]"
            >
              <SlidersHorizontal size={19} weight="bold" />
            </button>
            {sortOpen && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setSortOpen(false)}
                />
                <div className="absolute end-0 top-full z-50 mt-2 w-52 rounded-2xl border border-glam-border/60 bg-white p-1.5 shadow-xl animate-fade-in">
                  <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wide text-glam-muted">
                    {isRTL ? "ترتيب حسب" : "Sort by"}
                  </p>
                  {SORT_OPTIONS.map((o) => {
                    const active = sortBy === o.key;
                    return (
                      <button
                        key={o.key}
                        onClick={() => {
                          setSortBy(o.key);
                          setSortOpen(false);
                        }}
                        className={cn(
                          "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-[13px] transition-colors",
                          active
                            ? "bg-glam-blush-soft/60 font-semibold text-glam-ink"
                            : "text-glam-secondary hover:bg-glam-surface"
                        )}
                      >
                        {isRTL ? o.ar : o.en}
                        {active && (
                          <Check size={15} weight="bold" className="text-glam-rose" />
                        )}
                      </button>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="px-5 mt-6">
        {isLoading ? (
          <div className="space-y-3.5">
            <Skeleton className="h-[380px] rounded-[28px]" />
            <Skeleton className="h-[120px] rounded-[24px]" />
            <Skeleton className="h-[120px] rounded-[24px]" />
          </div>
        ) : sellers.length > 0 ? (
          <>
            <p className="mb-3.5 text-xs text-glam-muted font-medium">
              {isRTL
                ? `عرض ${sellers.length} ${sellers.length === 1 ? "محل" : "محلات"}`
                : `Showing ${sellers.length} shop${sellers.length !== 1 ? "s" : ""}`}
            </p>
            <div className="space-y-3.5">
              {featured && (
                <div className="animate-fade-in">
                  <FeaturedShopCard
                    seller={featured}
                    availability={availabilityMap?.get(featured.id)}
                  />
                </div>
              )}
              {rest.map((seller, index) => (
                <div
                  key={seller.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${(index + 1) * 70}ms` }}
                >
                  <CompactShopCard seller={seller} />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-20">
            <div className="mx-auto mb-4 grid h-20 w-20 place-items-center rounded-3xl bg-glam-blush-soft/60">
              <Storefront size={36} weight="duotone" className="text-glam-rose" />
            </div>
            <h3 className="mb-1 text-base font-semibold text-glam-ink">
              {isRTL ? "لا توجد محلات" : "No shops found"}
            </h3>
            <p className="mx-auto max-w-[240px] text-sm text-glam-muted">
              {isRTL
                ? "جرّبي تعديل البحث أو الفلاتر"
                : "Try adjusting your search or filters"}
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Shops;
