import { useEffect, useRef } from "react";
import { Search } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";

/**
 * Home hero — GLAM reference layout: split card (ink text panel + beauty photo),
 * the brand brush mark on the photo, and a standalone white search pill below.
 */
export const HeroSection = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === "ar";
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      video.pause();
    } else {
      video.play().catch(() => {});
    }
  }, []);

  return (
    <div className="px-5 pt-4 space-y-4" dir={isRTL ? "rtl" : "ltr"}>
      {/* Split hero card */}
      <div className="relative overflow-hidden rounded-3xl bg-glam-ink grid grid-cols-[1.05fr_1fr] min-h-[200px]">
        {/* Text panel */}
        <div className="relative z-10 ps-6 pe-2 py-7 flex flex-col justify-center">
          <h1 className="font-serif text-white text-[24px] leading-[1.3] font-bold">
            {isRTL ? (
              <>
                احجزي خدمات
                <br />
                التجميل
              </>
            ) : (
              <>
                Book beauty
                <br />
                services
              </>
            )}
          </h1>
          <p className="font-serif italic text-glam-blush text-[22px] leading-snug mt-1">
            {isRTL ? "في منزلك" : "at your door"}
          </p>
          <p className="text-white/60 text-xs mt-3">
            {isRTL ? "أفضل خبيرات التجميل في قطر" : "Top beauty experts in Qatar"}
          </p>
        </div>

        {/* Video panel */}
        <div className="relative">
          <video
            ref={videoRef}
            className="absolute inset-0 w-full h-full object-cover object-top"
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/images/onboarding/slide-discover.jpg"
            aria-hidden="true"
          >
            <source src="/videos/onboarding/slide-discover.mp4" type="video/mp4" />
          </video>
          {/* Seam blend toward the ink panel */}
          <div
            className={cn(
              "absolute inset-0 pointer-events-none",
              isRTL
                ? "bg-gradient-to-l from-glam-ink via-glam-ink/40 to-transparent"
                : "bg-gradient-to-r from-glam-ink via-glam-ink/40 to-transparent"
            )}
          />
          {/* Brand brush mark */}
          <img
            src="/brand/glam-mark-dark.png"
            alt=""
            aria-hidden="true"
            draggable={false}
            className="absolute bottom-1 end-1 w-20 opacity-90 pointer-events-none select-none"
          />
        </div>
      </div>

      {/* Search pill — primary action */}
      <button
        onClick={() => navigate("/makeup-artists")}
        className="w-full bg-white rounded-full flex items-center gap-3 ps-4 pe-2 py-2 text-start border border-glam-border shadow-sm transition-transform active:scale-[0.99]"
      >
        <Search className="w-4 h-4 text-glam-muted shrink-0" />
        <span className="flex-1 text-sm text-glam-muted truncate">
          {isRTL ? "ابحثي عن خدمة أو خبيرة..." : "Search services or artists..."}
        </span>
        <span className="w-9 h-9 rounded-full bg-glam-rose flex items-center justify-center shrink-0">
          <Search className="w-4 h-4 text-white" />
        </span>
      </button>
    </div>
  );
};

export default HeroSection;
