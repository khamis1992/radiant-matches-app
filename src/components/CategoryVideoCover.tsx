import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CategoryVideoCoverProps {
  src: string;
  label?: string;
  className?: string;
  poster?: string;
}

/**
 * Looping muted category clip for card covers.
 * Plays only while on screen (IntersectionObserver) and stays paused
 * for users who prefer reduced motion.
 */
export const CategoryVideoCover = ({ src, label, className, poster }: CategoryVideoCoverProps) => {
  const ref = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!("IntersectionObserver" in window)) {
      video.play().catch(() => {});
      return;
    }
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => {});
        else video.pause();
      },
      { rootMargin: "100px" }
    );
    io.observe(video);
    return () => io.disconnect();
  }, [src]);

  return (
    <video
      ref={ref}
      className={cn("absolute inset-0 w-full h-full object-cover", className)}
      muted
      loop
      playsInline
      preload="metadata"
      poster={poster}
      aria-label={label}
      role={label ? undefined : "presentation"}
    >
      <source src={src} type="video/mp4" />
    </video>
  );
};

export default CategoryVideoCover;
