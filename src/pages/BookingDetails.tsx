import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Calendar, Clock, MapPin, User, Phone, MessageCircle, Edit2, X, Check, Loader2, AlertCircle } from "lucide-react";
import { useConversations } from "@/hooks/useConversations";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatBookingTime, formatQAR } from "@/lib/locale";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { toast } from "sonner";
import BackButton from "@/components/BackButton";
import BottomNavigation from "@/components/BottomNavigation";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useBlockedDates } from "@/hooks/useBlockedDates";

// Generate time slots from start to end time
const generateTimeSlots = (startTime: string | null, endTime: string | null): string[] => {
  if (!startTime || !endTime) return [];
  
  const slots: string[] = [];
  const [startHour] = startTime.split(":").map(Number);
  const [endHour] = endTime.split(":").map(Number);
  
  for (let hour = startHour; hour < endHour; hour++) {
    const ampm = hour >= 12 ? "PM" : "AM";
    const displayHour = hour % 12 || 12;
    slots.push(`${displayHour}:00 ${ampm}`);
  }
  
  return slots;
};

const defaultTimeSlots = [
  "9:00 AM", "10:00 AM", "11:00 AM", "12:00 PM",
  "1:00 PM", "2:00 PM", "3:00 PM", "4:00 PM", "5:00 PM"
];

// Convert display time (e.g., "9:00 AM") to database format (e.g., "09:00:00")
const convertTimeToDbFormat = (displayTime: string): string => {
  const [time, period] = displayTime.split(" ");
  let [hours] = time.split(":").map(Number);
  
  if (period === "PM" && hours !== 12) {
    hours += 12;
  } else if (period === "AM" && hours === 12) {
    hours = 0;
  }
  
  return `${hours.toString().padStart(2, "0")}:00:00`;
};

// Convert DB time to display format
const convertDbTimeToDisplay = (dbTime: string): string => {
  const [hours] = dbTime.split(":").map(Number);
  const ampm = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:00 ${ampm}`;
};

const BookingDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const queryClient = useQueryClient();
  const dateLocale = language === "ar" ? ar : enUS;
  const { getOrCreateConversation } = useConversations();

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [notes, setNotes] = useState("");

  // Fetch booking details
  const { data: booking, isLoading } = useQuery({
    queryKey: ["booking-details", id],
    queryFn: async () => {
      if (!id) return null;
      
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      if (!data) return null;

      // Fetch artist
      const { data: artist } = await supabase
        .from("artists")
        .select("id, user_id, studio_address")
        .eq("id", data.artist_id)
        .single();

      // Fetch artist profile
      let artistProfile = null;
      if (artist) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("full_name, avatar_url, phone")
          .eq("id", artist.user_id)
          .single();
        artistProfile = profile;
      }

      // Fetch service
      let service = null;
      if (data.service_id) {
        const { data: serviceData } = await supabase
          .from("services")
          .select("name, duration_minutes, price")
          .eq("id", data.service_id)
          .single();
        service = serviceData;
      }

      return {
        ...data,
        artist: artist ? { ...artist, profile: artistProfile } : null,
        service,
      };
    },
    enabled: !!id && !!user,
  });

  const artistId = booking?.artist?.id;
  const { data: workingHours = [] } = useWorkingHours(artistId || undefined);
  const { data: blockedDates = [] } = useBlockedDates(artistId || undefined);

  // Cancel booking mutation
  const cancelMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-details", id] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      toast.success(language === "ar" ? "تم إلغاء الحجز بنجاح" : "Booking cancelled successfully");
    },
    onError: () => {
      toast.error(language === "ar" ? "فشل في إلغاء الحجز" : "Failed to cancel booking");
    },
  });

  // Update booking mutation
  const updateMutation = useMutation({
    mutationFn: async ({ date, time, notes }: { date: string; time: string; notes: string }) => {
      const { error } = await supabase
        .from("bookings")
        .update({
          booking_date: date,
          booking_time: time,
          notes: notes || null,
        })
        .eq("id", id);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["booking-details", id] });
      queryClient.invalidateQueries({ queryKey: ["user-bookings"] });
      setIsEditDialogOpen(false);
      toast.success(language === "ar" ? "تم تحديث الحجز بنجاح" : "Booking updated successfully");
    },
    onError: () => {
      toast.error(language === "ar" ? "فشل في تحديث الحجز" : "Failed to update booking");
    },
  });

  // Check if a date is blocked
  const isBlockedDate = (date: Date): boolean => {
    const dateString = date.toISOString().split("T")[0];
    return blockedDates.some((bd) => bd.blocked_date === dateString);
  };

  // Check if a date is a working day
  const isWorkingDay = (date: Date): boolean => {
    if (isBlockedDate(date)) return false;
    if (workingHours.length === 0) return true;
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find((wh) => wh.day_of_week === dayOfWeek);
    return dayHours?.is_working ?? true;
  };

  // Get time slots for selected date
  const getTimeSlotsForDate = (date: Date | null) => {
    if (!date || workingHours.length === 0) return defaultTimeSlots;
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find((wh) => wh.day_of_week === dayOfWeek);
    if (!dayHours?.is_working) return [];
    return generateTimeSlots(dayHours.start_time, dayHours.end_time);
  };

  const handleOpenEdit = () => {
    if (booking) {
      setSelectedDate(new Date(booking.booking_date));
      setSelectedTime(convertDbTimeToDisplay(booking.booking_time));
      setNotes(booking.notes || "");
      setIsEditDialogOpen(true);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedDate || !selectedTime) {
      toast.error(language === "ar" ? "يرجى اختيار التاريخ والوقت" : "Please select date and time");
      return;
    }

    updateMutation.mutate({
      date: selectedDate.toISOString().split("T")[0],
      time: convertTimeToDbFormat(selectedTime),
      notes,
    });
  };

  // Generate dates for next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const availableTimeSlots = getTimeSlotsForDate(selectedDate);

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

  const canModify = booking?.status === "pending" || booking?.status === "confirmed";

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <Skeleton className="h-6 w-32" />
          </div>
        </header>
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-20 w-full rounded-2xl" />
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!booking) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <div className="flex items-center gap-3">
            <BackButton />
            <h1 className="text-xl font-bold text-foreground">{t.bookings.viewDetails}</h1>
          </div>
        </header>
        <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
          <AlertCircle className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {language === "ar" ? "الحجز غير موجود" : "Booking not found"}
          </h2>
          <Button onClick={() => navigate("/bookings")} className="mt-4">
            {t.bookings.title}
          </Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const artistName = booking.artist?.profile?.full_name || (language === "ar" ? "فنانة" : "Artist");
  const artistAvatar = booking.artist?.profile?.avatar_url;
  const artistPhone = booking.artist?.profile?.phone;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <BackButton />
          <h1 className="text-xl font-bold text-foreground">{t.bookings.viewDetails}</h1>
        </div>
      </header>

      <div className="px-5 py-6 space-y-4">
        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`px-3 py-1 text-sm font-medium rounded-full ${getStatusBadge(booking.status)}`}>
            {getStatusLabel(booking.status)}
          </span>
          <span className="text-sm text-muted-foreground">
            #{booking.id.slice(0, 8).toUpperCase()}
          </span>
        </div>

        {/* Artist Card */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <div className="flex items-center gap-3">
            {artistAvatar ? (
              <img
                src={artistAvatar}
                alt={artistName}
                className="w-14 h-14 rounded-full object-cover"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-primary/20 flex items-center justify-center">
                <User className="w-7 h-7 text-primary" />
              </div>
            )}
            <div className="flex-1">
              <h3 className="font-semibold text-foreground">{artistName}</h3>
              <p className="text-sm text-primary">{booking.service?.name || t.bookings.service}</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4 pt-4 border-t border-border">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={async () => {
                if (booking.artist?.id) {
                  try {
                    const conversationId = await getOrCreateConversation.mutateAsync(booking.artist.id);
                    navigate(`/chat/${conversationId}`);
                  } catch (error) {
                    toast.error(t.errors.somethingWrong);
                  }
                }
              }}
            >
              <MessageCircle className="w-4 h-4 me-1" />
              {t.nav.messages}
            </Button>
            {artistPhone && (
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => window.open(`tel:${artistPhone}`, "_self")}
              >
                <Phone className="w-4 h-4 me-1" />
                {language === "ar" ? "اتصال" : "Call"}
              </Button>
            )}
          </div>
        </div>

        {/* Booking Details */}
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
          <h3 className="font-semibold text-foreground">{t.bookings.bookingSummary}</h3>
          
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Calendar className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.bookings.date}</p>
              <p className="font-medium text-foreground">
                {format(new Date(booking.booking_date), "EEEE, d MMMM yyyy", { locale: dateLocale })}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.bookings.time}</p>
              <p className="font-medium text-foreground">{formatBookingTime(booking.booking_time)}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <MapPin className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm text-muted-foreground">{t.bookings.location}</p>
              <p className="font-medium text-foreground">
                {booking.location_type === "client" ? t.bookings.atMyLocation : t.bookings.artistStudio}
              </p>
              {booking.location_address && (
                <p className="text-sm text-muted-foreground">{booking.location_address}</p>
              )}
            </div>
          </div>

          {booking.notes && (
            <div className="pt-2 border-t border-border">
              <p className="text-sm text-muted-foreground">{t.bookings.notes}</p>
              <p className="text-foreground mt-1">{booking.notes}</p>
            </div>
          )}
        </div>

        {/* Price Summary */}
        <div className="bg-card rounded-2xl border border-border p-4">
          <h3 className="font-semibold text-foreground mb-3">{t.bookings.totalPrice}</h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t.bookings.serviceFee}</span>
              <span className="font-medium text-foreground">
                {formatQAR(booking.service?.price || booking.total_price)}
              </span>
            </div>
            {booking.location_type === "client" && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.bookings.travelFee}</span>
                <span className="font-medium text-foreground">{formatQAR(90)}</span>
              </div>
            )}
            {booking.discount_amount && booking.discount_amount > 0 && (
              <div className="flex justify-between text-primary">
                <span>{language === "ar" ? "الخصم" : "Discount"}</span>
                <span>-{formatQAR(booking.discount_amount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border">
              <span className="font-semibold text-foreground">{t.bookings.total}</span>
              <span className="font-bold text-primary text-lg">{formatQAR(booking.total_price)}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        {canModify && (
          <div className="flex gap-3 pt-2">
            <Button
              variant="outline"
              className="flex-1"
              onClick={handleOpenEdit}
            >
              <Edit2 className="w-4 h-4 me-2" />
              {t.bookings.reschedule}
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="flex-1">
                  <X className="w-4 h-4 me-2" />
                  {t.bookings.cancelBooking}
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>
                    {language === "ar" ? "إلغاء الحجز؟" : "Cancel Booking?"}
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    {language === "ar"
                      ? "هل أنت متأكد من إلغاء هذا الحجز؟ لا يمكن التراجع عن هذا الإجراء."
                      : "Are you sure you want to cancel this booking? This action cannot be undone."}
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>{t.common.cancel}</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={() => cancelMutation.mutate()}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  >
                    {cancelMutation.isPending ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      t.common.confirm
                    )}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t.bookings.reschedule}</DialogTitle>
          </DialogHeader>
          <div className="space-y-6 py-4">
            {/* Date Selection */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">{t.bookings.selectDate}</h3>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
                {dates.map((date) => {
                  const isSelected = selectedDate?.toDateString() === date.toDateString();
                  const isWorking = isWorkingDay(date);
                  return (
                    <button
                      key={date.toISOString()}
                      onClick={() => {
                        setSelectedDate(date);
                        setSelectedTime(null);
                      }}
                      disabled={!isWorking}
                      className={`flex-shrink-0 w-14 py-2 rounded-xl border-2 transition-all duration-200 ${
                        !isWorking
                          ? "border-border bg-muted opacity-50 cursor-not-allowed"
                          : isSelected
                          ? "border-primary bg-primary/10"
                          : "border-border bg-card hover:border-primary/50"
                      }`}
                    >
                      <p className="text-xs text-muted-foreground">
                        {date.toLocaleDateString(language === "ar" ? "ar-QA" : "en-QA", { weekday: "short" })}
                      </p>
                      <p className={`text-lg font-bold ${isSelected && isWorking ? "text-primary" : "text-foreground"}`}>
                        {date.getDate()}
                      </p>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            <div>
              <h3 className="text-sm font-medium text-foreground mb-3">{t.bookings.selectTime}</h3>
              {selectedDate && availableTimeSlots.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                  {t.bookings.noAvailableSlots}
                </p>
              ) : (
                <div className="grid grid-cols-3 gap-2">
                  {availableTimeSlots.map((time) => {
                    const isSelected = selectedTime === time;
                    return (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`py-2 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                          isSelected
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                      >
                        {time}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Notes */}
            <div>
              <label className="text-sm font-medium text-foreground">
                {t.bookings.additionalNotes}
              </label>
              <textarea
                placeholder={t.bookings.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-2 p-3 bg-card border border-border rounded-xl resize-none h-20 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Save Button */}
            <Button
              className="w-full"
              onClick={handleSaveEdit}
              disabled={!selectedDate || !selectedTime || updateMutation.isPending}
            >
              {updateMutation.isPending ? (
                <Loader2 className="w-4 h-4 animate-spin me-2" />
              ) : (
                <Check className="w-4 h-4 me-2" />
              )}
              {t.common.save}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <BottomNavigation />
    </div>
  );
};

export default BookingDetails;
