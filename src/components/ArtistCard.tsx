import { Star, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { FavoriteButton } from "./FavoriteButton";
import { useLanguage } from "@/contexts/LanguageContext";

interface ArtistCardProps {
  id: string;
  name: string;
  image: string;
  featuredImage?: string | null;
  rating: number;
  reviews: number;
  specialty: string;
  price: number;
  location: string;
  tagline?: string;
  categories?: string[];
}

const ArtistCard = ({
  id,
  name,
  image,
  featuredImage,
  rating,
  reviews,
  specialty,
  location,
  tagline,
  categories = [],
}: ArtistCardProps) => {
  const coverImage = featuredImage || image;
  const { t, isRTL } = useLanguage();

  // Category translation map
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

  return (
    <Link to={`/artist/${id}`} className="block">
      <div className="bg-card rounded-lg sm:rounded-2xl overflow-hidden shadow-sm sm:shadow-md hover:shadow-lg sm:hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 sm:hover:-translate-y-1 animate-fade-in border border-border/50">
        {/* Cover Image */}
        <div className="relative h-14 sm:h-32 overflow-hidden">
          <img
            src={coverImage}
            alt={`${name}'s work`}
            className="w-full h-full object-cover"
          />
          {/* Favorite Button */}
          <div className={`absolute top-1 sm:top-3 ${isRTL ? "left-1 sm:left-3" : "right-1 sm:right-3"}`}>
            <FavoriteButton
              itemType="artist"
              itemId={id}
              className="bg-card/80 backdrop-blur-sm hover:bg-card w-6 h-6 sm:w-10 sm:h-10"
            />
          </div>
        </div>

        {/* Avatar - overlapping cover */}
        <div className="relative flex justify-center -mt-5 sm:-mt-10">
          <Avatar className="w-10 h-10 sm:w-20 sm:h-20 border-2 sm:border-4 border-card shadow-md sm:shadow-lg">
            <AvatarImage src={image} alt={name} className="object-cover" />
            <AvatarFallback className="text-sm sm:text-xl font-semibold bg-primary/10 text-primary">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content - centered */}
        <div className="px-2 sm:px-4 pt-1 sm:pt-3 pb-2 sm:pb-4 text-center">
          <h3 className="font-semibold text-foreground text-xs sm:text-lg line-clamp-1">{name}</h3>
          <p className="text-[10px] sm:text-sm text-muted-foreground">{specialty}</p>
          
          {/* Category Badges - hidden on mobile */}
          {categories.length > 0 && (
            <div className="hidden sm:flex flex-wrap justify-center gap-1 mt-2">
              {categories.slice(0, 2).map((category) => (
                <span
                  key={category}
                  className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full"
                >
                  {getCategoryLabel(category)}
                </span>
              ))}
              {categories.length > 2 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  +{categories.length - 2}
                </span>
              )}
            </div>
          )}
          
          {/* Tagline - hidden on mobile for compactness */}
          {tagline && (
            <p className="hidden sm:block text-sm text-primary italic mt-2">"{tagline}"</p>
          )}

          {/* Rating */}
          <div className="flex items-center justify-center gap-0.5 mt-1 sm:mt-3">
            <Star className="w-2.5 h-2.5 sm:w-4 sm:h-4 fill-[hsl(42,85%,55%)] text-[hsl(42,85%,55%)]" />
            <span className="text-[10px] sm:text-sm font-medium text-foreground">
              {rating.toFixed(1)}
            </span>
            <span className="text-[10px] sm:text-sm text-muted-foreground">({reviews})</span>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-0.5 mt-1 sm:mt-2 text-primary">
            <MapPin className="w-2.5 h-2.5 sm:w-3.5 sm:h-3.5" />
            <span className="text-[10px] sm:text-sm line-clamp-1">{location}</span>
          </div>

          {/* Book Now Button */}
          <Button 
            className="w-full mt-2 sm:mt-4 bg-[hsl(350,70%,65%)] hover:bg-[hsl(350,70%,55%)] text-white shadow-sm sm:shadow-md text-[10px] sm:text-base h-7 sm:h-9"
            size="sm"
          >
            {t.bookings.bookNow}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;
