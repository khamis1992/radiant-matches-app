import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Check, Package, MapPin, Calendar, Clock, ChevronRight, Home, ShoppingBag, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useOrderDetails } from "@/hooks/useOrderDetails";
import { useLanguage } from "@/contexts/LanguageContext";
import { format } from "date-fns";
import { ar, enUS } from "date-fns/locale";
import confetti from "@/lib/confetti";

const OrderConfirmation = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("orderId");
  const { t, language, isRTL } = useLanguage();
  const dateLocale = language === "ar" ? ar : enUS;
  const { data: order, isLoading } = useOrderDetails(orderId || "");
  const [showContent, setShowContent] = useState(false);

  // SEO: title, description, canonical
  useEffect(() => {
    const title = language === "ar" ? "تأكيد الطلب" : "Order Confirmation";
    document.title = `${title} | Glam`;

    const description =
      language === "ar"
        ? "صفحة تأكيد الطلب تعرض ملخص الطلب وتفاصيل الشحن وتتبع الحالة."
        : "Order confirmation page with order summary, shipping details, and tracking link.";

    const meta =
      document.querySelector('meta[name="description"]') ||
      (() => {
        const m = document.createElement("meta");
        m.setAttribute("name", "description");
        document.head.appendChild(m);
        return m;
      })();
    meta.setAttribute("content", description);

    const canonicalHref = `${window.location.origin}/order-confirmation`;
    const canonical =
      document.querySelector('link[rel="canonical"]') ||
      (() => {
        const l = document.createElement("link");
        l.setAttribute("rel", "canonical");
        document.head.appendChild(l);
        return l;
      })();
    canonical.setAttribute("href", canonicalHref);
  }, [language]);

  // Trigger confetti and animations on mount
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowContent(true);
      confetti();
    }, 300);
    return () => clearTimeout(timer);
  }, []);

  if (!orderId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-5">
        <div className="text-center">
          <Package className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-foreground mb-2">
            {language === "ar" ? "لا يوجد طلب" : "No Order Found"}
          </h2>
          <p className="text-muted-foreground mb-6">
            {language === "ar" ? "لم يتم العثور على تفاصيل الطلب" : "Order details not found"}
          </p>
          <Button onClick={() => navigate("/home")} className="rounded-xl">
            {language === "ar" ? "العودة للرئيسية" : "Go Home"}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 via-background to-accent/10 relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-primary/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-accent/20 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
      
      <div className="relative z-10 px-5 py-8 max-w-lg mx-auto">
        {/* Success Animation */}
        <div className={`text-center mb-8 transition-all duration-700 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="relative inline-block mb-6">
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-2xl shadow-primary/30 animate-scale-in">
              <Check className="w-12 h-12 text-primary-foreground" strokeWidth={3} />
            </div>
            <div className="absolute -top-2 -right-2">
              <Sparkles className="w-8 h-8 text-primary animate-pulse" />
            </div>
            <div className="absolute inset-0 w-24 h-24 rounded-full bg-primary/20 animate-ping" />
          </div>

          <h1 className="text-3xl font-bold text-foreground mb-3">
            {language === "ar" ? "تم تأكيد طلبك!" : "Order Confirmed!"}
          </h1>
          <p className="text-muted-foreground text-lg">
            {language === "ar" 
              ? "شكراً لك! سنقوم بتجهيز طلبك قريباً" 
              : "Thank you! We'll prepare your order soon"}
          </p>
        </div>

        {/* Order Details Card */}
        <div className={`bg-card rounded-3xl border border-border/50 shadow-xl overflow-hidden transition-all duration-700 delay-200 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          {/* Order Number Header */}
          <div className="bg-gradient-to-r from-primary/10 to-accent/10 px-6 py-4 border-b border-border/50">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wide">
                  {language === "ar" ? "رقم الطلب" : "Order Number"}
                </p>
                <p className="font-mono font-bold text-foreground text-lg">
                  #{orderId?.slice(0, 8).toUpperCase()}
                </p>
              </div>
              <div className="px-3 py-1.5 bg-primary/10 text-primary rounded-full text-sm font-medium flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                {language === "ar" ? "قيد المعالجة" : "Processing"}
              </div>
            </div>
          </div>

          {/* Order Items */}
          {order && (
            <div className="p-6 space-y-4">
              {/* Items List */}
              <div className="space-y-3">
                <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  {language === "ar" ? "المنتجات" : "Items"}
                </h3>
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex gap-3 items-center">
                    <div className="w-14 h-14 rounded-xl overflow-hidden bg-muted flex-shrink-0">
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
                      <h4 className="font-medium text-foreground text-sm line-clamp-1">{item.product_title}</h4>
                      <p className="text-xs text-muted-foreground">
                        {language === "ar" ? "الكمية" : "Qty"}: {item.quantity} × QAR {item.price}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Shipping Address */}
              {order.shipping_address && (
                <div className="pt-4 border-t border-border/50">
                  <h3 className="text-sm font-medium text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-2">
                    <MapPin className="w-4 h-4" />
                    {language === "ar" ? "عنوان التوصيل" : "Shipping Address"}
                  </h3>
                  <div className="bg-muted/50 rounded-xl p-3">
                    <p className="font-medium text-foreground text-sm">{order.shipping_address.full_name}</p>
                    <p className="text-sm text-muted-foreground">{order.shipping_address.address_line1}</p>
                    {order.shipping_address.address_line2 && (
                      <p className="text-sm text-muted-foreground">{order.shipping_address.address_line2}</p>
                    )}
                    <p className="text-sm text-muted-foreground">
                      {order.shipping_address.city}, {order.shipping_address.country}
                    </p>
                  </div>
                </div>
              )}

              {/* Order Date & Total */}
              <div className="pt-4 border-t border-border/50 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  {format(new Date(order.created_at), "PPP", { locale: dateLocale })}
                </div>
                <div className="text-end">
                  <p className="text-xs text-muted-foreground">{language === "ar" ? "الإجمالي" : "Total"}</p>
                  <p className="text-xl font-bold text-primary">QAR {order.total_qar.toFixed(2)}</p>
                </div>
              </div>
            </div>
          )}

          {isLoading && (
            <div className="p-6 space-y-4">
              <div className="animate-pulse space-y-3">
                <div className="h-14 bg-muted rounded-xl" />
                <div className="h-14 bg-muted rounded-xl" />
                <div className="h-20 bg-muted rounded-xl" />
              </div>
            </div>
          )}
        </div>

        {/* Action Buttons */}
        <div className={`mt-8 space-y-3 transition-all duration-700 delay-400 ${showContent ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <Button
            onClick={() => navigate(`/orders/${orderId}`)}
            className="w-full h-14 rounded-2xl text-base font-semibold gap-2"
          >
            <Package className="w-5 h-5" />
            {language === "ar" ? "تتبع طلبك" : "Track Your Order"}
            <ChevronRight className={`w-5 h-5 ${isRTL ? 'rotate-180' : ''}`} />
          </Button>

          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              onClick={() => navigate("/home")}
              className="h-12 rounded-xl font-medium gap-2"
            >
              <Home className="w-4 h-4" />
              {language === "ar" ? "الرئيسية" : "Home"}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate("/orders")}
              className="h-12 rounded-xl font-medium gap-2"
            >
              <ShoppingBag className="w-4 h-4" />
              {language === "ar" ? "طلباتي" : "My Orders"}
            </Button>
          </div>
        </div>

        {/* Estimated Delivery */}
        <div className={`mt-6 text-center transition-all duration-700 delay-500 ${showContent ? 'opacity-100' : 'opacity-0'}`}>
          <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent/20 rounded-full text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {language === "ar" 
              ? "التوصيل المتوقع: 2-5 أيام عمل" 
              : "Estimated delivery: 2-5 business days"}
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderConfirmation;
