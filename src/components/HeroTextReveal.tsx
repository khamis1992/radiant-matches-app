import { useEffect, useRef, useState, type ReactNode } from "react";
import type { AnimationItem } from "lottie-web";
import { cn } from "@/lib/utils";

interface HeroTextRevealProps {
  children: ReactNode;
  isRTL: boolean;
}

const HERO_TEXT_REVEAL_SRC = "/projects/glam-hero/scene-1/lottie.json";
const HERO_TEXT_REVEAL_RTL_SRC = "/projects/glam-hero/scene-2/lottie.json";

/**
 * Renders the kinetic hero copy through native Lottie text layers while the
 * semantic HTML remains as the accessible and reduced-motion fallback.
 */
export const HeroTextReveal = ({ children, isRTL }: HeroTextRevealProps) => {
  const overlayRef = useRef<HTMLSpanElement>(null);
  const [lottieReady, setLottieReady] = useState(false);

  useEffect(() => {
    let animation: AnimationItem | undefined;
    let cancelled = false;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setLottieReady(false);

    if (reducedMotion) {
      return;
    }

    Promise.all([document.fonts.ready, import("lottie-web")])
      .then(([, { default: lottie }]) => {
        if (cancelled || !overlayRef.current) return;

        animation = lottie.loadAnimation({
          container: overlayRef.current,
          renderer: "svg",
          loop: false,
          autoplay: false,
          path: isRTL ? HERO_TEXT_REVEAL_RTL_SRC : HERO_TEXT_REVEAL_SRC,
          rendererSettings: {
            preserveAspectRatio: "none",
          },
        });

        animation.addEventListener("DOMLoaded", () => {
          if (cancelled) return;
          setLottieReady(true);
          animation?.goToAndStop(0, true);
          animation?.play();
        });
        animation.addEventListener("data_failed", () => {
          if (!cancelled) setLottieReady(false);
        });
      })
      .catch(() => {
        if (!cancelled) setLottieReady(false);
      });

    return () => {
      cancelled = true;
      animation?.destroy();
    };
  }, [isRTL]);

  return (
    <div className="relative">
      <div
        className={cn(
          "transition-opacity duration-150 motion-reduce:transition-none",
          lottieReady ? "opacity-0" : "opacity-100"
        )}
      >
        {children}
      </div>
      <span
        ref={overlayRef}
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-0 z-10 block transition-opacity duration-150 motion-reduce:hidden",
          lottieReady ? "opacity-100" : "opacity-0"
        )}
      />
    </div>
  );
};

export default HeroTextReveal;
