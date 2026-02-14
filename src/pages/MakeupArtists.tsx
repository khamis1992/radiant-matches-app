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
import { MapView } from "@/components/artists/MapView";
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { cn } from "@/lib/utils";

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
    accountType: "all",
  });
  
  // Get category from URL params
  const categoryParam = searchParams.get("category");
  const initialCategory = categoryParam && SERVICE_CATEGORIES.includes(categoryParam as ServiceCategory) 
    ? categoryParam as ServiceCategory 
    : null;
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(initialCategory);
  
  const showMap = searchParams.get("map") === "true";

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

  // Update URL when category changes (preserve search param)
  const handleCategoryChange = (category: ServiceCategory | null) => {
    setSelectedCategory(category);
    const newParams = new URLSearchParams(searchParams);
    if (category) {
      newParams.set("category", category);
    } else {
      newParams.delete("category");
    }
    setSearchParams(newParams);
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
      // Exclude sellers/shops from this page
      if ((artist as any).account_type === "seller") return false;
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
      // Account type filter
      if (filters.accountType && filters.accountType !== "all") {
        if ((artist as any).account_type !== filters.accountType) return false;
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
    <div className="min-h-screen bg-background pb-32">
      {showMap && (
        <MapView 
          artists={filteredAndSortedArtists} 
          onClose={() => {
            const newParams = new URLSearchParams(searchParams);
            newParams.delete("map");
            setSearchParams(newParams);
          }} 
        />
      )}
      {/* Header */}
      <AppHeader
        title={t.artistsListing.title}
        showSearch={true}
        onSearchClick={() => {}}
        style="modern"
        showBack={true}
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

          {/* Auto-suggestions & Search History Dropdown */}
          {showSearchHistory && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-lg z-50 overflow-hidden animate-fade-in max-h-72 overflow-y-auto">
              {/* Show suggestions when typing */}
              {searchQuery.trim() && (() => {
                const query = searchQuery.toLowerCase();
                const suggestions: { type: 'artist' | 'location' | 'category'; value: string; label: string }[] = [];
                
                // Get matching artists
                artists?.forEach(artist => {
                  if (artist.profile?.full_name?.toLowerCase().includes(query)) {
                    suggestions.push({ type: 'artist', value: artist.profile.full_name, label: artist.profile.full_name });
                  }
                });
                
                // Get matching locations
                const locations = [...new Set(artists?.map(a => a.profile?.location).filter(Boolean) as string[])];
                locations.forEach(loc => {
                  if (loc.toLowerCase().includes(query) && !suggestions.find(s => s.value === loc)) {
                    suggestions.push({ type: 'location', value: loc, label: loc });
                  }
                });
                
                // Get matching categories
                SERVICE_CATEGORIES.forEach(cat => {
                  const catLabel = getCategoryLabel(cat);
                  if (cat.toLowerCase().includes(query) || catLabel.toLowerCase().includes(query)) {
                    suggestions.push({ type: 'category', value: cat, label: catLabel });
                  }
                });
                
                const uniqueSuggestions = suggestions.slice(0, 8);
                
                if (uniqueSuggestions.length === 0) return null;
                
                return (
                  <>
                    <div className="px-3 py-2 border-b border-border">
                      <span className="text-xs text-muted-foreground flex items-center gap-1">
                        <Sparkles className="w-3 h-3" />
                        {t.artistsListing.suggestions || "Suggestions"}
                      </span>
                    </div>
                    {uniqueSuggestions.map((suggestion, idx) => (
                      <button
                        key={`${suggestion.type}-${idx}`}
                        onMouseDown={() => {
                          if (suggestion.type === 'category') {
                            handleCategoryChange(suggestion.value as ServiceCategory);
                            setSearchQuery("");
                          } else {
                            setSearchQuery(suggestion.value);
                            saveToSearchHistory(suggestion.value);
                          }
                          setShowSearchHistory(false);
                        }}
                        className="w-full px-3 py-2 text-left text-sm hover:bg-muted transition-colors flex items-center gap-2"
                      >
                        {suggestion.type === 'artist' && <Search className="w-3.5 h-3.5 text-muted-foreground" />}
                        {suggestion.type === 'location' && <span className="w-3.5 h-3.5 text-muted-foreground text-center">📍</span>}
                        {suggestion.type === 'category' && <Sparkles className="w-3.5 h-3.5 text-primary" />}
                        <span className="flex-1">{suggestion.label}</span>
                        <span className="text-xs text-muted-foreground capitalize">
                          {suggestion.type === 'artist' ? (t.artistsListing.artistLabel || "Artist") : 
                           suggestion.type === 'location' ? (t.artistsListing.locationLabel || "Location") : 
                           (t.artistsListing.categoryLabel || "Category")}
                        </span>
                      </button>
                    ))}
                  </>
                );
              })()}
              
              {/* Show history when input is empty */}
              {!searchQuery && searchHistory.length > 0 && (
                <>
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
                </>
              )}
            </div>
          )}
        </div>

        {/* Category Filter - Editorial Magazine Style */}
        <div className="mb-5">
          {/* Horizontal scroll container with snap */}
          <div className="overflow-x-auto scrollbar-hide -mx-5 px-5">
            <div className="flex gap-3 min-w-max pb-1">
              {/* All Categories - Creative Mosaic Card */}
              <button
                onClick={() => handleCategoryChange(null)}
                className="relative flex-shrink-0 group perspective-1000"
              >
                <div
                  className={cn(
                    "relative w-28 h-20 rounded-2xl overflow-hidden transition-all duration-500 ease-out transform-style-3d",
                    selectedCategory === null
                      ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-xl shadow-primary/30 rotate-y-0"
                      : "ring-1 ring-border/50 group-hover:ring-primary/40 group-hover:scale-[1.02] group-hover:rotate-y-6"
                  )}
                >
                  {/* Animated Mosaic Background - Mini Grid of Categories */}
                  <div className="absolute inset-0 grid grid-cols-3 grid-rows-2 gap-0.5 p-0.5">
                    {/* Mini thumbnails with staggered animations */}
                    {[
                      { img: categoryMakeup, delay: '0s' },
                      { img: categoryHairstyling, delay: '0.1s' },
                      { img: categoryHenna, delay: '0.2s' },
                      { img: categoryLashes, delay: '0.3s' },
                      { img: categoryNails, delay: '0.4s' },
                      { img: categoryBridal, delay: '0.5s' },
                    ].map((cat, i) => (
                      <div
                        key={i}
                        className="relative overflow-hidden rounded-sm bg-muted"
                        style={{
                          animation: selectedCategory === null
                            ? `mosaic-pulse 2s ease-in-out infinite ${cat.delay}`
                            : 'none',
                        }}
                      >
                        <img
                          src={cat.img}
                          alt=""
                          className={cn(
                            "w-full h-full object-cover transition-transform duration-700",
                            selectedCategory === null ? "scale-110" : "group-hover:scale-125"
                          )}
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-primary/40 to-transparent" />
                      </div>
                    ))}
                  </div>

                  {/* Animated Shimmer Overlay */}
                  {selectedCategory === null && (
                    <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent animate-shimmer-rotate" />
                  )}

                  {/* Floating Particles (Selected) */}
                  {selectedCategory === null && (
                    <div className="absolute inset-0 pointer-events-none">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="absolute w-1 h-1 rounded-full bg-gold/80 animate-float-particle"
                          style={{
                            left: `${10 + i * 15}%`,
                            top: `${20 + (i % 3) * 25}%`,
                            animationDelay: `${i * 0.2}s`,
                            animationDuration: `${2 + (i % 2)}s`,
                          }}
                        />
                      ))}
                    </div>
                  )}

                  {/* Center Burst Effect (Selected) */}
                  {selectedCategory === null && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="relative">
                        {/* Outer ring */}
                        <div className="absolute inset-0 -m-2 rounded-full border border-primary/40 animate-ping" style={{ animationDuration: '2s' }} />
                        {/* Middle ring */}
                        <div className="absolute inset-0 -m-1 rounded-full border border-gold/50 animate-ping" style={{ animationDelay: '0.5s', animationDuration: '2s' }} />
                        {/* Center icon */}
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-primary to-gold flex items-center justify-center shadow-lg">
                          <Sparkles className="w-4 h-4 text-white animate-spin-slow" />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gradient Overlay for Text Readability */}
                  <div className={cn(
                    "absolute inset-x-0 bottom-0 p-3 bg-gradient-to-t transition-opacity duration-300",
                    selectedCategory === null ? "from-black/80 via-black/50 to-transparent" : "from-black/90 via-black/60 to-transparent"
                  )}>
                    <div className="flex items-center justify-center gap-1">
                      <span
                        className={cn(
                          "text-[10px] font-serif font-bold tracking-wider uppercase text-white drop-shadow-lg",
                          selectedCategory === null && "animate-pulse"
                        )}
                      >
                        {t.artistsListing.allCategories || "All"}
                      </span>
                      {selectedCategory === null && (
                        <span className="text-gold text-xs animate-bounce" style={{ animationDelay: '0.5s' }}>✦</span>
                      )}
                    </div>
                  </div>

                  {/* Decorative Corner Frames */}
                  <svg className="absolute inset-0 w-full h-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="corner-grad" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor="rgb(217, 123, 140)" stopOpacity="0.8" />
                        <stop offset="100%" stopColor="rgb(217, 123, 140)" stopOpacity="0" />
                      </linearGradient>
                    </defs>
                    {/* Top-left corner */}
                    <path
                      d="M 0 12 L 0 0 L 12 0"
                      stroke="url(#corner-grad)"
                      strokeWidth="2"
                      fill="none"
                      className={cn(
                        "transition-opacity duration-300",
                        selectedCategory === null ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                      )}
                    />
                    {/* Bottom-right corner */}
                    <path
                      d="M 116 20 L 128 20 L 128 8"
                      stroke="url(#corner-grad)"
                      strokeWidth="2"
                      fill="none"
                      className={cn(
                        "transition-opacity duration-300",
                        selectedCategory === null ? "opacity-100" : "opacity-40 group-hover:opacity-70"
                      )}
                    />
                  </svg>
                </div>
              </button>

              {/* Category Cards - Editorial Wide Format */}
              {SERVICE_CATEGORIES.map((category, index) => {
                const isSelected = selectedCategory === category;
                return (
                  <button
                    key={category}
                    onClick={() => handleCategoryChange(isSelected ? null : category)}
                    className="relative flex-shrink-0 group"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    {/* Card Container - Landscape Format */}
                    <div
                      className={cn(
                        "relative w-28 h-20 rounded-2xl overflow-hidden transition-all duration-500 ease-out",
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background scale-105 shadow-xl shadow-primary/20"
                          : "ring-1 ring-border/50 group-hover:ring-primary/40 group-hover:scale-[1.02]"
                      )}
                    >
                      {/* Category Image */}
                      <img
                        src={categoryImages[category]}
                        alt={getCategoryLabel(category)}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      />

                      {/* Gradient Overlay - Always visible for readability */}
                      <div className={cn(
                        "absolute inset-0 bg-gradient-to-t transition-opacity duration-300",
                        isSelected
                          ? "from-primary/90 via-primary/40 to-transparent"
                          : "from-black/70 via-black/30 to-transparent"
                      )} />

                      {/* Selected Glow Effect */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-tr from-primary/30 via-transparent to-gold/30 animate-pulse" />
                      )}

                      {/* Category Label - Elegant Typography Overlay */}
                      <div className="absolute inset-x-0 bottom-0 p-3">
                        <span className={cn(
                          "block text-[11px] font-serif font-semibold tracking-wide truncate text-center",
                          isSelected ? "text-white drop-shadow-lg" : "text-white/90 drop-shadow-md"
                        )}>
                          {getCategoryLabel(category)}
                        </span>
                      </div>

                      {/* Animated Corner Accent (Selected) */}
                      {isSelected && (
                        <div className="absolute top-2 right-2 w-1.5 h-1.5 rounded-full bg-white animate-ping" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Scroll Indicator - Shows more content */}
          <div className="flex items-center justify-end mt-2 px-1">
            <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground/70">
              <span className="tracking-wider uppercase">{t.artistsListing.swipe || "Swipe"}</span>
              <div className="flex gap-0.5">
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0s' }} />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.1s' }} />
                <span className="w-1 h-1 rounded-full bg-muted-foreground/50 animate-bounce" style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
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
                setFilters({ priceRange: [0, maxPrice], minRating: 0, minExperience: 0, locations: [], serviceTypes: [], accountType: "all" });
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
