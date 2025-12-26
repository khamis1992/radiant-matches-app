import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate checksum hash for SADAD
async function generateChecksumHash(data: string, secretKey: string): Promise<string> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secretKey);
  const messageData = encoder.encode(data);
  
  const key = await crypto.subtle.importKey(
    "raw",
    keyData,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  
  const signature = await crypto.subtle.sign("HMAC", key, messageData);
  return Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
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

    if (!merchantId || !secretKey) {
      console.error("SADAD credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { booking_id, customer_email, customer_phone, customer_name, return_url } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Initiating payment for booking:", booking_id);

    // Fetch booking details
    const { data: booking, error: bookingError } = await supabase
      .from("bookings")
      .select("*")
      .eq("id", booking_id)
      .single();

    if (bookingError || !booking) {
      console.error("Booking not found:", bookingError);
      return new Response(
        JSON.stringify({ error: "Booking not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order ID
    const orderId = `ORD-${booking_id.substring(0, 8)}-${Date.now()}`;
    const amount = booking.total_price;

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        booking_id: booking_id,
        amount: amount,
        currency: "QAR",
        status: "pending",
        payment_method: "sadad",
        sadad_order_id: orderId,
      })
      .select()
      .single();

    if (txError) {
      console.error("Failed to create transaction:", txError);
      return new Response(
        JSON.stringify({ error: "Failed to create payment transaction" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Update booking with SADAD order ID
    await supabase
      .from("bookings")
      .update({
        payment_method: "sadad",
        payment_status: "processing",
        sadad_order_id: orderId,
      })
      .eq("id", booking_id);

    // Prepare SADAD payment data
    const callbackUrl = `${supabaseUrl}/functions/v1/sadad-payment-callback`;
    
    // Build checksum string (as per SADAD documentation)
    const checksumData = `${merchantId}|${orderId}|${amount.toFixed(2)}|QAR|${customer_email || ""}|${customer_phone || ""}`;
    const checksumHash = await generateChecksumHash(checksumData, secretKey);

    console.log("Payment initiated successfully, order:", orderId);

    // Return form data for SADAD redirect
    const paymentData = {
      merchant_id: merchantId,
      order_id: orderId,
      amount: amount.toFixed(2),
      currency: "QAR",
      customer_email: customer_email || "",
      customer_phone: customer_phone || "",
      customer_name: customer_name || "",
      description: `Booking payment for order ${orderId}`,
      callback_url: callbackUrl,
      return_url: return_url || "",
      checksum: checksumHash,
      transaction_id: transaction.id,
      // SADAD sandbox URL for testing, change to production URL in production
      payment_url: "https://sadadqa.com/webpurchase",
    };

    return new Response(
      JSON.stringify({ success: true, data: paymentData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Payment initiation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate payment", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
