import { useState } from "react";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { Search, MoreVertical, Calendar, Clock, MapPin, Eye, User, Phone, Mail, FileText, CreditCard } from "lucide-react";
import { useAdminBookings, useUpdateBookingStatus } from "@/hooks/useAdminBookings";
import { format } from "date-fns";
import { ar } from "date-fns/locale";
import type { Database } from "@/integrations/supabase/types";

type BookingStatus = Database["public"]["Enums"]["booking_status"];

interface AdminBooking {
  id: string;
  booking_date: string;
  booking_time: string;
  status: BookingStatus;
  total_price: number;
  location_type: string;
  location_address: string | null;
  notes: string | null;
  created_at: string;
  customer: {
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  } | null;
  artist: {
    id: string;
    user_id: string;
    profile: {
      full_name: string | null;
      email: string | null;
    } | null;
  } | null;
  service: {
    id: string;
    name: string;
    price: number;
  } | null;
}

const statusLabels: Record<BookingStatus, string> = {
  pending: "قيد الانتظار",
  confirmed: "مؤكد",
  completed: "مكتمل",
  cancelled: "ملغى",
};

const statusColors: Record<BookingStatus, string> = {
  pending: "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  confirmed: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  completed: "bg-green-500/10 text-green-600 border-green-500/20",
  cancelled: "bg-red-500/10 text-red-600 border-red-500/20",
};

const AdminBookings = () => {
  const [statusFilter, setStatusFilter] = useState<BookingStatus | "all">("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [selectedBooking, setSelectedBooking] = useState<AdminBooking | null>(null);

  const { data: bookings, isLoading } = useAdminBookings(statusFilter, debouncedSearch);
  const updateStatus = useUpdateBookingStatus();

  const handleSearch = (value: string) => {
    setSearchQuery(value);
    setTimeout(() => setDebouncedSearch(value), 300);
  };

  const handleStatusChange = (bookingId: string, newStatus: BookingStatus) => {
    updateStatus.mutate({ bookingId, status: newStatus });
  };

  const getStatusBadge = (status: BookingStatus) => (
    <Badge variant="outline" className={statusColors[status]}>
      {statusLabels[status]}
    </Badge>
  );

  return (
    <div className="flex min-h-screen bg-background" dir="rtl">
      <AdminSidebar />
      
      <main className="flex-1 p-6 mr-64">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-foreground">إدارة الحجوزات</h1>
          <p className="text-muted-foreground">عرض وإدارة جميع الحجوزات</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="بحث بالاسم، البريد، رقم الهاتف أو الخدمة..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="pr-10"
                />
              </div>
              <Select
                value={statusFilter}
                onValueChange={(value) => setStatusFilter(value as BookingStatus | "all")}
              >
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="حالة الحجز" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">جميع الحالات</SelectItem>
                  <SelectItem value="pending">قيد الانتظار</SelectItem>
                  <SelectItem value="confirmed">مؤكد</SelectItem>
                  <SelectItem value="completed">مكتمل</SelectItem>
                  <SelectItem value="cancelled">ملغى</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Bookings Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              الحجوزات ({bookings?.length || 0})
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                جاري التحميل...
              </div>
            ) : !bookings?.length ? (
              <div className="text-center py-8 text-muted-foreground">
                لا توجد حجوزات
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-right">العميل</TableHead>
                    <TableHead className="text-right">الفنانة</TableHead>
                    <TableHead className="text-right">الخدمة</TableHead>
                    <TableHead className="text-right">التاريخ والوقت</TableHead>
                    <TableHead className="text-right">الموقع</TableHead>
                    <TableHead className="text-right">السعر</TableHead>
                    <TableHead className="text-right">الحالة</TableHead>
                    <TableHead className="text-right">الإجراءات</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {bookings.map((booking) => (
                    <TableRow key={booking.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium">
                            {booking.customer?.full_name || "غير معروف"}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {booking.customer?.phone || booking.customer?.email}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        {booking.artist?.profile?.full_name || "غير معروف"}
                      </TableCell>
                      <TableCell>{booking.service?.name || "-"}</TableCell>
                      <TableCell>
                        <div className="flex flex-col gap-1">
                          <span className="flex items-center gap-1 text-sm">
                            <Calendar className="h-3 w-3" />
                            {format(new Date(booking.booking_date), "dd MMM yyyy", {
                              locale: ar,
                            })}
                          </span>
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {booking.booking_time}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <span className="flex items-center gap-1 text-sm">
                          <MapPin className="h-3 w-3" />
                          {booking.location_type === "studio"
                            ? "الاستوديو"
                            : "المنزل"}
                        </span>
                      </TableCell>
                      <TableCell className="font-medium">
                        {booking.total_price} ر.س
                      </TableCell>
                      <TableCell>{getStatusBadge(booking.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setSelectedBooking(booking)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              {booking.status !== "confirmed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(booking.id, "confirmed")
                                  }
                                >
                                  تأكيد الحجز
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "completed" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(booking.id, "completed")
                                  }
                                >
                                  تحديد كمكتمل
                                </DropdownMenuItem>
                              )}
                              {booking.status !== "cancelled" && (
                                <DropdownMenuItem
                                  onClick={() =>
                                    handleStatusChange(booking.id, "cancelled")
                                  }
                                  className="text-destructive"
                                >
                                  إلغاء الحجز
                                </DropdownMenuItem>
                              )}
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Booking Details Dialog */}
      <Dialog open={!!selectedBooking} onOpenChange={() => setSelectedBooking(null)}>
        <DialogContent className="max-w-lg" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              تفاصيل الحجز
            </DialogTitle>
          </DialogHeader>

          {selectedBooking && (
            <div className="space-y-4">
              {/* Status */}
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">الحالة</span>
                {getStatusBadge(selectedBooking.status)}
              </div>

              <Separator />

              {/* Customer Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <User className="h-4 w-4" />
                  معلومات العميل
                </h4>
                <div className="grid gap-2 text-sm pr-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الاسم</span>
                    <span>{selectedBooking.customer?.full_name || "غير معروف"}</span>
                  </div>
                  {selectedBooking.customer?.email && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Mail className="h-3 w-3" />
                        البريد
                      </span>
                      <span>{selectedBooking.customer.email}</span>
                    </div>
                  )}
                  {selectedBooking.customer?.phone && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground flex items-center gap-1">
                        <Phone className="h-3 w-3" />
                        الهاتف
                      </span>
                      <span dir="ltr">{selectedBooking.customer.phone}</span>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Booking Info */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  تفاصيل الحجز
                </h4>
                <div className="grid gap-2 text-sm pr-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الفنانة</span>
                    <span>{selectedBooking.artist?.profile?.full_name || "غير معروف"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الخدمة</span>
                    <span>{selectedBooking.service?.name || "-"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">التاريخ</span>
                    <span>
                      {format(new Date(selectedBooking.booking_date), "dd MMMM yyyy", {
                        locale: ar,
                      })}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">الوقت</span>
                    <span dir="ltr">{selectedBooking.booking_time}</span>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Location */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <MapPin className="h-4 w-4" />
                  الموقع
                </h4>
                <div className="grid gap-2 text-sm pr-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">نوع الموقع</span>
                    <span>
                      {selectedBooking.location_type === "studio" ? "الاستوديو" : "المنزل"}
                    </span>
                  </div>
                  {selectedBooking.location_address && (
                    <div>
                      <span className="text-muted-foreground block mb-1">العنوان</span>
                      <p className="bg-muted/50 p-2 rounded text-foreground">
                        {selectedBooking.location_address}
                      </p>
                    </div>
                  )}
                </div>
              </div>

              <Separator />

              {/* Price */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <CreditCard className="h-4 w-4" />
                  السعر
                </h4>
                <div className="grid gap-2 text-sm pr-6">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">سعر الخدمة</span>
                    <span>{selectedBooking.service?.price || 0} ر.س</span>
                  </div>
                  <div className="flex justify-between font-semibold text-base">
                    <span>الإجمالي</span>
                    <span className="text-primary">{selectedBooking.total_price} ر.س</span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {selectedBooking.notes && (
                <>
                  <Separator />
                  <div className="space-y-3">
                    <h4 className="font-semibold flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      ملاحظات
                    </h4>
                    <p className="bg-muted/50 p-3 rounded text-sm text-foreground pr-6">
                      {selectedBooking.notes}
                    </p>
                  </div>
                </>
              )}

              {/* Created At */}
              <div className="text-xs text-muted-foreground text-center pt-2">
                تم إنشاء الحجز في{" "}
                {format(new Date(selectedBooking.created_at), "dd MMM yyyy - HH:mm", {
                  locale: ar,
                })}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminBookings;
