import { Home, Calendar, MessageCircle, User, LayoutDashboard, Palette, Image, LucideIcon, Users, Heart } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingBookingsCount } from "@/hooks/usePendingBookings";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessages";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  icon: LucideIcon;
  labelKey: keyof typeof import("@/lib/translations/en").en.nav;
  path: string;
  badgeType?: "bookings" | "messages";
}

const customerNavItems: NavItem[] = [
  { icon: Home, labelKey: "home", path: "/home" },
  { icon: Users, labelKey: "artists", path: "/makeup-artists" },
  { icon: MessageCircle, labelKey: "messages", path: "/messages", badgeType: "messages" },
  { icon: Calendar, labelKey: "bookings", path: "/bookings", badgeType: "bookings" },
];

const artistNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "dashboard", path: "/artist-dashboard" },
  { icon: Calendar, labelKey: "bookings", path: "/artist-bookings", badgeType: "bookings" },
  { icon: MessageCircle, labelKey: "messages", path: "/messages", badgeType: "messages" },
  { icon: Palette, labelKey: "services", path: "/artist-services" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const { isArtist } = useUserRole();
  const { data: pendingCount = 0 } = usePendingBookingsCount();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
  const { t } = useLanguage();
  
  const navItems = isArtist ? artistNavItems : customerNavItems;

  const getBadgeCount = (badgeType?: "bookings" | "messages") => {
    if (badgeType === "bookings") return pendingCount;
    if (badgeType === "messages") return unreadCount;
    return 0;
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg animate-slide-in-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          const badgeCount = getBadgeCount(item.badgeType);
          const showBadge = badgeCount > 0;
          
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
                    {badgeCount > 99 ? "99+" : badgeCount}
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
