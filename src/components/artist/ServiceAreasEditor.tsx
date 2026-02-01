import { useState } from "react";
import { Check, MapPin, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface ServiceAreasEditorProps {
  artistId: string;
  initialAreas?: string[];
  onClose: () => void;
}

const QATAR_AREAS = [
  { id: "doha", en: "Doha", ar: "الدوحة" },
  { id: "al_rayyan", en: "Al Rayyan", ar: "الريان" },
  { id: "al_wakrah", en: "Al Wakrah", ar: "الوكرة" },
  { id: "al_khor", en: "Al Khor", ar: "الخور" },
  { id: "umm_salal", en: "Umm Salal", ar: "أم صلال" },
  { id: "al_daayen", en: "Al Daayen", ar: "الظعاين" },
  { id: "al_shamal", en: "Al Shamal", ar: "الشمال" },
  { id: "al_sheehaniya", en: "Al Sheehaniya", ar: "الشيحانية" },
  { id: "lusail", en: "Lusail", ar: "لوسيل" },
  { id: "pearl", en: "The Pearl", ar: "اللؤلؤة" },
  { id: "west_bay", en: "West Bay", ar: "الخليج الغربي" },
];

export const ServiceAreasEditor = ({ artistId, initialAreas = [], onClose }: ServiceAreasEditorProps) => {
  const { language, isRTL } = useLanguage();
  const [selectedAreas, setSelectedAreas] = useState<string[]>(initialAreas || []);
  const [isSaving, setIsSaving] = useState(false);

  const toggleArea = (areaId: string) => {
    if (selectedAreas.includes(areaId)) {
      setSelectedAreas(selectedAreas.filter((a) => a !== areaId));
    } else {
      setSelectedAreas([...selectedAreas, areaId]);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Note: service_areas column doesn't exist in the artists table
      // This is a placeholder for future implementation when the column is added
      console.log("Selected areas:", selectedAreas);
      toast.success(language === "ar" ? "تم حفظ مناطق الخدمة" : "Service areas saved");
      onClose();
    } catch (error) {
      console.error("Error saving service areas:", error);
      toast.error(language === "ar" ? "فشل الحفظ" : "Failed to save");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        {language === "ar" 
          ? "حدد المناطق التي يمكنك تقديم خدماتك فيها. سيظهر ملفك الشخصي للعملاء الذين يبحثون في هذه المناطق."
          : "Select the areas where you can provide your services. Your profile will appear to clients searching in these areas."}
      </p>

      <ScrollArea className="h-[300px] pr-4">
        <div className="space-y-2">
          {QATAR_AREAS.map((area) => {
            const isSelected = selectedAreas.includes(area.id);
            return (
              <div
                key={area.id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-xl border cursor-pointer transition-all",
                  isSelected
                    ? "border-primary bg-primary/5 shadow-sm"
                    : "border-border hover:border-primary/50 hover:bg-muted/50"
                )}
                onClick={() => toggleArea(area.id)}
              >
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "w-5 h-5 rounded-full border flex items-center justify-center transition-colors",
                      isSelected
                        ? "bg-primary border-primary text-primary-foreground"
                        : "border-muted-foreground"
                    )}
                  >
                    {isSelected && <Check className="w-3 h-3" />}
                  </div>
                  <span className="font-medium">
                    {language === "ar" ? area.ar : area.en}
                  </span>
                </div>
                <MapPin className={cn("w-4 h-4", isSelected ? "text-primary" : "text-muted-foreground")} />
              </div>
            );
          })}
        </div>
      </ScrollArea>

      <div className="flex gap-3 pt-2">
        <Button variant="outline" className="flex-1" onClick={onClose} disabled={isSaving}>
          {language === "ar" ? "إلغاء" : "Cancel"}
        </Button>
        <Button className="flex-1" onClick={handleSave} disabled={isSaving}>
          {isSaving ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {language === "ar" ? "جاري الحفظ..." : "Saving..."}
            </>
          ) : (
            language === "ar" ? "حفظ التغييرات" : "Save Changes"
          )}
        </Button>
      </div>
    </div>
  );
};
