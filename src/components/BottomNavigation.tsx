import { useState } from "react";
import { Home, Calendar, User, LayoutDashboard, Palette, LucideIcon, Users, Heart, Images, Search, X, Gift, ShoppingBag } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useUserRole } from "@/hooks/useUserRole";
import { usePendingBookingsCount } from "@/hooks/usePendingBookings";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessages";
import { useReferrals } from "@/hooks/useReferrals";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArtistTabBar } from "@/components/artist/ArtistTabBar";

interface NavItem {
  icon: LucideIcon;
  labelKey: keyof typeof import("@/lib/translations/en").en.nav;
  path: string;
  badgeType?: "bookings" | "messages" | "referrals";
}

// عناصر العميل - مقسمة ليسار ويمين الزر المركزي
const customerNavItemsLeft: NavItem[] = [
  { icon: Home, labelKey: "home", path: "/home" },
  { icon: Users, labelKey: "artists", path: "/makeup-artists" },
];

const customerNavItemsRight: NavItem[] = [
  { icon: Heart, labelKey: "favorites", path: "/favorites" },
  { icon: Calendar, labelKey: "bookings", path: "/bookings", badgeType: "bookings" },
];

const customerNavItems: NavItem[] = [
  ...customerNavItemsLeft,
  ...customerNavItemsRight,
];

const artistNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "dashboard", path: "/artist-dashboard" },
  { icon: Calendar, labelKey: "bookings", path: "/artist-bookings", badgeType: "bookings" },
  { icon: Images, labelKey: "gallery", path: "/artist-gallery" },
  { icon: Palette, labelKey: "services", path: "/artist-services" },
  { icon: ShoppingBag, labelKey: "products", path: "/artist-products" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isArtist, loading } = useUserRole();
  const { data: pendingCount = 0 } = usePendingBookingsCount();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
  const { data: referralsCount = 0 } = useReferrals();
  const { t, isRTL } = useLanguage();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Prevent the dock from flashing the wrong menu while the role is loading / unresolved
  if (loading || role === null) return null;
  
  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/makeup-artists?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchOpen(false);
      setSearchQuery("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      handleSearch();
    }
  };

  const isCustomer = role !== "artist" && !isArtist && role !== "admin";
  
  const navItems =
    role === "artist" || isArtist
      ? artistNavItems
      : role === "admin"
        ? []
        : customerNavItems;

  if (navItems.length === 0) return null;

  const getBadgeCount = (badgeType?: "bookings" | "messages" | "referrals") => {
    if (badgeType === "bookings") return pendingCount;
    if (badgeType === "messages") return unreadCount;
    if (badgeType === "referrals") return referralsCount;
    return 0;
  };

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = location.pathname === item.path;
    const badgeCount = getBadgeCount(item.badgeType);
    const showBadge = badgeCount > 0;
    
    return (
      <Link
        key={`${item.path}-${index}`}
        to={item.path}
        className={`relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${
          isActive
            ? "text-primary"
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
        <span className="text-[10px] font-medium">{t.nav[item.labelKey]}</span>
      </Link>
    );
  };

  // عرض خاص للعميل مع زر البحث في المنتصف
  if (isCustomer) {
    return (
      <>
        <nav className="fixed bottom-0 left-0 right-0 z-50 animate-slide-in-bottom safe-area-bottom">
          {/* زر البحث العائم في المنتصف */}
          <button
            onClick={() => setSearchOpen(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 bg-gradient-to-br from-primary to-primary/80 rounded-full shadow-lg shadow-primary/30 flex items-center justify-center text-white hover:scale-105 active:scale-95 transition-all border-4 border-background z-10"
          >
            <Search className="w-6 h-6" />
          </button>
          
          {/* شريط التنقل */}
          <div className="bg-card border-t border-border shadow-lg">
            <div className="flex items-center justify-between h-16 max-w-md mx-auto px-2">
              {/* العناصر اليسرى */}
              <div className="flex items-center gap-1">
                {customerNavItemsLeft.map((item, index) => renderNavItem(item, index))}
              </div>
              
              {/* مسافة للزر المركزي */}
              <div className="w-16" />
              
              {/* العناصر اليمنى */}
              <div className="flex items-center gap-1">
                {customerNavItemsRight.map((item, index) => renderNavItem(item, index + 2))}
              </div>
            </div>
          </div>
        </nav>

        {/* نافذة البحث */}
        <Sheet open={searchOpen} onOpenChange={setSearchOpen}>
          <SheetContent side="bottom" className="rounded-t-3xl pb-8" dir={isRTL ? "rtl" : "ltr"}>
            <SheetHeader className="pb-4">
              <SheetTitle className="text-center">
                {isRTL ? "البحث عن فنانات" : "Search Artists"}
              </SheetTitle>
            </SheetHeader>
            <div className="space-y-4">
              <div className="relative">
                <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground`} />
                <Input
                  placeholder={t.home.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${isRTL ? "pr-12 pl-10" : "pl-12 pr-10"} h-14 text-lg rounded-2xl border-2 focus:border-primary`}
                  autoFocus
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 p-1 hover:bg-muted rounded-full`}
                  >
                    <X className="w-5 h-5 text-muted-foreground" />
                  </button>
                )}
              </div>
              
              <Button 
                className="w-full h-12 rounded-xl"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                <Search className="w-5 h-5 me-2" />
                {isRTL ? "بحث" : "Search"}
              </Button>
              
              {/* اقتراحات سريعة */}
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  {isRTL ? "بحث سريع:" : "Quick search:"}
                </p>
                <div className="flex flex-wrap gap-2">
                  {["Bridal", "Makeup", "Henna", "Hair"].map((term) => (
                    <button
                      key={term}
                      onClick={() => {
                        navigate(`/makeup-artists?search=${term}`);
                        setSearchOpen(false);
                      }}
                      className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm hover:bg-primary/20 transition-colors"
                    >
                      {term}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </>
    );
  }

  // العرض الجديد للفنان - Instagram-style Tab Bar
  if (role === "artist" || isArtist) {
    return <ArtistTabBar />;
  }

  // العرض العادي للفنان (backup)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg animate-slide-in-bottom safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => renderNavItem(item, index))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
