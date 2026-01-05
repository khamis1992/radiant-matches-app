import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Star, MapPin, User, Clock, Calendar, MessageSquare, Phone, Settings, LogOut, ChevronRight, X, Info } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProfileSummaryProps {
  artist: {
    full_name?: string;
    avatar_url?: string;
    rating?: number;
    total_reviews?: number;
    location?: string;
    is_available?: boolean;
    bio?: string;
    experience_years?: number;
    studio_address?: string;
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
      id: "phone-location",
      icon: Phone,
      title: language === "ar" ? "الهاتف والموقع" : "Phone & Location",
      badge: null,
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

  return (
    <div className="space-y-4">
      {/* Profile Header Card */}
      <div
        className="bg-card rounded-2xl border border-border p-4 shadow-sm active:scale-[0.99] transition-transform cursor-pointer"
        onClick={() => navigate("/profile-preview")}
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
        {actionCards.slice(0, 3).map((card) => (
          <ActionCard
            key={card.id}
            card={card}
            language={language}
            isRTL={isRTL}
            onDialogOpen={setOpenDialog}
          />
        ))}
      </div>

      {/* Action Cards - Section 2 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium px-2">
          {language === "ar" ? "معلومات ومراجعات" : "INFO & REVIEWS"}
        </p>
        {actionCards.slice(3, 6).map((card) => (
          <ActionCard
            key={card.id}
            card={card}
            language={language}
            isRTL={isRTL}
            onDialogOpen={setOpenDialog}
          />
        ))}
      </div>

      {/* Action Cards - Section 3 */}
      <div className="space-y-2">
        <p className="text-xs text-muted-foreground font-medium px-2">
          {language === "ar" ? "الحساب" : "ACCOUNT"}
        </p>
        {actionCards.slice(6).map((card) => (
          <ActionCard
            key={card.id}
            card={card}
            language={language}
            isRTL={isRTL}
            onDialogOpen={setOpenDialog}
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
      <Dialog open={openDialog === "edit-profile"} onOpenChange={(open) => setOpenDialog(open ? "edit-profile" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "تعديل الملف الشخصي" : "Edit Profile"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "تحرير معلومات الملف الشخصي الأساسية" : "Edit basic profile information"}
            </p>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{language === "ar" ? "الاسم" : "Name"}</span>
                <span className="text-sm text-muted-foreground">{artist.full_name || "-"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{language === "ar" ? "الموقع" : "Location"}</span>
                <span className="text-sm text-muted-foreground">{artist.location || "-"}</span>
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{language === "ar" ? "سنوات الخبرة" : "Experience"}</span>
                <span className="text-sm text-muted-foreground">{artist.experience_years || 0} {language === "ar" ? "سنوات" : "years"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOpenDialog(null);
              navigate("/edit-profile");
            }}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            {language === "ar" ? "تحرير المزيد" : "Edit More"}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "schedule"} onOpenChange={(open) => setOpenDialog(open ? "schedule" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "ساعات العمل" : "Working Hours"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "إدارة ساعات العمل الأسبوعية" : "Manage weekly working hours"}
            </p>
            <div className="space-y-2">
              {["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"].map((day) => (
                <div key={day} className="flex items-center justify-between p-3 bg-muted rounded-lg">
                  <span className="text-sm font-medium">{day}</span>
                  <span className="text-sm text-muted-foreground">9:00 AM - 6:00 PM</span>
                </div>
              ))}
            </div>
          </div>
          <button
            onClick={() => {
              setOpenDialog(null);
              toast.info(language === "ar" ? "قريباً" : "Coming soon");
            }}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            {language === "ar" ? "تعديل الساعات" : "Edit Hours"}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "blocked-dates"} onOpenChange={(open) => setOpenDialog(open ? "blocked-dates" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "التواريخ المحجوبة" : "Blocked Dates"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "إدارة التواريخ غير المتاحة للحجوزات" : "Manage unavailable dates for bookings"}
            </p>
            <div className="text-center py-8 bg-muted rounded-lg">
              <Calendar className="w-12 h-12 mx-auto mb-2 text-muted-foreground" />
              <p className="text-sm text-muted-foreground">{language === "ar" ? "لا توجد تواريخ محجوبة" : "No blocked dates"}</p>
            </div>
          </div>
          <button
            onClick={() => {
              setOpenDialog(null);
              toast.info(language === "ar" ? "قريباً" : "Coming soon");
            }}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            {language === "ar" ? "إضافة تاريخ" : "Add Date"}
          </button>
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

      <Dialog open={openDialog === "phone-location"} onOpenChange={(open) => setOpenDialog(open ? "phone-location" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "الهاتف والموقع" : "Phone & Location"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "معلومات الاتصال وعنوان الاستوديو" : "Contact info and studio address"}
            </p>
            <div className="space-y-3">
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <Phone className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{language === "ar" ? "الهاتف" : "Phone"}</p>
                  <p className="text-sm text-muted-foreground">+974 XXXX XXXX</p>
                </div>
              </div>
              <div className="flex items-start gap-3 p-3 bg-muted rounded-lg">
                <MapPin className="w-5 h-5 text-primary mt-0.5" />
                <div>
                  <p className="text-sm font-medium">{language === "ar" ? "العنوان" : "Address"}</p>
                  <p className="text-sm text-muted-foreground">{artist.studio_address || (artist.location || "-")}</p>
                </div>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOpenDialog(null);
              toast.info(language === "ar" ? "قريباً" : "Coming soon");
            }}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            {language === "ar" ? "تعديل" : "Edit"}
          </button>
        </DialogContent>
      </Dialog>

      <Dialog open={openDialog === "account"} onOpenChange={(open) => setOpenDialog(open ? "account" : null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{language === "ar" ? "إعدادات الحساب" : "Account Settings"}</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-4">
              {language === "ar" ? "إدارة إعدادات الحساب والخصوصية" : "Manage account and privacy settings"}
            </p>
            <div className="space-y-2">
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{language === "ar" ? "الإشعارات" : "Notifications"}</span>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{language === "ar" ? "الخصوصية" : "Privacy"}</span>
                <Info className="w-4 h-4 text-muted-foreground" />
              </div>
              <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
                <span className="text-sm font-medium">{language === "ar" ? "اللغة" : "Language"}</span>
                <span className="text-sm text-muted-foreground">{language === "ar" ? "العربية" : "English"}</span>
              </div>
            </div>
          </div>
          <button
            onClick={() => {
              setOpenDialog(null);
              toast.info(language === "ar" ? "قريباً" : "Coming soon");
            }}
            className="w-full py-2 bg-primary text-primary-foreground rounded-lg font-medium"
          >
            {language === "ar" ? "المزيد من الإعدادات" : "More Settings"}
          </button>
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
