import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useWorkingHours, useUpdateWorkingHours, WorkingHourUpdate } from "@/hooks/useWorkingHours";
import { Switch } from "@/components/ui/switch";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Loader2, Save } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

interface WorkingHoursEditorProps {
  artistId: string;
  onClose: () => void;
}

const DAYS = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

// Generate time slots (every 30 mins)
const TIME_SLOTS = Array.from({ length: 48 }).map((_, i) => {
  const hour = Math.floor(i / 2);
  const minute = i % 2 === 0 ? "00" : "30";
  const time = `${hour.toString().padStart(2, "0")}:${minute}`;
  
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  const ampm = hour < 12 ? "AM" : "PM";
  const label = `${displayHour}:${minute} ${ampm}`;
  
  return { value: time, label };
});

export const WorkingHoursEditor = ({ artistId, onClose }: WorkingHoursEditorProps) => {
  const { t, language } = useLanguage();
  const { data: existingHours, isLoading } = useWorkingHours(artistId);
  const updateHours = useUpdateWorkingHours();
  
  const [hours, setHours] = useState<WorkingHourUpdate[]>([]);

  useEffect(() => {
    if (existingHours) {
      // Initialize with existing hours or defaults
      const initialHours = DAYS.map((_, index) => {
        const existing = existingHours.find(h => h.day_of_week === index);
        return {
          day_of_week: index,
          is_working: existing ? existing.is_working : true,
          start_time: existing ? existing.start_time.slice(0, 5) : "09:00",
          end_time: existing ? existing.end_time.slice(0, 5) : "18:00",
        };
      });
      setHours(initialHours);
    }
  }, [existingHours]);

  const handleToggleDay = (dayIndex: number) => {
    setHours(prev => prev.map(h => 
      h.day_of_week === dayIndex ? { ...h, is_working: !h.is_working } : h
    ));
  };

  const handleTimeChange = (dayIndex: number, type: "start" | "end", value: string) => {
    setHours(prev => prev.map(h => {
      if (h.day_of_week !== dayIndex) return h;
      return type === "start" 
        ? { ...h, start_time: value }
        : { ...h, end_time: value };
    }));
  };

  const handleSave = async () => {
    try {
      await updateHours.mutateAsync({
        artistId,
        hours,
      });
      toast.success(language === "ar" ? "تم تحديث ساعات العمل" : "Working hours updated");
      onClose();
    } catch (error) {
      toast.error(language === "ar" ? "فشل التحديث" : "Failed to update");
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  return (
    <div className="space-y-4 py-4">
      <div className="space-y-4 max-h-[60vh] overflow-y-auto px-1">
        {DAYS.map((day, index) => {
          const dayConfig = hours.find(h => h.day_of_week === index);
          if (!dayConfig) return null;

          return (
            <div key={day} className="flex flex-col gap-3 p-3 border rounded-lg bg-card">
              <div className="flex items-center justify-between">
                <Label className="font-medium text-base">{language === "ar" ? t.settings[day.toLowerCase() as keyof typeof t.settings] || day : day}</Label>
                <Switch 
                  checked={dayConfig.is_working}
                  onCheckedChange={() => handleToggleDay(index)}
                />
              </div>
              
              {dayConfig.is_working && (
                <div className="flex items-center gap-2">
                  <Select 
                    value={dayConfig.start_time}
                    onValueChange={(v) => handleTimeChange(index, "start", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={`start-${slot.value}`} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <span className="text-muted-foreground">-</span>
                  <Select 
                    value={dayConfig.end_time}
                    onValueChange={(v) => handleTimeChange(index, "end", v)}
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {TIME_SLOTS.map(slot => (
                        <SelectItem key={`end-${slot.value}`} value={slot.value}>
                          {slot.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {!dayConfig.is_working && (
                <p className="text-sm text-muted-foreground italic">
                  {language === "ar" ? "مغلق" : "Closed"}
                </p>
              )}
            </div>
          );
        })}
      </div>

      <Button className="w-full" onClick={handleSave} disabled={updateHours.isPending}>
        {updateHours.isPending ? (
          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
        ) : (
          <Save className="w-4 h-4 mr-2" />
        )}
        {language === "ar" ? "حفظ التغييرات" : "Save Changes"}
      </Button>
    </div>
  );
};
