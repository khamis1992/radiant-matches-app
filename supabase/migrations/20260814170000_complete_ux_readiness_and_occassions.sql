-- UX readiness, saved occasions, and operational measurement.
-- Existing artists remain visible as approved to preserve live supply; new signups are set to pending_review by their signup function.

ALTER TABLE public.artists
  ADD COLUMN IF NOT EXISTS onboarding_status text NOT NULL DEFAULT 'approved',
  ADD COLUMN IF NOT EXISTS onboarding_notes text,
  ADD COLUMN IF NOT EXISTS approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS approved_by uuid REFERENCES auth.users(id),
  ADD COLUMN IF NOT EXISTS service_areas text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS travel_buffer_minutes integer NOT NULL DEFAULT 30,
  ADD COLUMN IF NOT EXISTS minimum_notice_hours integer NOT NULL DEFAULT 24;

ALTER TABLE public.artists
  DROP CONSTRAINT IF EXISTS artists_onboarding_status_check;
ALTER TABLE public.artists
  ADD CONSTRAINT artists_onboarding_status_check
  CHECK (onboarding_status IN ('draft','pending_review','approved','rejected','suspended'));

ALTER TABLE public.artists
  DROP CONSTRAINT IF EXISTS artists_travel_buffer_minutes_check;
ALTER TABLE public.artists
  ADD CONSTRAINT artists_travel_buffer_minutes_check
  CHECK (travel_buffer_minutes BETWEEN 0 AND 240);

ALTER TABLE public.artists
  DROP CONSTRAINT IF EXISTS artists_minimum_notice_hours_check;
ALTER TABLE public.artists
  ADD CONSTRAINT artists_minimum_notice_hours_check
  CHECK (minimum_notice_hours BETWEEN 0 AND 168);

CREATE TABLE IF NOT EXISTS public.occasion_lists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title text NOT NULL CHECK (char_length(title) BETWEEN 1 AND 80),
  occasion_type text,
  occasion_date date,
  area text,
  budget_min numeric(10,2),
  budget_max numeric(10,2),
  visual_style text,
  is_shared boolean NOT NULL DEFAULT false,
  share_token uuid NOT NULL DEFAULT gen_random_uuid() UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (budget_min IS NULL OR budget_min >= 0),
  CHECK (budget_max IS NULL OR budget_max >= 0),
  CHECK (budget_min IS NULL OR budget_max IS NULL OR budget_min <= budget_max)
);

CREATE TABLE IF NOT EXISTS public.occasion_list_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  occasion_list_id uuid NOT NULL REFERENCES public.occasion_lists(id) ON DELETE CASCADE,
  artist_id uuid NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (occasion_list_id, artist_id)
);

CREATE TABLE IF NOT EXISTS public.product_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  event_name text NOT NULL CHECK (event_name IN ('occasion_search','artist_view','artist_favorite','booking_started','booking_requested','booking_confirmed','booking_completed','rebook_started','readiness_completed')),
  source text,
  properties jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_occasion_lists_user_created ON public.occasion_lists(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_occasion_list_items_list ON public.occasion_list_items(occasion_list_id);
CREATE INDEX IF NOT EXISTS idx_product_events_name_created ON public.product_events(event_name, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_product_events_user_created ON public.product_events(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_artists_onboarding_status ON public.artists(onboarding_status);

ALTER TABLE public.occasion_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.occasion_list_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users manage their own occasion lists" ON public.occasion_lists;
CREATE POLICY "Users manage their own occasion lists"
  ON public.occasion_lists FOR ALL TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users manage items in their own occasion lists" ON public.occasion_list_items;
CREATE POLICY "Users manage items in their own occasion lists"
  ON public.occasion_list_items FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.occasion_lists l WHERE l.id = occasion_list_id AND l.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.occasion_lists l WHERE l.id = occasion_list_id AND l.user_id = auth.uid()));

DROP POLICY IF EXISTS "Users record their own product events" ON public.product_events;
CREATE POLICY "Users record their own product events"
  ON public.product_events FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "Users view their own product events" ON public.product_events;
CREATE POLICY "Users view their own product events"
  ON public.product_events FOR SELECT TO authenticated
  USING (user_id = auth.uid());

DROP POLICY IF EXISTS "Admins view all product events" ON public.product_events;
CREATE POLICY "Admins view all product events"
  ON public.product_events FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE OR REPLACE FUNCTION public.set_occasion_lists_updated_at()
RETURNS trigger
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS set_occasion_lists_updated_at ON public.occasion_lists;
CREATE TRIGGER set_occasion_lists_updated_at
  BEFORE UPDATE ON public.occasion_lists
  FOR EACH ROW EXECUTE FUNCTION public.set_occasion_lists_updated_at();
