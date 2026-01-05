import { useState, useMemo, useRef } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Heart, Share2, Clock, Award, MessageCircle, CalendarOff, Camera, Briefcase, ChevronRight, Play, Sparkles, Check, Grid3x3, ShoppingBag, Package } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ServiceCard from "@/components/ServiceCard";
import ImageLightbox from "@/components/ImageLightbox";

import { useArtist } from "@/hooks/useArtists";
import { useArtistServices } from "@/hooks/useServices";
import { useArtistReviews } from "@/hooks/useReviews";
import { useArtistPortfolio, PORTFOLIO_CATEGORIES } from "@/hooks/usePortfolio";
import { useProducts } from "@/hooks/useProducts";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";

import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format, isAfter, startOfToday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useFavorites } from "@/hooks/useFavorites";
import HelpfulReviewButton from "@/components/HelpfulReviewButton";

import artist1 from "@/assets/artist-1.jpg";

type ReviewSort = "newest" | "highest";
type ActiveTab = "services" | "reviews" | "gallery" | "market";

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
  const { data: products = [], isLoading: productsLoading } = useProducts(artist?.id);
  const { addToCart } = useUnifiedCart();
  
  const { data: workingHours = [], isLoading: workingHoursLoading } = useWorkingHours(artist?.id);
  const { data: blockedDates = [] } = useBlockedDates(artist?.id);
  const { getOrCreateConversation } = useConversations();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();

  // Check if artist is favorited
  const isFavorite = favorites.some(f => f.item_id === artist?.id && f.item_type === 'artist');

  // Review sorting
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");

  const filteredAndSortedReviews = useMemo(() => {
    if (!reviews) return [];
    let filtered = [...reviews];
    if (reviewSort === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reviewSort === "highest") {
      filtered.sort((a, b) => b.rating - a.rating);
    }
    return filtered;
  }, [reviews, reviewSort]);

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

  useSwipeBack();

  const handleBookService = (serviceId: string, serviceName: string, price: number) => {
    if (!user) {
      toast({
        title: t.auth?.loginRequired || "يرجى تسجيل الدخول أولاً للحجز",
        variant: "destructive",
      });
      navigate("/auth", { state: { from: `/booking/${id}?service=${encodeURIComponent(serviceName)}&serviceId=${serviceId}&price=${price}` } });
      return;
    }
    navigate(`/booking/${id}?service=${encodeURIComponent(serviceName)}&serviceId=${serviceId}&price=${price}`);
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
      toast({ title: t.common.linkCopied });
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

  const displayImage = artist.profile?.avatar_url || artist1;
  const displayName = artist.profile?.full_name || "Unknown Artist";
  const displayLocation = artist.profile?.location || artist.studio_address || "Location TBD";
  
  const lowestPrice = services?.length ? Math.min(...services.map(s => Number(s.price))) : null;

  return (
    <div className="min-h-screen bg-background pb-28">
      {/* Hero Section with Parallax-like effect */}
      <div className="relative h-80 overflow-hidden">
        <img
          src={displayImage}
          alt={displayName}
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent" />

        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <BackButton variant="overlay" />
          <div className="flex gap-2">
            <button
              onClick={handleFavoriteToggle}
              className="p-2.5 rounded-full bg-card/90 backdrop-blur-md shadow-lg border border-border/50 transition-all hover:scale-105 active:scale-95"
            >
              <Heart
                className={`w-5 h-5 transition-colors ${isFavorite ? "text-primary fill-primary" : "text-foreground"}`}
              />
            </button>
            <button
              onClick={handleShare}
              className="p-2.5 rounded-full bg-card/90 backdrop-blur-md shadow-lg border border-border/50 transition-all hover:scale-105 active:scale-95"
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Availability Badge */}
        {artist.is_available && (
          <div className="absolute bottom-24 left-5">
            <Badge className="bg-green-500/90 backdrop-blur-sm text-white border-0 gap-1.5 py-1.5 px-3">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" />
              {t.availability?.availableToday || "Available Now"}
            </Badge>
          </div>
        )}
      </div>

      {/* Profile Card - Floating */}
      <div className="px-5 -mt-20 relative z-10">
        <div className="bg-card rounded-3xl p-6 shadow-xl border border-border/50 backdrop-blur-sm">
          {/* Top Row */}
          <div className="flex items-start gap-4">
            <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
              <AvatarImage src={displayImage} alt={displayName} />
              <AvatarFallback className="text-2xl bg-primary/10 text-primary">
                {displayName.charAt(0)}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h1 className="text-xl font-bold text-foreground truncate">{displayName}</h1>
              <p className="text-primary font-medium text-sm mt-0.5">
                {artist.bio?.split(".")[0] || t.artist.makeupArtist}
              </p>

              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" />
                  <span className="font-semibold text-foreground text-sm">
                    {Number(artist.rating)?.toFixed(1) || "0.0"}
                  </span>
                  <span className="text-xs text-muted-foreground">({artist.total_reviews || 0})</span>
                </div>
                <span className="text-muted-foreground">•</span>
                <div className="flex items-center gap-1 text-muted-foreground">
                  <MapPin className="w-3.5 h-3.5" />
                  <span className="text-xs">{displayLocation}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3 mt-5">
            <div className="bg-muted/50 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Award className="w-4 h-4" />
              </div>
              <p className="font-bold text-foreground mt-1">{artist.experience_years || 0}</p>
              <p className="text-xs text-muted-foreground">{t.artist.yearsExperience || "Years"}</p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Star className="w-4 h-4" />
              </div>
              <p className="font-bold text-foreground mt-1">{artist.total_reviews || 0}</p>
              <p className="text-xs text-muted-foreground">{t.artist.reviews}</p>
            </div>
            <div className="bg-muted/50 rounded-2xl p-3 text-center">
              <div className="flex items-center justify-center gap-1 text-primary">
                <Briefcase className="w-4 h-4" />
              </div>
              <p className="font-bold text-foreground mt-1">{services?.length || 0}</p>
              <p className="text-xs text-muted-foreground">{t.artist.servicesOffered || "Services"}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="flex gap-3 mt-5">
            <Button
              className="flex-1 h-12 rounded-xl font-medium"
              onClick={() => {
                if (!user) {
                  navigate("/auth");
                  return;
                }

                setActiveTab("services");
                // Scroll to the services section so the user can pick a service to book.
                servicesSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
            >
              {lowestPrice ? `${t.artist.bookAppointment} • QAR ${lowestPrice}+` : t.artist.bookAppointment}
            </Button>
            <Button
              variant="outline"
              size="icon"
              className="h-12 w-12 rounded-xl"
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
                  toast({ title: t.errors.somethingWrong, variant: "destructive" });
                }
              }}
              disabled={getOrCreateConversation.isPending}
            >
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Quick Info Cards */}
      <div className="px-5 mt-4 space-y-3">
        {/* Today's Hours Card */}
        <div 
          className="bg-card rounded-2xl p-4 border border-border/50 cursor-pointer transition-all hover:shadow-md"
          onClick={() => setShowAllHours(!showAllHours)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Clock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium text-foreground">{t.settings.workingHours || "Today's Hours"}</p>
                {todayHours?.is_working ? (
                  <p className="text-xs text-muted-foreground">
                    {formatTime(todayHours.start_time)} - {formatTime(todayHours.end_time)}
                  </p>
                ) : (
                  <p className="text-xs text-destructive">{t.settings.closed}</p>
                )}
              </div>
            </div>
            <ChevronRight className={`w-5 h-5 text-muted-foreground transition-transform ${showAllHours ? 'rotate-90' : ''}`} />
          </div>

          {/* Expandable Working Hours */}
          {showAllHours && (
            <div className="mt-4 pt-4 border-t border-border space-y-2 animate-fade-in">
              {workingHours.length > 0 ? workingHours.map((hour) => (
                <div
                  key={hour.id}
                  className={`flex items-center justify-between py-2 px-3 rounded-lg ${hour.day_of_week === todayIndex ? 'bg-primary/10' : ''}`}
                >
                  <span className={`text-sm ${hour.day_of_week === todayIndex ? 'font-medium text-primary' : 'text-foreground'}`}>
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
          <div className="bg-destructive/10 rounded-2xl p-4 border border-destructive/20">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-destructive/20 flex items-center justify-center">
                <CalendarOff className="w-5 h-5 text-destructive" />
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
      <div ref={servicesSectionRef} className="px-5 mt-6">
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as ActiveTab)} className="w-full">
          {/* Mobile-optimized scrollable tab bar */}
          <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
            <TabsList className="inline-flex gap-2 bg-transparent p-0 h-auto min-w-max">
              <TabsTrigger
                value="services"
                className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 
                  data-[state=inactive]:bg-muted/60 data-[state=inactive]:text-muted-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                  active:scale-95 touch-manipulation"
              >
                <Briefcase className="w-4 h-4" />
                <span>{t.artist.servicesOffered}</span>
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 
                  data-[state=inactive]:bg-muted/60 data-[state=inactive]:text-muted-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                  active:scale-95 touch-manipulation"
              >
                <Star className="w-4 h-4" />
                <span>{t.artist.reviews}</span>
                {reviews && reviews.length > 0 && (
                  <span className="text-xs opacity-80">({reviews.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="gallery"
                className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 
                  data-[state=inactive]:bg-muted/60 data-[state=inactive]:text-muted-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                  active:scale-95 touch-manipulation"
              >
                <Grid3x3 className="w-4 h-4" />
                <span>{t.artist.gallery || "Gallery"}</span>
                {portfolioItems.length > 0 && (
                  <span className="text-xs opacity-80">({portfolioItems.length})</span>
                )}
              </TabsTrigger>
              <TabsTrigger
                value="market"
                className="flex items-center gap-2 px-4 py-3 rounded-full text-sm font-medium transition-all duration-200 
                  data-[state=inactive]:bg-muted/60 data-[state=inactive]:text-muted-foreground
                  data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-md
                  active:scale-95 touch-manipulation"
              >
                <ShoppingBag className="w-4 h-4" />
                <span>Market</span>
                {products.length > 0 && (
                  <span className="text-xs opacity-80">({products.length})</span>
                )}
              </TabsTrigger>
            </TabsList>
          </div>

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
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <ServiceCard
                      name={service.name}
                      nameAr={(service as any).name_ar}
                      nameEn={(service as any).name_en}
                      description={service.description || ""}
                      descriptionAr={(service as any).description_ar}
                      descriptionEn={(service as any).description_en}
                      duration={`${service.duration_minutes} mins`}
                      price={Number(service.price)}
                      onBook={() => handleBookService(service.id, service.name, Number(service.price))}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <Briefcase className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">{t.artist.noServices}</p>
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
                          className={`w-3.5 h-3.5 ${star <= Math.round(Number(artist.rating)) ? 'text-[hsl(var(--gold))] fill-[hsl(var(--gold))]' : 'text-muted-foreground'}`}
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
                              className="h-full bg-[hsl(var(--gold))] rounded-full transition-all"
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
                                className={`w-3 h-3 ${i < review.rating ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-muted"}`}
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
                              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            </div>
                          )}
                          {/* Category Badge */}
                          {item.category && (
                            <div className="absolute bottom-1 left-1">
                              <Badge className="text-[10px] px-1.5 py-0 bg-background/90">
                                {item.category}
                              </Badge>
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

          {/* Market Tab */}
          <TabsContent value="market" className="mt-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{products.length} Products</span>
            </div>

            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-48 w-full rounded-2xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden group hover:border-primary/30 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Product Image */}
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${
                            product.product_type === "physical" && product.inventory_count === 0 ? "opacity-50 grayscale" : ""
                          }`}
                        />
                      ) : (
                        <div className={`w-full h-full flex items-center justify-center ${
                          product.product_type === "physical" && product.inventory_count === 0 ? "opacity-50" : ""
                        }`}>
                          <Package className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {/* Out of Stock Overlay */}
                      {product.product_type === "physical" && product.inventory_count === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                          <Badge className="text-xs px-3 py-1 bg-destructive text-destructive-foreground border-0">
                            {language === "ar" ? "نفذت الكمية" : "Out of Stock"}
                          </Badge>
                        </div>
                      )}
                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        {product.is_featured && (
                          <Badge className="text-[10px] px-2 py-0.5 bg-gold text-gold-foreground border-0">
                            Featured
                          </Badge>
                        )}
                        {product.compare_at_price && product.compare_at_price > product.price_qar && (
                          <Badge className="text-[10px] px-2 py-0.5 bg-destructive text-destructive-foreground border-0">
                            Sale
                          </Badge>
                        )}
                        {/* Low stock warning badge */}
                        {product.product_type === "physical" && product.inventory_count > 0 && product.inventory_count <= 5 && (
                          <Badge className="text-[10px] px-2 py-0.5 bg-amber-500 text-white border-0">
                            {language === "ar" ? `متبقي ${product.inventory_count} فقط` : `Only ${product.inventory_count} left`}
                          </Badge>
                        )}
                      </div>
                      {/* Product Type Badge */}
                      <div className="absolute bottom-2 right-2">
                        <Badge className="text-[10px] px-2 py-0.5 bg-background/90 backdrop-blur-sm">
                          {product.product_type}
                        </Badge>
                      </div>
                    </div>

                    {/* Product Info */}
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">
                        {product.title}
                      </h3>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-primary">QAR {product.price_qar}</span>
                          {product.compare_at_price && product.compare_at_price > product.price_qar && (
                            <span className="text-xs text-muted-foreground line-through">
                              QAR {product.compare_at_price}
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Add to Cart Button */}
                      <Button
                        size="sm"
                        className="w-full mt-3 rounded-xl"
                        disabled={product.product_type === "physical" && product.inventory_count === 0}
                        onClick={() => {
                          addToCart.mutate(
                            { productId: product.id, quantity: 1 },
                            {
                              onSuccess: () => {
                                toast({ 
                                  title: language === "ar" ? "تمت الإضافة للسلة" : "Added to cart",
                                  description: !user 
                                    ? (language === "ar" ? "سجل دخولك لحفظ السلة" : "Sign in to save your cart")
                                    : undefined
                                });
                              },
                              onError: (error: any) => {
                                toast({ title: error.message || "Failed to add to cart", variant: "destructive" });
                              },
                            }
                          );
                        }}
                      >
                        <ShoppingBag className="w-4 h-4 mr-1" />
                        {language === "ar" ? "أضف للسلة" : "Add to Cart"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
                  <ShoppingBag className="w-8 h-8 text-muted-foreground" />
                </div>
                <p className="text-muted-foreground">No products available yet</p>
                <p className="text-xs text-muted-foreground mt-1">Check back soon for products from this artist</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>

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

      <BottomNavigation />
    </div>
  );
};

export default ArtistProfile;
