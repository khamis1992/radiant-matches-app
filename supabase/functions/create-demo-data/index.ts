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
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const demoArtists = [
      {
        email: "hessa.demo@glambook.app",
        name: "حصة المري",
        password: "Demo@123",
        bio: "خبيرة تجميل محترفة بخبرة 7 سنوات في مكياج العرائس والمناسبات الراقية. حاصلة على شهادات معتمدة من أكاديميات عالمية.",
        experience_years: 7,
        studio_address: "شارع الكورنيش، الدوحة",
        services: [
          { name: "مكياج عروس فاخر", name_ar: "مكياج عروس فاخر", name_en: "Luxury Bridal Makeup", description: "مكياج عروس شامل مع تثبيت طوال اليوم", description_ar: "مكياج عروس شامل مع تثبيت طوال اليوم", description_en: "Full bridal makeup with all-day setting", price: 900, duration_minutes: 150, category: "bridal" },
          { name: "مكياج سهرة فاخر", name_ar: "مكياج سهرة فاخر", name_en: "Luxury Evening Makeup", description: "مكياج أنيق للحفلات والمناسبات", description_ar: "مكياج أنيق للحفلات والمناسبات", description_en: "Elegant makeup for parties and events", price: 500, duration_minutes: 75, category: "party" },
          { name: "مكياج طبيعي", name_ar: "مكياج طبيعي", name_en: "Natural Look", description: "إطلالة ناعمة وطبيعية", description_ar: "إطلالة ناعمة وطبيعية", description_en: "Soft natural look", price: 300, duration_minutes: 45, category: "natural" },
          { name: "تصفيف شعر عروس", name_ar: "تصفيف شعر عروس", name_en: "Bridal Hair Styling", description: "تسريحات عروس فاخرة", description_ar: "تسريحات عروس فاخرة", description_en: "Luxury bridal hairstyles", price: 400, duration_minutes: 90, category: "hairstyling" },
          { name: "حناء تقليدية", name_ar: "حناء تقليدية", name_en: "Traditional Henna", description: "رسم حناء بتصاميم خليجية أصيلة", description_ar: "رسم حناء بتصاميم خليجية أصيلة", description_en: "Henna with authentic Gulf designs", price: 250, duration_minutes: 120, category: "henna" },
        ],
        products: [
          { title: "طقم فرش مكياج احترافي", description: "طقم 12 فرشاة مكياج عالية الجودة", product_type: "physical", category: "beauty_tools", price_qar: 180, inventory_count: 25, images: [] },
          { title: "باليت ظلال العيون الذهبي", description: "18 لون ظلال عيون بدرجات ذهبية ونيود", product_type: "physical", category: "makeup", price_qar: 120, inventory_count: 40, images: [] },
        ],
      },
      {
        email: "latifa.demo@glambook.app",
        name: "لطيفة الهاجري",
        password: "Demo@123",
        bio: "فنانة مكياج متخصصة في المكياج السينمائي والتصوير الفوتوغرافي. خبرة 4 سنوات مع أشهر المصورين في قطر.",
        experience_years: 4,
        studio_address: "لؤلؤة قطر، الدوحة",
        services: [
          { name: "مكياج تصوير فوتوغرافي", name_ar: "مكياج تصوير فوتوغرافي", name_en: "Photoshoot Makeup", description: "مكياج احترافي مصمم للتصوير", description_ar: "مكياج احترافي مصمم للتصوير", description_en: "Professional makeup designed for photography", price: 450, duration_minutes: 60, category: "photoshoot" },
          { name: "مكياج عروس ناعم", name_ar: "مكياج عروس ناعم", name_en: "Soft Bridal Makeup", description: "مكياج عروس بلمسة ناعمة وطبيعية", description_ar: "مكياج عروس بلمسة ناعمة وطبيعية", description_en: "Bridal makeup with soft natural touch", price: 750, duration_minutes: 120, category: "bridal" },
          { name: "مكياج حفلات", name_ar: "مكياج حفلات", name_en: "Party Makeup", description: "مكياج مميز للحفلات والمناسبات", description_ar: "مكياج مميز للحفلات والمناسبات", description_en: "Special party makeup", price: 350, duration_minutes: 50, category: "party" },
          { name: "رسم حواجب مايكروبليدنج", name_ar: "رسم حواجب مايكروبليدنج", name_en: "Microblading Eyebrows", description: "رسم حواجب طبيعية بتقنية المايكروبليدنج", description_ar: "رسم حواجب طبيعية بتقنية المايكروبليدنج", description_en: "Natural eyebrow microblading", price: 600, duration_minutes: 90, category: "lashes" },
          { name: "أظافر جل فرنسي", name_ar: "أظافر جل فرنسي", name_en: "French Gel Nails", description: "أظافر جل بتصميم فرنسي كلاسيكي", description_ar: "أظافر جل بتصميم فرنسي كلاسيكي", description_en: "Classic French gel nails", price: 200, duration_minutes: 60, category: "nails" },
        ],
        products: [
          { title: "دليل المكياج للمبتدئات", description: "كتاب رقمي شامل لتعلم أساسيات المكياج", product_type: "digital", category: "guide", price_qar: 50, inventory_count: 999, images: [] },
          { title: "سيروم ترطيب البشرة", description: "سيروم طبيعي لترطيب البشرة قبل المكياج", product_type: "physical", category: "skincare", price_qar: 95, inventory_count: 30, images: [] },
        ],
      },
      {
        email: "aisha.demo@glambook.app",
        name: "عائشة النعيمي",
        password: "Demo@123",
        bio: "خبيرة تجميل وحناء بخبرة 6 سنوات. متخصصة في الحناء الهندية والخليجية ومكياج المناسبات.",
        experience_years: 6,
        studio_address: "السد، الدوحة",
        services: [
          { name: "حناء هندية فاخرة", name_ar: "حناء هندية فاخرة", name_en: "Luxury Indian Henna", description: "رسم حناء بتصاميم هندية معقدة وجميلة", description_ar: "رسم حناء بتصاميم هندية معقدة وجميلة", description_en: "Complex Indian henna designs", price: 350, duration_minutes: 150, category: "henna" },
          { name: "حناء خليجية", name_ar: "حناء خليجية", name_en: "Gulf Henna", description: "رسم حناء بتصاميم خليجية عصرية", description_ar: "رسم حناء بتصاميم خليجية عصرية", description_en: "Modern Gulf henna designs", price: 200, duration_minutes: 90, category: "henna" },
          { name: "مكياج سهرة", name_ar: "مكياج سهرة", name_en: "Evening Makeup", description: "مكياج أنيق للسهرات", description_ar: "مكياج أنيق للسهرات", description_en: "Elegant evening makeup", price: 380, duration_minutes: 60, category: "party" },
          { name: "مكياج عروس كامل", name_ar: "مكياج عروس كامل", name_en: "Full Bridal Makeup", description: "باكج عروس شامل مكياج + شعر + حناء", description_ar: "باكج عروس شامل مكياج + شعر + حناء", description_en: "Full bridal package: makeup + hair + henna", price: 1200, duration_minutes: 240, category: "bridal" },
          { name: "تركيب رموش", name_ar: "تركيب رموش", name_en: "Lash Extensions", description: "تركيب رموش فردية طبيعية", description_ar: "تركيب رموش فردية طبيعية", description_en: "Natural individual lash extensions", price: 280, duration_minutes: 75, category: "lashes" },
        ],
        products: [
          { title: "حناء طبيعية عضوية", description: "حناء طبيعية 100% بدون مواد كيميائية", product_type: "physical", category: "beauty_tools", price_qar: 45, inventory_count: 100, images: [] },
          { title: "باكج هدية العروس", description: "مجموعة هدايا فاخرة للعروس تشمل منتجات عناية بالبشرة", product_type: "bundle", category: "gift_card", price_qar: 250, inventory_count: 15, images: [] },
          { title: "كورس تعليم الحناء", description: "دورة تعليمية شاملة لتعلم فن الحناء", product_type: "digital", category: "tutorial", price_qar: 75, inventory_count: 999, images: [] },
        ],
      },
    ];

    // Demo customers for reviews
    const demoCustomers = [
      { email: "customer1.demo@glambook.app", name: "مريم الخليفي", password: "Demo@123" },
      { email: "customer2.demo@glambook.app", name: "شيخة العطية", password: "Demo@123" },
      { email: "customer3.demo@glambook.app", name: "أمل البوعينين", password: "Demo@123" },
      { email: "customer4.demo@glambook.app", name: "هند المسلماني", password: "Demo@123" },
      { email: "customer5.demo@glambook.app", name: "ريم الكبيسي", password: "Demo@123" },
      { email: "customer6.demo@glambook.app", name: "جواهر السويدي", password: "Demo@123" },
    ];

    const reviewTexts = [
      { rating: 5, comment: "ماشاء الله شغلها روعة! أنصح الكل فيها 💕" },
      { rating: 5, comment: "أفضل خبيرة تعاملت معها، المكياج ثبت طوال الليل ✨" },
      { rating: 4, comment: "شغل احترافي وتعامل راقي، تجربة ممتازة" },
      { rating: 5, comment: "مبدعة والنتيجة فاقت توقعاتي! شكراً من القلب 🌸" },
      { rating: 4, comment: "جميلة جداً والموعد كان دقيق. أكيد بكرر التجربة" },
      { rating: 5, comment: "يا سلام على الذوق! كل اللي شافوني مدحوا المكياج 😍" },
    ];

    const results: string[] = [];

    // Create demo customers first
    const customerUsers: { id: string; email: string }[] = [];
    for (const cust of demoCustomers) {
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === cust.email);
      if (!user) {
        const { data: newUser, error } = await adminClient.auth.admin.createUser({
          email: cust.email, password: cust.password, email_confirm: true,
          user_metadata: { full_name: cust.name },
        });
        if (error) { console.error(`Error creating customer ${cust.email}:`, error.message); continue; }
        user = newUser.user;
      }
      if (user) {
        await adminClient.from("profiles").update({ full_name: cust.name }).eq("id", user.id);
        customerUsers.push({ id: user.id, email: cust.email });
      }
    }

    // Create each artist
    for (const artistData of demoArtists) {
      // Create or find user
      const { data: existingUsers } = await adminClient.auth.admin.listUsers();
      let user = existingUsers?.users?.find(u => u.email === artistData.email);

      if (!user) {
        const { data: newUser, error } = await adminClient.auth.admin.createUser({
          email: artistData.email, password: artistData.password, email_confirm: true,
          user_metadata: { full_name: artistData.name },
        });
        if (error) { console.error(`Error creating ${artistData.email}:`, error.message); continue; }
        user = newUser.user;
      }
      if (!user) continue;

      const userId = user.id;
      await adminClient.from("profiles").update({ full_name: artistData.name, phone: "+974 5555 0000" }).eq("id", userId);

      // Set artist role
      await adminClient.from("user_roles").delete().eq("user_id", userId).eq("role", "customer");
      await adminClient.from("user_roles").upsert({ user_id: userId, role: "artist" }, { onConflict: "user_id,role" }).select();
      // Fallback: just insert if upsert doesn't work
      const { error: roleErr } = await adminClient.from("user_roles").insert({ user_id: userId, role: "artist" });
      if (roleErr && !roleErr.message.includes("duplicate")) console.error("Role error:", roleErr.message);

      // Create artist profile
      const { data: existingArtist } = await adminClient.from("artists").select("id").eq("user_id", userId).maybeSingle();
      let artistId: string;

      if (existingArtist) {
        artistId = existingArtist.id;
        await adminClient.from("artists").update({
          bio: artistData.bio, experience_years: artistData.experience_years,
          studio_address: artistData.studio_address, is_available: true,
        }).eq("id", artistId);
      } else {
        const { data: newArtist, error } = await adminClient.from("artists").insert({
          user_id: userId, bio: artistData.bio, experience_years: artistData.experience_years,
          studio_address: artistData.studio_address, is_available: true,
          available_balance: 0, pending_balance: 0, total_withdrawn: 0,
        }).select().single();
        if (error) { console.error(`Error creating artist:`, error.message); continue; }
        artistId = newArtist.id;
      }

      // Create services
      const { data: existingServices } = await adminClient.from("services").select("id").eq("artist_id", artistId);
      if (!existingServices || existingServices.length === 0) {
        const servicesWithArtist = artistData.services.map(s => ({ ...s, artist_id: artistId, is_active: true }));
        await adminClient.from("services").insert(servicesWithArtist);
      }

      // Create products
      const { data: existingProducts } = await adminClient.from("products").select("id").eq("artist_id", artistId);
      if (!existingProducts || existingProducts.length === 0) {
        const productsWithArtist = artistData.products.map(p => ({ ...p, artist_id: artistId, is_active: true, is_featured: false }));
        await adminClient.from("products").insert(productsWithArtist);
      }

      // Create working hours (Sat-Thu 9-9, Fri closed)
      const { data: existingHours } = await adminClient.from("artist_working_hours").select("id").eq("artist_id", artistId);
      if (!existingHours || existingHours.length === 0) {
        const hours = [];
        for (let day = 0; day <= 6; day++) {
          hours.push({ artist_id: artistId, day_of_week: day, is_working: day !== 5, start_time: day !== 5 ? "09:00:00" : null, end_time: day !== 5 ? "21:00:00" : null });
        }
        await adminClient.from("artist_working_hours").insert(hours);
      }

      // Get services for bookings/reviews
      const { data: services } = await adminClient.from("services").select("id, name, price").eq("artist_id", artistId).limit(5);
      if (!services || services.length === 0) continue;

      // Create bookings and reviews from demo customers
      const bookingDates = ["2025-12-10", "2025-12-15", "2025-12-20", "2026-01-05", "2026-01-10", "2026-01-15"];
      const reviewsToCreate = Math.min(customerUsers.length, reviewTexts.length);

      for (let i = 0; i < reviewsToCreate; i++) {
        const customer = customerUsers[i];
        const service = services[i % services.length];
        const review = reviewTexts[i];

        // Check existing booking
        const { data: existingBooking } = await adminClient.from("bookings").select("id").eq("customer_id", customer.id).eq("artist_id", artistId).eq("status", "completed").maybeSingle();
        let bookingId = existingBooking?.id;

        if (!bookingId) {
          const { data: booking, error } = await adminClient.from("bookings").insert({
            customer_id: customer.id, artist_id: artistId, service_id: service.id,
            booking_date: bookingDates[i], booking_time: "14:00:00", status: "completed",
            total_price: service.price, location_type: "artist_studio",
            payment_status: "completed", payment_method: "cash",
          }).select().single();
          if (error) { console.error("Booking error:", error.message); continue; }
          bookingId = booking.id;
        }

        // Check existing review
        const { data: existingReview } = await adminClient.from("reviews").select("id").eq("booking_id", bookingId).maybeSingle();
        if (!existingReview) {
          await adminClient.from("reviews").insert({
            booking_id: bookingId, customer_id: customer.id, artist_id: artistId,
            rating: review.rating, comment: review.comment,
          });
        }
      }

      // Update artist rating
      const { data: allReviews } = await adminClient.from("reviews").select("rating").eq("artist_id", artistId);
      if (allReviews && allReviews.length > 0) {
        const avg = allReviews.reduce((s, r) => s + r.rating, 0) / allReviews.length;
        await adminClient.from("artists").update({ rating: Math.round(avg * 10) / 10, total_reviews: allReviews.length }).eq("id", artistId);
      }

      results.push(`✅ ${artistData.name} - ${artistData.services.length} خدمات، ${artistData.products.length} منتجات`);
    }

    return new Response(JSON.stringify({
      success: true,
      message: `تم إنشاء ${results.length} خبيرات تجميل وهميات بنجاح`,
      details: results,
    }), { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } });

  } catch (error: unknown) {
    console.error("Error creating demo data:", error instanceof Error ? error.message : "Unknown error");
    return new Response(JSON.stringify({ error: "Failed to create demo data" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
