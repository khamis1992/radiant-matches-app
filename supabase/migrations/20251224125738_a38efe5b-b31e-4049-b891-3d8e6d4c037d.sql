
-- Function to notify customer when booking status changes
CREATE OR REPLACE FUNCTION public.notify_customer_booking_status()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_name TEXT;
  service_name TEXT;
  notification_title TEXT;
  notification_body TEXT;
BEGIN
  -- Only trigger on status changes to confirmed or cancelled
  IF OLD.status = NEW.status THEN
    RETURN NEW;
  END IF;
  
  IF NEW.status NOT IN ('confirmed', 'cancelled') THEN
    RETURN NEW;
  END IF;
  
  -- Get artist name
  SELECT p.full_name INTO artist_name 
  FROM public.artists a 
  JOIN public.profiles p ON p.id = a.user_id 
  WHERE a.id = NEW.artist_id;
  
  -- Get service name
  SELECT name INTO service_name FROM public.services WHERE id = NEW.service_id;
  
  -- Set notification content based on status
  IF NEW.status = 'confirmed' THEN
    notification_title := 'تم تأكيد الحجز';
    notification_body := COALESCE(artist_name, 'الفنانة') || ' قامت بتأكيد حجزك لخدمة ' || COALESCE(service_name, 'الخدمة');
  ELSIF NEW.status = 'cancelled' THEN
    notification_title := 'تم إلغاء الحجز';
    notification_body := COALESCE(artist_name, 'الفنانة') || ' قامت بإلغاء حجزك لخدمة ' || COALESCE(service_name, 'الخدمة');
  END IF;
  
  -- Create notification for customer
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    NEW.customer_id,
    'booking',
    notification_title,
    notification_body,
    jsonb_build_object(
      'booking_id', NEW.id,
      'artist_id', NEW.artist_id,
      'service_id', NEW.service_id,
      'status', NEW.status,
      'booking_date', NEW.booking_date,
      'booking_time', NEW.booking_time
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger for booking status updates
DROP TRIGGER IF EXISTS on_booking_status_changed ON public.bookings;

CREATE TRIGGER on_booking_status_changed
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_booking_status();
