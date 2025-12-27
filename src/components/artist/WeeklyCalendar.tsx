import { useState, useMemo } from "react";
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon,
  Clock,
  MapPin,
  User,
  Phone,
  X,
  Check,
  ExternalLink
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { 
  format, 
  startOfWeek, 
  endOfWeek, 
  eachDayOfInterval, 
  addWeeks, 
  subWeeks,
  isSameDay,
  isToday,
  addDays,
  startOfDay,
  parseISO
} from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { formatBookingTime } from "@/lib/locale";
import type { ArtistBooking } from "@/hooks/useArtistDashboard";

// أنواع العرض المتاحة
type ViewType = "day" | "week" | "month";

interface WeeklyCalendarProps {
  bookings: ArtistBooking[];
  language: string;
  isRTL: boolean;
  onConfirm: (bookingId: string) => void;
  onDecline: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  isUpdating?: boolean;
}

// ساعات العمل (8 صباحاً - 9 مساءً)
const HOURS = Array.from({ length: 14 }, (_, i) => i + 8);

// تحويل وقت الحجز إلى ساعة رقمية
const parseBookingHour = (timeStr: string): number => {
  if (!timeStr) return 9;
  const [hours] = timeStr.split(":").map(Number);
  return hours || 9;
};

// ألوان الحالات
const statusColors: Record<string, { bg: string; border: string; text: string }> = {
  pending: { bg: "bg-amber-500/20", border: "border-amber-500/50", text: "text-amber-700" },
  confirmed: { bg: "bg-blue-500/20", border: "border-blue-500/50", text: "text-blue-700" },
  completed: { bg: "bg-green-500/20", border: "border-green-500/50", text: "text-green-700" },
  cancelled: { bg: "bg-red-500/20", border: "border-red-500/50", text: "text-red-700" },
};

const statusLabels: Record<string, { ar: string; en: string }> = {
  pending: { ar: "قيد الانتظار", en: "Pending" },
  confirmed: { ar: "مؤكد", en: "Confirmed" },
  completed: { ar: "مكتمل", en: "Completed" },
  cancelled: { ar: "ملغي", en: "Cancelled" },
};

// مكون بطاقة الحجز داخل التقويم
const BookingEvent = ({ 
  booking, 
  language,
  isRTL,
  onConfirm,
  onDecline,
  onComplete,
  isUpdating
}: { 
  booking: ArtistBooking;
  language: string;
  isRTL: boolean;
  onConfirm: (id: string) => void;
  onDecline: (id: string) => void;
  onComplete: (id: string) => void;
  isUpdating?: boolean;
}) => {
  const colors = statusColors[booking.status] || statusColors.pending;
  const duration = booking.service?.duration_minutes || 60;
  const heightBlocks = Math.max(1, Math.ceil(duration / 60));
  
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          className={cn(
            "absolute inset-x-1 rounded-lg border-2 p-2 text-start transition-all",
            "hover:shadow-lg hover:scale-[1.02] cursor-pointer overflow-hidden",
            colors.bg, colors.border
          )}
          style={{ 
            height: `${heightBlocks * 60 - 8}px`,
            minHeight: "52px"
          }}
        >
          <div className="flex flex-col h-full">
            <p className={cn("text-xs font-bold truncate", colors.text)}>
              {booking.customer?.full_name || (language === "ar" ? "عميل" : "Customer")}
            </p>
            <p className="text-[10px] text-muted-foreground truncate">
              {booking.service?.name}
            </p>
            <p className="text-[10px] text-muted-foreground mt-auto">
              {formatBookingTime(booking.booking_time)}
            </p>
          </div>
        </button>
      </PopoverTrigger>
      
      <PopoverContent 
        className="w-80 p-0" 
        side={isRTL ? "left" : "right"}
        align="start"
      >
        {/* رأس النافذة */}
        <div className={cn(
          "p-4 border-b",
          colors.bg
        )}>
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-lg">
                {booking.service?.name || (language === "ar" ? "خدمة" : "Service")}
              </h3>
              <Badge variant="outline" className={cn("mt-1", colors.text, colors.border)}>
                {statusLabels[booking.status]?.[language === "ar" ? "ar" : "en"] || booking.status}
              </Badge>
            </div>
          </div>
        </div>
        
        {/* محتوى النافذة */}
        <div className="p-4 space-y-4">
          {/* التاريخ والوقت */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
              <CalendarIcon className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {format(parseISO(booking.booking_date), "EEEE, d MMMM", { 
                  locale: language === "ar" ? ar : enUS 
                })}
              </p>
              <p className="text-xs text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatBookingTime(booking.booking_time)}
                {booking.service?.duration_minutes && (
                  <span className="text-muted-foreground">
                    • {booking.service.duration_minutes} {language === "ar" ? "دقيقة" : "min"}
                  </span>
                )}
              </p>
            </div>
          </div>
          
          {/* معلومات العميل */}
          <div className="flex items-center gap-3">
            <Avatar className="w-10 h-10">
              <AvatarImage src={booking.customer?.avatar_url || undefined} />
              <AvatarFallback className="bg-primary/10 text-primary">
                {booking.customer?.full_name?.charAt(0) || "?"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-medium">
                {booking.customer?.full_name || (language === "ar" ? "عميل" : "Customer")}
              </p>
              {booking.customer?.email && (
                <p className="text-xs text-muted-foreground truncate">
                  {booking.customer.email}
                </p>
              )}
            </div>
          </div>
          
          {/* الموقع */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <MapPin className="w-5 h-5 text-muted-foreground" />
            </div>
            <div>
              <p className="text-sm font-medium">
                {booking.location_type === "studio" 
                  ? (language === "ar" ? "في الاستوديو" : "At Studio")
                  : (language === "ar" ? "في منزل العميل" : "At Client's Home")
                }
              </p>
              {booking.location_address && (
                <p className="text-xs text-muted-foreground truncate max-w-[200px]">
                  {booking.location_address}
                </p>
              )}
            </div>
          </div>
          
          {/* السعر */}
          <div className="flex items-center justify-between pt-2 border-t">
            <span className="text-sm text-muted-foreground">
              {language === "ar" ? "السعر الإجمالي" : "Total Price"}
            </span>
            <span className="font-bold text-lg">
              {booking.total_price} {language === "ar" ? "ر.ق" : "QAR"}
            </span>
          </div>
          
          {/* الملاحظات */}
          {booking.notes && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground mb-1">
                {language === "ar" ? "ملاحظات" : "Notes"}
              </p>
              <p className="text-sm bg-muted/50 p-2 rounded-lg">
                {booking.notes}
              </p>
            </div>
          )}
        </div>
        
        {/* أزرار الإجراءات */}
        {booking.status === "pending" && (
          <div className="flex gap-2 p-4 pt-0">
            <Button 
              variant="outline" 
              size="sm" 
              className="flex-1"
              onClick={() => onDecline(booking.id)}
              disabled={isUpdating}
            >
              <X className="w-4 h-4 me-1" />
              {language === "ar" ? "رفض" : "Decline"}
            </Button>
            <Button 
              size="sm" 
              className="flex-1"
              onClick={() => onConfirm(booking.id)}
              disabled={isUpdating}
            >
              <Check className="w-4 h-4 me-1" />
              {language === "ar" ? "تأكيد" : "Confirm"}
            </Button>
          </div>
        )}
        
        {booking.status === "confirmed" && (
          <div className="p-4 pt-0">
            <Button 
              size="sm" 
              className="w-full"
              onClick={() => onComplete(booking.id)}
              disabled={isUpdating}
            >
              <Check className="w-4 h-4 me-1" />
              {language === "ar" ? "تحديد كمكتمل" : "Mark Complete"}
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};

// المكون الرئيسي
const WeeklyCalendar = ({
  bookings,
  language,
  isRTL,
  onConfirm,
  onDecline,
  onComplete,
  isUpdating
}: WeeklyCalendarProps) => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewType, setViewType] = useState<ViewType>("week");
  
  const dateLocale = language === "ar" ? ar : enUS;
  
  // حساب أيام الأسبوع الحالي
  const weekDays = useMemo(() => {
    const start = startOfWeek(currentDate, { weekStartsOn: 0 });
    const end = endOfWeek(currentDate, { weekStartsOn: 0 });
    return eachDayOfInterval({ start, end });
  }, [currentDate]);
  
  // تجميع الحجوزات حسب اليوم
  const bookingsByDay = useMemo(() => {
    const map = new Map<string, ArtistBooking[]>();
    
    bookings.forEach(booking => {
      const dateKey = booking.booking_date;
      if (!map.has(dateKey)) {
        map.set(dateKey, []);
      }
      map.get(dateKey)!.push(booking);
    });
    
    return map;
  }, [bookings]);
  
  // التنقل بين الأسابيع
  const goToPreviousWeek = () => setCurrentDate(prev => subWeeks(prev, 1));
  const goToNextWeek = () => setCurrentDate(prev => addWeeks(prev, 1));
  const goToToday = () => setCurrentDate(new Date());
  
  return (
    <div className="bg-card rounded-2xl border border-border overflow-hidden">
      {/* رأس التقويم */}
      <div className="flex items-center justify-between p-4 border-b bg-muted/30">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={goToPreviousWeek}>
            {isRTL ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          <Button variant="outline" size="icon" onClick={goToNextWeek}>
            {isRTL ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            {language === "ar" ? "اليوم" : "Today"}
          </Button>
          <h2 className="text-lg font-bold ms-2">
            {format(currentDate, "MMMM yyyy", { locale: dateLocale })}
          </h2>
        </div>
        
        {/* أزرار تبديل العرض */}
        <div className="flex bg-muted rounded-lg p-1">
          {(["day", "week", "month"] as ViewType[]).map((view) => (
            <button
              key={view}
              onClick={() => setViewType(view)}
              className={cn(
                "px-3 py-1.5 text-sm font-medium rounded-md transition-all",
                viewType === view 
                  ? "bg-primary text-white shadow-sm" 
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {view === "day" && (language === "ar" ? "يوم" : "Day")}
              {view === "week" && (language === "ar" ? "أسبوع" : "Week")}
              {view === "month" && (language === "ar" ? "شهر" : "Month")}
            </button>
          ))}
        </div>
      </div>
      
      {/* شبكة التقويم */}
      <div className="overflow-x-auto">
        <div className="min-w-[800px]">
          {/* رأس الأيام */}
          <div className="grid grid-cols-8 border-b">
            {/* خلية الوقت الفارغة */}
            <div className="p-3 text-center text-sm font-medium text-muted-foreground border-e">
              {/* فارغ */}
            </div>
            
            {/* أيام الأسبوع */}
            {weekDays.map((day, index) => {
              const dayBookings = bookingsByDay.get(format(day, "yyyy-MM-dd")) || [];
              const hasBookings = dayBookings.length > 0;
              
              return (
                <div 
                  key={index}
                  className={cn(
                    "p-3 text-center border-e last:border-e-0",
                    isToday(day) && "bg-primary/5"
                  )}
                >
                  <p className="text-xs text-muted-foreground uppercase">
                    {format(day, "EEE", { locale: dateLocale })}
                  </p>
                  <p className={cn(
                    "text-lg font-bold mt-1 w-9 h-9 mx-auto rounded-full flex items-center justify-center",
                    isToday(day) && "bg-primary text-white"
                  )}>
                    {format(day, "d")}
                  </p>
                  {hasBookings && (
                    <div className="flex justify-center mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                    </div>
                  )}
                </div>
              );
            })}
          </div>
          
          {/* شبكة الساعات */}
          <div className="relative">
            {HOURS.map((hour) => (
              <div key={hour} className="grid grid-cols-8 border-b last:border-b-0" style={{ height: "60px" }}>
                {/* عمود الوقت */}
                <div className="p-2 text-xs text-muted-foreground text-center border-e flex items-start justify-center pt-1">
                  {format(new Date().setHours(hour, 0, 0, 0), "h:mm a", { locale: dateLocale })}
                </div>
                
                {/* خلايا الأيام */}
                {weekDays.map((day, dayIndex) => {
                  const dayKey = format(day, "yyyy-MM-dd");
                  const dayBookings = bookingsByDay.get(dayKey) || [];
                  const hourBookings = dayBookings.filter(b => {
                    const bookingHour = parseBookingHour(b.booking_time);
                    return bookingHour === hour;
                  });
                  
                  return (
                    <div 
                      key={dayIndex}
                      className={cn(
                        "relative border-e last:border-e-0",
                        isToday(day) && "bg-primary/5"
                      )}
                    >
                      {hourBookings.map((booking) => (
                        <BookingEvent
                          key={booking.id}
                          booking={booking}
                          language={language}
                          isRTL={isRTL}
                          onConfirm={onConfirm}
                          onDecline={onDecline}
                          onComplete={onComplete}
                          isUpdating={isUpdating}
                        />
                      ))}
                    </div>
                  );
                })}
              </div>
            ))}
          </div>
        </div>
      </div>
      
      {/* دليل الألوان */}
      <div className="flex items-center justify-center gap-4 p-3 border-t bg-muted/20">
        {Object.entries(statusLabels).map(([status, labels]) => (
          <div key={status} className="flex items-center gap-1.5">
            <div className={cn(
              "w-3 h-3 rounded-full border-2",
              statusColors[status]?.bg,
              statusColors[status]?.border
            )} />
            <span className="text-xs text-muted-foreground">
              {language === "ar" ? labels.ar : labels.en}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default WeeklyCalendar;

