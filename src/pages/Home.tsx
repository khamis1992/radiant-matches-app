import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { CaretRight } from "@phosphor-icons/react";
import CategoryCard from "@/components/CategoryCard";
import { EnhancedArtistCard } from "@/components/artists/EnhancedArtistCard";
import BottomNavigation from "@/components/BottomNavigation";
import { ShopCard } from "@/components/ShopCard";
import AppHeader from "@/components/layout/AppHeader";
import { HeroSection } from "@/components/HeroSection";
import LottieIcon from "@/components/LottieIcon";
import { useArtistsWithPricing } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationsCount } from "@/hooks/useArtistNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { QueryErrorState } from "@/components/QueryErrorState";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
type ArtistMeta = { account_type?: string; categories?: string[] };

import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";

const getCategoryTranslations = (t: ReturnType<typeof useLanguage>["t"]) => [
  { name: t.categories.makeup, image: categoryMakeup, video: "/videos/categories/makeup.mp4", key: "Makeup" },
  { name: t.categories.hairStyling, image: categoryHairstyling, video: "/videos/categories/hairstyling.mp4", key: "Hair Styling" },
  { name: t.categories.henna, image: categoryHenna, video: "/videos/categories/henna.mp4", key: "Henna" },
  { name: t.categories.lashesBrows, image: categoryLashes, video: "/videos/categories/lashes.mp4", key: "Lashes & Brows" },
  { name: t.categories.nails, image: categoryNails, video: "/videos/categories/nails.mp4", key: "Nails" },
  { name: t.categories.bridal, image: categoryBridal, video: "/videos/categories/bridal.mp4", key: "Bridal" },
  { name: t.categories.photoshoot, image: categoryPhotoshoot, video: "/videos/categories/photoshoot.mp4", key: "Photoshoot" },
];

/* ─── Section Header ─── */
const SectionHeader = ({
  title,
  actionText,
  onAction,
  icon,
  iconImage,
  iconAnimation,
  iconAlt,
  accentClass,
  featured = false,
  subtitle,
  progress,
  showIndicator = false,
  isRTL = false,
}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  iconImage?: string;
  iconAnimation?: string;
  iconAlt?: string;
  accentClass?: string;
  featured?: boolean;
  subtitle?: string;
  progress?: number;
  showIndicator?: boolean;
  isRTL?: boolean;
}) => (
  <div
    className={featured
      ? "mb-3 flex min-h-16 items-center justify-between gap-3 px-5"
      : "mb-3 flex items-center justify-between px-5"
    }
  >
    <div className={featured ? "flex min-w-0 flex-1 items-center gap-3" : "flex items-center gap-2.5"}>
      {iconAnimation ? (
        <div className={featured
          ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-glam-surface"
          : "flex h-11 w-11 shrink-0 items-center justify-center"
        }>
          <LottieIcon
            src={iconAnimation}
            loop={false}
            playWhenVisible
            className={featured ? "h-11 w-11" : "h-10 w-10"}
            fallback={
              iconImage ? (
                <img
                  src={iconImage}
                  alt={iconAlt || ""}
                  className={featured ? "h-11 w-11 object-contain" : "h-10 w-10 object-contain"}
                  loading="lazy"
                />
              ) : null
            }
          />
        </div>
      ) : iconImage ? (
        <div className={featured
          ? "flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-glam-surface"
          : "flex h-11 w-11 shrink-0 items-center justify-center"
        }>
          <img
            src={iconImage}
            alt={iconAlt || ""}
            className={featured ? "h-11 w-11 object-contain" : "h-10 w-10 object-contain"}
            loading="lazy"
          />
        </div>
      ) : icon ? (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accentClass || "bg-glam-surface"}`}>
          {icon}
        </div>
      ) : null}
      <div className="min-w-0">
        <h2 className={featured ? "text-[17px] font-bold leading-5 text-glam-ink" : "text-[15px] font-bold text-glam-ink"}>{title}</h2>
        {featured && subtitle && (
          <p className="mt-0.5 truncate text-[11px] leading-4 text-glam-muted">{subtitle}</p>
        )}
        {featured && (showIndicator || typeof progress === "number") && (
          <div
            role={typeof progress === "number" ? "progressbar" : undefined}
            aria-hidden={typeof progress !== "number" ? true : undefined}
            aria-label={typeof progress === "number" ? (isRTL ? "موضع بطاقات الفنانات" : "Artist cards position") : undefined}
            aria-valuemin={typeof progress === "number" ? 0 : undefined}
            aria-valuemax={typeof progress === "number" ? 100 : undefined}
            aria-valuenow={typeof progress === "number" ? Math.round(progress * 100) : undefined}
            className="mt-2 h-1 w-16 overflow-hidden rounded-full bg-glam-border"
          >
            <span
              aria-hidden="true"
              className="block h-full w-full origin-left rounded-full bg-glam-rose transition-transform duration-200 motion-reduce:transition-none rtl:origin-right"
              style={{ transform: `scaleX(${Math.max(0.2, progress ?? 0.2)})` }}
            />
          </div>
        )}
      </div>
    </div>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className={featured
          ? "group flex h-11 shrink-0 items-center gap-2 rounded-full text-xs font-semibold text-glam-rose focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
          : "flex items-center gap-0.5 text-xs text-glam-rose font-semibold active:opacity-70"
        }
      >
        {actionText}
        {featured ? (
          <span className="grid h-11 w-11 place-items-center rounded-full bg-glam-rose text-white transition-transform group-active:scale-95 motion-reduce:transition-none">
            <CaretRight size={17} weight="bold" className="rtl:-scale-x-100" />
          </span>
        ) : (
          <CaretRight size={14} className="rtl:-scale-x-100" />
        )}
      </button>
    )}
  </div>
);

/* ─── Filter Tabs ─── */
/* ─── Promotions Carousel ─── */
/* ─── Promotions Carousel ─── */
// Owner-curated GLAM brand banners bundled with the app.
// To restore DB-driven banners from the admin panel, replace LOCAL_BANNERS
// with the useActiveBanners() query data.
const LOCAL_BANNERS = [
  {
    id: "local-first-booking",
    image_url: "/banners/promo-first-booking.jpg",
    title: "20% OFF",
    title_ar: "خصم 20%",
    subtitle: "On your first booking",
    subtitle_ar: "على حجزك الأول",
    button_text: "Book Now",
    button_text_ar: "احجزي الآن",
    link_url: "/makeup-artists",
  },
  {
    id: "local-bridal",
    image_url: "/banners/promo-bridal.jpg",
    title: "Bridal Perfection",
    title_ar: "إطلالة زفاف مثالية",
    subtitle: "Your special day, beautifully extraordinary",
    subtitle_ar: "يومكِ المميز، بجمال استثنائي",
    button_text: "Book Bridal",
    button_text_ar: "احجزي لزفافك",
    link_url: "/makeup-artists?category=Bridal",
  },
  {
    id: "local-nails",
    image_url: "/banners/promo-nails.jpg",
    title: "Nail Art Special",
    title_ar: "عرض فن الأظافر",
    subtitle: "20% off all nail services",
    subtitle_ar: "خصم 20% على جميع خدمات الأظافر",
    button_text: "Get Offer",
    button_text_ar: "احصلي على العرض",
    link_url: "/makeup-artists?category=Nails",
  },
];

const PromotionsCarousel = ({
  navigate,
}: {
  navigate: (path: string) => void;
}) => {
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <section className="px-5 pb-5">
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent>
          {LOCAL_BANNERS.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative overflow-hidden rounded-2xl h-[160px]">
                <img
                  src={banner.image_url}
                  alt={isAr ? banner.title_ar : banner.title}
                  className="absolute inset-0 w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10" />
                <div
                  className="relative z-10 p-5 flex flex-col justify-center items-start h-full text-start"
                >
                  <div className="space-y-1.5">
                    <h3 className="text-lg font-bold text-white drop-shadow-lg">
                      {isAr ? banner.title_ar : banner.title}
                    </h3>
                    <p className="text-xs text-white/80 drop-shadow">
                      {isAr ? banner.subtitle_ar : banner.subtitle}
                    </p>
                    <button
                      onClick={() => navigate(banner.link_url)}
                      className="mt-1.5 bg-white text-glam-ink px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-white/90 transition-colors"
                    >
                      {isAr ? banner.button_text_ar : banner.button_text}
                    </button>
                  </div>
                </div>
              </div>
            </CarouselItem>
          ))}
        </CarouselContent>
        <CarouselDots />
      </Carousel>
    </section>
  );
};

/* ─── Artist Loading Skeleton ─── */
const ArtistSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-glam-border">
    <Skeleton className="h-44 w-full" />
    <div className="p-3.5 space-y-2.5">
      <Skeleton className="h-4 w-28" />
      <Skeleton className="h-3 w-20" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-10 w-full mt-1 rounded-xl" />
    </div>
  </div>
);

/* ═══════════════════════════════════
   HOME PAGE
   ═══════════════════════════════════ */
const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArtist, loading: roleLoading } = useUserRole();
  const { data: artists, isLoading, isError, refetch } = useArtistsWithPricing();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";
  const [artistRailProgress, setArtistRailProgress] = useState(0);

  const categories = getCategoryTranslations(t);

  // Filter artists (experts only)
  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    return artists.filter((a) => (a as typeof a & ArtistMeta).account_type !== "seller");
  }, [artists]);

  // Sellers/shops
  const sellers = useMemo(() => {
    if (!artists) return [];
    return artists.filter((a) => (a as typeof a & ArtistMeta).account_type === "seller");
  }, [artists]);

  const artistIds = useMemo(
    () => artists?.map((a) => a.id) || [],
    [artists],
  );
  const { data: availabilityMap } = useArtistsAvailability(artistIds);

  useEffect(() => {
    if (!roleLoading && isArtist) {
      navigate("/artist-dashboard", { replace: true });
    }
  }, [isArtist, roleLoading, navigate]);

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (isArtist) return null;

  return (
    <div className="min-h-screen bg-glam-porcelain pb-28">
      {/* ─── Header ─── */}
      <AppHeader showLogo={true} style="modern" />

      {/* ─── Hero ─── */}
      <HeroSection />

      {/* ─── Categories ─── */}
      <section className="pt-7 pb-2">
        <SectionHeader
          title={t.home.browseCategory}
          actionText={t.common.seeAll}
          onAction={() => navigate("/makeup-artists")}
        />
        <div className="overflow-x-auto scrollbar-hide">
          <div className="flex gap-5 px-5 pb-2">
            {categories.map((cat) => (
              <CategoryCard
                key={cat.key}
                name={cat.name}
                image={cat.image}
                video={cat.video}
                onClick={() =>
                  navigate(
                    `/makeup-artists?category=${encodeURIComponent(cat.key)}`,
                  )
                }
              />
            ))}
          </div>
        </div>
      </section>

      {/* ─── Promotions ─── */}
      <section className="pt-3">
        <PromotionsCarousel navigate={navigate} />
      </section>

      {/* ─── Top Rated Artists ─── */}
      <section className="pb-6">
        <SectionHeader
          title={t.home.featuredArtists}
          actionText={t.common.seeAll}
          onAction={() => navigate("/makeup-artists")}
          iconAnimation="/projects/glam-featured-icons/scene-1/lottie.json"
          iconImage="/icons/featured-artists/featured-artist-clean.svg"
          iconAlt={isRTL ? "أيقونة أفضل الفنانات" : "Top rated artists"}
          subtitle={isRTL ? "مختارات موثوقة في قطر" : "Trusted beauty experts in Qatar"}
          progress={artistRailProgress}
          isRTL={isRTL}
          featured
        />

        {/* Artist Cards - Horizontal Scroll */}
        <div>
          {isLoading ? (
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[74%] max-w-[74%]">
                  <ArtistSkeleton />
                </div>
              ))}
            </div>
          ) : isError ? (
            <QueryErrorState compact onRetry={() => refetch()} />
          ) : filteredArtists.length > 0 ? (
            <div
              className="snap-x snap-mandatory overflow-x-auto scroll-smooth scrollbar-hide motion-reduce:scroll-auto"
              aria-label={isRTL ? "بطاقات الفنانات الأعلى تقييماً" : "Top rated artist cards"}
              onScroll={(event) => {
                const rail = event.currentTarget;
                const maxScroll = rail.scrollWidth - rail.clientWidth;
                const offset = Math.min(Math.abs(rail.scrollLeft), maxScroll);
                setArtistRailProgress(maxScroll > 0 ? offset / maxScroll : 1);
              }}
            >
              <div className="flex gap-3 px-5 pb-2">
                {filteredArtists.map((artist, index) => (
                  <div
                    key={artist.id}
                    className="min-w-[74%] max-w-[74%] snap-start"
                  >
                    <EnhancedArtistCard
                      artist={artist}
                      availability={availabilityMap?.get(artist.id)}
                      viewMode="grid"
                    />
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-center py-10 text-glam-muted">
              <p className="text-sm">{t.home.noArtistsYet}</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Shops Section ─── */}
      {sellers.length > 0 && (
        <section className="pb-6 pt-2">
          <SectionHeader
            title={isRTL ? "المتاجر المميزة" : "Featured Shops"}
            actionText={t.common.seeAll}
            onAction={() => navigate("/shops")}
            iconAnimation="/projects/glam-featured-icons/scene-2/lottie.json"
            iconImage="/icons/featured-shops/featured-shops-clean.svg"
            iconAlt={isRTL ? "أيقونة المتاجر المميزة" : "Featured shops"}
            subtitle={isRTL ? "متاجر ومنتجات مختارة بعناية" : "Curated shops and beauty products"}
            showIndicator
            isRTL={isRTL}
            featured
          />
          <div className="px-5 space-y-3.5">
            {sellers.slice(0, 4).map((seller) => (
              <ShopCard
                key={seller.id}
                seller={seller}
                availability={availabilityMap?.get(seller.id)}
              />
            ))}
          </div>
        </section>
      )}

      <BottomNavigation />
    </div>
  );
};

export default Home;
