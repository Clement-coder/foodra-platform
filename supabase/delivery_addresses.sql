-- ============================================================
-- Migration: Delivery Addresses
-- Run this in Supabase SQL Editor
-- ============================================================

-- Delivery addresses table (reusable per user)
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  address_line TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add delivery address snapshot to orders
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS delivery_full_name TEXT,
  ADD COLUMN IF NOT EXISTS delivery_phone TEXT,
  ADD COLUMN IF NOT EXISTS delivery_address TEXT,
  ADD COLUMN IF NOT EXISTS delivery_city TEXT,
  ADD COLUMN IF NOT EXISTS delivery_state TEXT;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_user ON delivery_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_addresses_default ON delivery_addresses(user_id, is_default);

-- RLS
ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own delivery addresses" ON delivery_addresses
  FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
