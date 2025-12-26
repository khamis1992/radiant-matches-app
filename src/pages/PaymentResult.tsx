import { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { CheckCircle, XCircle, Loader2, Home, CalendarCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();
  
  const orderId = searchParams.get("order_id");
  const status = searchParams.get("status");
  const transactionNumber = searchParams.get("transaction_number");

  // Fetch booking details based on order_id
  const { data: booking, isLoading } = useQuery({
    queryKey: ["payment-result", orderId],
    queryFn: async () => {
      if (!orderId) return null;
      
      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          services:service_id (name),
          artists:artist_id (
            id,
            profiles:user_id (full_name)
          )
        `)
        .eq("sadad_order_id", orderId)
        .maybeSingle();
      
      if (error) {
        console.error("Error fetching booking:", error);
        return null;
      }
      
      return data;
    },
    enabled: !!orderId,
  });

  const isSuccess = status === "success" || status === "completed" || booking?.payment_status === "completed";
  const isFailed = status === "failed" || status === "error" || booking?.payment_status === "failed";

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center" dir={isRTL ? "rtl" : "ltr"}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">{t.payment?.verifyingPayment || "Verifying payment..."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="text-center max-w-md">
          {isSuccess ? (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-green-500/10 flex items-center justify-center mb-6 animate-scale-in">
                <CheckCircle className="w-14 h-14 text-green-500" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {t.payment?.paymentSuccess || "Payment Successful!"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t.payment?.paymentSuccessDesc || "Your payment has been processed successfully. Your booking is now confirmed."}
              </p>
              
              {booking && (
                <div className="bg-card rounded-xl border border-border p-4 mb-6 text-start">
                  <h3 className="font-semibold text-foreground mb-3">
                    {t.bookings.bookingDetails}
                  </h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.bookings.service}</span>
                      <span className="font-medium text-foreground">{booking.services?.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t.bookings.date}</span>
                      <span className="font-medium text-foreground">
                        {new Date(booking.booking_date).toLocaleDateString()}
                      </span>
                    </div>
                    {transactionNumber && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">{t.payment?.transactionNumber || "Transaction #"}</span>
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
                {t.payment?.paymentFailed || "Payment Failed"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t.payment?.paymentFailedDesc || "Unfortunately, your payment could not be processed. Please try again or choose a different payment method."}
              </p>
            </>
          ) : (
            <>
              <div className="w-24 h-24 mx-auto rounded-full bg-muted flex items-center justify-center mb-6">
                <Loader2 className="w-14 h-14 text-muted-foreground animate-spin" />
              </div>
              <h1 className="text-2xl font-bold text-foreground mb-2">
                {t.payment?.processingPayment || "Processing Payment"}
              </h1>
              <p className="text-muted-foreground mb-6">
                {t.payment?.processingPaymentDesc || "Please wait while we verify your payment..."}
              </p>
            </>
          )}

          <div className="flex flex-col gap-3">
            {isSuccess && (
              <Button 
                onClick={() => navigate("/bookings")} 
                className="w-full"
                size="lg"
              >
                <CalendarCheck className="w-5 h-5 me-2" />
                {t.bookings.viewDetails || "View My Bookings"}
              </Button>
            )}
            
            {isFailed && booking && (
              <Button 
                onClick={() => navigate(`/booking/${booking.artist_id}?serviceId=${booking.service_id}`)} 
                className="w-full"
                size="lg"
              >
                {t.payment?.tryAgain || "Try Again"}
              </Button>
            )}
            
            <Button 
              variant="outline" 
              onClick={() => navigate("/home")} 
              className="w-full"
              size="lg"
            >
              <Home className="w-5 h-5 me-2" />
              {t.nav.home}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentResult;
