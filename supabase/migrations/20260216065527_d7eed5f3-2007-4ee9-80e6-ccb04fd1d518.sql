
-- Add last_ip column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS last_ip_at timestamp with time zone;
