import { useState, useEffect } from "react";
import { Camera, MapPin, Bell, Shield, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { translations } from "@/lib/translations";

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
    icon: <Bell className="w-6 h-6" />,
    titleEn: "Notifications",
    titleAr: "الإشعارات",
    descEn: "Get updates on bookings and offers",
    descAr: "احصلي على تحديثات الحجوزات والعروض",
    request: requestNotificationPermission,
  },
  {
    id: "camera",
    icon: <Camera className="w-6 h-6" />,
    titleEn: "Camera",
    titleAr: "الكاميرا",
    descEn: "Take photos for your profile and reviews",
    descAr: "التقطي صوراً لملفك الشخصي والتقييمات",
    request: requestCameraPermission,
  },
  {
    id: "location",
    icon: <MapPin className="w-6 h-6" />,
    titleEn: "Location",
    titleAr: "الموقع",
    descEn: "Find nearby artists and services",
    descAr: "ابحثي عن خبيرات تجميل بالقرب منك",
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

    // Show after a short delay on first visit
    const timer = setTimeout(() => setVisible(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  const handleAllow = async () => {
    setRequesting(true);
    const perm = PERMISSIONS[currentIndex];
    const granted = await perm.request();
    setResults((prev) => ({ ...prev, [perm.id]: granted }));
    setRequesting(false);

    if (currentIndex < PERMISSIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishAll();
    }
  };

  const handleSkip = () => {
    if (currentIndex < PERMISSIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      finishAll();
    }
  };

  const finishAll = () => {
    localStorage.setItem("permissions-prompt-done", "true");
    setVisible(false);
  };

  if (!visible) return null;

  const perm = PERMISSIONS[currentIndex];

  return (
    <div className="fixed inset-0 z-[100] bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div
        className="bg-card border border-border rounded-2xl shadow-xl max-w-sm w-full p-6 space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-300"
        dir={isAr ? "rtl" : "ltr"}
      >
        {/* Progress */}
        <div className="flex items-center justify-center gap-2">
          {PERMISSIONS.map((_, i) => (
            <div
              key={i}
              className={`h-1.5 rounded-full transition-all ${
                i <= currentIndex ? "w-8 bg-primary" : "w-4 bg-muted"
              }`}
            />
          ))}
        </div>

        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            {perm.icon}
          </div>
        </div>

        {/* Title & Description */}
        <div className="text-center space-y-2">
          <h3 className="text-lg font-semibold text-foreground">
            {isAr ? perm.titleAr : perm.titleEn}
          </h3>
          <p className="text-sm text-muted-foreground">
            {isAr ? perm.descAr : perm.descEn}
          </p>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Button
            onClick={handleAllow}
            disabled={requesting}
            className="w-full gap-2"
          >
            <Shield className="w-4 h-4" />
            {requesting
              ? isAr
                ? "جاري الطلب..."
                : "Requesting..."
              : isAr
              ? "السماح"
              : "Allow"}
          </Button>
          <Button
            onClick={handleSkip}
            variant="ghost"
            className="w-full text-muted-foreground"
          >
            {isAr ? "تخطي" : "Skip"}
          </Button>
        </div>

        {/* Step counter */}
        <p className="text-xs text-center text-muted-foreground">
          {currentIndex + 1} / {PERMISSIONS.length}
        </p>
      </div>
    </div>
  );
};

export default PermissionsPrompt;
