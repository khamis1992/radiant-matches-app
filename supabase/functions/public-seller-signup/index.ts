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

    const { userId } = await req.json();

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    console.log("Processing public seller signup for user:", userId);

    // 1. Delete default customer role
    const { error: deleteRoleError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "customer");

    if (deleteRoleError) {
      console.error("Error deleting customer role:", deleteRoleError);
    }

    // 2. Add seller role
    const { error: insertRoleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "seller" });

    if (insertRoleError) {
      console.error("Error inserting seller role:", insertRoleError);
      if (!insertRoleError.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: "Failed to set seller role" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    // 3. Create artist profile with account_type = 'seller'
    const { error: insertArtistError } = await adminClient
      .from("artists")
      .insert({ user_id: userId, account_type: "seller" });

    if (insertArtistError) {
      console.error("Error creating seller profile:", insertArtistError);
      if (!insertArtistError.message.includes("duplicate")) {
        return new Response(JSON.stringify({ error: "Failed to create seller profile" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
    }

    console.log("Public seller signup completed successfully for user:", userId);

    return new Response(JSON.stringify({ 
      success: true,
      message: "Seller profile created successfully"
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
