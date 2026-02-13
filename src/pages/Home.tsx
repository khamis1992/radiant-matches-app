import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronRight } from "lucide-react";
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
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselDots,
} from "@/components/ui/carousel";
import { useActiveBanners } from "@/hooks/useAdminBanners";

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
}: {
  title: string;
  actionText?: string;
  onAction?: () => void;
}) => (
  <div className="flex items-center justify-between px-5 mb-3">
    <h2 className="text-[15px] font-bold text-foreground">{title}</h2>
    {actionText && onAction && (
      <button
        onClick={onAction}
        className="flex items-center gap-0.5 text-xs text-primary font-semibold active:opacity-70"
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
          className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all active:scale-95 ${
            activeTab === tab.key
              ? "bg-foreground text-background shadow-sm"
              : "bg-muted text-muted-foreground hover:bg-muted/80"
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
                <div className="relative overflow-hidden rounded-2xl h-[130px]">
                  <img
                    src={promoBanner1}
                    alt={promo.title}
                    className="absolute inset-0 w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/40" />
                  <div className="relative z-10 p-5 flex items-center justify-between h-full">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white">
                        {promo.title}
                      </h3>
                      <p className="text-xs text-white/70">{promo.subtitle}</p>
                    </div>
                    <button
                      onClick={() => navigate("/makeup-artists")}
                      className="bg-white text-foreground px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap shadow-lg hover:bg-white/90 transition-colors"
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

  // Filter artists by active tab
  const filteredArtists = useMemo(() => {
    if (!artists) return [];
    if (activeFilter === "all") return artists;
    return artists.filter((a) =>
      a.specialties?.some((s: string) =>
        s.toLowerCase().includes(activeFilter.toLowerCase()),
      ),
    );
  }, [artists, activeFilter]);

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
    <div className="min-h-screen bg-background pb-28">
      {/* ─── Header ─── */}
      <AppHeader showLogo={true} style="modern" />

      {/* ─── Hero ─── */}
      <HeroSection />

      {/* ─── Categories ─── */}
      <section className="pt-7 pb-2">
        <SectionHeader title={t.home.browseCategory} />
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
        />

        {/* Filter Tabs */}
        <FilterTabs
          tabs={filterTabs}
          activeTab={activeFilter}
          onSelect={setActiveFilter}
        />

        {/* Artist Cards */}
        <div className="px-5">
          {isLoading ? (
            <div className="grid grid-cols-2 gap-3">
              {[1, 2, 3, 4].map((i) => (
                <ArtistSkeleton key={i} />
              ))}
            </div>
          ) : filteredArtists.length > 0 ? (
            <div className="grid grid-cols-2 gap-3">
              {filteredArtists.map((artist, index) => (
                <div
                  key={artist.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <EnhancedArtistCard
                    artist={artist}
                    availability={availabilityMap?.get(artist.id)}
                    viewMode="grid"
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-10 text-muted-foreground">
              <p className="text-sm">{t.home.noArtistsYet}</p>
            </div>
          )}
        </div>
      </section>

      <BottomNavigation />
    </div>
  );
};

export default Home;
