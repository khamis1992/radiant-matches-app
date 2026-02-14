import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface SadadPaymentData {
  orderId: string;
  amount: number;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  returnUrl?: string;
}

export interface SadadPaymentState {
  isProcessing: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: string | null;
  paymentUrl: string | null;
  transactionId: string | null;
}

interface SadadInitiateResponse {
  success: boolean;
  data?: {
    payment_url: string;
    transaction_id: string;
    ORDER_ID: string;
    WEBSITE: string;
    merchant_id: string;
    TXN_AMOUNT: string;
    CUST_ID: string;
    EMAIL: string;
    MOBILE_NO: string;
    SADAD_WEBCHECKOUT_PAGE_LANGUAGE: string;
    CALLBACK_URL: string;
    txnDate: string;
    VERSION: string;
    productdetail: Array<{
      order_id: string;
      itemname: string;
      amount: string;
      quantity: string;
      type: string;
    }>;
    checksumhash: string;
  };
  error?: string;
  details?: string;
}

interface UseSadadPaymentOptions {
  onSuccess?: (paymentId: string, orderId: string) => void;
  onError?: (error: string) => void;
}

export const useSadadPayment = (options?: UseSadadPaymentOptions) => {
  const [state, setState] = useState<SadadPaymentState>({
    isProcessing: false,
    isSuccess: false,
    isError: false,
    error: null,
    paymentUrl: null,
    transactionId: null,
  });

  const resetPayment = useCallback(() => {
    setState({
      isProcessing: false,
      isSuccess: false,
      isError: false,
      error: null,
      paymentUrl: null,
      transactionId: null,
    });
  }, []);

  const initiatePayment = useCallback(async (paymentData: SadadPaymentData) => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
      isError: false,
      error: null,
    }));

    try {
      console.log("Initiating Sadad payment for order:", paymentData.orderId);

      // Call the Sadad initiate edge function for product orders
      const { data, error } = await supabase.functions.invoke<SadadInitiateResponse>(
        "sadad-initiate-product-payment",
        {
          body: {
            order_id: paymentData.orderId,
            customer_email: paymentData.customerEmail,
            customer_phone: paymentData.customerPhone,
            customer_name: paymentData.customerName,
            return_url: paymentData.returnUrl,
          },
        }
      );

      if (error) {
        console.error("Sadad payment initiation error:", error);
        throw new Error(error.message || "Failed to initiate payment");
      }

      if (!data?.success || !data?.data) {
        console.error("Sadad payment initiation failed:", data);
        throw new Error(data?.error || "Failed to initiate payment");
      }

      console.log("Sadad payment initiated successfully:", {
        orderId: data.data.ORDER_ID,
        paymentUrl: data.data.payment_url,
        transactionId: data.data.transaction_id,
      });

      setState(prev => ({
        ...prev,
        isSuccess: true,
        paymentUrl: data.data.payment_url,
        transactionId: data.data.transaction_id,
      }));

      // Auto-redirect to payment page
      if (data.data.payment_url) {
        // Store the return URL in sessionStorage so we can redirect back after payment
        sessionStorage.setItem('sadad_return_url', window.location.pathname);
        sessionStorage.setItem('sadad_order_id', paymentData.orderId);

        // Create a hidden form to submit the payment data to Sadad
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = data.data.payment_url;

        // Add all required fields
        const fields = [
          { name: 'merchant_id', value: data.data.merchant_id },
          { name: 'ORDER_ID', value: data.data.ORDER_ID },
          { name: 'WEBSITE', value: data.data.WEBSITE },
          { name: 'TXN_AMOUNT', value: data.data.TXN_AMOUNT },
          { name: 'CUST_ID', value: data.data.CUST_ID },
          { name: 'EMAIL', value: data.data.EMAIL },
          { name: 'MOBILE_NO', value: data.data.MOBILE_NO },
          { name: 'SADAD_WEBCHECKOUT_PAGE_LANGUAGE', value: data.data.SADAD_WEBCHECKOUT_PAGE_LANGUAGE },
          { name: 'CALLBACK_URL', value: data.data.CALLBACK_URL },
          { name: 'txnDate', value: data.data.txnDate },
          { name: 'VERSION', value: data.data.VERSION },
          { name: 'checksumhash', value: data.data.checksumhash },
        ];

        // Add productdetail items
        if (data.data.productdetail && Array.isArray(data.data.productdetail)) {
          data.data.productdetail.forEach((item, index) => {
            Object.entries(item).forEach(([key, value]) => {
              fields.push({
                name: `productdetail[${index}][${key}]`,
                value: String(value)
              });
            });
          });
        }

        // Add fields to form
        fields.forEach(field => {
          const input = document.createElement('input');
          input.type = 'hidden';
          input.name = field.name;
          input.value = field.value;
          form.appendChild(input);
        });

        // Submit form
        document.body.appendChild(form);
        form.submit();
        document.body.removeChild(form);
      }

      options?.onSuccess?.(data.data.transaction_id, data.data.ORDER_ID);
      return data.data;
    } catch (error: any) {
      console.error("Sadad payment error:", error);
      const errorMessage = error?.message || "Failed to initiate payment. Please try again.";

      setState(prev => ({
        ...prev,
        isProcessing: false,
        isError: true,
        error: errorMessage,
      }));

      toast.error(errorMessage);
      options?.onError?.(errorMessage);
      throw error;
    }
  }, [options]);

  const verifyPayment = useCallback(async (orderId: string) => {
    setState(prev => ({
      ...prev,
      isProcessing: true,
    }));

    try {
      // Poll for payment status
      let attempts = 0;
      const maxAttempts = 20; // 20 attempts * 3 seconds = 1 minute max

      while (attempts < maxAttempts) {
        const { data: paymentData } = await supabase
          .from("payment_transactions")
          .select("*")
          .eq("order_id", orderId)
          .order("created_at", { ascending: false })
          .limit(1)
          .maybeSingle();

        if (paymentData) {
          console.log("Payment status check:", {
            status: paymentData.status,
            attempt: attempts + 1,
          });

          if (paymentData.status === "success") {
            setState(prev => ({
              ...prev,
              isProcessing: false,
              isSuccess: true,
              isError: false,
              error: null,
            }));

            toast.success("Payment completed successfully!");
            return { success: true, paymentData };
          }

          if (paymentData.status === "failed") {
            setState(prev => ({
              ...prev,
              isProcessing: false,
              isSuccess: false,
              isError: true,
              error: paymentData.error_message || "Payment failed",
            }));

            toast.error(paymentData.error_message || "Payment failed");
            return { success: false, paymentData };
          }
        }

        // Wait before next attempt
        await new Promise(resolve => setTimeout(resolve, 3000));
        attempts++;
      }

      // Timeout
      setState(prev => ({
        ...prev,
        isProcessing: false,
        isError: true,
        error: "Payment verification timeout. Please check your order status.",
      }));

      toast.error("Payment verification timeout");
      return { success: false, error: "timeout" };
    } catch (error: any) {
      console.error("Payment verification error:", error);
      setState(prev => ({
        ...prev,
        isProcessing: false,
        isError: true,
        error: error.message || "Failed to verify payment",
      }));
      throw error;
    }
  }, []);

  return {
    paymentState: state,
    initiatePayment,
    verifyPayment,
    resetPayment,
  };
};
