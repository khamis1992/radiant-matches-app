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
        color: "from-rose-500 to-pink-600",
      },
      {
        title: "احجزي",
        subtitle: "فوراً",
        description: "حجز سريع وآمن في ثوانٍ معدودة",
        icon: "wand",
        color: "from-primary to-rose-500",
      },
      {
        title: "ادفعي",
        subtitle: "بأمان",
        description: "مدفوعات محمية 100%",
        icon: "shield",
        color: "from-gold to-amber-500",
      },
    ];
  }
  return [
    {
      title: "Discover",
      subtitle: "Artists",
      description: "Hundreds of talented artists await you",
      icon: "sparkles",
      color: "from-rose-500 to-pink-600",
    },
    {
      title: "Book",
      subtitle: "Instantly",
      description: "Quick, secure booking in mere seconds",
      icon: "wand",
      color: "from-primary to-rose-500",
    },
    {
      title: "Pay",
      subtitle: "Securely",
      description: "100% protected payment transactions",
      icon: "shield",
      color: "from-gold to-amber-500",
    },
  ];
};

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [particlePositions, setParticlePositions] = useState<Array<{ id: number; x: number; y: number; delay: number }>>([]);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();

  const slides = getSlides(language);
  const currentSlideData = slides[currentSlide];

  // Generate random particles
  useEffect(() => {
    const particles = Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 2,
    }));
    setParticlePositions(particles);
  }, []);

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
    if (currentSlide < slides.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setCurrentSlide(currentSlide + 1);
        setIsAnimating(false);
      }, 600);
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
    <div className="min-h-screen bg-foreground overflow-hidden relative">
      {/* Animated morphing blob background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary morphing blob */}
        <div
          className={cn(
            "absolute w-96 h-96 rounded-full blur-3xl opacity-30 animate-morph-blob",
            currentSlide === 0 && "bg-rose-500 top-20 -left-20",
            currentSlide === 1 && "bg-primary top-40 -right-20",
            currentSlide === 2 && "bg-gold bottom-20 -left-20"
          )}
          style={{
            animationDuration: '8s',
            animationDelay: `${currentSlide * 0.5}s`,
          }}
        />

        {/* Secondary morphing blob */}
        <div
          className={cn(
            "absolute w-80 h-80 rounded-full blur-3xl opacity-20 animate-morph-blob-reverse",
            currentSlide === 0 && "bg-gold bottom-40 -right-10",
            currentSlide === 1 && "bg-rose-500 bottom-20 -left-10",
            currentSlide === 2 && "bg-primary top-20 -right-10"
          )}
          style={{
            animationDuration: '10s',
            animationDelay: `${currentSlide * 0.7}s`,
          }}
        />

        {/* Tertiary morphing blob */}
        <div
          className="absolute w-64 h-64 rounded-full blur-3xl opacity-15 animate-morph-blob bg-white top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2"
          style={{
            animationDuration: '12s',
          }}
        />
      </div>

      {/* Floating particles */}
      {particlePositions.map((particle) => (
        <div
          key={particle.id}
          className="absolute w-2 h-2 rounded-full bg-white/20 animate-float-particle pointer-events-none"
          style={{
            left: `${particle.x}%`,
            top: `${particle.y}%`,
            animationDelay: `${particle.delay}s`,
            animationDuration: `${4 + particle.delay * 2}s`,
          }}
        />
      ))}

      {/* Animated geometric shapes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Rotating triangle */}
        <svg
          className="absolute top-20 right-10 w-24 h-24 animate-spin-slow opacity-10"
          viewBox="0 0 100 100"
        >
          <polygon points="50,10 90,90 10,90" fill="white" />
        </svg>

        {/* Pulsing circle */}
        <div
          className="absolute bottom-32 left-10 w-16 h-16 rounded-full border-2 border-white/20 animate-pulse-slow"
        />

        {/* Rotating square */}
        <div
          className="absolute top-1/2 right-20 w-12 h-12 border-2 border-white/10 animate-spin-slow"
          style={{ animationDirection: 'reverse', animationDuration: '15s' }}
        />

        {/* Floating ring */}
        <div
          className="absolute bottom-20 right-1/4 w-20 h-20 rounded-full border border-white/5 animate-ping"
          style={{ animationDuration: '3s' }}
        />
      </div>

      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="fixed top-6 right-6 z-50 w-12 h-12 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 flex items-center justify-center text-white hover:bg-white/20 transition-all hover:scale-110 active:scale-95"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Main content */}
      <div
        className={cn(
          "relative z-10 min-h-screen flex flex-col transition-all duration-700 ease-out",
          isAnimating && "opacity-0 scale-95"
        )}
      >
        {/* Top section with animated illustration */}
        <div className="flex-1 flex items-center justify-center px-8 pt-16 pb-8">
          <div className="relative w-full max-w-sm">
            {/* Animated circular container */}
            <div className="relative aspect-square">
              {/* Outer animated rings */}
              <div className="absolute inset-0 rounded-full border-2 border-white/10 animate-pulse-ring" />
              <div
                className="absolute inset-4 rounded-full border border-white/20 animate-spin-slow"
                style={{ animationDuration: '20s' }}
              />
              <div
                className="absolute inset-8 rounded-full border-2 border-dashed border-white/30 animate-spin-slow"
                style={{ animationDirection: 'reverse', animationDuration: '15s' }}
              />

              {/* Morphing shape container */}
              <div className="absolute inset-12 overflow-hidden rounded-full bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm">
                {/* Image with parallax */}
                <img
                  src={heroImage}
                  alt="Beauty"
                  className={cn(
                    "absolute inset-0 w-full h-full object-cover transition-transform duration-700 ease-out",
                    isAnimating ? "scale-110 rotate-3" : "scale-100 rotate-0"
                  )}
                  style={{
                    animation: 'float-image 6s ease-in-out infinite',
                  }}
                />

                {/* Gradient overlay */}
                <div
                  className={cn(
                    "absolute inset-0 bg-gradient-to-br opacity-50 transition-colors duration-700",
                    currentSlideData.color
                  )}
                />

                {/* Animated icon overlay */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div
                    className={cn(
                      "w-24 h-24 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center transition-all duration-500",
                      isAnimating ? "scale-0 rotate-180" : "scale-100 rotate-0"
                    )}
                  >
                    {currentSlideData.icon === "sparkles" && (
                      <Sparkles className="w-12 h-12 text-white animate-pulse-slow" />
                    )}
                    {currentSlideData.icon === "wand" && (
                      <Wand2 className="w-12 h-12 text-white animate-spin-slow" />
                    )}
                    {currentSlideData.icon === "shield" && (
                      <Shield className="w-12 h-12 text-white animate-bounce-slow" />
                    )}
                  </div>
                </div>
              </div>

              {/* Orbiting dots */}
              <div className="absolute inset-0">
                {[0, 1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="absolute w-3 h-3 rounded-full bg-white/80 animate-orbit"
                    style={{
                      left: '50%',
                      top: '50%',
                      animationDelay: `${i * 0.5}s`,
                      animationDuration: '8s',
                      transformOrigin: `0 -140px`,
                    }}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom section with content */}
        <div className="px-8 pb-12 pt-4">
          {/* Animated typography */}
          <div className="max-w-sm mx-auto text-center">
            {/* Slide indicator */}
            <div className="flex items-center justify-center gap-2 mb-6">
              {slides.map((_, index) => (
                <div
                  key={index}
                  className={cn(
                    "h-1 rounded-full transition-all duration-500 ease-out",
                    index === currentSlide
                      ? "w-12 bg-gradient-to-r from-white to-white/70"
                      : index < currentSlide
                      ? "w-3 bg-white/30"
                      : "w-3 bg-white/10"
                  )}
                />
              ))}
            </div>

            {/* Title with stagger animation */}
            <h1
              className={cn(
                "font-serif text-5xl font-bold text-white leading-tight mb-2",
                "animate-slide-up"
              )}
              style={{ animationDelay: '0.1s' }}
            >
              {currentSlideData.title}
            </h1>

            {/* Subtitle with gradient */}
            <h2
              className={cn(
                "font-serif text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r mb-4",
                currentSlideData.color,
                "animate-slide-up"
              )}
              style={{ animationDelay: '0.2s' }}
            >
              {currentSlideData.subtitle}
            </h2>

            {/* Description */}
            <p
              className="text-white/70 text-lg leading-relaxed mb-8 animate-slide-up"
              style={{ animationDelay: '0.3s' }}
            >
              {currentSlideData.description}
            </p>

            {/* Buttons */}
            <div
              className="space-y-3 animate-slide-up"
              style={{ animationDelay: '0.4s' }}
            >
              {currentSlide === slides.length - 1 ? (
                <>
                  <Button
                    size="lg"
                    className="w-full h-14 bg-white text-foreground hover:bg-white/90 rounded-2xl font-semibold text-base shadow-2xl shadow-white/20 transition-all hover:scale-105 active:scale-95"
                    onClick={() => navigate("/auth")}
                  >
                    {language === "ar" ? "ابدأ الآن" : "Get Started"}
                    <ChevronRight className="w-5 h-5" />
                  </Button>

                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      size="lg"
                      className="h-14 border-2 border-white/30 text-white hover:bg-white/10 rounded-2xl font-semibold backdrop-blur-sm transition-all hover:scale-105 active:scale-95"
                      onClick={() => navigate("/auth")}
                    >
                      {language === "ar" ? "تسجيل" : "Sign In"}
                    </Button>

                    <Button
                      variant="ghost"
                      size="lg"
                      className="h-14 text-white/70 hover:text-white hover:bg-white/10 rounded-2xl font-medium transition-all"
                      onClick={handleSkip}
                    >
                      {language === "ar" ? "ضيف" : "Guest"}
                    </Button>
                  </div>
                </>
              ) : (
                <Button
                  size="lg"
                  className="w-full h-14 bg-gradient-to-r from-white to-white/90 text-foreground hover:from-white/90 hover:to-white/80 rounded-2xl font-semibold text-base shadow-2xl shadow-white/20 transition-all hover:scale-105 active:scale-95"
                  onClick={handleNext}
                  disabled={isAnimating}
                >
                  {language === "ar" ? "التالي" : "Continue"}
                  <ChevronRight className="w-5 h-5" />
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom gradient fade */}
      <div className="fixed bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-foreground via-foreground/80 to-transparent pointer-events-none" />

      <style>{`
        @keyframes morph-blob {
          0%, 100% {
            border-radius: 60% 40% 30% 70% / 60% 30% 70% 40%;
            transform: rotate(0deg) scale(1);
          }
          50% {
            border-radius: 30% 60% 70% 40% / 50% 60% 30% 60%;
            transform: rotate(180deg) scale(1.1);
          }
        }

        @keyframes morph-blob-reverse {
          0%, 100% {
            border-radius: 40% 60% 60% 40% / 60% 30% 70% 40%;
            transform: rotate(0deg) scale(1);
          }
          50% {
            border-radius: 60% 40% 30% 70% / 40% 60% 60% 30%;
            transform: rotate(-180deg) scale(1.15);
          }
        }

        @keyframes float-particle {
          0%, 100% {
            opacity: 0;
            transform: translateY(0) translateX(0) scale(0);
          }
          10% {
            opacity: 1;
          }
          90% {
            opacity: 1;
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) translateX(50px) scale(1);
          }
        }

        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.8;
          }
        }

        @keyframes pulse-ring {
          0% {
            transform: scale(1);
            opacity: 0.5;
          }
          50% {
            transform: scale(1.05);
            opacity: 0.3;
          }
          100% {
            transform: scale(1);
            opacity: 0.5;
          }
        }

        @keyframes float-image {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-10px) rotate(2deg);
          }
        }

        @keyframes bounce-slow {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes orbit {
          0% {
            transform: rotate(0deg) translateX(-140px) rotate(0deg);
          }
          100% {
            transform: rotate(360deg) translateX(-140px) rotate(-360deg);
          }
        }

        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .animate-morph-blob {
          animation: morph-blob 8s ease-in-out infinite;
        }

        .animate-morph-blob-reverse {
          animation: morph-blob-reverse 10s ease-in-out infinite;
        }

        .animate-float-particle {
          animation: float-particle linear infinite;
        }

        .animate-spin-slow {
          animation: spin-slow linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-pulse-ring {
          animation: pulse-ring 3s ease-in-out infinite;
        }

        .animate-bounce-slow {
          animation: bounce-slow 2s ease-in-out infinite;
        }

        .animate-orbit {
          animation: orbit 8s linear infinite;
        }

        .animate-slide-up {
          animation: slide-up 0.6s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
