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
      <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in border border-border/50">
        {/* Cover Image */}
        <div className="relative h-32 overflow-hidden">
          <img
            src={coverImage}
            alt={`${name}'s work`}
            className="w-full h-full object-cover"
          />
          {/* Favorite Button */}
          <div className={`absolute top-3 ${isRTL ? "left-3" : "right-3"}`}>
            <FavoriteButton
              itemType="artist"
              itemId={id}
              className="bg-card/80 backdrop-blur-sm hover:bg-card"
            />
          </div>
        </div>

        {/* Avatar - overlapping cover */}
        <div className="relative flex justify-center -mt-10">
          <Avatar className="w-20 h-20 border-4 border-card shadow-lg">
            <AvatarImage src={image} alt={name} className="object-cover" />
            <AvatarFallback className="text-xl font-semibold bg-primary/10 text-primary">
              {name.charAt(0)}
            </AvatarFallback>
          </Avatar>
        </div>

        {/* Content - centered */}
        <div className="px-4 pt-3 pb-4 text-center">
          <h3 className="font-semibold text-foreground text-lg">{name}</h3>
          <p className="text-sm text-muted-foreground">{specialty}</p>
          
          {/* Category Badges */}
          {categories.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1 mt-2">
              {categories.slice(0, 3).map((category) => (
                <span
                  key={category}
                  className="px-2 py-0.5 text-xs font-medium bg-primary/10 text-primary rounded-full"
                >
                  {getCategoryLabel(category)}
                </span>
              ))}
              {categories.length > 3 && (
                <span className="px-2 py-0.5 text-xs font-medium bg-muted text-muted-foreground rounded-full">
                  +{categories.length - 3}
                </span>
              )}
            </div>
          )}
          
          {/* Tagline */}
          {tagline && (
            <p className="text-sm text-primary italic mt-2">"{tagline}"</p>
          )}

          {/* Rating */}
          <div className="flex items-center justify-center gap-1 mt-3">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-4 h-4 ${
                  i < Math.round(rating)
                    ? "fill-[hsl(42,85%,55%)] text-[hsl(42,85%,55%)]"
                    : "text-muted-foreground/30"
                }`}
              />
            ))}
            <span className="text-sm font-medium text-foreground ms-1">
              {rating.toFixed(1)}
            </span>
            <span className="text-sm text-muted-foreground">({reviews})</span>
          </div>

          {/* Location */}
          <div className="flex items-center justify-center gap-1 mt-2 text-primary">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-sm">{location}</span>
          </div>

          {/* Book Now Button */}
          <Button 
            className="w-full mt-4 bg-[hsl(350,70%,65%)] hover:bg-[hsl(350,70%,55%)] text-white shadow-md"
            size="lg"
          >
            {t.bookings.bookNow}
          </Button>
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;
