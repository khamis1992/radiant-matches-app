import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight, Award, Store, Star } from "lucide-react";
import CategoryCard from "@/components/CategoryCard";
import { EnhancedArtistCard } from "@/components/artists/EnhancedArtistCard";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { HeroSection } from "@/components/HeroSection";
import { useArtistsWithPricing } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/hooks/useAuth";
import { useUnreadNotificationsCount } from "@/hooks/useArtistNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { useActiveBanners } from "@/hooks/useAdminBanners";

type ArtistMeta = { account_type?: string; categories?: string[] };

import promoBanner1 from "@/assets/promo-banner-1.jpg";
import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";

const getCategoryTranslations = (t: ReturnType<typeof useLanguage>["t"]) => [
  { name: t.categories.makeup, image: categoryMakeup, key: "Makeup" },
  { name: t.categories.hairStyling, image: categoryHairstyling, key: "Hair Styling" },
  { name: t.categories.henna, image: categoryHenna, key: "Henna" },
  { name: t.categories.lashesBrows, image: categoryLashes, key: "Lashes & Brows" },
  { name: t.categories.nails, image: categoryNails, key: "Nails" },
  { name: t.categories.bridal, image: categoryBridal, key: "Bridal" },
  { name: t.categories.photoshoot, image: categoryPhotoshoot, key: "Photoshoot" },
];

/* ─── Section Header ─── */
const SectionHeader = ({
  title,
  actionText,
  onAction,
  icon,
  accentClass,
}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
  icon?: React.ReactNode;
  accentClass?: string;
}) => (
  <div className="flex items-center justify-between px-5 mb-3">
    <div className="flex items-center gap-2">
      {icon && (
        <div className={`w-7 h-7 rounded-lg flex items-center justify-center ${accentClass || "bg-glam-surface"}`}>
          {icon}
        </div>
      )}
      <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
    </div>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="flex items-center gap-0.5 text-xs text-glam-rose font-semibold active:opacity-70"
      >
        {actionText}
        <ChevronRight className="w-3.5 h-3.5" />
      </button>
    )}
  </div>
);

/* ─── Filter Tabs ─── */
const FilterTabs = ({
  tabs,
  activeTab,
  onSelect,
}: {
  tabs: { label: string; key: string }[];
  activeTab: string;
  onSelect: (key: string) => void;
}) => (
  <div className="overflow-x-auto scrollbar-hide px-5 mb-4">
    <div className="flex gap-2 pb-1">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onSelect(tab.key)}
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
            activeTab === tab.key
              ? "bg-glam-blush-soft text-glam-ink"
              : "bg-glam-surface text-glam-secondary hover:bg-glam-blush-soft/60"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  </div>
);

/* ─── Promotions Carousel ─── */
const PromotionsCarousel = ({
  navigate,
}: {
  navigate: (path: string) => void;
}) => {
  const { data: banners = [], isLoading } = useActiveBanners();
  const { t } = useLanguage();

  if (isLoading) {
    return (
      <section className="px-5 pb-5">
        <Skeleton className="h-[120px] w-full rounded-2xl" />
      </section>
    );
  }

  if (banners.length === 0) {
    return (
      <section className="px-5 pb-5">
        <Carousel opts={{ align: "start", loop: true }} className="w-full">
          <CarouselContent>
            {t.home.promos.map((promo, index) => (
              <CarouselItem key={index}>
                <div className="relative overflow-hidden rounded-2xl h-[130px] bg-glam-porcelain border border-glam-border">
                  <img
                    src={promoBanner1}
                    alt={promo.title}
                    className="absolute inset-y-0 end-0 w-1/2 h-full object-cover"
                  />
                  <div className="absolute inset-y-0 end-0 w-1/2 bg-gradient-to-l from-transparent to-glam-porcelain" />
                  <div className="relative z-10 p-5 flex flex-col justify-center h-full max-w-[60%]">
                    <h3 className="font-serif italic text-glam-rose text-xl leading-snug">
                      {promo.title}
                    </h3>
                    <p className="text-[10px] uppercase tracking-[0.18em] text-glam-secondary mt-1.5">{promo.subtitle}</p>
                    <button
                      onClick={() => navigate("/makeup-artists")}
                      className="mt-3 self-start bg-glam-rose text-white px-4 py-2 rounded-full text-xs font-bold hover:bg-glam-rose-pressed transition-colors"
                    >
                      {promo.button}
                    </button>
                  </div>
                </div>
              </CarouselItem>
            ))}
          </CarouselContent>
          <CarouselDots />
        </Carousel>
      </section>
    );
  }

  return (
    <section className="px-5 pb-5">
      <Carousel opts={{ align: "start", loop: true }} className="w-full">
        <CarouselContent>
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div
                className="relative overflow-hidden rounded-2xl"
                style={{ height: `${banner.banner_height ?? 140}px` }}
              >
                <img
                  src={banner.image_url}
                  alt={banner.title || "Banner"}
                  className="absolute inset-0 w-full h-full object-cover"
                  style={{
                    transform: `scale(${(banner.image_scale ?? 100) / 100})`,
                    objectPosition: `${banner.position_x ?? 50}% ${banner.position_y ?? 50}%`,
                  }}
                />
                <div
                  className="absolute inset-0 bg-black"
                  style={{ opacity: (banner.overlay_opacity ?? 40) / 100 }}
                />
                <div
                  className={`relative z-10 p-5 flex flex-col h-full ${
                    banner.text_position === "center"
                      ? "justify-center"
                      : banner.text_position === "end"
                        ? "justify-end"
                        : "justify-start"
                  } ${
                    banner.text_alignment === "center"
                      ? "items-center text-center"
                      : banner.text_alignment === "end"
                        ? "items-end text-end"
                        : "items-start text-start"
                  }`}
                >
                  <div className="space-y-1.5">
                    {banner.show_title && banner.title && (
                      <h3 className="text-lg font-bold text-white drop-shadow-lg">
                        {banner.title}
                      </h3>
                    )}
                    {banner.show_subtitle && banner.subtitle && (
                      <p className="text-xs text-white/80 drop-shadow">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.show_button && banner.button_text && (
                      <button
                        onClick={() =>
                          navigate(banner.link_url || "/makeup-artists")
                        }
                        className="mt-1.5 bg-white text-foreground px-4 py-2 rounded-full text-xs font-bold shadow-lg hover:bg-white/90 transition-colors"
                      >
                        {banner.button_text}
                      </button>
                    )}
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
  <div className="bg-card rounded-2xl overflow-hidden shadow-sm border border-border/30">
    <Skeleton className="h-24 w-full" />
    <div className="flex justify-center -mt-7">
      <Skeleton className="w-14 h-14 rounded-full" />
    </div>
    <div className="p-3 pt-2 space-y-2 flex flex-col items-center">
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="h-3 w-14" />
      <Skeleton className="h-8 w-full mt-1" />
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
  const { data: artists, isLoading } = useArtistsWithPricing();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { t, language } = useLanguage();
  const isRTL = language === "ar";

  const [activeFilter, setActiveFilter] = useState("all");

  const categories = getCategoryTranslations(t);

  const filterTabs = useMemo(
    () => [
      { label: isRTL ? "الكل" : "All", key: "all" },
      { label: isRTL ? "مكياج" : "Makeup", key: "Makeup" },
      { label: isRTL ? "شعر" : "Hair", key: "Hair Styling" },
      { label: isRTL ? "أظافر" : "Nails", key: "Nails" },
      { label: isRTL ? "عروس" : "Bridal", key: "Bridal" },
      { label: isRTL ? "حنة" : "Henna", key: "Henna" },
    ],
    [isRTL],
  );

  // Filter artists (experts only) by active tab
  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    let result = artists.filter((a) => (a as typeof a & ArtistMeta).account_type !== "seller");
    
    if (activeFilter !== "all") {
      result = result.filter((a) =>
        (a as typeof a & ArtistMeta).categories?.some((s: string) =>
          s.toLowerCase().includes(activeFilter.toLowerCase()),
        ),
      );
    }
    
    return result;
  }, [artists, activeFilter]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
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
          title={t.home.topRatedArtists}
          actionText={t.common.seeAll}
          onAction={() => navigate("/makeup-artists")}
          icon={<Award className="w-4 h-4 text-glam-ink" />}
          accentClass="bg-glam-surface"
        />

        {/* Filter Tabs */}
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onSelect={setActiveFilter}
        />

        {/* Artist Cards - Horizontal Scroll */}
        <div>
          {isLoading ? (
            <div className="flex gap-3 px-5 overflow-x-auto scrollbar-hide">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="min-w-[46%] max-w-[46%]">
                  <ArtistSkeleton />
                </div>
              ))}
            </div>
          ) : filteredArtists.length > 0 ? (
            <div className="overflow-x-auto scrollbar-hide">
              <div className="flex gap-3 px-5 pb-2">
                {filteredArtists.map((artist, index) => (
                  <div
                    key={artist.id}
                    className="min-w-[46%] max-w-[46%]"
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
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">{t.home.noArtistsYet}</p>
            </div>
          )}
        </div>
      </section>

      {/* ─── Shops Section ─── */}
      {sellers.length > 0 && (
        <section className="pb-6 pt-2">
          <SectionHeader
            title={isRTL ? "المتاجر" : "Shops"}
            actionText={t.common.seeAll}
            onAction={() => navigate("/shops")}
            icon={<Store className="w-4 h-4 text-glam-ink" />}
            accentClass="bg-glam-surface"
          />
          <div className="px-5 space-y-3">
            {sellers.slice(0, 4).map((seller) => (
              <button
                key={seller.id}
                onClick={() => navigate(`/artist/${seller.id}`)}
                className="w-full flex items-center gap-3 bg-white border border-glam-border rounded-2xl p-3 text-start transition-transform active:scale-[0.99]"
              >
                <Avatar className="w-14 h-14 rounded-xl shrink-0">
                  <AvatarImage
                    src={seller.profile?.avatar_url || undefined}
                    alt={seller.profile?.full_name || "Shop"}
                    className="object-cover"
                  />
                  <AvatarFallback className="rounded-xl bg-glam-blush-soft text-glam-ink font-semibold">
                    {seller.profile?.full_name?.charAt(0) || "S"}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-glam-ink truncate">
                    {seller.profile?.full_name || "Shop"}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <Star className="w-3 h-3 fill-glam-rose text-glam-rose" />
                    <span className="text-xs font-semibold text-glam-ink">
                      {Number(seller.rating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-[10px] text-glam-muted">
                      ({seller.total_reviews || 0})
                    </span>
                  </div>
                </div>
                <span className="rounded-full border border-glam-rose text-glam-rose px-4 py-2 text-xs font-semibold shrink-0">
                  {isRTL ? "تسوق الآن" : "Shop Now"}
                </span>
              </button>
            ))}
          </div>
        </section>
      )}

      <BottomNavigation />
    </div>
  );
};

export default Home;
