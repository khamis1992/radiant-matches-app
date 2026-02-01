import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { MapPin, CreditCard, Package, Check, ArrowLeft, Loader2, Navigation } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { useUnifiedCart } from "@/hooks/useUnifiedCart";
import { useCreateOrder } from "@/hooks/useProductOrders";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { ShippingAddress } from "@/types/product";

// Qatar cities list
const qatarCities = [
  "Doha", "Al Wakrah", "Al Khor", "Al Rayyan", "Umm Salal", 
  "Al Daayen", "Al Shamal", "Al Shahaniya", "Lusail", "Mesaieed", "Dukhan"
];

const Checkout = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { data: profile } = useProfile();
  const { cartItems, isLoading, clearCart } = useUnifiedCart();
  const createOrder = useCreateOrder();
  const [isLocating, setIsLocating] = useState(false);

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
  };

  // Auto-detect location using Geolocation API
  const detectLocation = useCallback(async () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
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
            (city) => detectedCity.toLowerCase().includes(city.toLowerCase()) ||
                      city.toLowerCase().includes(detectedCity.toLowerCase())
          ) || detectedCity;

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

          toast.success("Location detected successfully!");
        } catch (error) {
          console.error("Reverse geocoding error:", error);
          toast.error("Could not get address details. Please enter manually.");
        } finally {
          setIsLocating(false);
        }
      },
      (error) => {
        setIsLocating(false);
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Location access denied. Please enable location permissions.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Location information unavailable.");
            break;
          case error.TIMEOUT:
            toast.error("Location request timed out. Please try again.");
            break;
          default:
            toast.error("An error occurred while getting location.");
        }
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 60000,
      }
    );
  }, []);

  const hasPhysicalProducts = cartItems.some((item) => item.product.product_type === "physical");
  const total = cartItems.reduce(
    (sum, item) => sum + item.quantity * item.product.price_qar,
    0
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cartItems.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    // Validate shipping address for physical products
    if (hasPhysicalProducts) {
      if (!shippingAddress.full_name || !shippingAddress.phone || !shippingAddress.address_line1 || !shippingAddress.city) {
        toast.error("Please fill in all required shipping fields");
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

      // Clear the cart after successful order
      clearCart.mutate();

      // Navigate to order confirmation page
      navigate(`/order-confirmation?orderId=${order.id}`);
    } catch (error: any) {
      toast.error(error.message || "Failed to place order");
    } finally {
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
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="bg-gradient-to-br from-primary/10 via-background to-background pt-8 pb-6 px-5">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground mb-4 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          Back
        </button>
        <h1 className="text-2xl font-bold text-foreground">Checkout</h1>
      </div>

      <form onSubmit={handleSubmit} className="px-5 py-6 space-y-6">
        {/* Order Summary */}
        <div className="bg-card rounded-2xl border border-border/50 p-4">
          <div className="flex items-center gap-2 mb-4">
            <Package className="w-5 h-5 text-primary" />
            <h2 className="font-semibold text-foreground">Order Summary</h2>
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
                      Qty: {item.quantity} × QAR {item.product.price_qar}
                    </p>
                  </div>
                  <p className="font-medium text-foreground text-sm">
                    QAR {(item.quantity * item.product.price_qar).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border/50 mt-4 pt-4">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-foreground">Total</span>
              <span className="text-xl font-bold text-primary">QAR {total.toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Shipping Address (only for physical products) */}
        {hasPhysicalProducts && (
          <div className="bg-card rounded-2xl border border-border/50 p-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MapPin className="w-5 h-5 text-primary" />
                <h2 className="font-semibold text-foreground">Shipping Address</h2>
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
                    Detecting...
                  </>
                ) : (
                  <>
                    <Navigation className="w-4 h-4" />
                    Auto-detect
                  </>
                )}
              </Button>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="fullName">Full Name *</Label>
                  <Input
                    id="fullName"
                    value={shippingAddress.full_name}
                    onChange={(e) => handleAddressChange("full_name", e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone *</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={shippingAddress.phone}
                    onChange={(e) => handleAddressChange("phone", e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="address1">Address Line 1 *</Label>
                <Input
                  id="address1"
                  value={shippingAddress.address_line1}
                  onChange={(e) => handleAddressChange("address_line1", e.target.value)}
                  required
                  className="rounded-xl"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="address2">Address Line 2</Label>
                <Input
                  id="address2"
                  value={shippingAddress.address_line2}
                  onChange={(e) => handleAddressChange("address_line2", e.target.value)}
                  className="rounded-xl"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={shippingAddress.city}
                    onChange={(e) => handleAddressChange("city", e.target.value)}
                    required
                    className="rounded-xl"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="postalCode">Postal Code</Label>
                  <Input
                    id="postalCode"
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
            <h2 className="font-semibold text-foreground">Payment Method</h2>
          </div>

          <div className="p-4 bg-muted/50 rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <CreditCard className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <p className="font-medium text-foreground text-sm">Pay with Card</p>
                <p className="text-xs text-muted-foreground">Secure payment with Stripe</p>
              </div>
              <Check className="w-5 h-5 text-primary" />
            </div>
          </div>
        </div>

        {/* Place Order Button */}
        <Button
          type="submit"
          size="lg"
          className="w-full h-14 rounded-xl font-semibold text-base"
          disabled={isProcessing || cartItems.length === 0}
        >
          {isProcessing ? "Processing..." : `Place Order • QAR ${total.toFixed(2)}`}
        </Button>

        <p className="text-xs text-center text-muted-foreground">
          By placing this order, you agree to our Terms of Service
        </p>
      </form>
    </div>
  );
};

export default Checkout;
