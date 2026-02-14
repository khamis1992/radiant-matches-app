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
    <div className="bg-card px-4 py-4 border-b border-border/50 last:border-b-0">
      <div className="flex justify-between items-start gap-3">
        {/* Left: Info */}
        <div className="flex-1 min-w-0">
          <h4 className="font-bold text-foreground text-base leading-tight">{displayName}</h4>
          {displayDescription && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
              {displayDescription}
            </p>
          )}
          <div className="flex items-center gap-1.5 mt-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{duration}</span>
          </div>
        </div>

        {/* Right: Price + Button */}
        <div className={`flex flex-col items-end gap-2 shrink-0 ${isRTL ? "items-start" : "items-end"}`}>
          <p className="text-lg font-bold text-foreground">{formatQAR(price)}</p>
          <Button 
            size="sm" 
            className="rounded-full px-5 h-8 text-sm font-medium"
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
