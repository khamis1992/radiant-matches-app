import React, { useEffect, useMemo, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
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

// Dynamic Promotions Carousel Component
const PromotionsCarousel = ({ navigate }: { navigate: (path: string) => void }) => {
  const { data: banners = [], isLoading } = useActiveBanners();
  const { t } = useLanguage();
  const [maxHeight, setMaxHeight] = useState<number>(0);
  const imageRefs = useRef<(HTMLImageElement | null)[]>([]);

  // Calculate the max height from all loaded images
  useEffect(() => {
    if (banners.length === 0) return;
    
    const calculateMaxHeight = () => {
      let tallest = 0;
      imageRefs.current.forEach((img) => {
        if (img && img.complete && img.naturalHeight > 0) {
          // Calculate display height based on container width
          const containerWidth = img.parentElement?.clientWidth || img.clientWidth;
          const aspectRatio = img.naturalWidth / img.naturalHeight;
          const displayHeight = containerWidth / aspectRatio;
          if (displayHeight > tallest) {
            tallest = displayHeight;
          }
        }
      });
      if (tallest > 0) {
        setMaxHeight(tallest);
      }
    };

    // Run after images load
    const timeoutId = setTimeout(calculateMaxHeight, 100);
    window.addEventListener('resize', calculateMaxHeight);
    
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', calculateMaxHeight);
    };
  }, [banners]);

  // Fallback to static promos if no banners
  if (isLoading) {
    return (
      <section className="px-5 pb-6">
        <Skeleton className="w-full rounded-2xl h-40" />
      </section>
    );
  }

  if (banners.length === 0) {
    // Fallback to static promos from translations
    return (
      <section className="px-5 pb-6">
        <Carousel
          opts={{ align: "start", loop: true }}
          className="w-full"
        >
          <CarouselContent>
            {t.home.promos.map((promo, index) => (
              <CarouselItem key={index}>
                <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5">
                  <img 
                    src={promoBanner1} 
                    alt={promo.title} 
                    className="w-full h-auto object-contain"
                  />
                  <div className="absolute inset-0 bg-black/30" />
                  <div className="absolute inset-0 p-5 flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-white">{promo.title}</h3>
                      <p className="text-sm text-white/90">{promo.subtitle}</p>
                    </div>
                    <button 
                      onClick={() => navigate("/makeup-artists")}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap hover:bg-primary/90 transition-colors"
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
    <section className="px-5 pb-6">
      <Carousel
        opts={{ align: "start", loop: true }}
        className="w-full"
      >
        <CarouselContent>
          {banners.map((banner, index) => (
            <CarouselItem key={banner.id}>
              <div 
                className="relative overflow-hidden rounded-2xl bg-muted flex items-center justify-center"
                style={{ minHeight: maxHeight > 0 ? maxHeight : 'auto' }}
              >
                {/* Dynamic image that maintains its aspect ratio */}
                <img
                  ref={(el) => {
                    imageRefs.current[index] = el;
                  }}
                  src={banner.image_url}
                  alt={banner.title || t.adminBanners.banner || "Banner"}
                  className="w-full h-auto object-contain"
                  style={{
                    transform: `scale(${(banner.image_scale ?? 100) / 100})`,
                    transformOrigin: "center center",
                  }}
                  onLoad={() => {
                    // Recalculate max height when an image loads
                    let tallest = 0;
                    imageRefs.current.forEach((img) => {
                      if (img && img.complete && img.naturalHeight > 0) {
                        const containerWidth = img.parentElement?.clientWidth || img.clientWidth;
                        const aspectRatio = img.naturalWidth / img.naturalHeight;
                        const displayHeight = containerWidth / aspectRatio;
                        if (displayHeight > tallest) {
                          tallest = displayHeight;
                        }
                      }
                    });
                    if (tallest > 0) {
                      setMaxHeight(tallest);
                    }
                  }}
                />

                {/* Overlay */}
                <div
                  className="absolute inset-0 bg-black pointer-events-none"
                  style={{ opacity: (banner.overlay_opacity ?? 50) / 100 }}
                />

                {/* Content */}
                <div
                  className={`absolute inset-0 p-5 flex flex-col ${
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
                  <div className="space-y-2">
                    {banner.show_title && banner.title && (
                      <h3 className="text-lg font-bold text-white drop-shadow">
                        {banner.title}
                      </h3>
                    )}
                    {banner.show_subtitle && banner.subtitle && (
                      <p className="text-sm text-white/90 drop-shadow">
                        {banner.subtitle}
                      </p>
                    )}
                    {banner.show_button && banner.button_text && (
                      <button
                        onClick={() => navigate(banner.link_url || "/makeup-artists")}
                        className="mt-2 bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap hover:bg-primary/90 transition-colors"
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

const Home = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { isArtist, loading: roleLoading } = useUserRole();
  const { data: artists, isLoading } = useArtistsWithPricing();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { t } = useLanguage();

  const categories = getCategoryTranslations(t);

  // Get artist IDs for availability check
  const artistIds = useMemo(() => artists?.map(a => a.id) || [], [artists]);
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

  if (isArtist) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header - Modern App Design */}
      <AppHeader
        showLogo={true}
        style="modern"
      />

      {/* Editorial Hero Section */}
      <HeroSection />

      {/* Categories */}
      <section className="px-5 py-6">
        <h2 className="text-lg font-semibold text-foreground mb-4">
          {t.home.browseCategory}
        </h2>
        {/* Mobile Carousel */}
        <div className="md:hidden -mx-5">
          <Carousel
            opts={{
              align: "start",
              loop: false,
              dragFree: true,
            }}
            className="w-full"
          >
            <CarouselContent className="px-5 -ml-3">
              {categories.map((category) => (
                <CarouselItem key={category.key} className="basis-auto pl-3">
                  <CategoryCard
                    name={category.name}
                    image={category.image}
                    onClick={() => navigate(`/makeup-artists?category=${encodeURIComponent(category.key)}`)}
                  />
                </CarouselItem>
              ))}
            </CarouselContent>
          </Carousel>
        </div>
        
        {/* Desktop Scroll */}
        <div className="hidden md:flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
          {categories.map((category) => (
            <CategoryCard
              key={category.key}
              name={category.name}
              image={category.image}
              onClick={() => navigate(`/makeup-artists?category=${encodeURIComponent(category.key)}`)}
            />
          ))}
        </div>
      </section>

      {/* Promotions Carousel */}
      <PromotionsCarousel navigate={navigate} />

      {/* Featured Artists */}
      <section className="px-5 pb-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">
            {t.home.topRatedArtists}
          </h2>
          <button 
            onClick={() => navigate("/makeup-artists")}
            className="text-sm text-primary font-medium hover:underline"
          >
            {t.common.seeAll}
          </button>
        </div>
        {/* Mobile Carousel */}
        <div className="md:hidden -mx-5">
          {isLoading ? (
            <div className="flex gap-3 px-5">
              {[1, 2].map((i) => (
                <div key={i} className="min-w-[160px] bg-card rounded-2xl overflow-hidden shadow-md">
                  <Skeleton className="h-24 w-full" />
                  <div className="flex justify-center -mt-8">
                    <Skeleton className="w-16 h-16 rounded-full" />
                  </div>
                  <div className="p-3 pt-2 space-y-2 flex flex-col items-center">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-3 w-16" />
                    <Skeleton className="h-8 w-full mt-1" />
                  </div>
                </div>
              ))}
            </div>
          ) : artists && artists.length > 0 ? (
            <Carousel
              opts={{
                align: "start",
                loop: false,
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="px-5 -ml-3 items-stretch">
                {artists.map((artist, index) => (
                  <CarouselItem key={artist.id} className="basis-[48%] sm:basis-[45%] pl-3 h-auto">
                    <div
                      className="animate-fade-in h-full"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <EnhancedArtistCard
                        artist={artist}
                        availability={availabilityMap?.get(artist.id)}
                        viewMode="grid"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          ) : (
            <div className="text-center py-8 text-muted-foreground px-5">
              <p>{t.home.noArtistsYet}</p>
            </div>
          )}
        </div>

        {/* Desktop Grid */}
        <div className="hidden md:grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {isLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="bg-card rounded-2xl overflow-hidden shadow-md">
                  <Skeleton className="h-32 w-full" />
                  <div className="flex justify-center -mt-10">
                    <Skeleton className="w-20 h-20 rounded-full" />
                  </div>
                  <div className="p-4 pt-3 space-y-2 flex flex-col items-center">
                    <Skeleton className="h-5 w-24" />
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-4 w-28" />
                    <Skeleton className="h-10 w-full mt-2" />
                  </div>
                </div>
              ))}
            </>
          ) : artists && artists.length > 0 ? (
            artists.map((artist, index) => (
              <div
                key={artist.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                <EnhancedArtistCard
                  artist={artist}
                  availability={availabilityMap?.get(artist.id)}
                  viewMode="grid"
                />
              </div>
            ))
          ) : (
            <div className="col-span-full text-center py-8 text-muted-foreground">
              <p>{t.home.noArtistsYet}</p>
            </div>
          )}
        </div>
      </section>

      <BottomNavigation />
    </div>
  );
};

export default Home;
