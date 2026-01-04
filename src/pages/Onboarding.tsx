import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles, Wand2, Shield, X } from "lucide-react";
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
        number: "٠١",
        title: "اكتشفي",
        subtitle: "مواهبة فنانة المكياج",
        description: "تصفحي مئات الفنانات الموهوبات واكتشفي الأسلوب المثالي لأي مناسبة",
        gradient: "from-rose-400 to-pink-500",
      },
      {
        number: "٠٢",
        title: "احجزي",
        subtitle: "في ثوانٍ",
        description: "اختاري موعدك المفضل واحجزي فوراً مع نظام الحجز الفوري السريع",
        gradient: "from-primary to-rose-400",
      },
      {
        number: "٠٣",
        title: "ادفعي",
        subtitle: "بثقة وأمان",
        description: "مدفوعات مشفرة وتقييمات حقيقية من عملاء موثوقين",
        gradient: "from-gold to-amber-400",
      },
    ];
  }
  return [
    {
      number: "01",
      title: "Discover",
      subtitle: "Talented Artists",
      description: "Browse hundreds of skilled makeup artists and find your perfect style for any occasion",
      gradient: "from-rose-400 to-pink-500",
    },
    {
      number: "02",
      title: "Book",
      subtitle: "In Seconds",
      description: "Select your preferred time and book instantly with our quick and easy scheduling system",
      gradient: "from-primary to-rose-400",
    },
    {
      number: "03",
      title: "Pay",
      subtitle: "With Confidence",
      description: "Secure encrypted payments and genuine reviews from verified customers",
      gradient: "from-gold to-amber-400",
    },
  ];
};

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [slideDirection, setSlideDirection] = useState<"left" | "right" | null>(null);
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
      setSlideDirection("left");
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setSlideDirection(null);
      }, 300);
    } else {
      navigate("/auth");
    }
  };

  const handlePrevious = () => {
    if (currentSlide > 0) {
      setSlideDirection("right");
      setTimeout(() => {
        setCurrentSlide(currentSlide - 1);
        setSlideDirection(null);
      }, 300);
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50/50 via-white to-pink-50/30 relative overflow-hidden">
      {/* Animated background pattern */}
      <div className="absolute inset-0 opacity-5 pointer-events-none">
        <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="dots-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
              <circle cx="2" cy="2" r="1" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#dots-pattern)" />
        </svg>
      </div>

      {/* Floating gradient orbs */}
      <div className="absolute top-20 right-0 w-64 h-64 bg-gradient-to-br from-primary/20 to-transparent rounded-full blur-3xl animate-float-orb" />
      <div className="absolute bottom-20 left-0 w-80 h-80 bg-gradient-to-tr from-gold/20 to-transparent rounded-full blur-3xl animate-float-orb" style={{ animationDelay: '2s' }} />

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white/80 backdrop-blur-sm border border-rose-100 flex items-center justify-center text-muted-foreground hover:text-foreground hover:bg-white transition-all shadow-sm"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-6 py-12">
        {/* Slide carousel */}
        <div className="w-full max-w-sm relative">
          {/* Slides container */}
          <div className="overflow-hidden">
            <div
              className="flex transition-transform duration-500 ease-out"
              style={{
                transform: `translateX(${isRTL ? '' : '-'}${currentSlide * 100}%)`,
              }}
            >
              {slides.map((slide, index) => (
                <div
                  key={index}
                  className={cn(
                    "w-full flex-shrink-0 px-3",
                    slideDirection === "left" && index === currentSlide && "animate-slide-in-left",
                    slideDirection === "right" && index === currentSlide && "animate-slide-in-right",
                  )}
                >
                  {/* Card */}
                  <div className="bg-white rounded-3xl shadow-2xl shadow-rose-100/50 border border-rose-100 overflow-hidden">
                    {/* Image section */}
                    <div className="relative h-64 overflow-hidden">
                      <img
                        src={heroImage}
                        alt="Makeup Artist"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />

                      {/* Slide number badge */}
                      <div className="absolute top-4 left-4">
                        <span className="text-6xl font-serif font-bold text-white/20">{slide.number}</span>
                      </div>

                      {/* Floating icon */}
                      <div className="absolute -bottom-6 right-6 w-14 h-14 rounded-2xl bg-gradient-to-br from-white to-rose-50 shadow-xl flex items-center justify-center border border-white/50">
                        {index === 0 && <Sparkles className="w-7 h-7 text-primary" />}
                        {index === 1 && <Wand2 className="w-7 h-7 text-primary" />}
                        {index === 2 && <Shield className="w-7 h-7 text-gold" />}
                      </div>
                    </div>

                    {/* Content section */}
                    <div className="p-8 pt-10">
                      {/* Tagline pill */}
                      <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-rose-100 to-pink-100 border border-rose-200 mb-5">
                        <span className={cn(
                          "w-2 h-2 rounded-full bg-gradient-to-r",
                          slide.gradient
                        )} />
                        <span className="text-xs font-semibold text-rose-700 uppercase tracking-wider">
                          {language === "ar" ? "مميزة" : "Feature"}
                        </span>
                      </div>

                      {/* Title */}
                      <h1 className="font-serif text-4xl font-bold text-foreground mb-2">
                        {slide.title}
                      </h1>

                      {/* Subtitle with gradient */}
                      <h2 className={cn(
                        "text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-4",
                        slide.gradient
                      )}>
                        {slide.subtitle}
                      </h2>

                      {/* Description */}
                      <p className="text-muted-foreground text-base leading-relaxed mb-6">
                        {slide.description}
                      </p>

                      {/* Progress dots */}
                      <div className="flex justify-center gap-2">
                        {slides.map((_, dotIndex) => (
                          <button
                            key={dotIndex}
                            onClick={() => {
                              if (dotIndex > currentSlide) {
                                setSlideDirection("left");
                              } else if (dotIndex < currentSlide) {
                                setSlideDirection("right");
                              }
                              setTimeout(() => {
                                setCurrentSlide(dotIndex);
                                setSlideDirection(null);
                              }, 300);
                            }}
                            className={cn(
                              "transition-all duration-300 rounded-full",
                              dotIndex === currentSlide
                                ? "w-8 h-2 bg-gradient-to-r from-primary to-gold"
                                : "w-2 h-2 bg-rose-200 hover:bg-rose-300"
                            )}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Navigation buttons */}
        <div className="w-full max-w-sm mt-8">
          {currentSlide === slides.length - 1 ? (
            <div className="space-y-3 animate-fade-in">
              <Button
                size="lg"
                className="w-full h-14 bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-500/90 rounded-2xl font-semibold text-base shadow-lg shadow-primary/30"
                onClick={() => navigate("/auth")}
              >
                {language === "ar" ? "إنشاء حساب" : "Create Account"}
                <ArrowRight className={cn("w-5 h-5", isRTL ? "rotate-180" : "")} />
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 border-rose-200 text-rose-700 hover:bg-rose-50 rounded-2xl font-semibold"
                  onClick={() => navigate("/auth")}
                >
                  {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  className="h-14 text-muted-foreground hover:bg-rose-50 rounded-2xl font-medium"
                  onClick={handleSkip}
                >
                  {language === "ar" ? "ضيف" : "Guest"}
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="lg"
                className={cn(
                  "h-14 px-6 rounded-2xl font-semibold",
                  currentSlide === 0 ? "invisible" : "border-rose-200 text-rose-700 hover:bg-rose-50"
                )}
                onClick={handlePrevious}
                disabled={currentSlide === 0}
              >
                {language === "ar" ? "السابق" : "Previous"}
              </Button>

              <Button
                size="lg"
                className="flex-1 h-14 bg-gradient-to-r from-primary to-rose-500 hover:from-primary/90 hover:to-rose-500/90 rounded-2xl font-semibold shadow-lg shadow-primary/30"
                onClick={handleNext}
              >
                {language === "ar" ? "التالي" : "Next"}
                <ArrowRight className={cn("w-5 h-5", isRTL ? "rotate-180" : "")} />
              </Button>
            </div>
          )}
        </div>

        {/* Brand mark */}
        <div className="mt-12">
          <span className="font-serif text-xl font-bold text-rose-300">Glam</span>
        </div>
      </div>

      <style>{`
        @keyframes slide-in-left {
          from {
            opacity: 0;
            transform: translateX(30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes slide-in-right {
          from {
            opacity: 0;
            transform: translateX(-30px);
          }
          to {
            opacity: 1;
            transform: translateX(0);
          }
        }

        @keyframes fade-in {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes float-orb {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(-20px, -30px) scale(1.05);
          }
        }

        .animate-slide-in-left {
          animation: slide-in-left 0.4s ease-out forwards;
        }

        .animate-slide-in-right {
          animation: slide-in-right 0.4s ease-out forwards;
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }

        .animate-float-orb {
          animation: float-orb 8s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
