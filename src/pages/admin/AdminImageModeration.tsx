import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import {
  ShieldCheck, ShieldAlert, Eye, Check, X, RefreshCw, Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface ModerationItem {
  id: string;
  image_url: string;
  source_type: string;
  source_id: string | null;
  user_id: string;
  ai_flagged: boolean;
  ai_confidence: number | null;
  ai_reason: string | null;
  status: string;
  reviewed_by: string | null;
  reviewed_at: string | null;
  admin_notes: string | null;
  created_at: string;
}

const AdminImageModeration = () => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const dateLocale = language === "ar" ? ar : enUS;
  const [items, setItems] = useState<ModerationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<ModerationItem | null>(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [adminNotes, setAdminNotes] = useState("");
  const [actionLoading, setActionLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const fetchItems = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("image_moderation_queue")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (!error && data) {
      setItems(data as unknown as ModerationItem[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchItems(); }, []);

  const handleAction = async (item: ModerationItem, action: "approved" | "rejected") => {
    setActionLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // Update moderation queue
      const { error } = await supabase
        .from("image_moderation_queue")
        .update({
          status: action,
          reviewed_by: user?.id,
          reviewed_at: new Date().toISOString(),
          admin_notes: adminNotes || null,
        } as any)
        .eq("id", item.id);

      if (error) throw error;

      // Update source item
      if (item.source_type === "portfolio" && item.source_id) {
        await supabase
          .from("portfolio_items")
          .update({
            moderation_status: action,
            moderation_reason: action === "rejected" ? (adminNotes || item.ai_reason) : null,
          } as any)
          .eq("id", item.source_id);

        // If rejected, delete the image from storage and the portfolio item
        if (action === "rejected") {
          const urlParts = item.image_url.split("/portfolio/");
          if (urlParts.length > 1) {
            await supabase.storage.from("portfolio").remove([urlParts[1]]);
          }
          await supabase.from("portfolio_items").delete().eq("id", item.source_id);
        }
      }

      // Log to security audit if rejected
      if (action === "rejected") {
        await supabase.from("security_audit_log").insert({
          event_type: "image_rejected",
          user_id: item.user_id,
          metadata: {
            source_type: item.source_type,
            source_id: item.source_id,
            image_url: item.image_url,
            admin_notes: adminNotes,
            reviewed_by: user?.id,
          },
        } as any);
      }

      toast.success(
        action === "approved"
          ? (isRTL ? "تمت الموافقة على الصورة" : "Image approved")
          : (isRTL ? "تم رفض الصورة وحذفها" : "Image rejected and deleted")
      );

      setPreviewOpen(false);
      setSelectedItem(null);
      setAdminNotes("");
      fetchItems();
    } catch (err) {
      console.error("Moderation action error:", err);
      toast.error(isRTL ? "حدث خطأ" : "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const filteredItems = items.filter(i => i.status === activeTab);

  const getStatusBadge = (item: ModerationItem) => {
    if (item.status === "pending") {
      return item.ai_flagged
        ? <Badge variant="destructive">{isRTL ? "⚠️ مشكوك فيها" : "⚠️ Flagged"}</Badge>
        : <Badge variant="secondary">{isRTL ? "قيد المراجعة" : "Pending"}</Badge>;
    }
    if (item.status === "approved") return <Badge variant="default">{isRTL ? "✅ مقبولة" : "✅ Approved"}</Badge>;
    if (item.status === "rejected") return <Badge variant="destructive">{isRTL ? "❌ مرفوضة" : "❌ Rejected"}</Badge>;
    return <Badge variant="outline">{item.status}</Badge>;
  };

  const getSourceLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      portfolio: { ar: "معرض الأعمال", en: "Portfolio" },
      product: { ar: "منتج", en: "Product" },
      avatar: { ar: "صورة شخصية", en: "Avatar" },
      chat: { ar: "دردشة", en: "Chat" },
    };
    return labels[type]?.[language] || type;
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? "مراجعة الصور" : "Image Moderation"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchItems} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} ${loading ? "animate-spin" : ""}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <ShieldAlert className="h-8 w-8 text-orange-500" />
              <div>
                <p className="text-2xl font-bold">{items.filter(i => i.status === "pending").length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? "قيد المراجعة" : "Pending"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <Check className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold">{items.filter(i => i.status === "approved").length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? "مقبولة" : "Approved"}</p>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 flex items-center gap-3">
              <X className="h-8 w-8 text-destructive" />
              <div>
                <p className="text-2xl font-bold">{items.filter(i => i.status === "rejected").length}</p>
                <p className="text-sm text-muted-foreground">{isRTL ? "مرفوضة" : "Rejected"}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="pending">
              {isRTL ? "قيد المراجعة" : "Pending"} ({items.filter(i => i.status === "pending").length})
            </TabsTrigger>
            <TabsTrigger value="approved">
              {isRTL ? "مقبولة" : "Approved"}
            </TabsTrigger>
            <TabsTrigger value="rejected">
              {isRTL ? "مرفوضة" : "Rejected"}
            </TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab}>
            <Card>
              <CardContent className="p-0">
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <div className="p-10 text-center text-muted-foreground">
                      {isRTL ? "جاري التحميل..." : "Loading..."}
                    </div>
                  ) : filteredItems.length === 0 ? (
                    <div className="p-10 text-center text-muted-foreground">
                      <ImageIcon className="h-12 w-12 mx-auto mb-3 opacity-30" />
                      <p>{isRTL ? "لا توجد صور" : "No images"}</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 p-4">
                      {filteredItems.map((item) => (
                        <div
                          key={item.id}
                          className="relative group cursor-pointer rounded-lg overflow-hidden border border-border hover:border-primary transition-colors"
                          onClick={() => {
                            setSelectedItem(item);
                            setAdminNotes(item.admin_notes || "");
                            setPreviewOpen(true);
                          }}
                        >
                          <img
                            src={item.image_url}
                            alt="Moderation"
                            className="w-full aspect-square object-cover"
                          />
                          <div className="absolute bottom-0 left-0 right-0 bg-background/80 backdrop-blur-sm p-2">
                            <div className="flex items-center justify-between">
                              {getStatusBadge(item)}
                              <Badge variant="outline" className="text-[10px]">
                                {getSourceLabel(item.source_type)}
                              </Badge>
                            </div>
                            {item.ai_flagged && (
                              <p className="text-[10px] text-destructive mt-1 truncate">
                                {item.ai_reason}
                              </p>
                            )}
                          </div>
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button variant="secondary" size="icon" className="h-8 w-8">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Review Dialog */}
        <Dialog open={previewOpen} onOpenChange={setPreviewOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{isRTL ? "مراجعة الصورة" : "Review Image"}</DialogTitle>
            </DialogHeader>
            {selectedItem && (
              <div className="space-y-4">
                <img
                  src={selectedItem.image_url}
                  alt="Review"
                  className="w-full max-h-[400px] object-contain rounded-lg border border-border"
                />
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">{isRTL ? "النوع" : "Source"}</p>
                    <p className="font-medium">{getSourceLabel(selectedItem.source_type)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isRTL ? "التاريخ" : "Date"}</p>
                    <p className="font-medium">
                      {format(new Date(selectedItem.created_at), "yyyy-MM-dd HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isRTL ? "تحليل الذكاء الاصطناعي" : "AI Analysis"}</p>
                    <p className="font-medium">
                      {selectedItem.ai_flagged ? "⚠️ " : "✅ "}
                      {selectedItem.ai_reason || (isRTL ? "لا يوجد" : "None")}
                    </p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">{isRTL ? "الثقة" : "Confidence"}</p>
                    <p className="font-medium">{selectedItem.ai_confidence ? `${(selectedItem.ai_confidence * 100).toFixed(0)}%` : "-"}</p>
                  </div>
                </div>

                {selectedItem.status === "pending" && (
                  <>
                    <Textarea
                      placeholder={isRTL ? "ملاحظات المشرف (اختياري)..." : "Admin notes (optional)..."}
                      value={adminNotes}
                      onChange={(e) => setAdminNotes(e.target.value)}
                    />
                    <DialogFooter className="gap-2">
                      <Button
                        variant="destructive"
                        onClick={() => handleAction(selectedItem, "rejected")}
                        disabled={actionLoading}
                      >
                        <X className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {isRTL ? "رفض وحذف" : "Reject & Delete"}
                      </Button>
                      <Button
                        onClick={() => handleAction(selectedItem, "approved")}
                        disabled={actionLoading}
                      >
                        <Check className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"}`} />
                        {isRTL ? "موافقة" : "Approve"}
                      </Button>
                    </DialogFooter>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
};

export default AdminImageModeration;
