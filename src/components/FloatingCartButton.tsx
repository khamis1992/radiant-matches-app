import { useNavigate } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useCartItemCount } from "@/hooks/useShoppingCart";
import { useAuth } from "@/hooks/useAuth";
import { cn } from "@/lib/utils";

export const FloatingCartButton = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: itemCount = 0 } = useCartItemCount();

  if (!user) {
    return null;
  }

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
        itemCount > 0
          ? "bg-gradient-to-br from-primary to-primary/80 shadow-primary/30 text-white"
          : "bg-card border-2 border-border/50 text-muted-foreground"
      )}
    >
      <ShoppingBag className="w-6 h-6" />
      {itemCount > 0 && (
        <span className="absolute -top-1 -right-1 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-bold bg-white text-primary rounded-full px-1 shadow-md animate-bounce-in">
          {itemCount > 99 ? "99+" : itemCount}
        </span>
      )}
    </button>
  );
};
