import { useState, useMemo } from "react";
import BottomNavigation from "@/components/BottomNavigation";
import AppHeader from "@/components/layout/AppHeader";
import { 
  Calendar, Clock, MapPin, MessageCircle, ChevronRight, 
  Sparkles, Star, CalendarCheck, History, AlertCircle,
  CheckCircle2, XCircle, Timer, CreditCard
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useUserBookings } from "@/hooks/useBookings";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { useConversations } from "@/hooks/useConversations";
import { formatBookingTime, formatQAR } from "@/lib/locale";
import { format, formatDistanceToNow, isToday, isTomorrow, differenceInDays } from "date-fns";
import { ar, enUS, type Locale } from "date-fns/locale";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

// Tab component
const TabButton = ({ 
  active, 
  onClick, 
  icon: Icon, 
  label, 
  count 
}: { 
  active: boolean; 
  onClick: () => void; 
  icon: React.ElementType; 
  label: string; 
  count: number;
}) => (
  <button
    onClick={onClick}
    className={`
      flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-medium transition-all duration-300
      ${active 
        ? "bg-primary text-white shadow-lg shadow-primary/25" 
        : "bg-muted/50 text-muted-foreground hover:bg-muted"
      }
    `}
  >
    <Icon className="w-4 h-4" />
    <span>{label}</span>
    {count > 0 && (
      <span className={`
        min-w-[20px] h-5 px-1.5 rounded-full text-xs font-bold flex items-center justify-center
        ${active ? "bg-white/20 text-white" : "bg-primary/10 text-primary"}
      `}>
        {count}
      </span>
    )}
  </button>
);

// Status badge component
const StatusBadge = ({ status, language }: { status: string; language: string }) => {
  const config: Record<string, { icon: React.ElementType; bg: string; text: string; label: string }> = {
    pending: { 
      icon: Timer, 
      bg: "bg-amber-500/10", 
      text: "text-amber-600",
      label: language === "ar" ? "قيد الانتظار" : "Pending"
    },
    confirmed: { 
      icon: CheckCircle2, 
      bg: "bg-green-500/10", 
      text: "text-green-600",
      label: language === "ar" ? "مؤكد" : "Confirmed"
    },
    completed: { 
      icon: Star, 
      bg: "bg-primary/10", 
      text: "text-primary",
      label: language === "ar" ? "مكتمل" : "Completed"
    },
    cancelled: { 
      icon: XCircle, 
      bg: "bg-red-500/10", 
      text: "text-red-500",
      label: language === "ar" ? "ملغي" : "Cancelled"
    },
  };

  const { icon: Icon, bg, text, label } = config[status] || config.pending;

  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${bg}`}>
      <Icon className={`w-3.5 h-3.5 ${text}`} />
      <span className={`text-xs font-semibold ${text}`}>{label}</span>
    </div>
  );
};

// Time until badge
const TimeUntilBadge = ({ date, language }: { date: Date; language: string }) => {
  const dateLocale = language === "ar" ? ar : enUS;
  
  if (isToday(date)) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 animate-pulse">
        <AlertCircle className="w-3.5 h-3.5 text-green-600" />
        <span className="text-xs font-semibold text-green-600">
          {language === "ar" ? "اليوم!" : "Today!"}
        </span>
      </div>
    );
  }
  
  if (isTomorrow(date)) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-500/10">
        <Clock className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-xs font-semibold text-amber-600">
          {language === "ar" ? "غداً" : "Tomorrow"}
        </span>
      </div>
    );
  }

  const days = differenceInDays(date, new Date());
  if (days <= 7) {
    return (
      <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-500/10">
        <Calendar className="w-3.5 h-3.5 text-blue-600" />
        <span className="text-xs font-semibold text-blue-600">
          {formatDistanceToNow(date, { addSuffix: true, locale: dateLocale })}
        </span>
      </div>
    );
  }

  return null;
};

// Booking card component
const BookingCard = ({ 
  booking, 
  isPast, 
  language, 
  dateLocale, 
  onOpenChat, 
  isChatLoading 
}: { 
  booking: any; 
  isPast: boolean; 
  language: string;
  dateLocale: Locale;
  onOpenChat: (e: React.MouseEvent, booking: any) => void;
  isChatLoading: boolean;
}) => {
  const bookingDate = new Date(booking.booking_date);
  
  return (
    <Link to={`/bookings/${booking.id}`}>
      <div className={`
        group relative bg-card rounded-2xl border border-border overflow-hidden
        transition-all duration-300 hover:border-primary/50 hover:shadow-lg hover:shadow-primary/5
        ${isPast ? "opacity-75" : ""}
      `}>
        {/* Gradient accent for upcoming */}
        {!isPast && booking.status === "confirmed" && (
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-primary/80 to-primary" />
        )}
        
        <div className="p-4">
          {/* Header with artist info */}
          <div className="flex items-start gap-3">
            <div className="relative">
              <Avatar className={`w-14 h-14 rounded-2xl ring-2 ring-border ${isPast ? "grayscale" : ""}`}>
                <AvatarImage
                  src={booking.artist?.featured_image || booking.artist?.profile?.avatar_url || undefined}
                  alt={booking.artist?.profile?.full_name || "Artist"}
                  className="object-cover"
                />
                <AvatarFallback className="rounded-2xl bg-primary/10 text-primary text-lg font-semibold">
                  {booking.artist?.profile?.full_name?.charAt(0) || "A"}
                </AvatarFallback>
              </Avatar>
              {!isPast && booking.status === "confirmed" && (
                <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center ring-2 ring-card">
                  <CheckCircle2 className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <h3 className="font-semibold text-foreground truncate">
                    {booking.artist?.profile?.full_name || "Artist"}
                  </h3>
                  <div className="flex items-center gap-1.5 mt-0.5">
                    <Sparkles className="w-3.5 h-3.5 text-primary" />
                    <p className="text-sm text-primary font-medium truncate">
                      {booking.service?.name || "Service"}
                    </p>
                  </div>
                </div>
                <StatusBadge status={booking.status} language={language} />
              </div>
            </div>
          </div>

          {/* Booking details */}
          <div className="mt-4 p-3 bg-muted/30 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="w-4 h-4 text-muted-foreground" />
                <span className="text-foreground font-medium">
                  {format(bookingDate, "EEEE, d MMMM", { locale: dateLocale })}
                </span>
              </div>
              {!isPast && <TimeUntilBadge date={bookingDate} language={language} />}
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <Clock className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground">
                {formatBookingTime(booking.booking_time)}
              </span>
            </div>
            
            <div className="flex items-center gap-2 text-sm">
              <MapPin className="w-4 h-4 text-muted-foreground" />
              <span className="text-muted-foreground truncate">
                {booking.location_type === "client_home" 
                  ? (language === "ar" ? "في منزلي" : "At my location")
                  : (language === "ar" ? "في الاستوديو" : "At studio")
                }
              </span>
            </div>

            {/* Price */}
            <div className="flex items-center justify-between pt-2 border-t border-border/50">
              <div className="flex items-center gap-2 text-sm">
                <CreditCard className="w-4 h-4 text-muted-foreground" />
                <span className="text-muted-foreground">
                  {booking.payment_status === "completed" 
                    ? (language === "ar" ? "تم الدفع" : "Paid")
                    : (language === "ar" ? "عند الموعد" : "Pay at appointment")
                  }
                </span>
              </div>
              <span className="font-bold text-foreground">
                {formatQAR(booking.total_price)}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 mt-4">
            {!isPast && booking.status !== "cancelled" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-10 rounded-xl"
                onClick={(e) => onOpenChat(e, booking)}
                disabled={isChatLoading}
              >
                <MessageCircle className="w-4 h-4 me-1.5" />
                {language === "ar" ? "محادثة" : "Chat"}
              </Button>
            )}
            
            {isPast && booking.status === "completed" && (
              <Button 
                variant="outline" 
                size="sm" 
                className="flex-1 h-10 rounded-xl"
                onClick={(e) => e.preventDefault()}
              >
                <Star className="w-4 h-4 me-1.5" />
                {language === "ar" ? "تقييم" : "Review"}
              </Button>
            )}
            
            <Button 
              variant="soft" 
              size="sm" 
              className="flex-1 h-10 rounded-xl group-hover:bg-primary group-hover:text-white transition-colors"
            >
              {language === "ar" ? "التفاصيل" : "Details"}
              <ChevronRight className="w-4 h-4 ms-1" />
            </Button>
          </div>
        </div>
      </div>
    </Link>
  );
};

// Empty state component
const EmptyState = ({ 
  type, 
  language 
}: { 
  type: "upcoming" | "past" | "login"; 
  language: string;
}) => {
  const config = {
    upcoming: {
      icon: CalendarCheck,
      title: language === "ar" ? "لا توجد حجوزات قادمة" : "No Upcoming Bookings",
      description: language === "ar" 
        ? "ابحثي عن فنانة مكياج واحجزي موعدك الآن" 
        : "Find a makeup artist and book your appointment",
      action: {
        label: language === "ar" ? "استكشفي الفنانات" : "Explore Artists",
        to: "/makeup-artists"
      }
    },
    past: {
      icon: History,
      title: language === "ar" ? "لا توجد حجوزات سابقة" : "No Past Bookings",
      description: language === "ar" 
        ? "سيظهر هنا سجل حجوزاتك" 
        : "Your booking history will appear here",
      action: null
    },
    login: {
      icon: Calendar,
      title: language === "ar" ? "تسجيل الدخول مطلوب" : "Login Required",
      description: language === "ar" 
        ? "سجلي دخولك لعرض حجوزاتك" 
        : "Please login to view your bookings",
      action: {
        label: language === "ar" ? "تسجيل الدخول" : "Login",
        to: "/auth"
      }
    }
  };

  const { icon: Icon, title, description, action } = config[type];

  return (
    <div className="flex flex-col items-center justify-center py-16 px-6 text-center">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mb-6">
        <Icon className="w-10 h-10 text-primary" />
      </div>
      <h3 className="text-xl font-semibold text-foreground mb-2">{title}</h3>
      <p className="text-muted-foreground mb-6 max-w-xs">{description}</p>
      {action && (
        <Link to={action.to}>
          <Button size="lg" className="rounded-xl px-8">
            {action.label}
          </Button>
        </Link>
      )}
    </div>
  );
};

// Main component
const Bookings = () => {
  const [activeTab, setActiveTab] = useState<"upcoming" | "past">("upcoming");
  const { user, loading: authLoading } = useAuth();
  const { data: bookings, isLoading } = useUserBookings();
  const { t, language } = useLanguage();
  const { getOrCreateBookingConversation } = useConversations();
  const navigate = useNavigate();
  
  const dateLocale = language === "ar" ? ar : enUS;

  const handleOpenChat = async (e: React.MouseEvent, booking: any) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const conversationId = await getOrCreateBookingConversation.mutateAsync({
        artistId: booking.artist_id,
        bookingId: booking.id,
      });
      navigate(`/chat/${conversationId}`);
    } catch (error) {
      toast.error(t.errors.somethingWrong);
    }
  };

  const { upcoming = [], past = [] } = bookings || {};

  // Sort upcoming bookings by date (nearest first)
  const sortedUpcoming = useMemo(() => {
    return [...upcoming].sort((a, b) => 
      new Date(a.booking_date).getTime() - new Date(b.booking_date).getTime()
    );
  }, [upcoming]);

  // Sort past bookings by date (most recent first)
  const sortedPast = useMemo(() => {
    return [...past].sort((a, b) => 
      new Date(b.booking_date).getTime() - new Date(a.booking_date).getTime()
    );
  }, [past]);

  if (authLoading || isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32">
        <AppHeader title={t.bookings.title} style="modern" showBack={true}>
          <div className="flex gap-2 mt-4">
            <Skeleton className="h-12 flex-1 rounded-xl" />
            <Skeleton className="h-12 flex-1 rounded-xl" />
          </div>
        </AppHeader>
        <div className="px-5 py-4">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <Skeleton key={i} className="h-48 w-full rounded-2xl" />
            ))}
          </div>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32">
        <AppHeader title={t.bookings.title} style="modern" />
        <EmptyState type="login" language={language} />
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-background to-primary/5 pb-32">
      {/* Header */}
      <AppHeader title={t.bookings.title} style="modern" showBack={true}>
        {/* Tabs */}
        <div className="flex gap-2 mt-4">
          <TabButton
            active={activeTab === "upcoming"}
            onClick={() => setActiveTab("upcoming")}
            icon={CalendarCheck}
            label={language === "ar" ? "القادمة" : "Upcoming"}
            count={sortedUpcoming.length}
          />
          <TabButton
            active={activeTab === "past"}
            onClick={() => setActiveTab("past")}
            icon={History}
            label={language === "ar" ? "السابقة" : "Past"}
            count={sortedPast.length}
          />
        </div>
      </AppHeader>

      {/* Content */}
      <div className="px-5 py-4">
        {activeTab === "upcoming" && (
          <div className="animate-fade-in">
            {sortedUpcoming.length > 0 ? (
              <div className="space-y-4">
                {sortedUpcoming.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <BookingCard
                      booking={booking}
                      isPast={false}
                      language={language}
                      dateLocale={dateLocale}
                      onOpenChat={handleOpenChat}
                      isChatLoading={getOrCreateBookingConversation.isPending}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState type="upcoming" language={language} />
            )}
          </div>
        )}

        {activeTab === "past" && (
          <div className="animate-fade-in">
            {sortedPast.length > 0 ? (
              <div className="space-y-4">
                {sortedPast.map((booking, index) => (
                  <div 
                    key={booking.id} 
                    className="animate-fade-in"
                    style={{ animationDelay: `${index * 100}ms` }}
                  >
                    <BookingCard
                      booking={booking}
                      isPast={true}
                      language={language}
                      dateLocale={dateLocale}
                      onOpenChat={handleOpenChat}
                      isChatLoading={getOrCreateBookingConversation.isPending}
                    />
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState type="past" language={language} />
            )}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default Bookings;
