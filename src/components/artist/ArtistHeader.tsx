import { Link, useNavigate } from "react-router-dom";
import { Bell, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import LanguageSwitcher from "@/components/LanguageSwitcher";
import { useProfile } from "@/hooks/useProfile";
import { useUnreadMessagesCount } from "@/hooks/useUnreadMessages";
import logoImage from "@/assets/logo.png";

const ArtistHeader = () => {
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { data: unreadCount = 0 } = useUnreadMessagesCount();

  return (
    <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
      <div className="flex items-center justify-between">
        <img src={logoImage} alt="Glam" className="h-8 w-auto" />
        <div className="flex items-center gap-2">
          <LanguageSwitcher />
          <button 
            onClick={() => navigate("/messages")}
            className="relative p-2 rounded-full bg-card border border-border hover:bg-muted transition-colors"
            aria-label="Messages"
          >
            <Bell className="w-5 h-5 text-foreground" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] flex items-center justify-center text-[10px] font-bold text-primary-foreground bg-primary rounded-full px-1">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </button>
          <Link to="/artist-profile">
            <Avatar className="h-9 w-9 border-2 border-primary/20">
              <AvatarImage src={profile?.avatar_url || ""} alt={profile?.full_name || "Profile"} />
              <AvatarFallback className="bg-primary/10 text-primary">
                <User className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
          </Link>
        </div>
      </div>
    </header>
  );
};

export default ArtistHeader;
