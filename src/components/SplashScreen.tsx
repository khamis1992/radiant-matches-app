import { useEffect, useState } from "react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

/**
 * SplashScreen - Modern Minimal Loading Experience
 *
 * A clean, elegant splash screen featuring:
 * - Soft gradient background using app's color palette
 * - Smooth fade-in animations
 * - Simple progress indicator
 * - Minimal typography
 * - Clean aesthetics matching the app's design system
 */

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    document.body.style.overflow = 'hidden';

    // Fade in content
    const fadeTimer = setTimeout(() => setIsVisible(true), 100);

    // Progress animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, duration / 50);

    // Completion callback
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
      document.body.style.overflow = '';
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-background">
      {/* Soft gradient overlay using app colors */}
      <div 
        className="absolute inset-0 opacity-30"
        style={{
          background: `radial-gradient(ellipse at 30% 20%, hsl(var(--primary) / 0.15) 0%, transparent 50%),
                       radial-gradient(ellipse at 70% 80%, hsl(var(--gold) / 0.1) 0%, transparent 50%),
                       radial-gradient(ellipse at 50% 50%, hsl(var(--blush) / 0.2) 0%, transparent 70%)`
        }}
      />

      {/* Minimal decorative elements */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Top accent line */}
        <div 
          className={cn(
            "absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-primary/30 to-transparent transition-all duration-1000",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        />
        
        {/* Bottom accent line */}
        <div 
          className={cn(
            "absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/30 to-transparent transition-all duration-1000 delay-300",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        />
      </div>

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo with soft entrance */}
        <div
          className={cn(
            "mb-10 transition-all duration-700 ease-out",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <div className="relative">
            {/* Soft glow */}
            <div 
              className="absolute inset-0 -m-6 rounded-full blur-2xl opacity-40"
              style={{ background: 'hsl(var(--primary) / 0.3)' }}
            />
            
            {/* Logo */}
            <div className="relative w-28 h-28">
              <img
                src={logo}
                alt="Glam"
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>

        {/* Brand name with staggered reveal */}
        <div 
          className={cn(
            "mb-4 transition-all duration-700 ease-out delay-200",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
        >
          <h1 
            className="text-5xl font-semibold tracking-tight"
            style={{ color: 'hsl(var(--foreground))' }}
          >
            GLAM
          </h1>
        </div>

        {/* Tagline */}
        <p 
          className={cn(
            "text-sm font-medium tracking-[0.25em] uppercase mb-16 transition-all duration-700 ease-out delay-300",
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          )}
          style={{ color: 'hsl(var(--muted-foreground))' }}
        >
          Beauty, Redefined
        </p>

        {/* Minimal progress bar */}
        <div 
          className={cn(
            "w-56 h-1 rounded-full overflow-hidden bg-muted transition-all duration-700 ease-out delay-500",
            isVisible ? "opacity-100" : "opacity-0"
          )}
        >
          <div
            className="h-full rounded-full transition-all duration-100 ease-out"
            style={{ 
              width: `${progress}%`,
              background: 'linear-gradient(90deg, hsl(var(--primary)), hsl(var(--gold)))'
            }}
          />
        </div>

        {/* Progress text */}
        <p 
          className={cn(
            "mt-4 text-xs font-medium tabular-nums transition-all duration-700 ease-out delay-500",
            isVisible ? "opacity-100" : "opacity-0"
          )}
          style={{ color: 'hsl(var(--muted-foreground) / 0.7)' }}
        >
          {progress}%
        </p>
      </div>

      {/* Subtle corner accents */}
      <div 
        className={cn(
          "absolute top-8 left-8 w-12 h-12 border-l-2 border-t-2 rounded-tl-lg transition-all duration-700 delay-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ borderColor: 'hsl(var(--primary) / 0.2)' }}
      />
      
      <div 
        className={cn(
          "absolute bottom-8 right-8 w-12 h-12 border-r-2 border-b-2 rounded-br-lg transition-all duration-700 delay-700",
          isVisible ? "opacity-100" : "opacity-0"
        )}
        style={{ borderColor: 'hsl(var(--gold) / 0.2)' }}
      />
    </div>
  );
};

export default SplashScreen;
