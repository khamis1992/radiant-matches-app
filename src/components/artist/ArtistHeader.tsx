import { Link, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadNotificationsCount } from "@/hooks/useArtistNotifications";
import logoImage from "@/assets/logo.png";

const ArtistHeader = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: unreadCount = 0 } = useUnreadNotificationsCount();

  return (
    <header className="sticky top-0 z-40 bg-gradient-to-b from-background via-background/95 to-background/80 backdrop-blur-xl">
      {/* Subtle gradient border */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-border/50 to-transparent" />
      
      <div className="relative px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo with enhanced visibility */}
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <div className="relative group cursor-pointer" onClick={() => navigate("/artist-dashboard")}>
              <div className="absolute -inset-3 bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <img 
                src={logoImage} 
                alt="Glam" 
                className="relative h-12 w-auto object-contain drop-shadow-md transition-all duration-200 group-hover:scale-105 group-hover:drop-shadow-lg"
              />
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            
            {/* Notifications button */}
            <button 
              onClick={() => navigate("/artist-notifications")}
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-card shadow-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 active:scale-95 group"
              aria-label="Notifications"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <Bell className="relative w-5 h-5 text-foreground/80 group-hover:text-foreground transition-colors" />
              {unreadCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1.5 flex items-center justify-center text-[11px] font-bold text-primary-foreground bg-gradient-to-r from-primary to-primary/90 rounded-full shadow-lg ring-2 ring-background">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              )}
            </button>
            
            {/* Profile Avatar */}
            <Link 
              to="/artist-profile"
              className="relative flex items-center justify-center w-10 h-10 rounded-xl bg-card shadow-sm border border-border/40 hover:border-primary/30 hover:shadow-md transition-all duration-200 active:scale-95 group overflow-hidden"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <Avatar className="relative h-8 w-8 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Profile"} />
                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-primary/10 text-primary">
                  <User className="h-4 w-4" />
                </AvatarFallback>
              </Avatar>
            </Link>
          </div>
        </div>
      </div>
    </header>
  );
};

export default ArtistHeader;
