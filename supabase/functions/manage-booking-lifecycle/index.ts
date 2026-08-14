import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

const json = (status: number, payload: Record<string, unknown>) =>
  new Response(JSON.stringify(payload), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status });

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
const fromMinutes = (minutes: number) => `${String(Math.floor(minutes / 60)).padStart(2, "0")}:${String(minutes % 60).padStart(2, "0")}:00`;

const settingNumber = (rows: { key: string; value: unknown }[], key: string, fallback: number) => {
  const value = rows.find((row) => row.key === key)?.value;
  const candidate = value && typeof value === "object" ? (value as Record<string, unknown>).value : undefined;
  return typeof candidate === "number" && Number.isFinite(candidate) ? candidate : fallback;
};

Deno.serve(async (request) => {
  if (request.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (request.method !== "POST") return json(405, { error: "method_not_allowed" });

  const authorization = request.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) return json(401, { error: "unauthorized" });

  const url = Deno.env.get("SUPABASE_URL")!;
  const admin = createClient(url, getSecretKey());
  const userClient = createClient(url, getPublishableKey(), { global: { headers: { Authorization: authorization } } });
  const { data: claims, error: claimsError } = await userClient.auth.getClaims(authorization.replace("Bearer ", ""));
  const actorId = claims?.claims?.sub;
  if (claimsError || typeof actorId !== "string") return json(401, { error: "unauthorized" });

  let body: { action?: string; bookingId?: string; bookingDate?: string; bookingTime?: string; notes?: string; reason?: string };
  try { body = await request.json(); } catch { return json(400, { error: "invalid_json" }); }
  const { action, bookingId } = body;
  if (!action || !bookingId) return json(400, { error: "missing_required_fields" });

  const { data: booking, error: bookingError } = await admin
    .from("bookings")
    .select("*, artists!bookings_artist_id_fkey(id, user_id), services!bookings_service_id_fkey(id, duration_minutes)")
    .eq("id", bookingId)
    .maybeSingle();
  if (bookingError || !booking) return json(404, { error: "booking_not_found" });

  const artistUserId = (booking.artists as { user_id?: string } | null)?.user_id;
  const { data: roles } = await admin.from("user_roles").select("role").eq("user_id", actorId);
  const isAdmin = roles?.some((row) => row.role === "admin") ?? false;
  const isArtist = artistUserId === actorId;
  const isCustomer = booking.customer_id === actorId;
  if (!isAdmin && !isArtist && !isCustomer) return json(403, { error: "forbidden" });

  const now = new Date();
  const appointmentAt = new Date(`${booking.booking_date}T${booking.booking_time.slice(0, 5)}:00+03:00`);
  const active = booking.status === "pending" || booking.status === "confirmed";
  const eventMetadata: Record<string, unknown> = { action, source: "manage_booking_lifecycle" };
  let update: Record<string, unknown> = {};

  if (action === "confirm") {
    if (!isArtist && !isAdmin) return json(403, { error: "artist_or_admin_required" });
    if (booking.status !== "pending") return json(409, { error: "invalid_status_transition" });
    update = { status: "confirmed", artist_response_at: now.toISOString() };
  } else if (action === "complete") {
    if (!isArtist && !isAdmin) return json(403, { error: "artist_or_admin_required" });
    if (booking.status !== "confirmed") return json(409, { error: "invalid_status_transition" });
    update = { status: "completed", arrival_status: "completed" };
  } else if (action === "en_route" || action === "arrived") {
    if (!isArtist && !isAdmin) return json(403, { error: "artist_or_admin_required" });
    if (booking.status !== "confirmed") return json(409, { error: "invalid_status_transition" });
    update = { arrival_status: action === "en_route" ? "en_route" : "arrived" };
  } else if (action === "cancel") {
    if (!active) return json(409, { error: "invalid_status_transition" });
    const cancellationHours = Number(booking.cancellation_policy_hours ?? 24);
    const isWithinCustomerWindow = now <= new Date(appointmentAt.getTime() - cancellationHours * 60 * 60 * 1000);
    if (isCustomer && !isWithinCustomerWindow && !isAdmin) {
      return json(409, { error: "cancellation_window_closed", cancellationHours });
    }
    const artistCancelled = isArtist && !isAdmin;
    update = {
      status: "cancelled",
      cancelled_by: actorId,
      cancellation_reason: body.reason?.slice(0, 500) || null,
      cancellation_requested_at: now.toISOString(),
      guarantee_status: artistCancelled ? "rebooking_offered" : "cancelled",
      rebooking_eligible: artistCancelled,
    };
    eventMetadata.cancelledBy = artistCancelled ? "artist" : isCustomer ? "customer" : "admin";
    eventMetadata.rebookingEligible = artistCancelled;
  } else if (action === "reschedule") {
    if (!isCustomer && !isAdmin) return json(403, { error: "customer_or_admin_required" });
    if (!active || !body.bookingDate || !body.bookingTime) return json(409, { error: "invalid_reschedule_request" });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(body.bookingDate) || !/^\d{2}:\d{2}(:\d{2})?$/.test(body.bookingTime)) {
      return json(400, { error: "invalid_booking_datetime" });
    }
    const cancellationHours = Number(booking.cancellation_policy_hours ?? 24);
    if (!isAdmin && now > new Date(appointmentAt.getTime() - cancellationHours * 60 * 60 * 1000)) {
      return json(409, { error: "cancellation_window_closed", cancellationHours });
    }
    const [{ data: settings }, { data: blockedDate }, { data: workingHours }] = await Promise.all([
      admin.from("platform_settings").select("key, value").in("key", ["min_booking_hours", "max_booking_days"]),
      admin.from("artist_blocked_dates").select("id").eq("artist_id", booking.artist_id).eq("blocked_date", body.bookingDate).maybeSingle(),
      admin.from("artist_working_hours").select("is_working, start_time, end_time").eq("artist_id", booking.artist_id).eq("day_of_week", new Date(`${body.bookingDate}T12:00:00+03:00`).getUTCDay()).maybeSingle(),
    ]);
    if (blockedDate || (workingHours && !workingHours.is_working)) return json(409, { error: "artist_unavailable_on_date" });

    const minBookingHours = settingNumber(settings ?? [], "min_booking_hours", 24);
    const maxBookingDays = settingNumber(settings ?? [], "max_booking_days", 30);
    const candidateStart = new Date(`${body.bookingDate}T${body.bookingTime.slice(0, 5)}:00+03:00`);
    if (candidateStart < new Date(now.getTime() + minBookingHours * 3600000) || candidateStart > new Date(now.getTime() + maxBookingDays * 86400000)) {
      return json(422, { error: "booking_outside_allowed_window" });
    }

    const durationMinutes = Math.max(Number((booking.services as { duration_minutes?: number } | null)?.duration_minutes ?? 60), 15);
    const startMinutes = toMinutes(body.bookingTime);
    const endMinutes = startMinutes + durationMinutes + 30;
    if (endMinutes > 1440) return json(422, { error: "booking_exceeds_service_day" });
    if (workingHours?.start_time && workingHours?.end_time && (startMinutes < toMinutes(workingHours.start_time) || endMinutes > toMinutes(workingHours.end_time))) {
      return json(409, { error: "slot_outside_working_hours" });
    }
    update = {
      booking_date: body.bookingDate,
      booking_time: body.bookingTime,
      booking_end_time: fromMinutes(endMinutes),
      notes: body.notes?.slice(0, 2000) || null,
      guarantee_status: "covered",
      rebooking_eligible: false,
    };
    eventMetadata.previousDate = booking.booking_date;
    eventMetadata.previousTime = booking.booking_time;
  } else {
    return json(400, { error: "unsupported_action" });
  }

  const { data: updatedBooking, error: updateError } = await admin
    .from("bookings")
    .update(update)
    .eq("id", bookingId)
    .select("id, status, booking_date, booking_time, booking_end_time, guarantee_status, rebooking_eligible, arrival_status, cancellation_policy_hours")
    .single();
  if (updateError || !updatedBooking) {
    if (updateError?.code === "23P01" || updateError?.code === "23505") return json(409, { error: "slot_no_longer_available" });
    console.error("booking lifecycle update failed", updateError?.code);
    return json(500, { error: "booking_update_failed" });
  }

  await admin.from("booking_events").insert({ booking_id: bookingId, actor_id: actorId, event_type: `booking_${action}`, metadata: eventMetadata });
  return json(200, { success: true, booking: updatedBooking });
});
