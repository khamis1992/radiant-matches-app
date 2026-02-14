import { useState, useMemo, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Star, MapPin, Heart, Share2, MessageCircle, Store, ShoppingBag, Package, ArrowLeft, Truck, Shield, Clock } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import BottomNavigation from "@/components/BottomNavigation";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useArtist } from "@/hooks/useArtists";
import { useProducts } from "@/hooks/useProducts";
import { useArtistReviews } from "@/hooks/useReviews";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useFavorites } from "@/hooks/useFavorites";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import HelpfulReviewButton from "@/components/HelpfulReviewButton";
import { cn } from "@/lib/utils";
import artist1 from "@/assets/artist-1.jpg";

type SellerTab = "products" | "reviews";

const SellerProfile = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t, language, isRTL } = useLanguage();
  const { favorites, toggleFavorite } = useFavorites();
  const { getOrCreateConversation } = useConversations();
  const { addToCart } = useUnifiedCart();

  const { data: artist, isLoading: artistLoading } = useArtist(id);
  const { data: products = [], isLoading: productsLoading } = useProducts(artist?.id);
  const { data: reviews, isLoading: reviewsLoading } = useArtistReviews(id);

  const [activeTab, setActiveTab] = useState<SellerTab>("products");
  const isFavorite = favorites.some(f => f.item_id === artist?.id && f.item_type === 'artist');
  const dateLocale = language === "ar" ? ar : enUS;

  const handleShare = async () => {
    const shareData = {
      title: displayName,
      text: artist?.bio || "",
      url: window.location.href,
    };
    if (navigator.share && navigator.canShare(shareData)) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(window.location.href);
      toast({ title: t.common.linkCopied });
    }
  };

  const handleFavoriteToggle = () => {
    if (!user) { navigate("/auth"); return; }
    if (artist?.id) toggleFavorite('artist', artist.id);
  };

  if (artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <Skeleton className="h-48 w-full" />
        <div className="px-5 -mt-12 relative z-10">
          <Skeleton className="h-36 w-full rounded-3xl" />
        </div>
        <div className="px-5 mt-6 space-y-3">
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <Store className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold text-foreground mb-2">{isRTL ? "المتجر غير موجود" : "Shop not found"}</h2>
          <Button onClick={() => navigate("/shops")}>{isRTL ? "العودة للمتاجر" : "Back to Shops"}</Button>
        </div>
      </div>
    );
  }

  const displayImage = artist.profile?.avatar_url || artist1;
  const displayName = artist.profile?.full_name || (isRTL ? "متجر" : "Shop");
  const displayLocation = artist.profile?.location || artist.studio_address || "";

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* ─── Shop Hero Banner ─── */}
      <div className="relative overflow-hidden bg-gradient-to-br from-accent via-secondary/80 to-accent">
        {/* Decorative shapes */}
        <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-primary/5" />
        <div className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-primary/8" />
        <div className="absolute top-24 right-16 w-4 h-4 rounded-full bg-primary/20 animate-pulse" />

        {/* Top bar */}
        <div className="relative z-10 flex items-center justify-between px-4 pt-12 pb-3">
          <button
            onClick={() => window.history.length > 1 ? navigate(-1) : navigate("/home")}
            className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95 transition-transform"
          >
            <ArrowLeft className={cn("w-4.5 h-4.5 text-foreground", isRTL && "rotate-180")} />
          </button>
          <div className="flex gap-2">
            <button
              onClick={handleFavoriteToggle}
              className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95"
            >
              <Heart className={cn("w-4.5 h-4.5 transition-colors", isFavorite ? "text-primary fill-primary" : "text-foreground")} />
            </button>
            <button
              onClick={handleShare}
              className="w-9 h-9 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center shadow-sm active:scale-95"
            >
              <Share2 className="w-4.5 h-4.5 text-foreground" />
            </button>
          </div>
        </div>

        {/* Shop identity */}
        <div className="relative z-10 flex flex-col items-center pb-16 px-5">
          <Avatar className="w-24 h-24 border-4 border-card shadow-xl">
            <AvatarImage src={displayImage} alt={displayName} />
            <AvatarFallback className="text-3xl bg-card text-primary">
              <Store className="w-10 h-10" />
            </AvatarFallback>
          </Avatar>
          <h1 className="text-xl font-bold text-foreground mt-3" style={{ fontFamily: "var(--font-serif-display)" }}>
            {displayName}
          </h1>
          {displayLocation && (
            <div className="flex items-center gap-1 text-muted-foreground mt-1">
              <MapPin className="w-3.5 h-3.5" />
              <span className="text-xs">{displayLocation}</span>
            </div>
          )}
          {artist.bio && (
            <p className="text-xs text-muted-foreground mt-2 text-center max-w-[280px] line-clamp-2">
              {artist.bio}
            </p>
          )}
        </div>
      </div>

      {/* ─── Stats Card (floating) ─── */}
      <div className="px-5 -mt-10 relative z-10">
        <div className="bg-card rounded-2xl p-4 shadow-lg border border-border/30">
          <div className="grid grid-cols-3 gap-3">
            <div className="text-center">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Package className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="font-bold text-foreground mt-1.5 text-sm">{products.length}</p>
              <p className="text-[11px] text-muted-foreground">{isRTL ? "منتج" : "Products"}</p>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <Star className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="font-bold text-foreground mt-1.5 text-sm">{Number(artist.rating)?.toFixed(1) || "0.0"}</p>
              <p className="text-[11px] text-muted-foreground">{isRTL ? "التقييم" : "Rating"}</p>
            </div>
            <div className="text-center">
              <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center mx-auto">
                <MessageCircle className="w-4.5 h-4.5 text-primary" />
              </div>
              <p className="font-bold text-foreground mt-1.5 text-sm">{artist.total_reviews || 0}</p>
              <p className="text-[11px] text-muted-foreground">{isRTL ? "تقييم" : "Reviews"}</p>
            </div>
          </div>

          {/* Chat Button */}
          <Button
            variant="outline"
            className="w-full mt-4 h-11 rounded-xl gap-2"
            onClick={async () => {
              if (!user) { navigate("/auth"); return; }
              if (!artist?.id) return;
              try {
                const conversationId = await getOrCreateConversation.mutateAsync(artist.id);
                navigate(`/chat/${conversationId}`);
              } catch {
                toast({ title: t.errors.somethingWrong, variant: "destructive" });
              }
            }}
            disabled={getOrCreateConversation.isPending}
          >
            <MessageCircle className="w-4 h-4" />
            {isRTL ? "تواصل مع المتجر" : "Contact Shop"}
          </Button>
        </div>
      </div>

      {/* ─── Trust Badges ─── */}
      <div className="flex gap-2 px-5 mt-4 overflow-x-auto scrollbar-hide">
        <Badge variant="secondary" className="gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium bg-card border border-border/50 whitespace-nowrap">
          <Truck className="w-3.5 h-3.5 text-primary" />
          {isRTL ? "توصيل سريع" : "Fast Delivery"}
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium bg-card border border-border/50 whitespace-nowrap">
          <Shield className="w-3.5 h-3.5 text-primary" />
          {isRTL ? "منتجات أصلية" : "Authentic Products"}
        </Badge>
        <Badge variant="secondary" className="gap-1.5 px-3 py-2 rounded-xl text-[11px] font-medium bg-card border border-border/50 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 text-primary" />
          {isRTL ? "دعم متواصل" : "24/7 Support"}
        </Badge>
      </div>

      {/* ─── Tab Switcher ─── */}
      <div className="px-5 mt-5">
        <div className="flex bg-muted/60 rounded-2xl p-1">
          <button
            onClick={() => setActiveTab("products")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === "products"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <ShoppingBag className="w-4 h-4" />
            {isRTL ? "المنتجات" : "Products"}
            {products.length > 0 && <span className="text-xs opacity-70">({products.length})</span>}
          </button>
          <button
            onClick={() => setActiveTab("reviews")}
            className={cn(
              "flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium transition-all",
              activeTab === "reviews"
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground"
            )}
          >
            <Star className="w-4 h-4" />
            {isRTL ? "التقييمات" : "Reviews"}
            {reviews && reviews.length > 0 && <span className="text-xs opacity-70">({reviews.length})</span>}
          </button>
        </div>
      </div>

      {/* ─── Tab Content ─── */}
      <div className="px-5 mt-4">
        {/* Products Tab */}
        {activeTab === "products" && (
          <>
            {productsLoading ? (
              <div className="grid grid-cols-2 gap-3">
                {[1, 2, 3, 4].map((i) => (
                  <Skeleton key={i} className="h-56 rounded-2xl" />
                ))}
              </div>
            ) : products.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {products.map((product, index) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-2xl border border-border/50 overflow-hidden group hover:border-primary/30 transition-all duration-300 animate-fade-in"
                    style={{ animationDelay: `${index * 50}ms` }}
                  >
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.images && product.images[0] ? (
                        <img
                          src={product.images[0]}
                          alt={product.title}
                          className={cn(
                            "w-full h-full object-cover transition-transform group-hover:scale-105",
                            product.product_type === "physical" && product.inventory_count === 0 && "opacity-50 grayscale"
                          )}
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <Package className="w-12 h-12 text-muted-foreground/30" />
                        </div>
                      )}
                      {product.product_type === "physical" && product.inventory_count === 0 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]">
                          <Badge className="text-xs px-3 py-1 bg-destructive text-destructive-foreground border-0">
                            {isRTL ? "نفذت الكمية" : "Out of Stock"}
                          </Badge>
                        </div>
                      )}
                      <div className="absolute top-2 left-2 flex gap-1 flex-wrap">
                        {product.is_featured && (
                          <Badge className="text-[10px] px-2 py-0.5 bg-[hsl(var(--gold))] text-[hsl(var(--gold-foreground))] border-0">
                            {isRTL ? "مميز" : "Featured"}
                          </Badge>
                        )}
                        {product.compare_at_price && product.compare_at_price > product.price_qar && (
                          <Badge className="text-[10px] px-2 py-0.5 bg-destructive text-destructive-foreground border-0">
                            {isRTL ? "خصم" : "Sale"}
                          </Badge>
                        )}
                        {product.product_type === "physical" && product.inventory_count > 0 && product.inventory_count <= 5 && (
                          <Badge className="text-[10px] px-2 py-0.5 bg-amber-500 text-white border-0">
                            {isRTL ? `متبقي ${product.inventory_count}` : `Only ${product.inventory_count} left`}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="p-3">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2 mb-2">{product.title}</h3>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-primary text-sm">QAR {product.price_qar}</span>
                        {product.compare_at_price && product.compare_at_price > product.price_qar && (
                          <span className="text-[11px] text-muted-foreground line-through">QAR {product.compare_at_price}</span>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="w-full mt-3 rounded-xl gap-1.5"
                        disabled={product.product_type === "physical" && product.inventory_count === 0}
                        onClick={() => {
                          addToCart.mutate(
                            { productId: product.id, quantity: 1 },
                            {
                              onSuccess: () => {
                                toast({
                                  title: isRTL ? "تمت الإضافة للسلة ✓" : "Added to cart ✓",
                                  description: product.title,
                                  action: (
                                    <Button variant="outline" size="sm" onClick={() => navigate("/cart")} className="shrink-0">
                                      {isRTL ? "عرض السلة" : "View Cart"}
                                    </Button>
                                  ),
                                });
                              },
                              onError: (error: any) => {
                                toast({ title: error.message || "Failed", variant: "destructive" });
                              },
                            }
                          );
                        }}
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        {isRTL ? "أضف للسلة" : "Add to Cart"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Package className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">{isRTL ? "لا توجد منتجات بعد" : "No products yet"}</p>
              </div>
            )}
          </>
        )}

        {/* Reviews Tab */}
        {activeTab === "reviews" && (
          <>
            {reviews && reviews.length > 0 && (
              <div className="bg-card rounded-2xl p-4 border border-border/50 mb-4">
                <div className="flex items-center gap-4">
                  <div className="text-center">
                    <p className="text-3xl font-bold text-foreground">{Number(artist.rating)?.toFixed(1)}</p>
                    <div className="flex items-center gap-0.5 mt-1">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          className={cn("w-3.5 h-3.5", star <= Math.round(Number(artist.rating)) ? "text-[hsl(var(--gold))] fill-[hsl(var(--gold))]" : "text-muted-foreground")}
                        />
                      ))}
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">{artist.total_reviews} {isRTL ? "تقييم" : "reviews"}</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((rating) => {
                      const count = reviews.filter(r => r.rating === rating).length;
                      const percentage = (count / reviews.length) * 100;
                      return (
                        <div key={rating} className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground w-3">{rating}</span>
                          <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                            <div className="h-full bg-[hsl(var(--gold))] rounded-full transition-all" style={{ width: `${percentage}%` }} />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {reviewsLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => <Skeleton key={i} className="h-28 rounded-2xl" />)}
              </div>
            ) : reviews && reviews.length > 0 ? (
              <div className="space-y-3">
                {reviews.map((review, index) => (
                  <div key={review.id} className="bg-card rounded-2xl p-4 border border-border/50 animate-fade-in" style={{ animationDelay: `${index * 50}ms` }}>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                        <AvatarFallback className="bg-primary/10 text-primary text-xs">
                          {review.customer_profile?.full_name?.charAt(0) || "C"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <p className="font-medium text-foreground text-sm truncate">
                            {review.customer_profile?.full_name || (isRTL ? "مجهول" : "Anonymous")}
                          </p>
                          <div className="flex items-center gap-0.5">
                            {[...Array(5)].map((_, i) => (
                              <Star key={i} className={cn("w-3 h-3", i < review.rating ? "fill-[hsl(var(--gold))] text-[hsl(var(--gold))]" : "text-muted")} />
                            ))}
                          </div>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {format(new Date(review.created_at), "MMM d, yyyy", { locale: dateLocale })}
                        </p>
                        {review.comment && <p className="text-sm text-foreground mt-2 leading-relaxed">{review.comment}</p>}
                        <div className="mt-2">
                          <HelpfulReviewButton reviewId={review.id} helpfulCount={0} isCompact />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <div className="w-16 h-16 rounded-2xl bg-muted/60 flex items-center justify-center mx-auto mb-3">
                  <Star className="w-8 h-8 text-muted-foreground/40" />
                </div>
                <p className="text-sm text-muted-foreground">{isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
              </div>
            )}
          </>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellerProfile;
