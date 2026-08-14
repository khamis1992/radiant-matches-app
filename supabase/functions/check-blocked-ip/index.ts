import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Extract IP from various headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      req.headers.get("cf-connecting-ip") ||
      req.headers.get("x-client-ip") ||
      req.headers.get("true-client-ip") ||
      "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optional event type from body (audit label only; identity comes from JWT)
    let eventType = "login";
    let metadata: Record<string, unknown> = {};
    try {
      const body = await req.json();
      if (typeof body?.eventType === "string") eventType = body.eventType;
      if (body?.metadata && typeof body.metadata === "object") metadata = body.metadata;
    } catch { /* no body */ }

    // Resolve the user from the JWT when present. Writes (profile IP, audit
    // log) only happen for authenticated callers — identity must come from
    // the token, never from the request body (body userId/email are spoofable).
    // Unauthenticated callers (pre-login IP/country check) get the check only.
    let userId: string | null = null;
    let userEmail: string | null = null;
    let userName: string | null = null;
    const authHeader = req.headers.get("Authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const { data: { user }, error: userError } = await supabase.auth.getUser(authHeader.replace("Bearer ", ""));
      if (!userError && user) {
        userId = user.id;
        userEmail = user.email || null;
        userName = user.user_metadata?.full_name || null;
      }
    }

    // Save IP to user profile (authenticated callers only)
    if (userId) {
      await supabase
        .from("profiles")
        .update({ last_ip: ip, last_ip_at: new Date().toISOString() })
        .eq("id", userId);
    }

    // Detect country from IP using free geolocation API
    let country_code: string | null = null;
    if (ip !== "unknown") {
      try {
        const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=countryCode,status`);
        if (geoResponse.ok) {
          const geoData = await geoResponse.json();
          if (geoData.status === "success") {
            country_code = geoData.countryCode;
          }
        }
      } catch (geoErr) {
        console.error("Geolocation lookup failed:", geoErr);
      }
    }

    // Log to permanent security audit log (authenticated callers only)
    if (userId) {
      await supabase.from("security_audit_log").insert({
        event_type: eventType,
        user_id: userId,
        email: userEmail,
        full_name: userName,
        ip_address: ip,
        user_agent: req.headers.get("user-agent") || null,
        country_code: country_code,
        metadata: metadata,
      });
    }

    // Only check blocked IPs if we have a real IP
    if (ip === "unknown") {
      return new Response(
        JSON.stringify({ blocked: false, ip, country_code }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const { data, error } = await supabase
      .from("blocked_ips")
      .select("id, reason")
      .eq("ip_address", ip)
      .eq("is_active", true)
      .limit(1);

    if (error) {
      console.error("Error checking blocked IP:", error);
      return new Response(
        JSON.stringify({ blocked: false, ip, country_code }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blocked = data && data.length > 0;

    // Blocked users are signed out client-side; the response carries the flag.
    return new Response(
      JSON.stringify({ blocked, ip, country_code, reason: blocked ? data[0].reason : null }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("check-blocked-ip error:", err);
    return new Response(
      JSON.stringify({ blocked: false, error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
