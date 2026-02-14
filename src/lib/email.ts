import { supabase } from "@/integrations/supabase/client";

type EmailType =
  | "welcome"
  | "booking_created"
  | "booking_confirmed"
  | "booking_cancelled"
  | "order_created"
  | "order_status_updated";

interface SendEmailParams {
  type: EmailType;
  to: string;
  data: Record<string, unknown>;
}

export const sendEmail = async ({ type, to, data }: SendEmailParams) => {
  try {
    const { data: result, error } = await supabase.functions.invoke("send-email", {
      body: { type, to, data },
    });

    if (error) {
      console.error("Email send error:", error);
      return { success: false, error };
    }

    return { success: true, data: result };
  } catch (err) {
    console.error("Email send exception:", err);
    return { success: false, error: err };
  }
};
