-- ============================================================
-- Migration: Escrow & Accountability Fields
-- Run this in Supabase SQL Editor AFTER schema.sql
-- ============================================================

-- 1. Products: soft-delete flag, flagged farmer guard
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 2. Users: accountability counters + flag
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS is_flagged BOOLEAN DEFAULT false,
  ADD COLUMN IF NOT EXISTS completed_orders INTEGER DEFAULT 0,
  ADD COLUMN IF NOT EXISTS disputed_orders INTEGER DEFAULT 0;

-- 3. Orders: escrow on-chain tracking
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS escrow_tx_hash TEXT,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none'
    CHECK (escrow_status IN ('none', 'locked', 'released', 'refunded', 'disputed')),
  ADD COLUMN IF NOT EXISTS usdc_amount DECIMAL(18,6),
  ADD COLUMN IF NOT EXISTS ngn_to_usdc_rate DECIMAL(18,6);

-- 4. Order items: per-product escrow key + farmer wallet snapshot
ALTER TABLE order_items
  ADD COLUMN IF NOT EXISTS escrow_order_id TEXT,
  ADD COLUMN IF NOT EXISTS farmer_wallet TEXT,
  ADD COLUMN IF NOT EXISTS escrow_status TEXT DEFAULT 'none'
    CHECK (escrow_status IN ('none', 'locked', 'released', 'refunded', 'disputed'));

-- 5. Indexes
CREATE INDEX IF NOT EXISTS idx_users_wallet ON users(wallet_address);
CREATE INDEX IF NOT EXISTS idx_orders_escrow_status ON orders(escrow_status);
CREATE INDEX IF NOT EXISTS idx_products_available ON products(is_available, is_flagged);

-- 6. Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products
  FOR EACH ROW EXECUTE FUNCTION update_product_timestamp();

-- 7. Auto-update updated_at on orders
CREATE OR REPLACE FUNCTION update_order_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders
  FOR EACH ROW EXECUTE FUNCTION update_order_timestamp();

-- 8. Block flagged farmers from listing new products
CREATE OR REPLACE FUNCTION prevent_flagged_farmer_listing()
RETURNS TRIGGER AS $$
BEGIN
  IF EXISTS (SELECT 1 FROM users WHERE id = NEW.farmer_id AND is_flagged = true) THEN
    RAISE EXCEPTION 'Your account has been flagged and cannot list new products. Contact support.';
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_block_flagged_farmer ON products;
CREATE TRIGGER trg_block_flagged_farmer
  BEFORE INSERT ON products
  FOR EACH ROW EXECUTE FUNCTION prevent_flagged_farmer_listing();
