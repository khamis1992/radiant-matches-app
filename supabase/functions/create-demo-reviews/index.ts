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

    const artistId = "30d48ec3-45ba-428d-8505-a8c564e70b19";

    // Get artist's services
    const { data: services } = await adminClient
      .from("services")
      .select("id, name, price")
      .eq("artist_id", artistId)
      .limit(5);

    if (!services || services.length === 0) {
      return new Response(JSON.stringify({ error: "No services found for artist" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Demo customers data
    const demoCustomers = [
      { email: "sara.demo@glambook.app", name: "سارة العلي", password: "Demo@123" },
      { email: "fatima.demo@glambook.app", name: "فاطمة المهندي", password: "Demo@123" },
      { email: "maryam.demo@glambook.app", name: "مريم الخاطر", password: "Demo@123" },
      { email: "nouf.demo@glambook.app", name: "نوف السليطي", password: "Demo@123" },
      { email: "dana.demo@glambook.app", name: "دانة الأنصاري", password: "Demo@123" },
    ];

    // Demo reviews data
    const reviewsData = [
      { rating: 5, comment: "خبيرة تجميل رائعة! مكياجي كان مذهل في يوم زفافي. أنصح بها بشدة 💕" },
      { rating: 5, comment: "تعاملها راقي جداً والنتيجة فاقت توقعاتي. شكراً نورة!" },
      { rating: 4, comment: "مكياج جميل واحترافي، الموعد كان دقيق. تجربة ممتازة" },
      { rating: 5, comment: "أفضل خبيرة تجميل تعاملت معها. المكياج ثبت طوال الحفلة ✨" },
      { rating: 4, comment: "عمل متقن وذوق رفيع. سأكرر التجربة بالتأكيد" },
    ];

    const createdReviews = [];
    const bookingDates = ["2025-01-15", "2025-01-20", "2025-01-22", "2025-01-25", "2025-01-28"];

    for (let i = 0; i < demoCustomers.length; i++) {
      const customer = demoCustomers[i];
      const review = reviewsData[i];
      const service = services[i % services.length];

      // Check if user already exists
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === customer.email);

      if (!user) {
        // Create demo customer
        const { data: newUser, error: createError } = await adminClient.auth.admin.createUser({
          email: customer.email,
          password: customer.password,
          email_confirm: true,
          user_metadata: { full_name: customer.name },
        });

        if (createError) {
          console.error(`Error creating user ${customer.email}:`, createError.message);
          continue;
        }
        user = newUser.user;
      }

      if (!user) continue;

      // Update profile
      await adminClient
        .from("profiles")
        .update({ full_name: customer.name })
        .eq("id", user.id);

      // Check if booking already exists for this customer and artist
      const { data: existingBooking } = await adminClient
        .from("bookings")
        .select("id")
        .eq("customer_id", user.id)
        .eq("artist_id", artistId)
        .eq("status", "completed")
        .maybeSingle();

      let bookingId = existingBooking?.id;

      if (!bookingId) {
        // Create completed booking
        const { data: booking, error: bookingError } = await adminClient
          .from("bookings")
          .insert({
            customer_id: user.id,
            artist_id: artistId,
            service_id: service.id,
            booking_date: bookingDates[i],
            booking_time: "14:00:00",
            status: "completed",
            total_price: service.price,
            location_type: "artist_studio",
            payment_status: "completed",
            payment_method: "cash",
          })
          .select()
          .single();

        if (bookingError) {
          console.error(`Error creating booking:`, bookingError.message);
          continue;
        }
        bookingId = booking.id;
      }

      // Check if review already exists
      const { data: existingReview } = await adminClient
        .from("reviews")
        .select("id")
        .eq("booking_id", bookingId)
        .maybeSingle();

      if (existingReview) {
        console.log(`Review already exists for booking ${bookingId}`);
        continue;
      }

      // Create review
      const { data: newReview, error: reviewError } = await adminClient
        .from("reviews")
        .insert({
          booking_id: bookingId,
          customer_id: user.id,
          artist_id: artistId,
          rating: review.rating,
          comment: review.comment,
        })
        .select()
        .single();

      if (reviewError) {
        console.error(`Error creating review:`, reviewError.message);
        continue;
      }

      createdReviews.push({
        customer: customer.name,
        rating: review.rating,
        comment: review.comment,
      });

      console.log(`Created review from ${customer.name}`);
    }

    // Update artist rating
    const { data: allReviews } = await adminClient
      .from("reviews")
      .select("rating")
      .eq("artist_id", artistId);

    if (allReviews && allReviews.length > 0) {
      const avgRating = allReviews.reduce((sum, r) => sum + r.rating, 0) / allReviews.length;
      await adminClient
        .from("artists")
        .update({
          rating: Math.round(avgRating * 10) / 10,
          total_reviews: allReviews.length,
        })
        .eq("id", artistId);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `تم إنشاء ${createdReviews.length} تقييمات تجريبية`,
      reviews: createdReviews,
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
