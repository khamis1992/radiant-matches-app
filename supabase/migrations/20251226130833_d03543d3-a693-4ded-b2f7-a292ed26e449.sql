-- Create table to store Instagram connections for artists
CREATE TABLE public.instagram_connections (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  artist_id UUID NOT NULL REFERENCES public.artists(id) ON DELETE CASCADE,
  instagram_user_id TEXT NOT NULL,
  instagram_username TEXT NOT NULL,
  access_token TEXT NOT NULL,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  account_type TEXT DEFAULT 'personal', -- 'personal' or 'business'
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(artist_id)
);

-- Enable RLS
ALTER TABLE public.instagram_connections ENABLE ROW LEVEL SECURITY;

-- Artists can view their own Instagram connection
CREATE POLICY "Artists can view own instagram connection"
ON public.instagram_connections
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = instagram_connections.artist_id
  AND artists.user_id = auth.uid()
));

-- Artists can insert their own Instagram connection
CREATE POLICY "Artists can insert own instagram connection"
ON public.instagram_connections
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = instagram_connections.artist_id
  AND artists.user_id = auth.uid()
));

-- Artists can update their own Instagram connection
CREATE POLICY "Artists can update own instagram connection"
ON public.instagram_connections
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = instagram_connections.artist_id
  AND artists.user_id = auth.uid()
));

-- Artists can delete their own Instagram connection
CREATE POLICY "Artists can delete own instagram connection"
ON public.instagram_connections
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM public.artists
  WHERE artists.id = instagram_connections.artist_id
  AND artists.user_id = auth.uid()
));

-- Add trigger for updating updated_at
CREATE TRIGGER update_instagram_connections_updated_at
BEFORE UPDATE ON public.instagram_connections
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add instagram_media_id column to portfolio_items to track which items came from Instagram
ALTER TABLE public.portfolio_items
ADD COLUMN instagram_media_id TEXT,
ADD COLUMN instagram_permalink TEXT;