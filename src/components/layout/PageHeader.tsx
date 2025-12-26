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
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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
    <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
      <div className="px-5 py-4">
        <div className="flex items-center justify-between">
          {/* Left side */}
          <div className="flex items-center gap-3">
            {showBack && (
              <button
                onClick={() => navigate(-1)}
                className="p-2 -ms-2 rounded-full hover:bg-muted transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-foreground" />
              </button>
            )}
            {title && (
              <h1 className="text-xl font-bold text-foreground">{title}</h1>
            )}
          </div>

          {/* Right side - Profile menu */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <button
              onClick={() => navigate("/notifications")}
              className="relative p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            >
              <Bell className="w-5 h-5 text-foreground" />
            </button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="rounded-full border-2 border-primary/20 hover:border-primary transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2">
                  <Avatar className="w-9 h-9">
                    <AvatarImage
                      src={profile?.avatar_url || undefined}
                      alt={profile?.full_name || "Profile"}
                    />
                    <AvatarFallback className="bg-primary/10 text-primary text-sm font-medium">
                      {profile?.full_name?.charAt(0) || "U"}
                    </AvatarFallback>
                  </Avatar>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 bg-card border border-border">
                {user ? (
                  <>
                    <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer">
                      <User className="me-2 h-4 w-4" />
                      {t.userMenu.myProfile}
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                      <Settings className="me-2 h-4 w-4" />
                      {t.userMenu.settings}
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem
                      onClick={handleLogout}
                      className="cursor-pointer text-destructive focus:text-destructive"
                    >
                      <LogOut className="me-2 h-4 w-4" />
                      {t.userMenu.logout}
                    </DropdownMenuItem>
                  </>
                ) : (
                  <DropdownMenuItem onClick={() => navigate("/auth")} className="cursor-pointer">
                    <LogIn className="me-2 h-4 w-4" />
                    {t.auth.login}
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {children}
      </div>
    </header>
  );
};

export default PageHeader;

