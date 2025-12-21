import { Home, Calendar, MessageCircle, User, LayoutDashboard, Palette, Image, LucideIcon, Users, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingBookingsCount } from "@/hooks/usePendingBookings";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  icon: LucideIcon;
  labelKey: keyof typeof import("@/lib/translations/en").en.nav;
  path: string;
  showBadge?: boolean;
}

const customerNavItems: NavItem[] = [
  { icon: Home, labelKey: "home", path: "/home" },
  { icon: Users, labelKey: "artists", path: "/makeup-artists" },
  { icon: Heart, labelKey: "favorites", path: "/favorites" },
  { icon: Calendar, labelKey: "bookings", path: "/bookings", showBadge: true },
];

const artistNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "dashboard", path: "/artist-dashboard" },
  { icon: Calendar, labelKey: "bookings", path: "/artist-bookings", showBadge: true },
  { icon: Image, labelKey: "gallery", path: "/artist-gallery" },
  { icon: Palette, labelKey: "services", path: "/artist-services" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const { isArtist } = useUserRole();
  const { data: pendingCount = 0 } = usePendingBookingsCount();
  const { t } = useLanguage();
  
  const navItems = isArtist ? artistNavItems : customerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg animate-slide-in-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const showBadge = item.showBadge && pendingCount > 0;
          
          return (
            <Link
              key={`${item.path}-${index}`}
              to={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <div className="relative">
                <item.icon
                  className={`w-5 h-5 transition-transform duration-300 ${
                    isActive ? "scale-110" : ""
                  }`}
                />
                {showBadge && (
                  <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary rounded-full px-1">
                    {pendingCount > 99 ? "99+" : pendingCount}
                  </span>
                )}
              </div>
              <span className="text-xs font-medium">{t.nav[item.labelKey]}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
