import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShoppingBag, Trash2, Plus, Minus, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useShoppingCart, useRemoveFromCart, useUpdateCartItem } from "@/hooks/useShoppingCart";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const Cart = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  const { data: cartItems = [], isLoading } = useShoppingCart();
  const removeFromCart = useRemoveFromCart();
  const updateCartItem = useUpdateCartItem();

  const [quantities, setQuantities] = useState<Record<string, number>>({});

  const handleQuantityChange = (cartItemId: string, newQuantity: number) => {
    if (newQuantity < 1) return;
    setQuantities({ ...quantities, [cartItemId]: newQuantity });
    updateCartItem.mutate(
      { cartItemId, quantity: newQuantity },
      {
        onError: (error: any) => {
          toast.error(error.message || "Failed to update cart");
          // Revert the change
          setQuantities({ ...quantities, [cartItemId]: quantities[cartItemId] || 1 });
        },
      }
    );
  };

  const handleRemove = (cartItemId: string) => {
    removeFromCart.mutate(cartItemId, {
      onSuccess: () => {
        toast.success("Item removed from cart");
      },
    });
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (quantities[item.id] || item.quantity) * item.product.price_qar,
    0
  );

  const handleCheckout = () => {
    if (authLoading) return;

    if (!user) {
      toast.error(t.profile?.signInToView || "Please log in to continue");
      navigate("/auth", { state: { from: "/checkout" } });
      return;
    }
    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }
    navigate("/checkout");
  };

  if (authLoading) {
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
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center px-6">
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
            <ShoppingBag className="w-10 h-10 text-muted-foreground" />
          </div>
          <h2 className="text-xl font-semibold mb-2">{t.profile?.signInToView || "Sign In Required"}</h2>
          <p className="text-muted-foreground mb-6">{t.profile?.signInDesc || "Please sign in to view your cart"}</p>
          <Button onClick={() => navigate("/auth", { state: { from: "/cart" } })}>{t.auth?.login || "Sign In"}</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
        <h1 className="text-2xl font-bold text-foreground mb-2">Shopping Cart</h1>
        <p className="text-sm text-muted-foreground">
          {cartItems.length} {cartItems.length === 1 ? "item" : "items"}
        </p>
      </div>

      {/* Cart Items */}
      <div className="px-5 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
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
        ) : cartItems.length > 0 ? (
          <div className="space-y-4">
            {cartItems.map((item) => (
              <div
                key={item.id}
                className="flex gap-4 p-4 bg-card rounded-2xl border border-border/50"
              >
                {/* Product Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.product.images && item.product.images[0] ? (
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
                    <div className="min-w-0 flex-1">
                      <h3 className="font-semibold text-foreground text-sm line-clamp-2">
                        {item.product.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {item.product.product_type.replace("_", " ")}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRemove(item.id)}
                      className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <p className="font-bold text-primary">
                      QAR {item.product.price_qar}
                      {item.product.compare_at_price && item.product.compare_at_price > item.product.price_qar && (
                        <span className="text-xs text-muted-foreground line-through ml-2">
                          QAR {item.product.compare_at_price}
                        </span>
                      )}
                    </p>

                    {/* Quantity Controls */}
                    <div className="flex items-center gap-2 bg-muted rounded-xl p-1">
                      <button
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || item.quantity) - 1)}
                        disabled={updateCartItem.isPending}
                        className="w-8 h-8 rounded-lg bg-card flex items-center justify-center hover:bg-muted-foreground/10 disabled:opacity-50 transition-colors"
                      >
                        <Minus className="w-4 h-4" />
                      </button>
                      <span className="w-8 text-center font-medium text-foreground text-sm">
                        {quantities[item.id] || item.quantity}
                      </span>
                      <button
                        onClick={() => handleQuantityChange(item.id, (quantities[item.id] || item.quantity) + 1)}
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
                  </div>

                  {/* Stock warning */}
                  {item.product.product_type === "physical" &&
                    (quantities[item.id] || item.quantity) >= item.product.inventory_count && (
                      <p className="text-xs text-destructive mt-2">Maximum stock reached</p>
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
            <h3 className="text-lg font-semibold text-foreground mb-2">Your cart is empty</h3>
            <p className="text-muted-foreground mb-6">Start shopping to add items to your cart</p>
            <Button onClick={() => navigate("/home")} className="rounded-xl">
              Browse Artists
            </Button>
          </div>
        )}
      </div>

      {/* Checkout Bar */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 p-5 bg-card border-t border-border/50 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-muted-foreground">Subtotal</span>
            <span className="text-xl font-bold text-foreground">QAR {subtotal.toFixed(2)}</span>
          </div>
          <Button
            onClick={handleCheckout}
            className="w-full h-12 rounded-xl font-medium"
            size="lg"
          >
            Proceed to Checkout
            <ArrowRight className="w-5 h-5 ml-2" />
          </Button>
        </div>
      )}
    </div>
  );
};

export default Cart;
