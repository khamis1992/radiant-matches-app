import { useNavigate, useLocation } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { cn } from "@/lib/utils";

export const FloatingCartButton = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, isLoading } = useUnifiedCart();

  // Hide on cart and checkout pages
  const hiddenPaths = ["/cart", "/checkout", "/order-confirmation", "/auth"];
  if (hiddenPaths.some(path => location.pathname.startsWith(path))) {
    return null;
  }

  // Show cart button with count (works for both guests and logged-in users)
  return (
    <button
      onClick={() => navigate("/cart")}
      className={cn(
        "fixed bottom-24 right-5 z-40",
        "w-14 h-14 rounded-full",
        "shadow-lg",
        "flex items-center justify-center",
        "hover:scale-105 active:scale-95",
        "transition-all duration-300",
        "animate-bounce-in",
        cartCount > 0
          ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/30 text-primary-foreground"
          : "bg-card border-2 border-border/50 text-muted-foreground"
      )}
    >
      <ShoppingBag className="w-6 h-6" />
      {cartCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-bold bg-background text-primary rounded-full px-1 shadow-md border border-border animate-bounce-in">
          {cartCount > 99 ? "99+" : cartCount}
        </span>
      )}
    </button>
  );
};
