import { useState } from "react";
import { House, Calendar, User, SquaresFour, Palette, Users, Storefront, Images, MagnifyingGlass, X, ShoppingBag, ClipboardText } from "@phosphor-icons/react";
import { useHapticFeedback } from "@/hooks/useHapticFeedback";
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
  icon: React.ElementType;
  labelKey: keyof typeof import("@/lib/translations/en").en.nav;
  path: string;
  badgeType?: "bookings" | "messages" | "referrals";
}

// عناصر العميل - مقسمة ليسار ويمين الزر المركزي
const customerNavItemsLeft: NavItem[] = [
  { icon: House, labelKey: "home", path: "/home" },
  { icon: Users, labelKey: "artists", path: "/makeup-artists" },
];

const customerNavItemsRight: NavItem[] = [
  { icon: Storefront, labelKey: "shops", path: "/shops" },
  { icon: Calendar, labelKey: "bookings", path: "/bookings", badgeType: "bookings" },
];

const customerNavItems: NavItem[] = [
  ...customerNavItemsLeft,
  ...customerNavItemsRight,
];

const artistNavItems: NavItem[] = [
  { icon: SquaresFour, labelKey: "dashboard", path: "/artist-dashboard" },
  { icon: Calendar, labelKey: "bookings", path: "/artist-bookings", badgeType: "bookings" },
  { icon: Images, labelKey: "gallery", path: "/artist-gallery" },
  { icon: Palette, labelKey: "services", path: "/artist-services" },
  { icon: ShoppingBag, labelKey: "products", path: "/artist-products" },
];

const sellerNavItems: NavItem[] = [
  { icon: SquaresFour, labelKey: "dashboard", path: "/seller-dashboard" },
  { icon: ShoppingBag, labelKey: "products", path: "/seller-products" },
  { icon: ClipboardText, labelKey: "orders", path: "/seller-orders" },
  { icon: User, labelKey: "profile", path: "/profile" },
];

const BottomNavigation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { role, isArtist, loading } = useUserRole();
  const { data: pendingCount = 0 } = usePendingBookingsCount();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();
  const { data: referralsCount = 0 } = useReferrals();
  const { t, isRTL } = useLanguage();
  const { tap } = useHapticFeedback();
  
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Prevent the dock from flashing the wrong menu while the role is loading / unresolved
  // Allow guest users (role === null) to see the dock
  if (loading) return null;
  
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

  const isCustomer = role !== "artist" && role !== "seller" && !isArtist && role !== "admin";
  
  const navItems =
    role === "artist" || isArtist
      ? artistNavItems
      : role === "seller"
        ? sellerNavItems
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

  const renderCustomerNavItem = (item: NavItem, index: number) => {
    const isActive = location.pathname === item.path;
    const badgeCount = getBadgeCount(item.badgeType);
    const showBadge = badgeCount > 0;

    return (
      <Link
        key={`${item.path}-${index}`}
        to={item.path}
        onClick={() => tap()}
        aria-current={isActive ? "page" : undefined}
        className={`relative flex w-[64px] flex-col items-center justify-center rounded-2xl pt-1.5 pb-2.5 transition-colors duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose ${
          isActive ? "text-glam-rose" : "text-glam-ink hover:text-glam-rose"
        }`}
      >
        <div className="relative">
          <item.icon
            size={23}
            weight="regular"
            className="transition-transform duration-300"
          />
          {showBadge && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-glam-rose rounded-full px-1">
              {badgeCount > 99 ? "99+" : badgeCount}
            </span>
          )}
        </div>
        <span className={`mt-0.5 text-[10.5px] leading-none ${isActive ? "font-semibold" : "font-medium"}`}>
          {t.nav[item.labelKey]}
        </span>
        <span
          aria-hidden="true"
          className={`absolute -bottom-[9px] start-1/2 h-[3px] w-8 -translate-x-1/2 rounded-full bg-glam-rose transition-all duration-300 ${
            isActive ? "opacity-100" : "opacity-0 scale-x-50"
          }`}
        />
      </Link>
    );
  };

  const renderNavItem = (item: NavItem, index: number) => {
    const isActive = location.pathname === item.path;
    const badgeCount = getBadgeCount(item.badgeType);
    const showBadge = badgeCount > 0;
    
    return (
      <Link
        key={`${item.path}-${index}`}
        to={item.path}
        onClick={() => tap()}
        className={`relative flex flex-col items-center justify-center gap-1 py-2 px-3 rounded-xl transition-all duration-300 ${
          isActive
            ? "text-glam-rose"
            : "text-glam-blush-deep hover:text-glam-rose"
        }`}
      >
        <div className="relative">
          <item.icon
            size={20}
            weight={isActive ? "fill" : "regular"}
            className={`transition-transform duration-300 ${
              isActive ? "scale-110" : ""
            }`}
          />
          {showBadge && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white bg-glam-rose rounded-full px-1">
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
        <nav
          aria-label={isRTL ? "التنقل الرئيسي" : "Primary navigation"}
          className="fixed inset-x-0 bottom-0 z-50 pointer-events-none"
        >
          <div aria-hidden="true" className="glam-dock-fade absolute inset-x-0 bottom-0 h-32" />
          <div className="relative mx-auto max-w-md px-4 pb-[calc(env(safe-area-inset-bottom,0px)+12px)]">
            <div className="glam-dock-glass pointer-events-auto relative flex h-[74px] items-center justify-between rounded-full px-4">
          {/* زر البحث العائم في المنتصف */}
          <button
            type="button"
            aria-label={isRTL ? "فتح البحث" : "Open search"}
            onClick={() => { tap(); setSearchOpen(true); }}
            className="absolute left-1/2 top-1/2 z-10 flex h-[64px] w-[64px] -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border-[4px] border-white bg-glam-rose text-white shadow-[0_14px_26px_-8px_var(--glam-rose-action)] transition-transform duration-300 active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-blush-deep focus-visible:ring-offset-2"
          >
            <MagnifyingGlass size={25} weight="bold" />
          </button>
          
          {/* شريط التنقل */}
              {/* العناصر اليسرى */}
              <div className="flex items-center gap-2">
                {customerNavItemsLeft.map((item, index) => renderCustomerNavItem(item, index))}
              </div>
              
              {/* مسافة للزر المركزي */}
              <div aria-hidden="true" className="w-[72px] shrink-0" />
              
              {/* العناصر اليمنى */}
              <div className="flex items-center gap-2">
                {customerNavItemsRight.map((item, index) => renderCustomerNavItem(item, index + 2))}
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
                <MagnifyingGlass size={20} className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 text-glam-muted`} />
                <Input
                  placeholder={t.home.searchPlaceholder}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className={`${isRTL ? "pr-12 pl-10" : "pl-12 pr-10"} h-14 text-lg rounded-2xl border-2 focus:border-glam-blush-deep`}
                  autoFocus
                  dir={isRTL ? "rtl" : "ltr"}
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className={`absolute ${isRTL ? "left-4" : "right-4"} top-1/2 -translate-y-1/2 p-1 hover:bg-glam-surface rounded-full`}
                  >
                    <X size={20} className="text-glam-muted" />
                  </button>
                )}
              </div>
              
              <Button
                className="w-full h-12 rounded-xl bg-glam-ink hover:bg-glam-ink-pressed text-white"
                onClick={handleSearch}
                disabled={!searchQuery.trim()}
              >
                <MagnifyingGlass size={20} className="me-2" />
                {isRTL ? "بحث" : "Search"}
              </Button>
              
              {/* اقتراحات سريعة */}
              <div className="space-y-2">
                <p className="text-sm text-glam-muted">
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
                      className="px-4 py-2 bg-glam-porcelain text-glam-rose rounded-full text-sm hover:bg-glam-blush-soft transition-colors"
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

  // عرض البائعة
  if (role === "seller") {
    return (
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-glam-border shadow-sm safe-area-bottom">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
          {sellerNavItems.map((item, index) => renderNavItem(item, index))}
        </div>
      </nav>
    );
  }

  // العرض العادي للفنان (backup)
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-glam-border shadow-sm safe-area-bottom">
      <div className="flex items-center justify-around h-16 max-w-md mx-auto px-4">
        {navItems.map((item, index) => renderNavItem(item, index))}
      </div>
    </nav>
  );
};

export default BottomNavigation;
