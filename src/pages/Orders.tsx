import { Package, CheckCircle, Clock, Truck, XCircle, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useCustomerOrders } from "@/hooks/useProductOrders";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import type { OrderStatus } from "@/types/product";
import BackButton from "@/components/BackButton";
import BottomNavigation from "@/components/BottomNavigation";

const STATUS_CONFIG: Record<OrderStatus, { label: string; icon: any; color: string; bgColor: string }> = {
  pending: { label: "Pending", icon: Clock, color: "text-yellow-600", bgColor: "bg-yellow-500/10" },
  processing: { label: "Processing", icon: Package, color: "text-blue-600", bgColor: "bg-blue-500/10" },
  shipped: { label: "Shipped", icon: Truck, color: "text-purple-600", bgColor: "bg-purple-500/10" },
  delivered: { label: "Delivered", icon: CheckCircle, color: "text-green-600", bgColor: "bg-green-500/10" },
  cancelled: { label: "Cancelled", icon: XCircle, color: "text-destructive", bgColor: "bg-destructive/10" },
};

const Orders = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: orders = [], isLoading } = useCustomerOrders();

  if (!user) {
    return (
      <div className="min-h-screen bg-background pb-24">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
          <BackButton />
          <h1 className="text-2xl font-bold text-foreground mt-4">My Orders</h1>
        </div>
        <div className="flex flex-col items-center justify-center px-5 py-16">
          <Package className="w-16 h-16 text-muted-foreground mb-4" />
          <h2 className="text-lg font-semibold mb-2">{t.profile?.signInToView || "Sign in to view"}</h2>
          <p className="text-muted-foreground text-center mb-4">{t.profile?.signInDesc || "Sign in to view your orders"}</p>
          <Button onClick={() => navigate("/auth")}>{t.auth?.login || "Sign In"}</Button>
        </div>
        <BottomNavigation />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
        <BackButton />
        <h1 className="text-2xl font-bold text-foreground mt-4">My Orders</h1>
        <p className="text-sm text-muted-foreground mt-1">
          {orders.length} {orders.length === 1 ? "order" : "orders"}
        </p>
      </div>

      {/* Orders List */}
      <div className="px-5 py-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl border border-border/50 p-4">
                <Skeleton className="h-20 w-full" />
              </div>
            ))}
          </div>
        ) : orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map((order, index) => {
              const status = STATUS_CONFIG[order.status];
              const StatusIcon = status.icon;

              return (
                <div
                  key={order.id}
                  className="bg-card rounded-2xl border border-border/50 p-4 animate-fade-in"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  {/* Order Header */}
                  <div className="flex items-center justify-between mb-4 pb-4 border-b border-border/50">
                    <div>
                      <p className="text-xs text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {format(new Date(order.created_at), "MMM d, yyyy")}
                      </p>
                    </div>
                    <Badge className={`${status.bgColor} ${status.color} border-0`}>
                      <StatusIcon className="w-3 h-3 mr-1" />
                      {status.label}
                    </Badge>
                  </div>

                  {/* Order Items */}
                  <div className="space-y-3 mb-4">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex gap-3">
                        <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                          {item.product_image ? (
                            <img
                              src={item.product_image}
                              alt={item.product_title}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Package className="w-6 h-6 text-muted-foreground/30" />
                            </div>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="font-medium text-foreground text-sm line-clamp-1">{item.product_title}</h3>
                          <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                        </div>
                        <p className="font-medium text-foreground text-sm">QAR {item.price}</p>
                      </div>
                    ))}
                  </div>

                  {/* Order Footer */}
                  <div className="flex items-center justify-between pt-4 border-t border-border/50">
                    <div>
                      <p className="text-sm text-muted-foreground">Total</p>
                      <p className="font-bold text-foreground">QAR {order.total_qar.toFixed(2)}</p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="rounded-xl"
                      onClick={() => navigate(`/orders/${order.id}`)}
                    >
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>

                  {/* Tracking Info */}
                  {order.status === "shipped" && order.tracking_number && (
                    <div className="mt-4 p-3 bg-muted/50 rounded-xl">
                      <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                      <p className="font-mono text-sm font-medium text-foreground">{order.tracking_number}</p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-10 h-10 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">No orders yet</h3>
            <p className="text-muted-foreground mb-6">When you place an order, it will appear here</p>
            <Button onClick={() => navigate("/home")} className="rounded-xl">
              Start Shopping
            </Button>
          </div>
        )}
      </div>
      <BottomNavigation />
    </div>
  );
};

export default Orders;
