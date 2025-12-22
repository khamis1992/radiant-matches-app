import { useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut } from "lucide-react";
import SearchBar from "@/components/SearchBar";
import CategoryCard from "@/components/CategoryCard";
import ArtistCard from "@/components/ArtistCard";
import BottomNavigation from "@/components/BottomNavigation";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useArtists } from "@/hooks/useArtists";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { useUserRole } from "@/hooks/useUserRole";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessages";
import { useLanguage } from "@/contexts/LanguageContext";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
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

const Home = () => {
  const navigate = useNavigate();
  const { isArtist, loading: roleLoading } = useUserRole();
  const { data: artists, isLoading } = useArtists();
  const { data: profile } = useProfile();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
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
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="px-5 py-4">
          <div className="flex items-center justify-between mb-4">
            <img src={logoImage} alt="Glam" className="h-10 w-auto" />
            <div className="flex items-center gap-2">
              <LanguageSwitcher />
              <button 
                onClick={() => navigate("/notifications")}
                className="relative p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
              >
                <Bell className="w-5 h-5 text-foreground" />
              </button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="rounded-full border-2 border-primary/20 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                    <Avatar className="w-9 h-9">
                      <AvatarImage 
                        src={profile?.avatar_url || undefined} 
                        alt={profile?.full_name || "Profile"} 
                      />
                      <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                        {profile?.full_name?.charAt(0) || "U"}
                      </AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                  <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                    <User className="me-2 h-4 w-4" />
                    {t.userMenu.myProfile}
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                    <Settings className="me-2 h-4 w-4" />
                    {t.userMenu.settings}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <LogOut className="me-2 h-4 w-4" />
                    {t.userMenu.logout}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          <SearchBar />
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

      {/* Promotions Banner */}
      <section className="px-5 pb-6">
        <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-primary/20 to-primary/5">
          <img 
            src={promoBanner1} 
            alt="Promotion" 
            className="absolute inset-0 w-full h-full object-cover opacity-50"
          />
          <div className="relative z-10 p-5 flex items-center justify-between">
            <div className="space-y-1">
              <h3 className="text-lg font-bold text-foreground">{t.home.promoTitle}</h3>
              <p className="text-sm text-muted-foreground">{t.home.promoSubtitle}</p>
            </div>
            <button 
              onClick={() => navigate("/makeup-artists")}
              className="bg-primary text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap hover:bg-primary/90 transition-colors"
            >
              {t.home.promoButton}
            </button>
          </div>
        </div>
      </section>

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
              <CarouselContent className="px-5 -ml-3">
                {artists.map((artist, index) => (
                  <CarouselItem key={artist.id} className="basis-[48%] pl-3">
                    <div
                      className="animate-fade-in"
                      style={{ animationDelay: `${index * 100}ms` }}
                    >
                      <ArtistCard
                        id={artist.id}
                        name={artist.profile?.full_name || "Unknown Artist"}
                        image={artist.profile?.avatar_url || artist1}
                        featuredImage={artist.featured_image}
                        rating={Number(artist.rating) || 0}
                        reviews={artist.total_reviews || 0}
                        specialty="Make-Up Artist"
                        price={0}
                        location={artist.profile?.location || artist.studio_address || "Location TBD"}
                        tagline={artist.bio?.split(".")[0] || undefined}
                        categories={artist.categories}
                        isAvailableToday={availabilityMap?.get(artist.id)?.isAvailableToday}
                        todayHours={availabilityMap?.get(artist.id)?.todayHours}
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
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ArtistCard
                  id={artist.id}
                  name={artist.profile?.full_name || "Unknown Artist"}
                  image={artist.profile?.avatar_url || artist1}
                  featuredImage={artist.featured_image}
                  rating={Number(artist.rating) || 0}
                  reviews={artist.total_reviews || 0}
                  specialty="Make-Up Artist"
                  price={0}
                  location={artist.profile?.location || artist.studio_address || "Location TBD"}
                  tagline={artist.bio?.split(".")[0] || undefined}
                  categories={artist.categories}
                  isAvailableToday={availabilityMap?.get(artist.id)?.isAvailableToday}
                  todayHours={availabilityMap?.get(artist.id)?.todayHours}
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
