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
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { Shield, Search, RefreshCw, UserPlus, LogIn, Trash2, ShieldBan, Key } from "lucide-react";

interface AuditEntry {
  id: string;
  event_type: string;
  user_id: string | null;
  email: string | null;
  full_name: string | null;
  ip_address: string | null;
  user_agent: string | null;
  country_code: string | null;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

const AdminSecurityAudit = () => {
  const { language } = useLanguage();
  const isRTL = language === "ar";
  const dateLocale = language === "ar" ? ar : enUS;
  const [logs, setLogs] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("security_audit_log")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);

    if (search.trim()) {
      query = query.or(`email.ilike.%${search.trim()}%,ip_address.ilike.%${search.trim()}%,full_name.ilike.%${search.trim()}%`);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as unknown as AuditEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const getEventIcon = (type: string) => {
    switch (type) {
      case "signup": return <UserPlus className="h-4 w-4 text-green-500" />;
      case "login": return <LogIn className="h-4 w-4 text-blue-500" />;
      case "account_deleted": return <Trash2 className="h-4 w-4 text-destructive" />;
      case "ip_blocked": return <ShieldBan className="h-4 w-4 text-orange-500" />;
      case "password_reset": return <Key className="h-4 w-4 text-yellow-500" />;
      default: return <Shield className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const getEventLabel = (type: string) => {
    const labels: Record<string, { ar: string; en: string }> = {
      signup: { ar: "تسجيل جديد", en: "Signup" },
      login: { ar: "تسجيل دخول", en: "Login" },
      account_deleted: { ar: "حذف حساب", en: "Account Deleted" },
      ip_blocked: { ar: "حظر IP", en: "IP Blocked" },
      password_reset: { ar: "إعادة تعيين كلمة المرور", en: "Password Reset" },
      ip_check: { ar: "فحص IP", en: "IP Check" },
    };
    return labels[type]?.[language] || type;
  };

  const getEventVariant = (type: string): "destructive" | "secondary" | "default" | "outline" => {
    switch (type) {
      case "account_deleted": return "destructive";
      case "signup": return "default";
      case "ip_blocked": return "secondary";
      default: return "outline";
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-bold text-foreground">
              {isRTL ? "السجل الأمني الدائم" : "Security Audit Log"}
            </h1>
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 ${isRTL ? "ml-2" : "mr-2"} ${loading ? "animate-spin" : ""}`} />
            {isRTL ? "تحديث" : "Refresh"}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">
          {isRTL
            ? "هذا السجل دائم ولا يُحذف حتى بعد حذف حسابات المستخدمين. يمكنك البحث بالبريد الإلكتروني أو عنوان IP أو الاسم."
            : "This log is permanent and persists even after user accounts are deleted. Search by email, IP address, or name."}
        </p>

        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground ${isRTL ? "right-3" : "left-3"}`} />
            <Input
              placeholder={isRTL ? "بحث بالبريد، IP، أو الاسم..." : "Search by email, IP, or name..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && fetchLogs()}
              className={isRTL ? "pr-10" : "pl-10"}
            />
          </div>
          <Button onClick={fetchLogs} disabled={loading}>
            {isRTL ? "بحث" : "Search"}
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
                    <TableHead>{isRTL ? "الحدث" : "Event"}</TableHead>
                    <TableHead>{isRTL ? "البريد" : "Email"}</TableHead>
                    <TableHead>{isRTL ? "الاسم" : "Name"}</TableHead>
                    <TableHead>{isRTL ? "IP" : "IP Address"}</TableHead>
                    <TableHead>{isRTL ? "الدولة" : "Country"}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        {isRTL ? "جاري التحميل..." : "Loading..."}
                      </TableCell>
                    </TableRow>
                  ) : logs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-10 text-muted-foreground">
                        {isRTL ? "لا توجد سجلات" : "No audit logs found"}
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
                            {getEventIcon(log.event_type)}
                            <Badge variant={getEventVariant(log.event_type)}>
                              {getEventLabel(log.event_type)}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {log.email || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.full_name || "-"}
                        </TableCell>
                        <TableCell className="text-sm font-mono">
                          {log.ip_address || "-"}
                        </TableCell>
                        <TableCell className="text-sm">
                          {log.country_code || "-"}
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

export default AdminSecurityAudit;
