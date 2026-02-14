import { useState } from "react";
import { X, Clock, MapPin, Banknote, Check, X as XIcon, User, ExternalLink, Navigation } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Sheet, SheetContent } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

interface Booking {
  id: string;
  customer?: {
    full_name: string;
    avatar_url?: string;
  };
  service?: { name: string };
  booking_date: string;
  booking_time: string;
  location_type: string;
  location_address?: string;
  total_price: number;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  notes?: string;
}

interface BookingBottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  date: Date;
  bookings: Booking[];
  onConfirm: (bookingId: string) => void;
  onDecline: (bookingId: string) => void;
  onComplete: (bookingId: string) => void;
  isUpdating: boolean;
  language: string;
}

export const BookingBottomSheet = ({
  isOpen,
  onClose,
  date,
  bookings,
  onConfirm,
  onDecline,
  onComplete,
  isUpdating,
  language,
}: BookingBottomSheetProps) => {
  const [swipedBookingId, setSwipedBookingId] = useState<string | null>(null);
  const isRTL = language === "ar";
  const locale = language === "ar" ? ar : enUS;

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
      confirmed: "bg-primary/10 text-primary border-primary/20",
      completed: "bg-green-500/10 text-green-600 border-green-500/20",
      cancelled: "bg-destructive/10 text-destructive border-destructive/20",
    };
    return styles[status] || styles.pending;
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, { en: string; ar: string }> = {
      pending: { en: "Pending", ar: "في الانتظار" },
      confirmed: { en: "Confirmed", ar: "مؤكد" },
      completed: { en: "Completed", ar: "مكتمل" },
      cancelled: { en: "Cancelled", ar: "ملغي" },
    };
    return labels[status]?.[language === "ar" ? "ar" : "en"] || status;
  };

  const getBorderColor = (status: string) => {
    const colors: Record<string, string> = {
      pending: "border-yellow-500",
      confirmed: "border-primary",
      completed: "border-green-500",
      cancelled: "border-destructive",
    };
    return colors[status] || "border-gray-300";
  };

  const handleAction = (action: (id: string) => void, bookingId: string) => {
    if (!isUpdating) {
      action(bookingId);
    }
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent
        side="bottom"
        className={cn(
          "rounded-t-3xl max-h-[85vh] overflow-y-auto",
          isRTL ? "rtl" : "ltr"
        )}
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), 24px)" }}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div className="w-9 h-1 bg-gray-300 rounded-full" />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-4 pb-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">
            {format(date, "EEEE, d MMMM", { locale })}
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        {/* Bookings List */}
        <div className="px-4 py-4 space-y-4">
          {bookings.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
                <User className="w-8 h-8 text-muted-foreground" />
              </div>
              <p className="text-muted-foreground">
                {language === "ar" ? "لا توجد حجوزات في هذا اليوم" : "No bookings this day"}
              </p>
            </div>
          ) : (
            bookings.map((booking) => (
              <div
                key={booking.id}
                className={cn(
                  "bg-card rounded-xl border border-border overflow-hidden",
                  booking.status === "cancelled" && "opacity-50"
                )}
              >
                {/* Top Accent Line */}
                <div className={cn("h-1", getBorderColor(booking.status))} />

                <div className="p-4">
                  {/* Customer Info */}
                  <div className="flex items-start gap-3 mb-3">
                    <Avatar className="w-10 h-10">
                      <AvatarImage src={booking.customer?.avatar_url} />
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {booking.customer?.full_name?.charAt(0) || "?"}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="font-semibold text-foreground">
                          {booking.customer?.full_name || (language === "ar" ? "عميل" : "Customer")}
                        </h3>
                        <span
                          className={cn(
                            "px-2 py-0.5 text-xs font-medium rounded-full border shrink-0",
                            getStatusBadge(booking.status)
                          )}
                        >
                          {getStatusLabel(booking.status)}
                        </span>
                      </div>
                      <p className="text-sm text-primary mt-0.5">{booking.service?.name}</p>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="border-t border-border my-3" />

                  {/* Booking Details */}
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Clock className="w-4 h-4 shrink-0" />
                      <span>{booking.booking_time}</span>
                    </div>
                    {booking.location_address ? (() => {
                      const latMatch = booking.location_address.match(/Lat:\s*([\d.-]+)/);
                      const lngMatch = booking.location_address.match(/Lng:\s*([\d.-]+)/);
                      const lat = latMatch?.[1];
                      const lng = lngMatch?.[1];
                      const hasValidCoords = lat && lng && lat !== '0' && lng !== '0';
                      const mapsUrl = hasValidCoords
                        ? `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`
                        : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.location_address)}`;
                      
                      // Parse readable address parts
                      const addressParts = booking.location_address.match(/Area:\s*([^,]*),\s*Street:\s*([^,]*),\s*Building:\s*([^,]*)/);
                      const area = addressParts?.[1]?.trim();
                      const street = addressParts?.[2]?.trim();
                      const building = addressParts?.[3]?.trim();

                      return (
                        <div className="space-y-3">
                          {/* Qatar Address Plate */}
                          {(area || street || building) ? (
                            <div className="rounded-xl overflow-hidden border border-border">
                              {/* Building row - top accent */}
                              <div className="bg-primary/15 px-3 py-2">
                                <p className="text-[10px] font-medium text-primary/70 uppercase tracking-wider">
                                  {language === "ar" ? "مبنى" : "Building"}
                                </p>
                                <p className="text-base font-bold text-primary text-center">
                                  {building || "—"}
                                </p>
                              </div>
                              {/* Zone & Street row */}
                              <div className="grid grid-cols-2 divide-x divide-border">
                                <div className="px-3 py-2 text-center">
                                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {language === "ar" ? "منطقة" : "Zone"}
                                  </p>
                                  <p className="text-sm font-semibold text-foreground">{area || "—"}</p>
                                </div>
                                <div className="px-3 py-2 text-center">
                                  <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wider">
                                    {language === "ar" ? "شارع" : "Street"}
                                  </p>
                                  <p className="text-sm font-semibold text-foreground">{street || "—"}</p>
                                </div>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 shrink-0 mt-0.5" />
                              <span className="text-sm">{booking.location_address}</span>
                            </div>
                          )}
                          {/* Google Maps Button */}
                          <a
                            href={mapsUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors w-full"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Navigation className="w-4 h-4" />
                            {language === "ar" ? "فتح في خرائط جوجل" : "Open in Google Maps"}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      );
                    })() : (
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{booking.location_type === "client_home" 
                          ? (language === "ar" ? "منزل العميل" : "Client's Home")
                          : (language === "ar" ? "الاستوديو" : "Studio")
                        }</span>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Banknote className="w-4 h-4 shrink-0" />
                      <span>QAR {booking.total_price}</span>
                    </div>
                  </div>

                  {/* Action Buttons */}
                  {booking.status === "pending" && (
                    <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAction(onDecline, booking.id)}
                        disabled={isUpdating}
                      >
                        <XIcon className={cn("w-4 h-4", isRTL ? "ml-1" : "mr-1")} />
                        {language === "ar" ? "رفض" : "Decline"}
                      </Button>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => handleAction(onConfirm, booking.id)}
                        disabled={isUpdating}
                      >
                        <Check className={cn("w-4 h-4", isRTL ? "ml-1" : "mr-1")} />
                        {language === "ar" ? "تأكيد" : "Confirm"}
                      </Button>
                    </div>
                  )}

                  {booking.status === "confirmed" && (
                    <div className="mt-4 pt-4 border-t border-border">
                      <Button
                        size="sm"
                        className="w-full"
                        onClick={() => handleAction(onComplete, booking.id)}
                        disabled={isUpdating}
                      >
                        <Check className={cn("w-4 h-4", isRTL ? "ml-1" : "mr-1")} />
                        {language === "ar" ? "وضع علامة كمكتمل" : "Mark Complete"}
                      </Button>
                    </div>
                  )}

                  {booking.notes && (
                    <div className="mt-3 pt-3 border-t border-border">
                      <p className="text-xs text-muted-foreground">
                        <span className="font-medium">
                          {language === "ar" ? "ملاحظة: " : "Note: "}
                        </span>
                        {booking.notes}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default BookingBottomSheet;
