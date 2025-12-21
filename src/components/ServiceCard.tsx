import { Clock } from "lucide-react";
import { Button } from "./ui/button";
import { formatQAR } from "@/lib/locale";

interface ServiceCardProps {
  name: string;
  description: string;
  duration: string;
  price: number;
  onBook?: () => void;
}

const ServiceCard = ({
  name,
  description,
  duration,
  price,
  onBook,
}: ServiceCardProps) => {
  return (
    <div className="bg-card p-4 rounded-xl border border-border hover:border-primary/30 transition-all duration-300 hover:shadow-md">
      <div className="flex justify-between items-start">
        <div className="flex-1">
          <h4 className="font-semibold text-foreground">{name}</h4>
          <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
            {description}
          </p>
          <div className="flex items-center gap-1 mt-2 text-muted-foreground">
            <Clock className="w-3.5 h-3.5" />
            <span className="text-xs">{duration}</span>
          </div>
        </div>
        <div className="text-right ml-4">
          <p className="text-xl font-bold text-foreground">{formatQAR(price)}</p>
          <Button size="sm" className="mt-2" onClick={onBook}>
            Select
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ServiceCard;
