import { Home, Calendar, MessageCircle, User, LayoutDashboard, Palette, LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";

interface NavItem {
  icon: LucideIcon;
  label: string;
  path: string;
}

const customerNavItems: NavItem[] = [
  { icon: Home, label: "Home", path: "/home" },
  { icon: Calendar, label: "Bookings", path: "/bookings" },
  { icon: MessageCircle, label: "Messages", path: "/messages" },
  { icon: User, label: "Profile", path: "/profile" },
];

const artistNavItems: NavItem[] = [
  { icon: LayoutDashboard, label: "Dashboard", path: "/artist-dashboard" },
  { icon: Calendar, label: "Bookings", path: "/artist-bookings" },
  { icon: Palette, label: "Services", path: "/artist-services" },
  { icon: User, label: "Profile", path: "/artist-profile" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const { isArtist } = useUserRole();
  
  const navItems = isArtist ? artistNavItems : customerNavItems;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg animate-slide-in-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => {
          const isActive = location.pathname === item.path;
          
          return (
            <Link
              key={`${item.path}-${index}`}
              to={item.path}
              className={`flex flex-col items-center justify-center gap-1 py-2 px-4 rounded-xl transition-all duration-300 ${
                isActive
                  ? "text-primary bg-primary/10"
                  : "text-muted-foreground hover:text-primary"
              }`}
            >
              <item.icon
                className={`w-5 h-5 transition-transform duration-300 ${
                  isActive ? "scale-110" : ""
                }`}
              />
              <span className="text-xs font-medium">{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNavigation;
