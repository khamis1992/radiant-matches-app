-- Create table for artist blocked dates
CREATE TABLE public.artist_blocked_dates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  blocked_date DATE NOT NULL,
  reason TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id, blocked_date)
);

-- Enable Row Level Security
ALTER TABLE public.artist_blocked_dates ENABLE ROW LEVEL SECURITY;

-- Anyone can view blocked dates (for booking validation)
CREATE POLICY "Anyone can view blocked dates"
ON public.artist_blocked_dates
FOR SELECT
USING (true);

-- Artists can manage their own blocked dates
CREATE POLICY "Artists can insert own blocked dates"
ON public.artist_blocked_dates
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM artists
  WHERE artists.id = artist_blocked_dates.artist_id
  AND artists.user_id = auth.uid()
));

CREATE POLICY "Artists can delete own blocked dates"
ON public.artist_blocked_dates
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM artists
  WHERE artists.id = artist_blocked_dates.artist_id
  AND artists.user_id = auth.uid()
));