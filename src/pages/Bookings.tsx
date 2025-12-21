import BottomNavigation from "@/components/BottomNavigation";
import { Calendar, Clock, MapPin, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useUserBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBookingTime } from "@/lib/locale";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Link } from "react-router-dom";

import artist1 from "@/assets/artist-1.jpg";

const Bookings = () => {
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useUserBookings();
  const { t, language } = useLanguage();
  
  const dateLocale = language === "ar" ? ar : enUS;

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.bookings.title}</h1>
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-40 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <h1 className="text-xl font-bold text-foreground">{t.bookings.title}</h1>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <Calendar className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">{t.auth.login}</h2>
          <p className="text-muted-foreground mb-6">{t.bookings.noBookings}</p>
          <Link to="/">
            <Button>{t.auth.login}</Button>
          </Link>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const { upcoming = [], past = [] } = bookings || {};

  const formatTime = (time: string) => {
    return formatBookingTime(time);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: t.bookings.pending,
      confirmed: t.bookings.confirmed,
      completed: t.bookings.completed,
      cancelled: t.bookings.cancelled,
    };
    return labels[status] || status;
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

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">{t.bookings.title}</h1>
      </header>

      <div className="px-5 py-6">
        {/* Upcoming */}
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.bookings.upcoming}</h2>
          {upcoming.length > 0 ? (
            <div className="space-y-4">
              {upcoming.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={booking.artist?.profile?.avatar_url || artist1}
                      alt={booking.artist?.profile?.full_name || "Artist"}
                      className="w-14 h-14 rounded-full object-cover"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {booking.artist?.profile?.full_name || "Unknown Artist"}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="text-sm text-primary mt-0.5">
                        {booking.service?.name || "Service"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(booking.booking_date), "MMM d, yyyy", { locale: dateLocale })}</span>
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
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1">
                      <MessageCircle className="w-4 h-4 me-1" />
                      {t.nav.messages}
                    </Button>
                    <Button variant="soft" size="sm" className="flex-1">
                      {t.bookings.reschedule}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>{t.bookings.noBookings}</p>
            </div>
          )}
        </section>

        {/* Past */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">{t.bookings.past}</h2>
          {past.length > 0 ? (
            <div className="space-y-4">
              {past.map((booking) => (
                <div
                  key={booking.id}
                  className="bg-card rounded-2xl border border-border p-4 shadow-sm opacity-80"
                >
                  <div className="flex items-start gap-3">
                    <img
                      src={booking.artist?.profile?.avatar_url || artist1}
                      alt={booking.artist?.profile?.full_name || "Artist"}
                      className="w-14 h-14 rounded-full object-cover grayscale"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">
                          {booking.artist?.profile?.full_name || "Unknown Artist"}
                        </h3>
                        <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getStatusBadge(booking.status)}`}>
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-0.5">
                        {booking.service?.name || "Service"}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>{format(new Date(booking.booking_date), "MMM d, yyyy", { locale: dateLocale })}</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          <span>{formatTime(booking.booking_time)}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                    <Button variant="outline" size="sm" className="flex-1">
                      {t.bookings.leaveReview}
                    </Button>
                    <Link to={`/artist/${booking.artist?.id}`} className="flex-1">
                      <Button variant="soft" size="sm" className="w-full">
                        {t.bookings.bookNow}
                      </Button>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t.bookings.noBookings}</p>
            </div>
          )}
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Bookings;
