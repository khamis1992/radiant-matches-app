import { useEffect, useState, useRef } from "react";
import { Sparkles } from "lucide-react";
import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

/**
 * SplashScreen - Editorial Luxury Beauty Loading Experience
 *
 * A premium, fashion-magazine inspired loading screen with:
 * - Staggered typography reveal animations
 * - Floating cosmetic silhouettes
 * - Gold shimmer particles
 * - Elegant progress indicator
 * - Smooth exit transitions
 */

interface SplashScreenProps {
  onComplete?: () => void;
  duration?: number;
}

export const SplashScreen = ({ onComplete, duration = 2500 }: SplashScreenProps) => {
  const [progress, setProgress] = useState(0);
  const [showTagline, setShowTagline] = useState(false);
  const [showParticles, setShowParticles] = useState(false);
  const [phase, setPhase] = useState<"logo" | "text" | "tagline" | "complete">("logo");

  useEffect(() => {
    // Phase 1: Logo reveal (0-500ms)
    const logoTimer = setTimeout(() => {
      setPhase("text");
      setShowParticles(true);
    }, 500);

    // Phase 2: Text reveal (500-1200ms)
    const textTimer = setTimeout(() => {
      setShowTagline(true);
    }, 1200);

    // Phase 3: Tagline and particles (1200-2000ms)
    const taglineTimer = setTimeout(() => {
      setPhase("complete");
    }, 2000);

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
      clearTimeout(logoTimer);
      clearTimeout(textTimer);
      clearTimeout(taglineTimer);
      clearTimeout(completeTimer);
      clearInterval(progressInterval);
    };
  }, [duration, onComplete]);

  return (
    <div className="fixed inset-0 z-[9999] overflow-hidden bg-gradient-to-br from-rose-100 via-pink-50 to-nude-50">
      {/* Subtle noise texture overlay */}
      <div className="absolute inset-0 opacity-30 pointer-events-none">
        <svg className="w-full h-full">
          <filter id="noise">
            <feTurbulence type="fractalNoise" baseFrequency="0.8" numOctaves="4" />
            <feColorMatrix type="saturate" values="0" />
          </filter>
          <rect width="100%" height="100%" filter="url(#noise)" />
        </svg>
      </div>

      {/* Animated gradient mesh background */}
      <div className="absolute inset-0 opacity-40">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl animate-pulse-slow" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-gold/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-rose-200/40 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />
      </div>

      {/* Floating cosmetic silhouettes */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {/* Lipstick silhouette */}
        <div className="absolute top-20 left-10 w-8 h-24 opacity-10 animate-float" style={{ animationDelay: '0s', animationDuration: '8s' }}>
          <svg viewBox="0 0 32 96" fill="currentColor" className="text-primary">
            <rect x="8" y="0" width="16" height="64" rx="8" />
            <rect x="4" y="64" width="24" height="32" rx="4" />
          </svg>
        </div>

        {/* Brush silhouette */}
        <div className="absolute top-32 right-16 w-6 h-32 opacity-10 animate-float" style={{ animationDelay: '1s', animationDuration: '10s' }}>
          <svg viewBox="0 0 24 128" fill="currentColor" className="text-gold">
            <rect x="8" y="80" width="8" height="48" rx="2" />
            <ellipse cx="12" cy="40" rx="10" ry="36" />
          </svg>
        </div>

        {/* Compact mirror silhouette */}
        <div className="absolute bottom-40 left-20 w-16 h-16 opacity-10 animate-float" style={{ animationDelay: '2s', animationDuration: '12s' }}>
          <svg viewBox="0 0 64 64" fill="currentColor" className="text-primary">
            <circle cx="32" cy="32" r="28" />
            <circle cx="32" cy="32" r="20" fill="white" />
          </svg>
        </div>

        {/* Powder puff silhouette */}
        <div className="absolute bottom-32 right-10 w-12 h-12 opacity-10 animate-float" style={{ animationDelay: '0.5s', animationDuration: '9s' }}>
          <svg viewBox="0 0 48 48" fill="currentColor" className="text-gold">
            <circle cx="24" cy="24" r="20" />
          </svg>
        </div>
      </div>

      {/* Gold shimmer particles */}
      {showParticles && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 rounded-full bg-gold/60 animate-shimmer-rise"
              style={{
                left: `${Math.random() * 100}%`,
                bottom: '0',
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${3 + Math.random() * 2}s`,
              }}
            />
          ))}
        </div>
      )}

      {/* Central content */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6">
        {/* Logo with glow effect */}
        <div
          className={cn(
            "transition-all duration-1000 ease-out mb-8",
            phase === "logo" ? "opacity-0 scale-75" : "opacity-100 scale-100"
          )}
        >
          <div className="relative">
            {/* Glow ring */}
            <div className="absolute inset-0 -m-4 rounded-full bg-gradient-to-br from-primary/40 via-gold/30 to-primary/40 blur-xl animate-pulse-slow" />

            {/* Logo container */}
            <div className="relative w-32 h-32">
              <img
                src={logo}
                alt="Glam"
                className={cn(
                  "w-full h-full object-contain transition-all duration-700",
                  phase === "text" || phase === "tagline" || phase === "complete"
                    ? "scale-110 drop-shadow-2xl"
                    : "scale-100"
                )}
              />
            </div>

            {/* Orbiting sparkles */}
            {phase !== "logo" && (
              <>
                <div className="absolute -top-2 -right-2 w-6 h-6">
                  <Sparkles className="w-full h-full text-gold animate-spin-slow" />
                </div>
                <div className="absolute -bottom-2 -left-2 w-5 h-5">
                  <Sparkles className="w-full h-full text-primary animate-spin-slow" style={{ animationDirection: "reverse" }} />
                </div>
              </>
            )}
          </div>
        </div>

        {/* GLAM text with staggered letter animation */}
        <div className="mb-6 relative">
          <h1
            className={cn(
              "font-serif text-6xl font-bold tracking-wider relative z-10",
              "bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-gold",
              "transition-all duration-1000 ease-out"
            )}
            style={{
              opacity: phase === "logo" ? 0 : 1,
              transform: phase === "logo" ? "translateY(20px)" : "translateY(0)",
            }}
          >
            {"GLAM".split("").map((letter, index) => (
              <span
                key={index}
                className="inline-block"
                style={{
                  animation: phase !== "logo"
                    ? `letter-reveal 0.6s cubic-bezier(0.16, 1, 0.3, 1) ${index * 0.1}s forwards`
                    : "none",
                  opacity: phase === "logo" ? 0 : 1,
                }}
              >
                {letter}
              </span>
            ))}
          </h1>

          {/* Underline animation */}
          <div
            className="absolute -bottom-2 left-1/2 -translate-x-1/2 h-0.5 bg-gradient-to-r from-transparent via-primary to-transparent"
            style={{
              width: phase === "logo" ? "0%" : "100%",
              transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.5s",
            }}
          />
        </div>

        {/* Tagline */}
        <p
          className={cn(
            "text-sm font-medium text-foreground/70 tracking-[0.3em] uppercase mb-12",
            "transition-all duration-700 ease-out"
          )}
          style={{
            opacity: showTagline ? 1 : 0,
            transform: showTagline ? "translateY(0)" : "translateY(10px)",
          }}
        >
          Beauty, Redefined
        </p>

        {/* Elegant progress bar */}
        <div className="w-48 h-1 bg-primary/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary via-primary/80 to-gold rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading percentage */}
        <p className="mt-4 text-xs text-foreground/50 font-medium tabular-nums">
          {progress}%
        </p>
      </div>

      {/* Decorative corner accents */}
      <div className="absolute top-8 left-8 w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M 0 16 L 0 0 L 16 0"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className={cn(
              "text-primary/40 transition-opacity duration-700",
              phase === "logo" ? "opacity-0" : "opacity-100"
            )}
          />
        </svg>
      </div>

      <div className="absolute bottom-8 right-8 w-16 h-16">
        <svg viewBox="0 0 64 64" className="w-full h-full">
          <path
            d="M 48 64 L 64 64 L 64 48"
            stroke="currentColor"
            strokeWidth="2"
            fill="none"
            className={cn(
              "text-gold/40 transition-opacity duration-700",
              phase === "logo" ? "opacity-0" : "opacity-100"
            )}
          />
        </svg>
      </div>

      <style>{`
        @keyframes letter-reveal {
          0% {
            opacity: 0;
            transform: translateY(20px) rotate(-5deg);
          }
          100% {
            opacity: 1;
            transform: translateY(0) rotate(0deg);
          }
        }

        @keyframes shimmer-rise {
          0% {
            opacity: 0;
            transform: translateY(0) scale(0);
          }
          50% {
            opacity: 1;
            transform: translateY(-50vh) scale(1);
          }
          100% {
            opacity: 0;
            transform: translateY(-100vh) scale(0.5);
          }
        }

        @keyframes pulse-slow {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(1.05);
          }
        }

        @keyframes float {
          0%, 100% {
            transform: translateY(0) rotate(0deg);
          }
          50% {
            transform: translateY(-20px) rotate(5deg);
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

        .animate-shimmer-rise {
          animation: shimmer-rise linear infinite;
        }

        .animate-pulse-slow {
          animation: pulse-slow 4s ease-in-out infinite;
        }

        .animate-float {
          animation: float ease-in-out infinite;
        }

        .animate-spin-slow {
          animation: spin-slow 8s linear infinite;
        }
      `}</style>
    </div>
  );
};

export default SplashScreen;
