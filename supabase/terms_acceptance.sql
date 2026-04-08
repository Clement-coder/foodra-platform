-- Migration: Terms of Service acceptance tracking
-- Run this in Supabase SQL Editor

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ DEFAULT NULL;

-- Index for quick lookup of users who haven't accepted yet
CREATE INDEX IF NOT EXISTS idx_users_terms ON users(terms_accepted_at)
  WHERE terms_accepted_at IS NULL;

-- Comment
COMMENT ON COLUMN users.terms_accepted_at IS
  'Timestamp when the user accepted the Foodra Terms of Service and Privacy Policy. NULL means not yet accepted.';
