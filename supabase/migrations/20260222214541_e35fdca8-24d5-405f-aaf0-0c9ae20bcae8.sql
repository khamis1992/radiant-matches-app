
-- Add moderation_status to portfolio_items
ALTER TABLE public.portfolio_items 
ADD COLUMN moderation_status text NOT NULL DEFAULT 'pending',
ADD COLUMN moderation_reason text;

-- Set all existing portfolio items as approved
UPDATE public.portfolio_items SET moderation_status = 'approved' WHERE moderation_status = 'pending';

-- Central moderation queue for all image types
CREATE TABLE public.image_moderation_queue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  source_type text NOT NULL, -- 'portfolio', 'product', 'avatar', 'chat'
  source_id text, -- ID of the portfolio_item, product, profile, etc.
  user_id uuid NOT NULL,
  ai_flagged boolean DEFAULT false,
  ai_confidence numeric,
  ai_reason text,
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'approved', 'rejected'
  reviewed_by uuid,
  reviewed_at timestamptz,
  admin_notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_moderation_status ON public.image_moderation_queue (status);
CREATE INDEX idx_moderation_source ON public.image_moderation_queue (source_type, source_id);
CREATE INDEX idx_moderation_user ON public.image_moderation_queue (user_id);

ALTER TABLE public.image_moderation_queue ENABLE ROW LEVEL SECURITY;

-- Admins can do everything
CREATE POLICY "Admins can manage moderation queue"
  ON public.image_moderation_queue FOR ALL
  USING (public.has_role(auth.uid(), 'admin'));

-- Users can view their own moderation items
CREATE POLICY "Users can view own moderation items"
  ON public.image_moderation_queue FOR SELECT
  USING (auth.uid() = user_id);

-- Update portfolio RLS to hide non-approved items from public
DROP POLICY IF EXISTS "Anyone can view portfolio items" ON public.portfolio_items;
CREATE POLICY "Anyone can view approved portfolio items"
  ON public.portfolio_items FOR SELECT
  USING (moderation_status = 'approved' OR EXISTS (
    SELECT 1 FROM artists WHERE artists.id = portfolio_items.artist_id AND artists.user_id = auth.uid()
  ) OR public.has_role(auth.uid(), 'admin'));
