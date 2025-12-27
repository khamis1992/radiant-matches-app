import React, { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut, LogIn, ChevronLeft } from "lucide-react";
import CategoryCard from "@/components/CategoryCard";
import { EnhancedArtistCard } from "@/components/artists/EnhancedArtistCard";
import BottomNavigation from "@/components/BottomNavigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useArtistsWithPricing } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useActiveBanners } from "@/hooks/useAdminBanners";

import logoImage from "@/assets/logo.png";
import artist1 from "@/assets/artist-1.jpg";
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

  // Fallback to static promos if no banners
  if (isLoading) {
    return (
      <section className="px-5 pb-6">
        <Skeleton className="h-[120px] w-full rounded-2xl" />
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
                    className="absolute inset-0 w-full h-full object-cover opacity-50"
                  />
                  <div className="relative z-10 p-5 flex items-center justify-between min-h-[100px]">
                    <div className="space-y-1">
                      <h3 className="text-lg font-bold text-foreground">{promo.title}</h3>
                      <p className="text-sm text-muted-foreground">{promo.subtitle}</p>
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
          {banners.map((banner) => (
            <CarouselItem key={banner.id}>
              <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5">
                <img 
                  src={banner.image_url} 
                  alt={banner.title} 
                  className="absolute inset-0 w-full h-full object-cover opacity-50"
                />
                <div className="relative z-10 p-5 flex items-center justify-between min-h-[100px]">
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold text-foreground">{banner.title}</h3>
                    {banner.subtitle && (
                      <p className="text-sm text-muted-foreground">{banner.subtitle}</p>
                    )}
                  </div>
                  {banner.button_text && (
                    <button 
                      onClick={() => navigate(banner.link_url || "/makeup-artists")}
                      className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap hover:bg-primary/90 transition-colors"
                    >
                      {banner.button_text}
                    </button>
                  )}
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
  const { data: profile } = useProfile();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { t } = useLanguage();
  
  const categories = getCategoryTranslations(t);

  // Get artist IDs for availability check
  const artistIds = useMemo(() => artists?.map(a => a.id) || [], [artists]);
  const { data: availabilityMap } = useArtistsAvailability(artistIds);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t.auth.logoutFailed);
    } else {
      toast.success(t.auth.logoutSuccess);
      navigate("/auth");
    }
  };

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
    <div className="min-h-screen bg-background pb-24">
      {/* Header - Premium Native App Design */}
      <header className="sticky top-0 z-50 safe-area-top">
        {/* Glassmorphism background */}
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-xl" />
        <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
        
        <div className="relative px-4 py-3">
          <div className="flex items-center justify-between gap-4">
            {/* Logo with subtle animation */}
            <div className="flex items-center gap-3 min-w-0 flex-1">
              <div className="relative group">
                <div className="absolute -inset-2 bg-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                <img 
                  src={logoImage} 
                  alt="Logo" 
                  className="relative h-9 w-auto object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>
            </div>

            {/* Right side - Premium Actions */}
            <div className="flex items-center gap-2">
              {/* Language Switcher */}
              <LanguageSwitcher />
              
              {/* Notification Button - Enhanced */}
              <button
                onClick={() => navigate("/notifications")}
                className="relative group flex items-center justify-center w-11 h-11 rounded-xl bg-card shadow-sm border border-border/40 hover:border-primary/30 hover:shadow-md active:scale-95 transition-all duration-200"
              >
                <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <Bell className="relative w-5 h-5 text-muted-foreground group-hover:text-foreground transition-colors duration-200" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -end-1 flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[11px] font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/90 rounded-full shadow-lg ring-2 ring-background animate-in zoom-in-50 duration-200">
                    {unreadCount > 99 ? '99+' : unreadCount}
                  </span>
                )}
              </button>

              {/* Profile Menu - Premium */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="relative group flex items-center justify-center w-11 h-11 rounded-xl bg-card shadow-sm border border-border/40 hover:border-primary/30 hover:shadow-md active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2">
                    <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    <Avatar className="relative w-8 h-8 ring-2 ring-primary/20 group-hover:ring-primary/40 shadow-sm transition-all duration-200">
                      <AvatarImage
                        src={profile?.avatar_url || undefined}
                        alt={profile?.full_name || "Profile"}
                        className="object-cover"
                      />
                      <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-sm font-semibold">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent 
                  align="end" 
                  sideOffset={12}
                  className="w-56 bg-card border border-border/50 shadow-2xl rounded-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-200"
                >
                  {user ? (
                    <>
                      {/* User Info Header - Premium */}
                      <div className="px-3 py-3 mb-1 bg-gradient-to-br from-muted/50 to-transparent rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                              {profile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-semibold text-foreground truncate">
                              {profile?.full_name || t.userMenu.myProfile}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {profile?.email || user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                      <DropdownMenuSeparator className="bg-border/30 my-1" />
                      <DropdownMenuItem 
                        onClick={() => navigate("/profile")} 
                        className="cursor-pointer rounded-xl py-3 px-3 focus:bg-muted/80 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 me-3">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="font-medium">{t.userMenu.myProfile}</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => navigate("/settings")} 
                        className="cursor-pointer rounded-xl py-3 px-3 focus:bg-muted/80 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-muted me-3">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="font-medium">{t.userMenu.settings}</span>
                      </DropdownMenuItem>
                      <DropdownMenuSeparator className="bg-border/30 my-1" />
                      <DropdownMenuItem
                        onClick={handleLogout}
                        className="cursor-pointer rounded-xl py-3 px-3 text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors duration-150"
                      >
                        <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 me-3">
                          <LogOut className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="font-medium">{t.userMenu.logout}</span>
                      </DropdownMenuItem>
                    </>
                  ) : (
                    <DropdownMenuItem 
                      onClick={() => navigate("/auth")} 
                      className="cursor-pointer rounded-xl py-3 px-3 focus:bg-muted/80 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 me-3">
                        <LogIn className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{t.auth.login}</span>
                    </DropdownMenuItem>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
      </header>

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
