import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useUserRole } from "@/hooks/useUserRole";
import { useAdminWithdrawals, useUpdateWithdrawalStatus } from "@/hooks/useWithdrawals";
import { Navigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Wallet, Clock, CheckCircle, XCircle, Banknote, User } from "lucide-react";
import { formatQAR } from "@/lib/locale";
import { format } from "date-fns";
import { ar } from "date-fns/locale";

const AdminWithdrawals = () => {
  const { role, loading: roleLoading } = useUserRole();
  const { data: withdrawals, isLoading } = useAdminWithdrawals();
  const updateStatus = useUpdateWithdrawalStatus();

  const [selectedWithdrawal, setSelectedWithdrawal] = useState<any>(null);
  const [actionDialogOpen, setActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<"approve" | "reject" | "complete">("approve");
  const [adminNotes, setAdminNotes] = useState("");

  if (roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Skeleton className="h-8 w-32" />
      </div>
    );
  }

  if (role !== "admin") {
    return <Navigate to="/home" replace />;
  }

  const handleAction = (withdrawal: any, action: "approve" | "reject" | "complete") => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setAdminNotes("");
    setActionDialogOpen(true);
  };

  const confirmAction = async () => {
    if (!selectedWithdrawal) return;

    const status = actionType === "approve" ? "approved" : actionType === "reject" ? "rejected" : "completed";
    
    await updateStatus.mutateAsync({
      id: selectedWithdrawal.id,
      status,
      admin_notes: adminNotes,
    });

    setActionDialogOpen(false);
    setSelectedWithdrawal(null);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />قيد المراجعة</Badge>;
      case "approved":
        return <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200"><CheckCircle className="w-3 h-3 mr-1" />تمت الموافقة</Badge>;
      case "completed":
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />مكتمل</Badge>;
      case "rejected":
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />مرفوض</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const pendingCount = withdrawals?.filter((w) => w.status === "pending").length || 0;
  const approvedCount = withdrawals?.filter((w) => w.status === "approved").length || 0;
  const totalPending = withdrawals?.filter((w) => w.status === "pending").reduce((sum, w) => sum + w.amount, 0) || 0;

  return (
    <div className="min-h-screen bg-background" dir="rtl">
      <AdminSidebar />

      <main className="mr-64 p-8">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
                <Wallet className="h-8 w-8" />
                طلبات السحب
              </h1>
              <p className="text-muted-foreground mt-1">
                إدارة طلبات سحب أرباح الفنانات
              </p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-yellow-100">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground">طلبات قيد المراجعة</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-100">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground">بانتظار التحويل</p>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-primary/10">
                  <Banknote className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-2xl font-bold text-foreground">{formatQAR(totalPending)}</p>
                  <p className="text-sm text-muted-foreground">إجمالي الطلبات المعلقة</p>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-card rounded-xl border border-border">
            {isLoading ? (
              <div className="p-8 space-y-4">
                {[...Array(5)].map((_, i) => (
                  <Skeleton key={i} className="h-16" />
                ))}
              </div>
            ) : withdrawals && withdrawals.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">الفنانة</TableHead>
                    <TableHead className="text-right">المبلغ</TableHead>
                    <TableHead className="text-right">البنك</TableHead>
                    <TableHead className="text-right">التاريخ</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal: any) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                            <User className="w-4 h-4 text-primary" />
                          </div>
                          <div>
                            <p className="font-medium">{withdrawal.artist_profile?.full_name || "فنانة"}</p>
                            <p className="text-xs text-muted-foreground">{withdrawal.artist_profile?.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="font-semibold text-foreground">{formatQAR(withdrawal.amount)}</p>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium">{withdrawal.bank_name}</p>
                          <p className="text-xs text-muted-foreground">{withdrawal.account_number}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm">{format(new Date(withdrawal.created_at), "d MMM yyyy", { locale: ar })}</p>
                        <p className="text-xs text-muted-foreground">{format(new Date(withdrawal.created_at), "HH:mm")}</p>
                      </TableCell>
                      <TableCell>{getStatusBadge(withdrawal.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {withdrawal.status === "pending" && (
                            <>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                onClick={() => handleAction(withdrawal, "approve")}
                              >
                                موافقة
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleAction(withdrawal, "reject")}
                              >
                                رفض
                              </Button>
                            </>
                          )}
                          {withdrawal.status === "approved" && (
                            <Button
                              size="sm"
                              onClick={() => handleAction(withdrawal, "complete")}
                            >
                              تم التحويل
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <Wallet className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>لا توجد طلبات سحب</p>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Action Dialog */}
      <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
        <DialogContent className="sm:max-w-md" dir="rtl">
          <DialogHeader>
            <DialogTitle>
              {actionType === "approve" && "تأكيد الموافقة على الطلب"}
              {actionType === "reject" && "تأكيد رفض الطلب"}
              {actionType === "complete" && "تأكيد اكتمال التحويل"}
            </DialogTitle>
            <DialogDescription>
              {selectedWithdrawal && (
                <>
                  المبلغ: {formatQAR(selectedWithdrawal.amount)} - 
                  الفنانة: {selectedWithdrawal.artist_profile?.full_name}
                </>
              )}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            {selectedWithdrawal && (
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <p><strong>البنك:</strong> {selectedWithdrawal.bank_name}</p>
                <p><strong>رقم الحساب:</strong> {selectedWithdrawal.account_number}</p>
                <p><strong>صاحب الحساب:</strong> {selectedWithdrawal.account_holder_name}</p>
              </div>
            )}

            <div className="space-y-2">
              <label className="text-sm font-medium">ملاحظات (اختياري)</label>
              <Textarea
                placeholder={actionType === "reject" ? "سبب الرفض..." : "ملاحظات إضافية..."}
                value={adminNotes}
                onChange={(e) => setAdminNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setActionDialogOpen(false)}
              >
                إلغاء
              </Button>
              <Button
                className={`flex-1 ${actionType === "reject" ? "bg-red-600 hover:bg-red-700" : ""}`}
                onClick={confirmAction}
                disabled={updateStatus.isPending}
              >
                {updateStatus.isPending ? "جاري..." : "تأكيد"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminWithdrawals;

