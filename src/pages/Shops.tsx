import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { useArtistsWithPricing } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { EnhancedArtistCard } from "@/components/artists/EnhancedArtistCard";
import { cn } from "@/lib/utils";

const Shops = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { data: artists, isLoading } = useArtistsWithPricing();
  const [searchQuery, setSearchQuery] = useState("");
  const debouncedSearch = useDebounce(searchQuery, 300);

  const sellers = useMemo(() => {
    if (!artists) return [];
    let result = artists.filter((a) => (a as any).account_type === "seller");
    if (debouncedSearch) {
      const q = debouncedSearch.toLowerCase();
      result = result.filter(
        (a) =>
          a.profile?.full_name?.toLowerCase().includes(q) ||
          a.bio?.toLowerCase().includes(q)
      );
    }
    return result;
  }, [artists, debouncedSearch]);

  const sellerIds = useMemo(() => sellers.map((s) => s.id), [sellers]);
  const { data: availabilityMap } = useArtistsAvailability(sellerIds);

  return (
    <div className="min-h-screen bg-background pb-28">
      <AppHeader showLogo={true} style="modern" />

      {/* Header Section */}
      <div className="px-5 pt-5 pb-4">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-xl bg-accent flex items-center justify-center">
            <Store className="w-4.5 h-4.5 text-accent-foreground" />
          </div>
          <h1 className="text-xl font-bold text-foreground">
            {isRTL ? "المتاجر" : "Shops"}
          </h1>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
          <Input
            placeholder={isRTL ? "ابحث في المتاجر..." : "Search shops..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn("h-10 rounded-xl bg-muted/50 border-border/50", isRTL ? "pr-10" : "pl-10")}
          />
        </div>
      </div>

      {/* Results */}
      <div className="px-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-52 rounded-2xl" />
            ))}
          </div>
        ) : sellers.length > 0 ? (
          <>
            <p className="text-xs text-muted-foreground mb-3">
              {isRTL
                ? `${sellers.length} متجر`
                : `${sellers.length} shop${sellers.length !== 1 ? "s" : ""}`}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {sellers.map((seller, index) => (
                <div
                  key={seller.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 40}ms` }}
                >
                  <EnhancedArtistCard
                    artist={seller}
                    availability={availabilityMap?.get(seller.id)}
                    viewMode="grid"
                  />
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Store className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm">
              {isRTL ? "لا توجد متاجر حالياً" : "No shops found"}
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Shops;
