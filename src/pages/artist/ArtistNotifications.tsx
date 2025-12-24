import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Bell, 
  Calendar, 
  MessageSquare, 
  Star, 
  CheckCheck, 
  Trash2,
  Briefcase 
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import {
  useArtistNotifications,
  useMarkNotificationRead,
  useMarkAllNotificationsRead,
  useDeleteNotification,
  Notification,
} from "@/hooks/useArtistNotifications";
import { formatDistanceToNow } from "date-fns";
import { ar } from "date-fns/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";

const ArtistNotifications = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: notifications, isLoading: notificationsLoading } = useArtistNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();
  const deleteNotification = useDeleteNotification();
  const { language, isRTL } = useLanguage();

  const getNotificationIcon = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return <Calendar className="w-5 h-5 text-primary" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-blue-500" />;
      case "review":
        return <Star className="w-5 h-5 text-yellow-500" />;
      default:
        return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getNotificationBg = (type: Notification["type"]) => {
    switch (type) {
      case "booking":
        return "bg-primary/10";
      case "message":
        return "bg-blue-500/10";
      case "review":
        return "bg-yellow-500/10";
      default:
        return "bg-muted";
    }
  };

  const handleNotificationClick = async (notification: Notification) => {
    // Mark as read
    if (!notification.is_read) {
      await markRead.mutateAsync(notification.id);
    }

    // Navigate based on type
    const data = notification.data as Record<string, string>;
    switch (notification.type) {
      case "booking":
        navigate("/artist-bookings");
        break;
      case "message":
        if (data?.conversation_id) {
          navigate(`/chat/${data.conversation_id}`);
        } else {
          navigate("/messages");
        }
        break;
      case "review":
        navigate("/artist-profile");
        break;
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      toast.success("تم تحديد جميع الإشعارات كمقروءة");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  const handleDelete = async (e: React.MouseEvent, notificationId: string) => {
    e.stopPropagation();
    try {
      await deleteNotification.mutateAsync(notificationId);
      toast.success("تم حذف الإشعار");
    } catch {
      toast.error("حدث خطأ");
    }
  };

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-20 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">الإشعارات</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">لست فنانة</h2>
          <p className="text-muted-foreground mb-6">ليس لديك ملف فنانة حتى الآن</p>
          <Button onClick={() => navigate("/home")}>الصفحة الرئيسية</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const unreadCount = notifications?.filter((n) => !n.is_read).length || 0;

  return (
    <div className="min-h-screen bg-background pb-24">
      <ArtistHeader />

      <div className="px-5 py-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-bold text-foreground">الإشعارات</h1>
            {unreadCount > 0 && (
              <p className="text-sm text-muted-foreground">
                {unreadCount} إشعار غير مقروء
              </p>
            )}
          </div>
          {unreadCount > 0 && (
            <Button
              variant="ghost"
              size="sm"
              onClick={handleMarkAllRead}
              disabled={markAllRead.isPending}
            >
              <CheckCheck className="w-4 h-4 mr-1" />
              قراءة الكل
            </Button>
          )}
        </div>

        {notificationsLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-20 w-full rounded-2xl" />
            ))}
          </div>
        ) : notifications && notifications.length > 0 ? (
          <div className="space-y-3">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                onClick={() => handleNotificationClick(notification)}
                className={`w-full text-${isRTL ? "right" : "left"} bg-card rounded-2xl border border-border p-4 shadow-sm transition-all hover:shadow-md ${
                  !notification.is_read ? "border-primary/30 bg-primary/5" : ""
                }`}
              >
                <div className="flex items-start gap-3">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${getNotificationBg(
                      notification.type
                    )}`}
                  >
                    {getNotificationIcon(notification.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3
                          className={`font-semibold text-foreground ${
                            !notification.is_read ? "text-primary" : ""
                          }`}
                        >
                          {notification.title}
                        </h3>
                        {notification.body && (
                          <p className="text-sm text-muted-foreground mt-0.5 line-clamp-2">
                            {notification.body}
                          </p>
                        )}
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatDistanceToNow(new Date(notification.created_at), {
                            addSuffix: true,
                            locale: language === "ar" ? ar : undefined,
                          })}
                        </p>
                      </div>
                      <button
                        onClick={(e) => handleDelete(e, notification.id)}
                        className="p-1.5 rounded-full hover:bg-destructive/10 transition-colors shrink-0"
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </button>
                    </div>
                  </div>
                  {!notification.is_read && (
                    <div className="w-2.5 h-2.5 rounded-full bg-primary shrink-0 mt-1" />
                  )}
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-center py-16 text-muted-foreground">
            <Bell className="w-16 h-16 mx-auto mb-4 opacity-30" />
            <h3 className="text-lg font-medium text-foreground mb-1">لا توجد إشعارات</h3>
            <p className="text-sm">ستظهر هنا الإشعارات عند وصول حجز جديد أو رسالة أو تقييم</p>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistNotifications;
