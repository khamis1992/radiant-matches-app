import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Home, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";

const ProductPaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const orderId = searchParams.get("order_id") || searchParams.get("ORDER_ID") || searchParams.get("ORDERID");
  const status = searchParams.get("status") || searchParams.get("RESPCODE");
  const transactionNumber = searchParams.get("transaction_number") || searchParams.get("transactionNumber") || searchParams.get("TRANSACTIONNUMBER");
  const respMsg = searchParams.get("RESPMSG") || searchParams.get("respmsg");

  const [isVerifying, setIsVerifying] = useState(true);
  const [finalStatus, setFinalStatus] = useState<'success' | 'failed' | 'pending' | null>(null);

  // Fetch product order details based on sadad_order_id
  const { data: order, isLoading } = useQuery({
    queryKey: ["product-payment-result", orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from("product_orders")
        .select(`
          *,
          artists:artist_id (
            id,
            user_id,
            profiles:user_id (full_name)
          )
        `)
        .eq("id", orderId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching product order:", error);
        return null;
      }

      return data;
    },
    enabled: !!orderId,
  });

  // Also check payment_transactions table
  const { data: paymentTransaction } = useQuery({
    queryKey: ["payment-transaction", orderId],
    queryFn: async () => {
      if (!orderId) return null;

      const { data, error } = await supabase
        .from("payment_transactions")
        .select("*")
        .eq("order_id", orderId)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error("Error fetching payment transaction:", error);
        return null;
      }

      return data;
    },
    enabled: !!orderId,
  });

  // Verify payment status on mount
  useEffect(() => {
    const verifyPayment = async () => {
      if (!orderId) {
        setIsVerifying(false);
        setFinalStatus('failed');
        return;
      }

      // Poll for payment status
      let attempts = 0;
      const maxAttempts = 20;

      const interval = setInterval(async () => {
        attempts++;

        const { data: payment } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (payment) {
          if (payment.status === "success") {
            setIsVerifying(false);
            setFinalStatus('success');
            clearInterval(interval);

            // Clear cart on successful payment
            toast.success("Payment successful! Your order has been confirmed.");
          } else if (payment.status === "failed") {
            setIsVerifying(false);
            setFinalStatus('failed');
            clearInterval(interval);
            toast.error(payment.error_message || "Payment failed");
          }
        }

        if (attempts >= maxAttempts) {
          // Timeout - use URL params as fallback
          setIsVerifying(false);
          const respCode = parseInt(status || "810");
          setFinalStatus(respCode === 1 ? 'success' : 'failed');
          clearInterval(interval);
        }
      }, 3000);

      return () => clearInterval(interval);
    };

    verifyPayment();
  }, [orderId, status]);

  if (isVerifying || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center px-6">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">
            {t.payment?.verifyingPayment || "Verifying payment..."}
          </p>
        </div>
      </div>
    );
  }

  const isSuccess = finalStatus === 'success' || paymentTransaction?.status === 'success';
  const isFailed = finalStatus === 'failed' || paymentTransaction?.status === 'failed';

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md w-full">
          {isSuccess ? (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-scale-in">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Payment Successful!
              </h1>
              <p className="text-muted-foreground mb-6">
                Your payment has been processed successfully. Your product order is now confirmed and will be shipped soon.
              </p>

              {order && (
                <div className="bg-card rounded-xl border border-border p-4 mb-6 text-start">
                  <h3 className="font-semibold text-foreground mb-3">
                    Order Details
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium text-foreground">{order.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total Amount:</span>
                      <span className="font-medium text-foreground">QAR {order.total_qar.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-green-600">Confirmed</span>
                    </div>
                    {transactionNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Transaction #:</span>
                        <span className="font-medium text-foreground">{transactionNumber}</span>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          ) : isFailed ? (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-destructive/10 flex items-center justify-center mb-6 animate-scale-in">
                <XCircle className="w-14 h-14 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Payment Failed
              </h1>
              <p className="text-muted-foreground mb-6">
                {respMsg || "Unfortunately, your payment could not be processed. Please try again or choose a different payment method."}
              </p>

              {order && (
                <div className="bg-card rounded-xl border border-border p-4 mb-6 text-start">
                  <h3 className="font-semibold text-foreground mb-3">
                    Order Information
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Order ID:</span>
                      <span className="font-medium text-foreground">{order.id.slice(0, 8)}...</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-medium text-foreground">QAR {order.total_qar.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Status:</span>
                      <span className="font-medium text-destructive">Payment Failed</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <Loader2 className="w-14 h-14 text-muted-foreground animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                Processing Payment
              </h1>
              <p className="text-muted-foreground mb-6">
                Please wait while we verify your payment...
              </p>
            </>
          )}

          <div className="flex flex-col gap-3">
            {isSuccess && (
              <Button
                onClick={() => navigate("/orders")}
                className="w-full"
                size="lg"
              >
                <Package className="w-5 h-5 mr-2" />
                View My Orders
              </Button>
            )}

            {isFailed && order && (
              <Button
                onClick={() => navigate("/checkout")}
                className="w-full"
                size="lg"
              >
                Try Again
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => navigate("/home")}
              className="w-full"
              size="lg"
            >
              <Home className="w-5 h-5 mr-2" />
              {t.nav?.home || "Home"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPaymentResult;
