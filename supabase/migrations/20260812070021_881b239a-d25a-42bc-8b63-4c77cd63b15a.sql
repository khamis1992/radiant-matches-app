CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'review-photos');

CREATE POLICY "Customers can upload review photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Customers can delete own review photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);