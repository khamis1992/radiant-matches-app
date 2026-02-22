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
    const { imageUrl, sourceType, sourceId, userId } = await req.json();

    if (!imageUrl || !sourceType || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY not configured");
      return new Response(
        JSON.stringify({ error: "AI service not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // Use Gemini Vision to analyze the image
    console.log(`Analyzing image for moderation: ${imageUrl}`);
    
    const aiResponse = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          {
            role: "system",
            content: `You are an image content moderator for a beauty and makeup services platform called Glamore in Qatar.
Your job is to analyze uploaded images and flag any inappropriate content.

Flag images that contain:
- Nudity or sexually explicit content
- Violence or gore
- Hate symbols or offensive content
- Drug or alcohol promotion
- Content unrelated to beauty/makeup services (spam)

Do NOT flag:
- Professional makeup/beauty photos
- Bridal makeup photos
- Hair styling photos
- Nail art photos
- Henna designs
- Natural/editorial makeup looks
- Product photos for beauty items
- Professional headshots/portraits

Respond using the provided tool.`
          },
          {
            role: "user",
            content: [
              { type: "text", text: "Analyze this image for inappropriate content. Is it safe for a beauty/makeup platform?" },
              { type: "image_url", image_url: { url: imageUrl } }
            ]
          }
        ],
        tools: [
          {
            type: "function",
            function: {
              name: "moderation_result",
              description: "Return the moderation result for the image",
              parameters: {
                type: "object",
                properties: {
                  is_safe: { type: "boolean", description: "true if the image is safe and appropriate" },
                  confidence: { type: "number", description: "Confidence score from 0.0 to 1.0" },
                  reason: { type: "string", description: "Brief explanation in Arabic" },
                  category: { type: "string", enum: ["safe", "nudity", "violence", "hate", "spam", "other"], description: "Category of the issue if flagged" }
                },
                required: ["is_safe", "confidence", "reason", "category"],
                additionalProperties: false
              }
            }
          }
        ],
        tool_choice: { type: "function", function: { name: "moderation_result" } },
      }),
    });

    if (!aiResponse.ok) {
      const errText = await aiResponse.text();
      console.error("AI moderation error:", aiResponse.status, errText);
      
      // On AI failure, default to pending for manual review
      const { error: insertError } = await supabase
        .from("image_moderation_queue")
        .insert({
          image_url: imageUrl,
          source_type: sourceType,
          source_id: sourceId,
          user_id: userId,
          ai_flagged: false,
          ai_confidence: 0,
          ai_reason: "AI analysis failed - queued for manual review",
          status: "pending",
        });

      if (insertError) console.error("Insert error:", insertError);

      return new Response(
        JSON.stringify({ status: "pending", reason: "AI analysis unavailable" }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const aiData = await aiResponse.json();
    let moderationResult = { is_safe: true, confidence: 0.5, reason: "Unable to parse", category: "safe" };

    try {
      const toolCall = aiData.choices?.[0]?.message?.tool_calls?.[0];
      if (toolCall?.function?.arguments) {
        moderationResult = JSON.parse(toolCall.function.arguments);
      }
    } catch (parseErr) {
      console.error("Failed to parse AI response:", parseErr);
    }

    console.log("Moderation result:", moderationResult);

    const isFlagged = !moderationResult.is_safe;
    const status = isFlagged ? "pending" : "approved";

    // Insert into moderation queue
    const { error: insertError } = await supabase
      .from("image_moderation_queue")
      .insert({
        image_url: imageUrl,
        source_type: sourceType,
        source_id: sourceId,
        user_id: userId,
        ai_flagged: isFlagged,
        ai_confidence: moderationResult.confidence,
        ai_reason: moderationResult.reason,
        status,
      });

    if (insertError) {
      console.error("Insert moderation queue error:", insertError);
    }

    // Update source item moderation status
    if (sourceType === "portfolio" && sourceId) {
      await supabase
        .from("portfolio_items")
        .update({
          moderation_status: status,
          moderation_reason: isFlagged ? moderationResult.reason : null,
        })
        .eq("id", sourceId);
    }

    // If flagged, notify admins
    if (isFlagged) {
      // Get user info
      const { data: profile } = await supabase
        .from("profiles")
        .select("email, full_name")
        .eq("id", userId)
        .single();

      // Notify all admins
      const { data: adminRoles } = await supabase
        .from("user_roles")
        .select("user_id")
        .eq("role", "admin");

      if (adminRoles) {
        for (const admin of adminRoles) {
          await supabase.from("notifications").insert({
            user_id: admin.user_id,
            type: "moderation",
            title: "⚠️ صورة مشكوك فيها",
            body: `${profile?.full_name || "مستخدم"} رفع صورة تم تصنيفها كـ: ${moderationResult.reason}`,
            data: {
              source_type: sourceType,
              source_id: sourceId,
              image_url: imageUrl,
              flagged_user_id: userId,
            },
          });
        }
      }

      // Log to security audit
      await supabase.from("security_audit_log").insert({
        event_type: "image_flagged",
        user_id: userId,
        email: profile?.email || null,
        full_name: profile?.full_name || null,
        metadata: {
          source_type: sourceType,
          source_id: sourceId,
          image_url: imageUrl,
          ai_reason: moderationResult.reason,
          ai_confidence: moderationResult.confidence,
          category: moderationResult.category,
        },
      });
    }

    return new Response(
      JSON.stringify({
        status,
        flagged: isFlagged,
        reason: moderationResult.reason,
        confidence: moderationResult.confidence,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("moderate-image error:", err);
    return new Response(
      JSON.stringify({ error: "Internal error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
