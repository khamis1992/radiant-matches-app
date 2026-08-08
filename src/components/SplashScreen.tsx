import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * SplashScreen — GLAM brand launch screen.
 * Light surface with the original logo lockup (brand rule: original asset only,
 * no decorative accents), a thin ink progress line, and calm fade-in motion.
 */

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  // Brand: light surface, original logo asset, no decorative accents
  const [progress, setProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

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
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-white">
      {/* Main Content */}
      <div className="relative z-10 flex min-h-screen flex-col items-center justify-center">

        {/* Brand lockup — original asset, 240px per brand splash sizing */}
        <div className={cn(
          "mb-12 transition-all duration-1000 ease-out",
          isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"
        )}>
          <img
            src="/brand/glam-logo-light.png"
            alt="GLAM Beauty"
            draggable={false}
            className="w-60 mix-blend-multiply"
          />
        </div>

        {/* Minimal Progress Indicator */}
        <div className={cn(
          "absolute bottom-20 w-64 transition-all duration-1000 delay-500 ease-out",
          isVisible ? "opacity-100" : "opacity-0"
        )}>
           <div className="h-0.5 w-full bg-glam-surface overflow-hidden">
             <div
               className="h-full bg-glam-ink transition-all duration-100 ease-out"
               style={{ width: `${progress}%` }}
             />
           </div>
           <div className="mt-2 text-center text-[10px] text-glam-muted tracking-widest">
             {progressLabel}
           </div>
        </div>

      </div>
    </div>
  );
};

export default SplashScreen;
