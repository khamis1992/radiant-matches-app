import { useState, useMemo } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { Calendar, Clock, MapPin, CreditCard, Check, Loader2 } from "lucide-react";
import BackButton from "@/components/BackButton";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatQAR } from "@/lib/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";

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

const Booking = () => {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, language } = useLanguage();
  const { user, loading: authLoading } = useAuth();
  
  const serviceName = searchParams.get("service") || "Service";
  const serviceId = searchParams.get("serviceId");
  const artistId = searchParams.get("artistId") || id;
  const priceParam = searchParams.get("price");
  const servicePrice = priceParam ? parseFloat(priceParam) : 0;
  
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedLocation, setSelectedLocation] = useState<string>("artist_studio");
  const [notes, setNotes] = useState("");
  const [step, setStep] = useState(1);
  const [isConfirmed, setIsConfirmed] = useState(false);

  const createBooking = useCreateBooking();
  const { data: workingHours = [] } = useWorkingHours(artistId || undefined);
  const { data: blockedDates = [] } = useBlockedDates(artistId || undefined);

  // Fetch artist info
  const { data: artistInfo } = useQuery({
    queryKey: ["artist-info", artistId],
    queryFn: async () => {
      if (!artistId) return null;
      const { data: artist } = await supabase
        .from("artists")
        .select("*")
        .eq("id", artistId)
        .single();
      
      if (!artist) return null;
      
      // Fetch profile separately
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", artist.user_id)
        .single();
      
      return { ...artist, profile };
    },
    enabled: !!artistId,
  });

  // Fetch service info if serviceId is provided
  const { data: serviceInfo } = useQuery({
    queryKey: ["service-info", serviceId],
    queryFn: async () => {
      if (!serviceId) return null;
      const { data: service } = await supabase
        .from("services")
        .select("*")
        .eq("id", serviceId)
        .single();
      return service;
    },
    enabled: !!serviceId,
  });

  const actualServiceName = serviceInfo?.name || serviceName;
  const actualServicePrice = serviceInfo?.price || servicePrice;
  const travelFee = selectedLocation === "client_home" ? 90 : 0;
  const totalPrice = actualServicePrice + travelFee;

  const dateLocale = language === "ar" ? "ar-QA" : "en-QA";

  // Get working hours for selected date
  const selectedDayWorkingHours = useMemo(() => {
    if (!selectedDate || workingHours.length === 0) return null;
    const dayOfWeek = selectedDate.getDay();
    return workingHours.find((wh) => wh.day_of_week === dayOfWeek);
  }, [selectedDate, workingHours]);

  // Generate available time slots based on working hours
  const availableTimeSlots = useMemo(() => {
    if (!selectedDayWorkingHours) return defaultTimeSlots;
    if (!selectedDayWorkingHours.is_working) return [];
    return generateTimeSlots(
      selectedDayWorkingHours.start_time,
      selectedDayWorkingHours.end_time
    );
  }, [selectedDayWorkingHours]);

  // Check if a date is blocked
  const isBlockedDate = (date: Date): boolean => {
    const dateString = date.toISOString().split("T")[0];
    return blockedDates.some((bd) => bd.blocked_date === dateString);
  };

  // Check if a date is a working day (and not blocked)
  const isWorkingDay = (date: Date): boolean => {
    if (isBlockedDate(date)) return false;
    if (workingHours.length === 0) return true;
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find((wh) => wh.day_of_week === dayOfWeek);
    return dayHours?.is_working ?? true;
  };

  const locations = [
    { id: "client_home", label: t.bookings.atMyLocation, description: `${t.bookings.artistComesToYou} (+QAR 90)` },
    { id: "artist_studio", label: t.bookings.artistStudio, description: t.bookings.visitArtistWorkspace },
  ];

  useSwipeBack({
    onSwipeBack: () => (step > 1 ? setStep(step - 1) : navigate(-1)),
  });

  // Generate dates for next 14 days
  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const handleConfirmBooking = async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      navigate("/auth");
      return;
    }

    if (!artistId || !serviceId || !selectedDate || !selectedTime) {
      toast.error("يرجى ملء جميع البيانات المطلوبة");
      return;
    }

    try {
      await createBooking.mutateAsync({
        artist_id: artistId,
        service_id: serviceId,
        booking_date: selectedDate.toISOString().split("T")[0],
        booking_time: convertTimeToDbFormat(selectedTime),
        location_type: selectedLocation as "artist_studio" | "client_home",
        location_address: selectedLocation === "client_home" ? "Customer location" : artistInfo?.studio_address || undefined,
        total_price: totalPrice,
        notes: notes || undefined,
      });

      setIsConfirmed(true);
      toast.success(t.bookings.bookingConfirmedToast);
      setTimeout(() => navigate("/bookings"), 2000);
    } catch (error) {
      console.error("Booking error:", error);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return <ProtectedRoute>{null}</ProtectedRoute>;
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center px-6">
        <div className="animate-scale-in text-center">
          <div className="w-20 h-20 mx-auto rounded-full bg-primary/10 flex items-center justify-center mb-6">
            <Check className="w-10 h-10 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">{t.bookings.bookingConfirmed}</h1>
          <p className="text-muted-foreground mt-2">
            {t.bookings.appointmentScheduled}
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            {t.bookings.redirectingToBookings}
          </p>
        </div>
      </div>
    );
  }

  const artistName = artistInfo?.profile?.full_name || "Artist";
  const artistAvatar = artistInfo?.profile?.avatar_url;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50">
        <div className="flex items-center gap-3 px-5 py-4">
          <BackButton onClick={() => (step > 1 ? setStep(step - 1) : navigate(-1))} />
          <div>
            <h1 className="font-semibold text-foreground">{t.bookings.bookAppointment}</h1>
            <p className="text-sm text-muted-foreground">
              {t.bookings.stepOf.replace("{step}", String(step)).replace("{total}", "3")}
            </p>
          </div>
        </div>
        {/* Progress bar */}
        <div className="h-1 bg-muted">
          <div
            className="h-full bg-primary transition-all duration-300"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </header>

      {/* Artist & Service Summary */}
      <div className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          {artistAvatar ? (
            <img
              src={artistAvatar}
              alt={artistName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
              <span className="text-primary font-semibold">
                {artistName.charAt(0)}
              </span>
            </div>
          )}
          <div>
            <h3 className="font-medium text-foreground">{artistName}</h3>
            <p className="text-sm text-primary">{actualServiceName}</p>
          </div>
          <div className="ms-auto text-end">
            <p className="font-bold text-foreground">{formatQAR(actualServicePrice)}</p>
            {serviceInfo?.duration_minutes && (
              <p className="text-xs text-muted-foreground">
                {Math.floor(serviceInfo.duration_minutes / 60)} {t.bookings.hours}
              </p>
            )}
          </div>
        </div>
      </div>

      <div className="px-5 py-6">
        {/* Step 1: Select Date */}
        {step === 1 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t.bookings.selectDate}</h2>
            </div>
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-5 px-5 scrollbar-hide">
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
                    className={`flex-shrink-0 w-16 py-3 rounded-xl border-2 transition-all duration-200 ${
                      !isWorking
                        ? "border-border bg-muted opacity-50 cursor-not-allowed"
                        : isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString(dateLocale, { weekday: "short" })}
                    </p>
                    <p className={`text-lg font-bold ${isSelected && isWorking ? "text-primary" : "text-foreground"}`}>
                      {date.getDate()}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {date.toLocaleDateString(dateLocale, { month: "short" })}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 mt-8 mb-4">
              <Clock className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t.bookings.selectTime}</h2>
            </div>
            {selectedDate && availableTimeSlots.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {t.bookings.noAvailableSlots || "No available time slots for this day"}
              </p>
            ) : (
              <div className="grid grid-cols-3 gap-2">
                {availableTimeSlots.map((time) => {
                  const isSelected = selectedTime === time;
                  return (
                    <button
                      key={time}
                      onClick={() => setSelectedTime(time)}
                      className={`py-3 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
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
        )}

        {/* Step 2: Select Location */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="flex items-center gap-2 mb-4">
              <MapPin className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold text-foreground">{t.bookings.selectLocation}</h2>
            </div>
            <div className="space-y-3">
              {locations.map((location) => {
                const isSelected = selectedLocation === location.id;
                return (
                  <button
                    key={location.id}
                    onClick={() => setSelectedLocation(location.id)}
                    className={`w-full p-4 rounded-xl border-2 text-start transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10"
                        : "border-border bg-card hover:border-primary/50"
                    }`}
                  >
                    <p className={`font-medium ${isSelected ? "text-primary" : "text-foreground"}`}>
                      {location.label}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {location.description}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="mt-6">
              <label className="text-sm font-medium text-foreground">
                {t.bookings.additionalNotes}
              </label>
              <textarea
                placeholder={t.bookings.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full mt-2 p-4 bg-card border border-border rounded-xl resize-none h-24 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && (
          <div className="animate-fade-in">
            <h2 className="text-lg font-semibold text-foreground mb-4">{t.bookings.bookingSummary}</h2>
            
            <div className="bg-card rounded-xl border border-border p-4 space-y-4">
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.bookings.service}</span>
                <span className="font-medium text-foreground">{actualServiceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.bookings.date}</span>
                <span className="font-medium text-foreground">
                  {selectedDate?.toLocaleDateString(dateLocale, {
                    weekday: "short",
                    month: "short",
                    day: "numeric",
                  })}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.bookings.time}</span>
                <span className="font-medium text-foreground">{selectedTime}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">{t.bookings.location}</span>
                <span className="font-medium text-foreground">
                  {selectedLocation === "client_home" ? t.bookings.yourLocation : t.bookings.artistStudio}
                </span>
              </div>
              <div className="border-t border-border pt-4">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">{t.bookings.serviceFee}</span>
                  <span className="font-medium text-foreground">{formatQAR(actualServicePrice)}</span>
                </div>
                {selectedLocation === "client_home" && (
                  <div className="flex justify-between mt-2">
                    <span className="text-muted-foreground">{t.bookings.travelFee}</span>
                    <span className="font-medium text-foreground">{formatQAR(travelFee)}</span>
                  </div>
                )}
                <div className="flex justify-between mt-4 text-lg">
                  <span className="font-semibold text-foreground">{t.bookings.total}</span>
                  <span className="font-bold text-primary">
                    {formatQAR(totalPrice)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-2 mb-4">
                <CreditCard className="w-5 h-5 text-primary" />
                <h3 className="font-semibold text-foreground">{t.bookings.paymentMethod}</h3>
              </div>
              <div className="bg-card rounded-xl border border-border p-4 flex items-center gap-3">
                <div className="w-12 h-8 bg-gradient-to-r from-[hsl(220,60%,50%)] to-[hsl(220,60%,40%)] rounded flex items-center justify-center">
                  <span className="text-xs font-bold text-primary-foreground">VISA</span>
                </div>
                <div>
                  <p className="font-medium text-foreground">•••• •••• •••• 4242</p>
                  <p className="text-xs text-muted-foreground">{t.bookings.expires} 12/25</p>
                </div>
              </div>
            </div>

            <div className="mt-6">
              <label className="flex items-start gap-3">
                <input
                  type="checkbox"
                  className="mt-1 w-4 h-4 rounded border-border text-primary focus:ring-primary"
                  defaultChecked
                />
                <span className="text-sm text-muted-foreground">
                  {t.bookings.agreeToTerms}
                </span>
              </label>
            </div>
          </div>
        )}
      </div>

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border p-5">
        {step < 3 ? (
          <Button
            size="lg"
            className="w-full"
            disabled={step === 1 && (!selectedDate || !selectedTime)}
            onClick={() => setStep(step + 1)}
          >
            {t.bookings.continue}
          </Button>
        ) : (
          <Button
            size="lg"
            variant="gold"
            className="w-full"
            onClick={handleConfirmBooking}
            disabled={createBooking.isPending}
          >
            {createBooking.isPending ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : (
              `${t.bookings.pay} ${formatQAR(totalPrice)}`
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default Booking;
