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
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Authentication required" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const { imageUrl, sourceType, sourceId, userId } = await req.json();
    if (!imageUrl || !sourceType || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const publishableKey = JSON.parse(Deno.env.get("SUPABASE_PUBLISHABLE_KEYS") ?? "{}")["default"] ?? Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceKey = JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}")["default"] ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const requester = createClient(supabaseUrl, publishableKey, { global: { headers: { Authorization: authHeader } } });
    const { data: claimsData, error: claimsError } = await requester.auth.getClaims(authHeader.replace("Bearer ", ""));
    const requesterId = claimsData?.claims?.sub;
    if (claimsError || !requesterId) {
      return new Response(
        JSON.stringify({ error: "Invalid authentication" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const admin = createClient(supabaseUrl, serviceKey);
    const { data: role } = await admin
      .from("user_roles")
      .select("role")
      .eq("user_id", requesterId)
      .eq("role", "admin")
      .maybeSingle();
    if (requesterId !== userId && !role) {
      return new Response(
        JSON.stringify({ error: "Not authorized to submit this image for moderation" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // DeepSeek is configured for text operations only. Every uploaded image is
    // deliberately sent to the existing manual review queue rather than an
    // undocumented image endpoint.
    const { error: queueError } = await admin.from("image_moderation_queue").insert({
      image_url: imageUrl,
      source_type: sourceType,
      source_id: sourceId ?? null,
      user_id: userId,
      ai_flagged: false,
      ai_confidence: 0,
      ai_reason: "Queued for manual review; automated image analysis is disabled.",
      status: "pending",
    });
    if (queueError) {
      throw queueError;
    }

    if (sourceType === "portfolio" && sourceId) {
      await admin
        .from("portfolio_items")
        .update({ moderation_status: "pending", moderation_reason: "Queued for manual review" })
        .eq("id", sourceId)
        .eq("user_id", userId);
    }

    return new Response(
      JSON.stringify({ status: "pending", flagged: false, reason: "Queued for manual review", confidence: 0 }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: "Unable to queue image for review" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
