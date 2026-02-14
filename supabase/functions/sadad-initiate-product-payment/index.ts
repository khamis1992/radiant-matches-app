import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { SADAD_ENDPOINTS } from "../sadad-shared/constants.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

// AES-128-CBC encryption (matching PHP openssl_encrypt)
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
    const { order_id, customer_email, customer_phone, customer_name, return_url } = await req.json();

    if (!order_id) {
      return new Response(
        JSON.stringify({ error: "order_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Initiating payment for product order:", order_id);

    // Fetch product order details
    const { data: order, error: orderError } = await supabase
      .from("product_orders")
      .select("*, items")
      .eq("id", order_id)
      .single();

    if (orderError || !order) {
      console.error("Product order not found:", orderError);
      return new Response(
        JSON.stringify({ error: "Product order not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Generate unique order ID for Sadad
    const sadadOrderId = `PROD-${String(Date.now())}`;
    const amount = order.total_qar.toFixed(2);
    const txnDate = new Date().toISOString().slice(0, 19).replace('T', ' ');
    const callbackUrl = `${supabaseUrl}/functions/v1/sadad-product-callback`;

    // Build order description from items
    const items = order.items as unknown as Array<{ product_title: string; quantity: number; price: number }>;
    const itemNames = items?.map(i => i.product_title).join(", ") || "Products";
    const mobileNo = (customer_phone?.replace(/\D/g, '') || "00000000");
    const email = customer_email || "";
    const returnUrl = return_url || "";

    // Create payment transaction record
    const paymentId = `SADAD-${sadadOrderId}`;
    const { data: transaction, error: txError } = await supabase
      .from("payment_transactions")
      .insert({
        order_id: order_id,
        payment_id: paymentId,
        payment_method: "sadad",
        amount: order.total_qar,
        currency: "QAR",
        status: "initiated",
        metadata: {
          customer_email: email,
          customer_phone: mobileNo,
          customer_name: customer_name,
          sadad_order_id: sadadOrderId,
          order_type: "product"
        },
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

    // Update product order with payment info
    await supabase
      .from("product_orders")
      .update({
        payment_method: "sadad",
        payment_transaction_id: paymentId,
        status: "processing",
      })
      .eq("id", order_id);

    // Get registered domain from environment or use default
    const registeredDomain = Deno.env.get("SADAD_WEBSITE_DOMAIN") || "radiant-matches-app.vercel.app";

    // Build product detail items
    const productdetailItems = items?.map((item, index) => ({
      order_id: sadadOrderId,
      itemname: item.product_title,
      amount: item.price.toFixed(2),
      quantity: String(item.quantity),
      type: "line_item",
    })) || [{
      order_id: sadadOrderId,
      itemname: itemNames,
      amount: amount,
      quantity: "1",
      type: "line_item",
    }];

    // Build checksum array matching PHP structure exactly
    const checksumArray: Record<string, unknown> = {
      merchant_id: merchantId,
      ORDER_ID: sadadOrderId,
      WEBSITE: registeredDomain,
      TXN_AMOUNT: amount,
      CUST_ID: email,
      EMAIL: email,
      MOBILE_NO: mobileNo,
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
      CALLBACK_URL: callbackUrl,
      txnDate: txnDate,
      VERSION: "1.1",
      productdetail: productdetailItems,
    };

    // Checksum generation (Web Checkout 2.1)
    const checksumData = {
      postData: checksumArray,
      secretKey: secretKey,
    };

    const checksumKey = secretKey + merchantId;
    const jsonForChecksum = phpJsonEncode(checksumData);

    console.log("Product payment initiated successfully, sadad order:", sadadOrderId);
    console.log("Checksum JSON length:", jsonForChecksum.length);
    console.log("Checksum Key (first 10 chars):", checksumKey.substring(0, 10) + "...");

    const checksumhash = await generateChecksumFromString(jsonForChecksum, checksumKey);

    console.log("Generated checksumhash successfully");

    // Return form data for SADAD redirect
    const paymentData = {
      merchant_id: merchantId,
      ORDER_ID: sadadOrderId,
      WEBSITE: registeredDomain,
      TXN_AMOUNT: amount,
      CUST_ID: email,
      EMAIL: email,
      MOBILE_NO: mobileNo,
      SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
      CALLBACK_URL: callbackUrl,
      txnDate: txnDate,
      VERSION: "1.1",
      productdetail: productdetailItems,
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
    console.error("Product payment initiation error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to initiate payment", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
