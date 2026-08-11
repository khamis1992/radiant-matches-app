import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

const APP_NAME = "Glamore";
const APP_URL = "https://radiant-matches-app.lovable.app";
const LOGO_URL = "https://besjfzlgtssriqpluzgn.supabase.co/storage/v1/object/public/banners/logo.png";
const USER_MANUAL_URL = `${APP_URL}/user-manual-ar.html`;
const BRAND_COLOR = "#A9475B"; // GLAM Rose Action
const BRAND_LIGHT = "#F8C2C3"; // GLAM Soft Blush

function wrap(title: string, emoji: string, content: string) {
  return `
<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; background-color: #f6f6f9; font-family: 'Segoe UI', Tahoma, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f6f9; padding: 32px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="560" cellpadding="0" cellspacing="0" style="max-width: 560px; width: 100%; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 16px rgba(0,0,0,0.06);">
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 120px; width: auto;" />
            </td>
          </tr>
          <tr>
            <td style="padding: 28px 0 8px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; font-size: 32px; background: ${BRAND_LIGHT}; border-radius: 50%;">${emoji}</div>
            </td>
          </tr>
          <tr>
            <td style="padding: 12px 32px 4px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">${title}</h2>
            </td>
          </tr>
          <tr>
            <td style="padding: 16px 32px 28px; color: #4a4a5a; font-size: 15px; line-height: 1.7; text-align: right;">
              ${content}
            </td>
          </tr>
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #f0f0f0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding: 20px 32px 24px; text-align: center;">
              <p style="margin: 0 0 6px; font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} ${APP_NAME} — جميع الحقوق محفوظة</p>
              <a href="${APP_URL}" style="font-size: 12px; color: ${BRAND_COLOR}; text-decoration: none;">glamore.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

const btn = (text: string, href: string) =>
  `<div style="text-align: center; margin: 20px 0;">
    <a href="${href}" style="display: inline-block; background: ${BRAND_COLOR}; color: #ffffff; text-decoration: none; padding: 12px 36px; border-radius: 24px; font-weight: 600; font-size: 15px;">${text}</a>
  </div>`;

const infoCard = (items: string[], bgColor = BRAND_LIGHT) =>
  `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background: ${bgColor}; border-radius: 12px; margin: 16px 0;">
    <tr><td style="padding: 18px 20px;">
      ${items.map(i => `<p style="margin: 6px 0; font-size: 14px; color: #333;">${i}</p>`).join("")}
    </td></tr>
  </table>`;

const templates: Record<string, { label: string; html: string }> = {
  welcome: {
    label: "ترحيب بمستخدم جديد",
    html: wrap("مرحباً بك في عائلة Glamore!", "💄", `
      <p style="margin: 0 0 12px;">أهلاً <strong>سارة</strong>،</p>
      <p style="margin: 0 0 16px;">يسعدنا انضمامك إلينا! اكتشفي أفضل خبيرات التجميل واحجزي مواعيدك بكل سهولة.</p>
      ${btn("📖  دليل المستخدم", USER_MANUAL_URL)}
      ${btn("✨  ابدئي الاستكشاف", APP_URL + "/home")}
      <p style="margin: 16px 0 0; font-size: 13px; color: #888;">لأي استفسار تواصلي معنا عبر قسم المساعدة في التطبيق.</p>
    `),
  },
  booking_created: {
    label: "حجز جديد",
    html: wrap("تم استلام حجزك بنجاح!", "📋", `
      <p>عزيزتي <strong>سارة</strong>،</p>
      <p>تم استلام حجزك وهو بانتظار تأكيد الخبيرة.</p>
      ${infoCard([
        `<strong>الخدمة:</strong> مكياج عروس`,
        `<strong>الخبيرة:</strong> نورة أحمد`,
        `<strong>التاريخ:</strong> 2026-03-15`,
        `<strong>الوقت:</strong> 10:00 ص`,
        `<strong>المبلغ:</strong> 500 ر.ق`,
      ])}
      ${btn("عرض حجوزاتي", APP_URL + "/bookings")}
    `),
  },
  booking_confirmed: {
    label: "تأكيد حجز",
    html: wrap("تم تأكيد حجزك!", "✅", `
      <p>عزيزتي <strong>سارة</strong>،</p>
      <p>قامت <strong>نورة أحمد</strong> بتأكيد حجزك.</p>
      ${infoCard([
        `<strong>الخدمة:</strong> مكياج عروس`,
        `<strong>التاريخ:</strong> 2026-03-15`,
        `<strong>الوقت:</strong> 10:00 ص`,
      ], "#ecfdf5")}
      <p style="text-align: center; font-size: 14px; color: #888;">نتمنى لك تجربة رائعة 💕</p>
    `),
  },
  booking_cancelled: {
    label: "إلغاء حجز",
    html: wrap("تم إلغاء الحجز", "❌", `
      <p>عزيزتي <strong>سارة</strong>،</p>
      <p>نأسف لإبلاغك بأن حجزك مع <strong>نورة أحمد</strong> تم إلغاؤه.</p>
      ${infoCard([
        `<strong>الخدمة:</strong> مكياج عروس`,
        `<strong>التاريخ:</strong> 2026-03-15`,
      ], "#fef2f2")}
      <p>يمكنك حجز موعد جديد في أي وقت.</p>
      ${btn("تصفح الخبيرات", APP_URL + "/makeup-artists")}
    `),
  },
  order_created: {
    label: "طلب جديد",
    html: wrap("تم استلام طلبك!", "🛍️", `
      <p>عزيزتي <strong>سارة</strong>،</p>
      <p>تم استلام طلبك بنجاح!</p>
      ${infoCard([
        `<strong>رقم الطلب:</strong> #a1b2c3d4`,
        `<strong>عدد المنتجات:</strong> 3`,
        `<strong>المبلغ:</strong> 250 ر.ق`,
      ])}
      ${btn("تتبع طلبك", APP_URL + "/orders")}
    `),
  },
  order_status_updated: {
    label: "تحديث حالة طلب",
    html: wrap("تحديث حالة طلبك", "📦", `
      <p>عزيزتي <strong>سارة</strong>،</p>
      <p>تم تحديث حالة طلبك:</p>
      <div style="text-align: center; background: ${BRAND_LIGHT}; border-radius: 12px; padding: 20px; margin: 16px 0;">
        <p style="font-size: 22px; font-weight: 700; color: ${BRAND_COLOR}; margin: 0 0 4px;">تم الشحن 🚚</p>
        <p style="font-size: 13px; color: #888; margin: 0;">رقم الطلب: #a1b2c3d4</p>
      </div>
      ${btn("عرض تفاصيل الطلب", APP_URL + "/orders/a1b2c3d4")}
    `),
  },
};

export default function EmailPreview() {
  const [selected, setSelected] = useState("welcome");
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-muted/30 p-4 md:p-8">
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)} aria-label="رجوع">
            <ArrowRight className="h-5 w-5" />
          </Button>
          <h1 className="text-xl font-bold">معاينة قوالب الإيميل</h1>
        </div>

        <Select value={selected} onValueChange={setSelected}>
          <SelectTrigger className="w-full max-w-xs">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {Object.entries(templates).map(([key, t]) => (
              <SelectItem key={key} value={key}>{t.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="rounded-xl border bg-background overflow-hidden shadow-sm">
          <iframe
            srcDoc={templates[selected].html}
            className="w-full border-0"
            style={{ minHeight: 600 }}
            title="Email Preview"
          />
        </div>
      </div>
    </div>
  );
}
