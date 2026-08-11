import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SADAD_ENDPOINTS } from "../sadad-shared/constants.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// Generate random salt (matching PHP's implementation exactly)
function generateSalt(length: number): string {
  const chars = "AbcDE123IJKLMN67QRSTUVWXYZaBCdefghijklmn123opq45rs67tuv89wxyz0FGH45OP89";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

// PKCS7 padding
function pkcs7Pad(data: Uint8Array, blockSize: number): Uint8Array {
  const padding = blockSize - (data.length % blockSize);
  const padded = new Uint8Array(data.length + padding);
  padded.set(data);
  for (let i = data.length; i < padded.length; i++) {
    padded[i] = padding;
  }
  return padded;
}

// Convert Uint8Array to base64 string
function uint8ArrayToBase64(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

// AES-128-CBC encryption (matching PHP openssl_encrypt with OPENSSL_ZERO_PADDING disabled - default)
async function encryptAES(input: string, key: string): Promise<string> {
  const iv = new TextEncoder().encode("@@@@&&&&####$$$$");
  
  // Decode HTML entities like PHP's html_entity_decode (for the key)
  const decodedKey = key.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');
  
  // PHP uses first 16 bytes of key for AES-128
  const keyStr = decodedKey.substring(0, 16);
  const keyBytes = new TextEncoder().encode(keyStr);
  
  // Ensure key is exactly 16 bytes
  const keyPadded = new Uint8Array(16);
  keyPadded.set(keyBytes.slice(0, 16));
  
  const inputBytes = new TextEncoder().encode(input);
  const paddedInput = pkcs7Pad(inputBytes, 16);
  
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyPadded,
    { name: "AES-CBC" },
    false,
    ["encrypt"]
  );
  
  // Create a new ArrayBuffer copy to avoid SharedArrayBuffer issues
  const dataBuffer = new ArrayBuffer(paddedInput.length);
  new Uint8Array(dataBuffer).set(paddedInput);
  
  const encrypted = await crypto.subtle.encrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    dataBuffer
  );
  
  return uint8ArrayToBase64(new Uint8Array(encrypted));
}

// Generate checksumhash for SADAD (matching PHP implementation exactly)
async function generateChecksumFromString(jsonStr: string, key: string): Promise<string> {
  const salt = generateSalt(4);
  const finalString = jsonStr + "|" + salt;
  
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

// PHP's json_encode escapes forward slashes by default, which affects the checksum string.
// SADAD docs for Web Checkout 2.1 use json_encode(), so we mimic that behavior here.
function phpJsonEncode(value: unknown): string {
  return JSON.stringify(value).replace(/\//g, "\\/");
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const merchantId = Deno.env.get("SADAD_MERCHANT_ID")!;
    const secretKey = Deno.env.get("SADAD_SECRET_KEY")!;
    const isTestMode = Deno.env.get("SADAD_TEST_MODE") === "true";

    if (!merchantId || !secretKey) {
      console.error("SADAD credentials not configured");
      return new Response(
        JSON.stringify({ error: "Payment gateway not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Authenticate the caller — only the booking's owner may initiate its payment
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const userClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await userClient.auth.getUser(token);
    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { booking_id, customer_email, customer_phone, customer_name, return_url } = await req.json();

    if (!booking_id) {
      return new Response(
        JSON.stringify({ error: "booking_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Initiating payment for booking:", booking_id);

    // Fetch booking details with service info
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

    // IDOR guard: the caller must own this booking
    if (booking.customer_id !== user.id) {
      console.warn(`User ${user.id} attempted to pay for booking ${booking_id} owned by ${booking.customer_id}`);
      return new Response(
        JSON.stringify({ error: "Forbidden" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Do not restart an already-paid booking
    if (booking.payment_status === "completed") {
      return new Response(
        JSON.stringify({ error: "Booking is already paid" }),
        { status: 409, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order ID
    const orderId = String(Date.now());
    const amount = booking.total_price.toFixed(2);
    const txnDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const callbackUrl = `${supabaseUrl}/functions/v1/sadad-payment-callback`;
    const serviceName = booking.services?.name || "Booking Service";
    const mobileNo = (customer_phone?.replace(/\D/g, '') || "00000000");
    const email = customer_email || "";
    const returnUrl = return_url || "";

    // Create payment transaction record using new schema
    const paymentId = `SADAD-${orderId}`;
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: booking_id,
        payment_id: paymentId,
        payment_method: "sadad",
        amount: booking.total_price,
        currency: "QAR",
        status: "initiated",
        metadata: { customer_email: email, customer_phone: mobileNo, customer_name: customer_name },
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

    // Update booking with payment info
    await supabase
      .from("bookings")
      .update({
        payment_method: "sadad",
        payment_status: "processing",
        sadad_order_id: orderId,
        payment_transaction_id: paymentId,
      })
      .eq("id", booking_id);

    // Get registered domain from environment or use default (updated for Vercel deployment)
    const registeredDomain = Deno.env.get("SADAD_WEBSITE_DOMAIN") || "radiant-matches-app.vercel.app";

    // Build checksum array matching PHP structure exactly
    // Following: https://developer.sadad.qa/ Web Checkout 2.1
    const checksumArray: Record<string, unknown> = {
      merchant_id: merchantId,
      ORDER_ID: orderId,
      WEBSITE: registeredDomain,
      TXN_AMOUNT: amount,
      CUST_ID: email,
      EMAIL: email,
      MOBILE_NO: mobileNo,
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
      CALLBACK_URL: callbackUrl,
      txnDate: txnDate,
      VERSION: "1.1",
      // productdetail structure as per PHP documentation
      productdetail: [
        {
          order_id: orderId,
          itemname: serviceName,
          amount: amount,
          quantity: "1",
          type: "line_item",
        },
      ],
    };

    // Checksum generation (Web Checkout 2.1)
    // Based on SADAD PHP sample, the secretKey used in the array is the raw key.
    const checksumData = {
      postData: checksumArray,
      secretKey: secretKey,
    };

    const checksumKey = secretKey + merchantId;
    const jsonForChecksum = phpJsonEncode(checksumData);

    const checksumhash = await generateChecksumFromString(jsonForChecksum, checksumKey);

    console.log("Payment initiated successfully, order:", orderId);

    // Return form data for SADAD redirect
    // Form structure as per SADAD documentation: https://developer.sadad.qa/
    const paymentData = {
      merchant_id: merchantId,
      ORDER_ID: orderId,
      WEBSITE: registeredDomain,
      TXN_AMOUNT: amount,
      CUST_ID: email,
      EMAIL: email,
      MOBILE_NO: mobileNo,
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
      CALLBACK_URL: callbackUrl,
      txnDate: txnDate,
      VERSION: "1.1",
      // productdetail will be formatted as productdetail[0][key] in the form
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
      transaction_id: transaction.id,
      payment_url: isTestMode ? SADAD_ENDPOINTS.TEST.PAYMENT : SADAD_ENDPOINTS.PRODUCTION.PAYMENT,
    };

    return new Response(
      JSON.stringify({ success: true, data: paymentData }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Payment initiation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate payment" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
