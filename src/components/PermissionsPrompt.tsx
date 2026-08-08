import { useState, useEffect, useRef } from "react";
import { Camera, MapPin, Bell, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LottieIcon } from "@/components/LottieIcon";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface PermissionItem {
  id: string;
  icon: React.ElementType;
  animation: string;
  image: string;
  imageAltEn: string;
  imageAltAr: string;
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

// Full-screen immersive permission steps (photo, copy, native request)
const PERMISSIONS: PermissionItem[] = [
  {
    id: "notifications",
    icon: Bell,
    animation: "/animations/perm-bell.json",
    image: "/images/onboarding/perm-notifications.jpg",
    imageAltEn: "Makeup artist applying a client's look in a warm salon",
    imageAltAr: "خبيرة تجميل تضع مكياج عميلة في صالون دافئ",
    titleEn: "Stay in the Loop",
    titleAr: "ابقي على اطلاع",
    descEn: "Get notified about booking confirmations, offers, and messages from your artist.",
    descAr: "احصلي على إشعارات تأكيد الحجوزات والعروض والرسائل من خبيرتك.",
    request: requestNotificationPermission,
  },
  {
    id: "camera",
    icon: Camera,
    animation: "/animations/perm-camera.json",
    image: "/images/onboarding/perm-camera.jpg",
    imageAltEn: "Hands with rose manicure photographing nail art",
    imageAltAr: "يدان بمناكير وردي تصوران تصميم الأظافر",
    titleEn: "Show Your Look",
    titleAr: "شاركي إطلالتك",
    descEn: "Snap photos for your profile, share reviews, and show off your look.",
    descAr: "التقطي صورًا لملفك الشخصي وشاركي تقييماتك وإطلالاتك.",
    request: requestCameraPermission,
  },
  {
    id: "location",
    icon: MapPin,
    animation: "/animations/perm-pin.json",
    image: "/images/onboarding/perm-location.jpg",
    imageAltEn: "Hairstylist styling soft waves in a luxury salon",
    imageAltAr: "مصففة شعر تصفف تموجات ناعمة في صالون فاخر",
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
  const [requesting, setRequesting] = useState(false);
  const { language, isRTL } = useLanguage();
  const isAr = language === "ar";
  const touchStartX = useRef(0);

  useEffect(() => {
    const dismissed = localStorage.getItem("permissions-prompt-done");
    if (dismissed) return;

    const timer = setTimeout(() => setVisible(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  const advance = () => {
    if (currentIndex < PERMISSIONS.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      dismiss();
    }
  };

  const goBack = () => {
    if (currentIndex > 0) setCurrentIndex((i) => i - 1);
  };

  const dismiss = () => {
    localStorage.setItem("permissions-prompt-done", "true");
    setVisible(false);
  };

  const handleAllow = async () => {
    setRequesting(true);
    try {
      await PERMISSIONS[currentIndex].request();
    } finally {
      setRequesting(false);
      advance();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    // LTR: swipe left = next. RTL: swipe right = next.
    const swipedForward = isRTL ? diff < 0 : diff > 0;
    if (swipedForward) advance();
    else goBack();
  };

  if (!visible) return null;

  const perm = PERMISSIONS[currentIndex];
  const Icon = perm.icon;

  return (
    <div
      className="fixed inset-0 z-[100] overflow-hidden bg-glam-ink"
      dir={isRTL ? "rtl" : "ltr"}
      role="dialog"
      aria-modal="true"
      aria-label={isAr ? perm.titleAr : perm.titleEn}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slow zoom on the active photo */}
      <style>{`
        @keyframes permKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        .perm-kenburns { animation: permKenBurns 14s ease-out forwards; }
        @keyframes permShine { 0% { transform: translateX(-160%) skewX(-18deg); } 55%, 100% { transform: translateX(280%) skewX(-18deg); } }
        .perm-shine::after { content: ""; position: absolute; top: 0; bottom: 0; width: 42%; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent); animation: permShine 3.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .perm-kenburns { animation: none; } .perm-shine::after { animation: none; display: none; } }
      `}</style>

      {/* Full-bleed photos with crossfade */}
      <div className="absolute inset-0">
        {PERMISSIONS.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none",
              i === currentIndex ? "opacity-100" : "opacity-0"
            )}
          >
            <img
              src={item.image}
              alt={isAr ? item.imageAltAr : item.imageAltEn}
              aria-hidden={i !== currentIndex}
              draggable={false}
              className={cn(
                "w-full h-full object-cover",
                i === currentIndex && "perm-kenburns"
              )}
            />
          </div>
        ))}
      </div>

      {/* Cinematic scrims */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

      {/* Top: stories-style progress + brand + skip */}
      <div className="absolute inset-x-0 top-0 safe-area-top px-5 pt-4">
        <div className="flex gap-1.5" aria-hidden="true">
          {PERMISSIONS.map((item, i) => (
            <div
              key={item.id}
              className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-500 motion-reduce:transition-none"
                style={{ width: i <= currentIndex ? "100%" : "0%" }}
              />
            </div>
          ))}
        </div>

        <div className="flex items-center justify-between mt-4">
          <img
            src="/brand/glam-mark-dark.png"
            alt="GLAM"
            className="h-11 w-auto object-contain drop-shadow-[0_2px_8px_rgba(0,0,0,0.5)]"
          />
          <button
            onClick={dismiss}
            className="rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
          >
            {isAr ? "تخطي الكل" : "Skip All"}
          </button>
        </div>
      </div>

      {/* Bottom content over the photo */}
      <div className="absolute inset-x-0 bottom-0 safe-area-bottom px-6 pb-7">
        <div
          key={perm.id}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
        >
          <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 flex items-center justify-center text-white mb-5 shadow-lg">
            <LottieIcon
              src={perm.animation}
              fallback={<Icon className="w-7 h-7" strokeWidth={1.75} />}
              className="w-12 h-12"
            />
          </div>

          <h2 className="text-[2rem] leading-tight font-bold text-white mb-2.5">
            {isAr ? perm.titleAr : perm.titleEn}
          </h2>
          <p className="text-[15px] text-white/75 leading-relaxed max-w-[330px] mb-7">
            {isAr ? perm.descAr : perm.descEn}
          </p>
        </div>

        <Button
          onClick={handleAllow}
          disabled={requesting}
          className={cn(
            "group relative w-full h-14 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-300",
            "text-white bg-glam-rose hover:bg-glam-rose-pressed",
            "active:scale-[0.97] shadow-lg shadow-black/30"
          )}
        >
          {requesting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              {isAr ? "جاري الطلب..." : "Requesting..."}
            </>
          ) : (
            <>
              <Icon className="w-5 h-5" strokeWidth={2} />
              {isAr ? "السماح" : "Allow"}
            </>
          )}
        </Button>

        <button
          onClick={advance}
          className="w-full h-12 mt-2.5 rounded-2xl border border-white/25 bg-white/5 backdrop-blur-md text-sm font-medium text-white/90 transition-colors hover:bg-white/15"
        >
          {isAr ? "ليس الآن" : "Not Now"}
        </button>

        <p className="text-center text-[11px] text-white/50 mt-4">
          {isAr
            ? "يمكنك تغيير ذلك في أي وقت من الإعدادات"
            : "You can change this anytime in Settings"}
        </p>
      </div>
    </div>
  );
};

export default PermissionsPrompt;
