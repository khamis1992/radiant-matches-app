import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package, LogIn, Clock, ChevronRight, History, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useCustomerOrders } from "@/hooks/useProductOrders";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNavigation from "@/components/BottomNavigation";
import BackButton from "@/components/BackButton";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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
  const { data: orders = [], isLoading: ordersLoading } = useCustomerOrders();

  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [activeTab, setActiveTab] = useState<"cart" | "orders">("cart");

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

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending": return "bg-amber-500/10 text-amber-600 border-amber-500/20";
      case "processing": return "bg-blue-500/10 text-blue-600 border-blue-500/20";
      case "shipped": return "bg-purple-500/10 text-purple-600 border-purple-500/20";
      case "delivered": return "bg-green-500/10 text-green-600 border-green-500/20";
      case "cancelled": return "bg-red-500/10 text-red-600 border-red-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      pending: { ar: "قيد الانتظار", en: "Pending" },
      processing: { ar: "جاري التجهيز", en: "Processing" },
      shipped: { ar: "تم الشحن", en: "Shipped" },
      delivered: { ar: "تم التوصيل", en: "Delivered" },
      cancelled: { ar: "ملغي", en: "Cancelled" },
    };
    return language === "ar" ? labels[status]?.ar || status : labels[status]?.en || status;
  };

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
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
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-4 px-5">
        <div className="flex items-center gap-2 mb-4">
          <BackButton />
          <h1 className="text-2xl font-bold text-foreground">
            {language === "ar" ? "سلة التسوق" : "Shopping Cart"}
          </h1>
        </div>
        
        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "cart" | "orders")} className="w-full">
          <TabsList className="w-full grid grid-cols-2 bg-muted/50 rounded-xl p-1 h-12">
            <TabsTrigger 
              value="cart" 
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2 h-10"
            >
              <ShoppingCart className="w-4 h-4" />
              <span>{language === "ar" ? "السلة" : "Cart"}</span>
              {cartItems.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {cartItems.length}
                </Badge>
              )}
            </TabsTrigger>
            <TabsTrigger 
              value="orders" 
              className="rounded-lg data-[state=active]:bg-card data-[state=active]:shadow-sm flex items-center gap-2 h-10"
            >
              <History className="w-4 h-4" />
              <span>{language === "ar" ? "سجل الطلبات" : "Order History"}</span>
              {orders.length > 0 && (
                <Badge variant="secondary" className="h-5 min-w-5 px-1.5 text-[10px]">
                  {orders.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Guest Banner */}
      {isGuest && cartItems.length > 0 && activeTab === "cart" && (
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

      {/* Cart Tab Content */}
      {activeTab === "cart" && (
        <div className="px-5 py-6">
          {cartItems.length > 0 ? (
            <div className="space-y-4">
              {cartItems.map((item, index) => (
                <div
                  key={item.id}
                  className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50 animate-fade-in hover:border-primary/20 transition-colors"
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
                        className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
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
                    <div className="flex items-center gap-2 mt-3 bg-muted rounded-xl p-1 w-fit">
                      <button
                        onClick={() => handleQuantityChange(item.id, item.product_id, (quantities[item.id] || item.quantity) - 1)}
                        disabled={updateCartItem.isPending || (quantities[item.id] || item.quantity) <= 1}
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
              <Button onClick={() => setActiveTab("orders")} variant="outline" className="rounded-xl gap-2">
                <History className="w-4 h-4" />
                {language === "ar" ? "عرض سجل الطلبات" : "View Order History"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Orders Tab Content */}
      {activeTab === "orders" && (
        <div className="px-5 py-6">
          {!user ? (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <LogIn className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {language === "ar" ? "سجل الدخول لعرض طلباتك" : "Sign in to view your orders"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {language === "ar" ? "تتبع طلباتك ومشترياتك السابقة" : "Track your orders and past purchases"}
              </p>
              <Button onClick={() => navigate("/auth", { state: { from: "/cart" } })} className="rounded-xl">
                {language === "ar" ? "تسجيل الدخول" : "Sign In"}
              </Button>
            </div>
          ) : ordersLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <Skeleton key={i} className="h-32 w-full rounded-2xl" />
              ))}
            </div>
          ) : orders.length > 0 ? (
            <div className="space-y-4">
              {orders.map((order, index) => (
                <div
                  key={order.id}
                  onClick={() => navigate(`/orders/${order.id}`)}
                  className="p-4 bg-card rounded-2xl border border-border/50 animate-fade-in hover:border-primary/20 cursor-pointer transition-all hover:shadow-md active:scale-[0.98]"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <p className="text-xs text-muted-foreground mb-1">
                        {language === "ar" ? "رقم الطلب" : "Order"} #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="w-3.5 h-3.5" />
                        {format(new Date(order.created_at || ""), "dd MMM yyyy, HH:mm", {
                          locale: language === "ar" ? ar : enUS,
                        })}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className={`text-[10px] ${getStatusColor(order.status || "pending")}`}>
                        {getStatusLabel(order.status || "pending")}
                      </Badge>
                      <ChevronRight className={`w-4 h-4 text-muted-foreground ${isRTL ? "rotate-180" : ""}`} />
                    </div>
                  </div>

                  {/* Order Items Preview */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="flex -space-x-2 rtl:space-x-reverse">
                      {order.items.slice(0, 3).map((item, i) => (
                        <div
                          key={i}
                          className="w-10 h-10 rounded-lg overflow-hidden bg-muted border-2 border-card"
                        >
                          {item.product_image ? (
                            <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-4 h-4 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="w-10 h-10 rounded-lg bg-muted border-2 border-card flex items-center justify-center text-xs font-medium text-muted-foreground">
                          +{order.items.length - 3}
                        </div>
                      )}
                    </div>
                    <span className="text-sm text-muted-foreground">
                      {order.items.length} {order.items.length === 1 
                        ? (language === "ar" ? "منتج" : "item") 
                        : (language === "ar" ? "منتجات" : "items")}
                    </span>
                  </div>

                  {/* Order Total */}
                  <div className="flex items-center justify-between pt-3 border-t border-border/50">
                    <span className="text-sm text-muted-foreground">
                      {language === "ar" ? "المجموع" : "Total"}
                    </span>
                    <span className="font-semibold text-primary">
                      QAR {Number(order.total_qar).toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
                <Package className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-semibold text-foreground mb-2">
                {language === "ar" ? "لا توجد طلبات بعد" : "No orders yet"}
              </h3>
              <p className="text-muted-foreground mb-6">
                {language === "ar" ? "ابدأ التسوق وستظهر طلباتك هنا" : "Start shopping and your orders will appear here"}
              </p>
              <Button onClick={() => setActiveTab("cart")} variant="outline" className="rounded-xl gap-2">
                <ShoppingCart className="w-4 h-4" />
                {language === "ar" ? "العودة للسلة" : "Go to Cart"}
              </Button>
            </div>
          )}
        </div>
      )}

      {/* Checkout Bar - Only show for cart tab with items */}
      {activeTab === "cart" && cartItems.length > 0 && (
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