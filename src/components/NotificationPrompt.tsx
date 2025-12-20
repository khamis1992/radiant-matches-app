import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useNotifications } from "@/hooks/useNotifications";
import { useAuth } from "@/hooks/useAuth";

export const NotificationPrompt = () => {
  const { user } = useAuth();
  const { permission, requestPermission, isSupported } = useNotifications();
  const [dismissed, setDismissed] = useState(false);
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Only show prompt if user is logged in, notifications are supported,
    // permission hasn't been granted/denied, and user hasn't dismissed
    const wasDismissed = localStorage.getItem("notification-prompt-dismissed");
    if (user && isSupported && permission === "default" && !wasDismissed) {
      // Delay showing the prompt
      const timer = setTimeout(() => setShow(true), 3000);
      return () => clearTimeout(timer);
    }
  }, [user, isSupported, permission]);

  const handleEnable = async () => {
    await requestPermission();
    setShow(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setShow(false);
    localStorage.setItem("notification-prompt-dismissed", "true");
  };

  if (!show || dismissed) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 animate-in slide-in-from-bottom-4 md:left-auto md:right-4 md:max-w-sm">
      <div className="bg-card border border-border rounded-lg p-4 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
            <Bell className="w-5 h-5 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-foreground">Enable Notifications</h4>
            <p className="text-sm text-muted-foreground mt-1">
              Get notified about new bookings and updates instantly.
            </p>
            <div className="flex gap-2 mt-3">
              <Button size="sm" onClick={handleEnable}>
                Enable
              </Button>
              <Button size="sm" variant="ghost" onClick={handleDismiss}>
                Not now
              </Button>
            </div>
          </div>
          <button
            onClick={handleDismiss}
            className="text-muted-foreground hover:text-foreground"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
