-- Create portfolio storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('portfolio', 'portfolio', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Drop existing policies if any to avoid conflicts
DROP POLICY IF EXISTS "Portfolio images are publicly accessible" ON storage.objects;
DROP POLICY IF EXISTS "Artists can upload their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Artists can update their portfolio images" ON storage.objects;
DROP POLICY IF EXISTS "Artists can delete their portfolio images" ON storage.objects;

-- Create policy for public read access to portfolio images
CREATE POLICY "Portfolio images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'portfolio');

-- Create policy for artists to upload their portfolio images
-- Artists can upload to folder named with their artist_id
CREATE POLICY "Artists can upload their portfolio images"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'portfolio' 
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.artists 
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

-- Create policy for artists to update their portfolio images
CREATE POLICY "Artists can update their portfolio images"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.artists 
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);

-- Create policy for artists to delete their portfolio images
CREATE POLICY "Artists can delete their portfolio images"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'portfolio'
  AND auth.role() = 'authenticated'
  AND EXISTS (
    SELECT 1 FROM public.artists 
    WHERE id::text = (storage.foldername(name))[1]
    AND user_id = auth.uid()
  )
);