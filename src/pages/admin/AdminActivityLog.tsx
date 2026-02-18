import { useState, useEffect } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { ClipboardList, Trash2, ShieldBan, UserPlus, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ActivityLog {
  id: string;
  admin_id: string;
  action: string;
  target_type: string;
  target_id: string | null;
  target_email: string | null;
  target_name: string | null;
  reason: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const AdminActivityLog = () => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const dateLocale = language === "ar" ? ar : enUS;
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("admin_activity_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(100);

    if (!error && data) {
      setLogs(data as unknown as ActivityLog[]);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  const getActionIcon = (action: string) => {
    switch (action) {
      case "delete_user":
        return <Trash2 className="h-4 w-4 text-destructive" />;
      case "block_ip":
        return <ShieldBan className="h-4 w-4 text-orange-500" />;
      case "create_user":
        return <UserPlus className="h-4 w-4 text-green-500" />;
      default:
        return <ClipboardList className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getActionLabel = (action: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      delete_user: { ar: "حذف مستخدم", en: "Delete User" },
      block_ip: { ar: "حظر IP", en: "Block IP" },
      unblock_ip: { ar: "إلغاء حظر IP", en: "Unblock IP" },
      create_user: { ar: "إنشاء مستخدم", en: "Create User" },
      update_role: { ar: "تحديث الدور", en: "Update Role" },
    };
    return labels[action]?.[language] || action;
  };

  const getActionVariant = (action: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (action) {
      case "delete_user":
        return "destructive";
      case "block_ip":
        return "secondary";
      default:
        return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ClipboardList className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? "سجل النشاط" : "Activity Log"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} ${loading ? "animate-spin" : ""}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">
              {isRTL ? `${logs.length} سجل` : `${logs.length} entries`}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isRTL ? "التاريخ" : "Date"}</TableHead>
                    <TableHead>{isRTL ? "الإجراء" : "Action"}</TableHead>
                    <TableHead>{isRTL ? "الهدف" : "Target"}</TableHead>
                    <TableHead>{isRTL ? "البريد" : "Email"}</TableHead>
                    <TableHead>{isRTL ? "السبب" : "Reason"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {isRTL ? "جاري التحميل..." : "Loading..."}
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-10 text-muted-foreground">
                        {isRTL ? "لا توجد سجلات بعد" : "No activity logs yet"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    logs.map((log) => (
                      <TableRow key={log.id}>
                        <TableCell className="whitespace-nowrap text-sm">
                          {format(new Date(log.created_at), "yyyy-MM-dd HH:mm", { locale: dateLocale })}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {getActionIcon(log.action)}
                            <Badge variant={getActionVariant(log.action)}>
                              {getActionLabel(log.action)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.target_name || (isRTL ? "غير معروف" : "Unknown")}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {log.target_email || "-"}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate">
                          {log.reason || "-"}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
};

export default AdminActivityLog;
