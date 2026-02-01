-- Create storage policy for banners bucket - allow authenticated users to upload
CREATE POLICY "Authenticated users can upload banners"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'banners');

-- Allow authenticated users to update banners
CREATE POLICY "Authenticated users can update banners"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'banners');

-- Allow authenticated users to delete banners
CREATE POLICY "Authenticated users can delete banners"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'banners');

-- Allow public read access to banners (already public bucket, but ensure policy exists)
CREATE POLICY "Public can view banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'banners');