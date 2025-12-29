import { NavLink, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Users,
  Palette,
  Calendar,
  DollarSign,
  Tag,
  Settings,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Bell,
  X,
  Check,
  Star,
  Scissors,
  Image,
  Wallet,
  Globe,
} from "lucide-react";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { t, isRTL, language } = useLanguage();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useAdminNotifications();

  const dateLocale = language === "ar" ? ar : enUS;

  const navItems = [
    { to: "/admin", icon: LayoutDashboard, label: t.adminNav.dashboard },
    { to: "/admin/users", icon: Users, label: t.adminNav.users },
    { to: "/admin/artists", icon: Palette, label: t.adminNav.artists },
    { to: "/admin/bookings", icon: Calendar, label: t.adminNav.bookings },
    { to: "/admin/services", icon: Scissors, label: t.adminNav.services },
    { to: "/admin/reviews", icon: Star, label: t.adminNav.reviews },
    { to: "/admin/promo-codes", icon: Tag, label: t.adminNav.promoCodes },
    { to: "/admin/banners", icon: Image, label: t.adminNav.banners },
    { to: "/admin/finance", icon: DollarSign, label: t.adminNav.finance },
    { to: "/admin/withdrawals", icon: Wallet, label: t.adminNav.withdrawals },
    { to: "/admin/notifications", icon: Bell, label: t.adminNav.notificationLog },
    { to: "/admin/settings", icon: Settings, label: t.adminNav.settings },
  ];

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "new_booking":
        return "🆕";
      case "cancelled_booking":
        return "❌";
      case "pending_booking":
        return "⏳";
      default:
        return "📌";
    }
  };

  const BackIcon = isRTL ? ChevronLeft : ChevronRight;

  return (
    <aside className={cn(
      "fixed top-0 h-full w-64 bg-card border-border flex flex-col z-50",
      isRTL ? "right-0 border-l" : "left-0 border-r"
    )}>
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">{t.adminNav.adminPanel}</h1>
          <div className="flex items-center gap-1">
            {/* Language Switcher */}
            <LanguageSwitcher />
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className={cn(
                      "absolute -top-1 h-5 w-5 p-0 flex items-center justify-center text-xs",
                      isRTL ? "-left-1" : "-right-1"
                    )}>
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start" dir={isRTL ? "rtl" : "ltr"}>
                <div className="flex items-center justify-between p-3 border-b">
                  <h4 className="font-semibold">{t.adminNav.notifications}</h4>
                  <div className="flex gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-7 text-xs"
                      >
                        <Check className={cn("h-3 w-3", isRTL ? "ml-1" : "mr-1")} />
                        {t.adminNav.markAllRead}
                      </Button>
                    )}
                    {notifications.length > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearNotifications}
                        className="h-7 text-xs text-muted-foreground"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </div>
                <ScrollArea className="h-80">
                  {notifications.length === 0 ? (
                    <div className="p-6 text-center text-muted-foreground text-sm">
                      {t.adminNav.noNotifications}
                    </div>
                  ) : (
                    <div className="divide-y">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn(
                            "p-3 cursor-pointer hover:bg-muted/50 transition-colors",
                            !notification.isRead && "bg-primary/5"
                          )}
                          onClick={() => {
                            markAsRead(notification.id);
                            navigate("/admin/bookings");
                          }}
                        >
                          <div className="flex gap-2">
                            <span className="text-lg">
                              {getNotificationIcon(notification.type)}
                            </span>
                            <div className="flex-1 min-w-0">
                              <p className={cn(
                                "text-sm",
                                !notification.isRead && "font-medium"
                              )}>
                                {notification.message}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {formatDistanceToNow(notification.createdAt, {
                                  addSuffix: true,
                                  locale: dateLocale,
                                })}
                              </p>
                            </div>
                            {!notification.isRead && (
                              <div className="h-2 w-2 rounded-full bg-primary mt-1.5" />
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </PopoverContent>
            </Popover>

            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/home")}
              className="h-8 w-8"
            >
              <BackIcon className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <ScrollArea className="flex-1">
        <nav className="p-4 space-y-2">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/admin"}
              className={({ isActive }) =>
                cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )
              }
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </ScrollArea>

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span>{t.adminNav.signOut}</span>
        </Button>
      </div>
    </aside>
  );
};

export default AdminSidebar;