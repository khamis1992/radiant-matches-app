-- GLAM booking guarantee, operational audit trail, and active-slot integrity.
-- Existing records remain intact; the overlap constraint applies to new bookings that have an end time.

CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE public.bookings
  ADD COLUMN IF NOT EXISTS booking_end_time time without time zone,
  ADD COLUMN IF NOT EXISTS guarantee_status text NOT NULL DEFAULT 'covered',
  ADD COLUMN IF NOT EXISTS cancellation_policy_hours integer NOT NULL DEFAULT 24,
  ADD COLUMN IF NOT EXISTS cancelled_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS cancellation_reason text,
  ADD COLUMN IF NOT EXISTS cancellation_requested_at timestamptz,
  ADD COLUMN IF NOT EXISTS artist_response_at timestamptz,
  ADD COLUMN IF NOT EXISTS arrival_status text NOT NULL DEFAULT 'not_started',
  ADD COLUMN IF NOT EXISTS rebooking_eligible boolean NOT NULL DEFAULT false;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_guarantee_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_guarantee_status_check
      CHECK (guarantee_status IN ('covered', 'rebooking_offered', 'cancelled', 'resolved'));
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_arrival_status_check'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_arrival_status_check
      CHECK (arrival_status IN ('not_started', 'en_route', 'arrived', 'completed'));
  END IF;
END $$;

CREATE INDEX IF NOT EXISTS bookings_artist_active_slot_idx
  ON public.bookings (artist_id, booking_date, booking_time)
  WHERE status IN ('pending', 'confirmed');

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'bookings_artist_active_time_window_excl'
      AND conrelid = 'public.bookings'::regclass
  ) THEN
    ALTER TABLE public.bookings
      ADD CONSTRAINT bookings_artist_active_time_window_excl
      EXCLUDE USING gist (
        artist_id WITH =,
        tsrange(
          (booking_date + booking_time)::timestamp,
          (booking_date + booking_end_time)::timestamp,
          '[)'
        ) WITH &&
      )
      WHERE (status IN ('pending', 'confirmed') AND booking_end_time IS NOT NULL);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS public.booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.bookings(id) ON DELETE CASCADE,
  actor_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS booking_events_booking_created_idx
  ON public.booking_events (booking_id, created_at DESC);

ALTER TABLE public.booking_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own booking events" ON public.booking_events;
CREATE POLICY "Customers can view own booking events"
  ON public.booking_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      WHERE b.id = booking_events.booking_id
        AND b.customer_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Artists can view own booking events" ON public.booking_events;
CREATE POLICY "Artists can view own booking events"
  ON public.booking_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.bookings b
      JOIN public.artists a ON a.id = b.artist_id
      WHERE b.id = booking_events.booking_id
        AND a.user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Admins can view all booking events" ON public.booking_events;
CREATE POLICY "Admins can view all booking events"
  ON public.booking_events FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
