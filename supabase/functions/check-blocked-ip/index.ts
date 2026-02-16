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
    // Extract IP from headers
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip") ||
      "unknown";

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Optionally save IP to user profile
    let body: any = {};
    try {
      body = await req.json();
    } catch { /* no body */ }

    if (body.userId && ip !== "unknown") {
      await supabase
        .from("profiles")
        .update({ last_ip: ip, last_ip_at: new Date().toISOString() })
        .eq("id", body.userId);
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
        JSON.stringify({ blocked: false, ip }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const blocked = data && data.length > 0;

    return new Response(
      JSON.stringify({ blocked, ip, reason: blocked ? data[0].reason : null }),
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
