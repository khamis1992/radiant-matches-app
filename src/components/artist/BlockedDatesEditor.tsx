import { useState } from "react";
import { useBlockedDates, useAddBlockedDate, useRemoveBlockedDate } from "@/hooks/useBlockedDates";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2, CalendarIcon } from "lucide-react";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Input } from "@/components/ui/input";

interface BlockedDatesEditorProps {
  artistId: string;
  onClose?: () => void;
}

export const BlockedDatesEditor = ({ artistId, onClose }: BlockedDatesEditorProps) => {
  const { t, language, isRTL } = useLanguage();
  const { data: blockedDates, isLoading } = useBlockedDates(artistId);
  const addBlockedDate = useAddBlockedDate();
  const removeBlockedDate = useRemoveBlockedDate();

  const [date, setDate] = useState<Date | undefined>(undefined);
  const [reason, setReason] = useState("");
  const [isPopoverOpen, setIsPopoverOpen] = useState(false);

  const handleAdd = async () => {
    if (!date) return;
    
    try {
      await addBlockedDate.mutateAsync({
        artistId,
        date,
        reason,
      });
      toast.success(language === "ar" ? "تم إضافة التاريخ" : "Date blocked");
      setDate(undefined);
      setReason("");
    } catch (error) {
      toast.error(language === "ar" ? "فشل الإضافة" : "Failed to block date");
    }
  };

  const handleRemove = async (id: string) => {
    try {
      await removeBlockedDate.mutateAsync({
        blockedDateId: id,
        artistId,
      });
      toast.success(language === "ar" ? "تم الحذف" : "Date unblocked");
    } catch (error) {
      toast.error(language === "ar" ? "فشل الحذف" : "Failed to unblock");
    }
  };

  if (isLoading) {
    return <div className="p-8 flex justify-center"><Loader2 className="animate-spin" /></div>;
  }

  const locale = language === "ar" ? ar : enUS;

  return (
    <div className="space-y-6 py-2">
      <div className="space-y-3">
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium">
            {language === "ar" ? "إضافة تاريخ جديد" : "Add New Blocked Date"}
          </label>
          <Popover open={isPopoverOpen} onOpenChange={setIsPopoverOpen}>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-full justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP", { locale }) : <span>{language === "ar" ? "اختر تاريخ" : "Pick a date"}</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={date}
                onSelect={(d) => {
                  setDate(d);
                  setIsPopoverOpen(false);
                }}
                initialFocus
                disabled={(date) => date < new Date(new Date().setHours(0, 0, 0, 0))}
              />
            </PopoverContent>
          </Popover>
          
          <Input 
            placeholder={language === "ar" ? "السبب (اختياري)" : "Reason (optional)"}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
          />
          
          <Button 
            onClick={handleAdd} 
            disabled={!date || addBlockedDate.isPending}
            className="w-full"
          >
            {addBlockedDate.isPending ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              language === "ar" ? "حظر التاريخ" : "Block Date"
            )}
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">
          {language === "ar" ? "التواريخ المحجوبة حالياً" : "Currently Blocked Dates"}
        </label>
        {blockedDates && blockedDates.length > 0 ? (
          <div className="space-y-2 max-h-[40vh] overflow-y-auto pr-1">
            {blockedDates.map((bd) => (
              <div key={bd.id} className="flex items-center justify-between p-3 bg-muted rounded-lg border border-border">
                <div>
                  <p className="font-medium text-sm">
                    {format(new Date(bd.blocked_date), "PPP", { locale })}
                  </p>
                  {bd.reason && (
                    <p className="text-xs text-muted-foreground">{bd.reason}</p>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={() => handleRemove(bd.id)}
                  disabled={removeBlockedDate.isPending}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground bg-muted/30 rounded-lg border border-dashed">
            {language === "ar" ? "لا توجد تواريخ محجوبة" : "No blocked dates"}
          </div>
        )}
      </div>
    </div>
  );
};
