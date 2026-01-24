import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Wand2, Shield, X, ChevronRight } from "lucide-react";
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
        subtitle: "الفنانين",
        description: "مئات الفنانين الموهوبين ينتظرونك",
        icon: "sparkles",
        gradient: "from-rose-500 to-rose-600",
      },
      {
        title: "احجزي",
        subtitle: "فوراً",
        description: "حجز سريع وآمن في ثوانٍ معدودة",
        icon: "wand",
        gradient: "from-primary to-rose-500",
      },
      {
        title: "ادفعي",
        subtitle: "بأمان",
        description: "مدفوعات محمية 100%",
        icon: "shield",
        gradient: "from-amber-500 to-amber-600",
      },
    ];
  }
  return [
    {
      title: "Discover",
      subtitle: "Artists",
      description: "Hundreds of talented artists await you",
      icon: "sparkles",
      gradient: "from-rose-500 to-rose-600",
    },
    {
      title: "Book",
      subtitle: "Instantly",
      description: "Quick, secure booking in mere seconds",
      icon: "wand",
      gradient: "from-primary to-rose-500",
    },
    {
      title: "Pay",
      subtitle: "Securely",
      description: "100% protected payment transactions",
      icon: "shield",
      gradient: "from-amber-500 to-amber-600",
    },
  ];
};

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
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
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(currentSlide + 1);
    } else {
      navigate("/auth");
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-white to-amber-50">
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-zinc-200 flex items-center justify-center text-zinc-500 hover:text-zinc-700 hover:bg-white transition-colors shadow-sm"
      >
        <X className="w-4 h-4" />
      </button>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Hero section with image */}
        <div className="flex-1 flex items-center justify-center px-6 pt-20 pb-8">
          <div className="w-full max-w-md">
            {/* Clean image container with subtle accent */}
            <div className="relative aspect-[4/5] rounded-3xl overflow-hidden shadow-xl shadow-rose-100">
              <img
                src={heroImage}
                alt="Beauty"
                className="w-full h-full object-cover"
              />

              {/* Subtle gradient overlay */}
              <div
                className={cn(
                  "absolute inset-0 bg-gradient-to-t opacity-30 transition-opacity duration-500",
                  currentSlideData.gradient
                )}
              />

              {/* Clean icon badge */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center border border-white/40">
                  {currentSlideData.icon === "sparkles" && (
                    <Sparkles className="w-10 h-10 text-white" />
                  )}
                  {currentSlideData.icon === "wand" && (
                    <Wand2 className="w-10 h-10 text-white" />
                  )}
                  {currentSlideData.icon === "shield" && (
                    <Shield className="w-10 h-10 text-white" />
                  )}
                </div>
              </div>

              {/* Bottom fade for seamless content transition */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-white via-white/90 to-transparent" />
            </div>
          </div>
        </div>

        {/* Content section */}
        <div className="px-6 pb-12 pt-2">
          <div className="max-w-md mx-auto">
            {/* Minimal slide indicators */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {slides.map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentSlide(index)}
                  className={cn(
                    "h-1 rounded-full transition-all duration-300",
                    index === currentSlide
                      ? "w-8 bg-gradient-to-r from-rose-500 to-rose-600"
                      : "w-2 bg-zinc-200 hover:bg-zinc-300"
                  )}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Typography - clean and elegant */}
            <div className="text-center space-y-3 mb-10">
              <h1 className="text-5xl font-light text-zinc-900 tracking-tight">
                {currentSlideData.title}
              </h1>
              <h2
                className={cn(
                  "text-4xl font-semibold bg-clip-text text-transparent bg-gradient-to-r",
                  currentSlideData.gradient
                )}
              >
                {currentSlideData.subtitle}
              </h2>
              <p className="text-zinc-500 text-lg leading-relaxed max-w-sm mx-auto">
                {currentSlideData.description}
              </p>
            </div>

            {/* Action buttons */}
            <div className="space-y-3">
              {currentSlide === slides.length - 1 ? (
                <>
                  <Button
                    size="lg"
                    className="w-full h-14 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl font-medium text-base shadow-lg shadow-rose-200 transition-all hover:shadow-xl hover:shadow-rose-300 hover:-translate-y-0.5 active:translate-y-0"
                    onClick={() => navigate("/auth")}
                  >
                    {language === "ar" ? "ابدأ الآن" : "Get Started"}
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 border border-zinc-300 text-zinc-700 hover:bg-zinc-50 hover:border-zinc-400 rounded-2xl font-medium backdrop-blur-sm transition-all"
                      onClick={() => navigate("/auth")}
                    >
                      {language === "ar" ? "تسجيل" : "Sign In"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-14 text-zinc-500 hover:text-zinc-700 hover:bg-zinc-50 rounded-2xl font-medium transition-colors"
                      onClick={handleSkip}
                    >
                      {language === "ar" ? "ضيف" : "Guest"}
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-14 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl font-medium text-base shadow-lg shadow-zinc-200 transition-all hover:-translate-y-0.5 active:translate-y-0"
                  onClick={handleNext}
                >
                  {language === "ar" ? "التالي" : "Continue"}
                  <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              )}
            </div>

            {/* Slide counter */}
            <p className="text-center text-zinc-400 text-sm mt-8">
              {currentSlide + 1} {language === "ar" ? "من" : "of"} {slides.length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
