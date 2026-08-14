import { useState } from "react";
import { CalendarPlus, Plus, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useAddArtistToOccasionList, useCreateOccasionList, useOccasionLists } from "@/hooks/useOccasionLists";
import { toast } from "sonner";

interface OccasionListActionsProps {
  artistId: string;
  language: string;
}

export const OccasionListActions = ({ artistId, language }: OccasionListActionsProps) => {
  const isArabic = language === "ar";
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const { data: lists = [], isLoading } = useOccasionLists();
  const createList = useCreateOccasionList();
  const addArtist = useAddArtistToOccasionList();

  const handleCreate = async () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    try {
      const list = await createList.mutateAsync(trimmed);
      await addArtist.mutateAsync({ occasionListId: list.id, artistId });
      toast.success(isArabic ? "تم إنشاء قائمة المناسبة وإضافة الفنانة" : "Occasion list created and artist added");
      setTitle("");
      setOpen(false);
    } catch {
      toast.error(isArabic ? "تعذر حفظ القائمة" : "Could not save the list");
    }
  };

  const handleAdd = async (occasionListId: string) => {
    try {
      await addArtist.mutateAsync({ occasionListId, artistId });
      toast.success(isArabic ? "تمت إضافة الفنانة إلى القائمة" : "Artist added to your list");
      setOpen(false);
    } catch {
      toast.error(isArabic ? "تعذر إضافة الفنانة" : "Could not add the artist");
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="flex-1" onClick={(event) => event.stopPropagation()}>
          <CalendarPlus className="me-1 h-4 w-4" />
          {isArabic ? "قائمة مناسبة" : "Occasion list"}
        </Button>
      </DialogTrigger>
      <DialogContent dir={isArabic ? "rtl" : "ltr"}>
        <DialogHeader>
          <DialogTitle>{isArabic ? "احفظي لاختيارات مناسبتك" : "Save for your occasion"}</DialogTitle>
          <DialogDescription>{isArabic ? "أنشئي قائمة أو أضيفي الفنانة إلى قائمة موجودة." : "Create a list or add this artist to an existing one."}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex gap-2">
            <Input value={title} onChange={(event) => setTitle(event.target.value)} placeholder={isArabic ? "مثال: تخرج أختي" : "Example: My graduation"} maxLength={80} />
            <Button size="icon" disabled={!title.trim() || createList.isPending} onClick={handleCreate} aria-label={isArabic ? "إنشاء قائمة" : "Create list"}>
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {!isLoading && lists.length > 0 && (
            <div className="space-y-2 border-t pt-3">
              {lists.slice(0, 6).map((list) => (
                <button key={list.id} type="button" onClick={() => handleAdd(list.id)} className="flex w-full items-center justify-between rounded-xl border border-border p-3 text-start hover:border-primary/40 hover:bg-primary/5">
                  <span className="font-medium text-foreground">{list.title}</span>
                  <Check className="h-4 w-4 text-primary" />
                </button>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};
