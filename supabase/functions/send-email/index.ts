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

const APP_NAME = "Glam";
const APP_URL = "https://radiant-matches-app.lovable.app";
const USER_MANUAL_URL = `${APP_URL}/user-manual-ar.html`;

function getEmailTemplate(type: EmailType, data: Record<string, unknown>): { subject: string; html: string } {
  const headerStyle = `background: linear-gradient(135deg, #8b5cf6, #a855f7); padding: 32px; text-align: center; border-radius: 12px 12px 0 0;`;
  const containerStyle = `max-width: 600px; margin: 0 auto; font-family: 'Segoe UI', Tahoma, sans-serif; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 20px rgba(0,0,0,0.1);`;
  const bodyStyle = `padding: 32px; color: #333; line-height: 1.8; direction: rtl; text-align: right;`;
  const footerStyle = `background: #f8f9fa; padding: 20px; text-align: center; color: #999; font-size: 12px; direction: rtl;`;
  const btnStyle = `display: inline-block; background: linear-gradient(135deg, #8b5cf6, #a855f7); color: #ffffff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; margin: 16px 0;`;

  const wrap = (title: string, content: string) => `
    <div style="${containerStyle}">
      <div style="${headerStyle}">
        <h1 style="color: #ffffff; margin: 0; font-size: 28px;">✨ ${APP_NAME}</h1>
      </div>
      <div style="${bodyStyle}">
        <h2 style="color: #8b5cf6; margin-top: 0;">${title}</h2>
        ${content}
      </div>
      <div style="${footerStyle}">
        <p>© ${new Date().getFullYear()} ${APP_NAME} - جميع الحقوق محفوظة</p>
        <p><a href="${APP_URL}" style="color: #8b5cf6;">زيارة التطبيق</a></p>
      </div>
    </div>`;

  switch (type) {
    case "welcome": {
      const name = (data.name as string) || "عزيزتي";
      return {
        subject: `مرحباً بك في ${APP_NAME}! 🎉`,
        html: wrap("مرحباً بك في عائلة Glam! 💄", `
          <p>أهلاً ${name}،</p>
          <p>يسعدنا انضمامك إلينا! مع ${APP_NAME} يمكنك اكتشاف أفضل خبيرات التجميل وحجز مواعيدك بسهولة.</p>
          <p>📖 للتعرف على جميع ميزات التطبيق، يمكنك الاطلاع على دليل المستخدم:</p>
          <div style="text-align: center;">
            <a href="${USER_MANUAL_URL}" style="${btnStyle}">📖 دليل المستخدم</a>
          </div>
          <div style="text-align: center; margin-top: 8px;">
            <a href="${APP_URL}/home" style="${btnStyle}">🏠 ابدئي الاستكشاف</a>
          </div>
          <p>إذا كان لديك أي استفسار، لا تترددي في التواصل معنا عبر قسم المساعدة في التطبيق.</p>
        `),
      };
    }

    case "booking_created": {
      const { customerName, artistName, serviceName, bookingDate, bookingTime, totalPrice } = data as Record<string, string>;
      return {
        subject: `تأكيد حجز جديد - ${APP_NAME}`,
        html: wrap("تم استلام حجزك! 📋", `
          <p>عزيزتي ${customerName || "العميلة"},</p>
          <p>تم استلام حجزك بنجاح وهو بانتظار تأكيد الخبيرة.</p>
          <div style="background: #f3f0ff; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;">🎨 <strong>الخدمة:</strong> ${serviceName || "-"}</p>
            <p style="margin: 4px 0;">👩‍🎨 <strong>الخبيرة:</strong> ${artistName || "-"}</p>
            <p style="margin: 4px 0;">📅 <strong>التاريخ:</strong> ${bookingDate || "-"}</p>
            <p style="margin: 4px 0;">🕐 <strong>الوقت:</strong> ${bookingTime || "-"}</p>
            <p style="margin: 4px 0;">💰 <strong>المبلغ:</strong> ${totalPrice || "-"} ر.ق</p>
          </div>
          <div style="text-align: center;">
            <a href="${APP_URL}/bookings" style="${btnStyle}">عرض حجوزاتي</a>
          </div>
        `),
      };
    }

    case "booking_confirmed": {
      const { customerName, artistName, serviceName, bookingDate, bookingTime } = data as Record<string, string>;
      return {
        subject: `تم تأكيد حجزك! ✅ - ${APP_NAME}`,
        html: wrap("تم تأكيد حجزك! ✅", `
          <p>عزيزتي ${customerName || "العميلة"},</p>
          <p>يسعدنا إبلاغك بأن <strong>${artistName || "الخبيرة"}</strong> قامت بتأكيد حجزك.</p>
          <div style="background: #ecfdf5; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;">🎨 <strong>الخدمة:</strong> ${serviceName || "-"}</p>
            <p style="margin: 4px 0;">📅 <strong>التاريخ:</strong> ${bookingDate || "-"}</p>
            <p style="margin: 4px 0;">🕐 <strong>الوقت:</strong> ${bookingTime || "-"}</p>
          </div>
          <p>نتمنى لك تجربة رائعة! 💕</p>
        `),
      };
    }

    case "booking_cancelled": {
      const { customerName, artistName, serviceName, bookingDate } = data as Record<string, string>;
      return {
        subject: `تم إلغاء الحجز - ${APP_NAME}`,
        html: wrap("تم إلغاء الحجز ❌", `
          <p>عزيزتي ${customerName || "العميلة"},</p>
          <p>نأسف لإبلاغك بأن حجزك مع <strong>${artistName || "الخبيرة"}</strong> تم إلغاؤه.</p>
          <div style="background: #fef2f2; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;">🎨 <strong>الخدمة:</strong> ${serviceName || "-"}</p>
            <p style="margin: 4px 0;">📅 <strong>التاريخ:</strong> ${bookingDate || "-"}</p>
          </div>
          <p>يمكنك حجز موعد جديد في أي وقت.</p>
          <div style="text-align: center;">
            <a href="${APP_URL}/makeup-artists" style="${btnStyle}">تصفح الخبيرات</a>
          </div>
        `),
      };
    }

    case "order_created": {
      const { customerName, orderId, totalPrice, itemCount } = data as Record<string, string>;
      return {
        subject: `تأكيد طلب جديد #${(orderId || "").slice(0, 8)} - ${APP_NAME}`,
        html: wrap("تم استلام طلبك! 🛍️", `
          <p>عزيزتي ${customerName || "العميلة"},</p>
          <p>تم استلام طلبك بنجاح!</p>
          <div style="background: #f3f0ff; padding: 20px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;">📦 <strong>رقم الطلب:</strong> #${(orderId || "").slice(0, 8)}</p>
            <p style="margin: 4px 0;">🛒 <strong>عدد المنتجات:</strong> ${itemCount || "-"}</p>
            <p style="margin: 4px 0;">💰 <strong>المبلغ:</strong> ${totalPrice || "-"} ر.ق</p>
          </div>
          <div style="text-align: center;">
            <a href="${APP_URL}/orders" style="${btnStyle}">تتبع طلبك</a>
          </div>
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
        subject: `تحديث حالة الطلب #${(orderId || "").slice(0, 8)} - ${APP_NAME}`,
        html: wrap("تحديث حالة طلبك 📦", `
          <p>عزيزتي ${customerName || "العميلة"},</p>
          <p>تم تحديث حالة طلبك:</p>
          <div style="background: #f3f0ff; padding: 20px; border-radius: 8px; margin: 16px 0; text-align: center;">
            <p style="font-size: 20px; font-weight: bold; color: #8b5cf6;">${label}</p>
            <p style="margin: 4px 0; color: #666;">رقم الطلب: #${(orderId || "").slice(0, 8)}</p>
          </div>
          <div style="text-align: center;">
            <a href="${APP_URL}/orders/${orderId || ""}" style="${btnStyle}">عرض تفاصيل الطلب</a>
          </div>
        `),
      };
    }

    default:
      return { subject: `إشعار من ${APP_NAME}`, html: wrap("إشعار", `<p>${JSON.stringify(data)}</p>`) };
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
        from: `Glam <onboarding@glamore.app>`,
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
