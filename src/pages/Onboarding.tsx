import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight, ChevronLeft } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppRole } from "@/hooks/useUserRole";
import { SplashScreen } from "@/components/SplashScreen";
import heroImage from "@/assets/hero-makeup.jpg";

const getSlides = (language: "en" | "ar") => {
  if (language === "ar") {
    return [
      {
        title: "اكتشفي فنانات موهوبات",
        description: "جدي فنانة المكياج المثالية لأي مناسبة بالقرب منك",
      },
      {
        title: "احجزي فوراً",
        description: "جدولي مواعيدك في ثوانٍ مع التوفر في الوقت الفعلي",
      },
      {
        title: "ادفعي بأمان",
        description: "مدفوعات آمنة وتقييمات صادقة من عملاء موثوقين",
      },
    ];
  }
  return [
    {
      title: "Discover Talented Artists",
      description: "Find the perfect makeup artist for any occasion near you",
    },
    {
      title: "Book Instantly",
      description: "Schedule appointments in seconds with real-time availability",
    },
    {
      title: "Pay Securely",
      description: "Secure payments and honest reviews from verified customers",
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
      navigate("/home");
    }
  };

  const handleSkip = () => {
    navigate("/home");
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Hero Image */}
      <div className="relative h-[55vh] overflow-hidden">
        <img
          src={heroImage}
          alt="Makeup Artist"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      {/* Content */}
      <div className="flex-1 px-6 py-8 -mt-16 relative z-10">
        <div className="animate-fade-in-up" key={currentSlide}>
          <h2 className="text-3xl font-bold text-foreground leading-tight">
            {slides[currentSlide].title}
          </h2>
          <p className="mt-3 text-muted-foreground text-lg">
            {slides[currentSlide].description}
          </p>
        </div>

        {/* Dots */}
        <div className="flex gap-2 mt-8">
          {slides.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide
                  ? "w-8 bg-primary"
                  : "w-2 bg-muted hover:bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* Buttons */}
        <div className="mt-auto pt-8 space-y-3">
          {currentSlide === slides.length - 1 ? (
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                {language === "ar" ? "إنشاء حساب" : "Create Account"}
                {isRTL ? (
                  <ChevronLeft className="w-5 h-5 ms-1" />
                ) : (
                  <ChevronRight className="w-5 h-5 ms-1" />
                )}
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                {language === "ar" ? "تسجيل الدخول" : "Sign In"}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={() => navigate("/home")}
              >
                {language === "ar" ? "المتابعة كضيف" : "Continue as Guest"}
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={handleNext}
              >
                {language === "ar" ? "التالي" : "Next"}
                {isRTL ? (
                  <ChevronLeft className="w-5 h-5 ms-1" />
                ) : (
                  <ChevronRight className="w-5 h-5 ms-1" />
                )}
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={handleSkip}
              >
                {language === "ar" ? "تخطي" : "Skip"}
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
