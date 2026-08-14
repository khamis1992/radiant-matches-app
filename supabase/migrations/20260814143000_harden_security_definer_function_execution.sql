-- Restrict SECURITY DEFINER routines that are only intended for triggers,
-- administrative services, or the completed migration process.
-- Client-side wallet mutations are intentionally excluded from direct RPC access.

REVOKE EXECUTE ON FUNCTION public.calculate_booking_commission() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_verifications() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_booking_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_booking_transaction() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_message_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_referral(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_review_notification() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.create_wallet_for_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.decrement_product_inventory_on_order() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.ensure_single_default_template() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_withdrawal_request() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.notify_customer_booking_status() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.receive_migration_batch(uuid, text, integer, integer, text, jsonb) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_artist_balance_on_booking() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_artist_rating() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_conversation_last_message() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.update_review_helpful_count() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wallet_topup(numeric, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.wallet_withdraw(numeric, text) FROM PUBLIC, anon, authenticated;

-- Role checks are used by RLS policies. Expose them only to signed-in users,
-- never to anonymous requests.
REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- Retain a constrained execution path for backend services only.
GRANT EXECUTE ON FUNCTION public.calculate_booking_commission() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_verifications() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_notification() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_booking_transaction() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_message_notification() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_referral(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.create_review_notification() TO service_role;
GRANT EXECUTE ON FUNCTION public.create_wallet_for_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.decrement_product_inventory_on_order() TO service_role;
GRANT EXECUTE ON FUNCTION public.ensure_single_default_template() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_new_user() TO service_role;
GRANT EXECUTE ON FUNCTION public.handle_withdrawal_request() TO service_role;
GRANT EXECUTE ON FUNCTION public.notify_customer_booking_status() TO service_role;
GRANT EXECUTE ON FUNCTION public.receive_migration_batch(uuid, text, integer, integer, text, jsonb) TO service_role;
GRANT EXECUTE ON FUNCTION public.update_artist_balance_on_booking() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_artist_rating() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_conversation_last_message() TO service_role;
GRANT EXECUTE ON FUNCTION public.update_review_helpful_count() TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_topup(numeric, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.wallet_withdraw(numeric, text) TO service_role;
