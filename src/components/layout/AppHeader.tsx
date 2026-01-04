import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, LogOut, LogIn, ChevronLeft, Search, Menu, ShoppingBag } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUnreadNotificationsCount } from "@/hooks/useArtistNotifications";
import { useCartItemCount } from "@/hooks/useShoppingCart";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

// TypeScript types for header props
export type HeaderStyle = "modern" | "minimal" | "transparent" | "gradient";

interface AppHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  showSearch?: boolean;
  onSearchClick?: () => void;
  style?: HeaderStyle;
  children?: React.ReactNode;
  className?: string;
}

const AppHeader = ({
  title,
  showBack = false,
  showLogo = false,
  showSearch = false,
  onSearchClick,
  style = "modern",
  children,
  className,
}: AppHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useLanguage();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();
  const { data: cartItemCount = 0 } = useCartItemCount();

  // Scroll state for transparent header
  const [isScrolled, setIsScrolled] = useState(false);
  const headerRef = useRef<HTMLElement>(null);

  // Handle scroll to update header state
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 10) {
        setIsScrolled(true);
      } else {
        setIsScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t.auth.logoutFailed);
    } else {
      toast.success(t.auth.logoutSuccess);
      navigate("/auth");
    }
  };

  // Style-based classes
  const getHeaderClasses = useCallback(() => {
    const baseClasses = "sticky top-0 z-50 transition-all duration-300 safe-area-top";

    const styleClasses = {
      modern: cn(
        "bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-xl border-b border-border/30"
      ),
      minimal: cn(
        "bg-background/80 backdrop-blur-md border-b border-border/20"
      ),
      transparent: cn(
        isScrolled
          ? "bg-background/90 backdrop-blur-xl border-b border-border/30 shadow-lg"
          : "bg-transparent border-transparent"
      ),
      gradient: cn(
        "bg-gradient-to-r from-primary/10 via-primary/5 to-primary/10 backdrop-blur-xl border-b border-primary/20"
      ),
    };

    return cn(baseClasses, styleClasses[style]);
  }, [style, isScrolled]);

  const handleSearch = useCallback(() => {
    if (onSearchClick) {
      onSearchClick();
    } else {
      navigate("/makeup-artists");
    }
  }, [onSearchClick, navigate]);

  return (
    <header
      ref={headerRef}
      className={cn(getHeaderClasses(), className)}
    >
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 -ms-2 rounded-2xl bg-muted/50 hover:bg-muted/80 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {showLogo && (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                <img
                  src={logo}
                  alt="Glam"
                  className="h-9 w-auto object-contain drop-shadow-sm transition-all duration-200 hover:scale-105"
                />
              </div>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1.5">
            {/* Search Button */}
            {showSearch && (
              <button
                onClick={handleSearch}
                className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted/80 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
              >
                <Search className="w-5 h-5 text-foreground" />
              </button>
            )}

            {/* Notification Button */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted/80 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/90 rounded-full shadow-lg animate-in zoom-in-50 duration-200">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted/80 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
            >
              <ShoppingBag className="w-5 h-5 text-foreground" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-primary-foreground bg-gradient-to-r from-gold to-gold/90 rounded-full shadow-lg animate-in zoom-in-50 duration-200">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted/80 active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <Avatar className="w-8 h-8 ring-2 ring-background shadow-sm transition-all duration-200 hover:ring-primary/30">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "Profile"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary text-xs font-semibold">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={12}
                className="w-56 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl p-2 animate-in fade-in-0 zoom-in-95 duration-200"
              >
                {user ? (
                  <>
                    {/* User Info Header - Premium Design */}
                    <div className="px-3 py-3 mb-1 bg-gradient-to-br from-muted/50 to-transparent rounded-xl">
                      <div className="flex items-center gap-3">
                        <Avatar className="w-10 h-10 ring-2 ring-primary/20">
                          <AvatarImage src={profile?.avatar_url || undefined} />
                          <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary font-semibold">
                            {profile?.full_name?.charAt(0) || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-semibold text-foreground truncate">
                            {profile?.full_name || t.userMenu.myProfile}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {profile?.email || user.email}
                          </p>
                        </div>
                      </div>
                    </div>
                    <DropdownMenuSeparator className="bg-border/30 my-1" />
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="cursor-pointer rounded-xl py-3 px-3 focus:bg-muted/80 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 me-3">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium">{t.userMenu.myProfile}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/30 my-1" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer rounded-xl py-3 px-3 text-destructive focus:text-destructive focus:bg-destructive/10 transition-colors duration-150"
                    >
                      <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-destructive/10 me-3">
                        <LogOut className="h-4 w-4 text-destructive" />
                      </div>
                      <span className="font-medium">{t.userMenu.logout}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => navigate("/auth")}
                    className="cursor-pointer rounded-xl py-3 px-3 focus:bg-muted/80 transition-colors duration-150"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 me-3">
                      <LogIn className="h-4 w-4 text-primary" />
                    </div>
                    <span className="font-medium">{t.auth.login}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {children && (
          <div className="mt-3 animate-in fade-in slide-in-from-top-2 duration-300">
            {children}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
