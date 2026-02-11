import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Sparkles, Calendar, Shield, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppRole } from "@/hooks/useUserRole";
import { SplashScreen } from "@/components/SplashScreen";
import { cn } from "@/lib/utils";

// Using app's color palette consistently
const getSlides = (language: "en" | "ar") => {
  if (language === "ar") {
    return [
      {
        id: 1,
        title: "اكتشفي",
        highlight: "فنانين مميزين",
        description: "تصفحي مجموعة مختارة من خبراء التجميل المحترفين",
        icon: Sparkles,
        gradient: "from-rose-100/50 via-pink-50/30 to-background",
        delay: 0,
      },
      {
        id: 2,
        title: "احجزي",
        highlight: "بكل سهولة",
        description: "حددي موعدك المفضل بخطوات بسيطة وسريعة",
        icon: Calendar,
        gradient: "from-amber-100/50 via-orange-50/30 to-background",
        delay: 0.1,
      },
      {
        id: 3,
        title: "ادفعي",
        highlight: "بأمان تام",
        description: "دفع إلكتروني آمن مع ضمان استرداد الأموال",
        icon: Shield,
        gradient: "from-rose-100/50 via-pink-50/30 to-background",
        delay: 0.2,
      },
    ];
  }
  return [
    {
      id: 1,
      title: "Discover",
      highlight: "Elite Artists",
      description: "Browse a curated selection of professional beauty experts",
      icon: Sparkles,
      gradient: "from-rose-100/50 via-pink-50/30 to-background",
      delay: 0,
    },
    {
      id: 2,
      title: "Book",
      highlight: "With Ease",
      description: "Schedule your perfect appointment in simple, quick steps",
      icon: Calendar,
      gradient: "from-amber-100/50 via-orange-50/30 to-background",
      delay: 0.1,
    },
    {
      id: 3,
      title: "Pay",
      highlight: "Securely",
      description: "Safe electronic payment with money-back guarantee",
      icon: Shield,
      gradient: "from-rose-100/50 via-pink-50/30 to-background",
      delay: 0.2,
    },
  ];
};

// Animated illustration with Lottie-like effects
const AnimatedIllustration = ({ 
  icon: Icon, 
  isActive,
  isRTL
}: { 
  icon: React.ElementType; 
  isActive: boolean;
  isRTL: boolean;
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  useEffect(() => {
    if (!canvasRef.current || !isActive) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    // Set canvas size
    canvas.width = 300;
    canvas.height = 300;
    
    let animationId: number;
    let time = 0;
    
    const particles: Array<{
      x: number;
      y: number;
      size: number;
      speedX: number;
      speedY: number;
      opacity: number;
      color: string;
    }> = [];
    
    // Create particles
    for (let i = 0; i < 15; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 4 + 2,
        speedX: (Math.random() - 0.5) * 0.5,
        speedY: (Math.random() - 0.5) * 0.5,
        opacity: Math.random() * 0.5 + 0.2,
        color: i % 2 === 0 ? '#ec4899' : '#d97706'
      });
    }
    
    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      time += 0.02;
      
      // Draw rotating outer ring
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(time * 0.5);
      ctx.beginPath();
      ctx.arc(0, 0, 130, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(236, 72, 153, 0.15)';
      ctx.lineWidth = 2;
      ctx.setLineDash([20, 10]);
      ctx.stroke();
      ctx.restore();
      
      // Draw inner ring (opposite direction)
      ctx.save();
      ctx.translate(canvas.width / 2, canvas.height / 2);
      ctx.rotate(-time * 0.3);
      ctx.beginPath();
      ctx.arc(0, 0, 110, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(217, 119, 6, 0.12)';
      ctx.lineWidth = 2;
      ctx.setLineDash([15, 15]);
      ctx.stroke();
      ctx.restore();
      
      // Draw floating particles
      particles.forEach((particle, i) => {
        particle.x += particle.speedX;
        particle.y += particle.speedY;
        
        // Bounce off edges
        if (particle.x < 0 || particle.x > canvas.width) particle.speedX *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.speedY *= -1;
        
        // Pulsing opacity
        const pulseOpacity = particle.opacity + Math.sin(time + i) * 0.2;
        
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        const alphaValue = Math.floor(Math.max(0, Math.min(255, pulseOpacity * 255)));
        ctx.fillStyle = particle.color + alphaValue.toString(16).padStart(2, '0');
        ctx.fill();
      });
      
      // Draw center glow
      const gradient = ctx.createRadialGradient(
        canvas.width / 2, canvas.height / 2, 0,
        canvas.width / 2, canvas.height / 2, 90
      );
      gradient.addColorStop(0, 'rgba(236, 72, 153, 0.1)');
      gradient.addColorStop(1, 'rgba(236, 72, 153, 0)');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      animationId = requestAnimationFrame(animate);
    };
    
    animate();
    
    return () => {
      cancelAnimationFrame(animationId);
    };
  }, [isActive]);

  return (
    <div className="relative w-72 h-72 mx-auto">
      {/* Canvas for particle animation */}
      <canvas 
        ref={canvasRef}
        className={cn(
          "absolute inset-0 w-full h-full transition-opacity duration-500",
          isActive ? "opacity-100" : "opacity-0"
        )}
      />
      
      {/* Central icon container */}
      <div 
        className={cn(
          "absolute inset-0 flex items-center justify-center transition-all duration-500",
          isActive ? "scale-100 opacity-100" : "scale-90 opacity-0"
        )}
        style={{ transitionDelay: isActive ? '200ms' : '0ms' }}
      >
        <div 
          className={cn(
            "relative w-24 h-24 rounded-3xl flex items-center justify-center transition-transform duration-300",
            "bg-gradient-to-br from-rose-100 to-amber-50 shadow-xl"
          )}
          style={{
            boxShadow: '0 25px 50px -12px rgba(236, 72, 153, 0.25)',
            transform: isActive ? 'translateY(0)' : 'translateY(20px)'
          }}
        >
          {/* Inner glow */}
          <div 
            className="absolute inset-0 rounded-3xl opacity-50"
            style={{
              background: 'radial-gradient(circle at 30% 30%, rgba(255,255,255,0.8), transparent)'
            }}
          />
          
          <Icon 
            className="w-12 h-12 relative z-10"
            style={{ color: 'hsl(var(--primary))' }}
            strokeWidth={1.5}
          />
          
          {/* Shine effect */}
          <div 
            className="absolute top-2 right-2 w-6 h-6 rounded-full opacity-60"
            style={{
              background: 'radial-gradient(circle, rgba(255,255,255,0.9) 0%, transparent 70%)'
            }}
          />
        </div>
      </div>
      
      {/* Decorative elements */}
      <div 
        className={cn(
          "absolute top-8 right-8 w-3 h-3 rounded-full bg-amber-400/60 transition-all duration-700",
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}
        style={{ transitionDelay: '400ms' }}
      />
      <div 
        className={cn(
          "absolute bottom-12 left-10 w-2 h-2 rounded-full bg-rose-400/60 transition-all duration-700",
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}
        style={{ transitionDelay: '500ms' }}
      />
      <div 
        className={cn(
          "absolute top-1/3 left-6 w-2 h-2 rounded-full bg-pink-400/40 transition-all duration-700",
          isActive ? "opacity-100 scale-100" : "opacity-0 scale-0"
        )}
        style={{ transitionDelay: '600ms' }}
      />
    </div>
  );
};

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');
  const navigate = useNavigate();
  const { language, isRTL } = useLanguage();
  const touchStartX = useRef(0);

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

  // Handle swipe gestures
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diff = touchStartX.current - touchEndX;
    
    if (Math.abs(diff) > 50) {
      if (diff > 0 && currentSlide < slides.length - 1) {
        // Swipe left - next
        handleNext();
      } else if (diff < 0 && currentSlide > 0) {
        // Swipe right - previous
        handlePrev();
      }
    }
  };

  if (checkingAuth) {
    return null;
  }

  const handleNext = () => {
    if (isAnimating || currentSlide >= slides.length - 1) return;
    setDirection('next');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(currentSlide + 1);
      setIsAnimating(false);
    }, 500);
  };

  const handlePrev = () => {
    if (isAnimating || currentSlide <= 0) return;
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(currentSlide - 1);
      setIsAnimating(false);
    }, 500);
  };

  const handleSkip = () => {
    navigate("/home");
  };

  const goToSlide = (index: number) => {
    if (isAnimating || index === currentSlide) return;
    setDirection(index > currentSlide ? 'next' : 'prev');
    setIsAnimating(true);
    setTimeout(() => {
      setCurrentSlide(index);
      setIsAnimating(false);
    }, 500);
  };

  if (showSplash) {
    return <SplashScreen onComplete={() => setShowSplash(false)} />;
  }

  const isLastSlide = currentSlide === slides.length - 1;
  const IconComponent = currentSlideData.icon;

  return (
    <div 
      className="min-h-screen relative overflow-hidden bg-background"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Animated background gradient */}
      <div 
        className={cn(
          "absolute inset-0 bg-gradient-to-b transition-all duration-1000",
          currentSlideData.gradient
        )}
      />
      
      {/* Floating decorative shapes */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Large soft blob - top */}
        <div 
          className={cn(
            "absolute -top-32 -right-32 w-96 h-96 rounded-full blur-3xl transition-all duration-1000",
            isAnimating ? "opacity-20 scale-75" : "opacity-40 scale-100"
          )}
          style={{ 
            background: 'hsl(var(--primary) / 0.3)',
            transform: isAnimating && direction === 'next' 
              ? 'translateX(-100px) scale(0.75)' 
              : isAnimating && direction === 'prev'
              ? 'translateX(100px) scale(0.75)'
              : 'translateX(0) scale(1)'
          }}
        />
        
        {/* Gold accent blob - bottom */}
        <div 
          className={cn(
            "absolute -bottom-32 -left-32 w-80 h-80 rounded-full blur-3xl transition-all duration-1000 delay-150",
            isAnimating ? "opacity-20 scale-75" : "opacity-30 scale-100"
          )}
          style={{ 
            background: 'hsl(var(--gold) / 0.25)',
            transform: isAnimating && direction === 'next' 
              ? 'translateX(100px) scale(0.75)' 
              : isAnimating && direction === 'prev'
              ? 'translateX(-100px) scale(0.75)'
              : 'translateX(0) scale(1)'
          }}
        />
      </div>

      {/* Main content */}
      <div className="relative z-10 min-h-screen flex flex-col">
        {/* Header with skip */}
        <div className="flex justify-end p-6">
          <button
            onClick={handleSkip}
            className="px-5 py-2.5 text-sm font-medium rounded-full transition-all duration-200 hover:bg-foreground/5 text-muted-foreground"
          >
            {language === "ar" ? "تخطي" : "Skip"}
          </button>
        </div>

        {/* Illustration section */}
        <div className="flex-1 flex items-center justify-center px-6">
          <AnimatedIllustration 
            icon={IconComponent}
            isActive={!isAnimating}
            isRTL={isRTL}
          />
        </div>

        {/* Content section */}
        <div className="px-8 pb-16 pt-4">
          <div className="max-w-sm mx-auto">
            {/* Title with slide animation */}
            <div 
              className={cn(
                "text-center mb-3 transition-all duration-500",
                isAnimating 
                  ? direction === 'next' 
                    ? "opacity-0 -translate-x-12" 
                    : "opacity-0 translate-x-12"
                  : "opacity-100 translate-x-0"
              )}
            >
              <h1 className="text-foreground text-3xl font-bold tracking-tight">
                {currentSlideData.title}
              </h1>
            </div>

            {/* Highlight */}
            <div 
              className={cn(
                "text-center mb-4 transition-all duration-500 delay-75",
                isAnimating 
                  ? direction === 'next' 
                    ? "opacity-0 -translate-x-12" 
                    : "opacity-0 translate-x-12"
                  : "opacity-100 translate-x-0"
              )}
            >
              <span 
                className="text-3xl font-bold"
                style={{ color: 'hsl(var(--primary))' }}
              >
                {currentSlideData.highlight}
              </span>
            </div>

            {/* Description */}
            <p 
              className={cn(
                "text-center text-muted-foreground text-base leading-relaxed mb-8 transition-all duration-500 delay-150",
                isAnimating 
                  ? direction === 'next' 
                    ? "opacity-0 -translate-x-12" 
                    : "opacity-0 translate-x-12"
                  : "opacity-100 translate-x-0"
              )}
            >
              {currentSlideData.description}
            </p>

            {/* Page indicators with animation */}
            <div className="flex items-center justify-center gap-2 mb-8">
              {slides.map((slide, index) => (
                <button
                  key={slide.id}
                  onClick={() => goToSlide(index)}
                  className={cn(
                    "h-2 rounded-full transition-all duration-500",
                    index === currentSlide
                      ? "w-8 bg-primary"
                      : "w-2 bg-muted hover:bg-muted-foreground/30"
                  )}
                  style={{
                    transform: index === currentSlide ? 'scale(1)' : 'scale(0.9)'
                  }}
                  aria-label={`Go to slide ${index + 1}`}
                />
              ))}
            </div>

            {/* Action button with press animation */}
            <div 
              className={cn(
                "transition-all duration-500 delay-200",
                isAnimating 
                  ? direction === 'next' 
                    ? "opacity-0 -translate-x-12" 
                    : "opacity-0 translate-x-12"
                  : "opacity-100 translate-x-0"
              )}
            >
              {isLastSlide ? (
                <div className="space-y-4">
                  {/* Primary CTA */}
                  <Button
                    size="lg"
                    className={cn(
                      "w-full h-14 rounded-2xl font-semibold text-base shadow-lg transition-all duration-200",
                      "bg-primary hover:bg-primary/90 text-primary-foreground",
                      "active:scale-[0.98] hover:shadow-xl hover:shadow-primary/25"
                    )}
                    onClick={() => navigate("/auth")}
                  >
                    {language === "ar" ? "ابدأي الآن" : "Get Started"}
                    <ChevronRight className={cn("w-5 h-5", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                  </Button>

                  {/* Secondary actions */}
                  <div className="flex items-center justify-center gap-6 pt-2">
                    <button
                      onClick={() => navigate("/auth")}
                      className="text-sm font-semibold transition-colors hover:text-primary text-foreground"
                    >
                      {language === "ar" ? "تسجيل الدخول" : "Sign In"}
                    </button>
                    <div className="w-px h-4 bg-border" />
                    <button
                      onClick={handleSkip}
                      className="text-sm font-medium transition-colors hover:text-foreground text-muted-foreground"
                    >
                      {language === "ar" ? "تصفح كضيف" : "Continue as Guest"}
                    </button>
                  </div>
                </div>
              ) : (
                <Button
                  size="lg"
                  className={cn(
                    "w-full h-14 rounded-2xl font-semibold text-base shadow-lg transition-all duration-200",
                    "bg-foreground hover:bg-foreground/90 text-background",
                    "active:scale-[0.98] hover:shadow-xl hover:shadow-foreground/20"
                  )}
                  onClick={handleNext}
                >
                  {language === "ar" ? "التالي" : "Next"}
                  <ChevronRight className={cn("w-5 h-5", isRTL ? "mr-2 rotate-180" : "ml-2")} />
                </Button>
              )}
            </div>

            {/* Swipe hint */}
            <p className="text-center mt-6 text-xs text-muted-foreground/60 md:hidden">
              {language === "ar" ? "اسحب للتنقل" : "Swipe to navigate"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
