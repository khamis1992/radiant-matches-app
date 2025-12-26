import { Star, MapPin, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FavoriteButton } from "@/components/FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";
import { Badge } from "@/components/ui/badge";
import { ArtistWithPricing } from "@/hooks/useArtistsWithPricing";

interface EnhancedArtistCardProps {
  artist: ArtistWithPricing;
  availability?: {
    isAvailableToday: boolean;
    todayHours?: { start: string; end: string } | null;
  };
  viewMode: "grid" | "list";
}

export const EnhancedArtistCard = ({
  artist,
  availability,
  viewMode,
}: EnhancedArtistCardProps) => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(":");
    const hour = parseInt(hours);
    const ampm = hour >= 12 ? "PM" : "AM";
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minutes} ${ampm}`;
  };

  const getCategoryLabel = (category: string) => {
    const categoryMap: Record<string, string> = {
      "Makeup": t.categories.makeup,
      "Hair Styling": t.categories.hairStyling,
      "Henna": t.categories.henna,
      "Lashes & Brows": t.categories.lashesBrows,
      "Nails": t.categories.nails,
      "Bridal": t.categories.bridal,
      "Photoshoot": t.categories.photoshoot,
    };
    return categoryMap[category] || category;
  };

  const coverImage = artist.featured_image || artist.profile?.avatar_url;
  const hasPortfolioPreviews = artist.portfolio_previews && artist.portfolio_previews.length > 0;

  if (viewMode === "list") {
    return (
      <div
        onClick={() => navigate(`/artist/${artist.id}`)}
        className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer animate-fade-in"
      >
        <div className="flex items-start gap-3">
          <div className="relative">
            <Avatar className="w-16 h-16 border-2 border-primary/20">
              <AvatarImage 
                src={artist.profile?.avatar_url || undefined} 
                alt={artist.profile?.full_name || "Artist"} 
              />
              <AvatarFallback className="text-lg bg-primary/10 text-primary">
                {artist.profile?.full_name?.charAt(0) || "A"}
              </AvatarFallback>
            </Avatar>
            {availability && (
              <div
                className={`absolute -bottom-0.5 -right-0.5 w-4 h-4 rounded-full border-2 border-card ${
                  availability.isAvailableToday ? "bg-green-500" : "bg-muted-foreground"
                }`}
              />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="font-semibold text-foreground">
                {artist.profile?.full_name || "Unknown Artist"}
              </h3>
              {availability?.isAvailableToday && (
                <Badge className="bg-green-500/90 hover:bg-green-500 text-white text-[10px] px-1.5 py-0">
                  <Clock className="w-2.5 h-2.5 mr-0.5" />
                  {availability.todayHours
                    ? `${formatTime(availability.todayHours.start)} - ${formatTime(availability.todayHours.end)}`
                    : t.availability?.open || "Open"}
                </Badge>
              )}
            </div>
            
            {artist.profile?.location && (
              <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                <MapPin className="w-3.5 h-3.5" />
                <span className="truncate">{artist.profile.location}</span>
              </div>
            )}
            
            {/* Categories */}
            {artist.categories && artist.categories.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {artist.categories.slice(0, 3).map((category) => (
                  <span
                    key={category}
                    className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full"
                  >
                    {getCategoryLabel(category)}
                  </span>
                ))}
                {artist.categories.length > 3 && (
                  <span className="px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-full">
                    +{artist.categories.length - 3}
                  </span>
                )}
              </div>
            )}
            
            <div className="flex items-center gap-4 mt-2">
              {artist.rating !== null && (
                <div className="flex items-center gap-1 text-sm">
                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                  <span className="font-medium">{Number(artist.rating).toFixed(1)}</span>
                  {artist.total_reviews !== null && artist.total_reviews > 0 && (
                    <span className="text-muted-foreground">({artist.total_reviews})</span>
                  )}
                </div>
              )}
              {artist.experience_years !== null && artist.experience_years > 0 && (
                <span className="text-sm text-muted-foreground">
                  {artist.experience_years} {artist.experience_years === 1 ? t.artistsListing.yearExp : t.artistsListing.yearsExp}
                </span>
              )}
              {artist.min_price && (
                <span className="text-sm font-medium text-primary">
                  {t.artistsListing?.startingFrom || "From"} {artist.min_price} QAR
                </span>
              )}
            </div>
          </div>
          
          <div className="flex flex-col items-end gap-2">
            <FavoriteButton itemType="artist" itemId={artist.id} size="sm" />
            <Button size="sm" className="shrink-0">
              {t.artistsListing.view}
            </Button>
          </div>
        </div>

        {/* Portfolio Previews */}
        {hasPortfolioPreviews && (
          <div className="flex gap-2 mt-3 overflow-hidden">
            {artist.portfolio_previews!.slice(0, 3).map((img, idx) => (
              <div key={idx} className="w-20 h-14 rounded-lg overflow-hidden flex-shrink-0">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // Grid View
  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="bg-card rounded-2xl overflow-hidden shadow-sm hover:shadow-lg transition-all cursor-pointer animate-fade-in border border-border/50 group"
    >
      {/* Cover Image */}
      <div className="relative h-32 sm:h-40 overflow-hidden">
        {coverImage ? (
          <img
            src={coverImage}
            alt={`${artist.profile?.full_name}'s work`}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-primary/20 to-primary/5" />
        )}
        
        {/* Overlay gradient */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
        
        {/* Availability Badge */}
        {availability !== undefined && (
          <div className={`absolute top-2 ${isRTL ? "right-2" : "left-2"}`}>
            <Badge
              className={`text-[10px] px-2 py-0.5 ${
                availability.isAvailableToday
                  ? "bg-green-500/90 hover:bg-green-500 text-white"
                  : "bg-muted/90 text-muted-foreground"
              }`}
            >
              <Clock className="w-2.5 h-2.5 mr-1" />
              {availability.isAvailableToday
                ? availability.todayHours
                  ? `${formatTime(availability.todayHours.start)} - ${formatTime(availability.todayHours.end)}`
                  : t.availability?.availableToday || "Available"
                : t.availability?.closedToday || "Closed"}
            </Badge>
          </div>
        )}
        
        {/* Favorite Button */}
        <div className={`absolute top-2 ${isRTL ? "left-2" : "right-2"}`}>
          <FavoriteButton
            itemType="artist"
            itemId={artist.id}
            className="bg-card/80 backdrop-blur-sm hover:bg-card w-8 h-8"
          />
        </div>

        {/* Price Badge */}
        {artist.min_price && (
          <div className={`absolute bottom-2 ${isRTL ? "left-2" : "right-2"}`}>
            <Badge className="bg-card/90 backdrop-blur-sm text-foreground hover:bg-card text-xs">
              {t.artistsListing?.startingFrom || "From"} {artist.min_price} QAR
            </Badge>
          </div>
        )}
      </div>

      {/* Avatar */}
      <div className="relative flex justify-center -mt-8">
        <Avatar className="w-16 h-16 border-4 border-card shadow-lg">
          <AvatarImage src={artist.profile?.avatar_url || undefined} alt={artist.profile?.full_name || ""} className="object-cover" />
          <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
            {artist.profile?.full_name?.charAt(0) || "A"}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Content */}
      <div className="px-4 pt-2 pb-4 text-center">
        <h3 className="font-semibold text-foreground text-base line-clamp-1">
          {artist.profile?.full_name || "Unknown Artist"}
        </h3>
        
        {/* Categories */}
        {artist.categories && artist.categories.length > 0 && (
          <div className="flex flex-wrap justify-center gap-1 mt-2">
            {artist.categories.slice(0, 2).map((category) => (
              <span
                key={category}
                className="px-2 py-0.5 text-[10px] font-medium bg-primary/10 text-primary rounded-full"
              >
                {getCategoryLabel(category)}
              </span>
            ))}
            {artist.categories.length > 2 && (
              <span className="px-2 py-0.5 text-[10px] font-medium bg-muted text-muted-foreground rounded-full">
                +{artist.categories.length - 2}
              </span>
            )}
          </div>
        )}

        {/* Rating & Experience */}
        <div className="flex items-center justify-center gap-3 mt-3">
          {artist.rating !== null && (
            <div className="flex items-center gap-1 text-sm">
              <Star className="w-4 h-4 fill-primary text-primary" />
              <span className="font-medium">{Number(artist.rating).toFixed(1)}</span>
              <span className="text-muted-foreground text-xs">({artist.total_reviews || 0})</span>
            </div>
          )}
          {artist.experience_years !== null && artist.experience_years > 0 && (
            <span className="text-sm text-muted-foreground">
              {artist.experience_years} {t.artistsListing.yearsExp}
            </span>
          )}
        </div>

        {/* Location */}
        {artist.profile?.location && (
          <div className="flex items-center justify-center gap-1 mt-2 text-primary text-sm">
            <MapPin className="w-3.5 h-3.5" />
            <span className="line-clamp-1">{artist.profile.location}</span>
          </div>
        )}

        {/* Portfolio Previews */}
        {hasPortfolioPreviews && (
          <div className="flex justify-center gap-1.5 mt-3">
            {artist.portfolio_previews!.slice(0, 3).map((img, idx) => (
              <div key={idx} className="w-14 h-10 rounded-md overflow-hidden">
                <img src={img} alt="" className="w-full h-full object-cover" />
              </div>
            ))}
          </div>
        )}

        {/* Book Button */}
        <Button className="w-full mt-4" size="sm">
          {t.bookings.bookNow}
        </Button>
      </div>
    </div>
  );
};
