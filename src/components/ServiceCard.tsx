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

  // Select the appropriate language version with fallback
  const displayName = language === "ar" 
    ? (nameAr || nameEn || name) 
    : (nameEn || nameAr || name);
  
  const displayDescription = language === "ar"
    ? (descriptionAr || descriptionEn || description)
    : (descriptionEn || descriptionAr || description);

  return (
    <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{displayName}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {displayDescription}
          </p>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{duration}</span>
          </div>
        </div>
        <div className={`${isRTL ? "text-left me-4" : "text-right ms-4"}`}>
          <p className="text-xl font-bold text-foreground">{formatQAR(price)}</p>
          <Button size="sm" className="mt-2" onClick={onBook}>
            {t.common.select}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
