import { useEffect, useState } from "react";
import { LayoutDashboard, Calendar, Images, Palette, ShoppingBag, LucideIcon } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import { usePendingBookingsCount } from "@/hooks/usePendingBookings";
import { useLanguage } from "@/contexts/LanguageContext";

interface NavItem {
  icon: LucideIcon;
  labelKey: keyof typeof import("@/lib/translations/en").en.nav;
  path: string;
  badgeType?: "bookings";
}

const artistNavItems: NavItem[] = [
  { icon: LayoutDashboard, labelKey: "dashboard", path: "/artist-dashboard" },
  { icon: Calendar, labelKey: "bookings", path: "/artist-bookings", badgeType: "bookings" },
  { icon: Images, labelKey: "gallery", path: "/artist-gallery" },
  { icon: Palette, labelKey: "services", path: "/artist-services" },
  { icon: ShoppingBag, labelKey: "products", path: "/artist-products" },
];

export const ArtistGlassDock = () => {
  const location = useLocation();
  const { t } = useLanguage();
  const { data: pendingCount = 0 } = usePendingBookingsCount();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const getBadgeCount = (badgeType?: "bookings") => {
    if (badgeType === "bookings") return pendingCount;
    return 0;
  };

  return (
    <>
      <style>{`
        @keyframes dock-float-in {
          0% {
            opacity: 0;
            transform: translateY(100px) scale(0.9);
          }
          100% {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }

        @keyframes glow-pulse {
          0%, 100% {
            filter: drop-shadow(0 0 12px rgba(34, 211, 238, 0.8));
          }
          50% {
            filter: drop-shadow(0 0 20px rgba(34, 211, 238, 1));
          }
        }

        @keyframes ink-spread {
          0% {
            opacity: 0;
            transform: scale(0.8);
          }
          50% {
            opacity: 0.3;
          }
          100% {
            opacity: 0;
            transform: scale(1.5);
          }
        }

        .dock-float-in {
          animation: dock-float-in 0.6s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }

        .dock-glow {
          animation: glow-pulse 2s ease-in-out infinite;
        }

        .dock-item-active::before {
          content: '';
          position: absolute;
          inset: -8px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(34, 211, 238, 0.2) 0%, transparent 70%);
          animation: ink-spread 1.5s ease-out infinite;
          z-index: -1;
        }

        .dock-glass {
          background: rgba(30, 20, 50, 0.7);
          backdrop-filter: blur(20px) saturate(180%);
          -webkit-backdrop-filter: blur(20px) saturate(180%);
          border: 1px solid rgba(139, 92, 246, 0.3);
          box-shadow:
            0 8px 32px rgba(139, 92, 246, 0.3),
            0 2px 8px rgba(0, 0, 0, 0.2),
            inset 0 1px 0 rgba(255, 255, 255, 0.1),
            0 0 0 1px rgba(0, 0, 0, 0.05);
        }

        .dock-glass::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          background: linear-gradient(
            180deg,
            rgba(255, 255, 255, 0.15) 0%,
            transparent 50%
          );
          pointer-events: none;
        }

        .dock-safe-bottom {
          padding-bottom: max(env(safe-area-inset-bottom), 16px);
        }
      `}</style>

      <nav
        className={`
          fixed left-1/2 -translate-x-1/2 bottom-4 z-50
          dock-float-in dock-glass dock-safe-bottom
          rounded-[36px]
          ${mounted ? 'opacity-100' : 'opacity-0'}
        `}
        style={{
          width: 'min(calc(100% - 32px), 500px)',
          height: '72px',
        }}
      >
        <div className="relative w-full h-full flex items-center justify-around px-2">
          {artistNavItems.map((item, index) => {
            const isActive = location.pathname === item.path;
            const badgeCount = getBadgeCount(item.badgeType);
            const showBadge = badgeCount > 0;

            return (
              <Link
                key={`${item.path}-${index}`}
                to={item.path}
                className={`
                  relative flex flex-col items-center justify-center
                  py-2 px-4 rounded-2xl
                  transition-all duration-500 ease-out
                  group
                  ${isActive ? 'dock-item-active' : ''}
                `}
                style={{
                  minWidth: '60px',
                }}
              >
                {/* Icon container */}
                <div className="relative flex items-center justify-center">
                  {/* Glow effect for active item */}
                  {isActive && (
                    <div className="absolute inset-0 rounded-full bg-cyan-400/20 blur-xl" />
                  )}

                  <item.icon
                    className={`
                      relative z-10 transition-all duration-500 ease-out
                      ${isActive
                        ? 'text-cyan-400 dock-glow scale-110'
                        : 'text-violet-400/60 group-hover:text-violet-400 group-hover:scale-105'
                      }
                    `}
                    style={{
                      width: '24px',
                      height: '24px',
                      strokeWidth: isActive ? '2.5' : '2',
                    }}
                  />

                  {/* Badge */}
                  {showBadge && (
                    <span className="absolute -top-2 -right-2 min-w-[20px] h-[20px] flex items-center justify-center text-[10px] font-bold text-white bg-gradient-to-br from-cyan-400 to-cyan-500 rounded-full px-1 shadow-lg shadow-cyan-500/50 z-20 animate-pulse">
                      {badgeCount > 99 ? '99+' : badgeCount}
                    </span>
                  )}
                </div>

                {/* Label */}
                <span
                  className={`
                    text-[11px] font-medium mt-1 transition-all duration-300
                    ${isActive
                      ? 'text-cyan-400 opacity-100'
                      : 'text-violet-400/50 group-hover:text-violet-400 opacity-70'
                    }
                  `}
                  style={{
                    fontFamily: '"Space Grotesk", "Inter", system-ui, sans-serif',
                    letterSpacing: '-0.01em',
                  }}
                >
                  {t.nav[item.labelKey]}
                </span>

                {/* Active indicator line */}
                {isActive && (
                  <div
                    className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-8 h-0.5 rounded-full bg-gradient-to-r from-transparent via-cyan-400 to-transparent"
                    style={{
                      boxShadow: '0 0 8px rgba(34, 211, 238, 0.8)',
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Spacer for safe area */}
      <div className="h-24" />
    </>
  );
};

export default ArtistGlassDock;
