import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Star, RotateCcw } from "lucide-react";
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

export interface FilterState {
  priceRange: [number, number];
  minRating: number;
  minExperience: number;
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
    };
    setLocalFilters(defaultFilters);
    onFiltersChange(defaultFilters);
  };

  const activeFiltersCount = [
    filters.priceRange[0] > 0 || filters.priceRange[1] < maxPrice,
    filters.minRating > 0,
    filters.minExperience > 0,
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
      <SheetContent side={isRTL ? "right" : "left"} className="w-full sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{t.artistsListing?.advancedFilters || "Advanced Filters"}</SheetTitle>
          <SheetDescription>
            {t.artistsListing?.filterDescription || "Filter artists by price, rating, and experience"}
          </SheetDescription>
        </SheetHeader>

        <div className="py-6 space-y-8">
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
        </div>

        <SheetFooter className="flex-row gap-2">
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
