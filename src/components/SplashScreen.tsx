import { useEffect, useMemo, useState } from "react";
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
  const [pulse, setPulse] = useState(false);

  const progressLabel = useMemo(() => `${Math.min(progress, 100)}%`, [progress]);

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

    // Subtle pulse animation for logo glow
    const pulseInterval = setInterval(() => {
      setPulse((prev) => !prev);
    }, 700);

    // Completion callback
    const completeTimer = setTimeout(() => {
      onComplete?.();
    }, duration);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
      clearInterval(pulseInterval);
      document.body.style.overflow = '';
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-background">
      {/* Premium Background with subtle texture */}
      <div 
        className="absolute inset-0 opacity-20"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.15'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
        }}
      />
      
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">
        
        {/* Animated Logo Container */}
        <div className={cn(
          "mb-12 relative transition-all duration-1000 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          {/* Subtle rotating glow ring */}
          <div className="absolute inset-0 -m-8 rounded-full border border-primary/20 animate-spin-slow opacity-60" />
          <div className="absolute inset-0 -m-4 rounded-full border border-gold/30 animate-[spin-slow_15s_linear_infinite_reverse] opacity-60" />
          
          {/* Logo */}
          <div className="relative h-32 w-32 drop-shadow-2xl">
            <img
              src={logo}
              alt="Glam"
              className="w-full h-full object-contain"
            />
          </div>
        </div>

        {/* Typography */}
        <div className={cn(
          "text-center transition-all duration-1000 delay-300 ease-out",
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
        )}>
          <h1 className="text-6xl font-serif font-bold tracking-tight text-foreground mb-4">
            GLAM
          </h1>
          <p className="text-sm uppercase tracking-[0.4em] text-muted-foreground font-medium">
            Beauty, Redefined
          </p>
        </div>

        {/* Minimal Progress Indicator */}
        <div className={cn(
          "absolute bottom-20 w-64 transition-all duration-1000 delay-500 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
           <div className="h-0.5 w-full bg-muted overflow-hidden">
             <div 
               className="h-full bg-foreground transition-all duration-100 ease-out"
               style={{ width: `${progress}%` }}
             />
           </div>
           <div className="mt-2 text-center text-[10px] text-muted-foreground tracking-widest">
             {progressLabel}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;
