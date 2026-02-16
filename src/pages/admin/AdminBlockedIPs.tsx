import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useBlockedIps, useBlockIp, useUnblockIp, useDeleteBlockedIp } from "@/hooks/useBlockedIps";
import { useUserRole } from "@/hooks/useUserRole";
import { useLanguage } from "@/contexts/LanguageContext";
import { Navigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Shield, Plus, Trash2, ToggleLeft, ToggleRight } from "lucide-react";
import { toast } from "sonner";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";

const AdminBlockedIPs = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { isRTL, language } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;

  const { data: blockedIps, isLoading } = useBlockedIps();
  const blockIp = useBlockIp();
  const unblockIp = useUnblockIp();
  const deleteIp = useDeleteBlockedIp();

  const [addDialog, setAddDialog] = useState(false);
  const [newIp, setNewIp] = useState("");
  const [newReason, setNewReason] = useState("");

  if (roleLoading) return <div className="min-h-screen bg-background flex items-center justify-center"><Skeleton className="h-8 w-32" /></div>;
  if (role !== "admin") return <Navigate to="/home" replace />;

  const t = {
    title: language === "ar" ? "عناوين IP المحظورة" : "Blocked IPs",
    subtitle: language === "ar" ? "إدارة عناوين IP المحظورة من التسجيل" : "Manage IPs blocked from registration",
    addIp: language === "ar" ? "إضافة حظر" : "Add Block",
    ipAddress: language === "ar" ? "عنوان IP" : "IP Address",
    reason: language === "ar" ? "السبب" : "Reason",
    status: language === "ar" ? "الحالة" : "Status",
    date: language === "ar" ? "التاريخ" : "Date",
    actions: language === "ar" ? "الإجراءات" : "Actions",
    active: language === "ar" ? "نشط" : "Active",
    inactive: language === "ar" ? "غير نشط" : "Inactive",
    block: language === "ar" ? "حظر" : "Block",
    cancel: language === "ar" ? "إلغاء" : "Cancel",
    ipRequired: language === "ar" ? "عنوان IP مطلوب" : "IP address is required",
    blocked: language === "ar" ? "تم الحظر بنجاح" : "IP blocked successfully",
    unblocked: language === "ar" ? "تم إلغاء الحظر" : "IP unblocked",
    deleted: language === "ar" ? "تم الحذف" : "IP deleted",
    noBlocked: language === "ar" ? "لا توجد عناوين محظورة" : "No blocked IPs",
    reasonPlaceholder: language === "ar" ? "سبب الحظر (اختياري)" : "Block reason (optional)",
    ipPlaceholder: language === "ar" ? "مثال: 192.168.1.1" : "e.g. 192.168.1.1",
  };

  const handleBlock = async () => {
    if (!newIp.trim()) {
      toast.error(t.ipRequired);
      return;
    }
    try {
      await blockIp.mutateAsync({ ip_address: newIp.trim(), reason: newReason.trim() || undefined });
      toast.success(t.blocked);
      setAddDialog(false);
      setNewIp("");
      setNewReason("");
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      <main className={cn("p-8", isRTL ? "mr-64" : "ml-64")}>
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
              <p className="text-muted-foreground mt-1">{t.subtitle}</p>
            </div>
            <Button onClick={() => setAddDialog(true)}>
              <Plus className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
              {t.addIp}
            </Button>
          </div>

          <div className="bg-card rounded-xl border border-border">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-16" />)}
              </div>
            ) : !blockedIps?.length ? (
              <div className="p-12 text-center text-muted-foreground">{t.noBlocked}</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t.ipAddress}</TableHead>
                    <TableHead>{t.reason}</TableHead>
                    <TableHead>{t.status}</TableHead>
                    <TableHead>{t.date}</TableHead>
                    <TableHead>{t.actions}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {blockedIps.map((ip) => (
                    <TableRow key={ip.id}>
                      <TableCell className="font-mono">{ip.ip_address}</TableCell>
                      <TableCell>{ip.reason || "-"}</TableCell>
                      <TableCell>
                        <Badge variant={ip.is_active ? "destructive" : "secondary"}>
                          {ip.is_active ? t.active : t.inactive}
                        </Badge>
                      </TableCell>
                      <TableCell>{format(new Date(ip.created_at), "d MMM yyyy", { locale: dateLocale })}</TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                if (ip.is_active) {
                                  await unblockIp.mutateAsync(ip.id);
                                  toast.success(t.unblocked);
                                } else {
                                  await blockIp.mutateAsync({ ip_address: ip.ip_address, reason: ip.reason || undefined });
                                  toast.success(t.blocked);
                                }
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            }}
                          >
                            {ip.is_active ? <ToggleRight className="h-4 w-4 text-destructive" /> : <ToggleLeft className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={async () => {
                              try {
                                await deleteIp.mutateAsync(ip.id);
                                toast.success(t.deleted);
                              } catch (err: any) {
                                toast.error(err.message);
                              }
                            }}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </div>
      </main>

      <Dialog open={addDialog} onOpenChange={setAddDialog}>
        <DialogContent className="sm:max-w-md" dir={isRTL ? "rtl" : "ltr"}>
          <DialogHeader>
            <DialogTitle>{t.addIp}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>{t.ipAddress} *</Label>
              <Input
                value={newIp}
                onChange={(e) => setNewIp(e.target.value)}
                placeholder={t.ipPlaceholder}
                dir="ltr"
              />
            </div>
            <div className="space-y-2">
              <Label>{t.reason}</Label>
              <Textarea
                value={newReason}
                onChange={(e) => setNewReason(e.target.value)}
                placeholder={t.reasonPlaceholder}
              />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setAddDialog(false)}>{t.cancel}</Button>
            <Button onClick={handleBlock} disabled={blockIp.isPending}>{t.block}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBlockedIPs;
