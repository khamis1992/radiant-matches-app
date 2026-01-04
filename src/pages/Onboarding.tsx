import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft, Sparkles, Wand2, Shield, ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppRole } from "@/hooks/useUserRole";
import { SplashScreen } from "@/components/SplashScreen";
import heroImage from "@/assets/hero-makeup.jpg";
import { cn } from "@/lib/utils";

const getSlides = (language: "en" | "ar") => {
  if (language === "ar") {
    return [
      {
        title: "اكتشفي",
        highlight: "فنانات موهوبات",
        description: "جدي فنانة المكياج المثالية لأي مناسبة بالقرب منك",
        icon: Sparkles,
      },
      {
        title: "احجزي",
        highlight: "فوراً",
        description: "جدولي مواعيدك في ثوانٍ مع التوفر في الوقت الفعلي",
        icon: Wand2,
      },
      {
        title: "ادفعي",
        highlight: "بأمان",
        description: "مدفوعات آمنة وتقييمات صادقة من عملاء موثوقين",
        icon: Shield,
      },
    ];
  }
  return [
    {
      title: "Discover",
      highlight: "Talented Artists",
      description: "Find the perfect makeup artist for any occasion near you",
      icon: Sparkles,
    },
    {
      title: "Book",
      highlight: "Instantly",
      description: "Schedule appointments in seconds with real-time availability",
      icon: Wand2,
    },
    {
      title: "Pay",
      highlight: "Securely",
      description: "Secure payments and honest reviews from verified customers",
      icon: Shield,
    },
  ];
};

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();

  const slides = getSlides(language);
  const currentSlideData = slides[currentSlide];

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

  if (checkingAuth) {
    return null;
  }

  const handleNext = () => {
    if (isAnimating) return;
    setIsAnimating(true);
    setTimeout(() => {
      if (currentSlide < slides.length - 1) {
        setCurrentSlide(currentSlide + 1);
      } else {
        navigate("/auth");
      }
      setIsAnimating(false);
    }, 300);
  };

  const handleSkip = () => {
    navigate("/home");
  };

  const handleDotClick = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 300);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      {/* Full-bleed hero image with overlay */}
      <div className="fixed inset-0 z-0">
        <img
          src={heroImage}
          alt="Background"
          className={cn(
            "w-full h-full object-cover transition-transform duration-700 ease-out",
            isAnimating ? "scale-110" : "scale-100"
          )}
        />

        {/* Dramatic gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/40 via-primary/20 to-background" />

        {/* Diagonal accent overlay */}
        <div className="absolute inset-0 bg-gradient-to-tr from-transparent via-background/30 to-transparent" />

        {/* Noise texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none">
          <svg className="w-full h-full">
            <filter id="noise-onboard">
              <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="4" />
              <feColorMatrix type="saturate" values="0" />
            </filter>
            <rect width="100%" height="100%" filter="url(#noise-onboard)" />
          </svg>
        </div>
      </div>

      {/* Giant slide number watermark */}
      <div className="fixed inset-0 flex items-center justify-center pointer-events-none z-0">
        <span
          className="text-[40vw] font-serif font-bold text-white/5 leading-none transition-all duration-500"
          style={{
            transform: isAnimating ? "scale(0.95)" : "scale(1)",
          }}
        >
          {String(currentSlide + 1).padStart(2, "0")}
        </span>
      </div>

      {/* Floating cosmetic silhouettes */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden">
        {/* Lipstick */}
        <div className="absolute top-[20%] left-[10%] w-12 h-32 opacity-10 animate-float-slow">
          <svg viewBox="0 0 48 128" fill="currentColor" className="text-primary">
            <rect x="12" y="0" width="24" height="80" rx="12" />
            <rect x="6" y="80" width="36" height="48" rx="8" />
          </svg>
        </div>

        {/* Brush */}
        <div className="absolute top-[30%] right-[15%] w-10 h-48 opacity-10 animate-float-slow" style={{ animationDelay: '1s' }}>
          <svg viewBox="0 0 40 192" fill="currentColor" className="text-gold">
            <rect x="14" y="120" width="12" height="72" rx="3" />
            <ellipse cx="20" cy="60" rx="16" ry="52" />
          </svg>
        </div>

        {/* Compact */}
        <div className="absolute bottom-[25%] left-[20%] w-20 h-20 opacity-10 animate-float-slow" style={{ animationDelay: '2s' }}>
          <svg viewBox="0 0 80 80" fill="currentColor" className="text-primary">
            <circle cx="40" cy="40" r="35" />
            <circle cx="40" cy="40" r="25" fill="white" />
          </svg>
        </div>
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Top bar - Skip button */}
        <div className="flex justify-between items-center p-6 safe-area-top">
          {/* Logo */}
          <div
            className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center shadow-lg"
            onClick={() => navigate("/home")}
          >
            <span className="font-serif text-xl font-bold text-white">G</span>
          </div>

          <button
            onClick={handleSkip}
            className="px-5 py-2 rounded-full bg-white/10 backdrop-blur-md border border-white/20 text-white text-sm font-medium hover:bg-white/20 transition-all"
          >
            {language === "ar" ? "تخطي" : "Skip"}
          </button>
        </div>

        {/* Content area */}
        <div className="flex-1 flex flex-col justify-end px-6 pb-8 safe-area-bottom">
          {/* Slide content */}
          <div
            className={cn(
              "transition-all duration-500 ease-out",
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
          >
            {/* Icon */}
            <div className="mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 backdrop-blur-md flex items-center justify-center shadow-2xl">
                <currentSlideData.icon className="w-8 h-8 text-white" />
              </div>
            </div>

            {/* Headline with highlight */}
            <h1 className="font-serif text-5xl font-bold text-white leading-tight mb-3">
              {currentSlideData.title}
              <br />
              <span className="text-gold">{currentSlideData.highlight}</span>
            </h1>

            {/* Description */}
            <p className="text-white/80 text-lg leading-relaxed mb-8 max-w-md">
              {currentSlideData.description}
            </p>

            {/* Custom progress indicator */}
            <div className="flex items-center gap-4 mb-8">
              <div className="flex-1 h-0.5 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-primary to-gold rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((currentSlide + 1) / slides.length) * 100}%` }}
                />
              </div>
              <span className="text-white/60 text-sm font-medium tabular-nums">
                {String(currentSlide + 1).padStart(2, "0")}/{slides.length}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div
            className={cn(
              "transition-all duration-500 delay-100",
              isAnimating ? "opacity-0 translate-y-4" : "opacity-100 translate-y-0"
            )}
          >
            {currentSlide === slides.length - 1 ? (
              <div className="space-y-3">
                <Button
                  size="lg"
                  className="w-full h-14 bg-white text-primary hover:bg-white/90 rounded-2xl font-semibold text-base shadow-2xl"
                  onClick={() => navigate("/auth")}
                >
                  {language === "ar" ? "إنشاء حساب" : "Create Account"}
                  <ArrowRight className={cn("w-5 h-5", isRTL ? "rotate-180" : "")} />
                </Button>

                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1 h-14 bg-white/10 backdrop-blur-md border-2 border-white/30 text-white hover:bg-white/20 rounded-2xl font-semibold text-base"
                    onClick={() => navigate("/auth")}
                  >
                    {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                  </Button>

                  <Button
                    variant="ghost"
                    size="lg"
                    className="flex-1 h-14 bg-white/10 backdrop-blur-md text-white hover:bg-white/20 rounded-2xl font-medium text-base"
                    onClick={handleSkip}
                  >
                    {language === "ar" ? "ضيف" : "Guest"}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Button
                  size="lg"
                  className="flex-1 h-14 bg-white text-primary hover:bg-white/90 rounded-2xl font-semibold text-base shadow-2xl"
                  onClick={handleNext}
                  disabled={isAnimating}
                >
                  {language === "ar" ? "التالي" : "Next"}
                  <ArrowRight className={cn("w-5 h-5", isRTL ? "rotate-180" : "")} />
                </Button>

                {/* Dot indicators - clickable */}
                <div className="flex items-center gap-2 px-4">
                  {slides.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => handleDotClick(index)}
                      disabled={isAnimating}
                      className={cn(
                        "transition-all duration-300 rounded-full",
                        index === currentSlide
                          ? "w-3 h-3 bg-white"
                          : "w-2 h-2 bg-white/30 hover:bg-white/50"
                      )}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Animated corner accent */}
      <div className="fixed top-0 left-0 w-32 h-32 pointer-events-none">
        <svg viewBox="0 0 128 128" className="w-full h-full">
          <path
            d="M 0 32 L 0 0 L 32 0"
            stroke="white"
            strokeWidth="2"
            fill="none"
            className="opacity-30"
          />
        </svg>
      </div>

      <style>{`
        @keyframes float-slow {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-15px) rotate(3deg);
          }
        }

        .animate-float-slow {
          animation: float-slow 6s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
