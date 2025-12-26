import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate random salt
function generateSalt(length: number): string {
  const chars = "AbcDE123IJKLMN67QRSTUVWXYZaBCdefghijklmn123opq45rs67tuv89wxyz0FGH45OP89";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// AES-128-CBC encryption for checksum
async function encryptAES(input: string, key: string): Promise<string> {
  const iv = new TextEncoder().encode("@@@@&&&&####$$$$");
  const keyBytes = new TextEncoder().encode(key.substring(0, 16).padEnd(16, '\0'));
  const inputBytes = new TextEncoder().encode(input);
  
  // Pad input to 16-byte blocks (PKCS7)
  const blockSize = 16;
  const padLength = blockSize - (inputBytes.length % blockSize);
  const paddedInput = new Uint8Array(inputBytes.length + padLength);
  paddedInput.set(inputBytes);
  for (let i = inputBytes.length; i < paddedInput.length; i++) {
    paddedInput[i] = padLength;
  }
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyBytes,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    paddedInput
  );
  
  // Convert to base64
  const base64 = btoa(String.fromCharCode(...new Uint8Array(encrypted)));
  return base64;
}

// Generate checksumhash for SADAD (matching PHP implementation)
async function generateChecksumFromString(str: string, key: string): Promise<string> {
  const salt = generateSalt(4);
  const finalString = str + "|" + salt;
  
  // SHA-256 hash
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(finalString)
  );
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
  
  const hashString = hashHex + salt;
  const checksum = await encryptAES(hashString, key);
  
  return checksum;
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
      .select("*, services(name)")
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
    const orderId = `ORD${Date.now()}`;
    const amount = booking.total_price.toFixed(2);
    const txnDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const callbackUrl = `${supabaseUrl}/functions/v1/sadad-payment-callback`;
    const serviceName = booking.services?.name || "Booking Service";

    // Create payment transaction record
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        booking_id: booking_id,
        amount: booking.total_price,
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

    // Build the checksum data object (matching PHP structure)
    const checksumArray: Record<string, unknown> = {
      merchant_id: merchantId,
      ORDER_ID: orderId,
      WEBSITE: "lovable.dev",
      TXN_AMOUNT: amount,
      CUST_ID: customer_email || "",
      EMAIL: customer_email || "",
      MOBILE_NO: customer_phone?.replace(/\D/g, '') || "00000000",
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
      CALLBACK_URL: callbackUrl,
      txnDate: txnDate,
      productdetail: [
        {
          order_id: orderId,
          itemname: serviceName,
          amount: amount,
          quantity: "1",
          type: "line_item"
        }
      ]
    };

    // Create checksum data structure
    const checksumData = {
      postData: checksumArray,
      secretKey: secretKey
    };

    // Generate checksumhash
    const checksumKey = secretKey + merchantId;
    const checksumhash = await generateChecksumFromString(
      JSON.stringify(checksumData),
      checksumKey
    );

    console.log("Payment initiated successfully, order:", orderId);

    // Return form data for SADAD redirect
    const paymentData = {
      merchant_id: merchantId,
      ORDER_ID: orderId,
      WEBSITE: "lovable.dev",
      TXN_AMOUNT: amount,
      CUST_ID: customer_email || "",
      EMAIL: customer_email || "",
      MOBILE_NO: customer_phone?.replace(/\D/g, '') || "00000000",
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
      CALLBACK_URL: callbackUrl,
      txnDate: txnDate,
      VERSION: "1.1",
      productdetail: [
        {
          order_id: orderId,
          itemname: serviceName,
          amount: amount,
          quantity: "1",
          type: "line_item"
        }
      ],
      checksumhash: checksumhash,
      return_url: return_url || "",
      transaction_id: transaction.id,
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
