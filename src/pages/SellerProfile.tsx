import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  CheckCircle2,
  PackageCheck,
  Heart,
  MapPin,
  MessageCircle,
  Package,
  Share2,
  ShieldCheck,
  ShoppingBag,
  Star,
  Store,
  Truck,
} from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";

import BottomNavigation from "@/components/BottomNavigation";
import HelpfulReviewButton from "@/components/HelpfulReviewButton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useArtist } from "@/hooks/useArtists";
import { useArtistReviews } from "@/hooks/useReviews";
import { useAuth } from "@/hooks/useAuth";
import { useConversations } from "@/hooks/useConversations";
import { useFavorites } from "@/hooks/useFavorites";
import { useProducts } from "@/hooks/useProducts";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

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

  const isFavorite = favorites.some(
    (favorite) => favorite.item_id === artist?.id && favorite.item_type === "artist",
  );
  const dateLocale = language === "ar" ? ar : enUS;

  const displayName = artist?.profile?.full_name || (isRTL ? "متجر GLAM" : "GLAM Shop");
  const displayImage = artist?.profile?.avatar_url || "/brand/glam-logo-light.png";
  const displayLocation = artist?.profile?.location || artist?.studio_address || (isRTL ? "الدوحة" : "Doha");

  const handleShare = async () => {
    const shareData = {
      title: displayName,
      text: artist?.bio || (isRTL ? "تسوّقي منتجات الجمال المختارة" : "Shop curated beauty products"),
      url: window.location.href,
    };

    if (navigator.share && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
      } catch {
        // The native share sheet was dismissed.
      }
      return;
    }

    await navigator.clipboard.writeText(window.location.href);
    toast.success(t.common.linkCopied);
  };

  const handleFavoriteToggle = () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (artist?.id) toggleFavorite("artist", artist.id);
  };

  const handleContact = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!artist?.id) return;

    try {
      const conversationId = await getOrCreateConversation.mutateAsync(artist.id);
      navigate(`/chat/${conversationId}`);
    } catch {
      toast.error(t.errors.somethingWrong);
    }
  };

  if (artistLoading) {
    return (
      <div className="min-h-dvh bg-glam-porcelain pb-32">
        <Skeleton className="h-80 w-full rounded-b-[34px]" />
        <div className="relative z-10 mx-4 -mt-16 space-y-4">
          <Skeleton className="h-52 w-full rounded-[28px]" />
          <Skeleton className="h-14 w-full rounded-2xl" />
          <div className="grid grid-cols-2 gap-3">
            <Skeleton className="h-56 rounded-2xl" />
            <Skeleton className="h-56 rounded-2xl" />
          </div>
        </div>
      </div>
    );
  }

  if (!artist) {
    return (
      <div className="grid min-h-dvh place-items-center bg-glam-porcelain px-6 text-center">
        <div>
          <div className="mx-auto grid h-20 w-20 place-items-center rounded-full bg-glam-surface">
            <Store className="h-9 w-9 text-glam-rose" strokeWidth={1.6} />
          </div>
          <h2 className="mt-5 text-xl font-bold text-glam-ink">
            {isRTL ? "المتجر غير موجود" : "Shop not found"}
          </h2>
          <p className="mt-2 text-sm text-glam-secondary">
            {isRTL ? "قد يكون الرابط تغيّر أو تم إيقاف المتجر." : "This shop may have moved or become unavailable."}
          </p>
          <Button
            onClick={() => navigate("/shops")}
            className="mt-6 rounded-full bg-glam-ink px-6 text-white hover:bg-glam-ink-pressed"
          >
            {isRTL ? "العودة للمتاجر" : "Back to Shops"}
          </Button>
        </div>
      </div>
    );
  }

  const trustItems = [
    { icon: Truck, ar: "توصيل موثوق", en: "Reliable delivery" },
    { icon: ShieldCheck, ar: "دفع آمن", en: "Secure payment" },
    { icon: PackageCheck, ar: "تتبع الطلب", en: "Order tracking" },
  ];

  return (
    <div className="min-h-dvh bg-glam-porcelain pb-32 text-glam-ink">
      <main className="mx-auto w-full max-w-3xl">
        <section className="relative h-80 overflow-hidden rounded-b-[34px] bg-glam-ink">
          <video
            className="absolute inset-0 h-full w-full object-cover"
            src="/videos/shops/shops-hero.mp4"
            poster="/videos/shops/shops-hero-start.png"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            aria-hidden="true"
          />
          <div className="absolute inset-0 bg-glam-ink/40" />

          <div className="safe-area-top absolute inset-x-0 top-0 z-10 flex items-center justify-between px-4 pt-4">
            <button
              type="button"
              onClick={() => (window.history.length > 1 ? navigate(-1) : navigate("/home"))}
              aria-label={t.common.back}
              className="grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white text-glam-ink shadow-md transition-transform active:scale-95"
            >
              <ArrowLeft className={cn("h-5 w-5", isRTL && "rotate-180")} strokeWidth={1.9} />
            </button>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleShare}
                aria-label={isRTL ? "مشاركة المتجر" : "Share shop"}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white text-glam-ink shadow-md transition-transform active:scale-95"
              >
                <Share2 className="h-5 w-5" strokeWidth={1.8} />
              </button>
              <button
                type="button"
                onClick={handleFavoriteToggle}
                aria-label={isRTL ? "إضافة للمفضلة" : "Add to favorites"}
                aria-pressed={isFavorite}
                className="grid h-11 w-11 place-items-center rounded-full border border-white/60 bg-white shadow-md transition-transform active:scale-95"
              >
                <Heart
                  className={cn(
                    "h-5 w-5 text-glam-ink",
                    isFavorite && "fill-glam-rose text-glam-rose",
                  )}
                  strokeWidth={1.8}
                />
              </button>
            </div>
          </div>

          <div className="absolute inset-x-0 bottom-14 z-10 px-6 text-white">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-white/60 bg-glam-ink/55 px-3 py-1.5 text-[11px] font-semibold tracking-wide">
              <CheckCircle2 className="h-3.5 w-3.5 text-glam-blush" strokeWidth={2} />
              {isRTL ? "متجر موثّق في GLAM" : "VERIFIED GLAM STORE"}
            </span>
            <h1 className="mt-3 text-[30px] font-bold leading-tight">{displayName}</h1>
            <div className="mt-2 flex items-center gap-1.5 text-sm text-white/90">
              <MapPin className="h-4 w-4 text-glam-blush" strokeWidth={1.8} />
              <span>{displayLocation}</span>
            </div>
          </div>
        </section>

        <section className="relative z-20 mx-4 -mt-10 rounded-[28px] border border-glam-border bg-white p-5 shadow-xl shadow-glam-ink/10">
          <div className="flex items-center gap-4">
            <Avatar className="h-[76px] w-[76px] shrink-0 border-2 border-white shadow-md ring-1 ring-glam-border">
              <AvatarImage src={displayImage} alt={displayName} className="object-cover" />
              <AvatarFallback className="bg-glam-surface text-glam-rose">
                <Store className="h-7 w-7" strokeWidth={1.7} />
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-glam-rose">
                {isRTL ? "وجهة الجمال المختارة" : "CURATED BEAUTY"}
              </p>
              <p className="mt-1 line-clamp-2 text-sm leading-6 text-glam-secondary">
                {artist.bio || (isRTL
                  ? "منتجات جمال مختارة بعناية لتجربة تسوق أنيقة وموثوقة."
                  : "Thoughtfully selected beauty products for an elegant, trusted shopping experience.")}
              </p>
            </div>
          </div>

          <div className="mt-5 grid grid-cols-3 divide-x divide-glam-border rtl:divide-x-reverse">
            <div className="text-center">
              <p className="text-lg font-bold text-glam-ink">{products.length}</p>
              <p className="mt-0.5 text-[11px] text-glam-muted">{isRTL ? "منتج" : "Products"}</p>
            </div>
            <div className="text-center">
              <p className="inline-flex items-center gap-1 text-lg font-bold text-glam-ink">
                <Star className="h-4 w-4 fill-glam-rose text-glam-rose" />
                {Number(artist.rating)?.toFixed(1) || "0.0"}
              </p>
              <p className="mt-0.5 text-[11px] text-glam-muted">{isRTL ? "التقييم" : "Rating"}</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-glam-ink">{artist.total_reviews || 0}</p>
              <p className="mt-0.5 text-[11px] text-glam-muted">{isRTL ? "تقييم" : "Reviews"}</p>
            </div>
          </div>

          <Button
            onClick={handleContact}
            disabled={getOrCreateConversation.isPending}
            className="mt-5 h-12 w-full rounded-full bg-glam-ink text-sm font-semibold text-white shadow-lg shadow-glam-ink/15 hover:bg-glam-ink-pressed"
          >
            <MessageCircle className="me-2 h-4 w-4" strokeWidth={1.9} />
            {getOrCreateConversation.isPending
              ? (isRTL ? "جاري فتح المحادثة..." : "Opening chat...")
              : (isRTL ? "تواصل مع المتجر" : "Contact shop")}
          </Button>
        </section>

        <section className="mt-5 px-4" aria-label={isRTL ? "مزايا المتجر" : "Shop benefits"}>
          <div className="grid grid-cols-3 gap-2">
            {trustItems.map(({ icon: Icon, ar: labelAr, en: labelEn }) => (
              <div key={labelEn} className="rounded-2xl border border-glam-border bg-glam-surface px-2 py-3 text-center">
                <Icon className="mx-auto h-5 w-5 text-glam-rose" strokeWidth={1.7} />
                <p className="mt-2 text-[10px] font-semibold leading-tight text-glam-secondary">
                  {isRTL ? labelAr : labelEn}
                </p>
              </div>
            ))}
          </div>
        </section>

        <section className="sticky top-0 z-30 mt-6 border-y border-glam-border bg-white/95 px-4 py-3 backdrop-blur-md">
          <div className="grid grid-cols-2 gap-2 rounded-full bg-glam-surface p-1" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                activeTab === "products" ? "bg-glam-ink text-white" : "text-glam-secondary",
              )}
            >
              <ShoppingBag className="h-4 w-4" strokeWidth={1.8} />
              {isRTL ? "المنتجات" : "Products"}
              <span className="text-[11px] opacity-75">{products.length}</span>
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "reviews"}
              onClick={() => setActiveTab("reviews")}
              className={cn(
                "flex h-11 items-center justify-center gap-2 rounded-full text-sm font-semibold transition-colors",
                activeTab === "reviews" ? "bg-glam-ink text-white" : "text-glam-secondary",
              )}
            >
              <Star className="h-4 w-4" strokeWidth={1.8} />
              {isRTL ? "التقييمات" : "Reviews"}
              <span className="text-[11px] opacity-75">{reviews?.length || 0}</span>
            </button>
          </div>
        </section>

        <section className="px-4 py-5">
          {activeTab === "products" && (
            <div role="tabpanel">
              <div className="mb-4 flex items-end justify-between gap-4">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-glam-rose">
                    {isRTL ? "اختيارات المتجر" : "SHOP SELECTION"}
                  </p>
                  <h2 className="mt-1 text-xl font-bold text-glam-ink">
                    {isRTL ? "منتجات مختارة لكِ" : "Curated for you"}
                  </h2>
                </div>
                <span className="text-xs text-glam-muted">{products.length} {isRTL ? "منتج" : "items"}</span>
              </div>

              {productsLoading ? (
                <div className="grid grid-cols-2 gap-3">
                  {[1, 2, 3, 4].map((item) => <Skeleton key={item} className="h-64 rounded-2xl" />)}
                </div>
              ) : products.length > 0 ? (
                <div className="grid grid-cols-2 gap-3">
                  {products.map((product, index) => {
                    const soldOut = product.product_type === "physical" && product.inventory_count === 0;
                    const discounted = Boolean(product.compare_at_price && product.compare_at_price > product.price_qar);
                    return (
                      <article
                        key={product.id}
                        className="overflow-hidden rounded-[22px] border border-glam-border bg-white shadow-sm shadow-glam-ink/5 animate-fade-in"
                        style={{ animationDelay: `${index * 45}ms` }}
                      >
                        <div className="relative aspect-[4/5] overflow-hidden bg-glam-surface">
                          {product.images?.[0] ? (
                            <img
                              src={product.images[0]}
                              alt={product.title}
                              loading="lazy"
                              className={cn("h-full w-full object-cover", soldOut && "opacity-50 grayscale")}
                            />
                          ) : (
                            <div className="grid h-full w-full place-items-center">
                              <Package className="h-10 w-10 text-glam-muted" strokeWidth={1.4} />
                            </div>
                          )}

                          <div className="absolute inset-x-2 top-2 flex flex-wrap gap-1">
                            {product.is_featured && (
                              <Badge className="border-0 bg-glam-ink px-2 py-1 text-[9px] font-semibold text-white">
                                {isRTL ? "مختار" : "CURATED"}
                              </Badge>
                            )}
                            {discounted && (
                              <Badge className="border-0 bg-glam-rose px-2 py-1 text-[9px] font-semibold text-white">
                                {isRTL ? "عرض" : "OFFER"}
                              </Badge>
                            )}
                            {soldOut && (
                              <Badge className="border-0 bg-glam-ink px-2 py-1 text-[9px] font-semibold text-white">
                                {isRTL ? "نفذت الكمية" : "SOLD OUT"}
                              </Badge>
                            )}
                          </div>
                        </div>

                        <div className="p-3">
                          <h3 className="line-clamp-2 min-h-10 text-sm font-semibold leading-5 text-glam-ink">
                            {product.title}
                          </h3>
                          <div className="mt-2 flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                            <span className="text-sm font-bold text-glam-rose">QAR {product.price_qar}</span>
                            {discounted && (
                              <span className="text-[10px] text-glam-muted line-through">QAR {product.compare_at_price}</span>
                            )}
                          </div>
                          <Button
                            size="sm"
                            disabled={soldOut}
                            className="mt-3 h-10 w-full rounded-full bg-glam-ink text-xs font-semibold text-white hover:bg-glam-ink-pressed disabled:bg-glam-surface disabled:text-glam-muted"
                            onClick={() => {
                              addToCart.mutate(
                                { productId: product.id, quantity: 1 },
                                {
                                  onSuccess: () => {
                                    toast.success(isRTL ? "تمت الإضافة للسلة" : "Added to cart", {
                                      description: product.title,
                                      action: {
                                        label: isRTL ? "عرض السلة" : "View cart",
                                        onClick: () => navigate("/cart"),
                                      },
                                    });
                                  },
                                  onError: (error: Error) => toast.error(error.message || (isRTL ? "تعذر إضافة المنتج" : "Could not add product")),
                                },
                              );
                            }}
                          >
                            <ShoppingBag className="me-1.5 h-3.5 w-3.5" />
                            {soldOut ? (isRTL ? "غير متوفر" : "Unavailable") : (isRTL ? "أضف للسلة" : "Add to cart")}
                          </Button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              ) : (
                <div className="rounded-[28px] border border-glam-border bg-glam-surface px-6 py-12 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm">
                    <ShoppingBag className="h-7 w-7 text-glam-rose" strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-glam-ink">
                    {isRTL ? "مجموعة جديدة قيد التحضير" : "A new collection is coming"}
                  </h3>
                  <p className="mx-auto mt-2 max-w-xs text-sm leading-6 text-glam-secondary">
                    {isRTL ? "يجهّز المتجر اختيارات جديدة بعناية. احفظيه في المفضلة للعودة إليه لاحقاً." : "The shop is carefully preparing new picks. Save it to your favorites and check back soon."}
                  </p>
                  <button
                    type="button"
                    onClick={handleFavoriteToggle}
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-full border border-glam-ink px-5 text-sm font-semibold text-glam-ink transition-colors active:bg-glam-surface"
                  >
                    <Heart className={cn("h-4 w-4", isFavorite && "fill-glam-rose text-glam-rose")} />
                    {isFavorite ? (isRTL ? "محفوظ في المفضلة" : "Saved") : (isRTL ? "احفظ المتجر" : "Save shop")}
                  </button>
                </div>
              )}
            </div>
          )}

          {activeTab === "reviews" && (
            <div role="tabpanel">
              <div className="mb-4">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-glam-rose">
                  {isRTL ? "آراء موثوقة" : "VERIFIED FEEDBACK"}
                </p>
                <h2 className="mt-1 text-xl font-bold text-glam-ink">
                  {isRTL ? "تجارب العملاء" : "Customer experiences"}
                </h2>
              </div>

              {reviews && reviews.length > 0 && (
                <div className="mb-4 rounded-[24px] border border-glam-border bg-glam-surface p-4">
                  <div className="flex items-center gap-5">
                    <div className="min-w-20 text-center">
                      <p className="text-3xl font-bold text-glam-ink">{Number(artist.rating)?.toFixed(1)}</p>
                      <div className="mt-1 flex justify-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={cn(
                              "h-3.5 w-3.5",
                              star <= Math.round(Number(artist.rating))
                                ? "fill-glam-rose text-glam-rose"
                                : "text-glam-border",
                            )}
                          />
                        ))}
                      </div>
                      <p className="mt-1 text-[11px] text-glam-muted">{artist.total_reviews || reviews.length} {isRTL ? "تقييم" : "reviews"}</p>
                    </div>
                    <div className="flex-1 space-y-1.5">
                      {[5, 4, 3, 2, 1].map((rating) => {
                        const percentage = (reviews.filter((review) => review.rating === rating).length / reviews.length) * 100;
                        return (
                          <div key={rating} className="flex items-center gap-2">
                            <span className="w-3 text-[10px] text-glam-muted">{rating}</span>
                            <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-white">
                              <div className="h-full rounded-full bg-glam-rose" style={{ width: `${percentage}%` }} />
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
                  {[1, 2].map((item) => <Skeleton key={item} className="h-32 rounded-2xl" />)}
                </div>
              ) : reviews && reviews.length > 0 ? (
                <div className="space-y-3">
                  {reviews.map((review, index) => (
                    <article
                      key={review.id}
                      className="rounded-[22px] border border-glam-border bg-white p-4 animate-fade-in"
                      style={{ animationDelay: `${index * 45}ms` }}
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-10 w-10 ring-1 ring-glam-border">
                          <AvatarImage src={review.customer_profile?.avatar_url || ""} />
                          <AvatarFallback className="bg-glam-surface text-xs font-semibold text-glam-rose">
                            {review.customer_profile?.full_name?.charAt(0) || "G"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div>
                              <p className="truncate text-sm font-semibold text-glam-ink">
                                {review.customer_profile?.full_name || (isRTL ? "عميل GLAM" : "GLAM customer")}
                              </p>
                              <p className="mt-0.5 text-[11px] text-glam-muted">
                                {format(new Date(review.created_at), "MMM d, yyyy", { locale: dateLocale })}
                              </p>
                            </div>
                            <div className="flex gap-0.5">
                              {[...Array(5)].map((_, starIndex) => (
                                <Star
                                  key={starIndex}
                                  className={cn(
                                    "h-3 w-3",
                                    starIndex < review.rating ? "fill-glam-rose text-glam-rose" : "text-glam-border",
                                  )}
                                />
                              ))}
                            </div>
                          </div>
                          {review.comment && <p className="mt-3 text-sm leading-6 text-glam-secondary">{review.comment}</p>}
                          <div className="mt-3 border-t border-glam-border pt-2">
                            <HelpfulReviewButton reviewId={review.id} helpfulCount={0} isCompact />
                          </div>
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              ) : (
                <div className="rounded-[28px] border border-glam-border bg-glam-surface px-6 py-12 text-center">
                  <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white shadow-sm">
                    <Star className="h-7 w-7 text-glam-rose" strokeWidth={1.6} />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-glam-ink">
                    {isRTL ? "لا توجد تقييمات بعد" : "No reviews yet"}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-glam-secondary">
                    {isRTL ? "ستظهر تجارب العملاء الموثقة هنا." : "Verified customer experiences will appear here."}
                  </p>
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      <BottomNavigation />
    </div>
  );
};

export default SellerProfile;
