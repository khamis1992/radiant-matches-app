import { useState, useMemo, useEffect, useRef, lazy, Suspense } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Search,
  X,
  History,
  Sparkles,
  LayoutGrid,
  Star,
  MapPin,
  CalendarCheck,
  Heart,
  BadgeCheck,

  SlidersHorizontal,
} from "lucide-react";
import BottomNavigation from "@/components/BottomNavigation";
import { QueryErrorState } from "@/components/QueryErrorState";
import categoryMakeup from "@/assets/category-makeup.jpg";
import categoryHairstyling from "@/assets/category-hairstyling.jpg";
import categoryHenna from "@/assets/category-henna.jpg";
import categoryLashes from "@/assets/category-lashes.jpg";
import categoryNails from "@/assets/category-nails.jpg";
import categoryBridal from "@/assets/category-bridal.jpg";
import categoryPhotoshoot from "@/assets/category-photoshoot.jpg";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useArtists";
import { useArtistsWithPricing, ArtistWithPricing, getArtistPhoto } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability, ArtistAvailability } from "@/hooks/useArtistAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { useFavorites } from "@/hooks/useFavorites";
import { useProfile } from "@/hooks/useProfile";
import AppHeader from "@/components/layout/AppHeader";
import { ArtistFiltersSheet, FilterState } from "@/components/artists/ArtistFiltersSheet";
// Lazy: the map (MapLibre GL + tiles) loads only when the user opens map view
const MapView = lazy(() =>
  import("@/components/artists/MapView").then((m) => ({ default: m.MapView }))
);
import { VoiceSearchButton } from "@/components/VoiceSearchButton";
import { cn } from "@/lib/utils";
import BrandCover from "@/components/BrandCover";

type SortOption = "rating" | "reviews" | "experience" | "name" | "price";

const SEARCH_HISTORY_KEY = "artist-search-history";
const MAX_SEARCH_HISTORY = 5;

const CATEGORY_MEDIA: Record<ServiceCategory, { video: string; poster: string }> = {
  Makeup: { video: "/videos/categories/makeup.mp4", poster: categoryMakeup },
  "Hair Styling": { video: "/videos/categories/hairstyling.mp4", poster: categoryHairstyling },
  Henna: { video: "/videos/categories/henna.mp4", poster: categoryHenna },
  "Lashes & Brows": { video: "/videos/categories/lashes.mp4", poster: categoryLashes },
  Nails: { video: "/videos/categories/nails.mp4", poster: categoryNails },
  Bridal: { video: "/videos/categories/bridal.mp4", poster: categoryBridal },
  Photoshoot: { video: "/videos/categories/photoshoot.mp4", poster: categoryPhotoshoot },
};

const MakeupArtists = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [sortBy, setSortBy] = useState<SortOption>("rating");

  // Initialize search query from URL param
  const searchParam = searchParams.get("search") || "";
  const [searchQuery, setSearchQuery] = useState(searchParam);
  const [showAvailableOnly, setShowAvailableOnly] = useState(false);
  const [topRatedOnly, setTopRatedOnly] = useState(false);
  const [showSearchHistory, setShowSearchHistory] = useState(false);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const { t, isRTL } = useLanguage();

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
  const initialCategory =
    categoryParam && SERVICE_CATEGORIES.includes(categoryParam as ServiceCategory)
      ? (categoryParam as ServiceCategory)
      : null;
  const [selectedCategory, setSelectedCategory] = useState<ServiceCategory | null>(initialCategory);

  const showMap = searchParams.get("map") === "true";

  const { data: artists, isLoading, isError: isArtistsError, refetch: refetchArtists } = useArtistsWithPricing();
  const debouncedSearchQuery = useDebounce(searchQuery, 300);

  // Get artist IDs for availability check
  const artistIds = useMemo(() => artists?.map((a) => a.id) || [], [artists]);
  const { data: availabilityMap } = useArtistsAvailability(artistIds);

  const { isFavorite, toggleFavorite } = useFavorites();
  const { data: profile } = useProfile();


  // Load search history from localStorage
  useEffect(() => {
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, []);

  useSwipeBack();

  // Calculate max price for filter
  const maxPrice = useMemo(() => {
    if (!artists) return 2000;
    const prices = artists.map((a) => a.min_price || 0).filter((p) => p > 0);
    return Math.max(...prices, 2000);
  }, [artists]);

  // Update filters max price when data loads
  useEffect(() => {
    if (maxPrice > 0 && filters.priceRange[1] === 2000) {
      setFilters((prev) => ({ ...prev, priceRange: [0, maxPrice] }));
    }
  }, [maxPrice]);

  // Category translation map
  const getCategoryLabel = (category: ServiceCategory) => {
    const categoryMap: Record<ServiceCategory, string> = {
      Makeup: t.categories.makeup,
      "Hair Styling": t.categories.hairStyling,
      Henna: t.categories.henna,
      "Lashes & Brows": t.categories.lashesBrows,
      Nails: t.categories.nails,
      Bridal: t.categories.bridal,
      Photoshoot: t.categories.photoshoot,
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
    const updated = [query, ...searchHistory.filter((s) => s !== query)].slice(0, MAX_SEARCH_HISTORY);
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

    const filtered = artists.filter((artist) => {
      // Exclude sellers/shops from this page
      if ((artist as ArtistWithPricing & { account_type?: string }).account_type === "seller") return false;
      // Search filter
      if (debouncedSearchQuery.trim()) {
        const query = debouncedSearchQuery.toLowerCase();
        const matchesSearch =
          artist.profile?.full_name?.toLowerCase().includes(query) ||
          artist.profile?.location?.toLowerCase().includes(query) ||
          artist.bio?.toLowerCase().includes(query);
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

      // Top rated quick filter
      if (topRatedOnly) {
        if (!artist.rating || artist.rating < 4.5) return false;
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
        const hasMatchingService = filters.serviceTypes.some((service) =>
          artist.categories?.includes(service)
        );
        if (!hasMatchingService) return false;
      }
      // Account type filter
      if (filters.accountType && filters.accountType !== "all") {
        if ((artist as ArtistWithPricing & { account_type?: string }).account_type !== filters.accountType) return false;
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
  }, [artists, sortBy, debouncedSearchQuery, selectedCategory, showAvailableOnly, topRatedOnly, availabilityMap, filters]);

  // Featured artist: highest rated with a photo (showcase only on the unfiltered view)
  const isDefaultView =
    !debouncedSearchQuery.trim() && !selectedCategory && !showAvailableOnly && !topRatedOnly;
  const featuredArtist = useMemo(() => {
    if (!isDefaultView || !artists) return null;
    const candidates = artists.filter(
      (a) =>
        (a as ArtistWithPricing & { account_type?: string }).account_type !== "seller" &&
        getArtistPhoto(a)
    );
    if (candidates.length === 0) return null;
    return [...candidates].sort((x, y) => (Number(y.rating) || 0) - (Number(x.rating) || 0))[0];
  }, [artists, isDefaultView]);

  const artistSpecialty = (a: ArtistWithPricing) => {
    const cats = (a.categories || []).slice(0, 2);
    if (cats.length === 0) return isRTL ? "خبيرة تجميل" : "Beauty Artist";
    return `${cats.join(" & ")} ${isRTL ? "" : "Artist"}`;
  };

  const badgeFor = (artistId: string, rating: number | null, reviews: number | null) => {
    const av = availabilityMap?.get(artistId);
    if (av?.isAvailableToday) {
      return { label: isRTL ? "متاحة اليوم" : "Available Today", tone: "success" as const };
    }
    if ((rating ?? 0) >= 4.7 && (reviews ?? 0) >= 50) {
      return { label: isRTL ? "الأعلى تقييمًا" : "Top Rated", tone: "rose" as const };
    }
    return null;
  };

  const HeartButton = ({ artistId }: { artistId: string }) => {
    const fav = isFavorite("artist", artistId);
    return (
      <button
        onClick={(e) => {
          e.stopPropagation();
          toggleFavorite("artist", artistId);
        }}
        aria-label={fav ? "Remove from favorites" : "Add to favorites"}
        aria-pressed={fav}
        className="h-8 w-8 rounded-full bg-white grid place-items-center transition-transform duration-200 active:scale-90 [box-shadow:0_6px_14px_-4px_rgba(16,20,23,0.18)]"
      >
        <Heart
          className={cn("w-4 h-4", fav ? "fill-glam-rose text-glam-rose" : "text-glam-rose")}
          strokeWidth={1.75}
        />
      </button>
    );
  };

  return (
    <div className="min-h-[100dvh] bg-glam-porcelain pb-32">
      {showMap && (
        <Suspense fallback={null}>
          <MapView
            artists={filteredAndSortedArtists}
            onClose={() => {
              const newParams = new URLSearchParams(searchParams);
              newParams.delete("map");
              setSearchParams(newParams);
            }}
          />
        </Suspense>
      )}

      <AppHeader showLogo={true} title={t.artistsListing.title} style="modern" />

      <div className="px-5 pt-3">
        {/* ─── Search bar + filters button ─── */}
        <div className="relative mb-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search
                className="absolute start-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-glam-muted"
                strokeWidth={1.75}
              />
              <input
                type="text"
                placeholder={
                  t.artistsListing.searchPlaceholder || "Search artists, services or salons..."
                }
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setShowSearchHistory(true)}
                onBlur={() => setTimeout(() => setShowSearchHistory(false), 200)}
                onKeyDown={(e) => e.key === "Enter" && handleSearchSubmit()}
                className="w-full h-[52px] rounded-full bg-white border border-glam-border/70 ps-11 pe-12 text-sm text-glam-ink placeholder:text-glam-muted outline-none transition-shadow focus:ring-2 focus:ring-glam-blush-deep/40 [box-shadow:0_10px_24px_-14px_rgba(16,20,23,0.12)]"
              />
              <div className="absolute end-3.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="p-1 hover:bg-glam-surface rounded-full"
                    aria-label="Clear search"
                  >
                    <X className="w-4 h-4 text-glam-muted" />
                  </button>
                )}
                <VoiceSearchButton
                  onResult={(transcript) => {
                    setSearchQuery(transcript);
                    saveToSearchHistory(transcript);
                  }}
                  size="sm"
                  className="h-7 w-7 border-0 shadow-none text-glam-muted"
                />
              </div>
            </div>

            <ArtistFiltersSheet
              filters={filters}
              onFiltersChange={setFilters}
              maxPrice={maxPrice}
              trigger={
                <button
                  aria-label={t.artistsListing?.filters || "Filters"}
                  className="h-11 w-11 shrink-0 self-center rounded-full bg-glam-ink text-white grid place-items-center transition-all duration-200 hover:bg-glam-ink-pressed active:scale-95 [box-shadow:0_12px_24px_-10px_rgba(16,20,23,0.4)]"
                >
                  <SlidersHorizontal className="w-[18px] h-[18px]" strokeWidth={2} />
                </button>
              }
            />
          </div>

          {/* Auto-suggestions & Search History Dropdown */}
          {showSearchHistory && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-glam-border rounded-2xl shadow-lg z-50 overflow-hidden animate-fade-in max-h-72 overflow-y-auto">
              {searchQuery.trim() &&
                (() => {
                  const query = searchQuery.toLowerCase();
                  const suggestions: { type: "artist" | "location" | "category"; value: string; label: string }[] = [];

                  artists?.forEach((artist) => {
                    if (artist.profile?.full_name?.toLowerCase().includes(query)) {
                      suggestions.push({
                        type: "artist",
                        value: artist.profile.full_name,
                        label: artist.profile.full_name,
                      });
                    }
                  });

                  const locations = [
                    ...new Set(artists?.map((a) => a.profile?.location).filter(Boolean) as string[]),
                  ];
                  locations.forEach((loc) => {
                    if (loc.toLowerCase().includes(query) && !suggestions.find((s) => s.value === loc)) {
                      suggestions.push({ type: "location", value: loc, label: loc });
                    }
                  });

                  SERVICE_CATEGORIES.forEach((cat) => {
                    const catLabel = getCategoryLabel(cat);
                    if (cat.toLowerCase().includes(query) || catLabel.toLowerCase().includes(query)) {
                      suggestions.push({ type: "category", value: cat, label: catLabel });
                    }
                  });

                  const uniqueSuggestions = suggestions.slice(0, 8);
                  if (uniqueSuggestions.length === 0) return null;

                  return (
                    <>
                      <div className="px-4 py-2.5 border-b border-glam-border/60">
                        <span className="text-xs text-glam-muted flex items-center gap-1.5">
                          <Sparkles className="w-3 h-3" />
                          {t.artistsListing.suggestions || "Suggestions"}
                        </span>
                      </div>
                      {uniqueSuggestions.map((suggestion, idx) => (
                        <button
                          key={`${suggestion.type}-${idx}`}
                          onMouseDown={() => {
                            if (suggestion.type === "category") {
                              handleCategoryChange(suggestion.value as ServiceCategory);
                              setSearchQuery("");
                            } else {
                              setSearchQuery(suggestion.value);
                              saveToSearchHistory(suggestion.value);
                            }
                            setShowSearchHistory(false);
                          }}
                          className="w-full px-4 py-2.5 text-start text-sm hover:bg-glam-surface transition-colors flex items-center gap-2"
                        >
                          {suggestion.type === "artist" && (
                            <Search className="w-3.5 h-3.5 text-glam-muted" />
                          )}
                          {suggestion.type === "location" && (
                            <MapPin className="w-3.5 h-3.5 text-glam-muted" />
                          )}
                          {suggestion.type === "category" && (
                            <Sparkles className="w-3.5 h-3.5 text-glam-rose" />
                          )}
                          <span className="flex-1">{suggestion.label}</span>
                          <span className="text-xs text-glam-muted capitalize">
                            {suggestion.type === "artist"
                              ? t.artistsListing.artistLabel || "Artist"
                              : suggestion.type === "location"
                                ? t.artistsListing.locationLabel || "Location"
                                : t.artistsListing.categoryLabel || "Category"}
                          </span>
                        </button>
                      ))}
                    </>
                  );
                })()}

              {!searchQuery && searchHistory.length > 0 && (
                <>
                  <div className="flex items-center justify-between px-4 py-2.5 border-b border-glam-border/60">
                    <span className="text-xs text-glam-muted flex items-center gap-1.5">
                      <History className="w-3 h-3" />
                      {t.artistsListing.recentSearches}
                    </span>
                    <button
                      onClick={clearSearchHistory}
                      className="text-xs text-glam-rose hover:underline"
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
                      className="w-full px-4 py-2.5 text-start text-sm hover:bg-glam-surface transition-colors flex items-center gap-2"
                    >
                      <Search className="w-3.5 h-3.5 text-glam-muted" />
                      {query}
                    </button>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── Category chips ─── */}
        <div className="overflow-x-auto scrollbar-hide -mx-5 px-5 mb-4">
          <div className="flex gap-3 min-w-max pb-1 pt-1">
            <CategoryCard
              icon={LayoutGrid}
              label={t.artistsListing.allCategories || "All"}
              selected={selectedCategory === null}
              onClick={() => handleCategoryChange(null)}
            />
            {SERVICE_CATEGORIES.map((category) => (
              <CategoryCard
                key={category}
                image={CATEGORY_MEDIA[category].poster}
                video={CATEGORY_MEDIA[category].video}
                label={getCategoryLabel(category)}
                selected={selectedCategory === category}
                onClick={() =>
                  handleCategoryChange(selectedCategory === category ? null : category)
                }
              />
            ))}
          </div>
        </div>

        {/* ─── Quick filter pills ─── */}
        <div className="flex gap-2 mb-5">
          <QuickPill
            icon={Star}
            label={isRTL ? "الأعلى تقييمًا" : "Top Rated"}
            selected={topRatedOnly}
            onClick={() => setTopRatedOnly((v) => !v)}
          />
          <QuickPill
            icon={MapPin}
            label={isRTL ? "القريبون" : "Nearby"}
            selected={showMap}
            onClick={() => {
              const newParams = new URLSearchParams(searchParams);
              if (showMap) newParams.delete("map");
              else newParams.set("map", "true");
              setSearchParams(newParams);
            }}
          />
          <QuickPill
            icon={CalendarCheck}
            label={t.availability?.availableToday || "Available Today"}
            selected={showAvailableOnly}
            onClick={() => setShowAvailableOnly((v) => !v)}
          />
        </div>

        {/* ─── Featured artist ─── */}
        {featuredArtist && (
          <section className="mb-6">
            <FeaturedCard
              artist={featuredArtist}
              photo={getArtistPhoto(featuredArtist)}
              specialty={artistSpecialty(featuredArtist)}
              isRTL={isRTL}
              favorite={isFavorite("artist", featuredArtist.id)}
              onToggleFavorite={() => toggleFavorite("artist", featuredArtist.id)}
              onOpen={() => navigate(`/artist/${featuredArtist.id}`)}
              labels={{
                featured: isRTL ? "فنانة مميزة" : "Featured Artist",
                reviews: isRTL ? "مراجعة" : "reviews",
                bookNow: isRTL ? "احجزي الآن" : "Book Now",
              }}
            />
          </section>
        )}

        {/* ─── Results meta + sort ─── */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-xs text-glam-muted font-medium">
            {filteredAndSortedArtists.length}{" "}
            {filteredAndSortedArtists.length === 1
              ? t.artistsListing.artistsFound
              : t.artistsListing.artistsFoundPlural}
            {selectedCategory && ` ${t.artistsListing.forCategory} ${getCategoryLabel(selectedCategory)}`}
          </span>
          <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortOption)}>
            <SelectTrigger className="w-auto h-8 text-xs gap-1.5 border-0 bg-transparent shadow-none text-glam-secondary font-medium focus:ring-0 px-2">
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

        {/* ─── Artists grid ─── */}
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3.5">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-[270px] w-full rounded-[24px]" />
            ))}
          </div>
        ) : isArtistsError ? (
          <QueryErrorState onRetry={() => refetchArtists()} />
        ) : filteredAndSortedArtists.length > 0 ? (
          <div className="grid grid-cols-2 gap-3.5">
            {filteredAndSortedArtists.map((artist, index) => {
              const badge = badgeFor(artist.id, artist.rating, artist.total_reviews);
              return (
                <div
                  key={artist.id}
                  style={{ animationDelay: `${index * 50}ms` }}
                  className="animate-fade-in"
                >
                  <ArtistGridCard
                    artist={artist}
                    photo={getArtistPhoto(artist)}
                    specialty={artistSpecialty(artist)}
                    badge={badge}
                    isRTL={isRTL}
                    favoriteButton={<HeartButton artistId={artist.id} />}
                    onOpen={() => navigate(`/artist/${artist.id}`)}
                    viewProfileLabel={isRTL ? "عرض الملف" : "View Profile"}
                  />
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-glam-surface flex items-center justify-center">
              <Sparkles className="w-7 h-7 text-glam-muted" strokeWidth={1.75} />
            </div>
            <p className="text-base font-semibold text-glam-ink mb-1.5">
              {t.artistsListing.noArtistsFound}
            </p>
            {searchQuery && (
              <p className="text-sm text-glam-muted">{t.artistsListing.adjustSearch}</p>
            )}
            <button
              className="mt-5 rounded-full border border-glam-ink text-glam-ink px-6 h-10 text-sm font-semibold transition-colors hover:bg-glam-surface"
              onClick={() => {
                setSearchQuery("");
                setSelectedCategory(null);
                setShowAvailableOnly(false);
                setTopRatedOnly(false);
                setFilters({
                  priceRange: [0, maxPrice],
                  minRating: 0,
                  minExperience: 0,
                  locations: [],
                  serviceTypes: [],
                  accountType: "all",
                });
              }}
            >
              {t.artistsListing.resetFilters}
            </button>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

/* ─────────────────────────── pieces ─────────────────────────── */

const useReducedMotion = () => {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return reduced;
};

const CategoryCard = ({
  icon: Icon,
  image,
  video,
  label,
  selected,
  onClick,
}: {
  icon?: typeof LayoutGrid;
  image?: string;
  video?: string;
  label: string;
  selected: boolean;
  onClick: () => void;
}) => {
  const ref = useRef<HTMLButtonElement>(null);
  const [inView, setInView] = useState(false);
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const io = new IntersectionObserver(
      ([entry]) => setInView(entry.isIntersecting),
      { threshold: 0.25 }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  const mediaClass =
    "h-full w-full object-cover transition-transform duration-500 group-hover:scale-105";

  return (
    <button
      ref={ref}
      onClick={onClick}
      aria-pressed={selected}
      className="group flex w-[84px] shrink-0 flex-col items-center gap-2 transition-transform duration-200 active:scale-95 focus-visible:outline-none"
    >
      <span
        className={cn(
          "relative flex h-[84px] w-[84px] items-center justify-center overflow-hidden rounded-2xl transition-all duration-300",
          selected
            ? "ring-2 ring-glam-rose ring-offset-2 ring-offset-white shadow-[0_12px_24px_-12px_var(--glam-rose-action)]"
            : "ring-1 ring-black/[0.06] group-hover:ring-black/[0.12]"
        )}
      >
        {image && video ? (
          inView && !reducedMotion ? (
            <video
              src={video}
              poster={image}
              autoPlay
              muted
              loop
              playsInline
              preload="metadata"
              className={mediaClass}
            />
          ) : (
            <img src={image} alt="" loading="lazy" className={mediaClass} />
          )
        ) : Icon ? (
          <span className="flex h-full w-full items-center justify-center bg-glam-surface">
            <Icon
              className={cn(
                "w-7 h-7 transition-colors duration-300",
                selected ? "text-glam-rose" : "text-glam-ink"
              )}
              strokeWidth={1.75}
            />
          </span>
        ) : null}
      </span>
      <span
        className={cn(
          "w-full text-center text-[11px] leading-[1.25] line-clamp-2 transition-colors duration-300",
          selected ? "text-glam-rose font-semibold" : "text-glam-secondary font-medium"
        )}
      >
        {label}
      </span>
    </button>
  );
};

const QuickPill = ({
  icon: Icon,
  label,
  selected,
  onClick,
}: {
  icon: typeof Star;
  label: string;
  selected: boolean;
  onClick: () => void;
}) => (
  <button
    onClick={onClick}
    aria-pressed={selected}
    className={cn(
      "flex-1 flex items-center justify-center gap-1.5 h-10 rounded-full text-xs whitespace-nowrap transition-all duration-200 active:scale-95",
      selected
        ? "bg-glam-blush-soft text-glam-ink font-semibold"
        : "bg-glam-surface text-glam-secondary font-medium"
    )}
  >
    <Icon
      className={cn("w-4 h-4", selected ? "text-glam-rose fill-glam-rose" : "text-glam-muted")}
      strokeWidth={1.75}
    />
    {label}
  </button>
);

const FeaturedCard = ({
  artist,
  photo,
  specialty,
  isRTL,
  favorite,
  onToggleFavorite,
  onOpen,
  labels,
}: {
  artist: ArtistWithPricing;
  photo: string | null;
  specialty: string;
  isRTL: boolean;
  favorite: boolean;
  onToggleFavorite: () => void;
  onOpen: () => void;
  labels: { featured: string; reviews: string; bookNow: string };
}) => (
  <div className="relative flex gap-3.5 rounded-[28px] bg-white p-3 border border-glam-border/50 [box-shadow:0_20px_44px_-20px_rgba(169,71,91,0.18)]">
    <div className="relative w-[132px] shrink-0 self-stretch overflow-hidden rounded-[20px] bg-glam-surface">
      {photo && (
        <img
          src={photo}
          alt={artist.profile?.full_name || "Artist"}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      )}
    </div>

    <div className="flex-1 min-w-0 flex flex-col py-1">
      <span className="flex items-center gap-1 text-[11px] font-semibold text-glam-rose">
        <Star className="w-3 h-3 fill-glam-rose" />
        {labels.featured}
      </span>

      <h3 className="mt-1 text-[19px] leading-snug font-bold text-glam-ink truncate pe-8 flex items-center gap-1.5">
        <span className="truncate">{artist.profile?.full_name || "Artist"}</span>
        <BadgeCheck className="w-[18px] h-[18px] shrink-0 fill-glam-rose text-white" />
      </h3>

      <p className="text-xs text-glam-secondary truncate">{specialty}</p>

      <div className="mt-1.5 flex items-center gap-1.5">
        <Star className="w-3.5 h-3.5 fill-glam-rose text-glam-rose" />
        <span className="text-[13px] font-bold text-glam-ink">
          {Number(artist.rating ?? 0).toFixed(1)}
        </span>
        <span className="text-[11px] text-glam-muted">
          ({artist.total_reviews || 0} {labels.reviews})
        </span>
      </div>

      {artist.profile?.location && (
        <div className="mt-1 flex items-center gap-1.5 text-glam-secondary">
          <MapPin className="w-3.5 h-3.5 text-glam-rose shrink-0" strokeWidth={1.75} />
          <span className="text-xs truncate">{artist.profile.location}</span>
        </div>
      )}

      {(artist.categories || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(artist.categories || []).slice(0, 3).map((c) => (
            <span
              key={c}
              className="rounded-full bg-glam-surface text-glam-secondary text-[10px] font-medium px-2.5 py-1"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <div className="mt-auto pt-2.5 flex items-center gap-2">
        <button
          onClick={onOpen}
          className="flex-1 h-11 rounded-full bg-glam-ink text-white text-sm font-semibold transition-all duration-200 hover:bg-glam-ink-pressed active:scale-[0.98] [box-shadow:0_12px_24px_-10px_rgba(16,20,23,0.4)]"
        >
          {labels.bookNow}
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite();
          }}
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
          aria-pressed={favorite}
          className="h-11 w-11 shrink-0 rounded-full border border-glam-border grid place-items-center transition-transform duration-200 active:scale-90"
        >
          <Heart
            className={cn("w-5 h-5", favorite ? "fill-glam-rose text-glam-rose" : "text-glam-rose")}
            strokeWidth={1.75}
          />
        </button>
      </div>
    </div>
  </div>
);

const ArtistGridCard = ({
  artist,
  photo,
  specialty,
  badge,
  isRTL,
  favoriteButton,
  onOpen,
  viewProfileLabel,
}: {
  artist: ArtistWithPricing;
  photo: string | null;
  specialty: string;
  badge: { label: string; tone: "success" | "rose" } | null;
  isRTL: boolean;
  favoriteButton: React.ReactNode;
  onOpen: () => void;
  viewProfileLabel: string;
}) => {

  return (
  <div
    role="button"
    tabIndex={0}
    onClick={onOpen}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onOpen();
      }
    }}
    className="rounded-[24px] bg-white border border-glam-border/50 overflow-hidden cursor-pointer transition-transform duration-200 active:scale-[0.98] [box-shadow:0_14px_30px_-18px_rgba(16,20,23,0.15)]"
  >
    <div className="relative h-44 bg-glam-surface">
      {photo ? (
        <img
          src={photo}
          alt={artist.profile?.full_name || "Artist"}
          loading="lazy"
          draggable={false}
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <BrandCover />
      )}
      {badge && (
        <span
          className={cn(
            "absolute top-2.5 start-2.5 rounded-full bg-white/95 backdrop-blur-sm px-2.5 py-1 text-[10px] font-semibold [box-shadow:0_4px_10px_-4px_rgba(16,20,23,0.2)]",
            badge.tone === "success" ? "text-glam-success" : "text-glam-rose"
          )}
        >
          {badge.label}
        </span>
      )}
      <div className="absolute top-2.5 end-2.5">{favoriteButton}</div>
    </div>

    <div className="p-3">
      <div className="flex items-center gap-1">
        <h3 className="text-[15px] font-bold text-glam-ink truncate">
          {artist.profile?.full_name || "Artist"}
        </h3>
        <BadgeCheck className="w-4 h-4 shrink-0 fill-glam-rose text-white" />
      </div>
      <p className="mt-0.5 text-[11px] text-glam-secondary truncate">{specialty}</p>

      <div className="mt-1.5 flex items-center gap-1 text-[11px]">
        <Star className="w-3 h-3 fill-glam-rose text-glam-rose" />
        <span className="font-bold text-glam-ink">{Number(artist.rating ?? 0).toFixed(1)}</span>
        <span className="text-glam-muted">({artist.total_reviews || 0})</span>
        {artist.profile?.location && (
          <>
            <MapPin className="w-3 h-3 text-glam-rose ms-1.5" strokeWidth={1.75} />
            <span className="text-glam-secondary truncate">{artist.profile.location}</span>
          </>
        )}
      </div>

      {(artist.categories || []).length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {(artist.categories || []).slice(0, 3).map((c) => (
            <span
              key={c}
              className="rounded-full bg-glam-surface text-glam-secondary text-[10px] font-medium px-2 py-0.5"
            >
              {c}
            </span>
          ))}
        </div>
      )}

      <button
        onClick={(e) => {
          e.stopPropagation();
          onOpen();
        }}
        className="mt-2.5 w-full h-9 rounded-full border border-glam-ink text-glam-ink text-xs font-semibold transition-colors hover:bg-glam-surface active:scale-[0.98]"
      >
        {viewProfileLabel}
      </button>
    </div>
  </div>
  );
};

export default MakeupArtists;
