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

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (checkError) {
      console.error("Error checking for existing admins:", checkError);
      return new Response(JSON.stringify({ error: checkError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (existingAdmins && existingAdmins.length > 0) {
      return new Response(JSON.stringify({ error: "Admin already exists. This function can only be used for initial setup." }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, password } = await req.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Setting up admin user:", email);

    // First, try to get the existing user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(JSON.stringify({ error: listError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingUser = users.find(u => u.email === email);
    let userId: string;

    if (existingUser) {
      console.log("User already exists in auth, using existing user:", existingUser.id);
      userId = existingUser.id;

      // Update password
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error("Error updating user:", updateError);
        return new Response(JSON.stringify({ error: updateError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Check if profile exists, create if not
      const { data: existingProfile } = await adminClient
        .from("profiles")
        .select("id")
        .eq("id", userId)
        .single();

      if (!existingProfile) {
        const { error: profileError } = await adminClient
          .from("profiles")
          .insert({
            id: userId,
            email: email,
            full_name: "Admin",
          });

        if (profileError) {
          console.error("Error creating profile:", profileError);
        }
      }
    } else {
      // Create new user
      const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: "Admin",
        },
      });

      if (createError) {
        console.error("Error creating admin user:", createError.message);
        return new Response(JSON.stringify({ error: createError.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      if (!newUser.user) {
        return new Response(JSON.stringify({ error: "Failed to create user" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      userId = newUser.user.id;
    }

    // Delete any existing roles for this user
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Add admin role
    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "admin" });

    if (roleError) {
      console.error("Error adding admin role:", roleError.message);
      return new Response(JSON.stringify({ error: "Failed to assign admin role" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Admin user setup complete:", userId);

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Admin account created successfully",
      userId: userId 
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
