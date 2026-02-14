import React, { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, Store, ShoppingBag, Package, Star, ArrowLeft } from "lucide-react";
import { Input } from "@/components/ui/input";
import BottomNavigation from "@/components/BottomNavigation";
import { useArtistsWithPricing } from "@/hooks/useArtistsWithPricing";
import { useArtistsAvailability } from "@/hooks/useArtistAvailability";
import { Skeleton } from "@/components/ui/skeleton";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDebounce } from "@/hooks/useDebounce";
import { EnhancedArtistCard } from "@/components/artists/EnhancedArtistCard";
import { Badge } from "@/components/ui/badge";
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
    <div className="min-h-screen bg-background pb-32">
      {/* ─── Hero Banner ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent via-secondary to-accent">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className={cn(
            "absolute top-12 z-10 w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform",
            isRTL ? "right-4" : "left-4"
          )}
        >
          <ArrowLeft className={cn("w-4.5 h-4.5 text-foreground", isRTL && "rotate-180")} />
        </button>

        {/* Decorative elements */}
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-primary/5" />
        <div className="absolute -bottom-6 -left-6 w-28 h-28 rounded-full bg-primary/8" />
        <div className="absolute top-16 right-20 w-5 h-5 rounded-full bg-primary/15 animate-pulse" />

        <div className="relative px-5 pt-20 pb-8">
          {/* Icon + Title */}
          <div className="flex items-center gap-3 mb-2">
            <div className="w-12 h-12 rounded-2xl bg-card shadow-md flex items-center justify-center">
              <Store className="w-6 h-6 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground" style={{ fontFamily: "var(--font-serif-display)" }}>
                {isRTL ? "المتاجر" : "Shops"}
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                {isRTL ? "تسوقي منتجات التجميل المفضلة" : "Shop your favorite beauty products"}
              </p>
            </div>
          </div>

          {/* Stats pills */}
          <div className="flex gap-2 mt-4">
            <Badge variant="secondary" className="gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-card/80 backdrop-blur-sm border-0 shadow-sm">
              <ShoppingBag className="w-3 h-3 text-primary" />
              {isRTL ? `${sellers.length} متجر` : `${sellers.length} Shops`}
            </Badge>
            <Badge variant="secondary" className="gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-card/80 backdrop-blur-sm border-0 shadow-sm">
              <Package className="w-3 h-3 text-primary" />
              {isRTL ? "منتجات أصلية" : "Authentic Products"}
            </Badge>
            <Badge variant="secondary" className="gap-1 px-3 py-1.5 rounded-full text-[11px] font-medium bg-card/80 backdrop-blur-sm border-0 shadow-sm">
              <Star className="w-3 h-3 text-primary" />
              {isRTL ? "موثوقة" : "Trusted"}
            </Badge>
          </div>
        </div>
      </div>

      {/* ─── Search Bar ─── */}
      <div className="px-5 -mt-3 relative z-10 mb-5">
        <div className="relative">
          <Search className={cn("absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground", isRTL ? "right-4" : "left-4")} />
          <Input
            placeholder={isRTL ? "ابحث في المتاجر..." : "Search shops..."}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={cn(
              "h-12 rounded-2xl bg-card border-border/40 shadow-sm text-sm",
              isRTL ? "pr-11" : "pl-11"
            )}
          />
        </div>
      </div>

      {/* ─── Results ─── */}
      <div className="px-5">
        {isLoading ? (
          <div className="grid grid-cols-2 gap-3">
            {[1, 2, 3, 4].map((i) => (
              <Skeleton key={i} className="h-56 rounded-2xl" />
            ))}
          </div>
        ) : sellers.length > 0 ? (
          <>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-muted-foreground font-medium">
                {isRTL
                  ? `عرض ${sellers.length} متجر`
                  : `Showing ${sellers.length} shop${sellers.length !== 1 ? "s" : ""}`}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {sellers.map((seller, index) => (
                <div
                  key={seller.id}
                  className="animate-fade-in"
                  style={{ animationDelay: `${index * 60}ms` }}
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
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-3xl bg-muted/60 flex items-center justify-center mx-auto mb-4">
              <Store className="w-9 h-9 text-muted-foreground/40" />
            </div>
            <h3 className="text-base font-semibold text-foreground mb-1">
              {isRTL ? "لا توجد متاجر" : "No shops yet"}
            </h3>
            <p className="text-sm text-muted-foreground max-w-[220px] mx-auto">
              {isRTL
                ? "سيتم إضافة متاجر جديدة قريباً"
                : "New shops will be added soon"}
            </p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Shops;
