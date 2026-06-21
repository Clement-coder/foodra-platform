-- ============================================================
-- 07_cart.sql — Cart & Delivery Addresses
-- Run after 01_schema.sql
-- ============================================================

-- Cart items
CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_cart_user    ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_product ON cart_items(product_id);

ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "cart_own" ON cart_items FOR ALL USING (auth.uid()::text = user_id);

-- Delivery addresses
CREATE TABLE IF NOT EXISTS delivery_addresses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  full_name    TEXT NOT NULL,
  phone        TEXT NOT NULL,
  address_line TEXT NOT NULL,
  street_line2 TEXT,
  landmark     TEXT,
  city         TEXT NOT NULL,
  state        TEXT NOT NULL,
  country      TEXT NOT NULL DEFAULT 'Nigeria',
  country_code TEXT NOT NULL DEFAULT 'NG',
  is_default   BOOLEAN DEFAULT false,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_delivery_user    ON delivery_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_delivery_default ON delivery_addresses(user_id, is_default);

ALTER TABLE delivery_addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "delivery_own" ON delivery_addresses FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
