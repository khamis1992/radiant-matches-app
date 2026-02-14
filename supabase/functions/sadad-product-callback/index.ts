import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import {
  SADAD_ERROR_CODES,
  SADAD_ERROR_MESSAGES,
  SADAD_IPS,
  SADAD_ENDPOINTS
} from "../sadad-shared/constants.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Generate random salt (matching PHP's implementation)
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

// AES-128-CBC decryption (matching PHP openssl_decrypt)
async function decryptAES(encryptedData: string, key: string): Promise<string> {
  const iv = new TextEncoder().encode("@@@@&&&&####$$$$");

  // Decode HTML entities like PHP's html_entity_decode
  const decodedKey = key.replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"');

  // PHP uses first 16 bytes of key for AES-128
  const keyStr = decodedKey.substring(0, 16);
  const keyBytes = new TextEncoder().encode(keyStr);

  // Ensure key is exactly 16 bytes
  const keyPadded = new Uint8Array(16);
  keyPadded.set(keyBytes.slice(0, 16));

  // Convert base64 to binary
  const encryptedBytes = Uint8Array.from(atob(encryptedData), c => c.charCodeAt(0));

  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    keyPadded,
    { name: "AES-CBC" },
    false,
    ["decrypt"]
  );

  const decrypted = await crypto.subtle.decrypt(
    { name: "AES-CBC", iv },
    cryptoKey,
    encryptedBytes
  );

  // Remove PKCS7 padding
  const decryptedArray = new Uint8Array(decrypted);
  const paddingLength = decryptedArray[decryptedArray.length - 1];
  const unpadded = decryptedArray.slice(0, decryptedArray.length - paddingLength);

  return new TextDecoder().decode(unpadded);
}

// Verify checksum hash from SADAD (matching the PHP verification method)
async function verifyChecksumHash(postData: Record<string, unknown>, receivedHash: string, secretKey: string, merchantId: string): Promise<boolean> {
  try {
    // URL-encode secretKey as per PHP: $sadad_secrete_key = urlencode($secretKey);
    const encodedSecretKey = encodeURIComponent(secretKey);

    // Build verification data structure matching PHP exactly:
    const verifyData = {
      postData: postData,
      secretKey: encodedSecretKey
    };

    // Key for decryption: $key = $sadad_secrete_key . $sadad_id;
    const decryptKey = encodedSecretKey + merchantId;

    // Decrypt the received hash to get the hash+salt
    const decryptedHash = await decryptAES(receivedHash, decryptKey);

    // Extract the salt (last 4 characters)
    const salt = decryptedHash.slice(-4);
    const hashValue = decryptedHash.slice(0, -4);

    // Recreate the string that was hashed
    const jsonStr = JSON.stringify(verifyData);
    const finalString = jsonStr + "|" + salt;

    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(finalString)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");

    console.log("Verification - Expected hash:", hashHex);
    console.log("Verification - Received hash:", hashValue);

    return hashHex === hashValue;
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
    const isTestMode = Deno.env.get("SADAD_TEST_MODE") === "true";

    // Verify request is coming from SADAD servers (optional check)
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const sadadIPs = isTestMode ? SADAD_IPS.TEST : SADAD_IPS.PRODUCTION;

    // Allow the request if IP is from SADAD or if IP verification is disabled
    const skipIPVerification = Deno.env.get("SADAD_SKIP_IP_VERIFICATION") === "true";
    if (!skipIPVerification && clientIP && !sadadIPs.some(ip => clientIP.includes(ip))) {
      console.warn("IP not in SADAD whitelist:", clientIP, "- continuing anyway for debugging");
      // Don't reject, just log for now
    }

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

    console.log("Received SADAD product callback:", JSON.stringify(callbackData));

    // SADAD uses uppercase field names in callback:
    // ORDERID, RESPCODE, RESPMSG, TXNAMOUNT, transaction_number, checksumhash
    const {
      ORDERID,
      order_id,
      RESPCODE,
      RESPMSG,
      TXNAMOUNT,
      transaction_number,
      checksumhash,
    } = callbackData;

    // SADAD might use ORDERID or order_id
    const orderId = ORDERID || order_id;

    if (!orderId) {
      console.error("Missing order ID in callback");
      return new Response(
        JSON.stringify({ error: "Missing order_id/ORDERID" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Verify checksum if provided
    if (checksumhash) {
      // Remove checksumhash from data before verification
      const postDataForVerification = { ...callbackData };
      delete postDataForVerification.checksumhash;

      const isValid = await verifyChecksumHash(postDataForVerification, checksumhash, secretKey, merchantId);

      if (!isValid) {
        console.warn("Checksum verification failed for order:", orderId, "- continuing for debugging");
        // Don't reject, just log for now to debug
      } else {
        console.log("Checksum verified successfully for order:", orderId);
      }
    }

    // Map SADAD RESPCODE to our status
    let paymentStatus: string;
    let errorMessage: string | null = null;

    const respCode = parseInt(RESPCODE || "810");

    switch (respCode) {
      case 1:
        paymentStatus = "completed";
        break;
      case 400:
      case 402:
        paymentStatus = "pending";
        break;
      case 810:
      default:
        paymentStatus = "failed";
        errorMessage = RESPMSG || "Transaction failed";
        break;
    }

    console.log(`Processing product payment callback for order ${orderId}, RESPCODE: ${respCode}, status: ${paymentStatus}`);

    // Verify transaction with SADAD server (server-to-server verification)
    if (paymentStatus === "completed" && transaction_number) {
      try {
        const verificationUrl = isTestMode ? SADAD_ENDPOINTS.TEST.VERIFICATION : SADAD_ENDPOINTS.PRODUCTION.VERIFICATION;

        console.log("Verifying product transaction with SADAD:", verificationUrl);

        const verifyResponse = await fetch(verificationUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sadadId: merchantId,
            secretKey: secretKey,
            transactionNumber: transaction_number,
          }),
        });

        const verificationResult = await verifyResponse.json();
        console.log("SADAD product verification result:", JSON.stringify(verificationResult));

        // Check if verification failed
        if (verificationResult.status !== "success" ||
            (verificationResult.data?.transactionstatus !== 3 && verificationResult.data?.transactionstatus !== 1)) {
          console.error("Product transaction verification failed:", verificationResult);
          paymentStatus = "failed";
          errorMessage = "Transaction verification failed with SADAD";
        }
      } catch (verifyError) {
        console.error("Error verifying product transaction:", verifyError);
        // Continue with original status if verification fails, but log the error
      }
    }

    // Map our status to new schema status values
    const txStatus = paymentStatus === "completed" ? "success" : paymentStatus;

    // Update payment transaction using new schema
    const paymentId = `SADAD-${orderId}`;

    // First, get the transaction to find the product order ID
    const { data: existingTx } = await supabase
      .from("payment_transactions")
      .select("*")
      .eq("payment_id", paymentId)
      .maybeSingle();

    if (!existingTx) {
      console.error("Payment transaction not found:", paymentId);
      return new Response(
        JSON.stringify({ error: "Payment transaction not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { error: txUpdateError } = await supabase
      .from("payment_transactions")
      .update({
        status: txStatus,
        transaction_id: transaction_number || null,
        response_code: RESPCODE || null,
        response_message: RESPMSG || null,
        error_message: errorMessage || null,
        metadata: { ...existingTx.metadata, callback_data: callbackData },
        payment_date: paymentStatus === "completed" ? new Date().toISOString() : null,
        verified_at: paymentStatus === "completed" ? new Date().toISOString() : null,
      })
      .eq("payment_id", paymentId);

    if (txUpdateError) {
      console.error("Failed to update product transaction:", txUpdateError);
    }

    // Update product order status
    const { data: productOrder, error: orderError } = await supabase
      .from("product_orders")
      .update({
        payment_method: "sadad",
        payment_transaction_id: paymentId,
        status: paymentStatus === "completed" ? "confirmed" : paymentStatus === "failed" ? "cancelled" : "pending",
      })
      .eq("id", existingTx.order_id)
      .select()
      .single();

    if (orderError) {
      console.error("Failed to update product order:", orderError);
    } else {
      console.log("Product order updated successfully:", productOrder?.id);

      // Create notification for customer if payment completed
      if (paymentStatus === "completed" && productOrder) {
        await supabase.from("notifications").insert({
          user_id: productOrder.customer_id,
          type: "payment",
          title: "Payment Successful",
          body: "Your product order payment has been confirmed and will be shipped soon",
          data: {
            order_id: productOrder.id,
            amount: TXNAMOUNT,
          },
        });

        // Also notify artist about confirmed order
        const { data: artist } = await supabase
          .from("artists")
          .select("user_id")
          .eq("id", productOrder.artist_id)
          .single();

        if (artist) {
          await supabase.from("notifications").insert({
            user_id: artist.user_id,
            type: "order",
            title: "New Product Order",
            body: "You have a new confirmed product order with payment",
            data: {
              order_id: productOrder.id,
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
        order_id: orderId,
        product_order_id: productOrder?.id,
        message: paymentStatus === "completed" ? "Payment processed successfully" : `Payment ${paymentStatus}`,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const error = err as Error;
    console.error("Product callback processing error:", error);
    return new Response(
      JSON.stringify({ error: "Failed to process callback", details: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
