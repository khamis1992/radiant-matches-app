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
  LogOut,
  Bell,
  X,
  Check,
  Star,
  Scissors,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAuth } from "@/hooks/useAuth";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/admin/users", icon: Users, label: "المستخدمين" },
  { to: "/admin/artists", icon: Palette, label: "الفنانين" },
  { to: "/admin/bookings", icon: Calendar, label: "الحجوزات" },
  { to: "/admin/services", icon: Scissors, label: "الخدمات" },
  { to: "/admin/reviews", icon: Star, label: "المراجعات" },
  { to: "/admin/promo-codes", icon: Tag, label: "أكواد الخصم" },
  { to: "/admin/finance", icon: DollarSign, label: "المالية" },
  { to: "/admin/notifications", icon: Bell, label: "سجل الإشعارات" },
  { to: "/admin/settings", icon: Settings, label: "الإعدادات" },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { notifications, unreadCount, markAsRead, markAllAsRead, clearNotifications } = useAdminNotifications();

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

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-card border-l border-border flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">لوحة الإدارة</h1>
          <div className="flex items-center gap-1">
            {/* Notifications */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 relative">
                  <Bell className="h-4 w-4" />
                  {unreadCount > 0 && (
                    <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs">
                      {unreadCount > 9 ? "9+" : unreadCount}
                    </Badge>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-80 p-0" align="start" dir="rtl">
                <div className="flex items-center justify-between p-3 border-b">
                  <h4 className="font-semibold">الإشعارات</h4>
                  <div className="flex gap-1">
                    {unreadCount > 0 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={markAllAsRead}
                        className="h-7 text-xs"
                      >
                        <Check className="h-3 w-3 ml-1" />
                        قراءة الكل
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
                      لا توجد إشعارات
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
                                  locale: ar,
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
              <ChevronLeft className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
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

      {/* Footer */}
      <div className="p-4 border-t border-border">
        <Button
          variant="ghost"
          className="w-full justify-start gap-3 text-destructive hover:text-destructive hover:bg-destructive/10"
          onClick={handleSignOut}
        >
          <LogOut className="h-5 w-5" />
          <span>تسجيل الخروج</span>
        </Button>
      </div>
    </aside>
  );
};
