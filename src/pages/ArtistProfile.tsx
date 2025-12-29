import { useState, useMemo } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Heart, Share2, Clock, Award, MessageCircle, CalendarOff, Flag } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ServiceCard from "@/components/ServiceCard";
import ReviewCard from "@/components/ReviewCard";
import ImageLightbox from "@/components/ImageLightbox";
import { useArtist } from "@/hooks/useArtists";
import { useArtistServices } from "@/hooks/useServices";
import { useArtistReviews } from "@/hooks/useReviews";
import { useArtistPortfolio } from "@/hooks/usePortfolio";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatDistanceToNow, format, isAfter, startOfToday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { useQueryClient } from "@tanstack/react-query";
import { useUserRole } from "@/hooks/useUserRole";
import HelpfulReviewButton from "@/components/HelpfulReviewButton";
import ReportReviewDialog from "@/components/ReportReviewDialog";
import ReviewReplyForm from "@/components/ReviewReplyForm";

import artist1 from "@/assets/artist-1.jpg";

type ReviewSort = "newest" | "highest";

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);
  const [portfolioFilter, setPortfolioFilter] = useState<string>("all");
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  const [lightboxImages, setLightboxImages] = useState<Array<{ url: string; caption?: string }>>([]);

  const { data: artist, isLoading: artistLoading } = useArtist(id);
  const { data: services, isLoading: servicesLoading } = useArtistServices(id);
  const { data: reviews, isLoading: reviewsLoading } = useArtistReviews(id);
  const { data: portfolioItems = [], isLoading: portfolioLoading } = useArtistPortfolio(id);
  const { data: workingHours = [], isLoading: workingHoursLoading } = useWorkingHours(artist?.id);
  const { data: blockedDates = [], isLoading: blockedDatesLoading } = useBlockedDates(artist?.id);
  const { getOrCreateConversation } = useConversations();
  const { user } = useAuth();
  const { t, language } = useLanguage();
  const { isArtist } = useUserRole();
  const queryClient = useQueryClient();

  // Review filtering and sorting
  const [reviewFilter, setReviewFilter] = useState<"all" | "photos">("all");
  const [reviewSort, setReviewSort] = useState<ReviewSort>("newest");

  // Compute filtered and sorted reviews
  const filteredAndSortedReviews = useMemo(() => {
    if (!reviews) return [];
    
    let filtered = [...reviews];
    
    // Filter by photos
    if (reviewFilter === "photos") {
      filtered = filtered.filter(r => r.photos && r.photos.length > 0);
    }
    
    // Sort
    if (reviewSort === "newest") {
      filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (reviewSort === "highest") {
      filtered.sort((a, b) => b.rating - a.rating);
    }
    
    return filtered;
  }, [reviews, reviewFilter, reviewSort]);
  
  // Filter to only show upcoming blocked dates
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

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-8">
        <Skeleton className="h-72 w-full" />
        <div className="px-5 -mt-12 relative z-10">
          <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
            <Skeleton className="h-8 w-48 mb-2" />
            <Skeleton className="h-4 w-32 mb-4" />
            <Skeleton className="h-20 w-full" />
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">{t.artist.notFound}</p>
          <Button onClick={() => navigate("/home")}>{t.nav.home}</Button>
        </div>
      </div>
    );
  }

  const displayImage = artist.profile?.avatar_url || artist1;
  const displayName = artist.profile?.full_name || "Unknown Artist";
  const displayLocation = artist.profile?.location || artist.studio_address || "Location TBD";

  return (
    <div className="min-h-screen bg-background pb-8">
      {/* Header Image */}
      <div className="relative h-72">
        <img
          src={displayImage}
          alt={displayName}
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />
        
        {/* Navigation */}
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between z-10">
          <BackButton variant="overlay" />
          <div className="flex gap-2">
            <button
              onClick={() => setIsFavorite(!isFavorite)}
              className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md"
            >
              <Heart
                className={`w-5 h-5 ${
                  isFavorite ? "text-primary fill-primary" : "text-foreground"
                }`}
              />
            </button>
            <button 
              onClick={async () => {
                const shareData = {
                  title: displayName,
                  text: artist.bio || t.artist.makeupArtist,
                  url: window.location.href,
                };
                
                if (navigator.share && navigator.canShare(shareData)) {
                  try {
                    await navigator.share(shareData);
                  } catch (err) {
                    // User cancelled or share failed silently
                  }
                } else {
                  // Fallback: copy URL to clipboard
                  await navigator.clipboard.writeText(window.location.href);
                  toast({
                    title: t.common.linkCopied,
                  });
                }
              }}
              className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md"
            >
              <Share2 className="w-5 h-5 text-foreground" />
            </button>
          </div>
        </div>
      </div>

      {/* Profile Info */}
      <div className="px-5 -mt-12 relative z-10">
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-foreground">{displayName}</h1>
              <p className="text-primary font-medium mt-1">
                {artist.bio?.split(".")[0] || t.artist.makeupArtist}
              </p>
            </div>
            <div className="flex items-center gap-1 bg-accent px-3 py-1.5 rounded-full">
              <Star className="w-4 h-4 text-[hsl(42,65%,55%)] fill-[hsl(42,65%,55%)]" />
              <span className="font-semibold text-foreground">
                {Number(artist.rating)?.toFixed(1) || "0.0"}
              </span>
              <span className="text-sm text-muted-foreground">({artist.total_reviews || 0})</span>
            </div>
          </div>

          <div className="flex items-center gap-4 mt-4">
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span className="text-sm">{displayLocation}</span>
            </div>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Award className="w-4 h-4" />
              <span className="text-sm">{artist.experience_years || 0} {t.artist.yearsExperience}</span>
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {artist.bio || t.artist.noBio}
          </p>

          <div className="flex gap-3 mt-5">
            <Button 
              variant="outline" 
              className="flex-1"
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
              <MessageCircle className="w-5 h-5 me-2" />
              {t.artist.contactArtist}
            </Button>
          </div>
        </div>

        {/* Working Hours */}
        <div className="bg-card rounded-2xl p-5 shadow-lg border border-border mt-4">
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-5 h-5 text-primary" />
            <h2 className="text-lg font-semibold text-foreground">{t.settings.workingHours}</h2>
          </div>
          
          {workingHoursLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-6 w-full" />
              ))}
            </div>
          ) : workingHours.length > 0 ? (
            <div className="space-y-2">
              {workingHours.map((hour) => (
                <div
                  key={hour.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm font-medium text-foreground">
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
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">{t.artist.noWorkingHours}</p>
          )}
        </div>

        {/* Blocked Dates / Unavailable Days */}
        {!blockedDatesLoading && upcomingBlockedDates.length > 0 && (
          <div className="bg-card rounded-2xl p-5 shadow-lg border border-border mt-4">
            <div className="flex items-center gap-2 mb-4">
              <CalendarOff className="w-5 h-5 text-destructive" />
              <h2 className="text-lg font-semibold text-foreground">{t.blockedDates.unavailableDates}</h2>
            </div>
            <div className="space-y-2">
              {upcomingBlockedDates.map((blockedDate) => (
                <div
                  key={blockedDate.id}
                  className="flex items-center justify-between py-2 border-b border-border last:border-0"
                >
                  <span className="text-sm font-medium text-foreground">
                    {format(new Date(blockedDate.blocked_date), "EEEE, MMM d, yyyy", { locale: dateLocale })}
                  </span>
                  {blockedDate.reason && (
                    <Badge variant="secondary" className="text-xs">
                      {blockedDate.reason}
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="px-5 mt-6">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="services"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              {t.artist.servicesOffered}
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              {t.artist.portfolio}
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              {t.artist.reviews}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4 space-y-3">
            {servicesLoading ? (
              <>
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-24 w-full rounded-xl" />
                ))}
              </>
            ) : services && services.length > 0 ? (
              services.map((service) => (
                <ServiceCard
                  key={service.id}
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
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {t.artist.noServices}
              </p>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4 space-y-4">
            {portfolioLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="aspect-[4/5] rounded-xl" />
                ))}
              </div>
            ) : portfolioItems.length > 0 ? (
              <>
                {/* Category Filter */}
                <div className="flex gap-2 flex-wrap">
                  <Badge
                    variant={portfolioFilter === "all" ? "default" : "outline"}
                    className="cursor-pointer"
                    onClick={() => setPortfolioFilter("all")}
                  >
                    {t.artist.all} ({portfolioItems.length})
                  </Badge>
                  {Object.entries(
                    portfolioItems.reduce((acc, item) => {
                      acc[item.category] = (acc[item.category] || 0) + 1;
                      return acc;
                    }, {} as Record<string, number>)
                  ).map(([category, count]) => (
                    <Badge
                      key={category}
                      variant={portfolioFilter === category ? "default" : "outline"}
                      className="cursor-pointer"
                      onClick={() => setPortfolioFilter(category)}
                    >
                      {category} ({count})
                    </Badge>
                  ))}
                </div>

                {/* Portfolio Grid */}
                <div className="grid grid-cols-2 gap-3">
                  {(() => {
                    const filtered = portfolioFilter === "all" 
                      ? portfolioItems 
                      : portfolioItems.filter(item => item.category === portfolioFilter);
                    // Sort to put featured image first
                    const sorted = [...filtered].sort((a, b) => {
                      if (a.is_featured && !b.is_featured) return -1;
                      if (!a.is_featured && b.is_featured) return 1;
                      return a.display_order - b.display_order;
                    });
                    return sorted.map((item, index) => (
                      <div
                        key={item.id}
                        className="aspect-[4/5] rounded-xl overflow-hidden shadow-md relative group cursor-pointer"
                        onClick={() => {
                          setLightboxIndex(index);
                          setLightboxOpen(true);
                        }}
                      >
                        <img
                          src={item.image_url}
                          alt={item.title || `Portfolio`}
                          className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                        />
                        {/* Featured indicator */}
                        {item.is_featured && (
                          <div className="absolute top-2 end-2">
                            <Badge className="bg-primary text-primary-foreground text-xs gap-1">
                              <Star className="w-3 h-3 fill-current" />
                              {t.artist.featured}
                            </Badge>
                          </div>
                        )}
                        <div className="absolute bottom-2 start-2">
                          <Badge variant="secondary" className="text-xs">
                            {item.category}
                          </Badge>
                        </div>
                        {item.title && (
                          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background/80 to-transparent p-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <p className="text-sm font-medium text-foreground">{item.title}</p>
                          </div>
                        )}
                      </div>
                    ));
                  })()}
                </div>

                {/* Lightbox */}
                <ImageLightbox
                  images={(() => {
                    const filtered = portfolioFilter === "all" 
                      ? portfolioItems 
                      : portfolioItems.filter(item => item.category === portfolioFilter);
                    // Sort to put featured image first (same order as grid)
                    return [...filtered].sort((a, b) => {
                      if (a.is_featured && !b.is_featured) return -1;
                      if (!a.is_featured && b.is_featured) return 1;
                      return a.display_order - b.display_order;
                    }).map(item => ({
                      url: item.image_url,
                      title: item.title,
                      category: item.category,
                    }));
                  })()}
                  initialIndex={lightboxIndex}
                  open={lightboxOpen}
                  onOpenChange={setLightboxOpen}
                />
              </>
            ) : (
              <p className="text-center text-muted-foreground py-8">
                {t.artist.noPortfolio}
              </p>
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {/* Review Filters & Sorting */}
            <div className="flex flex-wrap items-center gap-3 mb-4 pb-4 border-b border-border">
              <span className="text-sm font-medium text-muted-foreground">{t.artist.filterBy}</span>
              <div className="flex gap-2 flex-wrap">
                <button
                  onClick={() => setReviewFilter("all")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${reviewFilter === "all" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                >
                  {t.artist.all}
                </button>
                <button
                  onClick={() => setReviewFilter("photos")}
                  className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${reviewFilter === "photos" ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/80"}`}
                >
                  {t.artist.withPhotos}
                </button>
              </div>
              
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">{t.artist.sortReviews}</span>
                <select
                  value={reviewSort}
                  onChange={(e) => setReviewSort(e.target.value as ReviewSort)}
                  className="px-3 py-1.5 text-sm rounded-lg bg-background border border-border focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value="newest">{t.artist.newest}</option>
                  <option value="highest">{t.artist.highestRated}</option>
                </select>
              </div>
            </div>

            {reviewsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </>
            ) : filteredAndSortedReviews.length > 0 ? (
              filteredAndSortedReviews.map((review) => (
                <div key={review.id} className="border-b border-border pb-4 last:border-0">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                      <AvatarFallback>
                        {review.customer_profile?.full_name?.charAt(0) || "C"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="font-medium text-foreground truncate">
                          {review.customer_profile?.full_name || t.artist.anonymous}
                        </p>
                        <div className="flex items-center gap-2">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className={`w-3 h-3 ${
                                i < review.rating
                                  ? "fill-primary text-primary"
                                  : "text-muted-foreground"
                              }`}
                            />
                          ))}
                          <HelpfulReviewButton 
                            reviewId={review.id} 
                            helpfulCount={review.helpful_count || 0}
                            isCompact
                          />
                          <ReportReviewDialog 
                            reviewId={review.id}
                            trigger={
                              <button className="text-muted-foreground hover:text-foreground transition-colors p-1">
                                <Flag className="w-4 h-4" />
                              </button>
                            }
                            onReported={() => {
                              toast.success(t.artist.reportSuccess);
                              queryClient.invalidateQueries({ queryKey: ["artist-reviews", artistId] });
                            }}
                          />
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(new Date(review.created_at), "MMM d, yyyy")}
                      </p>
                      {review.comment && (
                        <p className="text-sm text-foreground mt-2">{review.comment}</p>
                      )}
                      
                      {/* Review Photos */}
                      {review.photos && review.photos.length > 0 && (
                        <div className="flex gap-2 mt-2">
                          {review.photos.map((photo, idx) => (
                            <img
                              key={idx}
                              src={photo}
                              alt={`Review photo ${idx + 1}`}
                              className="w-20 h-20 object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              onClick={() => {
                                setLightboxIndex(0);
                                setLightboxImages([{ url: photo, caption: '' }]);
                                setLightboxOpen(true);
                              }}
                            />
                          ))}
                        </div>
                      )}

                      {/* Artist Reply */}
                      {isArtist && artist && artist.user_id === user?.id && (
                        <ReviewReplyForm
                          reviewId={review.id}
                          artistId={artist.id}
                          existingReplies={review.replies || []}
                          onSuccess={() => {
                            queryClient.invalidateQueries({ queryKey: ["artist-reviews", artistId] });
                          }}
                        />
                      )}

                      {/* Customer View Replies */}
                      {(!isArtist || artist?.user_id !== user?.id) && review.replies && review.replies.length > 0 && (
                        <div className="mt-3 space-y-2 ml-8 md:ml-12">
                          {review.replies.map((reply: any) => (
                            <div key={reply.id} className="bg-accent/50 p-3 rounded-lg">
                              <div className="flex items-start gap-2">
                                <div className="font-semibold text-primary text-sm">
                                  Artist Reply
                                </div>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(reply.created_at).toLocaleDateString()}
                                </span>
                              </div>
                              <p className="text-sm text-foreground mt-1">
                                {reply.reply}
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                {t.artist.noReviews}
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArtistProfile;
