import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Star, RotateCcw, Save, Trash2, Bookmark, MapPin, Check } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { SlidersHorizontal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useSavedSearches, SavedSearch } from "@/hooks/useSavedSearches";
import { useArtistLocations } from "@/hooks/useArtistLocations";
import { SERVICE_CATEGORIES, ServiceCategory } from "@/hooks/useArtists";
import { toast } from "sonner";

export interface FilterState {
  priceRange: [number, number];
  minRating: number;
  minExperience: number;
  locations: string[];
  serviceTypes: string[];
  accountType: "all" | "artist" | "seller";
}

interface ArtistFiltersSheetProps {
  filters: FilterState;
  onFiltersChange: (filters: FilterState) => void;
  maxPrice: number;
}

export const ArtistFiltersSheet = ({
  filters,
  onFiltersChange,
  maxPrice,
}: ArtistFiltersSheetProps) => {
  const { t, isRTL } = useLanguage();
  const [open, setOpen] = useState(false);
  const [localFilters, setLocalFilters] = useState<FilterState>(filters);
  const [saveSearchName, setSaveSearchName] = useState("");
  const [showSaveInput, setShowSaveInput] = useState(false);

  const { savedSearches, saveSearch, deleteSearch } = useSavedSearches();
  const { data: availableLocations = [] } = useArtistLocations();

  useEffect(() => {
    setLocalFilters(filters);
  }, [filters]);

  const handleApply = () => {
    onFiltersChange(localFilters);
    setOpen(false);
  };

  const handleReset = () => {
    const defaultFilters: FilterState = {
      priceRange: [0, maxPrice],
      minRating: 0,
      minExperience: 0,
      locations: [],
      serviceTypes: [],
      accountType: "all",
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const handleSaveSearch = () => {
    if (!saveSearchName.trim()) {
      toast.error(t.advancedFilters?.enterSearchName || "Please enter a name");
      return;
    }
    saveSearch(saveSearchName, localFilters);
    setSaveSearchName("");
    setShowSaveInput(false);
    toast.success(t.advancedFilters?.searchSaved || "Search saved!");
  };

  const handleLoadSearch = (search: SavedSearch) => {
    setLocalFilters({
      ...search.filters,
      priceRange: search.filters.priceRange || [0, maxPrice],
      accountType: search.filters.accountType || "all",
    });
    toast.success(t.advancedFilters?.searchLoaded || "Filters loaded");
  };

  const toggleLocation = (location: string) => {
    setLocalFilters((prev) => {
      const locations = prev.locations.includes(location)
        ? prev.locations.filter((l) => l !== location)
        : [...prev.locations, location];
      return { ...prev, locations };
    });
  };

  const toggleServiceType = (service: ServiceCategory) => {
    setLocalFilters((prev) => {
      const serviceTypes = prev.serviceTypes.includes(service)
        ? prev.serviceTypes.filter((s) => s !== service)
        : [...prev.serviceTypes, service];
      return { ...prev, serviceTypes };
    });
  };

  // Count active filters
  const activeFiltersCount = [
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.minRating > 0,
    filters.minExperience > 0,
    (filters.locations?.length || 0) > 0,
    (filters.serviceTypes?.length || 0) > 0,
    filters.accountType !== "all",
  ].filter(Boolean).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1.5 relative">
          <SlidersHorizontal className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">{t.artistsListing?.filters || "Filters"}</span>
          {activeFiltersCount > 0 && (
            <Badge 
              className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0 flex items-center justify-center text-[10px] bg-primary"
            >
              {activeFiltersCount}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side={isRTL ? "right" : "left"} className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle>{t.artistsListing?.advancedFilters || "Advanced Filters"}</SheetTitle>
          <SheetDescription>
            {t.advancedFilters?.description || "Filter artists by price, location, services, and more"}
          </SheetDescription>
        </SheetHeader>

        <ScrollArea className="flex-1 py-4">
          <div className="space-y-6 pr-4">
            {/* Saved Searches */}
            {savedSearches.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Bookmark className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm">{t.advancedFilters?.savedSearches || "Saved Searches"}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {savedSearches.map((search) => (
                    <div
                      key={search.id}
                      className="flex items-center gap-1 bg-muted rounded-full pr-1"
                    >
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleLoadSearch(search)}
                        className="h-7 px-3 text-xs rounded-full"
                      >
                        {search.name}
                      </Button>
                      <button
                        onClick={() => deleteSearch(search.id)}
                        className="p-1 hover:bg-destructive/10 rounded-full transition-colors"
                      >
                        <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                      </button>
                    </div>
                  ))}
                </div>
                <Separator />
              </div>
            )}

            {/* Price Range */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t.artistsListing?.priceRange || "Price Range"}</h4>
                <span className="text-sm text-muted-foreground">
                  {localFilters.priceRange[0]} - {localFilters.priceRange[1]} QAR
                </span>
              </div>
              <Slider
                value={localFilters.priceRange}
                onValueChange={(value) => 
                  setLocalFilters(prev => ({ ...prev, priceRange: value as [number, number] }))
                }
                max={maxPrice}
                min={0}
                step={10}
                className="w-full"
              />
            </div>

            {/* Location Filter */}
            {availableLocations.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-primary" />
                  <h4 className="font-medium text-sm">{t.advancedFilters?.location || "Location"}</h4>
                </div>
                <div className="flex flex-wrap gap-2">
                  {availableLocations.map((location) => (
                    <Button
                      key={location}
                      variant={localFilters.locations?.includes(location) ? "default" : "outline"}
                      size="sm"
                      onClick={() => toggleLocation(location)}
                      className="h-7 text-xs gap-1"
                    >
                      {localFilters.locations?.includes(location) && (
                        <Check className="w-3 h-3" />
                      )}
                      {location}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {/* Service Types Filter */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t.advancedFilters?.serviceTypes || "Service Types"}</h4>
              <div className="flex flex-wrap gap-2">
                {SERVICE_CATEGORIES.map((service) => (
                  <Button
                    key={service}
                    variant={localFilters.serviceTypes?.includes(service) ? "default" : "outline"}
                    size="sm"
                    onClick={() => toggleServiceType(service)}
                    className="h-7 text-xs gap-1"
                  >
                    {localFilters.serviceTypes?.includes(service) && (
                      <Check className="w-3 h-3" />
                    )}
                    {t.categories?.[service.toLowerCase().replace(/\s+/g, "") as keyof typeof t.categories] || service}
                  </Button>
                ))}
              </div>
            </div>

            {/* Account Type Filter */}
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{isRTL ? "نوع الحساب" : "Account Type"}</h4>
              <div className="flex gap-2">
                {([
                  { key: "all" as const, label: isRTL ? "الكل" : "All" },
                  { key: "artist" as const, label: isRTL ? "خبيرات تجميل" : "Beauty Experts" },
                  { key: "seller" as const, label: isRTL ? "بائعات" : "Sellers" },
                ]).map((option) => (
                  <Button
                    key={option.key}
                    variant={localFilters.accountType === option.key ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFilters(prev => ({ ...prev, accountType: option.key }))}
                    className="flex-1 text-xs gap-1"
                  >
                    {localFilters.accountType === option.key && (
                      <Check className="w-3 h-3" />
                    )}
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Min Rating */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t.artistsListing?.minimumRating || "Minimum Rating"}</h4>
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-primary text-primary" />
                  <span className="text-sm">{localFilters.minRating > 0 ? localFilters.minRating : "Any"}</span>
                </div>
              </div>
              <div className="flex gap-2">
                {[0, 3, 3.5, 4, 4.5].map((rating) => (
                  <Button
                    key={rating}
                    variant={localFilters.minRating === rating ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFilters(prev => ({ ...prev, minRating: rating }))}
                    className="flex-1"
                  >
                    {rating === 0 ? (t.artist?.all || "All") : `${rating}+`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Min Experience */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium text-sm">{t.artistsListing?.minimumExperience || "Minimum Experience"}</h4>
                <span className="text-sm text-muted-foreground">
                  {localFilters.minExperience > 0 
                    ? `${localFilters.minExperience}+ ${t.artistsListing?.yearsExp || "yrs"}`
                    : t.artist?.all || "Any"
                  }
                </span>
              </div>
              <div className="flex gap-2">
                {[0, 1, 2, 5, 10].map((years) => (
                  <Button
                    key={years}
                    variant={localFilters.minExperience === years ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLocalFilters(prev => ({ ...prev, minExperience: years }))}
                    className="flex-1"
                  >
                    {years === 0 ? (t.artist?.all || "All") : `${years}+`}
                  </Button>
                ))}
              </div>
            </div>

            {/* Save Current Search */}
            <Separator />
            <div className="space-y-3">
              <h4 className="font-medium text-sm">{t.advancedFilters?.saveCurrentSearch || "Save Current Search"}</h4>
              {showSaveInput ? (
                <div className="flex gap-2">
                  <Input
                    value={saveSearchName}
                    onChange={(e) => setSaveSearchName(e.target.value)}
                    placeholder={t.advancedFilters?.searchNamePlaceholder || "Enter search name..."}
                    className="h-8 text-sm"
                    onKeyDown={(e) => e.key === "Enter" && handleSaveSearch()}
                  />
                  <Button size="sm" onClick={handleSaveSearch} className="h-8">
                    <Save className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSaveInput(true)}
                  className="w-full gap-2"
                >
                  <Save className="w-4 h-4" />
                  {t.advancedFilters?.saveSearch || "Save This Search"}
                </Button>
              )}
            </div>
          </div>
        </ScrollArea>

        <SheetFooter className="flex-row gap-2 pt-4 border-t">
          <Button variant="outline" onClick={handleReset} className="flex-1 gap-2">
            <RotateCcw className="w-4 h-4" />
            {t.artistsListing?.resetFilters || "Reset"}
          </Button>
          <Button onClick={handleApply} className="flex-1">
            {t.artistsListing?.applyFilters || "Apply Filters"}
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
};
