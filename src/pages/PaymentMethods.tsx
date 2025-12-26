import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, CreditCard, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNavigation from "@/components/BottomNavigation";

const PaymentMethods = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <BackIcon className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {t.profile.paymentMethods}
          </h1>
        </div>
      </header>

      <div className="flex flex-col items-center justify-center px-5 py-16 text-center">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
          <Clock className="w-10 h-10 text-primary" />
        </div>
        <h2 className="text-xl font-semibold text-foreground mb-2">
          {t.paymentMethods?.comingSoon || "Coming Soon"}
        </h2>
        <p className="text-muted-foreground mb-6 max-w-xs">
          {t.paymentMethods?.comingSoonDesc || "We're working on adding secure payment methods. For now, you can pay in cash at your appointment."}
        </p>
        <div className="flex items-center gap-2 text-sm text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
          <CreditCard className="w-4 h-4" />
          <span>{t.paymentMethods?.cashOnly || "Cash payment available"}</span>
        </div>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default PaymentMethods;
