import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Search, MessageSquare } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/useConversations";
import { useAuth } from "@/hooks/useAuth";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow } from "date-fns";
import { ar, enUS } from "date-fns/locale";

import artist1 from "@/assets/artist-1.jpg";

const Messages = () => {
  const { t, isRTL, language } = useLanguage();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { conversations, isLoading } = useConversations();

  const dateLocale = language === "ar" ? ar : enUS;

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24 flex flex-col items-center justify-center px-5">
        <MessageSquare className="w-16 h-16 text-muted-foreground mb-4" />
        <h2 className="text-lg font-semibold mb-2">{t.profile.signInToView}</h2>
        <p className="text-muted-foreground text-center mb-4">{t.profile.signInDesc}</p>
        <Button onClick={() => navigate("/auth")}>{t.auth.login}</Button>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground mb-4">{t.messages.title}</h1>
        <div className="relative">
          <Search className={`absolute ${isRTL ? "right-4" : "left-4"} top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground`} />
          <input
            type="text"
            placeholder={t.messages.searchPlaceholder}
            className={`w-full h-10 ${isRTL ? "pr-10 pl-4" : "pl-10 pr-4"} bg-card border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50`}
          />
        </div>
      </header>

      <div className="px-5 py-4">
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3 p-3">
                <Skeleton className="w-14 h-14 rounded-full" />
                <div className="flex-1 space-y-2">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        ) : conversations && conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((convo) => {
              // Determine the other party
              const isCustomer = user.id === convo.customer_id;
              const otherParty = isCustomer
                ? {
                    name: convo.artist_profile?.full_name || t.artist.anonymous,
                    avatar: convo.artist_profile?.avatar_url || artist1,
                  }
                : {
                    name: convo.customer_profile?.full_name || t.artist.anonymous,
                    avatar: convo.customer_profile?.avatar_url || artist1,
                  };

              const timeAgo = convo.last_message_at
                ? formatDistanceToNow(new Date(convo.last_message_at), {
                    addSuffix: true,
                    locale: dateLocale,
                  })
                : "";

              return (
                <button
                  key={convo.id}
                  onClick={() => navigate(`/chat/${convo.id}`)}
                  className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card transition-colors"
                >
                  <div className="relative">
                    <img
                      src={otherParty.avatar}
                      alt={otherParty.name}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                  </div>
                  <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold text-foreground">
                        {otherParty.name}
                      </h3>
                      <span className="text-xs text-muted-foreground">{timeAgo}</span>
                    </div>
                    <p className="text-sm mt-0.5 truncate text-muted-foreground">
                      {convo.last_message || t.messages.startConversation}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
            <p>{t.messages.noMessages}</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Messages;
