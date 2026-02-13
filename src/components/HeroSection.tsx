import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import categoryBridal from "@/assets/category-bridal.jpg";

/**
 * HeroSection - Luxury Native App Style
 * Full-bleed dark hero with model photo, bold typography, and integrated search
 */
export const HeroSection = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const isRTL = language === "ar";

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div className="relative w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* Full-bleed Dark Hero */}
      <div className="relative h-[360px] w-full overflow-hidden bg-black">
        {/* Model Image */}
        <img
          src={categoryBridal}
          alt="Beauty"
          className="absolute inset-0 w-full h-full object-cover object-top opacity-60"
        />

        {/* Gradient Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-black/20" />
        <div className="absolute inset-0 bg-gradient-to-r from-black/50 to-transparent" />

        {/* Hero Content */}
        <div
          className={`absolute inset-0 flex flex-col justify-end px-6 pb-16 transition-all duration-700 ease-out ${
            isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          {/* Accent Label */}
          <span className="text-[11px] font-bold uppercase tracking-[0.2em] text-[#C9956B] mb-3">
            {isRTL ? "خدمات التجميل الفاخرة" : "Premium Beauty Services"}
          </span>

          {/* Main Title */}
          <h1 className="text-[32px] font-extrabold text-white leading-[1.15] tracking-tight">
            {isRTL ? (
              <>
                جمالك الفاخر
                <br />
                <span className="text-[#D4A574]">في منزلك</span>
              </>
            ) : (
              <>
                Luxury At Your
                <br />
                Doorstep
              </>
            )}
          </h1>

          {/* Subtitle */}
          <p className="text-white/50 text-[13px] mt-2.5 font-medium">
            {isRTL
              ? "احجزي مع أفضل خبيرات التجميل في قطر"
              : "Book home services with Qatar's top beauty experts"}
          </p>
        </div>
      </div>

      {/* Floating Search Bar */}
      <div
        className={`px-5 -mt-7 relative z-10 transition-all duration-600 delay-150 ${
          isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
        }`}
      >
        <div
          className="bg-card rounded-2xl shadow-2xl border border-border/30 flex items-center gap-3 px-4 py-3.5 cursor-pointer active:scale-[0.99] transition-all"
          onClick={() => navigate("/makeup-artists")}
        >
          <div className="bg-muted rounded-xl p-2.5 shrink-0">
            <Search className="w-4 h-4 text-muted-foreground" />
          </div>
          <span className="flex-1 text-sm text-muted-foreground truncate">
            {isRTL
              ? "ابحث حسب الاسم، الموقع، أو النوع..."
              : "Find services by name, location, or type..."}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-px h-5 bg-border" />
            <MapPin className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
