import React, { useEffect, useState, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut, LogIn, ChevronLeft, Search, Sparkles } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUnreadNotificationsCount } from "@/hooks/useArtistNotifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

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
  const { t, isRTL } = useLanguage();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const [isScrolled, setIsScrolled] = useState(false);
  const [headerHeight, setHeaderHeight] = useState(56);
  const headerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const shouldCompress = scrollY > 50;

      setIsScrolled(shouldCompress);
      setHeaderHeight(shouldCompress ? 48 : 56);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
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

  const getHeaderClasses = useCallback(() => {
    const baseClasses = "fixed top-0 left-0 right-0 z-50 safe-area-top transition-all duration-500";

    const styleClasses = {
      modern: cn(
        "bg-white/80 backdrop-blur-xl border-b border-primary/10",
        isScrolled && "bg-white/95 shadow-lg shadow-primary/5"
      ),
      minimal: cn(
        "bg-background/90 backdrop-blur-md border-b border-border/30"
      ),
      transparent: cn(
        isScrolled
          ? "bg-background/95 backdrop-blur-xl border-b border-border/30 shadow-lg"
          : "bg-transparent border-transparent"
      ),
      gradient: cn(
        "bg-gradient-to-r from-rose-50/90 via-white/90 to-nude-50/90 backdrop-blur-xl border-b border-primary/15"
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
      style={{ height: `${headerHeight}px` }}
    >
      {/* Animated glow effect under header */}
      <div
        className={cn(
          "absolute bottom-0 left-1/2 -translate-x-1/2 w-3/4 h-1 bg-gradient-to-r from-transparent via-primary/30 to-transparent blur-sm transition-opacity duration-500",
          isScrolled ? "opacity-50" : "opacity-100"
        )}
      />

      <div className="h-full px-4 flex items-center justify-between gap-3">
        {/* Left side - Logo & Back */}
        <div className="flex items-center gap-2 min-w-0">
          {showBack && (
            <button
              onClick={() => navigate(-1)}
              className="flex items-center justify-center w-9 h-9 rounded-xl bg-muted/50 hover:bg-muted active:scale-95 transition-all duration-200"
            >
              <ChevronLeft className={cn("w-5 h-5 transition-transform duration-300", isRTL ? "rotate-180" : "")} />
            </button>
          )}

          {showLogo && (
            <div
              className="relative group cursor-pointer"
              onClick={() => navigate("/home")}
            >
              {/* Logo glow effect */}
              <div className="absolute inset-0 bg-gradient-to-tr from-primary/20 to-gold/10 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

              <img
                src={logo}
                alt="Glam"
                className={cn(
                  "relative h-8 w-auto object-contain transition-all duration-300",
                  isScrolled ? "h-7" : "h-8",
                  "group-hover:scale-105"
                )}
              />
            </div>
          )}

          {title && (
            <h1 className={cn(
              "font-semibold text-foreground truncate transition-all duration-300",
              isScrolled ? "text-sm" : "text-base"
            )}>
              {title}
            </h1>
          )}
        </div>

        {/* Right side - Actions with asymmetric spacing */}
        <div className="flex items-center gap-2">
          {/* Language - minimal */}
          <div className="relative">
            <LanguageSwitcher />
          </div>

          {/* Notifications with orbital ring indicator */}
          <button
            onClick={() => navigate("/notifications")}
            className={cn(
              "relative flex items-center justify-center rounded-xl transition-all duration-200",
              isScrolled ? "w-9 h-9" : "w-10 h-10"
            )}
          >
            {unreadCount > 0 && (
              <>
                {/* Orbital ring animation */}
                <div className="absolute inset-0 rounded-full border-2 border-primary/30 animate-ping" style={{ animationDuration: '2s' }} />
                {/* Badge */}
                <span className={cn(
                  "absolute -top-1 -right-1 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-white bg-gradient-to-r from-primary to-primary/80 rounded-full shadow-lg shadow-primary/30",
                  !isScrolled && "min-w-[20px] h-[20px] text-[11px]"
                )}>
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              </>
            )}
            <Bell className={cn(
              "transition-all duration-200",
              isScrolled ? "w-4 h-4" : "w-5 h-5"
            )} />
          </button>

          {/* Profile Dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                className={cn(
                  "relative flex items-center justify-center rounded-xl overflow-hidden transition-all duration-200",
                  isScrolled ? "w-9 h-9" : "w-10 h-10"
                )}
              >
                {/* Subtle gradient ring */}
                <div className="absolute inset-0 rounded-xl bg-gradient-to-tr from-primary/10 via-transparent to-gold/10" />

                <Avatar className={cn(
                  "relative ring-2 ring-background transition-all duration-200",
                  isScrolled ? "w-6 h-6" : "w-7 h-7"
                )}>
                  <AvatarImage
                    src={profile?.avatar_url || undefined}
                    alt={profile?.full_name || "Profile"}
                    className="object-cover"
                  />
                  <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/20 text-primary text-xs font-bold">
                    {profile?.full_name?.charAt(0) || "U"}
                  </AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-52 bg-card/95 backdrop-blur-xl border border-border/50 shadow-2xl rounded-2xl overflow-hidden"
            >
              {user ? (
                <>
                  {/* User info - compact */}
                  <div className="p-3 bg-gradient-to-br from-muted/60 to-muted/30">
                    <div className="flex items-center gap-2.5">
                      <Avatar className="w-9 h-9 ring-2 ring-primary/20">
                        <AvatarImage src={profile?.avatar_url || undefined} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-primary/20 text-primary text-xs font-bold">
                          {profile?.full_name?.charAt(0) || "U"}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground truncate">
                          {profile?.full_name || t.userMenu.myProfile}
                        </p>
                        <p className="text-[11px] text-muted-foreground truncate">
                          {profile?.email || user.email}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="p-1.5 space-y-0.5">
                    <DropdownMenuItem
                      onClick={() => navigate("/profile")}
                      className="rounded-xl py-2.5 px-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                          <User className="h-4 w-4 text-primary" />
                        </div>
                        <span className="text-sm font-medium">{t.userMenu.myProfile}</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={() => navigate("/settings")}
                      className="rounded-xl py-2.5 px-3 cursor-pointer"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center">
                          <Settings className="h-4 w-4 text-muted-foreground" />
                        </div>
                        <span className="text-sm font-medium">{t.userMenu.settings}</span>
                      </div>
                    </DropdownMenuItem>

                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="rounded-xl py-2.5 px-3 cursor-pointer text-destructive"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                          <LogOut className="h-4 w-4 text-destructive" />
                        </div>
                        <span className="text-sm font-medium">{t.userMenu.logout}</span>
                      </div>
                    </DropdownMenuItem>
                  </div>
                </>
              ) : (
                <div className="p-1.5">
                  <DropdownMenuItem
                    onClick={() => navigate("/auth")}
                    className="rounded-xl py-2.5 px-3 cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <LogIn className="h-4 w-4 text-primary" />
                      </div>
                      <span className="text-sm font-medium">{t.auth.login}</span>
                    </div>
                  </DropdownMenuItem>
                </div>
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
    </header>
  );
};

export default AppHeader;
