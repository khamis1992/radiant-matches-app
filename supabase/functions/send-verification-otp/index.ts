import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const LOGO_URL = "https://besjfzlgtssriqpluzgn.supabase.co/storage/v1/object/public/banners/logo.png";
const BRAND_COLOR = "#C4526E";
const BRAND_LIGHT = "#FDF2F4";

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function getOTPEmailHTML(otp: string, name: string): string {
  return `<!DOCTYPE html>
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
          
          <!-- Logo -->
          <tr>
            <td style="padding: 28px 32px 20px; text-align: center; border-bottom: 1px solid #f0f0f0;">
              <img src="${LOGO_URL}" alt="Glamore" style="height: 120px; width: auto;" />
            </td>
          </tr>

          <!-- Emoji -->
          <tr>
            <td style="padding: 28px 0 8px; text-align: center;">
              <div style="display: inline-block; width: 64px; height: 64px; line-height: 64px; font-size: 32px; background: ${BRAND_LIGHT}; border-radius: 50%;">🔐</div>
            </td>
          </tr>

          <!-- Title -->
          <tr>
            <td style="padding: 12px 32px 4px; text-align: center;">
              <h2 style="margin: 0; font-size: 20px; font-weight: 700; color: #1a1a2e;">رمز التحقق من بريدك الإلكتروني</h2>
            </td>
          </tr>

          <!-- Content -->
          <tr>
            <td style="padding: 16px 32px 8px; color: #4a4a5a; font-size: 15px; line-height: 1.7; text-align: right;">
              <p style="margin: 0 0 12px;">أهلاً <strong>${name}</strong>،</p>
              <p style="margin: 0 0 16px;">استخدمي الرمز التالي للتحقق من بريدك الإلكتروني:</p>
            </td>
          </tr>

          <!-- OTP Code -->
          <tr>
            <td style="padding: 0 32px 16px; text-align: center;">
              <div style="background: linear-gradient(135deg, ${BRAND_LIGHT}, #FFF0F3); border-radius: 16px; padding: 24px; margin: 8px 0;">
                <p style="margin: 0; font-size: 36px; font-weight: 800; letter-spacing: 12px; color: ${BRAND_COLOR}; font-family: 'Courier New', monospace;">${otp}</p>
                <p style="margin: 8px 0 0; font-size: 12px; color: #888;">صالح لمدة 10 دقائق</p>
              </div>
            </td>
          </tr>

          <!-- Warning -->
          <tr>
            <td style="padding: 0 32px 20px; text-align: right;">
              <p style="margin: 0; font-size: 13px; color: #999;">⚠️ لا تشاركي هذا الرمز مع أي شخص.</p>
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
              <p style="margin: 0 0 6px; font-size: 12px; color: #aaa;">© ${new Date().getFullYear()} Glamore — جميع الحقوق محفوظة</p>
              <a href="https://glamore.app" style="font-size: 12px; color: ${BRAND_COLOR}; text-decoration: none;">glamore.app</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");
    if (!RESEND_API_KEY) throw new Error("RESEND_API_KEY not configured");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Get auth token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Not authenticated" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseAdmin.auth.getUser(token);
    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const email = body.email || user.email;
    const name = body.name || user.user_metadata?.full_name || "عزيزتي";

    // Rate limit: max 3 OTPs per email in last 10 minutes
    const { data: recentOTPs } = await supabaseAdmin
      .from("email_verifications")
      .select("id")
      .eq("user_id", user.id)
      .gte("created_at", new Date(Date.now() - 10 * 60 * 1000).toISOString());

    if (recentOTPs && recentOTPs.length >= 3) {
      return new Response(JSON.stringify({ error: "Too many requests. Please wait." }), {
        status: 429,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Generate and store OTP
    const otp = generateOTP();
    const { error: insertError } = await supabaseAdmin.from("email_verifications").insert({
      user_id: user.id,
      email,
      otp_code: otp,
      expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString(),
    });

    if (insertError) {
      console.error("Insert OTP error:", insertError);
      throw new Error("Failed to create verification");
    }

    // Send email via Resend
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Glamore <onboarding@glamore.app>",
        to: [email],
        subject: "رمز التحقق — Glamore 🔐",
        html: getOTPEmailHTML(otp, name),
      }),
    });

    const result = await res.json();
    if (!res.ok) {
      console.error("Resend error:", result);
      throw new Error("Failed to send email");
    }

    console.log(`OTP sent to ${email}, resend_id=${result.id}`);
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("send-verification-otp error:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
