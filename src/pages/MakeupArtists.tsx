import React, { useState, useMemo, useEffect } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X, Clock, History, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useArtists";
import { useArtistsWithPricing } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { EnhancedArtistCard } from "@/components/artists/EnhancedArtistCard";
import { ViewModeToggle, ViewMode } from "@/components/artists/ViewModeToggle";
import { ArtistFiltersSheet, FilterState } from "@/components/artists/ArtistFiltersSheet";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";

// Category images
import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";

type SortOption = "rating" | "reviews" | "experience" | "name" | "price";

const categoryImages: Record<ServiceCategory, string> = {
  "Makeup": categoryMakeup,
  "Hair Styling": categoryHairstyling,
  "Henna": categoryHenna,
  "Lashes & Brows": categoryLashes,
  "Nails": categoryNails,
  "Bridal": categoryBridal,
  "Photoshoot": categoryPhotoshoot,
};

const SEARCH_HISTORY_KEY = "artist-search-history";
const VIEW_MODE_KEY = "artist-view-mode";
const MAX_SEARCH_HISTORY = 5;

const MakeupArtists = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>("rating");
  
  // Initialize search query from URL param
  const searchParam = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { t, isRTL } = useLanguage();
  
  // View mode with localStorage persistence
  const [viewMode, setViewMode] = useState<ViewMode>(() => {
    if (typeof window !== "undefined") {
      return (localStorage.getItem(VIEW_MODE_KEY) as ViewMode) || "grid";
    }
    return "grid";
  });

  // Filters
  const [filters, setFilters] = useState<FilterState>({
    priceRange: [0, 2000],
    minRating: 0,
    minExperience: 0,
    locations: [],
    serviceTypes: [],
  });
  
  // Get category from URL params
  const categoryParam = searchParams.get("category");
  const initialCategory = categoryParam && SERVICE_CATEGORIES.includes(categoryParam as ServiceCategory) 
    ? categoryParam as ServiceCategory 
    : null;
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(initialCategory);
  
  const { data: artists, isLoading } = useArtistsWithPricing();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get artist IDs for availability check
  const artistIds = useMemo(() => artists?.map(a => a.id) || [], [artists]);
  const { data: availabilityMap } = useArtistsAvailability(artistIds);

  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  // Save view mode preference
  useEffect(() => {
    localStorage.setItem(VIEW_MODE_KEY, viewMode);
  }, [viewMode]);

  useSwipeBack();

  // Calculate max price for filter
  const maxPrice = useMemo(() => {
    if (!artists) return 2000;
    const prices = artists.map(a => a.min_price || 0).filter(p => p > 0);
    return Math.max(...prices, 2000);
  }, [artists]);

  // Update filters max price when data loads
  useEffect(() => {
    if (maxPrice > 0 && filters.priceRange[1] === 2000) {
      setFilters(prev => ({ ...prev, priceRange: [0, maxPrice] }));
    }
  }, [maxPrice]);

  // Category translation map
  const getCategoryLabel = (category: ServiceCategory) => {
    const categoryMap: Record<ServiceCategory, string> = {
      "Makeup": t.categories.makeup,
      "Hair Styling": t.categories.hairStyling,
      "Henna": t.categories.henna,
      "Lashes & Brows": t.categories.lashesBrows,
      "Nails": t.categories.nails,
      "Bridal": t.categories.bridal,
      "Photoshoot": t.categories.photoshoot,
    };
    return categoryMap[category];
  };

  // Update URL when category changes
  const handleCategoryChange = (category: ServiceCategory | null) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  // Save search to history
  const saveToSearchHistory = (query: string) => {
    if (!query.trim()) return;
    const updated = [query, ...searchHistory.filter(s => s !== query)].slice(0, MAX_SEARCH_HISTORY);
    setSearchHistory(updated);
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      saveToSearchHistory(searchQuery.trim());
      setShowSearchHistory(false);
    }
  };

  const filteredAndSortedArtists = useMemo(() => {
    if (!artists) return [];
    
    // Filter by search query, category, availability, and advanced filters
    const filtered = artists.filter(artist => {
      // Search filter
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
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

      // Availability filter
      if (showAvailableOnly && availabilityMap) {
        const availability = availabilityMap.get(artist.id);
        if (!availability?.isAvailableToday) return false;
      }

      // Price filter
      if (artist.min_price !== null && artist.min_price !== undefined) {
        if (artist.min_price < filters.priceRange[0] || artist.min_price > filters.priceRange[1]) {
          return false;
        }
      }

      // Rating filter
      if (filters.minRating > 0) {
        if (!artist.rating || artist.rating < filters.minRating) return false;
      }

      // Experience filter
      if (filters.minExperience > 0) {
        if (!artist.experience_years || artist.experience_years < filters.minExperience) return false;
      }

      // Location filter
      if (filters.locations && filters.locations.length > 0) {
        const artistLocation = artist.profile?.location?.trim();
        if (!artistLocation || !filters.locations.includes(artistLocation)) return false;
      }

      // Service types filter
      if (filters.serviceTypes && filters.serviceTypes.length > 0) {
        const hasMatchingService = filters.serviceTypes.some(
          (service) => artist.categories?.includes(service)
        );
        if (!hasMatchingService) return false;
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
        case "price":
          return (a.min_price || 0) - (b.min_price || 0);
        default:
          return 0;
      }
    });
  }, [artists, sortBy, debouncedSearchQuery, selectedCategory, showAvailableOnly, availabilityMap, filters]);

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <AppHeader
        title={t.artistsListing.title}
        showSearch={true}
        onSearchClick={() => {}}
        style="modern"
      />

      <div className="px-5 py-6">
        {/* Search Bar with History */}
        <div className="relative mb-4">
          <Search className={`absolute ${isRTL ? "right-3" : "left-3"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <Input
            placeholder={t.artistsListing.searchPlaceholder}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setShowSearchHistory(true)}
            onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
            onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
            className={`${isRTL ? "pr-10 pl-10" : "pl-10 pr-10"}`}
          />
          <div className={`absolute ${isRTL ? "left-3" : "right-3"} top-1/2 -translate-y-1/2 flex items-center gap-1`}>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="p-1 hover:bg-muted rounded-full"
              >
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            )}
            <VoiceSearchButton
              onResult={(transcript) => {
                setSearchQuery(transcript);
                saveToSearchHistory(transcript);
              }}
              size="sm"
              className="h-7 w-7"
            />
          </div>

          {/* Search History Dropdown */}
          {showSearchHistory && searchHistory.length > 0 && !searchQuery && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in">
              <div className="flex items-center justify-between px-3 py-2 border-b border-border">
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  <History className="w-3 h-3" />
                  {t.artistsListing.recentSearches}
                </span>
                <button 
                  onClick={clearSearchHistory}
                  className="text-xs text-primary hover:underline"
                >
                  {t.artistsListing.clearHistory}
                </button>
              </div>
              {searchHistory.map((query, idx) => (
                <button
                  key={idx}
                  onMouseDown={() => {
                    setSearchQuery(query);
                    setShowSearchHistory(false);
                  }}
                  className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Search className="w-3.5 h-3.5 text-muted-foreground" />
                  {query}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Category Filter */}
        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 mb-4">
          <div className="flex gap-4 min-w-max">
            {SERVICE_CATEGORIES.map((category) => (
              <button
                key={category}
                onClick={() => handleCategoryChange(selectedCategory === category ? null : category)}
                className="flex flex-col items-center gap-1.5 group"
              >
                <div className={`w-16 h-16 md:w-20 md:h-20 lg:w-24 lg:h-24 rounded-xl overflow-hidden transition-all ${
                  selectedCategory === category 
                    ? "ring-2 ring-primary ring-offset-2 ring-offset-background" 
                    : "ring-1 ring-border group-hover:ring-primary/50"
                }`}>
                  <img
                    src={categoryImages[category]}
                    alt={getCategoryLabel(category)}
                    className="w-full h-full object-cover"
                  />
                </div>
                <span className={`text-xs md:text-sm max-w-16 md:max-w-20 lg:max-w-24 truncate text-center ${
                  selectedCategory === category ? "text-primary font-medium" : "text-muted-foreground"
                }`}>
                  {getCategoryLabel(category)}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filters Row */}
        <div className="flex items-center justify-between gap-3 mb-4 flex-wrap">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {filteredAndSortedArtists.length} {filteredAndSortedArtists.length === 1 ? t.artistsListing.artistsFound : t.artistsListing.artistsFoundPlural}
              {selectedCategory && ` ${t.artistsListing.forCategory} ${getCategoryLabel(selectedCategory)}`}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button
              variant={showAvailableOnly ? "default" : "outline"}
              size="sm"
              onClick={() => setShowAvailableOnly(!showAvailableOnly)}
              className={`text-xs h-8 ${showAvailableOnly ? "bg-green-500 hover:bg-green-600" : ""}`}
            >
              <Clock className="w-3.5 h-3.5 mr-1" />
              {t.availability?.availableToday || "Available Today"}
            </Button>
            
            <ArtistFiltersSheet 
              filters={filters} 
              onFiltersChange={setFilters}
              maxPrice={maxPrice}
            />

            <ViewModeToggle viewMode={viewMode} onViewModeChange={setViewMode} />

            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
              <SelectTrigger className="w-[140px] h-8 text-xs">
                <SelectValue placeholder={t.artistsListing.sortBy} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">{t.artistsListing.highestRated}</SelectItem>
                <SelectItem value="reviews">{t.artistsListing.mostReviews}</SelectItem>
                <SelectItem value="experience">{t.artistsListing.mostExperience}</SelectItem>
                <SelectItem value="price">{t.artistsListing.startingFrom}</SelectItem>
                <SelectItem value="name">{t.artistsListing.nameAZ}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Artists List */}
        {isLoading ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "space-y-3"
          }>
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <Skeleton 
                key={i} 
                className={viewMode === "grid" ? "h-72 w-full rounded-2xl" : "h-32 w-full rounded-xl"} 
              />
            ))}
          </div>
        ) : filteredAndSortedArtists.length > 0 ? (
          <div className={viewMode === "grid" 
            ? "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
            : "space-y-3"
          }>
            {filteredAndSortedArtists.map((artist, index) => {
              const availability = availabilityMap?.get(artist.id);
              return (
                <div 
                  key={artist.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in"
                >
                  <EnhancedArtistCard
                    artist={artist}
                    availability={availability}
                    viewMode={viewMode}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="text-lg font-medium text-foreground mb-2">{t.artistsListing.noArtistsFound}</p>
            {searchQuery && (
              <p className="text-sm text-muted-foreground">{t.artistsListing.adjustSearch}</p>
            )}
            <Button 
              variant="outline" 
              className="mt-4"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowAvailableOnly(false);
                setFilters({ priceRange: [0, maxPrice], minRating: 0, minExperience: 0, locations: [], serviceTypes: [] });
              }}
            >
              {t.artistsListing.resetFilters}
            </Button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default MakeupArtists;
