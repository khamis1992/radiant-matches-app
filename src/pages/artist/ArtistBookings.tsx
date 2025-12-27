import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import WeeklyCalendar from "@/components/artist/WeeklyCalendar";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Check, 
  X, 
  Briefcase,
  LayoutGrid,
  List
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist, useArtistBookings, useUpdateBookingStatus } from "@/hooks/useArtistDashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBookingTime } from "@/lib/locale";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

// نوع العرض
type ViewMode = "calendar" | "list";

const ArtistBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: bookings, isLoading: bookingsLoading } = useArtistBookings();
  const updateBookingStatus = useUpdateBookingStatus();
  const { t, isRTL, language } = useLanguage();
  
  // حالة العرض (تقويم أو قائمة)
  const [viewMode, setViewMode] = useState<ViewMode>("calendar");

  const dateLocale = language === "ar" ? ar : enUS;

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user || !artist) {
    return (
      <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.artistBookings.title}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Briefcase className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.artistBookings.notAnArtist}</h2>
          <p className="text-muted-foreground mb-6">{t.artistBookings.noArtistProfile}</p>
          <Button onClick={() => navigate("/home")}>{t.artistBookings.goHome}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const handleBookingAction = async (bookingId: string, status: "confirmed" | "cancelled" | "completed") => {
    try {
      await updateBookingStatus.mutateAsync({ bookingId, status });
      const messages: Record<string, string> = {
        confirmed: t.artistBookings.bookingConfirmed,
        cancelled: t.artistBookings.bookingDeclined,
        completed: t.artistBookings.bookingCompleted,
      };
      toast.success(messages[status]);
    } catch {
      toast.error(t.artistBookings.failedToUpdate);
    }
  };

  const formatTime = (time: string) => {
    return formatBookingTime(time);
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600",
      confirmed: "bg-primary/10 text-primary",
      completed: "bg-muted text-muted-foreground",
      cancelled: "bg-destructive/10 text-destructive",
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t.artistBookings.statusPending,
      confirmed: t.artistBookings.statusConfirmed,
      completed: t.artistBookings.statusCompleted,
      cancelled: t.artistBookings.statusCancelled,
    };
    return labels[status] || status;
  };

  const { upcoming = [], past = [] } = bookings || {};
  const allBookings = [...upcoming, ...past];
  const iconMargin = isRTL ? "ml-1" : "mr-1";

  return (
    <div className="min-h-screen bg-background pb-24" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      <div className="px-5 py-4 space-y-4">
        {/* رأس الصفحة مع أزرار التبديل */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t.artistBookings.title}
          </h2>
          
          {/* أزرار تبديل العرض */}
          <div className="flex bg-muted rounded-lg p-1">
            <button
              onClick={() => setViewMode("calendar")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === "calendar" 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <LayoutGrid className="w-4 h-4" />
              {language === "ar" ? "تقويم" : "Calendar"}
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewMode === "list" 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <List className="w-4 h-4" />
              {language === "ar" ? "قائمة" : "List"}
            </button>
          </div>
        </div>

        {/* عرض التقويم */}
        {viewMode === "calendar" && (
          <div className="animate-fade-in">
            {bookingsLoading ? (
              <Skeleton className="h-[600px] w-full rounded-2xl" />
            ) : (
              <WeeklyCalendar
                bookings={allBookings}
                language={language}
                isRTL={isRTL}
                onConfirm={(id) => handleBookingAction(id, "confirmed")}
                onDecline={(id) => handleBookingAction(id, "cancelled")}
                onComplete={(id) => handleBookingAction(id, "completed")}
                isUpdating={updateBookingStatus.isPending}
              />
            )}
          </div>
        )}

        {/* عرض القائمة */}
        {viewMode === "list" && (
          <div className="space-y-6 animate-fade-in">
            {/* الحجوزات القادمة */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-primary" />
                {t.artistBookings.upcomingBookings}
                {upcoming.length > 0 && (
                  <span className="bg-primary/10 text-primary text-xs px-2 py-0.5 rounded-full">
                    {upcoming.length}
                  </span>
                )}
              </h3>
              {bookingsLoading ? (
                <div className="space-y-3">
                  {[1, 2].map((i) => <Skeleton key={i} className="h-32 w-full rounded-2xl" />)}
                </div>
              ) : upcoming.length > 0 ? (
                <div className="space-y-3">
                  {upcoming.map((booking) => (
                    <div key={booking.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm">
                      <div className="flex items-start gap-3">
                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                          <User className="w-6 h-6 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-semibold text-foreground">
                              {booking.customer?.full_name || t.common.customer}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-primary mt-0.5">{booking.service?.name}</p>
                          <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              <span>{format(new Date(booking.booking_date), "d MMM yyyy", { locale: dateLocale })}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" />
                              <span>{formatTime(booking.booking_time)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{booking.location_address || booking.location_type}</span>
                          </div>
                        </div>
                      </div>
                      {booking.status === "pending" && (
                        <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                          <Button 
                            variant="outline" 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleBookingAction(booking.id, "cancelled")}
                          >
                            <X className={`w-4 h-4 ${iconMargin}`} />
                            {t.artistBookings.decline}
                          </Button>
                          <Button 
                            size="sm" 
                            className="flex-1"
                            onClick={() => handleBookingAction(booking.id, "confirmed")}
                          >
                            <Check className={`w-4 h-4 ${iconMargin}`} />
                            {t.artistBookings.confirm}
                          </Button>
                        </div>
                      )}
                      {booking.status === "confirmed" && (
                        <div className="mt-4 pt-4 border-t border-border">
                          <Button 
                            size="sm" 
                            className="w-full"
                            onClick={() => handleBookingAction(booking.id, "completed")}
                          >
                            <Check className={`w-4 h-4 ${iconMargin}`} />
                            {t.artistBookings.markCompleted}
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-2xl">
                  <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>{t.artistBookings.noUpcomingBookings}</p>
                </div>
              )}
            </section>

            {/* الحجوزات السابقة */}
            <section>
              <h3 className="text-base font-semibold text-foreground mb-3">
                {t.artistBookings.pastBookings}
              </h3>
              {past.length > 0 ? (
                <div className="space-y-3">
                  {past.slice(0, 5).map((booking) => (
                    <div key={booking.id} className="bg-card rounded-2xl border border-border p-4 shadow-sm opacity-70">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                          <User className="w-5 h-5 text-muted-foreground" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <h3 className="font-medium text-foreground">
                              {booking.customer?.full_name || t.common.customer}
                            </h3>
                            <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                              {getStatusLabel(booking.status)}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {booking.service?.name} • {format(new Date(booking.booking_date), "d MMM", { locale: dateLocale })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>{t.artistBookings.noPastBookings}</p>
                </div>
              )}
            </section>
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default ArtistBookings;
