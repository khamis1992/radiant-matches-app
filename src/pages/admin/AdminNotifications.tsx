import { useState, useMemo } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { useAdminNotifications } from "@/hooks/useAdminNotifications";
import { useLanguage } from "@/contexts/LanguageContext";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Filter, Check, Trash2, Bell, Calendar } from "lucide-react";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";

const AdminNotifications = () => {
  const navigate = useNavigate();
  const { t, isRTL, language } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;
  const { notifications, markAsRead, markAllAsRead, clearNotifications } = useAdminNotifications();
  
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredNotifications = useMemo(() => {
    return notifications.filter((notification) => {
      // Search filter
      const matchesSearch = notification.message
        .toLowerCase()
        .includes(searchQuery.toLowerCase());
      
      // Type filter
      const matchesType = typeFilter === "all" || notification.type === typeFilter;
      
      // Status filter
      const matchesStatus =
        statusFilter === "all" ||
        (statusFilter === "read" && notification.isRead) ||
        (statusFilter === "unread" && !notification.isRead);
      
      return matchesSearch && matchesType && matchesStatus;
    });
  }, [notifications, searchQuery, typeFilter, statusFilter]);

  const getNotificationTypeLabel = (type: string) => {
    switch (type) {
      case "new_booking":
        return "حجز جديد";
      case "cancelled_booking":
        return "حجز ملغي";
      case "pending_booking":
        return "حجز معلق";
      default:
        return type;
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case "new_booking":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">حجز جديد</Badge>;
      case "cancelled_booking":
        return <Badge variant="destructive">ملغي</Badge>;
      case "pending_booking":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">معلق</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  return (
    <div className="min-h-screen bg-background" dir={isRTL ? "rtl" : "ltr"}>
      <AdminSidebar />
      
      <main className={cn("p-6", isRTL ? "mr-64" : "ml-64")}>
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Bell className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h1 className="text-2xl font-bold">{t.adminNav.notificationLog}</h1>
                <p className="text-muted-foreground text-sm">
                  {notifications.length} {isRTL ? "إشعار" : "notifications"} • {unreadCount} {isRTL ? "غير مقروء" : "unread"}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className="h-4 w-4 ml-2" />
                  تعيين الكل كمقروء
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" onClick={clearNotifications}>
                  <Trash2 className="h-4 w-4 ml-2" />
                  مسح الكل
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                البحث والفلترة
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="البحث في الإشعارات..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pr-10"
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="نوع الإشعار" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الأنواع</SelectItem>
                    <SelectItem value="new_booking">حجز جديد</SelectItem>
                    <SelectItem value="pending_booking">حجز معلق</SelectItem>
                    <SelectItem value="cancelled_booking">حجز ملغي</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">جميع الحالات</SelectItem>
                    <SelectItem value="unread">غير مقروء</SelectItem>
                    <SelectItem value="read">مقروء</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Notifications Table */}
          <Card>
            <CardContent className="p-0">
              {filteredNotifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center mb-4">
                    <Bell className="h-8 w-8 text-muted-foreground" />
                  </div>
                  <h3 className="font-medium text-lg mb-2">لا توجد إشعارات</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                      ? "لا توجد نتائج تطابق معايير البحث"
                      : "ستظهر الإشعارات هنا عند وجود حجوزات جديدة أو تحديثات"}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="text-right w-12">الحالة</TableHead>
                      <TableHead className="text-right">الرسالة</TableHead>
                      <TableHead className="text-right w-32">النوع</TableHead>
                      <TableHead className="text-right w-48">التاريخ</TableHead>
                      <TableHead className="text-right w-32">إجراءات</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredNotifications.map((notification) => (
                      <TableRow
                        key={notification.id}
                        className={cn(
                          "cursor-pointer hover:bg-muted/50",
                          !notification.isRead && "bg-primary/5"
                        )}
                        onClick={() => {
                          markAsRead(notification.id);
                          navigate("/admin/bookings");
                        }}
                      >
                        <TableCell>
                          {!notification.isRead ? (
                            <div className="h-3 w-3 rounded-full bg-primary" />
                          ) : (
                            <div className="h-3 w-3 rounded-full bg-muted" />
                          )}
                        </TableCell>
                        <TableCell className={cn(
                          "font-medium",
                          !notification.isRead && "text-foreground"
                        )}>
                          {notification.message}
                        </TableCell>
                        <TableCell>
                          {getNotificationTypeBadge(notification.type)}
                        </TableCell>
                        <TableCell className="text-muted-foreground">
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            {format(notification.createdAt, "dd MMM yyyy - HH:mm", {
                              locale: ar,
                            })}
                          </div>
                        </TableCell>
                        <TableCell>
                          {!notification.isRead && (
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                markAsRead(notification.id);
                              }}
                            >
                              <Check className="h-4 w-4 ml-1" />
                              قراءة
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default AdminNotifications;
