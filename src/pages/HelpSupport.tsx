import * as React from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, ArrowRight, MessageCircle, Mail, Phone, ChevronDown, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import BottomNavigation from "@/components/BottomNavigation";

const HelpSupport = () => {
  const navigate = useNavigate();
  const { t, isRTL } = useLanguage();

  const BackIcon = isRTL ? ArrowRight : ArrowLeft;

  const faqs = [
    {
      question: t.help?.faq1Question || "How do I book an appointment?",
      answer: t.help?.faq1Answer || "Browse artists, select one you like, choose a service, pick a date and time, then confirm your booking.",
    },
    {
      question: t.help?.faq2Question || "How can I cancel my booking?",
      answer: t.help?.faq2Answer || "Go to My Bookings, find the booking you want to cancel, and tap the Cancel button. Please note cancellation policies may apply.",
    },
    {
      question: t.help?.faq3Question || "How do I contact an artist?",
      answer: t.help?.faq3Answer || "You can message an artist directly through the app. Go to their profile and tap the message icon.",
    },
    {
      question: t.help?.faq4Question || "What payment methods are accepted?",
      answer: t.help?.faq4Answer || "We currently support cash payment. More payment options will be available soon.",
    },
    {
      question: t.help?.faq5Question || "How do I leave a review?",
      answer: t.help?.faq5Answer || "After your appointment is completed, go to My Bookings, find the completed booking, and tap Leave Review.",
    },
  ];

  const contactMethods = [
    {
      icon: MessageCircle,
      title: t.help?.whatsapp || "WhatsApp",
      subtitle: t.help?.whatsappDesc || "Chat with us on WhatsApp",
      action: () => window.open("https://wa.me/97433333333", "_blank"),
      color: "bg-green-500",
    },
    {
      icon: Mail,
      title: t.help?.email || "Email",
      subtitle: t.help?.emailDesc || "Send us an email",
      action: () => window.open("mailto:support@glambook.qa", "_blank"),
      color: "bg-primary",
    },
    {
      icon: Phone,
      title: t.help?.phone || "Phone",
      subtitle: t.help?.phoneDesc || "Call our support line",
      action: () => window.open("tel:+97433333333", "_blank"),
      color: "bg-blue-500",
    },
  ];

  return (
    <div className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-10 bg-background border-b border-border px-4 py-3">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate(-1)}
            className="p-2 rounded-full hover:bg-muted transition-colors"
          >
            <BackIcon className="w-5 h-5 text-foreground" />
          </button>
          <h1 className="text-lg font-semibold text-foreground">
            {t.profile.helpSupport}
          </h1>
        </div>
      </header>

      <div className="p-5 space-y-6">
        {/* Contact Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t.help?.contactUs || "Contact Us"}
          </h2>
          <div className="space-y-3">
            {contactMethods.map((method) => (
              <button
                key={method.title}
                onClick={method.action}
                className="w-full flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:bg-muted/50 transition-colors"
              >
                <div className={`w-12 h-12 rounded-full ${method.color} flex items-center justify-center`}>
                  <method.icon className="w-6 h-6 text-white" />
                </div>
                <div className={`flex-1 ${isRTL ? "text-right" : "text-left"}`}>
                  <p className="font-medium text-foreground">{method.title}</p>
                  <p className="text-sm text-muted-foreground">{method.subtitle}</p>
                </div>
                <ExternalLink className="w-5 h-5 text-muted-foreground" />
              </button>
            ))}
          </div>
        </section>

        {/* FAQ Section */}
        <section>
          <h2 className="text-lg font-semibold text-foreground mb-4">
            {t.help?.faqTitle || "Frequently Asked Questions"}
          </h2>
          <Accordion type="single" collapsible className="bg-card rounded-xl border border-border overflow-hidden">
            {faqs.map((faq, index) => (
              <AccordionItem key={index} value={`item-${index}`} className="border-b border-border last:border-b-0">
                <AccordionTrigger className="px-4 py-3 text-foreground hover:no-underline hover:bg-muted/50">
                  <span className={`${isRTL ? "text-right" : "text-left"} flex-1`}>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="px-4 pb-4 text-muted-foreground">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </section>

        {/* App Info */}
        <section className="text-center py-6">
          <p className="text-sm text-muted-foreground">
            {t.help?.appVersion || "App Version"}: 1.0.0
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            © 2024 GlamBook. {t.help?.allRights || "All rights reserved."}
          </p>
        </section>
      </div>

      <BottomNavigation />
    </div>
  );
};

export default HelpSupport;
