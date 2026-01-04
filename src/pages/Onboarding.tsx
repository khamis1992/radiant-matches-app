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
        number: "١",
        title: "اكتشفي",
        subtitle: "الفنانين",
        description: "مئات الفنانين الموهوبين في انتظارك",
        accent: "روائع",
        layout: "split-diagonal",
      },
      {
        number: "٢",
        title: "احجزي",
        subtitle: "فوري",
        description: "حجز سريع وآمن في ثوانٍ",
        accent: "سهل",
        layout: "circle-focus",
      },
      {
        number: "٣",
        title: "ادفعي",
        subtitle: "بأمان",
        description: "مدفوعات محمية وموثوقة",
        accent: "آمن",
        layout: "split-reverse",
      },
    ];
  }
  return [
    {
      number: "1",
      title: "Discover",
      subtitle: "Artists",
      description: "Hundreds of talented artists await",
      accent: "Amazing",
      layout: "split-diagonal",
    },
    {
      number: "2",
      title: "Book",
      subtitle: "Instantly",
      description: "Quick, secure booking in seconds",
      accent: "Easy",
      layout: "circle-focus",
    },
    {
      number: "3",
      title: "Pay",
      subtitle: "Securely",
      description: "Protected payments you can trust",
      accent: "Safe",
      layout: "split-reverse",
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
    <div className="min-h-screen bg-white overflow-hidden relative">
      {/* Skip button */}
      <button
        onClick={handleSkip}
        className="fixed top-6 right-6 z-50 w-10 h-10 rounded-full bg-white border-2 border-foreground flex items-center justify-center hover:bg-foreground hover:text-white transition-all"
      >
        <X className="w-5 h-5" />
      </button>

      {/* Slide 1: Split Diagonal */}
      {currentSlide === 0 && (
        <div className="min-h-screen relative animate-fade-in">
          {/* Diagonal split */}
          <div className="absolute inset-0 flex">
            {/* Left section - image */}
            <div className="w-3/5 relative overflow-hidden">
              <img
                src={heroImage}
                alt="Makeup"
                className="w-full h-full object-cover"
              />
              {/* Diagonal cut overlay */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent to-white/20" />
            </div>

            {/* Right section - content */}
            <div className="w-2/5 bg-foreground text-white flex flex-col justify-center p-8 relative">
              {/* Giant number */}
              <div className="absolute top-8 right-8 text-[120px] font-bold text-white/5 leading-none">
                {currentSlideData.number}
              </div>

              {/* Geometric accent */}
              <div className="absolute -top-12 -left-12 w-32 h-32 bg-gold/30 rounded-full blur-2xl" />

              {/* Content */}
              <div className="relative z-10">
                <div className="inline-block px-4 py-1 rounded-full bg-gold text-foreground text-sm font-bold mb-6">
                  {currentSlideData.accent}
                </div>

                <h1 className="font-serif text-6xl font-bold leading-none mb-4">
                  {currentSlideData.title}
                </h1>

                <h2 className="font-serif text-4xl text-gold mb-6">
                  {currentSlideData.subtitle}
                </h2>

                <p className="text-white/70 text-lg mb-8">
                  {currentSlideData.description}
                </p>
              </div>

              {/* Geometric decoration */}
              <div className="absolute bottom-8 left-8 w-16 h-16 border-2 border-gold/30 rotate-45" />
            </div>

            {/* Diagonal separator */}
            <div
              className="absolute top-0 bottom-0 w-4 bg-white"
              style={{ left: '60%', transform: 'skewX(-5deg)' }}
            />
          </div>
        </div>
      )}

      {/* Slide 2: Circle Focus */}
      {currentSlide === 1 && (
        <div className="min-h-screen relative animate-fade-in">
          {/* Background with pattern */}
          <div className="absolute inset-0 bg-gradient-to-br from-rose-50 to-white">
            {/* Geometric pattern */}
            <svg className="absolute inset-0 w-full h-full opacity-10">
              <defs>
                <pattern id="triangles" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
                  <polygon points="20,5 35,35 5,35" fill="currentColor" />
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#triangles)" />
            </svg>
          </div>

          {/* Content */}
          <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-8 py-24">
            {/* Floating circle image */}
            <div className="relative mb-12">
              {/* Outer ring */}
              <div className="absolute inset-0 -m-4 rounded-full border-4 border-primary/20" />
              {/* Middle ring */}
              <div className="absolute inset-0 -m-2 rounded-full border-2 border-gold/40" />
              {/* Image circle */}
              <div className="w-56 h-56 rounded-full overflow-hidden border-8 border-white shadow-2xl relative z-10">
                <img
                  src={heroImage}
                  alt="Makeup"
                  className="w-full h-full object-cover"
                />
              </div>
              {/* Floating badge */}
              <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-foreground text-white px-6 py-3 rounded-full shadow-xl">
                <span className="text-4xl font-bold">{currentSlideData.number}</span>
              </div>
            </div>

            {/* Text content */}
            <div className="text-center max-w-sm">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary text-white text-sm font-bold mb-6">
                <Wand2 className="w-4 h-4" />
                {currentSlideData.accent}
              </div>

              <h1 className="font-serif text-5xl font-bold text-foreground mb-3">
                {currentSlideData.title}
              </h1>

              <h2 className="font-serif text-3xl text-primary mb-6">
                {currentSlideData.subtitle}
              </h2>

              <p className="text-muted-foreground text-lg">
                {currentSlideData.description}
              </p>
            </div>

            {/* Geometric decorations */}
            <div className="absolute top-20 left-8 w-12 h-12 bg-primary/20 rotate-45" />
            <div className="absolute bottom-32 right-12 w-8 h-8 bg-gold/30 rounded-full" />
            <div className="absolute top-1/2 right-8 w-2 h-32 bg-foreground/10" />
          </div>
        </div>
      )}

      {/* Slide 3: Split Reverse */}
      {currentSlide === 2 && (
        <div className="min-h-screen relative animate-fade-in">
          {/* Reverse diagonal split */}
          <div className="absolute inset-0 flex">
            {/* Left section - content */}
            <div className="w-2/5 bg-gradient-to-br from-gold/20 to-gold/5 text-foreground flex flex-col justify-center p-8 relative">
              {/* Giant number */}
              <div className="absolute top-8 left-8 text-[120px] font-bold text-gold/10 leading-none">
                {currentSlideData.number}
              </div>

              {/* Geometric accent */}
              <div className="absolute -bottom-12 -right-12 w-40 h-40 bg-primary/20 rounded-full blur-3xl" />

              {/* Content */}
              <div className="relative z-10">
                <div className="inline-block px-4 py-1 rounded-full bg-foreground text-white text-sm font-bold mb-6">
                  <Shield className="w-4 h-4 inline mr-2" />
                  {currentSlideData.accent}
                </div>

                <h1 className="font-serif text-6xl font-bold leading-none mb-4">
                  {currentSlideData.title}
                </h1>

                <h2 className="font-serif text-4xl text-primary mb-6">
                  {currentSlideData.subtitle}
                </h2>

                <p className="text-foreground/70 text-lg mb-8">
                  {currentSlideData.description}
                </p>
              </div>

              {/* Geometric decoration */}
              <div className="absolute bottom-8 right-8 w-20 h-20 border-4 border-primary/20" />
            </div>

            {/* Right section - image */}
            <div className="w-3/5 relative overflow-hidden">
              <img
                src={heroImage}
                alt="Makeup"
                className="w-full h-full object-cover"
              />
              {/* Overlay */}
              <div className="absolute inset-0 bg-gradient-to-l from-transparent to-gold/10" />
            </div>

            {/* Diagonal separator */}
            <div
              className="absolute top-0 bottom-0 w-4 bg-white shadow-lg"
              style={{ left: '40%', transform: 'skewX(5deg)' }}
            />
          </div>
        </div>
      )}

      {/* Bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 p-6 z-50 bg-gradient-to-t from-white via-white to-transparent">
        <div className="max-w-sm mx-auto">
          {/* Geometric progress indicator */}
          <div className="flex items-center justify-center gap-3 mb-6">
            {slides.map((_, index) => (
              <div
                key={index}
                className={cn(
                  "relative w-12 h-12 transition-all duration-300",
                  index <= currentSlide ? "opacity-100" : "opacity-30"
                )}
              >
                {/* Triangle shape */}
                <svg viewBox="0 0 48 48" className="w-full h-full">
                  <polygon
                    points={index === currentSlide
                      ? "24,4 44,44 4,44"
                      : "24,12 40,40 8,40"
                    }
                    fill={index === currentSlide ? "currentColor" : "none"}
                    stroke="currentColor"
                    strokeWidth="2"
                    className={cn(
                      "transition-all duration-300",
                      index === currentSlide ? "text-primary" : "text-foreground/30"
                    )}
                  />
                </svg>
              </div>
            ))}
          </div>

          {/* Buttons */}
          {currentSlide === slides.length - 1 ? (
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full h-14 bg-foreground hover:bg-foreground/90 text-white rounded-none font-semibold text-base uppercase tracking-wider"
                onClick={() => navigate("/auth")}
              >
                {language === "ar" ? "ابدأ" : "Get Started"}
                <ChevronRight className="w-5 h-5" />
              </Button>

              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 border-2 border-foreground text-foreground hover:bg-foreground hover:text-white rounded-none font-semibold uppercase tracking-wider"
                  onClick={() => navigate("/auth")}
                >
                  {language === "ar" ? "دخول" : "Sign In"}
                </Button>

                <Button
                  variant="ghost"
                  size="lg"
                  className="h-14 text-muted-foreground hover:bg-foreground/5 rounded-none font-medium"
                  onClick={handleSkip}
                >
                  {language === "ar" ? "ضيف" : "Guest"}
                </Button>
              </div>
            </div>
          ) : (
            <Button
              size="lg"
              className="w-full h-14 bg-foreground hover:bg-foreground/90 text-white rounded-none font-semibold uppercase tracking-wider"
              onClick={handleNext}
            >
              {language === "ar" ? "التالي" : "Continue"}
              <ChevronRight className="w-5 h-5" />
            </Button>
          )}
        </div>
      </div>

      <style>{`
        @keyframes fade-in {
          from {
            opacity: 0;
            transform: scale(0.98);
          }
          to {
            opacity: 1;
            transform: scale(1);
          }
        }

        .animate-fade-in {
          animation: fade-in 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  );
};

export default Onboarding;
