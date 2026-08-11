import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Package, Check, ArrowLeft, Loader2, Navigation, Wallet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useCreateOrder } from "@/hooks/useProductOrders";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useSadadPayment } from "@/hooks/useSadadPayment";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatQAR } from "@/lib/locale";
import type { ShippingAddress } from "@/types/product";

// Qatar cities list (EN value is stored; AR label is display-only)
const qatarCities = [
  { en: "Doha", ar: "الدوحة" },
  { en: "Al Wakrah", ar: "الوكرة" },
  { en: "Al Khor", ar: "الخور" },
  { en: "Al Rayyan", ar: "الريان" },
  { en: "Umm Salal", ar: "أم صلال" },
  { en: "Al Daayen", ar: "الضعاين" },
  { en: "Al Shamal", ar: "الشمال" },
  { en: "Al Shahaniya", ar: "الشحانية" },
  { en: "Lusail", ar: "لوسيل" },
  { en: "Mesaieed", ar: "مسيعيد" },
  { en: "Dukhan", ar: "دخان" },
];

// Qatar mobile: 8 digits, optionally prefixed with +974 / 00974 / 974
const QATAR_PHONE_RE = /^(?:\+?974|00974)?\s?\d{8}$/;

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { cartItems, isLoading, clearCart } = useUnifiedCart();
  const createOrder = useCreateOrder();
  const { t, language, isRTL } = useLanguage();
  const ct = t.checkout;
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  // Sadad payment integration
  const { paymentState, initiatePayment, resetPayment } = useSadadPayment({
    onSuccess: (paymentId, sadadOrderId) => {
      // Cart will be cleared after successful payment callback
      console.log('Payment initiated successfully:', { paymentId, sadadOrderId });
    },
    onError: (error) => {
      console.error('Payment failed:', error);
      setIsProcessing(false);
    },
  });

  const [isLocating, setIsLocating] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'sadad' | 'cash'>('sadad');

  // Load saved address from user metadata or use profile info
  const getInitialAddress = (): ShippingAddress => {
    const savedAddress = user?.user_metadata?.shipping_address as ShippingAddress | undefined;
    if (savedAddress) {
      return savedAddress;
    }
    return {
      full_name: profile?.full_name || user?.user_metadata?.full_name || "",
      phone: profile?.phone || user?.user_metadata?.phone || "",
      address_line1: "",
      address_line2: "",
      city: "",
      state: "",
      postal_code: "",
      country: "Qatar",
    };
  };

  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>(getInitialAddress);
  const [isProcessing, setIsProcessing] = useState(false);

  // Update shipping address when profile data loads
  useEffect(() => {
    if (profile) {
      setShippingAddress(prev => ({
        ...prev,
        full_name: prev.full_name || profile.full_name || "",
        phone: prev.phone || profile.phone || "",
      }));
    }
  }, [profile]);

  const handleAddressChange = (field: keyof ShippingAddress, value: string) => {
    setShippingAddress({ ...shippingAddress, [field]: value });
    // Clear the field's error as soon as the user types
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  // Auto-detect location using Geolocation API
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error(ct.geoUnsupported);
      return;
    }

    setIsLocating(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;

        try {
          // Use Nominatim (OpenStreetMap) for reverse geocoding - free and no API key needed
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&addressdetails=1`,
            {
              headers: {
                "Accept-Language": "en",
              },
            }
          );

          if (!response.ok) {
            throw new Error("Failed to fetch address");
          }

          const data = await response.json();
          const address = data.address;

          // Find the closest matching Qatar city
          const detectedCity = address.city || address.town || address.village || address.suburb || "";
          const matchedCity = qatarCities.find(
            (city) => detectedCity.toLowerCase().includes(city.en.toLowerCase()) ||
                      city.en.toLowerCase().includes(detectedCity.toLowerCase())
          )?.en || detectedCity;

          // Build address line from components
          const addressParts = [
            address.road,
            address.house_number,
            address.building,
            address.neighbourhood,
          ].filter(Boolean);

          setShippingAddress((prev) => ({
            ...prev,
            address_line1: addressParts.join(", ") || prev.address_line1,
            address_line2: address.suburb || address.neighbourhood || prev.address_line2,
            city: matchedCity || prev.city,
            postal_code: address.postcode || prev.postal_code,
          }));

          toast.success(ct.locationDetected);
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error(ct.locationFailed);
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error(ct.locationDenied);
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error(ct.locationUnavailable);
            break;
          case error.TIMEOUT:
            toast.error(ct.locationTimeout);
            break;
          default:
            toast.error(ct.locationError);
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, [ct]);

  const hasPhysicalProducts = cartItems.some((item) => item.product.product_type === "physical");
  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price_qar,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error(ct.cartEmpty);
      return;
    }

    // Validate shipping address for physical products — with inline field errors
    if (hasPhysicalProducts) {
      const errors: Record<string, string> = {};
      if (!shippingAddress.full_name.trim()) errors.full_name = ct.fillRequired;
      if (!shippingAddress.phone.trim()) {
        errors.phone = ct.fillRequired;
      } else if (!QATAR_PHONE_RE.test(shippingAddress.phone.trim())) {
        errors.phone = ct.invalidPhone;
      }
      if (!shippingAddress.address_line1.trim()) errors.address_line1 = ct.fillRequired;
      if (!shippingAddress.city.trim()) errors.city = ct.fillRequired;

      setFieldErrors(errors);
      if (Object.keys(errors).length > 0) {
        toast.error(ct.fillRequired);
        return;
      }
    }

    setIsProcessing(true);

    try {
      const orderItems = cartItems.map((item) => ({
        product_id: item.product.id,
        product_title: item.product.title,
        product_image: item.product.images?.[0] || "",
        quantity: item.quantity,
        price: item.product.price_qar,
      }));

      // Create order first
      const order = await createOrder.mutateAsync({
        items: orderItems,
        total_qar: total,
        shipping_address: hasPhysicalProducts ? shippingAddress : null,
      });

      // Save shipping address to user metadata for future orders
      if (hasPhysicalProducts && shippingAddress) {
        await supabase.auth.updateUser({
          data: { shipping_address: shippingAddress },
        });
      }

      // Initiate payment based on selected method
      if (selectedPaymentMethod === 'sadad') {
        // Initiate Sadad payment
        try {
          const returnUrl = `${window.location.origin}/payment-result`;

          await initiatePayment({
            orderId: order.id,
            amount: total,
            customerEmail: user?.email,
            customerPhone: shippingAddress.phone || profile?.phone || user?.user_metadata?.phone,
            customerName: shippingAddress.full_name || profile?.full_name || user?.user_metadata?.full_name,
            returnUrl: returnUrl,
          });

          // Payment initiated, user will be redirected to Sadad
          // Don't clear cart yet - wait for payment callback
        } catch (error: any) {
          console.error('Sadad payment initiation failed:', error);
          toast.error(error.message || ct.paymentInitFailed);
          setIsProcessing(false);
        }
      } else {
        // Cash payment - clear cart and navigate to confirmation
        clearCart.mutate();
        navigate(`/order-confirmation?orderId=${order.id}&paymentMethod=cash`);
      }
    } catch (error: any) {
      toast.error(error.message || ct.orderFailed);
      setIsProcessing(false);
    }
  };

  // Redirect to auth if not logged in (wait for auth to finish loading)
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/auth", { state: { from: "/checkout" } });
    }
  }, [authLoading, user, navigate]);

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background pb-32">
        <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
          <Skeleton className="h-6 w-24 mb-4" />
          <Skeleton className="h-8 w-40" />
        </div>
        <div className="px-5 py-6 space-y-4">
          <Skeleton className="h-40 w-full rounded-2xl" />
          <Skeleton className="h-56 w-full rounded-2xl" />
          <Skeleton className="h-20 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-32" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="safe-area-top bg-gradient-to-br from-primary/10 via-background to-background pt-4 pb-6 px-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className={`w-5 h-5 ${isRTL ? "rotate-180" : ""}`} />
          {ct.back}
        </button>
        <h1 className="text-2xl font-bold text-foreground">{ct.title}</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{ct.orderSummary}</h2>
          </div>

          {isLoading ? (
            <div className="space-y-3">
              {[1, 2].map((i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {cartItems.map((item) => (
                <div key={item.id} className="flex gap-3">
                  <div className="w-16 h-16 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                    {item.product.images?.[0] ? (
                      <img
                        src={item.product.images[0]}
                        alt={item.product.title}
                        loading="lazy"
                        decoding="async"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-6 h-6 text-muted-foreground/30" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-foreground text-sm line-clamp-1">{item.product.title}</h3>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {ct.qty}: {item.quantity} × {formatQAR(item.product.price_qar, language)}
                    </p>
                  </div>
                  <p className="font-medium text-foreground text-sm">
                    {formatQAR(item.quantity * item.product.price_qar, language)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border/50 mt-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">{ct.total}</span>
              <span className="text-xl font-bold text-primary">{formatQAR(total, language)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address (only for physical products) */}
        {hasPhysicalProducts && (
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">{ct.shippingAddress}</h2>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={detectLocation}
                disabled={isLocating}
                className="gap-2 rounded-xl"
              >
                {isLocating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    {ct.detecting}
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    {ct.autoDetect}
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName">{ct.fullName} *</Label>
                  <Input
                    id="fullName"
                    value={shippingAddress.full_name}
                    onChange={(e) => handleAddressChange("full_name", e.target.value)}
                    aria-invalid={!!fieldErrors.full_name}
                    className="rounded-xl"
                  />
                  {fieldErrors.full_name && (
                    <p className="text-xs text-destructive">{fieldErrors.full_name}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">{ct.phone} *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    dir="ltr"
                    placeholder="+974 XXXX XXXX"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange("phone", e.target.value)}
                    aria-invalid={!!fieldErrors.phone}
                    className={`rounded-xl ${isRTL ? "text-right" : ""}`}
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-destructive">{fieldErrors.phone}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">{ct.addressLine1} *</Label>
                <Input
                  id="address1"
                  value={shippingAddress.address_line1}
                  onChange={(e) => handleAddressChange("address_line1", e.target.value)}
                  aria-invalid={!!fieldErrors.address_line1}
                  className="rounded-xl"
                />
                {fieldErrors.address_line1 && (
                  <p className="text-xs text-destructive">{fieldErrors.address_line1}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">{ct.addressLine2}</Label>
                <Input
                  id="address2"
                  value={shippingAddress.address_line2}
                  onChange={(e) => handleAddressChange("address_line2", e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">{ct.city} *</Label>
                  <Input
                    id="city"
                    list="qatar-cities"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                    aria-invalid={!!fieldErrors.city}
                    className="rounded-xl"
                  />
                  <datalist id="qatar-cities">
                    {qatarCities.map((city) => (
                      <option key={city.en} value={city.en}>
                        {language === "ar" ? city.ar : city.en}
                      </option>
                    ))}
                  </datalist>
                  {fieldErrors.city && (
                    <p className="text-xs text-destructive">{fieldErrors.city}</p>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">{ct.postalCode}</Label>
                  <Input
                    id="postalCode"
                    dir="ltr"
                    value={shippingAddress.postal_code}
                    onChange={(e) => handleAddressChange("postal_code", e.target.value)}
                    className="rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Payment Method */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <CreditCard className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">{ct.paymentMethod}</h2>
          </div>

          <div className="space-y-3">
            {/* Sadad Payment Option */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('sadad')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPaymentMethod === 'sadad'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-start">
                  <p className="font-medium text-foreground text-sm">{ct.payWithSadad}</p>
                  <p className="text-xs text-muted-foreground">{ct.secureOnlinePayment}</p>
                </div>
                {selectedPaymentMethod === 'sadad' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            </button>

            {/* Cash Payment Option */}
            <button
              type="button"
              onClick={() => setSelectedPaymentMethod('cash')}
              className={`w-full p-4 rounded-xl border-2 transition-all ${
                selectedPaymentMethod === 'cash'
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-border/80'
              }`}
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Wallet className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1 text-start">
                  <p className="font-medium text-foreground text-sm">{ct.cashOnDelivery}</p>
                  <p className="text-xs text-muted-foreground">{ct.payWhenYouReceive}</p>
                </div>
                {selectedPaymentMethod === 'cash' && (
                  <Check className="w-5 h-5 text-primary" />
                )}
              </div>
            </button>
          </div>

          {selectedPaymentMethod === 'sadad' && (
            <div className="mt-3 p-3 bg-muted/30 rounded-lg">
              <p className="text-xs text-muted-foreground">
                {ct.sadadRedirectNote}
              </p>
            </div>
          )}
        </div>

        {/* Place Order Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 rounded-xl font-semibold text-base"
          disabled={isProcessing || paymentState.isProcessing || cartItems.length === 0}
        >
          {(isProcessing || paymentState.isProcessing)
            ? ct.processing
            : selectedPaymentMethod === 'sadad'
            ? `${ct.payWithSadad} • ${formatQAR(total, language)}`
            : `${ct.placeOrder} • ${formatQAR(total, language)}`
          }
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          {ct.termsNote}
        </p>
      </form>
    </div>
  );
};

export default Checkout;
