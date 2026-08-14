import { useEffect, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "@phosphor-icons/react";
import { cn } from "@/lib/utils";

type ShopsStoryHeroProps = {
  isRTL: boolean;
  onBack: () => void;
  onExplore: () => void;
};

export const ShopsStoryHero = ({
  isRTL,
  onBack,
  onExplore,
}: ShopsStoryHeroProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const syncPreference = () => setReduceMotion(media.matches);
    syncPreference();
    media.addEventListener("change", syncPreference);
    return () => media.removeEventListener("change", syncPreference);
  }, []);

  useEffect(() => {
    const video = videoRef.current;
    if (!video || reduceMotion) {
      video?.pause();
      return;
    }

    if (!("IntersectionObserver" in window)) {
      video.play().catch(() => undefined);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) video.play().catch(() => undefined);
        else video.pause();
      },
      { rootMargin: "80px" },
    );
    observer.observe(video);
    return () => observer.disconnect();
  }, [reduceMotion]);

  const copy = isRTL
    ? {
        label: "وجهات GLAM",
        title: "جمالكِ، من متاجر نختارها بعناية.",
        body: "اكتشفي منتجات أصلية ووجهات محلية موثوقة في قطر.",
        cta: "استكشفي المتاجر",
        back: "رجوع",
        video: "تشكيلة راقية من منتجات الجمال المختارة",
      }
    : {
        label: "THE GLAM DIRECTORY",
        title: "Beauty, from shops worth knowing.",
        body: "Discover authentic products and trusted local destinations in Qatar.",
        cta: "Explore shops",
        back: "Back",
        video: "A refined collection of curated beauty products",
      };

  return (
    <section
      aria-label={isRTL ? "دليل متاجر GLAM" : "GLAM shop directory"}
      className="overflow-hidden rounded-b-[36px] bg-glam-ink shadow-sm"
    >
      <div className="relative h-[318px] overflow-hidden bg-glam-surface">
        <video
          ref={videoRef}
          className="absolute inset-0 h-full w-full object-cover object-center"
          muted
          loop
          playsInline
          preload="metadata"
          aria-label={copy.video}
        >
          <source src="/videos/shops/shops-living-window.mp4" type="video/mp4" />
        </video>

        <div className="safe-area-top absolute inset-x-5 top-0 z-20 flex items-start justify-between pt-4">
          <button
            type="button"
            onClick={onBack}
            aria-label={copy.back}
            className="grid h-11 w-11 place-items-center rounded-full border border-white/30 bg-white/95 text-glam-ink shadow-md backdrop-blur-sm transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-glam-rose focus-visible:ring-offset-2"
          >
            <ArrowLeft size={18} className={cn(isRTL && "rotate-180")} />
          </button>

          <div className="rounded-full border border-white/30 bg-white/95 px-3 py-2 shadow-md backdrop-blur-sm">
            <img
              src="/brand/glam-logo-light.png"
              alt="GLAM Beauty"
              className="h-auto w-[126px] object-contain"
            />
          </div>
        </div>

        <div className="absolute bottom-5 start-5 rounded-full border border-white/35 bg-glam-ink/75 px-3 py-1.5 backdrop-blur-md">
          <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-white">
            {isRTL ? "اختيارات هذا الأسبوع" : "THIS WEEK'S EDIT"}
          </span>
        </div>
      </div>

      <div className="flex min-h-[146px] items-center gap-4 px-5 py-5 text-white">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-glam-blush">
            {copy.label}
          </p>
          <h1 className="mt-1.5 max-w-[280px] text-[25px] font-semibold leading-[1.2] tracking-tight text-white">
            {copy.title}
          </h1>
          <p className="mt-2 max-w-[290px] text-xs leading-relaxed text-white/75">
            {copy.body}
          </p>
        </div>

        <button
          type="button"
          onClick={onExplore}
          aria-label={copy.cta}
          className="grid h-14 w-14 shrink-0 place-items-center rounded-full bg-glam-rose text-white shadow-md transition-transform active:scale-95 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-glam-ink"
        >
          <ArrowRight size={22} weight="bold" className={cn(isRTL && "rotate-180")} />
        </button>
      </div>
    </section>
  );
};

export default ShopsStoryHero;
