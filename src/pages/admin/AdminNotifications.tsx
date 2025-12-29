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
        return t.adminNotifications.newBooking;
      case "cancelled_booking":
        return t.adminNotifications.cancelledBooking;
      case "pending_booking":
        return t.adminNotifications.pendingBooking;
      default:
        return type;
    }
  };

  const getNotificationTypeBadge = (type: string) => {
    switch (type) {
      case "new_booking":
        return <Badge className="bg-green-500/20 text-green-600 border-green-500/30">{t.adminNotifications.newBooking}</Badge>;
      case "cancelled_booking":
        return <Badge variant="destructive">{t.adminNotifications.cancelledBooking}</Badge>;
      case "pending_booking":
        return <Badge className="bg-yellow-500/20 text-yellow-600 border-yellow-500/30">{t.adminNotifications.pendingBooking}</Badge>;
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
                <h1 className="text-2xl font-bold">{t.adminNotifications.title}</h1>
                <p className="text-muted-foreground text-sm">
                  {notifications.length} {t.adminNotifications.notificationCount} • {unreadCount} {t.adminNotifications.unread}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {unreadCount > 0 && (
                <Button variant="outline" onClick={markAllAsRead}>
                  <Check className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t.adminNotifications.markAllRead}
                </Button>
              )}
              {notifications.length > 0 && (
                <Button variant="outline" onClick={clearNotifications}>
                  <Trash2 className={cn("h-4 w-4", isRTL ? "ml-2" : "mr-2")} />
                  {t.adminNotifications.clearAll}
                </Button>
              )}
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-4">
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-5 w-5" />
                {t.adminNotifications.searchAndFilter}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="relative">
                  <Search className={cn("absolute top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground", isRTL ? "right-3" : "left-3")} />
                  <Input
                    placeholder={t.adminNotifications.searchPlaceholder}
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className={cn(isRTL ? "pr-10" : "pl-10")}
                  />
                </div>
                
                <Select value={typeFilter} onValueChange={setTypeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminNotifications.notificationType} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminNotifications.allTypes}</SelectItem>
                    <SelectItem value="new_booking">{t.adminNotifications.newBooking}</SelectItem>
                    <SelectItem value="pending_booking">{t.adminNotifications.pendingBooking}</SelectItem>
                    <SelectItem value="cancelled_booking">{t.adminNotifications.cancelledBooking}</SelectItem>
                  </SelectContent>
                </Select>
                
                <Select value={statusFilter} onValueChange={setStatusFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder={t.adminNotifications.statusFilter} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t.adminNotifications.allStatuses}</SelectItem>
                    <SelectItem value="unread">{t.adminNotifications.unreadStatus}</SelectItem>
                    <SelectItem value="read">{t.adminNotifications.readStatus}</SelectItem>
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
                  <h3 className="font-medium text-lg mb-2">{t.adminNotifications.noNotifications}</h3>
                  <p className="text-muted-foreground text-sm max-w-sm">
                    {searchQuery || typeFilter !== "all" || statusFilter !== "all"
                      ? t.adminNotifications.noResultsMessage
                      : t.adminNotifications.notificationsWillAppear}
                  </p>
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className={cn(isRTL ? "text-right" : "text-left", "w-12")}>{t.adminNotifications.statusColumn}</TableHead>
                      <TableHead className={cn(isRTL ? "text-right" : "text-left")}>{t.adminNotifications.message}</TableHead>
                      <TableHead className={cn(isRTL ? "text-right" : "text-left", "w-32")}>{t.adminNotifications.type}</TableHead>
                      <TableHead className={cn(isRTL ? "text-right" : "text-left", "w-48")}>{t.adminNotifications.dateColumn}</TableHead>
                      <TableHead className={cn(isRTL ? "text-right" : "text-left", "w-32")}>{t.adminNotifications.actionsColumn}</TableHead>
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
                              locale: dateLocale,
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
                              <Check className={cn("h-4 w-4", isRTL ? "ml-1" : "mr-1")} />
                              {t.adminNotifications.markRead}
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
