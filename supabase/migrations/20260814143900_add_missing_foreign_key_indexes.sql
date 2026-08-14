-- Cover foreign-key columns identified by the Supabase performance advisor.
-- These indexes improve joins and parent-row updates without changing application data.

CREATE INDEX IF NOT EXISTS idx_biometric_credentials_user_id ON public.biometric_credentials (user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_artist_id ON public.bookings (artist_id);
CREATE INDEX IF NOT EXISTS idx_bookings_customer_id ON public.bookings (customer_id);
CREATE INDEX IF NOT EXISTS idx_bookings_promo_code_id ON public.bookings (promo_code_id);
CREATE INDEX IF NOT EXISTS idx_bookings_service_id ON public.bookings (service_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation_id ON public.messages (conversation_id);
CREATE INDEX IF NOT EXISTS idx_platform_settings_updated_by ON public.platform_settings (updated_by);
CREATE INDEX IF NOT EXISTS idx_promo_codes_created_by ON public.promo_codes (created_by);
CREATE INDEX IF NOT EXISTS idx_report_templates_created_by ON public.report_templates (created_by);
CREATE INDEX IF NOT EXISTS idx_reviews_artist_id ON public.reviews (artist_id);
CREATE INDEX IF NOT EXISTS idx_reviews_customer_id ON public.reviews (customer_id);
CREATE INDEX IF NOT EXISTS idx_services_artist_id ON public.services (artist_id);
CREATE INDEX IF NOT EXISTS idx_shopping_cart_product_id ON public.shopping_cart (product_id);
CREATE INDEX IF NOT EXISTS idx_transactions_artist_id ON public.transactions (artist_id);
CREATE INDEX IF NOT EXISTS idx_transactions_booking_id ON public.transactions (booking_id);
