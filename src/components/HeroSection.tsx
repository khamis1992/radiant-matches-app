import { useEffect, useState } from "react";
import { Sparkles, Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

/**
 * HeroSection - Compact Mobile Design with Animations
 */
export const HeroSection = () => {
  const { t } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative bg-gradient-to-b from-primary/10 to-background pb-4 overflow-hidden">
      {/* Animated background effect */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div
          className="absolute top-0 right-0 w-64 h-64 rounded-full bg-primary/10 blur-3xl animate-pulse-slow"
          style={{
            animation: 'pulse-slow 4s ease-in-out infinite',
          }}
        />
        <div
          className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-gradient-to-br from-nude/20 to-transparent blur-2xl animate-float"
          style={{
            animation: 'float 6s ease-in-out infinite',
          }}
        />
      </div>

      {/* Content - compact spacing with animations */}
      <div className="relative z-10 px-4 pt-3">
        {/* Badge - slide in from left */}
        <div
          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/80 backdrop-blur-sm border border-primary/20 mb-3 shadow-sm"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateX(0)' : 'translateX(-20px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
          }}
        >
          <Sparkles className="w-3 h-3 text-primary animate-spin-slow" style={{ animationDuration: '3s' }} />
          <span className="text-xs font-medium text-foreground">
            {t.home.heroBadge || "Premium Beauty"}
          </span>
        </div>

        {/* Headline - scale and fade up */}
        <h1
          className="font-serif text-3xl font-bold leading-tight mb-2"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0) scale(1)' : 'translateY(20px) scale(0.95)',
            transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s',
          }}
        >
          <span className="block">{t.home.heroTitle1 || "Discover Your"}</span>
          <span
            className="block text-4xl bg-clip-text text-transparent bg-gradient-to-r from-primary via-primary/80 to-gold animate-gradient-x"
            style={{
              backgroundSize: '200% 100%',
              animation: 'gradient-x 3s ease infinite',
            }}
          >
            {t.home.heroTitle2 || "Perfect Look"}
          </span>
        </h1>

        {/* Subtitle - fade in with slight delay */}
        <p
          className="text-sm text-foreground/70 mb-3"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(15px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.35s',
          }}
        >
          {t.home.heroSubtitle || "Book makeup artists for any occasion"}
        </p>

        {/* Quick stats - staggered pop in */}
        <div
          className="flex items-center gap-4 mt-3"
          style={{
            opacity: isVisible ? 1 : 0,
            transform: isVisible ? 'translateY(0)' : 'translateY(10px)',
            transition: 'all 0.5s cubic-bezier(0.16, 1, 0.3, 1) 0.5s',
          }}
        >
          <div className="flex items-center gap-1.5">
            <div className="flex -space-x-1">
              {[1, 2, 3].map((i, index) => (
                <div
                  key={i}
                  className="w-5 h-5 rounded-full border-2 border-background bg-gradient-to-br from-primary to-primary/60 animate-bounce-in"
                  style={{
                    animationDelay: `${0.6 + index * 0.1}s`,
                    transform: 'scale(0)',
                    animation: 'bounce-in 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards',
                  }}
                />
              ))}
            </div>
            <span className="text-xs text-muted-foreground">
              {t.home.heroArtists || "500+"}
            </span>
          </div>
          <div className="h-2 w-px bg-border" />
          <div className="flex items-center gap-1">
            <Star className="w-3 h-3 fill-gold text-gold animate-star-pulse" />
            <span className="text-xs text-muted-foreground">
              {t.home.heroRating || "4.9"}
            </span>
          </div>
        </div>
      </div>

      {/* Animated sparkle decorations */}
      <div
        className="absolute top-20 right-8 w-2 h-2 bg-primary/40 rounded-full animate-twinkle"
        style={{ animationDelay: '0.5s' }}
      />
      <div
        className="absolute top-32 right-16 w-1.5 h-1.5 bg-gold/40 rounded-full animate-twinkle"
        style={{ animationDelay: '1s' }}
      />
      <div
        className="absolute bottom-20 left-12 w-2 h-2 bg-primary/30 rounded-full animate-twinkle"
        style={{ animationDelay: '1.5s' }}
      />

      <style>{`
        @keyframes gradient-x {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }

        @keyframes bounce-in {
          0% {
            transform: scale(0);
            opacity: 0;
          }
          50% {
            transform: scale(1.1);
          }
          100% {
            transform: scale(1);
            opacity: 1;
          }
        }

        @keyframes twinkle {
          0%, 100% { opacity: 0.3; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.2); }
        }

        @keyframes star-pulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.1); }
        }

        .animate-twinkle {
          animation: twinkle 2s ease-in-out infinite;
        }

        .animate-star-pulse {
          animation: star-pulse 2s ease-in-out infinite;
        }
      `}</style>
    </div>
  );
};

export default HeroSection;
