import { Star, MapPin } from "lucide-react";
import { Button } from "./ui/button";
import { Link } from "react-router-dom";

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
}

const ArtistCard = ({
  id,
  name,
  image,
  featuredImage,
  rating,
  reviews,
  specialty,
  price,
  location,
}: ArtistCardProps) => {
  const displayImage = featuredImage || image;
  return (
    <Link to={`/artist/${id}`} className="block">
      <div className="bg-card rounded-2xl overflow-hidden shadow-md hover:shadow-xl transition-all duration-300 hover:-translate-y-1 animate-fade-in">
        <div className="relative h-48 overflow-hidden">
          <img
            src={displayImage}
            alt={name}
            className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          />
          {featuredImage && (
            <div className="absolute top-3 left-3 bg-primary/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
              <Star className="w-3 h-3 text-primary-foreground fill-primary-foreground" />
              <span className="text-xs font-medium text-primary-foreground">Featured Work</span>
            </div>
          )}
          <div className="absolute top-3 right-3 bg-card/90 backdrop-blur-sm px-2 py-1 rounded-full flex items-center gap-1">
            <Star className="w-3.5 h-3.5 text-[hsl(42,65%,55%)] fill-[hsl(42,65%,55%)]" />
            <span className="text-xs font-semibold">{rating.toFixed(1)}</span>
            <span className="text-xs text-muted-foreground">({reviews})</span>
          </div>
        </div>
        <div className="p-4">
          <h3 className="font-semibold text-foreground text-lg">{name}</h3>
          <p className="text-sm text-primary font-medium mt-0.5">{specialty}</p>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <MapPin className="w-3.5 h-3.5" />
            <span className="text-xs">{location}</span>
          </div>
          <div className="flex items-center justify-between mt-4">
            <div>
              <span className="text-xs text-muted-foreground">From</span>
              <p className="text-lg font-bold text-foreground">${price}</p>
            </div>
            <Button size="sm" className="shadow-sm">
              Book Now
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

export default ArtistCard;
