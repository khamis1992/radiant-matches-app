import BottomNavigation from "@/components/BottomNavigation";
import { Search } from "lucide-react";

import artist1 from "@/assets/artist-1.jpg";
import artist2 from "@/assets/artist-2.jpg";

const conversations = [
  {
    id: "1",
    name: "Sofia Chen",
    avatar: artist1,
    lastMessage: "Looking forward to seeing you on the 28th! 💄",
    time: "2h ago",
    unread: 2,
  },
  {
    id: "2",
    name: "Elena Rodriguez",
    avatar: artist2,
    lastMessage: "Thank you for the amazing review! 🙏",
    time: "1d ago",
    unread: 0,
  },
];

const Messages = () => {
  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground mb-4">Messages</h1>
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search messages..."
            className="w-full h-10 pl-10 pr-4 bg-card border border-border rounded-full text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
          />
        </div>
      </header>

      <div className="px-5 py-4">
        {conversations.length > 0 ? (
          <div className="space-y-2">
            {conversations.map((convo) => (
              <button
                key={convo.id}
                className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-card transition-colors"
              >
                <div className="relative">
                  <img
                    src={convo.avatar}
                    alt={convo.name}
                    className="w-14 h-14 rounded-full object-cover"
                  />
                  {convo.unread > 0 && (
                    <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary text-primary-foreground text-xs font-bold rounded-full flex items-center justify-center">
                      {convo.unread}
                    </span>
                  )}
                </div>
                <div className="flex-1 text-left">
                  <div className="flex items-center justify-between">
                    <h3 className={`font-semibold ${convo.unread > 0 ? "text-foreground" : "text-muted-foreground"}`}>
                      {convo.name}
                    </h3>
                    <span className="text-xs text-muted-foreground">{convo.time}</span>
                  </div>
                  <p className={`text-sm mt-0.5 truncate ${convo.unread > 0 ? "text-foreground font-medium" : "text-muted-foreground"}`}>
                    {convo.lastMessage}
                  </p>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <p>No messages yet</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Messages;
