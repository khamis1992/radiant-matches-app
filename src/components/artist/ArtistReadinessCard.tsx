import { CheckCircle2, Circle, ClipboardCheck, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface ArtistReadinessState {
  profile: boolean;
  services: boolean;
  areas: boolean;
  hours: boolean;
  portfolio: boolean;
}

interface ArtistReadinessCardProps {
  readiness: ArtistReadinessState;
  onboardingStatus?: string;
  language: string;
  onNavigate: (path: string) => void;
}

export const ArtistReadinessCard = ({
  readiness,
  onboardingStatus = "approved",
  language,
  onNavigate,
}: ArtistReadinessCardProps) => {
  const isArabic = language === "ar";
  const steps = [
    { key: "profile", label: isArabic ? "أكملي بيانات الملف" : "Complete profile", path: "/edit-profile" },
    { key: "services", label: isArabic ? "أضيفي خدماتك وأسعارك" : "Add services and prices", path: "/artist-services" },
    { key: "areas", label: isArabic ? "حددي مناطق الخدمة" : "Set service areas", path: "/artist-profile?setup=areas" },
    { key: "hours", label: isArabic ? "أضيفي ساعات العمل" : "Set working hours", path: "/artist-profile?setup=hours" },
    { key: "portfolio", label: isArabic ? "أضيفي أعمالك" : "Add portfolio work", path: "/artist-gallery" },
  ] as const;

  const completed = steps.filter((step) => readiness[step.key]).length;
  const isReady = completed === steps.length;
  const statusText = onboardingStatus === "pending_review"
    ? (isArabic ? "ملفك قيد المراجعة" : "Your profile is under review")
    : onboardingStatus === "rejected"
      ? (isArabic ? "يلزم تحديث الملف قبل المراجعة" : "Update your profile before review")
      : isReady
        ? (isArabic ? "ملفك جاهز لاستقبال الحجوزات" : "Your profile is ready for bookings")
        : (isArabic ? "أكملي إعداد ملفك لاستقبال الحجوزات" : "Complete your setup to receive bookings");

  const firstMissing = steps.find((step) => !readiness[step.key]);

  return (
    <section className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-card to-card p-4 shadow-sm">
      <div className="flex items-start gap-3">
        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-primary text-primary-foreground">
          {isReady ? <ShieldCheck className="h-5 w-5" /> : <ClipboardCheck className="h-5 w-5" />}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <h3 className="font-bold text-foreground">{isArabic ? "جاهزية الملف" : "Profile readiness"}</h3>
            <span className="rounded-full bg-background px-2.5 py-1 text-xs font-semibold text-primary">
              {completed}/{steps.length}
            </span>
          </div>
          <p className="mt-1 text-sm leading-5 text-muted-foreground">{statusText}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        {steps.map((step) => {
          const done = readiness[step.key];
          return (
            <button
              type="button"
              key={step.key}
              onClick={() => !done && onNavigate(step.path)}
              className={cn(
                "flex w-full items-center gap-2 rounded-xl px-2 py-1.5 text-start text-sm",
                done ? "text-muted-foreground" : "bg-background/70 font-medium text-foreground hover:bg-background"
              )}
            >
              {done ? <CheckCircle2 className="h-4 w-4 text-emerald-600" /> : <Circle className="h-4 w-4 text-primary" />}
              <span className={done ? "line-through decoration-muted-foreground/50" : ""}>{step.label}</span>
            </button>
          );
        })}
      </div>

      {!isReady && firstMissing && (
        <Button className="mt-4 w-full" onClick={() => onNavigate(firstMissing.path)}>
          {isArabic ? "إكمال الخطوة التالية" : "Complete next step"}
        </Button>
      )}
    </section>
  );
};
