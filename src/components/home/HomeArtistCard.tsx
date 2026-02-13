import { Star, MapPin } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArtistWithPricing } from "@/hooks/useArtistsWithPricing";

interface HomeArtistCardProps {
  artist: ArtistWithPricing;
}

const getCategoryLabel = (category: string, t: ReturnType<typeof useLanguage>["t"]) => {
  const map: Record<string, string> = {
    "Makeup": t.categories.makeup,
    "Hair Styling": t.categories.hairStyling,
    "Henna": t.categories.henna,
    "Lashes & Brows": t.categories.lashesBrows,
    "Nails": t.categories.nails,
    "Bridal": t.categories.bridal,
    "Photoshoot": t.categories.photoshoot,
  };
  return map[category] || category;
};

export const HomeArtistCard = ({ artist }: HomeArtistCardProps) => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const primaryCategory = artist.categories?.[0];

  return (
    <div
      onClick={() => navigate(`/artist/${artist.id}`)}
      className="bg-card rounded-2xl border border-border/40 p-3 shadow-sm hover:shadow-md transition-all cursor-pointer active:scale-[0.98] flex flex-col items-center gap-2"
    >
      {/* Avatar */}
      <Avatar className="w-14 h-14 border-2 border-primary/20 shadow-sm">
        <AvatarImage
          src={artist.profile?.avatar_url || undefined}
          alt={artist.profile?.full_name || "Artist"}
          className="object-cover"
        />
        <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
          {artist.profile?.full_name?.charAt(0) || "A"}
        </AvatarFallback>
      </Avatar>

      {/* Name */}
      <h3 className="font-semibold text-sm text-foreground text-center line-clamp-1">
        {artist.profile?.full_name || "Artist"}
      </h3>

      {/* Rating */}
      <div className="flex items-center gap-1">
        <Star className="w-3.5 h-3.5 fill-primary text-primary" />
        <span className="text-xs font-medium text-foreground">
          {artist.rating ? Number(artist.rating).toFixed(1) : "—"}
        </span>
        {(artist.total_reviews ?? 0) > 0 && (
          <span className="text-[10px] text-muted-foreground">
            ({artist.total_reviews})
          </span>
        )}
      </div>

      {/* Category */}
      {primaryCategory && (
        <span className="text-[11px] italic text-muted-foreground text-center line-clamp-1">
          {getCategoryLabel(primaryCategory, t)}
        </span>
      )}

      {/* Location */}
      {artist.profile?.location && (
        <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
          <MapPin className="w-3 h-3" />
          <span className="line-clamp-1">{artist.profile.location}</span>
        </div>
      )}

      {/* Price */}
      {artist.min_price && (
        <div className="text-sm font-bold text-primary">
          Q{artist.min_price.toFixed(2)}
        </div>
      )}
    </div>
  );
};

export default HomeArtistCard;
