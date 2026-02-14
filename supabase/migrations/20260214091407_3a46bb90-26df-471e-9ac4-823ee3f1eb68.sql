
-- Add 'seller' to the app_role enum
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'seller';

-- Add account_type column to artists table to distinguish between artists and sellers
ALTER TABLE public.artists ADD COLUMN IF NOT EXISTS account_type text NOT NULL DEFAULT 'artist';

-- Add check constraint for account_type
ALTER TABLE public.artists ADD CONSTRAINT artists_account_type_check CHECK (account_type IN ('artist', 'seller'));
