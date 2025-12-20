import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import heroImage from "@/assets/hero-makeup.jpg";
import logoImage from "@/assets/logo.png";

const slides = [
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

const Onboarding = () => {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [showSplash, setShowSplash] = useState(true);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        navigate("/home", { replace: true });
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
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-background via-[hsl(350,45%,95%)] to-background">
        <div className="animate-scale-in text-center">
          <img 
            src={logoImage} 
            alt="Glam Beauty Marketplace" 
            className="w-48 h-auto mx-auto"
          />
        </div>
      </div>
    );
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
                Create Account
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="w-full"
                onClick={() => navigate("/auth")}
              >
                Sign In
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={() => navigate("/home")}
              >
                Continue as Guest
              </Button>
            </>
          ) : (
            <>
              <Button
                size="lg"
                className="w-full"
                onClick={handleNext}
              >
                Next
                <ChevronRight className="w-5 h-5 ml-1" />
              </Button>
              <Button
                variant="ghost"
                size="lg"
                className="w-full text-muted-foreground"
                onClick={handleSkip}
              >
                Skip
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
