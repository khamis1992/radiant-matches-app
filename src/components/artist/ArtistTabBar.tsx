import { useState, useEffect } from "react";
import { LayoutDashboard, Calendar, Images, ShoppingBag, Plus, CalendarPlus, Palette, Camera, X } from "lucide-react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { usePendingBookingsCount } from "@/hooks/usePendingBookings";
import { useLanguage } from "@/contexts/LanguageContext";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

interface NavItem {
  icon: typeof LayoutDashboard;
  labelKey: keyof typeof import("@/lib/translations/en").en.nav;
  path: string;
  hasBadge: boolean;
}

const navItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "dashboard", path: "/artist-dashboard", hasBadge: false },
  { icon: Calendar, labelKey: "bookings", path: "/artist-bookings", hasBadge: true },
  { icon: Images, labelKey: "gallery", path: "/artist-gallery", hasBadge: false },
  { icon: ShoppingBag, labelKey: "products", path: "/artist-products", hasBadge: false },
];

interface QuickAction {
  icon: typeof CalendarPlus;
  label: string;
  labelAr: string;
  path: string;
}

const quickActions: QuickAction[] = [
  { icon: CalendarPlus, label: "My Booking", labelAr: "حجوزاتي", path: "/artist-bookings?new=true" },
  { icon: Palette, label: "Add Service", labelAr: "إضافة خدمة", path: "/artist-services?new=true" },
  { icon: Camera, label: "Upload Photo", labelAr: "رفع صورة", path: "/artist-gallery?upload=true" },
  { icon: ShoppingBag, label: "Add Product", labelAr: "إضافة منتج", path: "/artist-products?new=true" },
];

export const ArtistTabBar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  const { data: pendingCount = 0 } = usePendingBookingsCount();
  const [mounted, setMounted] = useState(false);
  const [quickActionsOpen, setQuickActionsOpen] = useState(false);
  const [badgePulse, setBadgePulse] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (pendingCount > 0) {
      setBadgePulse(true);
      const timer = setTimeout(() => setBadgePulse(false), 600);
      return () => clearTimeout(timer);
    }
  }, [pendingCount]);

  const handleQuickAction = (path: string) => {
    setQuickActionsOpen(false);
    navigate(path);
  };

  return (
    <>
      <style>{`
        @keyframes tab-slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes badge-pulse {
          0% { transform: scale(1); }
          50% { transform: scale(1.05); }
          100% { transform: scale(1); }
        }

        @keyframes sheet-slide-up {
          from {
            transform: translateY(100%);
          }
          to {
            transform: translateY(0);
          }
        }

        .tab-slide-up {
          animation: tab-slide-up 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .badge-pulse {
          animation: badge-pulse 0.6s ease-out;
        }

        .sheet-slide-up {
          animation: sheet-slide-up 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .safe-area-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 16px);
        }

        .nav-item-label {
          transition: opacity 0.2s ease;
        }
      `}</style>

      {/* Tab Bar */}
      <nav
        className={`
          fixed left-0 right-0 bottom-0 z-50
          bg-card border-t border-border shadow-lg
          tab-slide-up
          ${mounted ? 'opacity-100' : 'opacity-0'}
          safe-area-bottom
        `}
        style={{ position: 'fixed', height: '56px' }}
      >
        <div className="relative h-full max-w-md mx-auto">
          {/* Navigation Items Container */}
          <div
            className="absolute inset-0 flex items-center justify-between px-6"
            style={{
              paddingLeft: 'calc(24px + env(safe-area-inset-left, 0px))',
              paddingRight: 'calc(24px + env(safe-area-inset-right, 0px))',
            }}
          >
            {/* Left Side Items */}
            <div className="flex items-center gap-3">
              {navItems.slice(0, 2).map((item, index) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={`${item.path}-${index}`}
                    to={item.path}
                    className="relative flex flex-col items-center justify-center"
                    style={{ minWidth: '52px', height: '56px' }}
                  >
                    {/* Icon */}
                    <item.icon
                      className={cn("transition-all duration-200", isActive && "scale-110")}
                      style={{
                        width: '24px',
                        height: '24px',
                        strokeWidth: '2px',
                        color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      }}
                    />

                    {/* Badge */}
                    {item.hasBadge && pendingCount > 0 && (
                      <span
                        className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-white rounded-full px-1"
                        style={{
                          backgroundColor: 'hsl(var(--primary))',
                          boxShadow: '0 2px 4px rgba(244, 114, 182, 0.3)',
                        }}
                      >
                        {pendingCount > 99 ? '99+' : pendingCount}
                      </span>
                    )}

                    {/* Label - Always shows */}
                    <span
                      className={cn(
                        "nav-item-label text-[10px] font-medium mt-1 transition-colors duration-200",
                        isActive ? "font-semibold" : "font-normal"
                      )}
                      style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                    >
                      {t.nav[item.labelKey]}
                    </span>
                  </Link>
                );
              })}
            </div>

            {/* Spacer for center button */}
            <div style={{ width: '56px' }} />

            {/* Right Side Items */}
            <div className="flex items-center gap-3">
              {navItems.slice(2, 4).map((item, index) => {
                const isActive = location.pathname === item.path;

                return (
                  <Link
                    key={`${item.path}-${index}`}
                    to={item.path}
                    className="relative flex flex-col items-center justify-center"
                    style={{ minWidth: '52px', height: '56px' }}
                  >
                    {/* Icon */}
                    <item.icon
                      className={cn("transition-all duration-200", isActive && "scale-110")}
                      style={{
                        width: '24px',
                        height: '24px',
                        strokeWidth: '2px',
                        color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))',
                      }}
                    />

                    {/* Label - Always shows */}
                    <span
                      className={cn(
                        "nav-item-label text-[10px] font-medium mt-1 transition-colors duration-200",
                        isActive ? "font-semibold" : "font-normal"
                      )}
                      style={{ color: isActive ? 'hsl(var(--primary))' : 'hsl(var(--muted-foreground))' }}
                    >
                      {t.nav[item.labelKey]}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Floating Center Button */}
          <button
            onClick={() => setQuickActionsOpen(true)}
            className="absolute left-1/2 -translate-x-1/2 -top-7 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-lg transition-transform duration-150 active:scale-95 hover:scale-105"
            style={{
              background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--primary)) 100%)',
              boxShadow: '0 4px 12px hsl(var(--primary) / 0.4)',
            }}
            aria-label="Quick actions"
          >
            <Plus style={{ width: '26px', height: '26px' }} />
          </button>
        </div>
      </nav>

      {/* Quick Actions Sheet */}
      <Sheet open={quickActionsOpen} onOpenChange={setQuickActionsOpen}>
        <SheetContent
          side="bottom"
          className="rounded-t-3xl pt-3 pb-8 px-4"
          style={{
            minHeight: '200px',
            maxHeight: '400px',
          }}
          dir={isRTL ? "rtl" : "ltr"}
        >
          {/* Drag Handle */}
          <div className="flex justify-center mb-6">
            <div
              className="rounded-full"
              style={{
                width: '36px',
                height: '4px',
                backgroundColor: '#E5E5E5',
              }}
            />
          </div>

          {/* Close Button */}
          <button
            onClick={() => setQuickActionsOpen(false)}
            className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 transition-colors"
            style={{ color: '#999999' }}
          >
            <X style={{ width: '20px', height: '20px' }} />
          </button>

          {/* Title */}
          <h2 className="text-lg font-semibold text-center mb-6" style={{ color: '#000000' }}>
            {isRTL ? 'إجراءات سريعة' : 'Quick Actions'}
          </h2>

          {/* Action Grid */}
          <div className="grid grid-cols-2 gap-3">
            {quickActions.map((action, index) => (
              <button
                key={index}
                onClick={() => handleQuickAction(action.path)}
                className="flex flex-col items-center justify-center p-4 rounded-xl transition-all duration-150 active:scale-95"
                style={{
                  backgroundColor: 'hsl(var(--primary) / 0.1)',
                  minHeight: '120px',
                  border: '1px solid hsl(var(--primary) / 0.2)',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.15)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'hsl(var(--primary) / 0.1)';
                }}
              >
                <action.icon style={{ width: '32px', height: '32px', color: 'hsl(var(--primary))', marginBottom: '8px' }} />
                <span className="text-sm font-semibold" style={{ color: 'hsl(var(--foreground))' }}>
                  {isRTL ? action.labelAr : action.label}
                </span>
              </button>
            ))}
          </div>
        </SheetContent>
      </Sheet>

      {/* Spacer for safe area */}
      <div style={{ height: '72px' }} />
    </>
  );
};

export default ArtistTabBar;
