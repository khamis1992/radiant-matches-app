import { useState, useMemo, useCallback, useEffect } from "react";
import { useSwipeBack } from "@/hooks/useSwipeBack";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { 
  Calendar as CalendarIcon, Clock, MapPin, CreditCard, Check, Loader2, Banknote, 
  AlertCircle, ChevronLeft, ChevronRight, Sparkles, Home, Building2, Sun, Sunset,
  Star, Shield
} from "lucide-react";

// Calendar alias for JSX usage
const Calendar = CalendarIcon;
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { formatQAR } from "@/lib/locale";
import { useLanguage } from "@/contexts/LanguageContext";
import { useWorkingHours } from "@/hooks/useWorkingHours";
import { useBlockedDates } from "@/hooks/useBlockedDates";
import { useCreateBooking } from "@/hooks/useCreateBooking";
import { useAuth } from "@/hooks/useAuth";
import { useKeyboardNavigation } from "@/hooks/useKeyboardNavigation";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useProfile } from "@/hooks/useProfile";
import { BookingSkeleton } from "@/components/ui/skeleton-loader";
import ErrorDisplay from "@/components/ui/error-display";
import PaymentProcessing from "@/components/ui/payment-processing";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, isToday, isBefore, startOfDay } from "date-fns";
import { ar, enUS } from "date-fns/locale";

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

// Convert display time to database format
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

// Step indicator component
const StepIndicator = ({ 
  currentStep, 
  steps 
}: { 
  currentStep: number; 
  steps: { icon: React.ElementType; label: string }[] 
}) => (
  <div className="flex items-center justify-center gap-1 py-4 px-6">
    {steps.map((step, index) => {
      const Icon = step.icon;
      const stepNum = index + 1;
      const isActive = stepNum === currentStep;
      const isCompleted = stepNum < currentStep;
      
      return (
        <div key={stepNum} className="flex items-center">
          <div className={`
            relative flex items-center justify-center w-10 h-10 rounded-full transition-all duration-500
            ${isActive 
              ? "bg-gradient-to-br from-primary to-primary/80 text-white shadow-lg shadow-primary/30 scale-110" 
              : isCompleted 
                ? "bg-primary/20 text-primary" 
                : "bg-muted text-muted-foreground"
            }
          `}>
            {isCompleted ? (
              <Check className="w-5 h-5" />
            ) : (
              <Icon className="w-5 h-5" />
            )}
            {isActive && (
              <div className="absolute inset-0 rounded-full bg-primary/20 animate-ping" />
            )}
          </div>
          {index < steps.length - 1 && (
            <div className={`
              w-12 h-1 mx-1 rounded-full transition-all duration-500
              ${isCompleted ? "bg-primary" : "bg-muted"}
            `} />
          )}
        </div>
      );
    })}
  </div>
);

// Floating artist card component
const FloatingArtistCard = ({ 
  artistName, 
  artistAvatar, 
  serviceName, 
  price, 
  duration 
}: { 
  artistName: string; 
  artistAvatar?: string; 
  serviceName: string; 
  price: number; 
  duration?: number;
}) => (
  <div className="mx-4 -mt-2 mb-4">
    <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl p-4 shadow-xl border border-primary/10 backdrop-blur-sm">
      <div className="flex items-center gap-4">
        <div className="relative">
          {artistAvatar ? (
            <img
              src={artistAvatar}
              alt={artistName}
              className="w-16 h-16 rounded-2xl object-cover ring-2 ring-primary/20"
            />
          ) : (
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center ring-2 ring-primary/20">
              <span className="text-2xl font-bold text-primary">
                {artistName.charAt(0)}
              </span>
            </div>
          )}
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
            <Star className="w-3 h-3 text-white fill-white" />
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-foreground truncate">{artistName}</h3>
          <div className="flex items-center gap-1.5 mt-1">
            <Sparkles className="w-4 h-4 text-primary" />
            <p className="text-sm text-primary font-medium truncate">{serviceName}</p>
          </div>
        </div>
        <div className="text-end">
          <p className="text-xl font-bold text-foreground">{formatQAR(price)}</p>
          {duration && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {Math.floor(duration / 60)}h {duration % 60 > 0 ? `${duration % 60}m` : ''}
            </p>
          )}
        </div>
      </div>
    </div>
  </div>
);

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
  const [paymentMethod, setPaymentMethod] = useState<"cash" | "sadad">("cash");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [currentMonth, setCurrentMonth] = useState<Date>(new Date());
  const [timeFilter, setTimeFilter] = useState<"AM" | "PM">("AM");
  
  const [errors, setErrors] = useState<{
    date?: string;
    time?: string;
    location?: string;
    notes?: string;
  }>({});
  
  const [bookingError, setBookingError] = useState<string | null>(null);
  
  const [paymentState, setPaymentState] = useState<{
    isProcessing: boolean;
    isSuccess: boolean;
    error: string | null;
  }>({
    isProcessing: false,
    isSuccess: false,
    error: null
  });

  const { data: userProfile } = useProfile();

  useEffect(() => {
    const meta = document.createElement('meta');
    meta.name = 'viewport';
    meta.content = 'width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no, viewport-fit=cover';
    document.head.appendChild(meta);
    
    return () => {
      document.head.removeChild(meta);
    };
  }, []);

  const createBooking = useCreateBooking();
  const { data: workingHours = [] } = useWorkingHours(artistId || undefined);
  const { data: blockedDates = [] } = useBlockedDates(artistId || undefined);

  const { data: artistInfo, isLoading: isArtistLoading } = useQuery({
    queryKey: ["artist-info", artistId],
    queryFn: async () => {
      if (!artistId) return null;
      const { data: artist } = await supabase
        .from("artists")
        .select("*")
        .eq("id", artistId)
        .single();
      
      if (!artist) return null;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("full_name, avatar_url")
        .eq("id", artist.user_id)
        .single();
      
      return { ...artist, profile };
    },
    enabled: !!artistId,
  });

  const { data: serviceInfo, isLoading: isServiceLoading } = useQuery({
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
  const dateFnsLocale = language === "ar" ? ar : enUS;

  const selectedDayWorkingHours = useMemo(() => {
    if (!selectedDate || workingHours.length === 0) return null;
    const dayOfWeek = selectedDate.getDay();
    return workingHours.find((wh) => wh.day_of_week === dayOfWeek);
  }, [selectedDate, workingHours]);

  const availableTimeSlots = useMemo(() => {
    if (!selectedDayWorkingHours) return defaultTimeSlots;
    if (!selectedDayWorkingHours.is_working) return [];
    return generateTimeSlots(
      selectedDayWorkingHours.start_time,
      selectedDayWorkingHours.end_time
    );
  }, [selectedDayWorkingHours]);

  // Filter time slots based on AM/PM toggle
  const filteredTimeSlots = useMemo(() => {
    return availableTimeSlots.filter(slot => {
      if (timeFilter === "AM") return slot.includes("AM");
      return slot.includes("PM");
    });
  }, [availableTimeSlots, timeFilter]);

  // Generate calendar days for the current month
  const calendarDays = useMemo(() => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
    
    // Get the day of week for the first day (0 = Sunday)
    const startDayOfWeek = monthStart.getDay();
    
    // Add empty slots for days before the start of month
    const paddedDays: (Date | null)[] = Array(startDayOfWeek).fill(null);
    paddedDays.push(...days);
    
    return paddedDays;
  }, [currentMonth]);

  const isBlockedDate = (date: Date): boolean => {
    const dateString = format(date, "yyyy-MM-dd");
    return blockedDates.some((bd) => bd.blocked_date === dateString);
  };

  const isWorkingDay = (date: Date): boolean => {
    if (isBlockedDate(date)) return false;
    if (workingHours.length === 0) return true;
    const dayOfWeek = date.getDay();
    const dayHours = workingHours.find((wh) => wh.day_of_week === dayOfWeek);
    return dayHours?.is_working ?? true;
  };

  const hasAvailability = (date: Date): boolean => {
    if (!isWorkingDay(date)) return false;
    if (isBefore(startOfDay(date), startOfDay(new Date()))) return false;
    return true;
  };

  const validateForm = useCallback(() => {
    const newErrors: typeof errors = {};
    
    if (!selectedDate) {
      newErrors.date = t.bookings.selectDateError || "Please select a date";
    }
    
    if (!selectedTime) {
      newErrors.time = t.bookings.selectTimeError || "Please select a time";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [selectedDate, selectedTime, t.bookings]);

  const handleNextStep = useCallback(() => {
    if (step < 3) {
      if (step === 1 && (!selectedDate || !selectedTime)) {
        validateForm();
        return;
      }
      setStep(step + 1);
    }
  }, [step, selectedDate, selectedTime, validateForm]);

  const handlePrevStep = useCallback(() => {
    if (step > 1) {
      setStep(step - 1);
    } else {
      navigate(-1);
    }
  }, [step, navigate]);

  useSwipeBack({
    onSwipeBack: handlePrevStep,
  });

  const dates = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() + i + 1);
    return date;
  });

  const handleConfirmBooking = useCallback(async () => {
    if (!user) {
      toast.error("يرجى تسجيل الدخول أولاً");
      navigate("/auth");
      return;
    }

    if (!artistId || !serviceId || !selectedDate || !selectedTime) {
      toast.error("يرجى ملء جميع البيانات المطلوبة");
      return;
    }

    if (!validateForm()) {
      toast.error(t.bookings.formValidationError || "Please fix the errors in the form");
      return;
    }

    try {
      const booking = await createBooking.mutateAsync({
        artist_id: artistId,
        service_id: serviceId,
        booking_date: selectedDate.toISOString().split("T")[0],
        booking_time: convertTimeToDbFormat(selectedTime),
        location_type: selectedLocation as "artist_studio" | "client_home",
        location_address: selectedLocation === "client_home" ? "Customer location" : artistInfo?.studio_address || undefined,
        total_price: totalPrice,
        notes: notes || undefined,
      });

      if (paymentMethod === "sadad") {
        setPaymentState(prev => ({ ...prev, isProcessing: true }));
        setIsProcessingPayment(true);
        
        const returnUrl = `${window.location.origin}/payment-result`;
        
        const { data, error } = await supabase.functions.invoke("sadad-initiate-payment", {
          body: {
            booking_id: booking.id,
            customer_email: userProfile?.email || user.email,
            customer_phone: userProfile?.phone || "",
            customer_name: userProfile?.full_name || "",
            return_url: returnUrl,
          },
        });

        if (error || !data?.success) {
          console.error("Payment initiation failed:", error || data?.error);
          const errorMessage = error?.message || data?.error || "فشل في بدء عملية الدفع";
          setPaymentState(prev => ({ ...prev, isProcessing: false, error: errorMessage }));
          setIsProcessingPayment(false);
          toast.error(errorMessage);
          return;
        }

        const paymentData = data.data;
        
        const form = document.createElement("form");
        form.method = "POST";
        form.action = paymentData.payment_url;
        form.name = "gosadad";
        
        const standardFields = [
          "merchant_id", "ORDER_ID", "WEBSITE", "TXN_AMOUNT", "CUST_ID",
          "EMAIL", "MOBILE_NO", "SADAD_WEBCHECKOUT_PAGE_LANGUAGE",
          "CALLBACK_URL", "txnDate", "VERSION", "checksumhash"
        ];
        
        standardFields.forEach((fieldName) => {
          if (paymentData[fieldName] !== undefined) {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = fieldName;
            input.id = fieldName;
            input.value = String(paymentData[fieldName]);
            form.appendChild(input);
          }
        });
        
        if (paymentData.productdetail && Array.isArray(paymentData.productdetail)) {
          paymentData.productdetail.forEach((product: Record<string, string>, index: number) => {
            Object.entries(product).forEach(([key, value]) => {
              const input = document.createElement("input");
              input.type = "hidden";
              input.name = `productdetail[${index}][${key}]`;
              input.value = String(value);
              form.appendChild(input);
            });
          });
        }
        
        document.body.appendChild(form);
        form.submit();
      } else {
        setPaymentState(prev => ({ ...prev, isProcessing: true }));
        setTimeout(() => {
          setPaymentState({ isProcessing: false, isSuccess: true, error: null });
          setIsConfirmed(true);
          toast.success(t.bookings.bookingConfirmedToast);
          setTimeout(() => navigate("/bookings"), 2000);
        }, 1500);
      }
    } catch (error) {
      console.error("Booking error:", error);
      setIsProcessingPayment(false);
      
      const errorMessage = error instanceof Error ? error.message : "Failed to create booking";
      setBookingError(errorMessage);
      toast.error(t.bookings.bookingFailed || "Failed to create booking");
    }
  }, [user, artistId, serviceId, selectedDate, selectedTime, validateForm, selectedLocation, totalPrice, notes, paymentMethod, createBooking, navigate, t, artistInfo, userProfile]);

  const handleSubmit = useCallback(() => {
    if (step === 3) {
      handleConfirmBooking();
    } else {
      handleNextStep();
    }
  }, [step, handleConfirmBooking, handleNextStep]);

  useKeyboardNavigation({
    onBack: handlePrevStep,
    onNext: handleNextStep,
    onSubmit: handleSubmit,
    onCancel: () => navigate(-1),
    enabled: true
  });

  if (authLoading || isArtistLoading || isServiceLoading) {
    return <BookingSkeleton />;
  }

  if (!user) {
    return <ProtectedRoute>{null}</ProtectedRoute>;
  }

  if (isConfirmed) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-primary/10 flex flex-col items-center justify-center px-6">
        <div className="animate-scale-in text-center">
          <div className="relative">
            <div className="w-24 h-24 mx-auto rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center mb-6 shadow-2xl shadow-primary/30">
              <Check className="w-12 h-12 text-white" />
            </div>
            <div className="absolute inset-0 w-24 h-24 mx-auto rounded-full bg-primary/20 animate-ping" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t.bookings.bookingConfirmed}</h1>
          <p className="text-muted-foreground mt-3 text-lg">
            {t.bookings.appointmentScheduled}
          </p>
          <div className="flex items-center justify-center gap-2 mt-6 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" />
            {t.bookings.redirectingToBookings}
          </div>
        </div>
      </div>
    );
  }

  const artistName = artistInfo?.profile?.full_name || "Artist";
  const artistAvatar = artistInfo?.profile?.avatar_url;

  const steps = [
    { icon: Calendar, label: t.bookings.selectDate },
    { icon: MapPin, label: t.bookings.selectLocation },
    { icon: CreditCard, label: t.bookings.payment || "Payment" }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-28" onTouchMove={(e) => e.touches.length > 1 && e.preventDefault()}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/95 backdrop-blur-xl border-b border-border/50">
        <div className="flex items-center gap-3 px-4 py-3">
          <button 
            onClick={handlePrevStep}
            className="w-10 h-10 rounded-full bg-muted/50 hover:bg-muted flex items-center justify-center transition-colors"
          >
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <div className="flex-1 text-center">
            <h1 className="font-semibold text-foreground">{t.bookings.bookAppointment}</h1>
          </div>
          <div className="w-10" />
        </div>
        
        {/* Step Indicator */}
        <StepIndicator currentStep={step} steps={steps} />
      </header>

      <div className="px-4">
        {/* Step 1: Select Date & Time */}
        {step === 1 && (
          <div className="animate-fade-in space-y-4">
            {/* Service & Artist Card - Compact */}
            <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl p-4 shadow-sm border border-primary/10">
              <div className="flex items-center gap-3">
                {/* Artist Avatar */}
                <div className="relative flex-shrink-0">
                  {artistAvatar ? (
                    <img
                      src={artistAvatar}
                      alt={artistName}
                      className="w-14 h-14 rounded-xl object-cover ring-2 ring-primary/20"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-2 ring-primary/20">
                      <span className="text-xl font-bold text-white">
                        {artistName.charAt(0)}
                      </span>
                    </div>
                  )}
                  {artistInfo?.rating && (
                    <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-amber-500 rounded-full flex items-center justify-center shadow-sm">
                      <Star className="w-3 h-3 text-white fill-white" />
                    </div>
                  )}
                </div>

                {/* Service Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{artistName}</h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <p className="text-xs text-primary font-medium truncate">{actualServiceName}</p>
                  </div>
                  {serviceInfo?.duration_minutes && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      <Clock className="w-3 h-3 inline-block mr-1" />
                      {Math.floor(serviceInfo.duration_minutes / 60) > 0 && `${Math.floor(serviceInfo.duration_minutes / 60)}h `}
                      {serviceInfo.duration_minutes % 60 > 0 && `${serviceInfo.duration_minutes % 60}m`}
                    </p>
                  )}
                </div>

                {/* Price */}
                <div className="text-end flex-shrink-0">
                  <p className="text-lg font-bold text-primary">{formatQAR(actualServicePrice)}</p>
                  {artistInfo?.rating && (
                    <p className="text-xs text-muted-foreground">
                      {artistInfo.rating.toFixed(1)} ({artistInfo.total_reviews || 0})
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Calendar Section */}
            <div className="bg-card rounded-3xl p-6 shadow-sm">
              {/* Month Navigation */}
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-muted-foreground">
                  {format(currentMonth, "MMM", { locale: dateFnsLocale })}
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setCurrentMonth(prev => subMonths(prev, 1))}
                    disabled={isSameMonth(currentMonth, new Date())}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    aria-label="Previous month"
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => setCurrentMonth(prev => addMonths(prev, 1))}
                    className="w-8 h-8 rounded-full flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    aria-label="Next month"
                  >
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </div>
              </div>

              {errors.date && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{errors.date}</span>
                </div>
              )}

              {/* Weekday Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {(language === "ar" 
                  ? ["أحد", "اثن", "ثلا", "أرب", "خمس", "جمع", "سبت"]
                  : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
                ).map((day) => (
                  <div key={day} className="text-center text-sm font-medium text-muted-foreground py-2">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Grid */}
              <div className="grid grid-cols-7 gap-1">
                {calendarDays.map((day, index) => {
                  if (!day) {
                    return <div key={`empty-${index}`} className="aspect-square" />;
                  }
                  
                  const isSelected = selectedDate && isSameDay(day, selectedDate);
                  const isAvailable = hasAvailability(day);
                  const isTodayDate = isToday(day);
                  const isPast = isBefore(startOfDay(day), startOfDay(new Date()));
                  
                  return (
                    <button
                      key={day.toISOString()}
                      onClick={() => {
                        if (isAvailable) {
                          setSelectedDate(day);
                          setSelectedTime(null);
                          setErrors(prev => ({ ...prev, date: undefined }));
                        }
                      }}
                      disabled={!isAvailable || isPast}
                      className={`
                        aspect-square flex flex-col items-center justify-center rounded-full text-sm font-medium
                        transition-all duration-200 relative touch-manipulation
                        ${!isAvailable || isPast
                          ? "text-muted-foreground/40 cursor-not-allowed"
                          : isSelected
                          ? "bg-primary text-primary-foreground shadow-lg scale-110"
                          : isTodayDate
                          ? "text-foreground font-bold"
                          : "text-foreground hover:bg-muted"
                        }
                      `}
                    >
                      <span>{day.getDate()}</span>
                      {/* Availability dot indicator */}
                      {isAvailable && !isPast && !isSelected && (
                        <div className="absolute bottom-1.5 w-1 h-1 rounded-full bg-primary" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection with AM/PM Toggle */}
            <div className="bg-card rounded-3xl p-6 shadow-sm">
              {/* Header with AM/PM Toggle */}
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-base font-medium text-muted-foreground">
                  {language === "ar" ? "الوقت المتاح" : "Available Time"}
                </h3>
                <div className="flex items-center bg-muted rounded-full p-1">
                  <button
                    onClick={() => setTimeFilter("AM")}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                      ${timeFilter === "AM"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    AM
                  </button>
                  <button
                    onClick={() => setTimeFilter("PM")}
                    className={`
                      px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-200
                      ${timeFilter === "PM"
                        ? "bg-card text-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                      }
                    `}
                  >
                    PM
                  </button>
                </div>
              </div>

              {errors.time && (
                <div className="mb-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-destructive flex-shrink-0" />
                  <span className="text-sm text-destructive">{errors.time}</span>
                </div>
              )}

              {!selectedDate ? (
                <div className="text-center py-8 text-muted-foreground">
                  {language === "ar" ? "اختر تاريخاً أولاً" : "Select a date first"}
                </div>
              ) : filteredTimeSlots.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  {t.bookings.noAvailableSlots || "No available time slots"}
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-3">
                  {filteredTimeSlots.map((time) => {
                    const isTimeSelected = selectedTime === time;
                    const hourDisplay = time.replace(" AM", ".00").replace(" PM", ".00");
                    const isPastTime = selectedDate && isToday(selectedDate) && 
                      new Date(`${format(selectedDate, "yyyy-MM-dd")} ${time.replace(" AM", ":00 AM").replace(" PM", ":00 PM")}`) < new Date();
                    
                    return (
                      <button
                        key={time}
                        onClick={() => {
                          setSelectedTime(time);
                          setErrors(prev => ({ ...prev, time: undefined }));
                        }}
                        disabled={isPastTime}
                        className={`
                          py-3 px-4 rounded-xl text-base font-medium transition-all duration-200
                          touch-manipulation select-none
                          ${isPastTime
                            ? "bg-muted/50 text-muted-foreground/50 cursor-not-allowed"
                            : isTimeSelected
                            ? "bg-primary text-primary-foreground shadow-lg"
                            : "bg-muted/50 text-foreground border border-border hover:border-primary/50"
                          }
                        `}
                        aria-label={`Select ${time}`}
                      >
                        {hourDisplay}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Step 2: Select Location */}
        {step === 2 && (
          <div className="animate-fade-in space-y-4">
            {/* Service & Artist Card - Compact */}
            <div className="bg-gradient-to-br from-card via-card to-primary/5 rounded-2xl p-4 shadow-sm border border-primary/10">
              <div className="flex items-center gap-3">
                {artistAvatar ? (
                  <img
                    src={artistAvatar}
                    alt={artistName}
                    className="w-12 h-12 rounded-xl object-cover ring-2 ring-primary/20"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-2 ring-primary/20">
                    <span className="text-lg font-bold text-white">
                      {artistName.charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-foreground text-sm truncate">{artistName}</h3>
                  <div className="flex items-center gap-1.5">
                    <Sparkles className="w-3 h-3 text-primary" />
                    <p className="text-xs text-primary font-medium truncate">{actualServiceName}</p>
                  </div>
                </div>
                <div className="text-end">
                  <p className="text-base font-bold text-primary">{formatQAR(actualServicePrice)}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
              <div className="flex items-center gap-2 mb-5">
                <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="w-4 h-4 text-primary" />
                </div>
                <h2 className="font-semibold text-foreground">{t.bookings.selectLocation}</h2>
              </div>
              
              <div className="space-y-3">
                {/* Artist Studio Option */}
                <button
                  onClick={() => setSelectedLocation("artist_studio")}
                  className={`
                    w-full p-4 rounded-2xl border-2 text-start transition-all duration-300 
                    ${selectedLocation === "artist_studio"
                      ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg"
                      : "border-border bg-card hover:border-primary/40"
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                      ${selectedLocation === "artist_studio"
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                      }
                    `}>
                      <Building2 className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${selectedLocation === "artist_studio" ? "text-primary" : "text-foreground"}`}>
                          {t.bookings.artistStudio}
                        </p>
                        {selectedLocation === "artist_studio" && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t.bookings.visitArtistWorkspace}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-medium text-green-600 bg-green-50 px-2 py-0.5 rounded-full">
                          {language === "ar" ? "بدون رسوم إضافية" : "No extra fees"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>

                {/* Home Service Option */}
                <button
                  onClick={() => setSelectedLocation("client_home")}
                  className={`
                    w-full p-4 rounded-2xl border-2 text-start transition-all duration-300 
                    ${selectedLocation === "client_home"
                      ? "border-primary bg-gradient-to-br from-primary/10 to-primary/5 shadow-lg"
                      : "border-border bg-card hover:border-primary/40"
                    }
                  `}
                >
                  <div className="flex items-start gap-4">
                    <div className={`
                      w-12 h-12 rounded-xl flex items-center justify-center transition-colors
                      ${selectedLocation === "client_home"
                        ? "bg-primary text-white"
                        : "bg-muted text-muted-foreground"
                      }
                    `}>
                      <Home className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className={`font-semibold ${selectedLocation === "client_home" ? "text-primary" : "text-foreground"}`}>
                          {t.bookings.atMyLocation}
                        </p>
                        {selectedLocation === "client_home" && (
                          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                            <Check className="w-4 h-4 text-white" />
                          </div>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        {t.bookings.artistComesToYou}
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                          +{formatQAR(90)} {language === "ar" ? "رسوم تنقل" : "travel fee"}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Notes Section */}
            <div className="bg-card rounded-2xl p-5 shadow-sm border border-border/50">
              <label htmlFor="booking-notes" className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-primary" />
                <span className="font-medium text-foreground">{t.bookings.additionalNotes}</span>
                <span className="text-xs text-muted-foreground">({language === "ar" ? "اختياري" : "Optional"})</span>
              </label>
              <textarea
                id="booking-notes"
                placeholder={t.bookings.notesPlaceholder}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="w-full p-4 bg-muted/30 border-0 rounded-xl resize-none h-28 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 transition-all"
              />
            </div>
          </div>
        )}

        {/* Step 3: Confirm & Pay */}
        {step === 3 && (
          <div className="animate-fade-in space-y-5">
            {/* Artist & Service Card - Premium Design */}
            <div className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-card to-primary/5 rounded-3xl p-5 border border-primary/20 shadow-lg">
              <div className="absolute top-0 right-0 w-32 h-32 bg-primary/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
              <div className="absolute bottom-0 left-0 w-24 h-24 bg-primary/5 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
              
              <div className="relative flex items-center gap-4">
                {artistInfo?.profile?.avatar_url ? (
                  <img
                    src={artistInfo.profile.avatar_url}
                    alt={artistInfo?.profile?.full_name || "Artist"}
                    className="w-20 h-20 rounded-2xl object-cover ring-3 ring-primary/30 shadow-xl"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center ring-3 ring-primary/30 shadow-xl">
                    <span className="text-3xl font-bold text-white">
                      {(artistInfo?.profile?.full_name || "A").charAt(0)}
                    </span>
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-bold text-foreground">{artistInfo?.profile?.full_name || "Artist"}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <Sparkles className="w-4 h-4 text-primary" />
                    <p className="text-sm text-primary font-medium">{actualServiceName}</p>
                  </div>
                  {artistInfo?.rating && (
                    <div className="flex items-center gap-1 mt-2">
                      <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                      <span className="text-sm font-medium text-foreground">{artistInfo.rating.toFixed(1)}</span>
                      <span className="text-xs text-muted-foreground">({artistInfo.total_reviews || 0})</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Booking Details Cards */}
            <div className="grid grid-cols-1 gap-3">
              {/* Date Card */}
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Calendar className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.bookings.date}</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">
                      {selectedDate && format(selectedDate, "EEEE", { locale: dateFnsLocale })}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {selectedDate && format(selectedDate, "d MMMM yyyy", { locale: dateFnsLocale })}
                    </p>
                  </div>
                </div>
              </div>

              {/* Time Card */}
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    <Clock className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.bookings.time}</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">{selectedTime}</p>
                    {serviceInfo?.duration_minutes && (
                      <p className="text-sm text-muted-foreground">
                        {Math.floor(serviceInfo.duration_minutes / 60)}h {serviceInfo.duration_minutes % 60 > 0 ? `${serviceInfo.duration_minutes % 60}m` : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Location Card */}
              <div className="bg-card rounded-2xl p-4 shadow-sm border border-border/50 hover:border-primary/30 transition-all duration-300">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center">
                    {selectedLocation === "client_home" ? (
                      <Home className="w-6 h-6 text-primary" />
                    ) : (
                      <Building2 className="w-6 h-6 text-primary" />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{t.bookings.location}</p>
                    <p className="text-base font-semibold text-foreground mt-0.5">
                      {selectedLocation === "client_home" ? t.bookings.yourLocation : t.bookings.artistStudio}
                    </p>
                    {selectedLocation === "artist_studio" && artistInfo?.studio_address && (
                      <p className="text-sm text-muted-foreground">{artistInfo.studio_address}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Price Summary - Premium Design */}
            <div className="bg-gradient-to-br from-card to-muted/30 rounded-3xl p-5 shadow-lg border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <CreditCard className="w-4 h-4 text-primary" />
                {t.bookings.bookingSummary}
              </h3>
              
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">{serviceName}</span>
                  <span className="font-medium text-foreground">{formatQAR(actualServicePrice)}</span>
                </div>
                
                {selectedLocation === "client_home" && (
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">{t.bookings.travelFee}</span>
                    <span className="font-medium text-foreground">{formatQAR(travelFee)}</span>
                  </div>
                )}
                
                <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent my-2" />
                
                <div className="flex justify-between items-center pt-1">
                  <span className="text-base font-bold text-foreground">{t.bookings.total}</span>
                  <div className="text-end">
                    <span className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/80 bg-clip-text text-transparent">
                      {formatQAR(totalPrice)}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="bg-card rounded-3xl p-5 shadow-sm border border-border/50">
              <h3 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <Banknote className="w-4 h-4 text-primary" />
                {t.payment?.choosePaymentMethod || t.bookings.paymentMethod}
              </h3>
              
              <div className="grid grid-cols-2 gap-3">
                {/* SADAD Payment */}
                <button
                  onClick={() => setPaymentMethod("sadad")}
                  className={`
                    relative p-4 rounded-2xl border-2 text-center transition-all duration-300
                    ${paymentMethod === "sadad"
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-border bg-card hover:border-primary/40"
                    }
                  `}
                >
                  {paymentMethod === "sadad" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="w-12 h-8 mx-auto bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm mb-2">
                    <span className="text-[10px] font-bold text-white">SADAD</span>
                  </div>
                  <p className={`text-sm font-medium ${paymentMethod === "sadad" ? "text-primary" : "text-foreground"}`}>
                    {t.payment?.sadadPayment || "SADAD"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.payment?.sadadPaymentDesc || "Online"}</p>
                </button>

                {/* Cash Payment */}
                <button
                  onClick={() => setPaymentMethod("cash")}
                  className={`
                    relative p-4 rounded-2xl border-2 text-center transition-all duration-300
                    ${paymentMethod === "cash"
                      ? "border-primary bg-primary/10 shadow-lg shadow-primary/20"
                      : "border-border bg-card hover:border-primary/40"
                    }
                  `}
                >
                  {paymentMethod === "cash" && (
                    <div className="absolute -top-2 -right-2 w-6 h-6 bg-primary rounded-full flex items-center justify-center shadow-lg">
                      <Check className="w-3.5 h-3.5 text-white" />
                    </div>
                  )}
                  <div className="w-12 h-8 mx-auto bg-muted rounded-lg flex items-center justify-center mb-2">
                    <Banknote className="w-5 h-5 text-muted-foreground" />
                  </div>
                  <p className={`text-sm font-medium ${paymentMethod === "cash" ? "text-primary" : "text-foreground"}`}>
                    {t.payment?.cashPayment || "Cash"}
                  </p>
                  <p className="text-[10px] text-muted-foreground mt-0.5">{t.payment?.cashPaymentDesc || "At visit"}</p>
                </button>
              </div>
            </div>

            {/* Security Badge */}
            <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-emerald-500/10 to-emerald-500/5 rounded-2xl border border-emerald-500/20">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-emerald-600" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{language === "ar" ? "حجز آمن" : "Secure Booking"}</p>
                <p className="text-xs text-muted-foreground">{t.bookings.agreeToTerms}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Payment Processing Overlay */}
      {paymentState.isProcessing && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50">
          <div className="bg-card rounded-3xl p-8 m-4 max-w-sm w-full shadow-2xl">
            <PaymentProcessing
              isProcessing={paymentState.isProcessing}
              isSuccess={paymentState.isSuccess}
              error={paymentState.error}
              method={paymentMethod}
              amount={totalPrice}
              onRetry={() => setPaymentState({ isProcessing: false, isSuccess: false, error: null })}
            />
          </div>
        </div>
      )}

      {/* Error Display */}
      <ErrorDisplay
        error={bookingError}
        variant="toast"
        onRetry={() => setBookingError(null)}
        onDismiss={() => setBookingError(null)}
      />

      {/* Bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-card via-card to-card/80 backdrop-blur-lg border-t border-border/50 p-4 pb-6 safe-area-bottom">
        <Button
          size="lg"
          variant={step === 3 ? "gold" : "default"}
          className={`
            w-full h-14 rounded-2xl text-base font-semibold transition-all duration-300
            ${step < 3 
              ? "bg-primary hover:bg-primary/90" 
              : "bg-gradient-to-r from-primary to-primary/90 shadow-lg shadow-primary/30"
            }
          `}
          disabled={(step === 1 && (!selectedDate || !selectedTime)) || createBooking.isPending || isProcessingPayment}
          onClick={step === 3 ? handleConfirmBooking : handleNextStep}
        >
          {createBooking.isPending || isProcessingPayment ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-5 h-5 animate-spin" />
              {paymentMethod === "sadad" ? (t.payment?.processingPleaseWait || "Processing...") : (t.common.processing || "Processing...")}
            </span>
          ) : step === 3 ? (
            <span className="flex items-center gap-2">
              {paymentMethod === "sadad" ? (
                <>
                  <CreditCard className="w-5 h-5" />
                  {t.payment?.payWithSadad || "Pay with SADAD"} • {formatQAR(totalPrice)}
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  {t.bookings.confirmBooking || "Confirm Booking"} • {formatQAR(totalPrice)}
                </>
              )}
            </span>
          ) : (
            t.bookings.continue
          )}
        </Button>
      </div>
    </div>
  );
};

export default Booking;
