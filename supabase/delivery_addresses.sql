-- ============================================================
-- Migration: Delivery Addresses (v2 - extended fields)
-- Run this in Supabase SQL Editor
-- ============================================================

-- Delivery addresses table (reusable per user)
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  street_line2 TEXT,
  landmark TEXT,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'Nigeria',
  country_code TEXT NOT NULL DEFAULT 'NG',
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add delivery address snapshot to orders (run only if not already added)
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_full_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_street2 TEXT,
  ADD COLUMN IF NOT EXISTS delivery_landmark TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_state TEXT,
  ADD COLUMN IF NOT EXISTS delivery_country TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user ON delivery_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_default ON delivery_addresses(user_id, is_default);

-- RLS
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own delivery addresses" ON delivery_addresses
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
