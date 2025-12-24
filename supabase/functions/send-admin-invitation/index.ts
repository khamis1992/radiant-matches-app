import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface InvitationRequest {
  email: string;
  role: "admin" | "artist";
  invitedBy: string;
}

const handler = async (req: Request): Promise<Response> => {
  console.log("send-admin-invitation function called");

  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { email, role, invitedBy }: InvitationRequest = await req.json();
    console.log(`Sending invitation to ${email} for role ${role}`);

    // Generate a unique token
    const token = crypto.randomUUID();

    // Store the invitation in the database
    const { data: invitation, error: dbError } = await supabase
      .from("admin_invitations")
      .insert({
        email,
        role,
        invited_by: invitedBy,
        token,
      })
      .select()
      .single();

    if (dbError) {
      console.error("Database error:", dbError);
      throw new Error(`Failed to create invitation: ${dbError.message}`);
    }

    console.log("Invitation created:", invitation.id);

    // Get the app URL from the request origin or use a default
    const origin = req.headers.get("origin") || "https://lovable.dev";
    const inviteLink = `${origin}/auth?invite=${token}`;

    const roleLabel = role === "admin" ? "مدير" : "فنانة";

    // Send the invitation email using Resend API directly
    const emailResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${RESEND_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "Glam App <onboarding@resend.dev>",
        to: [email],
        subject: `دعوة للانضمام كـ${roleLabel} في منصة Glam`,
        html: `
          <!DOCTYPE html>
          <html dir="rtl" lang="ar">
          <head>
            <meta charset="UTF-8">
            <style>
              body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; background-color: #f5f5f5; margin: 0; padding: 20px; }
              .container { max-width: 600px; margin: 0 auto; background-color: #ffffff; border-radius: 12px; padding: 40px; box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #ec4899; margin: 0; font-size: 28px; }
              .content { color: #333; line-height: 1.8; }
              .button { display: inline-block; background: linear-gradient(135deg, #ec4899, #f472b6); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
              .footer { margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #666; font-size: 14px; text-align: center; }
              .note { background-color: #fdf2f8; padding: 15px; border-radius: 8px; margin-top: 20px; color: #9d174d; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>💄 Glam App</h1>
              </div>
              <div class="content">
                <p>مرحباً،</p>
                <p>لقد تمت دعوتك للانضمام إلى منصة <strong>Glam</strong> بصفتك <strong>${roleLabel}</strong>.</p>
                <p>اضغط على الزر أدناه لقبول الدعوة وإنشاء حسابك:</p>
                <div style="text-align: center;">
                  <a href="${inviteLink}" class="button">قبول الدعوة</a>
                </div>
                <div class="note">
                  <strong>ملاحظة:</strong> هذه الدعوة صالحة لمدة 7 أيام فقط.
                </div>
              </div>
              <div class="footer">
                <p>إذا لم تطلب هذه الدعوة، يمكنك تجاهل هذا البريد.</p>
                <p>© ${new Date().getFullYear()} Glam App. جميع الحقوق محفوظة.</p>
              </div>
            </div>
          </body>
          </html>
        `,
      }),
    });

    const emailData = await emailResponse.json();
    
    if (!emailResponse.ok) {
      console.error("Email send error:", emailData);
      throw new Error(emailData.message || "Failed to send email");
    }

    console.log("Email sent successfully:", emailData);

    return new Response(
      JSON.stringify({ success: true, invitationId: invitation.id }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in send-admin-invitation function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
