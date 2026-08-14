-- Booking writes are now validated by authenticated Edge Functions.
-- Keep administrator incident-management access while preventing client-side price,
-- status, and slot manipulation by customers or artists.

DROP POLICY IF EXISTS "Customers can create bookings" ON public.bookings;
DROP POLICY IF EXISTS "Customers can update own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Artists can update their bookings" ON public.bookings;
