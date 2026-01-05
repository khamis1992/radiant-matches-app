import { useParams, useNavigate } from "react-router-dom";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import { useUpdateOrderStatus } from "@/hooks/useProductOrders";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import {
  Package,
  CheckCircle,
  Clock,
  Truck,
  XCircle,
  MapPin,
  Phone,
  Mail,
  ArrowLeft,
  Download,
  MessageCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";
import type { OrderStatus } from "@/types/product";
import AppHeader from "@/components/layout/AppHeader";
import BottomNavigation from "@/components/BottomNavigation";

const STATUS_CONFIG: Record<
  OrderStatus,
  { label: string; icon: any; color: string; bgColor: string }
> = {
  pending: {
    label: "Pending",
    icon: Clock,
    color: "text-yellow-600",
    bgColor: "bg-yellow-500/10",
  },
  processing: {
    label: "Processing",
    icon: Package,
    color: "text-blue-600",
    bgColor: "bg-blue-500/10",
  },
  shipped: {
    label: "Shipped",
    icon: Truck,
    color: "text-purple-600",
    bgColor: "bg-purple-500/10",
  },
  delivered: {
    label: "Delivered",
    icon: CheckCircle,
    color: "text-green-600",
    bgColor: "bg-green-500/10",
  },
  cancelled: {
    label: "Cancelled",
    icon: XCircle,
    color: "text-destructive",
    bgColor: "bg-destructive/10",
  },
};

const STATUS_FLOW: OrderStatus[] = ["pending", "processing", "shipped", "delivered"];

const OrderDetails = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { data: order, isLoading } = useOrderDetails(id || "");
  const updateStatus = useUpdateOrderStatus();

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Sign In Required</h2>
          <p className="text-muted-foreground mb-6">Please sign in to view order details</p>
          <Button onClick={() => navigate("/auth")} className="rounded-xl">
            Sign In
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <AppHeader title="Order Details" showBack showLogo />
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-24 w-full" />
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Order not found</h2>
          <p className="text-muted-foreground mb-6">
            The order you're looking for doesn't exist or you don't have access to it.
          </p>
          <Button onClick={() => navigate("/orders")} className="rounded-xl">
            Back to Orders
          </Button>
        </div>
      </div>
    );
  }

  const status = STATUS_CONFIG[order.status];
  const StatusIcon = status.icon;
  const currentStatusIndex = STATUS_FLOW.indexOf(order.status);
  const isPhysicalProduct = order.items.some(
    (item) => !item.product_title.toLowerCase().includes("digital")
  );

  const handleCancelOrder = async () => {
    if (order.status !== "pending") return;

    if (confirm("Are you sure you want to cancel this order?")) {
      try {
        await updateStatus.mutateAsync({
          orderId: order.id,
          status: "cancelled",
        });
        toast.success("Order cancelled successfully");
      } catch (error) {
        toast.error("Failed to cancel order");
      }
    }
  };

  const handleContactArtist = () => {
    // Navigate to messages or create new chat with artist
    navigate("/messages");
  };

  const isCustomer = user?.id === order.customer_id;
  const canCancel = isCustomer && order.status === "pending";

  return (
    <div className="min-h-screen bg-background pb-32">
      <AppHeader title="Order Details" showBack showLogo />

      {/* Status Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground">Order #{order.id.slice(0, 8)}</p>
            <p className="text-xs text-muted-foreground mt-1">
              {format(new Date(order.created_at), "MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
          <Badge className={`${status.bgColor} ${status.color} border-0 px-3 py-1.5`}>
            <StatusIcon className="w-3.5 h-3.5 mr-1.5" />
            {status.label}
          </Badge>
        </div>

        {/* Status Timeline */}
        <div className="flex items-center justify-between mt-6">
          {STATUS_FLOW.filter((s) => s !== "cancelled").map((statusStep, index) => {
            const isCompleted = index <= currentStatusIndex;
            const isCurrent = statusStep === order.status && order.status !== ("cancelled" as OrderStatus);
            const StepIcon = STATUS_CONFIG[statusStep].icon;

            return (
              <div key={statusStep} className="flex-1 flex items-center">
                <div className="flex flex-col items-center flex-1">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 ${
                      isCompleted
                        ? "bg-primary text-primary-foreground"
                        : isCurrent
                        ? "bg-primary/20 text-primary ring-2 ring-primary/50"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    <StepIcon className="w-5 h-5" />
                  </div>
                  <p
                    className={`text-xs mt-2 font-medium ${
                      isCompleted || isCurrent ? "text-foreground" : "text-muted-foreground"
                    }`}
                  >
                    {STATUS_CONFIG[statusStep].label}
                  </p>
                </div>
                {index < STATUS_FLOW.length - 2 && (
                  <div
                    className={`flex-1 h-0.5 mx-2 transition-all duration-300 ${
                      index < currentStatusIndex ? "bg-primary" : "bg-muted"
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      <div className="px-5 py-6 space-y-6">
        {/* Order Items */}
        <Card className="p-4 border-border/50">
          <h3 className="font-semibold text-foreground mb-4">Order Items</h3>
          <div className="space-y-4">
            {order.items.map((item, index) => (
              <div key={index} className="flex gap-4">
                <div className="w-20 h-20 rounded-xl overflow-hidden bg-muted flex-shrink-0">
                  {item.product_image ? (
                    <img
                      src={item.product_image}
                      alt={item.product_title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-8 h-8 text-muted-foreground/30" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground line-clamp-2">{item.product_title}</h4>
                  <p className="text-sm text-muted-foreground mt-1">Quantity: {item.quantity}</p>
                  <p className="text-sm font-semibold text-foreground mt-1">
                    QAR {item.price.toFixed(2)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <Separator className="my-4" />

          {/* Price Breakdown */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-foreground">QAR {order.total_qar.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Shipping</span>
              <span className="text-foreground">Free</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-semibold">
              <span className="text-foreground">Total</span>
              <span className="text-foreground text-lg">QAR {order.total_qar.toFixed(2)}</span>
            </div>
          </div>
        </Card>

        {/* Shipping Address (for physical products) */}
        {isPhysicalProduct && order.shipping_address && (
          <Card className="p-4 border-border/50">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Shipping Address</h3>
                <p className="text-sm text-foreground">{order.shipping_address.full_name}</p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.phone}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {order.shipping_address.address_line1}
                  {order.shipping_address.address_line2 &&
                    `, ${order.shipping_address.address_line2}`}
                </p>
                <p className="text-sm text-muted-foreground">
                  {order.shipping_address.city}, {order.shipping_address.postal_code}
                </p>
                <p className="text-sm text-muted-foreground">{order.shipping_address.country}</p>
              </div>
            </div>
          </Card>
        )}

        {/* Tracking Information */}
        {order.status === "shipped" && order.tracking_number && (
          <Card className="p-4 border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Truck className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-foreground mb-2">Tracking Information</h3>
                <p className="text-sm text-muted-foreground mb-2">Your order is on its way!</p>
                <div className="bg-background rounded-lg p-3 border border-border/50">
                  <p className="text-xs text-muted-foreground mb-1">Tracking Number</p>
                  <p className="font-mono text-sm font-semibold text-foreground">
                    {order.tracking_number}
                  </p>
                </div>
              </div>
            </div>
          </Card>
        )}

        {/* Digital Product Download */}
        {order.status === "delivered" &&
          order.items.some((item) => item.product_title.toLowerCase().includes("digital")) && (
            <Card className="p-4 border-border/50 bg-gradient-to-br from-primary/5 to-transparent">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <Download className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-foreground mb-2">Digital Products</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Your digital products are ready for download
                  </p>
                  <Button className="rounded-xl" size="sm">
                    <Download className="w-4 h-4 mr-2" />
                    Download Files
                  </Button>
                </div>
              </div>
            </Card>
          )}

        {/* Actions */}
        <div className="flex gap-3">
          {canCancel && (
            <Button
              variant="outline"
              className="flex-1 rounded-xl border-destructive/50 text-destructive hover:bg-destructive/10"
              onClick={handleCancelOrder}
              disabled={updateStatus.isPending}
            >
              Cancel Order
            </Button>
          )}
          <Button className="flex-1 rounded-xl" onClick={handleContactArtist}>
            <MessageCircle className="w-4 h-4 mr-2" />
            Contact Artist
          </Button>
        </div>

        {/* Help & Support */}
        <div className="text-center">
          <Button
            variant="ghost"
            className="text-muted-foreground hover:text-foreground rounded-xl"
            onClick={() => navigate("/help")}
          >
            <Package className="w-4 h-4 mr-2" />
            Need help with this order?
          </Button>
        </div>
      </div>
      <BottomNavigation />
    </div>
  );
};

export default OrderDetails;
