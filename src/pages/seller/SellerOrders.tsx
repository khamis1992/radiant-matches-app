import { useState } from "react";
import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ClipboardList, Truck, CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { useProductOrders, useUpdateOrderStatus } from "@/hooks/useProductOrders";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatQAR } from "@/lib/locale";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { toast } from "sonner";

const SellerOrders = () => {
  const navigate = useNavigate();
  const { isRTL, language } = useLanguage();
  const { data: orders = [], isLoading } = useProductOrders();
  const updateOrderStatus = useUpdateOrderStatus();
  const dateLocale = language === "ar" ? arLocale : enUS;
  const [filter, setFilter] = useState("all");

  const filteredOrders = filter === "all" ? orders : orders.filter(o => o.status === filter);

  const getStatusBadge = (status: string) => {
    const config: Record<string, { label: string; labelAr: string; variant: "default" | "secondary" | "outline" | "destructive" }> = {
      pending: { label: "Pending", labelAr: "قيد الانتظار", variant: "secondary" },
      processing: { label: "Processing", labelAr: "قيد التجهيز", variant: "default" },
      shipped: { label: "Shipped", labelAr: "تم الشحن", variant: "outline" },
      delivered: { label: "Delivered", labelAr: "تم التسليم", variant: "default" },
      cancelled: { label: "Cancelled", labelAr: "ملغي", variant: "destructive" },
    };
    const c = config[status] || config.pending;
    return <Badge variant={c.variant}>{isRTL ? c.labelAr : c.label}</Badge>;
  };

  const handleUpdateStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateOrderStatus.mutateAsync({ orderId, status: newStatus });
      toast.success(isRTL ? "تم تحديث حالة الطلب" : "Order status updated");
    } catch {
      toast.error(isRTL ? "فشل في تحديث الحالة" : "Failed to update status");
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="p-4 space-y-3">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 rounded-2xl" />)}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ChevronLeft className={`h-5 w-5 ${isRTL ? "rotate-180" : ""}`} />
          </Button>
          <div>
            <h1 className="text-xl font-bold text-foreground">
              {isRTL ? "إدارة الطلبات" : "Order Management"}
            </h1>
            <p className="text-sm text-muted-foreground">
              {filteredOrders.length} {isRTL ? "طلب" : "orders"}
            </p>
          </div>
        </div>
      </header>

      <div className="px-4 py-3">
        <Select value={filter} onValueChange={setFilter}>
          <SelectTrigger className="w-full mb-4">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{isRTL ? "الكل" : "All"}</SelectItem>
            <SelectItem value="pending">{isRTL ? "قيد الانتظار" : "Pending"}</SelectItem>
            <SelectItem value="processing">{isRTL ? "قيد التجهيز" : "Processing"}</SelectItem>
            <SelectItem value="shipped">{isRTL ? "تم الشحن" : "Shipped"}</SelectItem>
            <SelectItem value="delivered">{isRTL ? "تم التسليم" : "Delivered"}</SelectItem>
            <SelectItem value="cancelled">{isRTL ? "ملغي" : "Cancelled"}</SelectItem>
          </SelectContent>
        </Select>

        {filteredOrders.length === 0 ? (
          <div className="text-center py-16">
            <ClipboardList className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-foreground mb-1">
              {isRTL ? "لا توجد طلبات" : "No Orders"}
            </p>
            <p className="text-muted-foreground">
              {isRTL ? "لم يتم استلام أي طلبات بعد" : "No orders received yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredOrders.map((order) => (
              <Card key={order.id} className="p-4">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="font-semibold text-foreground">#{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {order.created_at && format(new Date(order.created_at), "dd MMM yyyy, HH:mm", { locale: dateLocale })}
                    </p>
                  </div>
                  {getStatusBadge(order.status || "pending")}
                </div>

                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm text-muted-foreground">
                    {order.items?.length || 0} {isRTL ? "منتج" : "items"}
                  </p>
                  <p className="font-bold text-foreground">{formatQAR(order.total_qar)}</p>
                </div>

                {order.status !== "delivered" && order.status !== "cancelled" && (
                  <div className="flex gap-2">
                    {order.status === "pending" && (
                      <Button size="sm" className="flex-1" onClick={() => handleUpdateStatus(order.id, "processing")}>
                        <Package className="w-4 h-4 me-1" />
                        {isRTL ? "بدء التجهيز" : "Start Processing"}
                      </Button>
                    )}
                    {order.status === "processing" && (
                      <Button size="sm" className="flex-1" onClick={() => handleUpdateStatus(order.id, "shipped")}>
                        <Truck className="w-4 h-4 me-1" />
                        {isRTL ? "تم الشحن" : "Mark Shipped"}
                      </Button>
                    )}
                    {order.status === "shipped" && (
                      <Button size="sm" className="flex-1" onClick={() => handleUpdateStatus(order.id, "delivered")}>
                        <CheckCircle className="w-4 h-4 me-1" />
                        {isRTL ? "تم التسليم" : "Mark Delivered"}
                      </Button>
                    )}
                    <Button size="sm" variant="outline" onClick={() => handleUpdateStatus(order.id, "cancelled")}>
                      <XCircle className="w-4 h-4 me-1" />
                      {isRTL ? "إلغاء" : "Cancel"}
                    </Button>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellerOrders;
