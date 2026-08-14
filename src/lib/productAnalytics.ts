import { supabase } from "@/integrations/supabase/client";

type ProductEvent =
  | "occasion_search"
  | "artist_view"
  | "artist_favorite"
  | "booking_started"
  | "booking_requested"
  | "booking_confirmed"
  | "booking_completed"
  | "rebook_started"
  | "readiness_completed";

export const trackProductEvent = async (
  eventName: ProductEvent,
  properties: Record<string, string | number | boolean | null | undefined> = {},
  source = "web"
) => {
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return;

  const safeProperties = Object.fromEntries(
    Object.entries(properties).filter(([, value]) => value !== undefined)
  );

  void supabase
    .from("product_events")
    .insert({
      user_id: auth.user.id,
      event_name: eventName,
      source,
      properties: safeProperties,
    })
    .then(({ error }) => {
      if (error) console.debug("Product event was not recorded", error.message);
    });
};
