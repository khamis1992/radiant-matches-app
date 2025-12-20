import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Heart, Share2, Clock, Award, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import ServiceCard from "@/components/ServiceCard";
import ReviewCard from "@/components/ReviewCard";
import { useArtist } from "@/hooks/useArtists";
import { useArtistServices } from "@/hooks/useServices";
import { useArtistReviews } from "@/hooks/useReviews";
import { format, formatDistanceToNow } from "date-fns";

import artist1 from "@/assets/artist-1.jpg";

const ArtistProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isFavorite, setIsFavorite] = useState(false);

  const { data: artist, isLoading: artistLoading } = useArtist(id);
  const { data: services, isLoading: servicesLoading } = useArtistServices(id);
  const { data: reviews, isLoading: reviewsLoading } = useArtistReviews(id);

  const handleBookService = (serviceName: string) => {
    navigate(`/booking/${id}?service=${encodeURIComponent(serviceName)}`);
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
          <p className="text-muted-foreground mb-4">Artist not found</p>
          <Button onClick={() => navigate("/home")}>Go Home</Button>
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
        <div className="absolute top-0 left-0 right-0 p-4 flex items-center justify-between">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
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
            <button className="p-2 rounded-full bg-card/80 backdrop-blur-sm shadow-md">
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
                {artist.bio?.split(".")[0] || "Makeup Artist"}
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
              <span className="text-sm">{artist.experience_years || 0} years</span>
            </div>
          </div>

          <p className="text-muted-foreground mt-4 text-sm leading-relaxed">
            {artist.bio || "No bio available"}
          </p>

          <div className="flex gap-3 mt-5">
            <Button 
              className="flex-1" 
              onClick={() => services?.[0] && handleBookService(services[0].name)}
              disabled={!services?.length}
            >
              Book Now
            </Button>
            <Button variant="outline" size="icon">
              <MessageCircle className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="px-5 mt-6">
        <Tabs defaultValue="services" className="w-full">
          <TabsList className="w-full bg-muted/50 p-1 rounded-xl">
            <TabsTrigger
              value="services"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Services
            </TabsTrigger>
            <TabsTrigger
              value="portfolio"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Portfolio
            </TabsTrigger>
            <TabsTrigger
              value="reviews"
              className="flex-1 rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm"
            >
              Reviews
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
                  description={service.description || ""}
                  duration={`${service.duration_minutes} mins`}
                  price={Number(service.price)}
                  onBook={() => handleBookService(service.name)}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No services available
              </p>
            )}
          </TabsContent>

          <TabsContent value="portfolio" className="mt-4">
            <div className="grid grid-cols-2 gap-3">
              {artist.portfolio_images && artist.portfolio_images.length > 0 ? (
                artist.portfolio_images.map((image, index) => (
                  <div
                    key={index}
                    className="aspect-[4/5] rounded-xl overflow-hidden shadow-md"
                  >
                    <img
                      src={image}
                      alt={`Portfolio ${index + 1}`}
                      className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                    />
                  </div>
                ))
              ) : (
                <p className="col-span-2 text-center text-muted-foreground py-4">
                  No portfolio images
                </p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {reviewsLoading ? (
              <>
                {[1, 2].map((i) => (
                  <Skeleton key={i} className="h-32 w-full rounded-xl" />
                ))}
              </>
            ) : reviews && reviews.length > 0 ? (
              reviews.map((review) => (
                <ReviewCard
                  key={review.id}
                  name={review.customer_profile?.full_name || "Anonymous"}
                  avatar={review.customer_profile?.avatar_url || artist1}
                  rating={review.rating}
                  date={formatDistanceToNow(new Date(review.created_at), { addSuffix: true })}
                  comment={review.comment || ""}
                />
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">
                No reviews yet
              </p>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ArtistProfile;
