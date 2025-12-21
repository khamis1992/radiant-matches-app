import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useArtists, SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useArtists";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";
import artist1 from "@/assets/artist-1.jpg";

// Category images
import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";

type SortOption = "rating" | "reviews" | "experience" | "name";

const categoryImages: Record<ServiceCategory, string> = {
  "Makeup": categoryMakeup,
  "Hair Styling": categoryHairstyling,
  "Henna": categoryHenna,
  "Lashes & Brows": categoryLashes,
  "Nails": categoryNails,
  "Bridal": categoryBridal,
  "Photoshoot": categoryPhotoshoot,
};

const MakeupArtists = () => {
  const navigate = useNavigate();
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(null);
  const { data: artists, isLoading } = useArtists();

  const filteredAndSortedArtists = useMemo(() => {
    if (!artists) return [];
    
    // Filter by search query and category
    const filtered = artists.filter(artist => {
      // Search filter
      if (searchQuery.trim()) {
        const query = searchQuery.toLowerCase();
        const matchesSearch = (
          artist.profile?.full_name?.toLowerCase().includes(query) ||
          artist.profile?.location?.toLowerCase().includes(query) ||
          artist.bio?.toLowerCase().includes(query)
        );
        if (!matchesSearch) return false;
      }
      
      // Category filter
      if (selectedCategory) {
        const hasCategory = artist.categories?.includes(selectedCategory);
        if (!hasCategory) return false;
      }
      
      return true;
    });
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "rating":
          return (Number(b.rating) || 0) - (Number(a.rating) || 0);
        case "reviews":
          return (b.total_reviews || 0) - (a.total_reviews || 0);
        case "experience":
          return (b.experience_years || 0) - (a.experience_years || 0);
        case "name":
          return (a.profile?.full_name || "").localeCompare(b.profile?.full_name || "");
        default:
          return 0;
      }
    });
  }, [artists, sortBy, searchQuery, selectedCategory]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-xl font-bold text-foreground">Makeup Artists</h1>
        </div>
      </header>

      <div className="px-5 py-6">
        {/* Search Bar */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search artists by name or location..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 pr-10"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full"
            >
              <X className="w-4 h-4 text-muted-foreground" />
            </button>
          )}
        </div>

        {/* Category Filter */}
        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 mb-4">
          <div className="flex gap-4 min-w-max">
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => setSelectedCategory(selectedCategory === category ? null : category)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden transition-all ${
                  selectedCategory === category 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : "ring-1 ring-border group-hover:ring-primary/50"
                }`}>
                  <img
                    src={categoryImages[category]}
                    alt={category}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs md:text-sm max-w-16 md:max-w-20 lg:max-w-24 truncate text-center ${
                  selectedCategory === category ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {category}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Sort and Count */}
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm text-muted-foreground">
            {filteredAndSortedArtists.length} artist{filteredAndSortedArtists.length !== 1 ? 's' : ''} found
            {selectedCategory && ` for ${selectedCategory}`}
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-[160px] h-9">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rating">Highest Rated</SelectItem>
              <SelectItem value="reviews">Most Reviews</SelectItem>
              <SelectItem value="experience">Most Experience</SelectItem>
              <SelectItem value="name">Name (A-Z)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Artists List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4, 5].map((i) => (
              <Skeleton key={i} className="h-24 w-full rounded-xl" />
            ))}
          </div>
        ) : filteredAndSortedArtists.length > 0 ? (
          <div className="space-y-3">
            {filteredAndSortedArtists.map((artist) => (
              <div
                key={artist.id}
                onClick={() => navigate(`/artist/${artist.id}`)}
                className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
              >
                <div className="flex items-start gap-3">
                  <Avatar className="w-14 h-14 border-2 border-primary/20">
                    <AvatarImage 
                      src={artist.profile?.avatar_url || artist1} 
                      alt={artist.profile?.full_name || "Artist"} 
                    />
                    <AvatarFallback>
                      {artist.profile?.full_name?.charAt(0) || "A"}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground">
                      {artist.profile?.full_name || "Unknown Artist"}
                    </h3>
                    {artist.profile?.location && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground mt-0.5">
                        <MapPin className="w-3.5 h-3.5" />
                        <span className="truncate">{artist.profile.location}</span>
                      </div>
                    )}
                    <div className="flex items-center gap-4 mt-2">
                      {artist.rating !== null && (
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                          <span className="font-medium">{Number(artist.rating).toFixed(1)}</span>
                          {artist.total_reviews !== null && artist.total_reviews > 0 && (
                            <span className="text-muted-foreground">
                              ({artist.total_reviews})
                            </span>
                          )}
                        </div>
                      )}
                      {artist.experience_years !== null && artist.experience_years > 0 && (
                        <span className="text-sm text-muted-foreground">
                          {artist.experience_years} yr{artist.experience_years !== 1 ? 's' : ''} exp
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    <FavoriteButton itemType="artist" itemId={artist.id} size="sm" />
                    <Button size="sm" className="shrink-0">
                      View
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No makeup artists found</p>
            {searchQuery && (
              <p className="text-sm mt-1">Try adjusting your search</p>
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MakeupArtists;
