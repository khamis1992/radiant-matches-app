import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, SignOut, SignIn, CaretLeft, MagnifyingGlass, ShoppingBag } from "@phosphor-icons/react";
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
        "bg-white border-b border-glam-border"
      ),
      minimal: cn(
        "bg-white border-b border-glam-border"
      ),
      transparent: cn(
        isScrolled
          ? "bg-white/95 backdrop-blur-md border-b border-glam-border"
          : "bg-transparent border-transparent"
      ),
      gradient: cn(
        "bg-white border-b border-glam-border"
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
                className="flex items-center justify-center w-9 h-9 -ms-1 rounded-full hover:bg-glam-surface transition-colors focus:outline-none"
              >
                <CaretLeft size={20} className="text-glam-ink rtl:-scale-x-100" />
              </button>
            )}
            {showLogo && (
              <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate("/home")}>
                <img
                  src="/brand/glam-logo-light.png"
                  alt="GLAM Beauty"
                  className="h-9 w-auto object-contain"
                />
              </div>
            )}
            {title && (
              <h1 className="text-lg font-semibold text-glam-ink truncate">
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
                className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-glam-surface transition-colors focus:outline-none"
              >
                <MagnifyingGlass size={18} className="text-glam-ink" />
              </button>
            )}

            {/* Notification Button */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-glam-surface transition-colors focus:outline-none"
            >
              <Bell size={18} className="text-glam-ink" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-glam-rose rounded-full">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Cart Button */}
            <button
              onClick={() => navigate("/cart")}
              className="relative flex items-center justify-center w-9 h-9 rounded-full hover:bg-glam-surface transition-colors focus:outline-none"
            >
              <ShoppingBag size={18} className="text-glam-ink" />
              {cartItemCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[16px] h-[16px] px-1 text-[9px] font-bold text-white bg-glam-rose rounded-full">
                  {cartItemCount > 99 ? '99+' : cartItemCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-9 h-9 rounded-full hover:bg-glam-surface transition-colors focus:outline-none">
                  <Avatar className="w-7 h-7">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "Profile"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-glam-blush-soft text-glam-ink text-xs font-medium">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                sideOffset={8}
                className="w-56 bg-white border border-glam-border shadow-lg rounded-xl p-1.5"
              >
                {user ? (
                  <>
                    {/* User Info Header - Premium Design */}
                    <DropdownMenuItem 
                      className="p-0 mb-1 focus:bg-transparent cursor-pointer" 
                      onClick={() => navigate("/profile")}
                    >
                      <div className="w-full px-3 py-2.5 rounded-lg hover:bg-glam-surface transition-colors">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9">
                            <AvatarImage src={profile?.avatar_url || undefined} />
                            <AvatarFallback className="bg-glam-blush-soft text-glam-ink font-medium text-sm">
                              {profile?.full_name?.charAt(0) || "U"}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0 text-start">
                            <p className="text-sm font-semibold text-glam-ink truncate">
                              {profile?.full_name || t.userMenu.myProfile}
                            </p>
                            <p className="text-xs text-glam-muted truncate">
                              {profile?.email || user.email}
                            </p>
                          </div>
                        </div>
                      </div>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="my-1" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer rounded-lg py-2 px-3 text-[var(--glam-error)] focus:text-[var(--glam-error)] focus:bg-[color-mix(in_srgb,var(--glam-error)_10%,transparent)]"
                    >
                      <SignOut size={16} className="text-[var(--glam-error)] me-2" />
                      <span className="text-sm">{t.userMenu.logout}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem
                    onClick={() => navigate("/auth")}
                    className="cursor-pointer rounded-lg py-2 px-3 focus:bg-glam-surface"
                  >
                    <SignIn size={16} className="text-glam-rose me-2" />
                    <span className="text-sm">{t.auth.login}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {children && (
          <div className="mt-2">
            {children}
          </div>
        )}
      </div>
    </header>
  );
};

export default AppHeader;
