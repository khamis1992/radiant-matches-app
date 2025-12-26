import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Verify checksum hash from SADAD
async function verifyChecksumHash(data: string, receivedHash: string, secretKey: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(data);
  
  try {
    const key = await crypto.subtle.importKey(
      "raw",
      keyData,
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"]
    );
    
    const signature = await crypto.subtle.sign("HMAC", key, messageData);
    const calculatedHash = Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, "0"))
      .join("");
    
    return calculatedHash.toLowerCase() === receivedHash.toLowerCase();
  } catch (error) {
    console.error("Checksum verification error:", error);
    return false;
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const merchantId = Deno.env.get("SADAD_MERCHANT_ID")!;
    const secretKey = Deno.env.get("SADAD_SECRET_KEY")!;

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Parse callback data (could be POST body or URL params)
    let callbackData: Record<string, string> = {};
    
    if (req.method === "POST") {
      const contentType = req.headers.get("content-type") || "";
      if (contentType.includes("application/json")) {
        callbackData = await req.json();
      } else if (contentType.includes("application/x-www-form-urlencoded")) {
        const formData = await req.formData();
        formData.forEach((value, key) => {
          callbackData[key] = value.toString();
        });
      }
    } else if (req.method === "GET") {
      const url = new URL(req.url);
      url.searchParams.forEach((value, key) => {
        callbackData[key] = value;
      });
    }

    console.log("Received SADAD callback:", JSON.stringify(callbackData));

    const {
      order_id,
      transaction_number,
      status,
      amount,
      checksum,
      error_message,
    } = callbackData;

    if (!order_id) {
      console.error("Missing order_id in callback");
      return new Response(
        JSON.stringify({ error: "Missing order_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify checksum if provided
    if (checksum) {
      const checksumData = `${merchantId}|${order_id}|${amount || ""}|${status || ""}`;
      const isValid = await verifyChecksumHash(checksumData, checksum, secretKey);
      
      if (!isValid) {
        console.error("Invalid checksum for order:", order_id);
        return new Response(
          JSON.stringify({ error: "Invalid checksum" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Map SADAD status to our status
    let paymentStatus: string;
    switch (status?.toLowerCase()) {
      case "success":
      case "completed":
        paymentStatus = "completed";
        break;
      case "failed":
      case "error":
        paymentStatus = "failed";
        break;
      case "cancelled":
        paymentStatus = "cancelled";
        break;
      default:
        paymentStatus = "failed";
    }

    console.log(`Processing payment callback for order ${order_id}, status: ${paymentStatus}`);

    // Update payment transaction
    const { error: txUpdateError } = await supabase
      .from("payment_transactions")
      .update({
        status: paymentStatus,
        sadad_transaction_number: transaction_number || null,
        response_data: callbackData,
        error_message: error_message || null,
        updated_at: new Date().toISOString(),
      })
      .eq("sadad_order_id", order_id);

    if (txUpdateError) {
      console.error("Failed to update transaction:", txUpdateError);
    }

    // Update booking status
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .update({
        payment_status: paymentStatus,
        sadad_transaction_id: transaction_number || null,
        status: paymentStatus === "completed" ? "confirmed" : "pending",
      })
      .eq("sadad_order_id", order_id)
      .select()
      .single();

    if (bookingError) {
      console.error("Failed to update booking:", bookingError);
    } else {
      console.log("Booking updated successfully:", booking?.id);

      // Create notification for customer if payment completed
      if (paymentStatus === "completed" && booking) {
        await supabase.from("notifications").insert({
          user_id: booking.customer_id,
          type: "payment",
          title: "تم الدفع بنجاح",
          body: "تم تأكيد دفعتك وحجزك بنجاح",
          data: {
            booking_id: booking.id,
            amount: amount,
          },
        });

        // Also notify artist about confirmed booking
        const { data: artist } = await supabase
          .from("artists")
          .select("user_id")
          .eq("id", booking.artist_id)
          .single();

        if (artist) {
          await supabase.from("notifications").insert({
            user_id: artist.user_id,
            type: "booking",
            title: "حجز جديد مؤكد",
            body: "تم استلام حجز جديد مع دفع إلكتروني",
            data: {
              booking_id: booking.id,
            },
          });
        }
      }
    }

    // Return success response
    return new Response(
      JSON.stringify({ 
        success: true, 
        status: paymentStatus,
        order_id: order_id,
        booking_id: booking?.id,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Callback processing error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process callback", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
