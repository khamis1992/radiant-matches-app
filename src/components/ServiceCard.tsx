import { Clock } from "lucide-react";
import { Button } from "./ui/button";
import { formatQAR } from "@/lib/locale";
import { useLanguage } from "@/contexts/LanguageContext";

interface ServiceCardProps {
  name: string;
  nameAr?: string | null;
  nameEn?: string | null;
  description: string;
  descriptionAr?: string | null;
  descriptionEn?: string | null;
  duration: string;
  price: number;
  onBook?: () => void;
}

const ServiceCard = ({
  name,
  nameAr,
  nameEn,
  description,
  descriptionAr,
  descriptionEn,
  duration,
  price,
  onBook,
}: ServiceCardProps) => {
  const { t, isRTL, language } = useLanguage();

  const displayName = language === "ar" 
    ? (nameAr || nameEn || name) 
    : (nameEn || nameAr || name);
  
  const displayDescription = language === "ar"
    ? (descriptionAr || descriptionEn || description)
    : (descriptionEn || descriptionAr || description);

  return (
    <div className="group relative px-4 py-5 transition-colors hover:bg-muted/30 active:bg-muted/50">
      {/* Left accent line */}
      <div className="absolute top-3 bottom-3 start-0 w-[3px] rounded-full bg-primary/60 group-hover:bg-primary transition-colors" />
      
      <div className="flex justify-between items-start gap-4">
        {/* Left: Info */}
        <div className="flex-1 min-w-0 ps-2">
          <h4 className="font-bold text-foreground text-[15px] leading-snug">{displayName}</h4>
          {displayDescription && (
            <p className="text-[13px] text-muted-foreground mt-1 line-clamp-2 leading-relaxed">
              {displayDescription}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2.5">
            <div className="flex items-center gap-1 text-muted-foreground bg-muted/50 rounded-full px-2.5 py-0.5">
              <Clock className="w-3 h-3" />
              <span className="text-[11px] font-medium">{duration}</span>
            </div>
          </div>
        </div>

        {/* Right: Price + Button */}
        <div className="flex flex-col items-end gap-2.5 shrink-0">
          <p className="text-lg font-bold text-foreground tracking-tight">{formatQAR(price)}</p>
          <Button 
            size="sm" 
            className="rounded-full px-6 h-9 text-[13px] font-semibold shadow-sm hover:shadow-md transition-shadow"
            onClick={onBook}
          >
            {t.common.select}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
