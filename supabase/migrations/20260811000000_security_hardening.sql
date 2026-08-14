-- Security hardening (2026-08-11)
-- 1. Revoke self-credit wallet top-up from clients (infinite-money bug)
-- 2. Freeze bookings.total_price against client-side tampering

-- 1. wallet_topup lets any authenticated user mint arbitrary balance with no
--    payment verification. Revoke client access; keep the function for
--    service-role use only (e.g. a future verified SADAD top-up flow).
REVOKE EXECUTE ON FUNCTION public.wallet_topup FROM authenticated;
REVOKE EXECUTE ON FUNCTION public.wallet_topup FROM anon;

-- 2. bookings.total_price is the amount SADAD charges; it must never be
--    changed by clients after creation. Service role (SADAD callbacks) and
--    admins may still adjust it.
CREATE OR REPLACE FUNCTION public.protect_booking_amount()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.total_price IS DISTINCT FROM OLD.total_price THEN
    IF auth.role() = 'service_role' OR public.has_role(auth.uid(), 'admin') THEN
      RETURN NEW;
    END IF;
    RAISE EXCEPTION 'total_price is immutable';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_booking_amount_trigger ON public.bookings;
CREATE TRIGGER protect_booking_amount_trigger
BEFORE UPDATE OF total_price ON public.bookings
FOR EACH ROW
EXECUTE FUNCTION public.protect_booking_amount();
