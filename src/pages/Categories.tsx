import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Star, MapPin, Clock, DollarSign, ArrowUpDown, SlidersHorizontal, Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { useArtistsByCategory } from "@/hooks/useArtists";
import { useServicesByCategory, ServiceWithArtist } from "@/hooks/useServices";
import { Skeleton } from "@/components/ui/skeleton";
import { FavoriteButton } from "@/components/FavoriteButton";

import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";
import artist1 from "@/assets/artist-1.jpg";

const categories = [
  { 
    id: "Makeup", 
    name: "Makeup", 
    image: categoryMakeup,
    description: "Professional makeup for any occasion"
  },
  { 
    id: "Hair Styling", 
    name: "Hair Styling", 
    image: categoryHairstyling,
    description: "Beautiful hairstyles and treatments"
  },
  { 
    id: "Henna", 
    name: "Henna", 
    image: categoryHenna,
    description: "Traditional and modern henna designs"
  },
  { 
    id: "Lashes & Brows", 
    name: "Lashes & Brows", 
    image: categoryLashes,
    description: "Lash extensions and brow styling"
  },
  { 
    id: "Nails", 
    name: "Nails", 
    image: categoryNails,
    description: "Manicures, pedicures, and nail art"
  },
  { 
    id: "Bridal", 
    name: "Bridal", 
    image: categoryBridal,
    description: "Complete bridal beauty packages"
  },
  { 
    id: "Photoshoot", 
    name: "Photoshoot", 
    image: categoryPhotoshoot,
    description: "Camera-ready looks for any shoot"
  },
];

type SortOption = "price-low" | "price-high" | "rating" | "duration-short" | "duration-long";

const Categories = () => {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"services" | "artists">("services");
  const [sortBy, setSortBy] = useState<SortOption>("price-low");
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const { data: artists, isLoading: artistsLoading } = useArtistsByCategory(selectedCategory);
  const { data: services, isLoading: servicesLoading } = useServicesByCategory(selectedCategory);

  // Calculate min/max prices from services
  const priceStats = useMemo(() => {
    if (!services || services.length === 0) return { min: 0, max: 1000 };
    const prices = services.map(s => s.price);
    return { min: Math.floor(Math.min(...prices)), max: Math.ceil(Math.max(...prices)) };
  }, [services]);

  const filteredAndSortedServices = useMemo(() => {
    if (!services) return [];
    
    // Filter by search query
    const searchFiltered = services.filter(s => {
      if (!searchQuery.trim()) return true;
      const query = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(query) ||
        (s.description?.toLowerCase().includes(query)) ||
        (s.artist?.profile?.full_name?.toLowerCase().includes(query))
      );
    });
    
    // Filter by price range
    const filtered = searchFiltered.filter(
      s => s.price >= priceRange[0] && s.price <= priceRange[1]
    );
    
    // Sort
    return filtered.sort((a, b) => {
      switch (sortBy) {
        case "price-low":
          return a.price - b.price;
        case "price-high":
          return b.price - a.price;
        case "rating":
          return (b.artist?.rating || 0) - (a.artist?.rating || 0);
        case "duration-short":
          return a.duration_minutes - b.duration_minutes;
        case "duration-long":
          return b.duration_minutes - a.duration_minutes;
        default:
          return 0;
      }
    });
  }, [services, sortBy, priceRange, searchQuery]);

  const handleCategoryClick = (categoryId: string) => {
    if (selectedCategory === categoryId) {
      setSelectedCategory(null);
    } else {
      setSelectedCategory(categoryId);
      setActiveTab("services");
      setSortBy("price-low");
      setPriceRange([0, 1000]); // Reset price range
      setIsFilterOpen(false);
      setSearchQuery(""); // Reset search
    }
  };

  // Update price range when services load
  const handlePriceRangeChange = (values: number[]) => {
    setPriceRange([values[0], values[1]]);
  };

  const isFiltered = priceRange[0] > priceStats.min || priceRange[1] < priceStats.max;
  const hasActiveFilters = isFiltered || searchQuery.trim().length > 0;

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

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
          <h1 className="text-xl font-bold text-foreground">Categories</h1>
        </div>
      </header>

      <div className="px-5 py-6">
        {/* Categories Horizontal Scroll */}
        <div className="overflow-x-auto pb-4 -mx-5 px-5 scrollbar-hide">
          <div className="flex gap-4">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.id)}
                className="flex flex-col items-center gap-2 flex-shrink-0"
              >
                <div 
                  className={`w-20 h-20 md:w-28 md:h-28 lg:w-32 lg:h-32 rounded-2xl overflow-hidden shadow-md transition-all duration-300 hover:shadow-lg ${
                    selectedCategory === category.id 
                      ? "ring-2 ring-primary ring-offset-2" 
                      : ""
                  }`}
                >
                  <img
                    src={category.image}
                    alt={category.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs md:text-sm font-medium text-center max-w-20 md:max-w-28 lg:max-w-32 truncate ${
                  selectedCategory === category.id 
                    ? "text-primary" 
                    : "text-foreground"
                }`}>
                  {category.name}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Selected Category Content */}
        {selectedCategory && (
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-foreground">
                {selectedCategoryData?.name}
              </h2>
              <button 
                onClick={() => setSelectedCategory(null)}
                className="text-sm text-primary font-medium hover:underline"
              >
                Clear
              </button>
            </div>

            <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "services" | "artists")}>
              <TabsList className="w-full mb-4">
                <TabsTrigger value="services" className="flex-1">
                  Services ({services?.length || 0})
                </TabsTrigger>
                <TabsTrigger value="artists" className="flex-1">
                  Artists ({artists?.length || 0})
                </TabsTrigger>
              </TabsList>

              {/* Services Tab */}
              <TabsContent value="services" className="mt-0">
                {/* Search Bar */}
                {services && services.length > 0 && (
                  <div className="relative mb-4">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Search services by name, description, or artist..."
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
                )}

                {/* Price Filter */}
                {services && services.length > 0 && (
                  <Collapsible open={isFilterOpen} onOpenChange={setIsFilterOpen} className="mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-muted-foreground">
                        {filteredAndSortedServices.length} of {services.length} services
                        {hasActiveFilters && " (filtered)"}
                      </span>
                      <div className="flex items-center gap-2">
                        <CollapsibleTrigger asChild>
                          <Button 
                            variant={isFiltered ? "default" : "outline"} 
                            size="sm" 
                            className="h-9"
                          >
                            <SlidersHorizontal className="w-3.5 h-3.5 mr-2" />
                            Filters
                          </Button>
                        </CollapsibleTrigger>
                        <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
                          <SelectTrigger className="w-[160px] h-9">
                            <ArrowUpDown className="w-3.5 h-3.5 mr-2" />
                            <SelectValue placeholder="Sort by" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="price-low">Price: Low to High</SelectItem>
                            <SelectItem value="price-high">Price: High to Low</SelectItem>
                            <SelectItem value="rating">Highest Rated</SelectItem>
                            <SelectItem value="duration-short">Duration: Shortest</SelectItem>
                            <SelectItem value="duration-long">Duration: Longest</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <CollapsibleContent className="space-y-4">
                      <div className="bg-muted/50 rounded-xl p-4 border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-medium text-foreground">Price Range</span>
                          <span className="text-sm text-primary font-semibold">
                            ${priceRange[0]} - ${priceRange[1]}
                          </span>
                        </div>
                        <Slider
                          value={priceRange}
                          onValueChange={handlePriceRangeChange}
                          min={priceStats.min}
                          max={priceStats.max}
                          step={5}
                          className="w-full"
                        />
                        <div className="flex justify-between mt-2 text-xs text-muted-foreground">
                          <span>${priceStats.min}</span>
                          <span>${priceStats.max}</span>
                        </div>
                        {isFiltered && (
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="mt-3 w-full"
                            onClick={() => setPriceRange([priceStats.min, priceStats.max])}
                          >
                            Clear Filter
                          </Button>
                        )}
                      </div>
                    </CollapsibleContent>
                  </Collapsible>
                )}

                {servicesLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-28 w-full rounded-xl" />
                    ))}
                  </div>
                ) : filteredAndSortedServices.length > 0 ? (
                  <div className="space-y-3">
                    {filteredAndSortedServices.map((service) => (
                      <div
                        key={service.id}
                        onClick={() => navigate(`/artist/${service.artist_id}`)}
                        className="bg-card rounded-xl border border-border p-4 shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <div className="flex items-start gap-3">
                          <Avatar className="w-12 h-12 border-2 border-primary/20">
                            <AvatarImage 
                              src={service.artist?.profile?.avatar_url || artist1} 
                              alt={service.artist?.profile?.full_name || "Artist"} 
                            />
                            <AvatarFallback>
                              {service.artist?.profile?.full_name?.charAt(0) || "A"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <h3 className="font-semibold text-foreground">{service.name}</h3>
                            <p className="text-sm text-muted-foreground truncate">
                              by {service.artist?.profile?.full_name || "Unknown Artist"}
                            </p>
                            {service.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {service.description}
                              </p>
                            )}
                            <div className="flex items-center gap-4 mt-2">
                              <div className="flex items-center gap-1 text-sm">
                                <DollarSign className="w-3.5 h-3.5 text-primary" />
                                <span className="font-semibold text-foreground">${service.price}</span>
                              </div>
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Clock className="w-3.5 h-3.5" />
                                <span>{service.duration_minutes} min</span>
                              </div>
                              {service.artist?.rating && (
                                <div className="flex items-center gap-1 text-sm">
                                  <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                                  <span>{Number(service.artist.rating).toFixed(1)}</span>
                                </div>
                              )}
                            </div>
                          </div>
                          <div className="flex flex-col items-end gap-2">
                            <FavoriteButton itemType="service" itemId={service.id} size="sm" />
                            <Button size="sm" className="shrink-0">
                              Book
                            </Button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No services available for {selectedCategoryData?.name} yet</p>
                    <p className="text-sm mt-1">Artists need to add services in this category</p>
                  </div>
                )}
              </TabsContent>

              {/* Artists Tab */}
              <TabsContent value="artists" className="mt-0">
                {artistsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map((i) => (
                      <Skeleton key={i} className="h-24 w-full rounded-xl" />
                    ))}
                  </div>
                ) : artists && artists.length > 0 ? (
                  <div className="space-y-3">
                    {artists.map((artist) => (
                      <div
                        key={artist.id}
                        onClick={() => navigate(`/artist/${artist.id}`)}
                        className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border shadow-sm hover:shadow-md transition-all cursor-pointer"
                      >
                        <Avatar className="w-16 h-16 border-2 border-primary/20">
                          <AvatarImage 
                            src={artist.profile?.avatar_url || artist1} 
                            alt={artist.profile?.full_name || "Artist"} 
                          />
                          <AvatarFallback>
                            {artist.profile?.full_name?.charAt(0) || "A"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-foreground truncate">
                            {artist.profile?.full_name || "Unknown Artist"}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {selectedCategoryData?.name} Specialist
                          </p>
                          <div className="flex items-center gap-3 mt-1">
                            <div className="flex items-center gap-1">
                              <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                              <span className="text-sm font-medium">
                                {Number(artist.rating).toFixed(1)}
                              </span>
                              <span className="text-xs text-muted-foreground">
                                ({artist.total_reviews})
                              </span>
                            </div>
                            <div className="flex items-center gap-1 text-muted-foreground">
                              <MapPin className="w-3 h-3" />
                              <span className="text-xs truncate">
                                {artist.profile?.location || "Location TBD"}
                              </span>
                            </div>
                          </div>
                        </div>
                        <Button size="sm" variant="outline">
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No artists available for {selectedCategoryData?.name} yet</p>
                    <p className="text-sm mt-1">Artists need to add services in this category</p>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </div>
        )}

        {/* Show prompt when no category selected */}
        {!selectedCategory && (
          <div className="text-center py-8 text-muted-foreground">
            <p>Tap a category to browse services and artists</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Categories;
