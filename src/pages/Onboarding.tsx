import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppRole } from "@/hooks/useUserRole";
import { SplashScreen } from "@/components/SplashScreen";
import { cn } from "@/lib/utils";

interface Slide {
  id: number;
  image: string;
  video?: string;
  imageAltEn: string;
  imageAltAr: string;
  titleEn: string;
  titleAr: string;
  highlightEn: string;
  highlightAr: string;
  descEn: string;
  descAr: string;
}

// Immersive full-screen intro slides (photo, copy, CTA per step)
const SLIDES: Slide[] = [
  {
    id: 1,
    image: "/images/onboarding/slide-discover.jpg",
    video: "/videos/onboarding/slide-discover.mp4",
    imageAltEn: "Woman with a flawless glamorous makeup look",
    imageAltAr: "امرأة بإطلالة مكياج ساحرة",
    titleEn: "Discover",
    titleAr: "اكتشفي",
    highlightEn: "Elite Artists",
    highlightAr: "نخبة الفنانات",
    descEn: "Browse a curated selection of professional beauty experts",
    descAr: "تصفحي مجموعة مختارة بعناية من خبيرات التجميل المحترفات",
  },
  {
    id: 2,
    image: "/images/onboarding/slide-book.jpg",
    video: "/videos/onboarding/slide-book.mp4",
    imageAltEn: "Hands holding a phone over an appointment planner",
    imageAltAr: "يدان تمسكان هاتفًا فوق مفكرة مواعيد",
    titleEn: "Book",
    titleAr: "احجزي",
    highlightEn: "With Ease",
    highlightAr: "بكل سهولة",
    descEn: "Schedule your perfect appointment in simple, quick steps",
    descAr: "حددي موعدك المفضل بخطوات بسيطة وسريعة",
  },
  {
    id: 3,
    image: "/images/onboarding/slide-pay.jpg",
    video: "/videos/onboarding/slide-pay.mp4",
    imageAltEn: "A premium card held above a phone on marble",
    imageAltAr: "بطاقة أنيقة فوق هاتف على رخام",
    titleEn: "Pay",
    titleAr: "ادفعي",
    highlightEn: "Securely",
    highlightAr: "بأمان تام",
    descEn: "Safe electronic payment with money-back guarantee",
    descAr: "دفع إلكتروني آمن مع ضمان استرداد أموالك",
  },
];

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const isAr = language === "ar";
  const touchStartX = useRef(0);
  const slidesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  // Only the visible slide's video plays; hidden ones pause to save battery/data
  useEffect(() => {
    const videos = slidesRef.current?.querySelectorAll("video");
    videos?.forEach((v, i) => {
      if (i === currentSlide) {
        v.play().catch(() => {});
      } else {
        v.pause();
      }
    });
  }, [currentSlide, reducedMotion, showSplash]);

  useEffect(() => {
    const redirectByRole = async (userId: string) => {
      try {
        const { data, error } = await supabase
          .from("user_roles")
          .select("role")
          .eq("user_id", userId);

        if (error) {
          console.error("Error fetching role:", error);
          navigate("/home", { replace: true });
          return;
        }

        const roles = (data || []).map((r) => r.role as AppRole);
        if (roles.includes("admin")) {
          navigate("/admin", { replace: true });
        } else if (roles.includes("artist")) {
          navigate("/artist-dashboard", { replace: true });
        } else {
          navigate("/home", { replace: true });
        }
      } catch {
        navigate("/home", { replace: true });
      }
    };

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        redirectByRole(session.user.id);
      } else {
        setCheckingAuth(false);
        const timer = setTimeout(() => setShowSplash(false), 2000);
        return () => clearTimeout(timer);
      }
    });
  }, [navigate]);

  const handleNext = () => {
    if (currentSlide < SLIDES.length - 1) setCurrentSlide((i) => i + 1);
  };

  const handlePrev = () => {
    if (currentSlide > 0) setCurrentSlide((i) => i - 1);
  };

  const handleSkip = () => {
    navigate("/home");
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) < 50) return;
    // LTR: swipe left = next. RTL: swipe right = next.
    const swipedForward = isRTL ? diff < 0 : diff > 0;
    if (swipedForward) handleNext();
    else handlePrev();
  };

  if (checkingAuth) {
    return null;
  }

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const isLastSlide = currentSlide === SLIDES.length - 1;
  const slide = SLIDES[currentSlide];

  return (
    <div
      className="min-h-screen relative overflow-hidden bg-glam-ink"
      dir={isRTL ? "rtl" : "ltr"}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Slow zoom on the active photo */}
      <style>{`
        @keyframes onbKenBurns { from { transform: scale(1); } to { transform: scale(1.08); } }
        .onb-kenburns { animation: onbKenBurns 16s ease-out forwards; }
        @keyframes onbShine { 0% { transform: translateX(-160%) skewX(-18deg); } 55%, 100% { transform: translateX(280%) skewX(-18deg); } }
        .onb-shine::after { content: ""; position: absolute; top: 0; bottom: 0; width: 42%; pointer-events: none; background: linear-gradient(90deg, transparent, rgba(255,255,255,0.32), transparent); animation: onbShine 3.8s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) { .onb-kenburns { animation: none; } .onb-shine::after { animation: none; display: none; } }
      `}</style>

      {/* Full-bleed photos/videos with crossfade */}
      <div className="absolute inset-0" ref={slidesRef}>
        {SLIDES.map((item, i) => (
          <div
            key={item.id}
            className={cn(
              "absolute inset-0 transition-opacity duration-1000 motion-reduce:transition-none",
              i === currentSlide ? "opacity-100" : "opacity-0"
            )}
          >
            {item.video && !reducedMotion ? (
              <video
                src={item.video}
                poster={item.image}
                aria-label={isAr ? item.imageAltAr : item.imageAltEn}
                aria-hidden={i !== currentSlide}
                muted
                loop
                playsInline
                preload="auto"
                className="w-full h-full object-cover"
              />
            ) : (
              <img
                src={item.image}
                alt={isAr ? item.imageAltAr : item.imageAltEn}
                aria-hidden={i !== currentSlide}
                draggable={false}
                className={cn(
                  "w-full h-full object-cover",
                  i === currentSlide && "onb-kenburns"
                )}
              />
            )}
          </div>
        ))}
      </div>

      {/* Cinematic scrims */}
      <div className="absolute inset-x-0 top-0 h-40 bg-gradient-to-b from-black/60 via-black/25 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-[65%] bg-gradient-to-t from-black/90 via-black/45 to-transparent pointer-events-none" />

      {/* Top: stories-style progress + brand + skip */}
      <div className="absolute inset-x-0 top-0 safe-area-top px-5 pt-4 z-10">
        <div className="flex gap-1.5" aria-hidden="true">
          {SLIDES.map((item, i) => (
            <div
              key={item.id}
              className="h-1 flex-1 rounded-full bg-white/25 overflow-hidden"
            >
              <div
                className="h-full rounded-full bg-white transition-all duration-500 motion-reduce:transition-none"
                style={{ width: i <= currentSlide ? "100%" : "0%" }}
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
          {!isLastSlide && (
            <button
              onClick={handleSkip}
              className="rounded-full border border-white/15 bg-white/10 backdrop-blur-md px-4 py-1.5 text-sm font-medium text-white/85 transition-colors hover:bg-white/20 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
            >
              {isAr ? "تخطي" : "Skip"}
            </button>
          )}
        </div>
      </div>

      {/* Bottom content over the photo */}
      <div className="absolute inset-x-0 bottom-0 safe-area-bottom px-6 pb-7 z-10">
        <div
          key={slide.id}
          className="animate-in fade-in slide-in-from-bottom-4 duration-500 motion-reduce:animate-none"
        >
          <h1 className="text-[2.1rem] leading-tight font-bold text-white mb-1">
            {isAr ? slide.titleAr : slide.titleEn}
          </h1>
          <p className="text-[2.1rem] leading-tight font-bold mb-3 text-glam-blush">
            {isAr ? slide.highlightAr : slide.highlightEn}
          </p>
          <p className="text-[15px] text-white/75 leading-relaxed max-w-[330px] mb-7">
            {isAr ? slide.descAr : slide.descEn}
          </p>
        </div>

        {isLastSlide ? (
          <>
            <Button
              size="lg"
              onClick={() => navigate("/auth")}
              className={cn(
                "group relative w-full h-14 rounded-full text-[15px] font-semibold tracking-wide transition-all duration-300",
                "text-white bg-glam-rose hover:bg-glam-rose-pressed",
                "active:scale-[0.97] shadow-lg shadow-black/30"
              )}
            >
              {isAr ? "ابدئي الآن" : "Get Started"}
              <span className="ms-2 grid place-items-center w-7 h-7 rounded-full bg-white/25 backdrop-blur-sm [box-shadow:inset_0_1px_0_rgba(255,255,255,0.4)] transition-transform duration-300 group-active:scale-90">
                <ChevronRight className={cn("w-4 h-4", isRTL && "rotate-180")} />
              </span>
            </Button>

            <div className="flex items-center justify-center gap-6 pt-5">
              <button
                onClick={() => navigate("/auth")}
                className="text-sm font-semibold text-white/90 transition-colors hover:text-white"
              >
                {isAr ? "تسجيل الدخول" : "Sign In"}
              </button>
              <div className="w-px h-4 bg-white/25" />
              <button
                onClick={handleSkip}
                className="text-sm font-medium text-white/60 transition-colors hover:text-white/90"
              >
                {isAr ? "التصفح كضيفة" : "Continue as Guest"}
              </button>
            </div>
          </>
        ) : (
          <Button
            size="lg"
            onClick={handleNext}
            className={cn(
              "w-full h-14 rounded-2xl text-base font-semibold transition-all duration-200",
              "bg-white hover:bg-white/90 text-glam-ink",
              "active:scale-[0.98] shadow-lg shadow-black/30"
            )}
          >
            {isAr ? "التالي" : "Next"}
            <ChevronRight
              className={cn("w-5 h-5", isRTL ? "mr-2 rotate-180" : "ml-2")}
            />
          </Button>
        )}
      </div>
    </div>
  );
};

export default Onboarding;
