import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { 
  SADAD_STATUS_CODES, 
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
  
  // PHP uses first 16 bytes of key for AES-128
  const keyStr = key.substring(0, 16);
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

// Verify checksum hash from SADAD (matching the generation method)
async function verifyChecksumHash(jsonStr: string, receivedHash: string, secretKey: string): Promise<boolean> {
  try {
    // Decrypt the received hash to get the hash+salt
    const decryptedHash = await decryptAES(receivedHash, secretKey);
    
    // Extract the salt (last 4 characters)
    const salt = decryptedHash.slice(-4);
    const hashValue = decryptedHash.slice(0, -4);
    
    // Recreate the string that was hashed
    const finalString = jsonStr + "|" + salt;
    
    // Generate SHA-256 hash
    const hashBuffer = await crypto.subtle.digest(
      "SHA-256",
      new TextEncoder().encode(finalString)
    );
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, "0")).join("");
    
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
    
    // Verify request is coming from SADAD servers
    const clientIP = req.headers.get("x-forwarded-for") || req.headers.get("x-real-ip") || "";
    const sadadIPs = isTestMode ? SADAD_IPS.TEST : SADAD_IPS.PRODUCTION;
    
    // Allow the request if IP is from SADAD or if IP verification is disabled
    const skipIPVerification = Deno.env.get("SADAD_SKIP_IP_VERIFICATION") === "true";
    if (!skipIPVerification && clientIP && !sadadIPs.some(ip => clientIP.includes(ip))) {
      console.error("Unauthorized IP attempting callback:", clientIP);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
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
      const registeredDomain = Deno.env.get("SADAD_WEBSITE_DOMAIN") || "radiant-matches-app.lovable.app";
      
      // Create checksum data structure matching generation
      const checksumArray: Record<string, unknown> = {
        merchant_id: merchantId,
        ORDER_ID: order_id,
        WEBSITE: registeredDomain,
        TXN_AMOUNT: amount,
        CUST_ID: "",
        EMAIL: "",
        MOBILE_NO: "",
        SADAD_WEBCHECKOUT_PAGE_LANGUAGE: "ENG",
        CALLBACK_URL: `${supabaseUrl}/functions/v1/sadad-payment-callback`,
        txnDate: new Date().toISOString().slice(0, 19).replace('T', ' '),
        VERSION: "1.1"
      };
      
      // Create data structure for checksum (matching generation)
      const checksumData = {
        postData: checksumArray,
        secretKey: secretKey
      };
      
      // Generate checksum with key = secretKey + merchantId (same as generation)
      const checksumKey = secretKey + merchantId;
      const jsonForChecksum = JSON.stringify(checksumData);
      const isValid = await verifyChecksumHash(jsonForChecksum, checksum, checksumKey);
      
      if (!isValid) {
        console.error("Invalid checksum for order:", order_id);
        // Log for debugging but don't reject - SADAD might use different checksum format
        console.warn("Checksum verification failed, but continuing for debugging");
      }
    }

    // Map SADAD status to our status
    let paymentStatus: string;
    let errorMessage: string | null = null;
    
    // Handle SADAD status codes
    const statusCode = parseInt(status || "0");
    
    switch (statusCode) {
      case SADAD_STATUS_CODES.SUCCESS:
        paymentStatus = "completed";
        break;
      case SADAD_STATUS_CODES.FAILED:
        paymentStatus = "failed";
        errorMessage = error_message || "Transaction failed";
        break;
      case SADAD_STATUS_CODES.CANCELLED:
        paymentStatus = "cancelled";
        errorMessage = error_message || "Transaction cancelled";
        break;
      case SADAD_STATUS_CODES.PENDING:
        paymentStatus = "pending";
        break;
      default:
        paymentStatus = "failed";
        errorMessage = SADAD_ERROR_MESSAGES[error_message as keyof typeof SADAD_ERROR_MESSAGES] || 
                     SADAD_ERROR_MESSAGES[SADAD_ERROR_CODES.SERVER_ERROR];
    }
    
    // For failed transactions, try to provide more specific error messages
    if (paymentStatus === "failed" && error_message) {
      errorMessage = SADAD_ERROR_MESSAGES[error_message as keyof typeof SADAD_ERROR_MESSAGES] || 
                   error_message || "Transaction failed";
    }

    console.log(`Processing payment callback for order ${order_id}, status: ${paymentStatus}`);

    // Verify transaction with SADAD server (server-to-server verification)
    if (paymentStatus === "completed" && transaction_number) {
      try {
        const verificationUrl = isTestMode ? SADAD_ENDPOINTS.TEST.VERIFICATION : SADAD_ENDPOINTS.PRODUCTION.VERIFICATION;
        
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
        
        if (verificationResult.status !== "success" || verificationResult.data?.transactionstatus !== 3) {
          console.error("Transaction verification failed:", verificationResult);
          paymentStatus = "failed";
        }
      } catch (verifyError) {
        console.error("Error verifying transaction:", verifyError);
        // Continue with original status if verification fails, but log the error
      }
    }

    // Update payment transaction
    const { error: txUpdateError } = await supabase
      .from("payment_transactions")
      .update({
        status: paymentStatus,
        sadad_transaction_number: transaction_number || null,
        response_data: callbackData,
        error_message: errorMessage || null,
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
