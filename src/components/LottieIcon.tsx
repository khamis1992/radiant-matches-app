import { useEffect, useRef, useState } from "react";
import type { AnimationItem } from "lottie-web";
import { cn } from "@/lib/utils";

interface LottieIconProps {
  /** URL of the Lottie JSON (served from public/). */
  src: string;
  /** Shown until the animation is ready, and kept if loading fails. */
  fallback?: React.ReactNode;
  /** Loop the animation (default true). Use false for play-once state feedback. */
  loop?: boolean;
  /** Start a one-shot animation when the icon first enters the viewport. */
  playWhenVisible?: boolean;
  className?: string;
}

/**
 * Lightweight Lottie icon player.
 * - Lazy-loads lottie-web so the main bundle stays light.
 * - Loops by default; pauses on frame 0 when the user prefers reduced motion.
 * - Falls back to a static icon while loading or on error.
 */
export const LottieIcon = ({
  src,
  fallback,
  loop = true,
  playWhenVisible = false,
  className,
}: LottieIconProps) => {
  const containerRef = useRef<HTMLSpanElement>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let anim: AnimationItem | undefined;
    let observer: IntersectionObserver | undefined;
    let cancelled = false;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    setReady(false);

    import("lottie-web")
      .then(({ default: lottie }) => {
        if (cancelled || !containerRef.current) return;
        anim = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop,
          autoplay: !reduced && !playWhenVisible,
          path: src,
        });
        anim.addEventListener("DOMLoaded", () => {
          if (cancelled || !anim || !containerRef.current) return;
          setReady(true);

          if (reduced) {
            anim.goToAndStop(Math.max(anim.totalFrames - 1, 0), true);
            return;
          }

          if (playWhenVisible) {
            observer = new IntersectionObserver(
              ([entry]) => {
                if (!entry?.isIntersecting || !anim) return;
                anim.goToAndPlay(0, true);
                observer?.disconnect();
              },
              { threshold: 0.35 }
            );
            observer.observe(containerRef.current);
          }
        });
        anim.addEventListener("data_failed", () => {
          if (!cancelled) setReady(false);
        });
      })
      .catch(() => {
        // Keep the static fallback if the player fails to load.
      });

    return () => {
      cancelled = true;
      observer?.disconnect();
      anim?.destroy();
    };
  }, [src, loop, playWhenVisible]);

  return (
    <span className={cn("relative inline-flex items-center justify-center", className)}>
      <span
        className={cn(
          "inline-flex items-center justify-center transition-opacity duration-300 motion-reduce:transition-none",
          ready ? "opacity-0" : "opacity-100"
        )}
      >
        {fallback}
      </span>
      <span
        ref={containerRef}
        aria-hidden="true"
        className={cn(
          "absolute inset-0 transition-opacity duration-300 motion-reduce:transition-none",
          ready ? "opacity-100" : "opacity-0"
        )}
      />
    </span>
  );
};

export default LottieIcon;
