import { useState, useEffect } from "react";
import { Camera, MapPin, Bell } from "lucide-react";
import { Button } from "@/components/ui/button";

interface PermissionItem {
  id: string;
  icon: React.ReactNode;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  request: () => Promise<boolean>;
}

const requestNotificationPermission = async (): Promise<boolean> => {
  if (!("Notification" in window)) return false;
  const result = await Notification.requestPermission();
  return result === "granted";
};

const requestCameraPermission = async (): Promise<boolean> => {
  try {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    stream.getTracks().forEach((t) => t.stop());
    return true;
  } catch {
    return false;
  }
};

const requestLocationPermission = async (): Promise<boolean> => {
  if (!("geolocation" in navigator)) return false;
  return new Promise((resolve) => {
    navigator.geolocation.getCurrentPosition(
      () => resolve(true),
      () => resolve(false),
      { timeout: 10000 }
    );
  });
};

const PERMISSIONS: PermissionItem[] = [
  {
    id: "notifications",
    icon: <Bell className="w-7 h-7" />,
    titleEn: "Stay in the Loop",
    titleAr: "ابقي على اطلاع",
    descEn: "Get notified about booking confirmations, offers, and messages from your artist.",
    descAr: "احصلي على إشعارات تأكيد الحجوزات والعروض والرسائل من خبيرتك.",
    request: requestNotificationPermission,
  },
  {
    id: "camera",
    icon: <Camera className="w-7 h-7" />,
    titleEn: "Show Your Look",
    titleAr: "شاركي إطلالتك",
    descEn: "Snap photos for your profile, share reviews, and show off your look.",
    descAr: "التقطي صوراً لملفك الشخصي وشاركي تقييماتك وإطلالاتك.",
    request: requestCameraPermission,
  },
  {
    id: "location",
    icon: <MapPin className="w-7 h-7" />,
    titleEn: "Find Artists Nearby",
    titleAr: "اكتشفي الأقرب إليك",
    descEn: "Discover beauty experts available in your area for home visits.",
    descAr: "اكتشفي خبيرات التجميل المتاحات بالقرب منك للزيارات المنزلية.",
    request: requestLocationPermission,
  },
];

export const PermissionsPrompt = () => {
  const [visible, setVisible] = useState(false);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [results, setResults] = useState<Record<string, boolean>>({});
  const [requesting, setRequesting] = useState(false);
  const [isAr, setIsAr] = useState(false);

  useEffect(() => {
    try {
      const lang = localStorage.getItem("glam-app-language");
      setIsAr(lang === "ar");
    } catch {}

    const dismissed = localStorage.getItem("permissions-prompt-done");
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    const perm = PERMISSIONS[currentIndex];
    const granted = await perm.request();
    setResults((prev) => ({ ...prev, [perm.id]: granted }));
    setRequesting(false);
    advance();
  };

  const handleSkip = () => advance();

  const advance = () => {
    if (currentIndex < PERMISSIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      localStorage.setItem("permissions-prompt-done", "true");
      setVisible(false);
    }
  };

  if (!visible) return null;

  const perm = PERMISSIONS[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col" dir={isAr ? "rtl" : "ltr"}>
      {/* Skip All - top right */}
      <div className="flex justify-end p-4 pt-6 safe-area-top">
        <button
          onClick={() => {
            localStorage.setItem("permissions-prompt-done", "true");
            setVisible(false);
          }}
          className="text-sm text-muted-foreground hover:text-foreground transition-colors px-3 py-1"
        >
          {isAr ? "تخطي الكل" : "Skip All"}
        </button>
      </div>

      {/* Content - centered */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 -mt-12">
        {/* Icon */}
        <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center text-primary mb-6">
          {perm.icon}
        </div>

        {/* Title */}
        <h2 className="text-xl font-bold text-foreground text-center mb-2">
          {isAr ? perm.titleAr : perm.titleEn}
        </h2>

        {/* Description */}
        <p className="text-sm text-muted-foreground text-center leading-relaxed max-w-[280px]">
          {isAr ? perm.descAr : perm.descEn}
        </p>
      </div>

      {/* Bottom section */}
      <div className="px-6 pb-8 safe-area-bottom space-y-4">
        {/* Progress dots */}
        <div className="flex items-center justify-center gap-2 mb-2">
          {PERMISSIONS.map((_, i) => (
            <div
              key={i}
              className={`rounded-full transition-all duration-300 ${
                i === currentIndex
                  ? "w-6 h-2 bg-primary"
                  : i < currentIndex
                    ? "w-2 h-2 bg-primary/40"
                    : "w-2 h-2 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Allow button */}
        <Button
          onClick={handleAllow}
          disabled={requesting}
          className="w-full h-13 rounded-xl text-base font-semibold"
        >
          {requesting
            ? isAr ? "جاري الطلب..." : "Requesting..."
            : isAr ? "السماح" : "Allow"}
        </Button>

        {/* Skip this one */}
        <button
          onClick={handleSkip}
          className="w-full text-center text-sm text-muted-foreground hover:text-foreground transition-colors py-2"
        >
          {isAr ? "ليس الآن" : "Not Now"}
        </button>
      </div>
    </div>
  );
};

export default PermissionsPrompt;
