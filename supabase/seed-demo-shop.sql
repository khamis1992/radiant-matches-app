-- Demo seed: shop "fatima" (for previewing the new ShopCard design with full data)
-- Run in: Lovable project > Cloud > Database > SQL Editor  (or Supabase Dashboard > SQL Editor)
-- Safe to re-run (idempotent).

UPDATE public.artists
SET rating = 4.7, total_reviews = 86
WHERE id = 'bdbdf056-8255-4993-bfa0-2431b5d5a162';

UPDATE public.profiles
SET location = 'Doha',
    avatar_url = 'https://besjfzlgtssriqpluzgn.supabase.co/storage/v1/object/public/banners/logo.png'
WHERE id = '0a4e2923-de1a-468a-804c-2939ff5bc6f5';

INSERT INTO public.services (artist_id, name, description, price, duration_minutes, category, is_active)
SELECT v.*
FROM (VALUES
  ('bdbdf056-8255-4993-bfa0-2431b5d5a162'::uuid, 'Makeup Application', 'Full glam makeup application', 250, 60, 'Makeup', true),
  ('bdbdf056-8255-4993-bfa0-2431b5d5a162'::uuid, 'Hair Styling', 'Signature hair styling', 200, 45, 'Hair', true),
  ('bdbdf056-8255-4993-bfa0-2431b5d5a162'::uuid, 'Nail Care', 'Manicure and nail care', 120, 40, 'Nails', true)
) AS v(artist_id, name, description, price, duration_minutes, category, is_active)
WHERE NOT EXISTS (
  SELECT 1 FROM public.services s
  WHERE s.artist_id = v.artist_id AND s.name = v.name
);

INSERT INTO public.artist_working_hours (artist_id, day_of_week, is_working, start_time, end_time)
SELECT 'bdbdf056-8255-4993-bfa0-2431b5d5a162', d, true, '09:00', '23:00'
FROM generate_series(0, 6) AS d
ON CONFLICT (artist_id, day_of_week)
DO UPDATE SET is_working = true, start_time = '09:00', end_time = '23:00';

INSERT INTO public.portfolio_items (artist_id, image_url, category, title, is_featured, display_order, moderation_status)
SELECT 'bdbdf056-8255-4993-bfa0-2431b5d5a162',
       'https://d8j0ntlcm91z4.cloudfront.net/user_3FSGj9mhZqTHDJnwvQRkZOqOwz4/hf_20260808_191149_9a6666cb-f53f-4b3e-8b29-395094b01cce.png',
       'Salon', 'Salon Interior', true, 0, 'approved'
WHERE NOT EXISTS (
  SELECT 1 FROM public.portfolio_items p
  WHERE p.artist_id = 'bdbdf056-8255-4993-bfa0-2431b5d5a162'
    AND p.image_url LIKE '%hf_20260808_191149%'
);
