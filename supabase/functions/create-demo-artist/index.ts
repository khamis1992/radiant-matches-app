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

    // Demo artist data
    const demoEmail = "noura.demo@glambook.app";
    const demoPassword = "Demo@123";

    // Check if user already exists
    const { data: existingUsers } = await adminClient.auth.admin.listUsers();
    const existingUser = existingUsers?.users?.find(u => u.email === demoEmail);

    if (existingUser) {
      console.log("Demo artist already exists, cleaning up...");
      
      // Get artist id
      const { data: existingArtist } = await adminClient
        .from("artists")
        .select("id")
        .eq("user_id", existingUser.id)
        .maybeSingle();

      if (existingArtist) {
        // Delete services
        await adminClient
          .from("services")
          .delete()
          .eq("artist_id", existingArtist.id);

        // Delete working hours
        await adminClient
          .from("artist_working_hours")
          .delete()
          .eq("artist_id", existingArtist.id);

        // Delete artist
        await adminClient
          .from("artists")
          .delete()
          .eq("id", existingArtist.id);
      }

      // Delete user roles
      await adminClient
        .from("user_roles")
        .delete()
        .eq("user_id", existingUser.id);

      // Delete profile
      await adminClient
        .from("profiles")
        .delete()
        .eq("id", existingUser.id);

      // Delete auth user
      await adminClient.auth.admin.deleteUser(existingUser.id);
    }

    console.log("Creating demo artist user...");

    // 1. Create user in auth.users
    const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
      email: demoEmail,
      password: demoPassword,
      email_confirm: true,
      user_metadata: {
        full_name: "نورة الكواري",
      },
    });

    if (createError) {
      console.error("Error creating user:", createError.message);
      return new Response(JSON.stringify({ error: createError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const userId = newUser.user!.id;
    console.log("User created:", userId);

    // 2. Update profile
    const { error: profileError } = await adminClient
      .from("profiles")
      .update({
        full_name: "نورة الكواري",
        phone: "+974 5555 1234",
        location: "الدوحة، قطر",
      })
      .eq("id", userId);

    if (profileError) {
      console.error("Error updating profile:", profileError.message);
    }

    // 3. Change role from customer to artist
    await adminClient
      .from("user_roles")
      .delete()
      .eq("user_id", userId)
      .eq("role", "customer");

    const { error: roleError } = await adminClient
      .from("user_roles")
      .insert({ user_id: userId, role: "artist" });

    if (roleError) {
      console.error("Error setting role:", roleError.message);
    }

    // 4. Create artist profile
    const { data: artist, error: artistError } = await adminClient
      .from("artists")
      .insert({
        user_id: userId,
        bio: "خبيرة تجميل معتمدة بخبرة 5 سنوات في مكياج الأفراح والمناسبات. متخصصة في إبراز جمالك الطبيعي بلمسات احترافية.",
        experience_years: 5,
        rating: 4.8,
        total_reviews: 28,
        studio_address: "شارع السد، الدوحة",
        is_available: true,
        available_balance: 0,
        pending_balance: 0,
        total_withdrawn: 0,
      })
      .select()
      .single();

    if (artistError) {
      console.error("Error creating artist:", artistError.message);
      return new Response(JSON.stringify({ error: artistError.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const artistId = artist.id;
    console.log("Artist created:", artistId);

    // 5. Create services
    const services = [
      {
        artist_id: artistId,
        name: "مكياج عروس كامل",
        name_ar: "مكياج عروس كامل",
        name_en: "Full Bridal Makeup",
        description: "مكياج عروس فاخر يشمل البشرة والعيون والشفاه مع تثبيت يدوم طوال اليوم",
        description_ar: "مكياج عروس فاخر يشمل البشرة والعيون والشفاه مع تثبيت يدوم طوال اليوم",
        description_en: "Luxurious bridal makeup including skin, eyes and lips with all-day lasting finish",
        price: 800,
        duration_minutes: 120,
        category: "bridal",
        is_active: true,
      },
      {
        artist_id: artistId,
        name: "مكياج سهرة",
        name_ar: "مكياج سهرة",
        name_en: "Evening Makeup",
        description: "مكياج أنيق للمناسبات والحفلات مع لمسة من الفخامة",
        description_ar: "مكياج أنيق للمناسبات والحفلات مع لمسة من الفخامة",
        description_en: "Elegant makeup for events and parties with a touch of glamour",
        price: 400,
        duration_minutes: 60,
        category: "party",
        is_active: true,
      },
      {
        artist_id: artistId,
        name: "مكياج ناعم",
        name_ar: "مكياج ناعم",
        name_en: "Natural Makeup",
        description: "مكياج طبيعي خفيف يبرز جمالك بشكل راقي",
        description_ar: "مكياج طبيعي خفيف يبرز جمالك بشكل راقي",
        description_en: "Light natural makeup that enhances your beauty elegantly",
        price: 250,
        duration_minutes: 45,
        category: "natural",
        is_active: true,
      },
      {
        artist_id: artistId,
        name: "تصفيف شعر",
        name_ar: "تصفيف شعر",
        name_en: "Hair Styling",
        description: "تصفيف شعر احترافي للمناسبات مع تسريحات عصرية",
        description_ar: "تصفيف شعر احترافي للمناسبات مع تسريحات عصرية",
        description_en: "Professional hair styling for events with modern updos",
        price: 300,
        duration_minutes: 60,
        category: "hairstyling",
        is_active: true,
      },
      {
        artist_id: artistId,
        name: "رسم حناء",
        name_ar: "رسم حناء",
        name_en: "Henna Art",
        description: "رسم حناء بتصاميم تقليدية وعصرية للأيدي والأقدام",
        description_ar: "رسم حناء بتصاميم تقليدية وعصرية للأيدي والأقدام",
        description_en: "Henna art with traditional and modern designs for hands and feet",
        price: 200,
        duration_minutes: 90,
        category: "henna",
        is_active: true,
      },
    ];

    const { error: servicesError } = await adminClient
      .from("services")
      .insert(services);

    if (servicesError) {
      console.error("Error creating services:", servicesError.message);
    } else {
      console.log("Services created successfully");
    }

    // 6. Create working hours (Saturday-Thursday: 9AM-9PM, Friday: closed)
    const workingHours = [];
    for (let day = 0; day <= 6; day++) {
      workingHours.push({
        artist_id: artistId,
        day_of_week: day,
        is_working: day !== 5, // Friday (5) is closed
        start_time: day !== 5 ? "09:00:00" : null,
        end_time: day !== 5 ? "21:00:00" : null,
      });
    }

    const { error: hoursError } = await adminClient
      .from("artist_working_hours")
      .insert(workingHours);

    if (hoursError) {
      console.error("Error creating working hours:", hoursError.message);
    } else {
      console.log("Working hours created successfully");
    }

    console.log("Demo artist created successfully!");

    return new Response(JSON.stringify({
      success: true,
      message: "تم إنشاء حساب خبيرة التجميل التجريبي بنجاح",
      credentials: {
        email: demoEmail,
        password: demoPassword,
      },
      artistId: artistId,
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
