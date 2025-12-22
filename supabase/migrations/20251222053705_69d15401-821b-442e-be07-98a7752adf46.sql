-- Create working hours table for artists
CREATE TABLE public.artist_working_hours (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  is_working BOOLEAN NOT NULL DEFAULT false,
  start_time TIME WITHOUT TIME ZONE DEFAULT '09:00',
  end_time TIME WITHOUT TIME ZONE DEFAULT '17:00',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id, day_of_week)
);

-- Enable RLS
ALTER TABLE public.artist_working_hours ENABLE ROW LEVEL SECURITY;

-- Anyone can view working hours
CREATE POLICY "Anyone can view working hours"
ON public.artist_working_hours
FOR SELECT
USING (true);

-- Artists can manage their own working hours
CREATE POLICY "Artists can insert own working hours"
ON public.artist_working_hours
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM artists
  WHERE artists.id = artist_working_hours.artist_id
  AND artists.user_id = auth.uid()
));

CREATE POLICY "Artists can update own working hours"
ON public.artist_working_hours
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM artists
  WHERE artists.id = artist_working_hours.artist_id
  AND artists.user_id = auth.uid()
));

CREATE POLICY "Artists can delete own working hours"
ON public.artist_working_hours
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM artists
  WHERE artists.id = artist_working_hours.artist_id
  AND artists.user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_artist_working_hours_updated_at
BEFORE UPDATE ON public.artist_working_hours
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();