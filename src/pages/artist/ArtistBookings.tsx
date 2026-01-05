import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import ArtistHeader from "@/components/artist/ArtistHeader";
import { WeeklyCalendarList } from "@/components/artist/WeeklyCalendarList";
import { BookingBottomSheet } from "@/components/artist/BookingBottomSheet";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Briefcase, Calendar } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useCurrentArtist, useArtistBookings, useUpdateBookingStatus } from "@/hooks/useArtistDashboard";
import { useLanguage } from "@/contexts/LanguageContext";
import { toast } from "sonner";
import { format } from "date-fns";

const ArtistBookings = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: bookings, isLoading: bookingsLoading } = useArtistBookings();
  const updateBookingStatus = useUpdateBookingStatus();
  const { t, isRTL, language } = useLanguage();

  // State for bottom sheet
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedDateBookings, setSelectedDateBookings] = useState<any[]>([]);
  const [isSheetOpen, setIsSheetOpen] = useState(false);

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
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
      <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
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
      // Refresh bookings for the selected date
      if (selectedDate) {
        const dateKey = format(selectedDate, "yyyy-MM-dd");
        const dayBookings = [...(bookings?.upcoming || []), ...(bookings?.past || [])].filter(
          (b) => b.booking_date === dateKey
        );
        setSelectedDateBookings(dayBookings);
      }
    } catch {
      toast.error(t.artistBookings.failedToUpdate);
    }
  };

  const handleDaySelect = (date: Date, dayBookings: any[]) => {
    setSelectedDate(date);
    setSelectedDateBookings(dayBookings);
    setIsSheetOpen(true);
  };

  const handleSheetClose = () => {
    setIsSheetOpen(false);
  };

  const { upcoming = [], past = [] } = bookings || {};
  const allBookings = [...upcoming, ...past];

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <ArtistHeader />

      <div className="px-4 py-4 space-y-4">
        {/* Page Header */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-foreground">
            {t.artistBookings.title}
          </h2>
        </div>

        {/* Vertical Calendar */}
        {bookingsLoading ? (
          <Skeleton className="h-[500px] w-full rounded-2xl" />
        ) : (
          <WeeklyCalendarList
            bookings={allBookings}
            language={language}
            onDaySelect={handleDaySelect}
            selectedDate={selectedDate || undefined}
          />
        )}

        {/* Empty State */}
        {!bookingsLoading && allBookings.length === 0 && (
          <div className="text-center py-12 bg-card rounded-2xl border border-border">
            <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {language === "ar" ? "لا توجد حجوزات" : "No Bookings"}
            </h3>
            <p className="text-muted-foreground">
              {language === "ar"
                ? "لم يتم حجز أي مواعيد بعد. استخدم زر الإضافة السريعة لإنشاء حجز جديد."
                : "No bookings yet. Use the quick add button to create a new booking."}
            </p>
          </div>
        )}
      </div>

      {/* Booking Details Bottom Sheet */}
      <BookingBottomSheet
        isOpen={isSheetOpen}
        onClose={handleSheetClose}
        date={selectedDate || new Date()}
        bookings={selectedDateBookings}
        onConfirm={(id) => handleBookingAction(id, "confirmed")}
        onDecline={(id) => handleBookingAction(id, "cancelled")}
        onComplete={(id) => handleBookingAction(id, "completed")}
        isUpdating={updateBookingStatus.isPending}
        language={language}
      />

      <BottomNavigation />
    </div>
  );
};

export default ArtistBookings;
