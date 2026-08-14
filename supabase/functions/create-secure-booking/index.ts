import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const getPlatformKey = (modernKeyName: string, legacyKeyName: string) => {
  const value = Deno.env.get(modernKeyName);
  if (value) {
    try {
      const parsed = JSON.parse(value);
      if (typeof parsed?.default === "string") return parsed.default;
    } catch {
      return value;
    }
  }
  return Deno.env.get(legacyKeyName)!;
};

const getPublishableKey = () => getPlatformKey("SUPABASE_PUBLISHABLE_KEYS", "SUPABASE_ANON_KEY");
const getSecretKey = () => getPlatformKey("SUPABASE_SECRET_KEYS", "SUPABASE_SERVICE_ROLE_KEY");

const toMinutes = (value: string) => {
  const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
  return hours * 60 + minutes;
};

const fromMinutes = (minutes: number) => {
  const normalized = ((minutes % 1440) + 1440) % 1440;
  return `${String(Math.floor(normalized / 60)).padStart(2, "0")}:${String(normalized % 60).padStart(2, "0")}:00`;
};

const settingNumber = (rows: { key: string; value: unknown }[], key: string, fallback: number) => {
  const entry = rows.find((row) => row.key === key)?.value;
  if (!entry || typeof entry !== "object") return fallback;
  const candidate = (entry as Record<string, unknown>).value;
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(401, { error: "unauthorized" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, getSecretKey());
  const userClient = createClient(url, getPublishableKey(), {
    global: { headers: { Authorization: authorization } },
  });

  const { data: claims, error: claimsError } = await userClient.auth.getClaims(
    authorization.replace("Bearer ", ""),
  );
  const userId = claims?.claims?.sub;
  if (claimsError || typeof userId !== "string") return json(401, { error: "unauthorized" });

  const { data: callerRoles } = await admin.from("user_roles").select("role").eq("user_id", userId);
  const mayCreateCustomerBooking = callerRoles?.some((row) => row.role === "customer" || row.role === "admin") ?? false;
  if (!mayCreateCustomerBooking) return json(403, { error: "customer_or_admin_required" });

  let body: {
    artistId?: string;
    serviceId?: string;
    bookingDate?: string;
    bookingTime?: string;
    locationType?: "artist_studio" | "client_home";
    locationAddress?: string;
    notes?: string;
    paymentMethod?: "cash" | "sadad";
  };
  try {
    body = await request.json();
  } catch {
    return json(400, { error: "invalid_json" });
  }

  const { artistId, serviceId, bookingDate, bookingTime, locationType, locationAddress, notes, paymentMethod = "cash" } = body;
  if (!artistId || !serviceId || !bookingDate || !bookingTime || !locationType) {
    return json(400, { error: "missing_required_fields" });
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(bookingDate) || !/^\d{2}:\d{2}(:\d{2})?$/.test(bookingTime)) {
    return json(400, { error: "invalid_booking_datetime" });
  }
  if (!['artist_studio', 'client_home'].includes(locationType) || !['cash', 'sadad'].includes(paymentMethod)) {
    return json(400, { error: "invalid_booking_option" });
  }

  const [artistResult, serviceResult, settingsResult] = await Promise.all([
    admin.from("artists").select("id, user_id").eq("id", artistId).maybeSingle(),
    admin.from("services").select("id, artist_id, name, price, duration_minutes").eq("id", serviceId).maybeSingle(),
    admin.from("platform_settings").select("key, value").in("key", ["min_booking_hours", "max_booking_days", "cancellation_hours", "travel_fee"]),
  ]);

  if (!artistResult.data || !serviceResult.data || serviceResult.data.artist_id !== artistId) {
    return json(404, { error: "artist_or_service_not_found" });
  }
  if (artistResult.error || serviceResult.error || settingsResult.error) {
    return json(500, { error: "booking_configuration_unavailable" });
  }

  const settings = settingsResult.data ?? [];
  const minBookingHours = settingNumber(settings, "min_booking_hours", 24);
  const maxBookingDays = settingNumber(settings, "max_booking_days", 30);
  const cancellationHours = settingNumber(settings, "cancellation_hours", 24);
  const travelFee = locationType === "client_home" ? settingNumber(settings, "travel_fee", 90) : 0;

  const requestedStart = new Date(`${bookingDate}T${bookingTime.slice(0, 5)}:00+03:00`);
  if (Number.isNaN(requestedStart.valueOf())) return json(400, { error: "invalid_booking_datetime" });
  const now = new Date();
  const earliestAllowed = new Date(now.getTime() + minBookingHours * 60 * 60 * 1000);
  const latestAllowed = new Date(now.getTime() + maxBookingDays * 24 * 60 * 60 * 1000);
  if (requestedStart < earliestAllowed || requestedStart > latestAllowed) {
    return json(422, { error: "booking_outside_allowed_window", minBookingHours, maxBookingDays });
  }

  const localDayOfWeek = new Date(`${bookingDate}T12:00:00+03:00`).getUTCDay();
  const [{ data: workingHours }, { data: blockedDate }] = await Promise.all([
    admin.from("artist_working_hours").select("is_working, start_time, end_time").eq("artist_id", artistId).eq("day_of_week", localDayOfWeek).maybeSingle(),
    admin.from("artist_blocked_dates").select("id").eq("artist_id", artistId).eq("blocked_date", bookingDate).maybeSingle(),
  ]);

  if (blockedDate) return json(409, { error: "artist_unavailable_on_date" });
  if (workingHours && !workingHours.is_working) return json(409, { error: "artist_not_working_on_date" });

  const durationMinutes = Math.max(Number(serviceResult.data.duration_minutes ?? 60), 15);
  const operationalBufferMinutes = 30;
  const startMinutes = toMinutes(bookingTime);
  const endMinutes = startMinutes + durationMinutes + operationalBufferMinutes;
  const bookingEndTime = fromMinutes(endMinutes);
  if (endMinutes > 1440) return json(422, { error: "booking_exceeds_service_day" });

  if (workingHours?.start_time && workingHours?.end_time) {
    const workingStart = toMinutes(workingHours.start_time);
    const workingEnd = toMinutes(workingHours.end_time);
    if (startMinutes < workingStart || endMinutes > workingEnd) {
      return json(409, { error: "slot_outside_working_hours" });
    }
  }

  const { data: activeBookings, error: activeBookingsError } = await admin
    .from("bookings")
    .select("booking_time, booking_end_time")
    .eq("artist_id", artistId)
    .eq("booking_date", bookingDate)
    .in("status", ["pending", "confirmed"]);
  if (activeBookingsError) return json(500, { error: "availability_check_failed" });

  const overlaps = (activeBookings ?? []).some((booking) => {
    const existingStart = toMinutes(booking.booking_time);
    const existingEnd = booking.booking_end_time ? toMinutes(booking.booking_end_time) : existingStart + 60;
    return startMinutes < existingEnd && endMinutes > existingStart;
  });
  if (overlaps) return json(409, { error: "slot_no_longer_available" });

  const servicePrice = Number(serviceResult.data.price ?? 0);
  const totalPrice = servicePrice + travelFee;
  const { data: booking, error: insertError } = await admin
    .from("bookings")
    .insert({
      customer_id: userId,
      artist_id: artistId,
      service_id: serviceId,
      booking_date: bookingDate,
      booking_time: bookingTime,
      booking_end_time: bookingEndTime,
      location_type: locationType,
      location_address: locationAddress?.slice(0, 1000) || null,
      notes: notes?.slice(0, 2000) || null,
      total_price: totalPrice,
      payment_method: paymentMethod,
      status: "pending",
      guarantee_status: "covered",
      cancellation_policy_hours: cancellationHours,
    })
    .select("id, booking_date, booking_time, booking_end_time, total_price, status, guarantee_status, cancellation_policy_hours")
    .single();

  if (insertError || !booking) {
    if (insertError?.code === "23P01" || insertError?.code === "23505") {
      return json(409, { error: "slot_no_longer_available" });
    }
    console.error("secure booking insert failed", insertError?.code);
    return json(500, { error: "booking_creation_failed" });
  }

  await admin.from("booking_events").insert({
    booking_id: booking.id,
    actor_id: userId,
    event_type: "booking_created",
    metadata: {
      source: "secure_booking_function",
      servicePrice,
      travelFee,
      durationMinutes,
      operationalBufferMinutes,
      paymentMethod,
    },
  });

  return json(201, { success: true, booking, pricing: { servicePrice, travelFee, totalPrice } });
});
