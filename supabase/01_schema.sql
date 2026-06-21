-- ============================================================
-- 01_schema.sql — Core Tables
-- Run first
-- ============================================================

-- Users
CREATE TABLE IF NOT EXISTS users (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id        TEXT UNIQUE NOT NULL,
  name            TEXT,
  email           TEXT,
  phone           TEXT,
  role            TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'admin', 'owner')),
  avatar_url      TEXT,
  location        TEXT,
  is_verified     BOOLEAN DEFAULT false,
  is_flagged      BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ DEFAULT NULL,
  membership_tier   TEXT DEFAULT 'Seed',
  membership_score  INTEGER DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Products (Foodra is the only seller — no farmer_id needed, kept for compatibility)
CREATE TABLE IF NOT EXISTS products (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  name         TEXT NOT NULL,
  category     TEXT NOT NULL,
  quantity     INTEGER NOT NULL,
  unit         TEXT NOT NULL DEFAULT 'kg',
  price        DECIMAL(10,2) NOT NULL,
  description  TEXT,
  image_url    TEXT,
  location     TEXT,
  is_available BOOLEAN DEFAULT true,
  is_flagged   BOOLEAN DEFAULT false,
  view_count   INTEGER DEFAULT 0,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

-- Trainings
CREATE TABLE IF NOT EXISTS trainings (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title           TEXT NOT NULL,
  summary         TEXT,
  description     TEXT,
  date            TIMESTAMPTZ NOT NULL,
  mode            TEXT CHECK (mode IN ('online', 'offline')),
  location        TEXT,
  instructor_name TEXT,
  capacity        INTEGER NOT NULL,
  enrolled        INTEGER DEFAULT 0,
  price           DECIMAL(10,2),
  image_url       TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Training enrollments
CREATE TABLE IF NOT EXISTS training_enrollments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id   UUID REFERENCES trainings(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name     TEXT NOT NULL,
  phone_number  TEXT NOT NULL,
  location      TEXT NOT NULL,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_id, user_id)
);

-- Funding applications
CREATE TABLE IF NOT EXISTS funding_applications (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id              UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name            TEXT NOT NULL,
  phone_number         TEXT NOT NULL,
  location             TEXT NOT NULL,
  farm_size            DECIMAL(10,2) NOT NULL,
  farm_type            TEXT NOT NULL,
  years_of_experience  INTEGER NOT NULL,
  amount_requested     DECIMAL(10,2) NOT NULL,
  expected_outcome     TEXT NOT NULL,
  status               TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  credit_score         INTEGER,
  credit_tier          TEXT,
  credit_recommendation TEXT,
  credit_scored_at     TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT NOW()
);

-- Orders
CREATE TABLE IF NOT EXISTS orders (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  total_amount           DECIMAL(10,2) NOT NULL,
  status                 TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  -- Wallet payment
  wallet_paid            BOOLEAN DEFAULT false,
  wallet_tx_id           UUID,  -- references wallet_transactions.id
  paid_at                TIMESTAMPTZ,
  -- Delivery snapshot
  delivery_full_name     TEXT,
  delivery_phone         TEXT,
  delivery_address       TEXT,
  delivery_street2       TEXT,
  delivery_landmark      TEXT,
  delivery_city          TEXT,
  delivery_state         TEXT,
  delivery_country       TEXT,
  -- Tracking
  estimated_delivery_date DATE,
  tracking_notes         TEXT,
  shipped_at             TIMESTAMPTZ,
  delivered_at           TIMESTAMPTZ,
  created_at             TIMESTAMPTZ DEFAULT NOW(),
  updated_at             TIMESTAMPTZ DEFAULT NOW()
);

-- Order items
CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  image_url    TEXT
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_products_category        ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available       ON products(is_available, created_at DESC) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_price           ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_location        ON products(location);
CREATE INDEX IF NOT EXISTS idx_products_fts             ON products USING gin(
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))
);
CREATE INDEX IF NOT EXISTS idx_enrollments_training     ON training_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user         ON training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_user             ON funding_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_credit_score     ON funding_applications(credit_score DESC);
CREATE INDEX IF NOT EXISTS idx_orders_buyer             ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order        ON order_items(order_id);

-- Auto-update updated_at on products
CREATE OR REPLACE FUNCTION update_product_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_product_timestamp();

-- Auto-update updated_at on orders + set shipped_at / delivered_at
CREATE OR REPLACE FUNCTION update_order_timestamps()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  IF NEW.status = 'Shipped'   AND OLD.status != 'Shipped'   THEN NEW.shipped_at   = NOW(); END IF;
  IF NEW.status = 'Delivered' AND OLD.status != 'Delivered' THEN NEW.delivered_at = NOW(); END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_orders_updated_at ON orders;
CREATE TRIGGER trg_orders_updated_at
  BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_order_timestamps();
