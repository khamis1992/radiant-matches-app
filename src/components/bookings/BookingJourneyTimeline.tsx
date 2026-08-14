import { CheckCircle2, Circle, Clock3, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface BookingJourneyTimelineProps {
  status: string;
  arrivalStatus?: string | null;
  language: string;
}

export const BookingJourneyTimeline = ({ status, arrivalStatus, language }: BookingJourneyTimelineProps) => {
  const isArabic = language === "ar";
  const cancelled = status === "cancelled";
  const steps = [
    { key: "requested", label: isArabic ? "تم إرسال الطلب" : "Request sent", complete: true },
    { key: "confirmed", label: isArabic ? "تأكيد الفنانة" : "Artist confirmation", complete: ["confirmed", "completed"].includes(status) },
    { key: "arrival", label: isArabic ? "في الطريق / الوصول" : "On the way / arrived", complete: arrivalStatus === "en_route" || arrivalStatus === "arrived" || status === "completed" },
    { key: "completed", label: isArabic ? "اكتمل الموعد" : "Appointment completed", complete: status === "completed" },
  ];

  return (
    <section className="rounded-2xl border border-border bg-card p-4">
      <div className="mb-4 flex items-center gap-2">
        <Sparkles className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-foreground">{isArabic ? "حالة الحجز" : "Booking status"}</h3>
      </div>
      {cancelled ? (
        <div className="rounded-xl bg-destructive/10 p-3 text-sm text-destructive">
          {isArabic ? "تم إلغاء هذا الحجز. يمكنك اختيار بديل متاح إذا ظهر زر البدائل أدناه." : "This booking was cancelled. You can select an available alternative if shown below."}
        </div>
      ) : (
        <ol className="space-y-3">
          {steps.map((step, index) => {
            const isCurrent = !step.complete && steps.slice(0, index).every((previous) => previous.complete);
            return (
              <li key={step.key} className="flex items-center gap-3">
                <div className={cn("grid h-7 w-7 place-items-center rounded-full", step.complete ? "bg-emerald-500/15 text-emerald-600" : isCurrent ? "bg-primary/15 text-primary" : "bg-muted text-muted-foreground")}>
                  {step.complete ? <CheckCircle2 className="h-4 w-4" /> : isCurrent ? <Clock3 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                </div>
                <span className={cn("text-sm", step.complete || isCurrent ? "font-medium text-foreground" : "text-muted-foreground")}>{step.label}</span>
              </li>
            );
          })}
        </ol>
      )}
    </section>
  );
};
