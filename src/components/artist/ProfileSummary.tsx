import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, User, Clock, Calendar, MessageSquare, Phone, Settings, LogOut, ChevronRight, X, Info, Map as MapIcon } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

import { WorkingHoursEditor } from "./WorkingHoursEditor";
import { BlockedDatesEditor } from "./BlockedDatesEditor";
import { ServiceAreasEditor } from "./ServiceAreasEditor";

interface ProfileSummaryProps {
  artist: {
    id?: string;
    full_name?: string;
    avatar_url?: string;
    rating?: number;
    total_reviews?: number;
    location?: string;
    is_available?: boolean;
    bio?: string;
    experience_years?: number;
    studio_address?: string;
    service_areas?: string[];
  };
  reviews?: any[];
  language?: string;
  isRTL?: boolean;
  onToggleAvailability?: () => void;
  onNavigate?: (path: string) => void;
}

export const ProfileSummary = ({ artist, reviews = [], language = "en", isRTL = false, onToggleAvailability, onNavigate }: ProfileSummaryProps) => {
  const navigate = onNavigate || (() => {});
  const { t } = useLanguage();

  const [openDialog, setOpenDialog] = useState<string | null>(null);

  const isAvailable = artist.is_available ?? true;
  const rating = artist.rating || 0;
  const reviewCount = artist.total_reviews || reviews.length || 0;

  const actionCards = [
    {
      id: "edit-profile",
      icon: User,
      title: language === "ar" ? "تعديل الملف الشخصي" : "Edit Profile",
      badge: null,
      color: "text-primary",
    },
    {
      id: "schedule",
      icon: Clock,
      title: language === "ar" ? "ساعات العمل" : "Working Hours",
      badge: null,
      color: "text-primary",
    },
    {
      id: "service-areas",
      icon: MapIcon,
      title: language === "ar" ? "مناطق الخدمة" : "Service Areas",
      badge: artist.service_areas && artist.service_areas.length > 0 ? artist.service_areas.length.toString() : null,
      color: "text-primary",
    },
    {
      id: "blocked-dates",
      icon: Calendar,
      title: language === "ar" ? "التواريخ المحجوبة" : "Blocked Dates",
      badge: null,
      color: "text-primary",
    },
    {
      id: "reviews",
      icon: Star,
      title: language === "ar" ? "التقييمات" : "Reviews",
      badge: reviewCount > 0 ? reviewCount.toString() : null,
      color: "text-primary",
    },
    {
      id: "account",
      icon: Settings,
      title: language === "ar" ? "إعدادات الحساب" : "Account Settings",
      badge: null,
      color: "text-primary",
    },
  ];

  const handleCardClick = (id: string) => {
    if (id === "edit-profile") {
      navigate("/edit-profile");
    } else if (id === "account") {
      navigate("/settings");
    } else {
      setOpenDialog(id);
    }
  };

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div
        className="bg-card rounded-2xl border border-border p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
        onClick={() => artist.id && navigate(`/artist/${artist.id}`)}
      >
        <div className="flex items-start gap-4">
          <Avatar className="w-20 h-20 border-4 border-primary/20">
            <AvatarImage src={artist.avatar_url} />
            <AvatarFallback className="bg-primary/10 text-primary text-xl font-semibold">
              {artist.full_name?.charAt(0) || "A"}
            </AvatarFallback>
          </Avatar>

          <div className="flex-1 min-w-0">
            <h2 className="text-xl font-bold text-foreground truncate">
              {artist.full_name || (language === "ar" ? "فنان" : "Artist")}
            </h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {language === "ar" ? "فنان مكياج" : "Makeup Artist"}
            </p>

            <div className="flex items-center gap-3 mt-2">
              <div className="flex items-center gap-1">
                <Star className="w-4 h-4 fill-primary text-primary" />
                <span className="font-semibold text-foreground">{rating.toFixed(1)}</span>
                <span className="text-sm text-muted-foreground">
                  ({reviewCount} {language === "ar" ? "تقييم" : reviewCount === 1 ? "review" : "reviews"})
                </span>
              </div>
            </div>

            {artist.location && (
              <div className="flex items-center gap-1 mt-2 text-sm text-muted-foreground">
                <MapPin className="w-3.5 h-3.5" />
                <span>{artist.location}</span>
              </div>
            )}
          </div>

          {/* Status Badge */}
          <div
            className={cn(
              "px-3 py-1.5 rounded-full text-xs font-semibold",
              isAvailable
                ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
            )}
          >
            {isAvailable
              ? (language === "ar" ? "متاح" : "Available")
              : (language === "ar" ? "غير متاح" : "Unavailable")}
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-border text-center">
          <span className="text-sm text-primary font-medium">
            {language === "ar" ? "اضغط لعرض الملف الشخصي الكامل" : "Tap to view full profile"}
          </span>
        </div>
      </div>

      {/* Action Cards - Section 1 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium px-2">
          {language === "ar" ? "الملف الشخصي" : "PROFILE"}
        </p>
        {actionCards.slice(0, 4).map((card) => (
          <ActionCard
            key={card.id}
            card={card}
            language={language}
            isRTL={isRTL}
            onDialogOpen={handleCardClick}
          />
        ))}
      </div>

      {/* Action Cards - Section 2 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium px-2">
          {language === "ar" ? "معلومات ومراجعات" : "INFO & REVIEWS"}
        </p>
        {actionCards.slice(4, 5).map((card) => (
          <ActionCard
            key={card.id}
            card={card}
            language={language}
            isRTL={isRTL}
            onDialogOpen={handleCardClick}
          />
        ))}
      </div>

      {/* Action Cards - Section 3 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium px-2">
          {language === "ar" ? "الحساب" : "ACCOUNT"}
        </p>
        {actionCards.slice(5).map((card) => (
          <ActionCard
            key={card.id}
            card={card}
            language={language}
            isRTL={isRTL}
            onDialogOpen={handleCardClick}
          />
        ))}
        <div
          className="bg-card rounded-2xl border border-border p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer flex items-center gap-4"
          onClick={() => navigate("/logout")}
        >
          <div className={cn("w-10 h-10 rounded-full bg-destructive/10 flex items-center justify-center", isRTL && "order-2")}>
            <LogOut className="w-5 h-5 text-destructive" />
          </div>
          <span className={cn("flex-1 font-medium text-destructive", isRTL && "order-1")}>
            {language === "ar" ? "تسجيل الخروج" : "Log Out"}
          </span>
          <ChevronRight className={cn("w-5 h-5 text-muted-foreground", isRTL && "rotate-180")} />
        </div>
      </div>

      {/* Dialogs */}
      <Dialog open={openDialog === "schedule"} onOpenChange={(open) => setOpenDialog(open ? "schedule" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "ساعات العمل" : "Working Hours"}</DialogTitle>
          </DialogHeader>
          {artist.id ? (
            <WorkingHoursEditor 
              artistId={artist.id} 
              onClose={() => setOpenDialog(null)} 
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {language === "ar" ? "خطأ في تحميل البيانات" : "Error loading data"}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "service-areas"} onOpenChange={(open) => setOpenDialog(open ? "service-areas" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "مناطق الخدمة" : "Service Areas"}</DialogTitle>
          </DialogHeader>
          {artist.id ? (
            <ServiceAreasEditor
              artistId={artist.id}
              initialAreas={artist.service_areas}
              onClose={() => setOpenDialog(null)}
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {language === "ar" ? "خطأ في تحميل البيانات" : "Error loading data"}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "blocked-dates"} onOpenChange={(open) => setOpenDialog(open ? "blocked-dates" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "التواريخ المحجوبة" : "Blocked Dates"}</DialogTitle>
          </DialogHeader>
          {artist.id ? (
            <BlockedDatesEditor 
              artistId={artist.id} 
              onClose={() => setOpenDialog(null)}
            />
          ) : (
            <div className="py-8 text-center text-muted-foreground">
              {language === "ar" ? "خطأ في تحميل البيانات" : "Error loading data"}
            </div>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "reviews"} onOpenChange={(open) => setOpenDialog(open ? "reviews" : null)}>
        <DialogContent className="sm:max-w-md max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "التقييمات" : "Reviews"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <div className="flex items-center gap-3 mb-4 pb-4 border-b">
              <Star className="w-6 h-6 fill-primary text-primary" />
              <div>
                <p className="text-2xl font-bold">{rating.toFixed(1)}</p>
                <p className="text-sm text-muted-foreground">{reviewCount} {language === "ar" ? "تقييم" : reviewCount === 1 ? "review" : "reviews"}</p>
              </div>
            </div>
            {reviews.length > 0 ? (
              <div className="space-y-4">
                {reviews.slice(0, 5).map((review: any, index: number) => (
                  <div key={index} className="p-3 bg-muted rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={review.customer_avatar} />
                        <AvatarFallback>{review.customer_name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                      <span className="text-sm font-medium">{review.customer_name || "Unknown"}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment || "No comment"}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Star className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد تقييمات بعد" : "No reviews yet"}</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface ActionCardProps {
  card: {
    id: string;
    icon: any;
    title: string;
    badge: string | null;
    color: string;
  };
  language: string;
  isRTL: boolean;
  onDialogOpen: (dialogId: string) => void;
}

const ActionCard = ({ card, language, isRTL, onDialogOpen }: ActionCardProps) => {
  const Icon = card.icon;

  const handleTap = () => {
    onDialogOpen(card.id);
  };

  return (
    <div
      className="bg-card rounded-2xl border border-border p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer flex items-center gap-4"
      onClick={handleTap}
    >
      <div className={cn("w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center", isRTL && "order-2")}>
        <Icon className={cn("w-5 h-5", card.color)} />
      </div>
      <span className={cn("flex-1 font-medium text-foreground", isRTL && "order-1")}>
        {card.title}
      </span>
      {card.badge && (
        <span className={cn(
          "px-2.5 py-0.5 text-xs font-medium rounded-full bg-primary text-primary-foreground",
          isRTL && "order-3"
        )}>
          {card.badge}
        </span>
      )}
      <ChevronRight className={cn("w-5 h-5 text-muted-foreground", isRTL && "order-4 rotate-180")} />
    </div>
  );
};

export default ProfileSummary;
