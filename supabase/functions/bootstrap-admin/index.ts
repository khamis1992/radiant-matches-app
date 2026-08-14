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
    const serviceRoleKey = (JSON.parse(Deno.env.get("SUPABASE_SECRET_KEYS") ?? "{}") ["default"] ?? Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);

    // Require a bootstrap secret to prevent unauthorized access
    const bootstrapSecret = Deno.env.get("BOOTSTRAP_SECRET");
    if (!bootstrapSecret) {
      console.error("BOOTSTRAP_SECRET not configured - function disabled");
      return new Response(JSON.stringify({ error: "Bootstrap not available" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const body = await req.json();
    const { email, password, bootstrap_secret } = body;

    // Validate bootstrap secret with a constant-time comparison
    const secretOk = typeof bootstrap_secret === "string" &&
      typeof bootstrapSecret === "string" &&
      bootstrap_secret.length === bootstrapSecret.length &&
      crypto.subtle.timingSafeEqual(
        new TextEncoder().encode(bootstrap_secret),
        new TextEncoder().encode(bootstrapSecret)
      );

    if (!secretOk) {
      console.warn("Invalid bootstrap secret attempt");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Check if any admin already exists
    const { data: existingAdmins, error: checkError } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("role", "admin")
      .limit(1);

    if (checkError) {
      console.error("Error checking for existing admins:", checkError);
      return new Response(JSON.stringify({ error: "Setup check failed" }), {
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

    if (!email || !password) {
      return new Response(JSON.stringify({ error: "Email and password are required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate password strength
    if (password.length < 8) {
      return new Response(JSON.stringify({ error: "Password must be at least 8 characters" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Setting up admin user");

    // First, try to get the existing user by email
    const { data: { users }, error: listError } = await adminClient.auth.admin.listUsers();
    
    if (listError) {
      console.error("Error listing users:", listError);
      return new Response(JSON.stringify({ error: "Failed to check existing users" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const existingUser = users.find(u => u.email === email);
    let userId: string;

    if (existingUser) {
      userId = existingUser.id;

      // Update password
      const { error: updateError } = await adminClient.auth.admin.updateUserById(userId, {
        password,
        email_confirm: true,
      });

      if (updateError) {
        console.error("Error updating user:", updateError);
        return new Response(JSON.stringify({ error: "Failed to update user" }), {
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
        return new Response(JSON.stringify({ error: "Failed to create admin user" }), {
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

    console.log("Admin user setup complete");

    return new Response(JSON.stringify({ 
      success: true, 
      message: "Admin account created successfully"
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: unknown) {
    console.error("Unexpected error in bootstrap-admin");
    return new Response(JSON.stringify({ error: "An unexpected error occurred" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
