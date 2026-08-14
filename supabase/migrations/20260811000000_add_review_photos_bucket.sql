-- Review photos bucket: public viewing, customers upload to their own folder
INSERT INTO storage.buckets (id, name, public)
VALUES ('review-photos', 'review-photos', true)
ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view review photos"
ON storage.objects FOR SELECT
USING (bucket_id = 'review-photos');

CREATE POLICY "Customers can upload review photos"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Customers can delete own review photos"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'review-photos'
  AND auth.uid()::text = (storage.foldername(name))[1]
);
