-- Drop existing triggers first
DROP TRIGGER IF EXISTS on_message_created ON public.messages;
DROP TRIGGER IF EXISTS on_booking_created ON public.bookings;
DROP TRIGGER IF EXISTS on_review_created ON public.reviews;

-- Drop existing functions
DROP FUNCTION IF EXISTS public.create_booking_notification();
DROP FUNCTION IF EXISTS public.create_message_notification();
DROP FUNCTION IF EXISTS public.create_review_notification();

-- Function to create notification for new booking (notify artist)
CREATE OR REPLACE FUNCTION public.create_booking_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_user_id UUID;
  customer_name TEXT;
  service_name TEXT;
BEGIN
  -- Get artist's user_id
  SELECT user_id INTO artist_user_id FROM public.artists WHERE id = NEW.artist_id;
  
  -- Get customer name
  SELECT full_name INTO customer_name FROM public.profiles WHERE id = NEW.customer_id;
  
  -- Get service name
  SELECT name INTO service_name FROM public.services WHERE id = NEW.service_id;
  
  -- Create notification for artist
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    artist_user_id,
    'booking',
    'حجز جديد',
    COALESCE(customer_name, 'عميل') || ' قام بحجز ' || COALESCE(service_name, 'خدمة'),
    jsonb_build_object(
      'booking_id', NEW.id,
      'customer_id', NEW.customer_id,
      'service_id', NEW.service_id,
      'booking_date', NEW.booking_date,
      'booking_time', NEW.booking_time
    )
  );
  
  RETURN NEW;
END;
$$;

-- Function to create notification for new message (notify recipient)
CREATE OR REPLACE FUNCTION public.create_message_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  recipient_id UUID;
  sender_name TEXT;
  conv RECORD;
BEGIN
  -- Get conversation details
  SELECT * INTO conv FROM public.conversations WHERE id = NEW.conversation_id;
  
  -- Get sender name
  SELECT full_name INTO sender_name FROM public.profiles WHERE id = NEW.sender_id;
  
  -- Determine recipient (if sender is customer, notify artist's user_id, otherwise notify customer)
  IF NEW.sender_id = conv.customer_id THEN
    SELECT user_id INTO recipient_id FROM public.artists WHERE id = conv.artist_id;
  ELSE
    recipient_id := conv.customer_id;
  END IF;
  
  -- Create notification for recipient
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    recipient_id,
    'message',
    'رسالة جديدة',
    COALESCE(sender_name, 'مستخدم') || ': ' || LEFT(NEW.content, 50) || CASE WHEN LENGTH(NEW.content) > 50 THEN '...' ELSE '' END,
    jsonb_build_object(
      'conversation_id', NEW.conversation_id,
      'message_id', NEW.id,
      'sender_id', NEW.sender_id
    )
  );
  
  RETURN NEW;
END;
$$;

-- Function to create notification for new review (notify artist)
CREATE OR REPLACE FUNCTION public.create_review_notification()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  artist_user_id UUID;
  customer_name TEXT;
BEGIN
  -- Get artist's user_id
  SELECT user_id INTO artist_user_id FROM public.artists WHERE id = NEW.artist_id;
  
  -- Get customer name
  SELECT full_name INTO customer_name FROM public.profiles WHERE id = NEW.customer_id;
  
  -- Create notification for artist
  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    artist_user_id,
    'review',
    'تقييم جديد',
    COALESCE(customer_name, 'عميل') || ' أضاف تقييم ' || NEW.rating || ' نجوم',
    jsonb_build_object(
      'review_id', NEW.id,
      'booking_id', NEW.booking_id,
      'customer_id', NEW.customer_id,
      'rating', NEW.rating
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create triggers
CREATE TRIGGER on_booking_created
  AFTER INSERT ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.create_booking_notification();

CREATE TRIGGER on_message_created
  AFTER INSERT ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.create_message_notification();

CREATE TRIGGER on_review_created
  AFTER INSERT ON public.reviews
  FOR EACH ROW
  EXECUTE FUNCTION public.create_review_notification();