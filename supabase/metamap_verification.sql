-- MetaMap KYC verification migration
-- Ensures is_verified and terms_accepted_at columns exist on users table
-- Run this in Supabase SQL Editor if not already applied

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for quick lookup of unverified users
CREATE INDEX IF NOT EXISTS idx_users_verified ON users(is_verified) WHERE is_verified = false;

COMMENT ON COLUMN users.is_verified IS
  'Set to true by MetaMap webhook when KYC verification is approved.';

COMMENT ON COLUMN users.terms_accepted_at IS
  'Timestamp when the user accepted the Foodra Terms of Service and Privacy Policy. NULL means not yet accepted.';
