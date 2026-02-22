import { useEffect, useState } from "react";
import { Search, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import categoryBridal from "@/assets/category-bridal.jpg";

export const HeroSection = () => {
  const { language } = useLanguage();
  const navigate = useNavigate();
  const isRTL = language === "ar";

  return (
    <div className="relative w-full" dir={isRTL ? "rtl" : "ltr"}>
      {/* Hero Image */}
      <div className="relative h-[240px] w-full overflow-hidden">
        <img
          src={categoryBridal}
          alt="Beauty"
          className="absolute inset-0 w-full h-full object-cover object-top"
          style={{ opacity: 0.55 }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/30 to-transparent" />

        {/* Content */}
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-14">
          <h1 className="text-2xl font-bold text-foreground leading-tight">
            {isRTL ? (
              <>
                احجزي خدمات التجميل
                <br />
                <span className="text-primary">في منزلك</span>
              </>
            ) : (
              <>
                Book Beauty Services
                <br />
                <span className="text-primary">At Your Door</span>
              </>
            )}
          </h1>
          <p className="text-muted-foreground text-sm mt-1.5">
            {isRTL
              ? "أفضل خبيرات التجميل في قطر"
              : "Top beauty experts in Qatar"}
          </p>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-5 -mt-6 relative z-10">
        <div
          className="bg-card rounded-xl shadow-md border border-border/50 flex items-center gap-3 px-4 py-3 cursor-pointer"
          onClick={() => navigate("/makeup-artists")}
        >
          <Search className="w-4 h-4 text-muted-foreground shrink-0" />
          <span className="flex-1 text-sm text-muted-foreground truncate">
            {isRTL
              ? "ابحث عن خدمة أو فنانة..."
              : "Search services or artists..."}
          </span>
          <div className="flex items-center gap-2 shrink-0">
            <div className="w-px h-4 bg-border" />
            <MapPin className="w-4 h-4 text-primary" />
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSection;
