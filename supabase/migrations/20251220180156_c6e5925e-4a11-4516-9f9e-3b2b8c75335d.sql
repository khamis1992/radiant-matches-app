-- Create portfolio_items table for organized portfolio management
CREATE TABLE public.portfolio_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  image_url TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'General',
  title TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.portfolio_items ENABLE ROW LEVEL SECURITY;

-- Anyone can view portfolio items
CREATE POLICY "Anyone can view portfolio items"
ON public.portfolio_items
FOR SELECT
USING (true);

-- Artists can manage their own portfolio items
CREATE POLICY "Artists can insert own portfolio items"
ON public.portfolio_items
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = portfolio_items.artist_id
  AND artists.user_id = auth.uid()
));

CREATE POLICY "Artists can update own portfolio items"
ON public.portfolio_items
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = portfolio_items.artist_id
  AND artists.user_id = auth.uid()
));

CREATE POLICY "Artists can delete own portfolio items"
ON public.portfolio_items
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = portfolio_items.artist_id
  AND artists.user_id = auth.uid()
));

-- Create index for faster lookups
CREATE INDEX idx_portfolio_items_artist_id ON public.portfolio_items(artist_id);
CREATE INDEX idx_portfolio_items_category ON public.portfolio_items(category);