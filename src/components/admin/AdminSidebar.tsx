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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

const navItems = [
  { to: "/admin", icon: LayoutDashboard, label: "لوحة التحكم" },
  { to: "/admin/users", icon: Users, label: "المستخدمين" },
  { to: "/admin/artists", icon: Palette, label: "الفنانين" },
  { to: "/admin/bookings", icon: Calendar, label: "الحجوزات" },
  { to: "/admin/promo-codes", icon: Tag, label: "أكواد الخصم" },
  { to: "/admin/finance", icon: DollarSign, label: "المالية" },
  { to: "/admin/settings", icon: Settings, label: "الإعدادات" },
];

export const AdminSidebar = () => {
  const navigate = useNavigate();
  const { signOut } = useAuth();

  const handleSignOut = async () => {
    await signOut();
    navigate("/auth");
  };

  return (
    <aside className="fixed right-0 top-0 h-full w-64 bg-card border-l border-border flex flex-col z-50">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold text-foreground">لوحة الإدارة</h1>
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
