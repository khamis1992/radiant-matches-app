import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type EmailType =
  | "welcome"
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "order_created"
  | "order_status_updated";

interface EmailRequest {
  type: EmailType;
  to: string;
  data: Record<string, unknown>;
}

const APP_NAME = "Glamore";
const APP_URL = "https://radiant-matches-app.lovable.app";
const LOGO_URL = "https://besjfzlgtssriqpluzgn.supabase.co/storage/v1/object/public/banners/logo.png";
const USER_MANUAL_URL = `${APP_URL}/user-manual-ar.html`;
const BRAND_COLOR = "#C4526E";
const BRAND_LIGHT = "#FDF2F4";
const BRAND_DARK = "#9B3A52";

function getEmailTemplate(type: EmailType, data: Record<string, unknown>): { subject: string; html: string } {
  const wrap = (title: string, emoji: string, content: string) => `
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
          
          <!-- Logo Header -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${LOGO_URL}" alt="${APP_NAME}" style="height: 120px; width: auto;" />
            </td>
          </tr>

          <!-- Emoji Circle -->
          <tr>
            <td style="padding: 28px 0 8px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; font-size: 32px; background: ${BRAND_LIGHT}; border-radius: 50%;">${emoji}</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 12px 32px 4px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">${title}</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 16px 32px 28px; color: #4a4a5a; font-size: 15px; line-height: 1.7; text-align: right;">
              ${content}
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding: 0 32px;">
              <div style="border-top: 1px solid #f0f0f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
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

  switch (type) {
    case "welcome": {
      const name = (data.name as string) || "عزيزتي";
      return {
        subject: `أهلاً بك في ${APP_NAME}! 🎉`,
        html: wrap("مرحباً بك في عائلة Glamore!", "💄", `
          <p style="margin: 0 0 12px;">أهلاً <strong>${name}</strong>،</p>
          <p style="margin: 0 0 16px;">يسعدنا انضمامك إلينا! اكتشفي أفضل خبيرات التجميل واحجزي مواعيدك بكل سهولة.</p>
          ${btn("📖  دليل المستخدم", USER_MANUAL_URL)}
          ${btn("✨  ابدئي الاستكشاف", APP_URL + "/home")}
          <p style="margin: 16px 0 0; font-size: 13px; color: #888;">لأي استفسار تواصلي معنا عبر قسم المساعدة في التطبيق.</p>
        `),
      };
    }

    case "booking_created": {
      const { customerName, artistName, serviceName, bookingDate, bookingTime, totalPrice } = data as Record<string, string>;
      return {
        subject: `تأكيد حجز جديد — ${APP_NAME}`,
        html: wrap("تم استلام حجزك بنجاح!", "📋", `
          <p>عزيزتي <strong>${customerName || "العميلة"}</strong>،</p>
          <p>تم استلام حجزك وهو بانتظار تأكيد الخبيرة.</p>
          ${infoCard([
            `<strong>الخدمة:</strong> ${serviceName || "-"}`,
            `<strong>الخبيرة:</strong> ${artistName || "-"}`,
            `<strong>التاريخ:</strong> ${bookingDate || "-"}`,
            `<strong>الوقت:</strong> ${bookingTime || "-"}`,
            `<strong>المبلغ:</strong> ${totalPrice || "-"} ر.ق`,
          ])}
          ${btn("عرض حجوزاتي", APP_URL + "/bookings")}
        `),
      };
    }

    case "booking_confirmed": {
      const { customerName, artistName, serviceName, bookingDate, bookingTime } = data as Record<string, string>;
      return {
        subject: `تم تأكيد حجزك ✅ — ${APP_NAME}`,
        html: wrap("تم تأكيد حجزك!", "✅", `
          <p>عزيزتي <strong>${customerName || "العميلة"}</strong>،</p>
          <p>قامت <strong>${artistName || "الخبيرة"}</strong> بتأكيد حجزك.</p>
          ${infoCard([
            `<strong>الخدمة:</strong> ${serviceName || "-"}`,
            `<strong>التاريخ:</strong> ${bookingDate || "-"}`,
            `<strong>الوقت:</strong> ${bookingTime || "-"}`,
          ], "#ecfdf5")}
          <p style="text-align: center; font-size: 14px; color: #888;">نتمنى لك تجربة رائعة 💕</p>
        `),
      };
    }

    case "booking_cancelled": {
      const { customerName, artistName, serviceName, bookingDate } = data as Record<string, string>;
      return {
        subject: `تم إلغاء الحجز — ${APP_NAME}`,
        html: wrap("تم إلغاء الحجز", "❌", `
          <p>عزيزتي <strong>${customerName || "العميلة"}</strong>،</p>
          <p>نأسف لإبلاغك بأن حجزك مع <strong>${artistName || "الخبيرة"}</strong> تم إلغاؤه.</p>
          ${infoCard([
            `<strong>الخدمة:</strong> ${serviceName || "-"}`,
            `<strong>التاريخ:</strong> ${bookingDate || "-"}`,
          ], "#fef2f2")}
          <p>يمكنك حجز موعد جديد في أي وقت.</p>
          ${btn("تصفح الخبيرات", APP_URL + "/makeup-artists")}
        `),
      };
    }

    case "order_created": {
      const { customerName, orderId, totalPrice, itemCount } = data as Record<string, string>;
      return {
        subject: `تأكيد طلب #${(orderId || "").slice(0, 8)} — ${APP_NAME}`,
        html: wrap("تم استلام طلبك!", "🛍️", `
          <p>عزيزتي <strong>${customerName || "العميلة"}</strong>،</p>
          <p>تم استلام طلبك بنجاح!</p>
          ${infoCard([
            `<strong>رقم الطلب:</strong> #${(orderId || "").slice(0, 8)}`,
            `<strong>عدد المنتجات:</strong> ${itemCount || "-"}`,
            `<strong>المبلغ:</strong> ${totalPrice || "-"} ر.ق`,
          ])}
          ${btn("تتبع طلبك", APP_URL + "/orders")}
        `),
      };
    }

    case "order_status_updated": {
      const { customerName, orderId, status } = data as Record<string, string>;
      const statusLabels: Record<string, string> = {
        processing: "قيد التجهيز 📦",
        shipped: "تم الشحن 🚚",
        delivered: "تم التسليم ✅",
        cancelled: "تم الإلغاء ❌",
      };
      const label = statusLabels[status || ""] || status || "-";
      return {
        subject: `تحديث طلب #${(orderId || "").slice(0, 8)} — ${APP_NAME}`,
        html: wrap("تحديث حالة طلبك", "📦", `
          <p>عزيزتي <strong>${customerName || "العميلة"}</strong>،</p>
          <p>تم تحديث حالة طلبك:</p>
          <div style="text-align: center; background: ${BRAND_LIGHT}; border-radius: 12px; padding: 20px; margin: 16px 0;">
            <p style="font-size: 22px; font-weight: 700; color: ${BRAND_COLOR}; margin: 0 0 4px;">${label}</p>
            <p style="font-size: 13px; color: #888; margin: 0;">رقم الطلب: #${(orderId || "").slice(0, 8)}</p>
          </div>
          ${btn("عرض تفاصيل الطلب", APP_URL + "/orders/" + (orderId || ""))}
        `),
      };
    }

    default:
      return { subject: `إشعار من ${APP_NAME}`, html: wrap("إشعار", "🔔", `<p>${JSON.stringify(data)}</p>`) };
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) {
      throw new Error("RESEND_API_KEY is not configured");
    }

    const body: EmailRequest = await req.json();
    const { type, to, data } = body;

    if (!type || !to) {
      return new Response(JSON.stringify({ error: "Missing type or to" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { subject, html } = getEmailTemplate(type, data || {});

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: `Glamore <onboarding@glamore.app>`,
        to: [to],
        subject,
        html,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      console.error("Resend error:", result);
      return new Response(JSON.stringify({ error: "Failed to send email", details: result }), {
        status: res.status,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Email sent: type=${type}, to=${to}, id=${result.id}`);
    return new Response(JSON.stringify({ success: true, id: result.id }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Send email error:", error);
    return new Response(JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
