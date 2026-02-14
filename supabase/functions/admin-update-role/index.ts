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
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const authHeader = req.headers.get("Authorization");

    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(JSON.stringify({ error: "No authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create admin client with service role key
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Get the JWT token and verify the user
    const jwt = authHeader.replace("Bearer ", "");
    const { data: { user: caller }, error: userError } = await adminClient.auth.getUser(jwt);

    if (userError || !caller) {
      console.error("Could not get caller user:", userError?.message);
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if caller is admin
    const { data: roles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      console.error("User is not an admin:", caller.id);
      return new Response(JSON.stringify({ error: "Only admins can update roles" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { userId, role } = await req.json();

    if (!userId || !role) {
      console.error("Missing userId or role");
      return new Response(JSON.stringify({ error: "userId and role are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (!["admin", "artist", "customer", "seller"].includes(role)) {
      return new Response(JSON.stringify({ error: "Invalid role" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Updating role for user:", userId, "to:", role);

    // Delete all existing roles for this user
    const { error: deleteError } = await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      console.error("Error deleting roles:", deleteError.message);
      return new Response(JSON.stringify({ error: deleteError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Insert the new role
    const { error: insertError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role });

    if (insertError) {
      console.error("Error inserting role:", insertError.message);
      return new Response(JSON.stringify({ error: insertError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If artist role, create artist profile if not exists
    if (role === "artist" || role === "seller") {
      const { data: existingArtist } = await adminClient
        .from("artists")
        .select("id")
        .eq("user_id", userId)
        .maybeSingle();

      if (!existingArtist) {
        const { error: artistError } = await adminClient
          .from("artists")
          .insert({ user_id: userId, account_type: role === "seller" ? "seller" : "artist" });

        if (artistError) {
          console.error("Error creating artist/seller profile:", artistError.message);
        }
      } else {
        // Update account_type if profile exists
        await adminClient
          .from("artists")
          .update({ account_type: role === "seller" ? "seller" : "artist" })
          .eq("user_id", userId);
      }
    }

    console.log("Role updated successfully for user:", userId);

    return new Response(JSON.stringify({ success: true }), {
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
