import React from "react";
import { Loader2, CheckCircle, AlertCircle, CreditCard } from "lucide-react";

interface PaymentProcessingProps {
  isProcessing: boolean;
  isSuccess: boolean;
  error: string | null;
  method: "sadad" | "cash";
  amount: number;
  onRetry?: () => void;
}

export const PaymentProcessing = ({ 
  isProcessing, 
  isSuccess, 
  error, 
  method, 
  amount, 
  onRetry 
}: PaymentProcessingProps) => {
  if (isSuccess) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mb-4 animate-scale-in">
          <CheckCircle className="w-10 h-10 text-green-600" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Payment Successful</h3>
        <p className="text-muted-foreground text-center">
          Your booking has been confirmed successfully
        </p>
      </div>
    );
  }

  if (isProcessing) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
          <Loader2 className="w-10 h-10 text-primary animate-spin" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">
          Processing {method === "sadad" ? "SADAD" : "Cash"} Payment
        </h3>
        <p className="text-muted-foreground text-center mb-4">
          {method === "sadad" 
            ? "Redirecting to secure payment gateway..."
            : "Confirming your booking..."
          }
        </p>
        {method === "sadad" && (
          <div className="w-full max-w-sm">
            <div className="bg-muted/30 rounded-lg p-4">
              <div className="flex items-center gap-3 mb-2">
                <CreditCard className="w-5 h-5 text-primary" />
                <span className="font-medium">Payment Details</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Amount:</span>
                <span className="font-medium">QAR {amount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Method:</span>
                <span className="font-medium">SADAD</span>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center py-8 px-4">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-4">
          <AlertCircle className="w-10 h-10 text-destructive" />
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">Payment Failed</h3>
        <p className="text-muted-foreground text-center mb-4">
          {error || "There was an error processing your payment"}
        </p>
        {onRetry && (
          <button 
            onClick={onRetry}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
          >
            Try Again
          </button>
        )}
      </div>
    );
  }

  return null;
};

export default PaymentProcessing;
