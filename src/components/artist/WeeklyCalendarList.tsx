import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from "lucide-react";
import { format, startOfWeek, endOfWeek, addWeeks, subWeeks, isSameDay, isToday } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

interface Booking {
  id: string;
  customer?: { full_name: string };
  service?: { name: string };
  booking_date: string;
  booking_time: string;
  location_type: string;
  location_address?: string;
  total_price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

interface WeeklyCalendarListProps {
  bookings: Booking[];
  language: string;
  onDaySelect: (date: Date, dayBookings: Booking[]) => void;
  selectedDate?: Date;
}

export const WeeklyCalendarList = ({
  bookings,
  language,
  onDaySelect,
  selectedDate,
}: WeeklyCalendarListProps) => {
  const [currentWeekStart, setCurrentWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionDirection, setTransitionDirection] = useState<"left" | "right">("left");

  const locale = language === "ar" ? ar : enUS;
  const currentWeekEnd = endOfWeek(currentWeekStart, { weekStartsOn: 1 });
  const isRTL = language === "ar";

  // Generate week days (Mon-Sun)
  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const date = new Date(currentWeekStart);
    date.setDate(date.getDate() + i);
    return date;
  });

  // Group bookings by date
  const bookingsByDate = new Map<string, Booking[]>();
  bookings.forEach((booking) => {
    const dateKey = booking.booking_date;
    if (!bookingsByDate.has(dateKey)) {
      bookingsByDate.set(dateKey, []);
    }
    bookingsByDate.get(dateKey)!.push(booking);
  });

  const getDayBookings = (date: Date) => {
    const dateKey = format(date, "yyyy-MM-dd");
    return bookingsByDate.get(dateKey) || [];
  };

  const getBookingStatusCounts = (dayBookings: Booking[]) => {
    return dayBookings.reduce(
      (acc, booking) => {
        if (booking.status === "pending") acc.pending++;
        if (booking.status === "confirmed") acc.confirmed++;
        if (booking.status === "completed") acc.completed++;
        return acc;
      },
      { pending: 0, confirmed: 0, completed: 0 }
    );
  };

  const handleWeekChange = (direction: "prev" | "next") => {
    setIsTransitioning(true);
    setTransitionDirection(direction === "next" ? "left" : "right");

    setTimeout(() => {
      setCurrentWeekStart((prev) =>
        direction === "next" ? addWeeks(prev, 1) : subWeeks(prev, 1)
      );
      setTimeout(() => setIsTransitioning(false), 50);
    }, 300);
  };

  const handleDayPress = (date: Date) => {
    const dayBookings = getDayBookings(date);
    onDaySelect(date, dayBookings);
  };

  const goToToday = () => {
    const today = startOfWeek(new Date(), { weekStartsOn: 1 });
    if (today.getTime() !== currentWeekStart.getTime()) {
      setIsTransitioning(true);
      setTransitionDirection(today < currentWeekStart ? "right" : "left");
      setTimeout(() => {
        setCurrentWeekStart(today);
        setTimeout(() => setIsTransitioning(false), 50);
      }, 300);
    }
  };

  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* Week Navigation Header */}
      <div className="sticky top-0 bg-card border-b border-border z-10">
        <div className="flex items-center justify-between px-4 py-3">
          <button
            onClick={() => handleWeekChange("prev")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
            aria-label={isRTL ? "Next week" : "Previous week"}
          >
            <ChevronLeft className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </button>

          <div className="flex flex-col items-center">
            <button
              onClick={goToToday}
              className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
            >
              {language === "ar" ? "هذا الأسبوع" : "This Week"}
            </button>
            <span className="text-xs text-muted-foreground mt-0.5">
              {format(currentWeekStart, "d MMM", { locale })} - {format(currentWeekEnd, "d MMM yyyy", { locale })}
            </span>
          </div>

          <button
            onClick={() => handleWeekChange("next")}
            className="w-10 h-10 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80 transition-colors active:scale-95"
            aria-label={isRTL ? "Previous week" : "Next week"}
          >
            <ChevronRight className={cn("w-5 h-5", isRTL && "rotate-180")} />
          </button>
        </div>
      </div>

      {/* Week Days List */}
      <div
        className={cn(
          "transition-all duration-300",
          isTransitioning && transitionDirection === "left" && "-translate-x-full opacity-0",
          isTransitioning && transitionDirection === "right" && "translate-x-full opacity-0"
        )}
      >
        {weekDays.map((date, index) => {
          const dayBookings = getDayBookings(date);
          const counts = getBookingStatusCounts(dayBookings);
          const dayIsToday = isToday(date);
          const isSelected = selectedDate ? isSameDay(date, selectedDate) : false;
          const hasBookings = dayBookings.length > 0;
          const isPast = date < new Date(new Date().setHours(0, 0, 0, 0));

          const dayName = format(date, "EEE", { locale });
          const dayNumber = format(date, "d");

          return (
            <button
              key={index}
              onClick={() => handleDayPress(date)}
              className={cn(
                "w-full flex items-center px-4 py-3 border-b border-border last:border-b-0 transition-all active:scale-[0.98]",
                dayIsToday && "bg-primary/5",
                isSelected && "bg-primary/10",
                isPast && "opacity-50"
              )}
              style={{
                minHeight: "72px",
                borderLeft: isSelected ? "2px solid hsl(var(--primary))" : "2px solid transparent",
              }}
            >
              {/* Day Name and Date */}
              <div className={cn("flex flex-col items-center justify-center w-16", isRTL && "order-2")}>
                <span className={cn(
                  "text-sm font-medium",
                  dayIsToday ? "text-primary" : "text-foreground"
                )}>
                  {dayName}
                </span>
                <span className={cn(
                  "text-xl font-bold mt-0.5",
                  dayIsToday ? "text-primary" : "text-muted-foreground"
                )}>
                  {dayNumber}
                </span>
              </div>

              {/* Booking Info */}
              <div className={cn("flex-1 mx-4", isRTL && "order-1")}>
                {hasBookings ? (
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-foreground">
                      {dayBookings.length} {language === "ar" ? "حجز" : "booking"}
                      {dayBookings.length !== 1 && (language === "ar" ? "" : "s")}
                    </span>
                    {(counts.pending > 0 || counts.confirmed > 0) && (
                      <div className="flex items-center gap-2 mt-1">
                        {counts.pending > 0 && (
                          <span className="text-xs text-yellow-600">
                            {language === "ar" ? `${counts.pending} في الانتظار` : `${counts.pending} pending`}
                          </span>
                        )}
                        {counts.confirmed > 0 && (
                          <span className="text-xs text-primary">
                            {language === "ar" ? `${counts.confirmed} مؤكد` : `${counts.confirmed} confirmed`}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <span className="text-sm text-muted-foreground">
                    {language === "ar" ? "لا توجد حجوزات" : "No bookings"}
                  </span>
                )}
              </div>

              {/* Status Dots */}
              <div className={cn("flex items-center gap-1.5", isRTL && "order-3")}>
                {counts.confirmed > 0 && (
                  <div
                    className="w-2.5 h-2.5 rounded-full"
                    style={{ backgroundColor: "hsl(var(--primary))" }}
                  />
                )}
                {counts.pending > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500" />
                )}
                {counts.completed > 0 && (
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default WeeklyCalendarList;
