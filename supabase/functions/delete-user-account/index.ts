import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("No authorization header provided");
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Create a Supabase client with the user's token
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Client to verify the user
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the authenticated user
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser();
    
    if (userError || !user) {
      console.error("Error getting user:", userError);
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Starting account deletion for user: ${user.id}`);

    // Create admin client with service role key for deletion
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Delete user data from all related tables
    // The order matters due to foreign key constraints
    const tablesToClean = [
      "notifications",
      "messages",
      "conversations",
      "reviews",
      "bookings",
      "favorites",
      "user_settings",
      "user_roles",
    ];

    for (const table of tablesToClean) {
      const { error } = await supabaseAdmin
        .from(table)
        .delete()
        .eq(table === "conversations" ? "customer_id" : "user_id", user.id);
      
      if (error) {
        console.log(`Note: Could not delete from ${table}: ${error.message}`);
      } else {
        console.log(`Deleted user data from ${table}`);
      }
    }

    // Check if user is an artist and delete artist-related data
    const { data: artistData } = await supabaseAdmin
      .from("artists")
      .select("id")
      .eq("user_id", user.id)
      .maybeSingle();

    if (artistData) {
      const artistId = artistData.id;
      console.log(`User is an artist with ID: ${artistId}`);

      const artistTables = [
        { table: "portfolio_items", column: "artist_id" },
        { table: "services", column: "artist_id" },
        { table: "artist_working_hours", column: "artist_id" },
        { table: "artist_blocked_dates", column: "artist_id" },
        { table: "transactions", column: "artist_id" },
      ];

      for (const { table, column } of artistTables) {
        const { error } = await supabaseAdmin
          .from(table)
          .delete()
          .eq(column, artistId);
        
        if (error) {
          console.log(`Note: Could not delete from ${table}: ${error.message}`);
        } else {
          console.log(`Deleted artist data from ${table}`);
        }
      }

      // Delete the artist profile
      const { error: artistDeleteError } = await supabaseAdmin
        .from("artists")
        .delete()
        .eq("id", artistId);
      
      if (artistDeleteError) {
        console.log(`Note: Could not delete artist profile: ${artistDeleteError.message}`);
      } else {
        console.log("Deleted artist profile");
      }
    }

    // Delete profile
    const { error: profileError } = await supabaseAdmin
      .from("profiles")
      .delete()
      .eq("id", user.id);

    if (profileError) {
      console.log(`Note: Could not delete profile: ${profileError.message}`);
    } else {
      console.log("Deleted user profile");
    }

    // Finally, delete the user from auth.users
    const { error: deleteError } = await supabaseAdmin.auth.admin.deleteUser(user.id);

    if (deleteError) {
      console.error("Error deleting user from auth:", deleteError);
      return new Response(
        JSON.stringify({ error: "Failed to delete user account" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`Successfully deleted user account: ${user.id}`);

    return new Response(
      JSON.stringify({ success: true, message: "Account deleted successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
