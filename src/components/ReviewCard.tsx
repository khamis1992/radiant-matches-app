import { Star } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

interface ReviewCardProps {
  name: string;
  avatar: string;
  rating: number;
  date: string;
  comment: string;
}

const ReviewCard = ({ name, avatar, rating, date, comment }: ReviewCardProps) => {
  const { isRTL } = useLanguage();

  return (
    <div className="bg-card p-4 rounded-xl border border-border">
      <div className={`flex items-start gap-3 ${isRTL ? "flex-row-reverse" : ""}`}>
        <img
          src={avatar}
          alt={name}
          className="w-10 h-10 rounded-full object-cover"
        />
        <div className="flex-1">
          <div className={`flex items-center justify-between ${isRTL ? "flex-row-reverse" : ""}`}>
            <h4 className="font-medium text-foreground">{name}</h4>
            <span className="text-xs text-muted-foreground">{date}</span>
          </div>
          <div className={`flex items-center gap-0.5 mt-1 ${isRTL ? "flex-row-reverse" : ""}`}>
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-3.5 h-3.5 ${
                  i < rating
                    ? "text-[hsl(42,65%,55%)] fill-[hsl(42,65%,55%)]"
                    : "text-muted"
                }`}
              />
            ))}
          </div>
          <p className={`text-sm text-muted-foreground mt-2 ${isRTL ? "text-right" : "text-left"}`}>{comment}</p>
        </div>
      </div>
    </div>
  );
};

export default ReviewCard;
