import { useNavigate } from "react-router-dom";
import BottomNavigation from "@/components/BottomNavigation";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TrendingUp, ClipboardList, Clock, CheckCircle, Package, ShoppingBag } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { useArtistProducts } from "@/hooks/useArtistProducts";
import { useProductOrders, useOrderStats } from "@/hooks/useProductOrders";
import { useLanguage } from "@/contexts/LanguageContext";
import { formatQAR } from "@/lib/locale";
import { useCurrentArtist } from "@/hooks/useArtistDashboard";
import { format } from "date-fns";
import { ar as arLocale, enUS } from "date-fns/locale";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const SellerDashboard = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: artist, isLoading: artistLoading } = useCurrentArtist();
  const { data: products = [], isLoading: productsLoading } = useArtistProducts();
  const { data: orders = [] } = useProductOrders();
  const orderStats = useOrderStats();
  const { isRTL, language } = useLanguage();
  const dateLocale = language === "ar" ? arLocale : enUS;

  if (authLoading || artistLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
          <Skeleton className="h-6 w-40" />
        </header>
        <div className="px-5 py-6 space-y-4">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
        <BottomNavigation />
      </div>
    );
  }

  const recentOrders = orders.slice(0, 5);

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border/50 px-5 py-4">
        <h1 className="text-xl font-bold text-foreground">
          {isRTL ? "لوحة تحكم المتجر" : "Store Dashboard"}
        </h1>
        <p className="text-sm text-muted-foreground">
          {isRTL ? "مرحباً بك في متجرك" : "Welcome to your store"}
        </p>
      </header>

      <div className="px-4 py-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-2 gap-3">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <TrendingUp className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "الإيرادات" : "Revenue"}</p>
                <p className="font-bold text-lg text-foreground">{formatQAR(orderStats.totalRevenue)}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-secondary/50">
                <Package className="w-5 h-5 text-secondary-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "المنتجات" : "Products"}</p>
                <p className="font-bold text-lg text-foreground">{products.length}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-accent">
                <Clock className="w-5 h-5 text-accent-foreground" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "قيد الانتظار" : "Pending"}</p>
                <p className="font-bold text-lg text-foreground">{orderStats.pendingOrders}</p>
              </div>
            </div>
          </Card>
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-primary/10">
                <CheckCircle className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">{isRTL ? "تم التسليم" : "Delivered"}</p>
                <p className="font-bold text-lg text-foreground">{orderStats.deliveredOrders}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 gap-3">
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/seller-products")}
          >
            <ShoppingBag className="w-6 h-6 text-primary" />
            <span className="text-sm">{isRTL ? "إدارة المنتجات" : "Manage Products"}</span>
          </Button>
          <Button
            variant="outline"
            className="h-auto py-4 flex flex-col items-center gap-2"
            onClick={() => navigate("/seller-orders")}
          >
            <ClipboardList className="w-6 h-6 text-primary" />
            <span className="text-sm">{isRTL ? "عرض الطلبات" : "View Orders"}</span>
          </Button>
        </div>

        {/* Recent Orders */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-semibold text-foreground">
              {isRTL ? "آخر الطلبات" : "Recent Orders"}
            </h2>
            {orders.length > 5 && (
              <Button variant="ghost" size="sm" onClick={() => navigate("/seller-orders")}>
                {isRTL ? "عرض الكل" : "View All"}
              </Button>
            )}
          </div>
          {recentOrders.length === 0 ? (
            <Card className="p-8 text-center">
              <ClipboardList className="w-12 h-12 mx-auto text-muted-foreground mb-3" />
              <p className="text-muted-foreground">
                {isRTL ? "لا توجد طلبات بعد" : "No orders yet"}
              </p>
            </Card>
          ) : (
            <div className="space-y-2">
              {recentOrders.map((order) => (
                <Card key={order.id} className="p-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-sm text-foreground">
                        #{order.id.slice(0, 8)}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {order.created_at && format(new Date(order.created_at), "dd MMM yyyy", { locale: dateLocale })}
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="font-semibold text-sm text-foreground">{formatQAR(order.total_qar)}</p>
                      <Badge variant={order.status === "delivered" ? "default" : "secondary"} className="text-xs">
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default SellerDashboard;
