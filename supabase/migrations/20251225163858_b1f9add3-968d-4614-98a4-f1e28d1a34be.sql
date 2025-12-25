-- Remove the unique constraint that prevents multiple conversations per customer-artist pair
-- This allows multiple conversations for different bookings
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_customer_id_artist_id_key;

-- Add a new unique constraint that allows one conversation per booking
-- And one conversation without booking per customer-artist pair
CREATE UNIQUE INDEX conversations_customer_artist_booking_unique 
ON conversations (customer_id, artist_id, COALESCE(booking_id, '00000000-0000-0000-0000-000000000000'));