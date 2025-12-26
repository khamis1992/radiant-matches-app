import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { invitationId, userId } = await req.json();

    if (!invitationId || !userId) {
      return new Response(JSON.stringify({ error: "Missing invitationId or userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // التحقق من الدعوة
    const { data: invitation, error: invError } = await adminClient
      .from("artist_invitations")
      .select("*")
      .eq("id", invitationId)
      .single();

    if (invError || !invitation) {
      console.error("Invitation not found:", invError);
      return new Response(JSON.stringify({ error: "Invalid invitation" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // التحقق من أن الدعوة لم تستخدم
    if (invitation.used_at) {
      return new Response(JSON.stringify({ error: "Invitation already used" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // التحقق من انتهاء الصلاحية
    if (new Date(invitation.expires_at) < new Date()) {
      return new Response(JSON.stringify({ error: "Invitation expired" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Processing artist signup for user:", userId);

    // 1. تحديث الدعوة كمستخدمة
    const { error: updateInvError } = await adminClient
      .from("artist_invitations")
      .update({ 
        used_at: new Date().toISOString(),
        used_by: userId 
      })
      .eq("id", invitationId);

    if (updateInvError) {
      console.error("Error updating invitation:", updateInvError);
    }

    // 2. حذف صلاحية customer الافتراضية
    const { error: deleteRoleError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "customer");

    if (deleteRoleError) {
      console.error("Error deleting customer role:", deleteRoleError);
    }

    // 3. إضافة صلاحية artist
    const { error: insertRoleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "artist" });

    if (insertRoleError) {
      console.error("Error inserting artist role:", insertRoleError);
      // إذا كان الخطأ بسبب التكرار، فلا بأس
      if (!insertRoleError.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: "Failed to set artist role" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 4. إنشاء ملف الفنانة
    const { error: insertArtistError } = await adminClient
      .from("artists")
      .insert({ user_id: userId });

    if (insertArtistError) {
      console.error("Error creating artist profile:", insertArtistError);
      // إذا كان الخطأ بسبب التكرار، فلا بأس
      if (!insertArtistError.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: "Failed to create artist profile" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Artist signup completed successfully for user:", userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Artist profile created successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : "Unknown error";
    console.error("Unexpected error:", message);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
