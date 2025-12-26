-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Users can view all profiles" ON public.profiles;

-- Create new policy: Users can view their own full profile
CREATE POLICY "Users can view own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Create policy: Authenticated users can view profiles of artists (needed for booking/chat)
CREATE POLICY "Authenticated users can view artist profiles"
ON public.profiles
FOR SELECT
USING (
  auth.role() = 'authenticated' AND
  EXISTS (
    SELECT 1 FROM public.artists WHERE artists.user_id = profiles.id
  )
);

-- Create policy: Artists can view profiles of customers who booked with them
CREATE POLICY "Artists can view customer profiles for their bookings"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.artists a
    JOIN public.bookings b ON b.artist_id = a.id
    WHERE a.user_id = auth.uid() AND b.customer_id = profiles.id
  )
);

-- Create policy: Customers can view profiles of artists they have conversations with
CREATE POLICY "Users can view profiles in their conversations"
ON public.profiles
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    JOIN public.artists a ON a.id = c.artist_id
    WHERE (c.customer_id = auth.uid() AND a.user_id = profiles.id)
       OR (a.user_id = auth.uid() AND c.customer_id = profiles.id)
  )
);

-- Create policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles"
ON public.profiles
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));