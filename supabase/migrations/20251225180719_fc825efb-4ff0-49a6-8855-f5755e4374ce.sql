-- Create trigger to notify customer when booking status changes
CREATE TRIGGER on_booking_status_change
  AFTER UPDATE ON public.bookings
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_customer_booking_status();