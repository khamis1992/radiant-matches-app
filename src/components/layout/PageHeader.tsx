import { useNavigate } from "react-router-dom";
import { Bell, User, Settings, LogOut, LogIn, ChevronLeft } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useLanguage } from "@/contexts/LanguageContext";
import { useUnreadNotificationsCount } from "@/hooks/useArtistNotifications";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import logo from "@/assets/logo.png";

interface PageHeaderProps {
  title?: string;
  showBack?: boolean;
  showLogo?: boolean;
  children?: React.ReactNode;
}

const PageHeader = ({ title, showBack = false, showLogo = false, children }: PageHeaderProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { t } = useLanguage();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(t.auth.logoutFailed);
    } else {
      toast.success(t.auth.logoutSuccess);
      navigate("/auth");
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-2xl border-b border-border/30 safe-area-top">
      <div className="px-4 py-3">
        <div className="flex items-center justify-between gap-3">
          {/* Left side */}
          <div className="flex items-center gap-2 min-w-0 flex-1">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="flex items-center justify-center w-10 h-10 -ms-2 rounded-2xl bg-muted/50 hover:bg-muted active:scale-95 transition-all duration-200"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {showLogo && (
              <img 
                src={logo} 
                alt="Logo" 
                className="h-8 w-auto object-contain"
              />
            )}
            {title && (
              <h1 className="text-lg font-semibold text-foreground truncate">
                {title}
              </h1>
            )}
          </div>

          {/* Right side - Actions */}
          <div className="flex items-center gap-1.5">
            <LanguageSwitcher />
            
            {/* Notification Button */}
            <button
              onClick={() => navigate("/notifications")}
              className="relative flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted active:scale-95 transition-all duration-200"
            >
              <Bell className="w-5 h-5 text-foreground" />
              {unreadCount > 0 && (
                <span className="absolute -top-0.5 -end-0.5 flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-bold text-primary-foreground bg-primary rounded-full shadow-lg animate-in zoom-in-50">
                  {unreadCount > 99 ? '99+' : unreadCount}
                </span>
              )}
            </button>

            {/* Profile Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center justify-center w-10 h-10 rounded-2xl bg-muted/50 hover:bg-muted active:scale-95 transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background">
                  <Avatar className="w-8 h-8 ring-2 ring-background shadow-sm">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "Profile"}
                      className="object-cover"
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-xs font-semibold">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent 
                align="end" 
                sideOffset={8}
                className="w-52 bg-card/95 backdrop-blur-xl border border-border/50 shadow-xl rounded-2xl p-1.5"
              >
                {user ? (
                  <>
                    {/* User Info Header */}
                    <div className="px-3 py-2.5 mb-1">
                      <p className="text-sm font-semibold text-foreground truncate">
                        {profile?.full_name || t.userMenu.myProfile}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {profile?.email || user.email}
                      </p>
                    </div>
                    <DropdownMenuSeparator className="bg-border/50" />
                    <DropdownMenuItem 
                      onClick={() => navigate("/profile")} 
                      className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-muted"
                    >
                      <User className="me-3 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t.userMenu.myProfile}</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      onClick={() => navigate("/settings")} 
                      className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-muted"
                    >
                      <Settings className="me-3 h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t.userMenu.settings}</span>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator className="bg-border/50 my-1" />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer rounded-xl py-2.5 px-3 text-destructive focus:text-destructive focus:bg-destructive/10"
                    >
                      <LogOut className="me-3 h-4 w-4" />
                      <span className="font-medium">{t.userMenu.logout}</span>
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem 
                    onClick={() => navigate("/auth")} 
                    className="cursor-pointer rounded-xl py-2.5 px-3 focus:bg-muted"
                  >
                    <LogIn className="me-3 h-4 w-4 text-muted-foreground" />
                    <span className="font-medium">{t.auth.login}</span>
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {children && (
          <div className="mt-3">
            {children}
          </div>
        )}
      </div>
    </header>
  );
};

export default PageHeader;

