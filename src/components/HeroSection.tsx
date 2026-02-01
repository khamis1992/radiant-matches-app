import { useEffect, useState } from "react";
import { Sparkles, Star, ArrowRight, Search, MapPin } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import categoryBridal from "@/assets/category-bridal.jpg";

/**
 * HeroSection - Native App Style
 * Mobile-first, card-based, immersive, thumb-friendly.
 */
export const HeroSection = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const isRTL = language === "ar";

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="relative w-full mb-6" dir={isRTL ? "rtl" : "ltr"}>
      
      {/* Immersive Background Header (Native App Vibe) */}
      <div className="relative h-[340px] w-full bg-background rounded-b-[2.5rem] overflow-hidden shadow-lg mx-auto max-w-md md:max-w-full md:rounded-b-none md:h-[400px]">
        
        {/* Image Layer */}
        <div className="absolute inset-0">
           <img 
             src={categoryBridal} 
             alt="Beauty Service" 
             className="w-full h-full object-cover"
           />
           {/* Gradient Overlay for Text Visibility */}
           <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
        </div>

        {/* Content Layer */}
        <div className="absolute inset-0 flex flex-col justify-end px-5 pb-8 md:px-8 md:pb-12 max-w-screen-xl mx-auto w-full">
           
           {/* Animated Text Content */}
           <div className={`space-y-3 transition-all duration-500 ease-out ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
              
              {/* Badge Pill */}
              <div className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 w-fit">
                 <Sparkles className="w-3 h-3 text-yellow-300 fill-yellow-300" />
                 <span className="text-[10px] font-bold text-white uppercase tracking-wider">
                    {t.home.heroBadge || "Premium"}
                 </span>
              </div>

              {/* Big Title */}
              <h1 className="text-3xl font-bold text-white leading-tight md:text-5xl">
                 {t.home.heroTitle1 || "Find Your"} <br/>
                 <span className="text-transparent bg-clip-text bg-gradient-to-r from-pink-200 to-white">
                    {t.home.heroTitle2 || "Perfect Artist"}
                 </span>
              </h1>
              
              {/* Native-style Stats Row */}
              <div className="flex items-center gap-3 pt-1">
                 <div className="flex -space-x-2">
                    {[1, 2, 3].map(i => (
                       <div key={i} className="w-6 h-6 rounded-full border border-white bg-gray-300 overflow-hidden">
                          <img src={`https://i.pravatar.cc/100?img=${i + 15}`} alt="Artist" className="w-full h-full object-cover" />
                       </div>
                    ))}
                 </div>
                 <div className="text-white/90 text-xs font-medium">
                    <span className="font-bold">4.9</span> (2k+ Reviews)
                 </div>
              </div>
           </div>
        </div>
      </div>

      {/* Floating Action Card (Overlapping the Header) */}
      <div className={`px-5 -mt-6 relative z-10 max-w-screen-xl mx-auto transition-all duration-700 delay-200 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}`}>
         
         <div className="bg-card rounded-2xl shadow-xl border border-border p-4 md:p-5 flex flex-col gap-4">
            
            {/* Native Search Bar Input */}
            <div 
               className="bg-muted/50 rounded-xl flex items-center px-4 py-3 cursor-pointer hover:bg-muted transition-colors border border-transparent hover:border-border/50"
               onClick={() => navigate('/makeup-artists')}
            >
               <Search className="w-5 h-5 text-muted-foreground shrink-0" />
               <div className="flex flex-col mx-3 flex-1">
                  <span className="text-xs text-muted-foreground font-medium">{isRTL ? "ابحث عن خدمة" : "Search service"}</span>
                  <span className="text-sm font-semibold text-foreground">{isRTL ? "مكياج عروس، شعر..." : "Bridal makeup, hair..."}</span>
               </div>
               <div className="bg-primary/10 p-1.5 rounded-lg">
                  <ArrowRight className={`w-4 h-4 text-primary ${isRTL ? 'rotate-180' : ''}`} />
               </div>
            </div>

            {/* Quick Actions Grid (Native feel) */}
            <div className="grid grid-cols-2 gap-3">
               <Button 
                  onClick={() => navigate('/makeup-artists')}
                  className="w-full h-12 rounded-xl text-sm font-semibold bg-primary text-primary-foreground hover:bg-primary/90 shadow-md active:scale-[0.98] transition-all"
               >
                  {isRTL ? "حجز الآن" : "Book Now"}
               </Button>
               <Button 
                  variant="outline" 
                  onClick={() => navigate('/makeup-artists?map=true')}
                  className="w-full h-12 rounded-xl text-sm font-semibold border-border hover:bg-accent hover:text-accent-foreground active:scale-[0.98] transition-all gap-2"
               >
                  <MapPin className="w-4 h-4" />
                  {isRTL ? "الخريطة" : "Map View"}
               </Button>
            </div>

         </div>
      </div>

    </div>
  );
};

export default HeroSection;
