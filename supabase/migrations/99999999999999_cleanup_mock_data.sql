-- Script to clean up mock/test data from the database
-- Run this in Supabase SQL Editor

-- Delete test users and their associated data
-- Note: Be careful with this in production!

-- 1. Delete test bookings (bookings with test data patterns)
DELETE FROM public.bookings 
WHERE customer_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 2. Delete test reviews
DELETE FROM public.reviews 
WHERE customer_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 3. Delete test messages
DELETE FROM public.messages 
WHERE sender_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 4. Delete test notifications
DELETE FROM public.notifications 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 5. Delete test favorites
DELETE FROM public.favorites 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 6. Delete test artists and their data
DELETE FROM public.artists 
WHERE user_id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 7. Delete test profiles
DELETE FROM public.profiles 
WHERE id IN (
  SELECT id FROM auth.users 
  WHERE email LIKE '%test%' 
     OR email LIKE '%demo%'
     OR email LIKE '%fake%'
     OR email LIKE '%example%'
     OR email LIKE '%@test.com'
);

-- 8. Delete test users from auth (requires admin privileges)
-- WARNING: This is destructive and should be done carefully
-- DELETE FROM auth.users 
-- WHERE email LIKE '%test%' 
--    OR email LIKE '%demo%'
--    OR email LIKE '%fake%'
--    OR email LIKE '%example%'
--    OR email LIKE '%@test.com';

-- Clean up other test data
-- Delete old test portfolio items
DELETE FROM public.portfolio_items 
WHERE artist_id IN (
  SELECT id FROM public.artists 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%demo%'
       OR email LIKE '%fake%'
       OR email LIKE '%example%'
       OR email LIKE '%@test.com'
  )
);

-- Delete test services
DELETE FROM public.services 
WHERE artist_id IN (
  SELECT id FROM public.artists 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%demo%'
       OR email LIKE '%fake%'
       OR email LIKE '%example%'
       OR email LIKE '%@test.com'
  )
);

-- Clean up orphaned records
DELETE FROM public.transactions 
WHERE artist_id IN (
  SELECT id FROM public.artists 
  WHERE user_id IN (
    SELECT id FROM auth.users 
    WHERE email LIKE '%test%' 
       OR email LIKE '%demo%'
       OR email LIKE '%fake%'
       OR email LIKE '%example%'
       OR email LIKE '%@test.com'
  )
);

-- Reset sequences if needed (optional)
-- SELECT setval('bookings_id_seq', (SELECT MAX(id) FROM bookings));

-- Verify cleanup
SELECT 'Cleanup completed successfully' as status;
