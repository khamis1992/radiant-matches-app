
-- Fix 1: Make chat-attachments bucket private
UPDATE storage.buckets SET public = false WHERE id = 'chat-attachments';

-- Drop overly permissive policy
DROP POLICY IF EXISTS "Anyone can view chat attachments" ON storage.objects;

-- Add proper RLS policy for chat attachments
CREATE POLICY "Authenticated users can view chat attachments"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'chat-attachments'
);

-- Fix 3: Drop overly permissive wallet_transactions INSERT policy
DROP POLICY IF EXISTS "Users can insert own wallet transactions" ON public.wallet_transactions;
DROP POLICY IF EXISTS "System can insert transactions" ON public.wallet_transactions;

-- Fix 4: Drop overly permissive payment_transactions policies
DROP POLICY IF EXISTS "System can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "System can update payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service can insert payment transactions" ON public.payment_transactions;
DROP POLICY IF EXISTS "Service can update payment transactions" ON public.payment_transactions;

-- Drop overly permissive notification INSERT policy
DROP POLICY IF EXISTS "System can insert notifications" ON public.notifications;
