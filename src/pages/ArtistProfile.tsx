import { useState, useMemo, useRef, useEffect } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Heart, Share2, Clock, Crown, MessageCircle, CalendarOff, Camera, Briefcase, ChevronRight, ChevronDown, Play, Sparkles, Check, Brush, Scissors, Hand, Gem, Leaf, Eye, Image as ImageIcon } from "lucide-react";
import SellerProfile from "@/pages/SellerProfile";
import { toast } from "sonner";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ImageLightbox from "@/components/ImageLightbox";


import { useArtist, useArtists } from "@/hooks/useArtists";
import { useArtistServices } from "@/hooks/useServices";
import { useArtistReviews } from "@/hooks/useReviews";
import { useArtistPortfolio, PORTFOLIO_CATEGORIES } from "@/hooks/usePortfolio";

import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";
import { format, isAfter, startOfToday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useFavorites } from "@/hooks/useFavorites";
import HelpfulReviewButton from "@/components/HelpfulReviewButton";

import artist1 from "@/assets/artist-1.jpg";

type ReviewSort = "newest" | "highest";
type ActiveTab = "services" | "reviews" | "gallery";

const SPECIALTY_ICONS: Record<string, typeof Brush> = {
  Makeup: Brush,
  "Hair Styling": Scissors,
  Henna: Leaf,
  "Lashes & Brows": Eye,
  Nails: Hand,
  Bridal: Gem,
  Photoshoot: Camera,
};

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showAllHours, setShowAllHours] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>("services");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [galleryFilter, setGalleryFilter] = useState<string>("all");
  const servicesSectionRef = useRef<HTMLDivElement | null>(null);

  const { data: artist, isLoading: artistLoading } = useArtist(id);
  const { data: services, isLoading: servicesLoading } = useArtistServices(id);
  const { data: reviews, isLoading: reviewsLoading } = useArtistReviews(id);
  const { data: portfolioItems = [], isLoading: portfolioLoading } = useArtistPortfolio(artist?.id);
  
  const { data: workingHours = [], isLoading: workingHoursLoading } = useWorkingHours(artist?.id);
  const { data: blockedDates = [] } = useBlockedDates(artist?.id);
  const { getOrCreateConversation } = useConversations();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const { data: allArtists = [] } = useArtists();
  const heroMediaRef = useRef<HTMLDivElement>(null);
  const [heroIdx, setHeroIdx] = useState(0);
  const [showMiniHeader, setShowMiniHeader] = useState(false);
  const [teaserIdx, setTeaserIdx] = useState(0);
  const teaserWords = useMemo(
    () => (isRTL ? ["مكياج", "تسريحات شعر", "أظافر", "حنة", "رموش"] : ["Makeup", "Hair styling", "Nails", "Henna", "Lashes"]),
    [isRTL]
  );
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setInterval(() => setTeaserIdx((i) => (i + 1) % teaserWords.length), 2200);
    return () => window.clearInterval(id);
  }, [teaserWords.length]);

  // Check if artist is favorited
  const isFavorite = favorites.some(f => f.item_id === artist?.id && f.item_type === 'artist');

  // Review sorting
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");
  const [, setScrollProgress] = useState(0);
  const [isTabsSticky, setIsTabsSticky] = useState(false);
  const tabsRef = useRef<HTMLDivElement>(null);

  // Scroll progress & sticky tabs
  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY;
      if (heroMediaRef.current && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
        heroMediaRef.current.style.transform = `translateY(${Math.min(scrollTop * 0.28, 90)}px)`;
      }
      setShowMiniHeader(scrollTop > 180);
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      setScrollProgress(docHeight > 0 ? (scrollTop / docHeight) * 100 : 0);

      if (tabsRef.current) {
        const tabsTop = tabsRef.current.getBoundingClientRect().top;
        setIsTabsSticky(tabsTop <= 0);
      }
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const filteredAndSortedReviews = useMemo(() => {
    if (!reviews) return [];
    const filtered = [...reviews];
    if (reviewSort === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reviewSort === "highest") {
      filtered.sort((a, b) => b.rating - a.rating);
    }
    return filtered;
  }, [reviews, reviewSort]);

  // Specialty chips: unique service categories (max 4)
  const specialtyChips = useMemo(() => {
    const cats = [...new Set((services || []).map((s) => s.category).filter(Boolean))] as string[];
    return cats.slice(0, 4);
  }, [services]);

  const upcomingBlockedDates = blockedDates.filter(bd =>
    isAfter(new Date(bd.blocked_date), startOfToday()) ||
    format(new Date(bd.blocked_date), 'yyyy-MM-dd') === format(startOfToday(), 'yyyy-MM-dd')
  );

  const dateLocale = language === "ar" ? ar : enUS;

  const dayNames = [
    t.settings.sunday,
    t.settings.monday,
    t.settings.tuesday,
    t.settings.wednesday,
    t.settings.thursday,
    t.settings.friday,
    t.settings.saturday,
  ];

  const formatTime = (time: string | null) => {
    if (!time) return "";
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  };

  // Get today's working hours
  const todayIndex = new Date().getDay();
  const todayHours = workingHours.find(h => h.day_of_week === todayIndex);

  // Next available slot within the coming week (skips blocked days and ended shifts)
  const nextAvailable = (() => {
    if (!workingHours.length) return null;
    const blockedSet = new Set(upcomingBlockedDates.map((bd) => format(new Date(bd.blocked_date), "yyyy-MM-dd")));
    const now = new Date();
    for (let offset = 0; offset < 8; offset++) {
      const day = new Date(now);
      day.setDate(now.getDate() + offset);
      if (blockedSet.has(format(day, "yyyy-MM-dd"))) continue;
      const hours = workingHours.find((h) => h.day_of_week === day.getDay());
      if (!hours || !hours.is_working || !hours.start_time || !hours.end_time) continue;
      const [sh = 0, sm = 0] = hours.start_time.split(":").map(Number);
      const [eh = 23, em = 59] = hours.end_time.split(":").map(Number);
      const start = new Date(day); start.setHours(sh, sm, 0, 0);
      const end = new Date(day); end.setHours(eh, em, 0, 0);
      if (offset === 0 && now >= end) continue;
      const dayLabel = offset === 0 ? (isRTL ? "اليوم" : "Today") : offset === 1 ? (isRTL ? "غدًا" : "Tomorrow") : dayNames[day.getDay()];
      if (offset === 0 && now >= start) {
        return { label: isRTL ? `متاحة الآن حتى ${formatTime(hours.end_time)}` : `Available now until ${formatTime(hours.end_time)}` };
      }
      return { label: `${dayLabel} ${formatTime(hours.start_time)}` };
    }
    return null;
  })();

  useSwipeBack();

  const handleBookService = (serviceId: string, serviceName: string) => {
    // NOTE: price is intentionally NOT passed in the URL — Booking.tsx always
    // reads the authoritative price from the database to prevent tampering.
    if (!user) {
      toast.error(t.auth?.loginRequired || "يرجى تسجيل الدخول أولاً للحجز");
      navigate("/auth", { state: { from: `/booking/${id}?service=${encodeURIComponent(serviceName)}&serviceId=${serviceId}` } });
      return;
    }
    navigate(`/booking/${id}?service=${encodeURIComponent(serviceName)}&serviceId=${serviceId}`);
  };

  const handleShare = async () => {
    const shareData = {
      title: displayName,
      text: artist?.bio || t.artist.makeupArtist,
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        // User cancelled
      }
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t.common.linkCopied);
    }
  };

  const handleFavoriteToggle = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (artist?.id) {
      toggleFavorite('artist', artist.id);
    }
  };

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <Skeleton className="h-80 w-full" />
        <div className="px-5 -mt-20 relative z-10">
          <Skeleton className="h-40 w-full rounded-3xl" />
        </div>
        <div className="px-5 mt-6 space-y-4">
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Sparkles className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.artist.notFound}</h2>
          <p className="text-muted-foreground mb-6">The artist you're looking for doesn't exist or has been removed.</p>
          <Button onClick={() => navigate("/home")}>{t.nav.home}</Button>
        </div>
      </div>
    );
  }

  // If this is a seller account, render the SellerProfile instead
  if ((artist as any).account_type === "seller") {
    return <SellerProfile />;
  }

  // Hero image priority: her chosen profile photo → her featured portfolio work → first portfolio item → generic fallback
  const featuredWork =
    portfolioItems.find((p) => p.is_featured)?.image_url || portfolioItems[0]?.image_url;
  const displayImage = artist.profile?.avatar_url || featuredWork || artist1;
  const displayName = artist.profile?.full_name || "Unknown Artist";
  const displayLocation = artist.profile?.location || artist.studio_address || "Location TBD";

  // Hide the stats strip entirely when there is nothing worth showing yet
  const hasStats = (artist.experience_years || 0) > 0 || (artist.total_reviews || 0) > 0 || (services?.length || 0) > 0;

  // Hero gallery: profile photo first, then her portfolio work (deduped, max 5)
  const heroImages = ([displayImage, ...portfolioItems.map((p) => p.image_url)]
    .filter(Boolean) as string[])
    .filter((v, i, arr) => arr.indexOf(v) === i)
    .slice(0, 5);

  // Similar artists: shared specialty first, then by rating — never the current artist
  const similarArtists = allArtists
    .filter((a) => a.id !== artist.id)
    .sort((a, b) => {
      const aShared = (a.categories || []).some((c) => specialtyChips.includes(c)) ? 1 : 0;
      const bShared = (b.categories || []).some((c) => specialtyChips.includes(c)) ? 1 : 0;
      return bShared - aShared;
    })
    .slice(0, 6);

  return (
    <div className="min-h-screen bg-glam-porcelain pb-28">
      {/* Sticky mini header — appears after the hero scrolls away */}
      <div className={cn(
        "fixed top-0 inset-x-0 z-50 bg-glam-porcelain/95 backdrop-blur-md border-b border-glam-border/60 safe-area-top transition-transform duration-300",
        showMiniHeader ? "translate-y-0" : "-translate-y-full"
      )}>
        <div className="px-5 py-2.5 flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            aria-label={t.common.back}
            className="h-9 w-9 rounded-full bg-white border border-glam-border/70 grid place-items-center shrink-0 transition-transform active:scale-95"
          >
            <ChevronRight className={cn("w-4 h-4 text-glam-ink", !isRTL && "rotate-180")} strokeWidth={2} />
          </button>
          <img src={displayImage} alt="" className="w-9 h-9 rounded-full object-cover border border-glam-border/70" />
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-glam-ink truncate">{displayName}</p>
            {(artist.total_reviews || 0) > 0 ? (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 fill-glam-rose text-glam-rose" />
                <span className="text-[11px] font-semibold text-glam-ink">{Number(artist.rating)?.toFixed(1)}</span>
                <span className="text-[10px] text-glam-muted">({artist.total_reviews})</span>
              </div>
            ) : (
              <span className="text-[10px] font-semibold text-glam-rose">{isRTL ? "جديدة على المنصة" : "New on GLAM"}</span>
            )}
          </div>
          {services && services.length > 0 && (
            <button
              onClick={() => handleBookService(services[0].id, services[0].name)}
              className="h-9 px-4 rounded-full bg-glam-ink text-white text-xs font-bold transition-transform active:scale-95 shrink-0"
            >
              {isRTL ? "احجزي" : "Book"}
            </button>
          )}
        </div>
      </div>
      {/* ─── Immersive cinematic hero ─── */}
      <div className="relative h-[470px] overflow-hidden rounded-b-[32px]">
        {/* Parallax wrapper + swipeable work gallery */}
        <div ref={heroMediaRef} className="absolute inset-0 will-change-transform">
          {heroImages.length > 1 ? (
            <div
              className="flex h-full overflow-x-auto snap-x snap-mandatory [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
              onScroll={(e) => {
                const el = e.currentTarget;
                setHeroIdx(Math.round(Math.abs(el.scrollLeft) / el.clientWidth));
              }}
            >
              {heroImages.map((src, i) => (
                <div key={i} className="w-full h-full shrink-0 snap-center overflow-hidden">
                  <img src={src} alt={i === 0 ? displayName : ""} aria-hidden={i !== 0} draggable={false} className="w-full h-full object-cover scale-[1.18]" />
                </div>
              ))}
            </div>
          ) : (
            <img src={displayImage} alt={displayName} draggable={false} className="w-full h-full object-cover scale-[1.18]" />
          )}
        </div>
        <div className="absolute inset-0 pointer-events-none bg-gradient-to-t from-black/85 via-black/25 to-black/10" />
        {heroImages.length > 1 && (
          <div className="absolute bottom-4 left-4 z-10 flex items-center gap-1.5 rounded-full bg-black/35 backdrop-blur-md px-2.5 py-1.5" dir="ltr">
            {heroImages.map((_, i) => (
              <span key={i} className={cn("rounded-full transition-all duration-300", i === heroIdx ? "w-4 h-1.5 bg-white" : "w-1.5 h-1.5 bg-white/50")} />
            ))}
          </div>
        )}

        {/* Top actions — frosted glass */}
        <div className="absolute top-0 inset-x-0 safe-area-top px-5 pt-4 flex items-center justify-between z-10">
          <button
            onClick={() => navigate(-1)}
            aria-label={t.common.back}
            className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 grid place-items-center transition-transform active:scale-95"
          >
            <ChevronRight className={cn("w-5 h-5 text-white", !isRTL && "rotate-180")} strokeWidth={2} />
          </button>
          <div className="flex gap-2.5">
            <button
              onClick={async () => {
                if (!user) {
                  navigate("/auth");
                  return;
                }
                if (!artist?.id) return;
                try {
                  const conversationId = await getOrCreateConversation.mutateAsync(artist.id);
                  navigate(`/chat/${conversationId}`);
                } catch (error) {
                  toast.error(t.errors.somethingWrong);
                }
              }}
              disabled={getOrCreateConversation.isPending}
              aria-label={isRTL ? "مراسلة" : "Message"}
              className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 grid place-items-center transition-transform active:scale-95 disabled:opacity-50"
            >
              <MessageCircle className="w-5 h-5 text-white" strokeWidth={1.75} />
            </button>
            <button
              onClick={handleFavoriteToggle}
              aria-label="Favorite"
              aria-pressed={isFavorite}
              className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 grid place-items-center transition-transform active:scale-95"
            >
              <Heart
                className={cn("w-5 h-5", isFavorite ? "fill-glam-blush text-glam-blush" : "text-white")}
                strokeWidth={1.75}
              />
            </button>
            <button
              onClick={handleShare}
              aria-label="Share"
              className="h-11 w-11 rounded-full bg-white/15 backdrop-blur-md border border-white/25 grid place-items-center transition-transform active:scale-95"
            >
              <Share2 className="w-5 h-5 text-white" strokeWidth={1.75} />
            </button>
          </div>
        </div>

        {/* Identity over photo */}
        <div className="absolute inset-x-0 bottom-0 z-10 px-6 pb-10">
          {artist.is_available && todayHours?.is_working && (
            <span className="mb-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold px-3 py-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-glam-blush" />
              {t.availability?.availableToday || "Available Today"}
            </span>
          )}
          <h1 className="text-[30px] leading-tight font-bold text-white [text-shadow:0_2px_16px_rgba(0,0,0,0.45)]">
            {displayName}
          </h1>
          <p className="text-glam-blush-soft font-medium text-sm mt-1">
            {artist.bio?.split(".")[0] || t.artist.makeupArtist}
          </p>
          <div className="mt-2 flex items-center gap-1.5">
            {(artist.total_reviews || 0) > 0 ? (
              <>
                <Star className="w-4 h-4 fill-glam-blush text-glam-blush" />
                <span className="font-bold text-white text-sm">
                  {Number(artist.rating)?.toFixed(1)}
                </span>
                <span className="text-xs text-white/70">
                  ({artist.total_reviews} {t.artist.reviews})
                </span>
              </>
            ) : (
              <span className="inline-flex items-center gap-1 rounded-full bg-white/15 backdrop-blur-md border border-white/25 text-white text-[11px] font-semibold px-2.5 py-1">
                <Sparkles className="w-3 h-3 text-glam-blush" />
                {isRTL ? "جديدة على المنصة" : "New on GLAM"}
              </span>
            )}
            <span className="mx-1.5 text-white/30">|</span>
            <MapPin className="w-4 h-4 text-white/85" strokeWidth={1.75} />
            <span className="text-xs text-white/85">{displayLocation}</span>
          </div>
        </div>
      </div>

      {/* ─── Floating glass stats strip ─── */}
      <div className={cn("relative z-10 -mt-7 mx-5 rounded-2xl bg-white/95 backdrop-blur-md border border-white/70 [box-shadow:0_20px_40px_-18px_rgba(16,20,23,0.28)]", !hasStats && "hidden")}>
        <div className="grid grid-cols-3">
          <div className="py-3.5 text-center">
            <Crown className="w-4 h-4 mx-auto text-glam-rose" strokeWidth={1.75} />
            <p className="mt-1 text-base font-bold text-glam-ink">{artist.experience_years || 0}+</p>
            <p className="text-[10px] leading-snug text-glam-muted">{t.artist.yearsExperience || "Years Experience"}</p>
          </div>
          <div className="py-3.5 text-center border-x border-glam-border/70">
            <Star className="w-4 h-4 mx-auto text-glam-rose" strokeWidth={1.75} />
            <p className="mt-1 text-base font-bold text-glam-ink">{artist.total_reviews || 0}</p>
            <p className="text-[10px] leading-snug text-glam-muted">{t.artist.reviews}</p>
          </div>
          <div className="py-3.5 text-center">
            <Brush className="w-4 h-4 mx-auto text-glam-rose" strokeWidth={1.75} />
            <p className="mt-1 text-base font-bold text-glam-ink">{services?.length || 0}</p>
            <p className="text-[10px] leading-snug text-glam-muted">{t.artist.servicesOffered || "Services"}</p>
          </div>
        </div>
      </div>

      {/* ─── Specialty chips ─── */}
      {specialtyChips.length > 0 && (
        <div className="px-5 mt-4 flex flex-wrap justify-center gap-2">
          {specialtyChips.map((chip) => {
            const ChipIcon = SPECIALTY_ICONS[chip] ?? Brush;
            return (
              <span
                key={chip}
                className="inline-flex items-center gap-1.5 rounded-full bg-white border border-glam-border px-3.5 py-1.5 text-xs font-medium text-glam-ink"
              >
                <ChipIcon className="w-3.5 h-3.5 text-glam-rose" strokeWidth={1.75} />
                {chip}
              </span>
            );
          })}
        </div>
      )}

      {/* Quick Info Cards */}
      <div className="px-5 mt-4 space-y-3">
        {/* Working Hours Card */}
        <div
          className="bg-white rounded-2xl p-4 border border-glam-border/60 cursor-pointer transition-shadow hover:shadow-md"
          onClick={() => setShowAllHours(!showAllHours)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-full bg-glam-blush-soft/50 flex items-center justify-center shrink-0">
                <Clock className="w-5 h-5 text-glam-rose" strokeWidth={1.75} />
              </div>
              <div>
                <p className="text-sm font-semibold text-glam-ink">{t.settings.workingHours || "Working Hours"}</p>
                {todayHours?.is_working ? (
                  <p className="text-xs text-glam-rose font-medium mt-0.5">
                    {formatTime(todayHours.start_time)} – {formatTime(todayHours.end_time)}
                  </p>
                ) : (
                  <p className="text-xs text-glam-muted mt-0.5">
                    {t.settings.closed}
                    {nextAvailable && (
                      <span className="text-glam-rose font-medium">{" · "}{isRTL ? "تفتح" : "Opens"} {nextAvailable.label}</span>
                    )}
                  </p>
                )}
              </div>
            </div>
            <div className="flex items-center gap-2">
              {todayHours && (
                <span className={cn("text-xs font-semibold", todayHours.is_working ? "text-glam-success" : "text-glam-muted")}>
                  {todayHours.is_working
                    ? (isRTL ? "مفتوح اليوم" : "Open today")
                    : (isRTL ? "مغلق اليوم" : "Closed today")}
                </span>
              )}
              <ChevronDown className={cn("w-4 h-4 text-glam-muted transition-transform", showAllHours && "rotate-180")} />
            </div>
          </div>

          {/* Expandable Working Hours */}
          {showAllHours && (
            <div className="mt-4 pt-4 border-t border-glam-border/60 space-y-2 animate-fade-in">
              {workingHours.length > 0 ? workingHours.map((hour) => (
                <div
                  key={hour.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${hour.day_of_week === todayIndex ? 'bg-glam-blush-soft/50' : ''}`}
                >
                  <span className={`text-sm ${hour.day_of_week === todayIndex ? 'font-semibold text-glam-rose' : 'text-glam-ink'}`}>
                    {dayNames[hour.day_of_week]}
                  </span>
                  {hour.is_working ? (
                    <span className="text-sm text-muted-foreground">
                      {formatTime(hour.start_time)} - {formatTime(hour.end_time)}
                    </span>
                  ) : (
                    <span className="text-sm text-muted-foreground">{t.settings.closed}</span>
                  )}
                </div>
              )) : (
                <p className="text-sm text-muted-foreground text-center py-2">{t.artist.noWorkingHours}</p>
              )}
            </div>
          )}
        </div>

        {/* Blocked Dates Alert */}
        {upcomingBlockedDates.length > 0 && (
          <div className="bg-glam-warning/10 rounded-2xl p-4 border border-glam-warning/25">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-glam-warning/15 flex items-center justify-center">
                <CalendarOff className="w-5 h-5 text-glam-warning" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t.blockedDates.unavailableDates}</p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(upcomingBlockedDates[0].blocked_date), "MMM d", { locale: dateLocale })}
                  {upcomingBlockedDates.length > 1 && ` +${upcomingBlockedDates.length - 1} more`}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>


      {/* Main Tabs */}
      <div ref={tabsRef} className="mt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
          {/* Sticky tab bar */}
          <div className={`px-4 transition-all duration-200 ${isTabsSticky ? `sticky ${showMiniHeader ? 'top-[74px]' : 'top-2'} z-40 border-y border-glam-border bg-glam-porcelain/95 py-2 backdrop-blur-md` : ''}`}>
            <div ref={servicesSectionRef}>
              <TabsList
                aria-label={isRTL ? "أقسام ملف الفنانة" : "Artist profile sections"}
                className="grid h-auto w-full grid-cols-3 gap-1 rounded-2xl border border-glam-border bg-glam-surface p-1 shadow-sm"
              >
                {([
                  { value: "services", label: isRTL ? "الخدمات" : "Services", Icon: Briefcase, count: services?.length ?? 0 },
                  { value: "reviews", label: isRTL ? "التقييمات" : "Reviews", Icon: Star, count: reviews?.length ?? 0 },
                  { value: "gallery", label: isRTL ? "المعرض" : "Gallery", Icon: ImageIcon, count: portfolioItems.length },
                ] as const).map(({ value, label, Icon, count }) => (
                  <TabsTrigger
                    key={value}
                    value={value}
                    aria-label={label}
                    className="group relative min-w-0 flex-col gap-0.5 rounded-xl border-0 bg-transparent px-0.5 py-2 text-[10px] font-semibold leading-none text-glam-muted shadow-none transition-colors hover:bg-glam-blush/35 hover:text-glam-ink focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-1 data-[state=active]:bg-glam-ink data-[state=active]:text-white data-[state=active]:shadow-sm"
                  >
                    <Icon className="h-4 w-4 shrink-0 text-glam-rose group-data-[state=active]:text-white" strokeWidth={1.8} />
                    <span className="w-full truncate">{label}</span>
                    {count > 0 && (
                      <span className="absolute end-1 top-1 grid h-4 min-w-4 place-items-center rounded-full bg-glam-rose px-1 text-[9px] font-bold leading-none text-white group-data-[state=active]:bg-white group-data-[state=active]:text-glam-ink">
                        {count}
                      </span>
                    )}
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>
          </div>

          {/* Tab content with padding */}
          <div className="px-5">

          {/* Services Tab */}
          <TabsContent value="services" className="mt-4 space-y-3">
            {servicesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-2xl" />
                ))}
              </>
            ) : services && services.length > 0 ? (
              <div className="space-y-3">
                {services.map((service, index) => {
                  const svcImage = (service as any).image_url || artist1;
                  const svcName = isRTL
                    ? ((service as any).name_ar || service.name)
                    : ((service as any).name_en || service.name);
                  const svcFav = favorites.some(
                    (f) => f.item_id === service.id && f.item_type === "service"
                  );
                  return (
                    <div
                      key={service.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => handleBookService(service.id, service.name)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleBookService(service.id, service.name);
                        }
                      }}
                      className="flex items-center gap-3 bg-white rounded-2xl border border-glam-border/60 p-2.5 cursor-pointer animate-fade-in transition-transform duration-200 active:scale-[0.99] [box-shadow:0_14px_28px_-20px_rgba(16,20,23,0.15)]"
                      style={{ animationDelay: `${index * 50}ms` }}
                    >
                      <div className="relative h-[84px] w-[84px] shrink-0 overflow-hidden rounded-xl bg-glam-surface">
                        <img
                          src={svcImage}
                          alt={svcName}
                          loading="lazy"
                          draggable={false}
                          className="absolute inset-0 h-full w-full object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-glam-ink truncate">{svcName}</p>
                        <p className="mt-0.5 text-[11px] text-glam-muted flex items-center gap-1">
                          <Clock className="w-3 h-3" strokeWidth={1.75} />
                          {service.duration_minutes} {isRTL ? "دقيقة" : "mins"}
                        </p>
                        <p className="mt-1 text-sm font-bold text-glam-rose">
                          QAR {Number(service.price)}
                        </p>
                      </div>
                      <div className="flex flex-col items-center gap-1.5 shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            if (!user) {
                              navigate("/auth");
                              return;
                            }
                            toggleFavorite("service", service.id);
                          }}
                          aria-label="Favorite service"
                          aria-pressed={svcFav}
                          className="h-8 w-8 rounded-full bg-glam-surface grid place-items-center transition-transform active:scale-90"
                        >
                          <Heart
                            className={cn("w-4 h-4", svcFav ? "fill-glam-rose text-glam-rose" : "text-glam-rose")}
                            strokeWidth={1.75}
                          />
                        </button>
                        <span className="h-8 w-8 rounded-full bg-glam-ink grid place-items-center">
                          <ChevronRight className={cn("w-4 h-4 text-white", isRTL && "rotate-180")} strokeWidth={2} />
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="relative overflow-hidden rounded-3xl border border-glam-border/60 bg-white px-6 py-10 text-center shadow-sm">
                <div className="pointer-events-none absolute -top-16 left-1/2 h-40 w-40 -translate-x-1/2 rounded-full bg-glam-blush-soft/60 blur-3xl" />
                <img src="/brand/teaser/perfume.png" alt="" className="motion-safe:animate-[product-float_3.4s_ease-in-out_infinite] pointer-events-none absolute top-4 start-6 w-12 h-12 object-contain drop-shadow-sm" />
                <img src="/brand/teaser/lipstick.png" alt="" className="motion-safe:animate-[product-float_4s_ease-in-out_0.6s_infinite] pointer-events-none absolute top-6 end-6 w-14 h-14 object-contain drop-shadow-sm" />
                <img src="/brand/teaser/nail-polish.png" alt="" className="motion-safe:animate-[product-float_4.6s_ease-in-out_1.2s_infinite] pointer-events-none absolute top-[72px] start-12 w-11 h-11 object-contain drop-shadow-sm" />
                <img src="/brand/teaser/mascara.png" alt="" className="motion-safe:animate-[product-float_3.8s_ease-in-out_1.8s_infinite] pointer-events-none absolute top-[88px] end-16 w-11 h-11 object-contain drop-shadow-sm" />
                <span className="relative inline-flex items-center gap-1.5 rounded-full bg-glam-blush-soft/50 px-3 py-1 text-[11px] font-bold text-glam-rose">
                  <span className="relative flex h-2 w-2">
                    <span className="motion-safe:animate-ping absolute inline-flex h-full w-full rounded-full bg-glam-rose opacity-60" />
                    <span className="relative inline-flex h-2 w-2 rounded-full bg-glam-rose" />
                  </span>
                  {isRTL ? "قريبًا" : "Coming soon"}
                </span>
                <p className="relative mt-4 text-base font-bold text-glam-ink">{isRTL ? "شنو راح تقدم لك؟" : "What will she offer?"}</p>
                <p key={teaserIdx} className="animate-scale-in relative mt-1 text-2xl font-black text-glam-rose">{teaserWords[teaserIdx]}</p>
                <button
                  onClick={handleFavoriteToggle}
                  className={cn(
                    "relative mx-auto mt-6 flex h-11 items-center gap-2 rounded-full px-6 text-sm font-bold transition-all active:scale-95",
                    isFavorite ? "bg-glam-blush-soft/60 text-glam-rose" : "bg-glam-ink text-white"
                  )}
                >
                  <span className="relative grid place-items-center">
                    <Heart className={cn("w-4 h-4", isFavorite ? "fill-glam-rose text-glam-rose fav-burst" : "text-white")} />
                    {isFavorite && <span className="fav-ring" />}
                  </span>
                  {isFavorite
                    ? (isRTL ? "بنوصلك جديدها أول بأول" : "You will hear about it first")
                    : (isRTL ? "أعلميني عند الإضافة" : "Notify me when live")}
                </button>
              </div>
            )}
          </TabsContent>


          {/* Reviews Tab */}
          <TabsContent value="reviews" className="mt-4 space-y-4">
            {/* Reviews Summary */}
            {reviews && reviews.length > 0 && (
              <div className="bg-muted/50 rounded-2xl p-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{Number(artist.rating)?.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={`w-3.5 h-3.5 ${star <= Math.round(Number(artist.rating)) ? 'text-glam-rose fill-glam-rose' : 'text-glam-border'}`}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{artist.total_reviews} {t.artist.reviews}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = (count / reviews.length) * 100;
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-3">{rating}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-glam-rose rounded-full transition-all"
                              style={{ width: `${percentage}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {/* Sort */}
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{filteredAndSortedReviews.length} {t.artist.reviews}</span>
              <select
                value={reviewSort}
                onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                className="px-3 py-1.5 text-sm rounded-lg bg-muted border-0 focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="newest">{t.artist.newest}</option>
                <option value="highest">{t.artist.highestRated}</option>
              </select>
            </div>

            {/* Reviews List */}
            {reviewsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-2xl" />
                ))}
              </>
            ) : filteredAndSortedReviews.length > 0 ? (
              <div className="space-y-4">
                {filteredAndSortedReviews.map((review, index) => (
                  <div
                    key={review.id}
                    className="bg-card rounded-2xl p-4 border border-border/50 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="flex items-start gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary">
                          {review.customer_profile?.full_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground truncate">
                            {review.customer_profile?.full_name || t.artist.anonymous}
                          </p>
                          <div className="flex items-center gap-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`w-3 h-3 ${i < review.rating ? "fill-glam-rose text-glam-rose" : "text-glam-border"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(review.created_at), "MMM d, yyyy", { locale: dateLocale })}
                        </p>
                        {review.comment && (
                          <p className="text-sm text-foreground mt-2 leading-relaxed">{review.comment}</p>
                        )}

                        {/* Review Photos */}
                        {review.photos && review.photos.length > 0 && (
                          <div className="flex gap-2 mt-3 overflow-x-auto scrollbar-hide">
                            {review.photos.map((photo, idx) => (
                              <img
                                key={idx}
                                src={photo}
                                alt={`Review photo ${idx + 1}`}
                                className="w-16 h-16 object-cover rounded-lg flex-shrink-0"
                              />
                            ))}
                          </div>
                        )}

                        {/* Helpful Button */}
                        <div className="mt-3 flex items-center gap-2">
                          <HelpfulReviewButton
                            reviewId={review.id}
                            helpfulCount={0}
                            isCompact
                          />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Star className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t.artist.noReviews}</p>
              </div>
            )}
          </TabsContent>

          {/* Gallery Tab */}
          <TabsContent value="gallery" className="mt-4 space-y-4">
            {/* Category Filter */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              <Badge
                variant={galleryFilter === "all" ? "default" : "outline"}
                className="cursor-pointer whitespace-nowrap"
                onClick={() => setGalleryFilter("all")}
              >
                {t.artist.all || "All"} {portfolioItems.length > 0 && `(${portfolioItems.length})`}
              </Badge>
              {PORTFOLIO_CATEGORIES.map((category) => {
                const count = portfolioItems.filter(item => item.category === category).length;
                if (count === 0) return null;
                return (
                  <Badge
                    key={category}
                    variant={galleryFilter === category ? "default" : "outline"}
                    className="cursor-pointer whitespace-nowrap"
                    onClick={() => setGalleryFilter(category)}
                  >
                    {category} ({count})
                  </Badge>
                );
              })}
            </div>

            {/* Gallery Grid */}
            {portfolioLoading ? (
              <div className="grid grid-cols-3 gap-2">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <Skeleton key={i} className="aspect-square rounded-lg" />
                ))}
              </div>
            ) : portfolioItems.length > 0 ? (
              <>
                {/* Filtered Items */}
                {(() => {
                  const filteredItems = galleryFilter === "all"
                    ? portfolioItems
                    : portfolioItems.filter(item => item.category === galleryFilter);

                  if (filteredItems.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                          <Camera className="w-8 h-8 text-muted-foreground" />
                        </div>
                        <p className="text-muted-foreground">
                          {t.artist.noPortfolioInCategory || "No images in this category"}
                        </p>
                      </div>
                    );
                  }

                  return (
                    <div className="grid grid-cols-3 gap-2">
                      {filteredItems.map((item, index) => (
                        <div
                          key={item.id}
                          className="relative aspect-square rounded-lg overflow-hidden cursor-pointer group"
                          onClick={() => {
                            setLightboxIndex(portfolioItems.indexOf(item));
                            setLightboxOpen(true);
                          }}
                        >
                          <img
                            src={item.image_url}
                            alt={item.title || "Portfolio"}
                            className="w-full h-full object-cover transition-transform group-hover:scale-105"
                          />
                          {/* Featured Badge */}
                          {item.is_featured && (
                            <div className="absolute top-1 left-1/2 -translate-x-1/2">
                              <span className="grid place-items-center h-6 w-6 rounded-full bg-white/90 backdrop-blur-sm shadow">
                                <Star className="w-3.5 h-3.5 text-glam-rose fill-glam-rose" />
                              </span>
                            </div>
                          )}
                          {/* Category Badge */}
                          {item.category && (
                            <div className="absolute bottom-1 left-1">
                              <span className="inline-flex items-center rounded-full text-[10px] font-semibold px-2 py-0.5 bg-white/90 backdrop-blur-sm text-glam-ink shadow-sm">
                                {item.category}
                              </span>
                            </div>
                          )}
                          {/* Hover Overlay */}
                          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
                        </div>
                      ))}
                    </div>
                  );
                })()}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Camera className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">
                  {t.artist.noPortfolio || "No portfolio images yet"}
                </p>
              </div>
            )}
          </TabsContent>

          </div>
        </Tabs>
      </div>

      {/* Similar artists */}
      {similarArtists.length > 0 && (
        <div className="mt-8">
          <div className="px-5 flex items-center justify-between">
            <h2 className="text-base font-bold text-glam-ink">{isRTL ? "خبيرات مشابهات" : "Similar artists"}</h2>
            <button onClick={() => navigate("/makeup-artists")} className="text-xs font-semibold text-glam-rose">
              {isRTL ? "عرض الكل" : "See all"}
            </button>
          </div>
          <div className="mt-3 flex gap-3 overflow-x-auto px-5 pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {similarArtists.map((a) => {
              const img = a.profile?.avatar_url || a.featured_image || artist1;
              return (
                <button
                  key={a.id}
                  onClick={() => navigate("/artist/" + a.id)}
                  className="w-[150px] shrink-0 text-start bg-white rounded-2xl border border-glam-border/60 overflow-hidden shadow-sm transition-transform active:scale-[0.98]"
                >
                  <div className="h-[110px] w-full overflow-hidden">
                    <img src={img} alt={a.profile?.full_name || ""} loading="lazy" className="w-full h-full object-cover" />
                  </div>
                  <div className="p-2.5">
                    <p className="text-[13px] font-bold text-glam-ink truncate">{a.profile?.full_name || (isRTL ? "فنانة" : "Artist")}</p>
                    <div className="mt-0.5 flex items-center gap-1">
                      <Star className="w-3 h-3 fill-glam-rose text-glam-rose" />
                      <span className="text-[11px] font-semibold text-glam-ink">{Number(a.rating || 0).toFixed(1)}</span>
                      {(a.total_reviews || 0) > 0 && (
                        <span className="text-[10px] text-glam-muted">({a.total_reviews})</span>
                      )}
                    </div>
                    {a.categories?.[0] && (
                      <span className="mt-1.5 inline-block rounded-full bg-glam-blush-soft/50 px-2 py-0.5 text-[9.5px] font-semibold text-glam-rose">
                        {a.categories[0]}
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Lightbox for Gallery */}
      <ImageLightbox
        images={portfolioItems.map(item => ({
          url: item.image_url,
          title: item.title,
          category: item.category,
        }))}
        initialIndex={lightboxIndex}
        open={lightboxOpen}
        onOpenChange={setLightboxOpen}
      />

      {/* ─── Floating Book Now CTA (appears after scrolling past hero) ─── */}
      {services && services.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-40 px-5 pb-[calc(env(safe-area-inset-bottom,0px)+16px)]">
          <div className="mx-auto max-w-md">
            {nextAvailable && (
              <div className="mb-2 flex justify-center">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-white/95 backdrop-blur-md border border-glam-border/60 shadow-sm px-3.5 py-1.5 text-[11px] font-semibold text-glam-ink">
                  <Clock className="w-3.5 h-3.5 text-glam-rose" strokeWidth={2} />
                  {isRTL ? "أقرب موعد:" : "Next slot:"} {nextAvailable.label}
                </span>
              </div>
            )}
            <button
              onClick={() => {
                const first = services[0];
                handleBookService(first.id, first.name);
              }}
              className="w-full h-14 rounded-full bg-glam-ink text-white text-base font-bold shadow-[0_18px_36px_-12px_rgba(16,20,23,0.45)] transition-all duration-200 hover:bg-glam-ink/90 active:scale-[0.98]"
            >
              <span className="flex flex-col items-center leading-tight gap-0.5">
                <span>{isRTL ? "احجزي الآن" : "Book Now"}</span>
                <span className="text-[11px] font-medium text-white/70">
                  {isRTL ? `يبدأ من QAR ${services[0].price}` : `From QAR ${services[0].price}`}
                </span>
              </span>
            </button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default ArtistProfile;
