import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNavigation from "@/components/BottomNavigation";

const Cart = () => {
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const {
    cartItems,
    isLoading,
    isGuest,
    updateCartItem,
    removeFromCart,
  } = useUnifiedCart();

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (cartItemId: string, productId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities({ ...quantities, [cartItemId]: newQuantity });
    updateCartItem.mutate(
      { cartItemId, productId, quantity: newQuantity },
      {
        onError: (error: any) => {
          toast.error(error.message || "Failed to update cart");
          setQuantities({ ...quantities, [cartItemId]: quantities[cartItemId] || 1 });
        },
      }
    );
  };

  const handleRemove = (cartItemId: string, productId: string) => {
    removeFromCart.mutate(
      { cartItemId, productId },
      {
        onSuccess: () => {
          toast.success(language === "ar" ? "تمت إزالة المنتج" : "Item removed from cart");
        },
      }
    );
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (quantities[item.id] || item.quantity) * item.product.price_qar,
    0
  );

  const handleCheckout = () => {
    if (authLoading) return;

    if (!user) {
      toast.info(language === "ar" ? "يرجى تسجيل الدخول لإتمام الشراء" : "Please sign in to checkout");
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    if (cartItems.length === 0) {
      toast.error(language === "ar" ? "سلة التسوق فارغة" : "Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-24 mt-2" />
        </div>
        <div className="px-5 py-6 space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50">
              <Skeleton className="w-24 h-24 rounded-xl" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-24" />
              </div>
            </div>
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
        <h1 className="text-2xl font-bold text-foreground mb-2">
          {language === "ar" ? "سلة التسوق" : "Shopping Cart"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 
            ? (language === "ar" ? "منتج" : "item") 
            : (language === "ar" ? "منتجات" : "items")}
          {isGuest && (
            <span className="text-primary ml-2">
              ({language === "ar" ? "سلة مؤقتة" : "Guest cart"})
            </span>
          )}
        </p>
      </div>

      {/* Guest Banner */}
      {isGuest && cartItems.length > 0 && (
        <div className="mx-5 mt-4 p-4 bg-primary/10 rounded-2xl border border-primary/20">
          <div className="flex items-start gap-3">
            <LogIn className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm font-medium text-foreground">
                {language === "ar" ? "سجل دخولك للحفاظ على سلتك" : "Sign in to save your cart"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                {language === "ar" 
                  ? "سيتم حفظ العناصر تلقائياً عند تسجيل الدخول" 
                  : "Items will be automatically saved when you sign in"}
              </p>
            </div>
            <Button
              size="sm"
              variant="default"
              className="rounded-xl"
              onClick={() => navigate("/auth", { state: { from: "/cart" } })}
            >
              {language === "ar" ? "تسجيل" : "Sign In"}
            </Button>
          </div>
        </div>
      )}

      {/* Cart Items */}
      <div className="px-5 py-6">
        {cartItems.length > 0 ? (
          <div className="space-y-4">
            {cartItems.map((item, index) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
                {/* Product Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.product.images?.[0] ? (
                    <img
                      src={item.product.images[0]}
                      alt={item.product.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>

                {/* Product Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-medium text-foreground line-clamp-2">{item.product.title}</h3>
                    <button
                      onClick={() => handleRemove(item.id, item.product_id)}
                      disabled={removeFromCart.isPending}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors disabled:opacity-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <p className="text-primary font-semibold mt-1">
                    QAR {item.product.price_qar.toFixed(2)}
                    {item.product.compare_at_price && (
                      <span className="text-xs text-muted-foreground line-through ml-2">
                        QAR {item.product.compare_at_price.toFixed(2)}
                      </span>
                    )}
                  </p>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-3 bg-muted rounded-xl p-1">
                    <button
                      onClick={() => handleQuantityChange(item.id, item.product_id, (quantities[item.id] || item.quantity) - 1)}
                      disabled={updateCartItem.isPending}
                      className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:bg-muted-foreground/10 disabled:opacity-50 transition-colors"
                    >
                      <Minus className="w-4 h-4" />
                    </button>
                    <span className="w-8 text-center font-medium text-foreground text-sm">
                      {quantities[item.id] || item.quantity}
                    </span>
                    <button
                      onClick={() => handleQuantityChange(item.id, item.product_id, (quantities[item.id] || item.quantity) + 1)}
                      disabled={
                        updateCartItem.isPending ||
                        (item.product.product_type === "physical" &&
                          (quantities[item.id] || item.quantity) >= item.product.inventory_count)
                      }
                      className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:bg-muted-foreground/10 disabled:opacity-50 transition-colors"
                    >
                      <Plus className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Stock warning */}
                  {item.product.product_type === "physical" &&
                    (quantities[item.id] || item.quantity) >= item.product.inventory_count && (
                      <p className="text-xs text-destructive mt-2">
                        {language === "ar" ? "الحد الأقصى للمخزون" : "Maximum stock reached"}
                      </p>
                    )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {language === "ar" ? "سلتك فارغة" : "Your cart is empty"}
            </h3>
            <p className="text-muted-foreground mb-6">
              {language === "ar" ? "ابدأ التسوق لإضافة منتجات" : "Start shopping to add items to your cart"}
            </p>
            <Button onClick={() => navigate("/orders")} className="rounded-xl">
              {language === "ar" ? "طلباتي" : "My Orders"}
            </Button>
          </div>
        )}
      </div>

      {/* Checkout Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-background via-background to-transparent pt-6 pb-36">
          <div className="mx-5 p-4 bg-card rounded-2xl border border-border/50 shadow-xl backdrop-blur-sm">
            {/* Order Summary */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === "ar" ? "المنتجات" : "Items"} ({cartItems.length})
                </span>
                <span className="text-foreground">QAR {subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">
                  {language === "ar" ? "التوصيل" : "Delivery"}
                </span>
                <span className="text-primary font-medium">
                  {language === "ar" ? "يحدد عند الدفع" : "Calculated at checkout"}
                </span>
              </div>
              <div className="h-px bg-border my-2" />
              <div className="flex items-center justify-between">
                <span className="font-semibold text-foreground">
                  {language === "ar" ? "المجموع الفرعي" : "Subtotal"}
                </span>
                <div className="text-right">
                  <span className="text-xl font-bold text-primary">QAR {subtotal.toFixed(2)}</span>
                </div>
              </div>
            </div>
            
            {/* Checkout Button */}
            <Button
              onClick={handleCheckout}
              className="w-full h-12 rounded-xl font-semibold text-base gap-2 shadow-lg shadow-primary/20"
              size="lg"
            >
              <ShoppingBag className="w-5 h-5" />
              {isGuest 
                ? (language === "ar" ? "سجل دخولك لإتمام الشراء" : "Sign In to Checkout")
                : (language === "ar" ? "إتمام الشراء" : "Proceed to Checkout")}
              <ArrowRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
            </Button>
          </div>
        </div>
      )}

      <BottomNavigation />
    </div>
  );
};

export default Cart;
