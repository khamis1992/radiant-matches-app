-- تحسين الـ Trigger للتعامل مع INSERT المباشر بحالة completed
CREATE OR REPLACE FUNCTION public.create_booking_transaction()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- للتحديثات: فقط عند التغيير إلى completed
  IF TG_OP = 'UPDATE' AND NEW.status = 'completed' AND OLD.status != 'completed' THEN
    INSERT INTO public.transactions (booking_id, artist_id, type, amount, platform_fee, net_amount, status, description)
    VALUES (
      NEW.id,
      NEW.artist_id,
      'booking_payment',
      NEW.total_price,
      COALESCE(NEW.platform_fee, 0),
      COALESCE(NEW.artist_earnings, NEW.total_price),
      'completed',
      'Payment for booking #' || LEFT(NEW.id::TEXT, 8)
    );
  -- للإدخال المباشر بحالة completed
  ELSIF TG_OP = 'INSERT' AND NEW.status = 'completed' THEN
    INSERT INTO public.transactions (booking_id, artist_id, type, amount, platform_fee, net_amount, status, description)
    VALUES (
      NEW.id,
      NEW.artist_id,
      'booking_payment',
      NEW.total_price,
      COALESCE(NEW.platform_fee, 0),
      COALESCE(NEW.artist_earnings, NEW.total_price),
      'completed',
      'Payment for booking #' || LEFT(NEW.id::TEXT, 8)
    );
  END IF;
  RETURN NEW;
END;
$$;

-- إضافة trigger للـ INSERT إذا لم يكن موجوداً
DROP TRIGGER IF EXISTS create_booking_transaction_on_insert ON public.bookings;
CREATE TRIGGER create_booking_transaction_on_insert
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_transaction();