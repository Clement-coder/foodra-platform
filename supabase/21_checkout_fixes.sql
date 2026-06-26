-- ============================================================
-- 21_checkout_fixes.sql
-- Complete safe migration — run this ONE file in Supabase SQL editor.
-- Uses CREATE TABLE IF NOT EXISTS and ADD COLUMN IF NOT EXISTS throughout.
-- ============================================================

-- ── CORE TABLES ──────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS users (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  privy_id          TEXT UNIQUE NOT NULL,
  name              TEXT,
  email             TEXT,
  phone             TEXT,
  role              TEXT DEFAULT 'buyer' CHECK (role IN ('buyer', 'admin', 'owner')),
  avatar_url        TEXT,
  location          TEXT,
  is_verified       BOOLEAN DEFAULT false,
  is_flagged        BOOLEAN DEFAULT false,
  terms_accepted_at TIMESTAMPTZ DEFAULT NULL,
  membership_tier   TEXT DEFAULT 'Seed',
  membership_score  INTEGER DEFAULT 0,
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

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

CREATE TABLE IF NOT EXISTS training_enrollments (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  training_id  UUID REFERENCES trainings(id) ON DELETE CASCADE,
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name    TEXT NOT NULL,
  phone_number TEXT NOT NULL,
  location     TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(training_id, user_id)
);

CREATE TABLE IF NOT EXISTS funding_applications (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID REFERENCES users(id) ON DELETE CASCADE,
  full_name             TEXT NOT NULL,
  phone_number          TEXT NOT NULL,
  location              TEXT NOT NULL,
  farm_size             DECIMAL(10,2) NOT NULL,
  farm_type             TEXT NOT NULL,
  years_of_experience   INTEGER NOT NULL,
  amount_requested      DECIMAL(10,2) NOT NULL,
  expected_outcome      TEXT NOT NULL,
  status                TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  credit_score          INTEGER,
  credit_tier           TEXT,
  credit_recommendation TEXT,
  credit_scored_at      TIMESTAMPTZ,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orders (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  buyer_id                UUID REFERENCES users(id) ON DELETE CASCADE,
  total_amount            DECIMAL(10,2) NOT NULL,
  status                  TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
  wallet_paid             BOOLEAN DEFAULT false,
  wallet_tx_id            UUID,
  paid_at                 TIMESTAMPTZ,
  delivery_full_name      TEXT,
  delivery_phone          TEXT,
  delivery_address        TEXT,
  delivery_street2        TEXT,
  delivery_landmark       TEXT,
  delivery_city           TEXT,
  delivery_state          TEXT,
  delivery_country        TEXT,
  estimated_delivery_date DATE,
  tracking_notes          TEXT,
  shipped_at              TIMESTAMPTZ,
  delivered_at            TIMESTAMPTZ,
  idempotency_key         TEXT,
  created_at              TIMESTAMPTZ DEFAULT NOW(),
  updated_at              TIMESTAMPTZ DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS orders_idempotency_key_buyer_idx
  ON orders (buyer_id, idempotency_key)
  WHERE idempotency_key IS NOT NULL;

CREATE TABLE IF NOT EXISTS order_items (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id     UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id   UUID REFERENCES products(id) ON DELETE SET NULL,
  product_name TEXT NOT NULL,
  quantity     INTEGER NOT NULL,
  price        DECIMAL(10,2) NOT NULL,
  image_url    TEXT
);

-- ── WALLET TABLES ─────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS wallet_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance_ngn NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance_ngn >= 0),
  foodra_tag  TEXT NOT NULL UNIQUE,
  pin_hash    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE OR REPLACE FUNCTION generate_foodra_tag() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.foodra_tag IS NULL OR NEW.foodra_tag = '' THEN
    NEW.foodra_tag := 'FDR-' || UPPER(SUBSTRING(NEW.user_id::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_foodra_tag ON wallet_accounts;
CREATE TRIGGER set_foodra_tag
  BEFORE INSERT ON wallet_accounts FOR EACH ROW EXECUTE FUNCTION generate_foodra_tag();

CREATE TABLE IF NOT EXISTS wallet_transactions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type            TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category        TEXT NOT NULL CHECK (category IN ('fund', 'send', 'receive', 'purchase', 'refund', 'withdraw')),
  amount_ngn      NUMERIC(14,2) NOT NULL CHECK (amount_ngn > 0),
  balance_after   NUMERIC(14,2) NOT NULL,
  reference       TEXT,
  note            TEXT,
  related_user_id UUID REFERENCES users(id),
  order_id        UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS paystack_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference     TEXT NOT NULL UNIQUE,
  amount_ngn    NUMERIC(14,2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'success', 'failed')),
  paystack_data JSONB,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id                UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ngn             NUMERIC(14,2) NOT NULL CHECK (amount_ngn > 0),
  bank_code              TEXT NOT NULL,
  bank_name              TEXT NOT NULL,
  account_number         TEXT NOT NULL,
  account_name           TEXT NOT NULL,
  status                 TEXT NOT NULL DEFAULT 'pending'
                           CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'rejected')),
  paystack_transfer_code TEXT,
  paystack_transfer_ref  TEXT,
  admin_note             TEXT,
  created_at             TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at             TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wallet_daily_withdrawals (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date      DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ngn NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_ngn >= 0),
  PRIMARY KEY (user_id, date)
);

CREATE TABLE IF NOT EXISTS wallet_pin_attempts (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fail_count   INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ── FEATURE TABLES ────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS notifications (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  type       TEXT NOT NULL,
  title      TEXT NOT NULL,
  message    TEXT NOT NULL,
  link       TEXT,
  is_read    BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
  id             UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id        UUID REFERENCES users(id) ON DELETE CASCADE,
  message        TEXT NOT NULL,
  image_url      TEXT,
  is_admin_reply BOOLEAN DEFAULT false,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cart_items (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    TEXT NOT NULL,
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity   INTEGER NOT NULL DEFAULT 1 CHECK (quantity > 0),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, product_id)
);

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

CREATE TABLE IF NOT EXISTS order_disputes (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE NOT NULL,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  reason     TEXT NOT NULL,
  details    TEXT,
  status     TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'closed')),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS product_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS product_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS push_subscriptions (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID REFERENCES users(id) ON DELETE CASCADE,
  endpoint     TEXT UNIQUE NOT NULL,
  subscription TEXT NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS wishlists (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id  UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_price NUMERIC,
  created_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE TABLE IF NOT EXISTS product_views (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE SET NULL,
  viewed_at  TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS farmer_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, buyer_id)
);

CREATE TABLE IF NOT EXISTS verification_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  id_type      TEXT NOT NULL,
  id_number    TEXT NOT NULL,
  farm_address TEXT,
  farm_size    NUMERIC(10,2),
  status       TEXT NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Approved', 'Rejected')),
  admin_note   TEXT,
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at  TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS cart_abandonment_reminders (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id          UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  items            JSONB NOT NULL DEFAULT '[]',
  total            NUMERIC(12,2) NOT NULL DEFAULT 0,
  reminder_count   INTEGER NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  next_remind_at   TIMESTAMPTZ,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- ── INDEXES ───────────────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_products_category    ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_available   ON products(is_available, created_at DESC) WHERE is_available = true;
CREATE INDEX IF NOT EXISTS idx_products_price       ON products(price);
CREATE INDEX IF NOT EXISTS idx_products_location    ON products(location);
CREATE INDEX IF NOT EXISTS idx_products_fts         ON products USING gin(
  to_tsvector('english', coalesce(name,'') || ' ' || coalesce(description,'') || ' ' || coalesce(category,''))
);
CREATE INDEX IF NOT EXISTS idx_enrollments_training ON training_enrollments(training_id);
CREATE INDEX IF NOT EXISTS idx_enrollments_user     ON training_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_funding_user         ON funding_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_orders_buyer         ON orders(buyer_id);
CREATE INDEX IF NOT EXISTS idx_order_items_order    ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user       ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_ref ON paystack_payments(reference);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user     ON wallet_withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status   ON wallet_withdrawals(status);
CREATE INDEX IF NOT EXISTS idx_daily_withdrawals_user_date ON wallet_daily_withdrawals(user_id, date);
CREATE INDEX IF NOT EXISTS idx_notifications_user   ON notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user_read ON notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_cart_user            ON cart_items(user_id);
CREATE INDEX IF NOT EXISTS idx_disputes_order       ON order_disputes(order_id);
CREATE INDEX IF NOT EXISTS idx_disputes_user        ON order_disputes(user_id);
CREATE INDEX IF NOT EXISTS idx_ratings_product      ON product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_wishlists_user       ON wishlists(user_id);
CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_verification_user    ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_cart_reminders_next  ON cart_abandonment_reminders(next_remind_at);

-- ── TRIGGERS ─────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION update_product_timestamp() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_products_updated_at ON products;
CREATE TRIGGER trg_products_updated_at
  BEFORE UPDATE ON products FOR EACH ROW EXECUTE FUNCTION update_product_timestamp();

CREATE OR REPLACE FUNCTION update_order_timestamps() RETURNS TRIGGER AS $$
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

CREATE OR REPLACE FUNCTION update_updated_at_col() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_accounts_updated_at ON wallet_accounts;
CREATE TRIGGER wallet_accounts_updated_at
  BEFORE UPDATE ON wallet_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

DROP TRIGGER IF EXISTS wallet_withdrawals_updated_at ON wallet_withdrawals;
CREATE TRIGGER wallet_withdrawals_updated_at
  BEFORE UPDATE ON wallet_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

CREATE OR REPLACE FUNCTION clear_cart_reminder_on_payment() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.wallet_paid = true AND (OLD.wallet_paid IS DISTINCT FROM true) THEN
    DELETE FROM cart_abandonment_reminders WHERE user_id = NEW.buyer_id;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_clear_cart_reminder ON orders;
CREATE TRIGGER trg_clear_cart_reminder
  AFTER UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION clear_cart_reminder_on_payment();

-- ── RLS ───────────────────────────────────────────────────────

ALTER TABLE users                      ENABLE ROW LEVEL SECURITY;
ALTER TABLE products                   ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments       ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_applications       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders                     ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items                ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_accounts            ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE paystack_payments          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_withdrawals         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_daily_withdrawals   ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_pin_attempts        ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications              ENABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages           ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_items                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE delivery_addresses         ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_disputes             ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_ratings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comments           ENABLE ROW LEVEL SECURITY;
ALTER TABLE push_subscriptions         ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlists                  ENABLE ROW LEVEL SECURITY;
ALTER TABLE farmer_ratings             ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_requests      ENABLE ROW LEVEL SECURITY;
ALTER TABLE cart_abandonment_reminders ENABLE ROW LEVEL SECURITY;

-- Drop and recreate policies idempotently
DO $$ BEGIN

  -- users
  DROP POLICY IF EXISTS "users_select_all" ON users;
  DROP POLICY IF EXISTS "users_insert_own" ON users;
  DROP POLICY IF EXISTS "users_update_own" ON users;
  CREATE POLICY "users_select_all" ON users FOR SELECT USING (true);
  CREATE POLICY "users_insert_own" ON users FOR INSERT WITH CHECK (privy_id = auth.jwt() ->> 'sub');
  CREATE POLICY "users_update_own" ON users FOR UPDATE USING (privy_id = auth.jwt() ->> 'sub');

  -- products
  DROP POLICY IF EXISTS "products_select" ON products;
  CREATE POLICY "products_select" ON products FOR SELECT USING (true);

  -- trainings
  DROP POLICY IF EXISTS "trainings_select" ON trainings;
  CREATE POLICY "trainings_select" ON trainings FOR SELECT USING (true);

  -- training_enrollments
  DROP POLICY IF EXISTS "enrollments_select" ON training_enrollments;
  DROP POLICY IF EXISTS "enrollments_insert" ON training_enrollments;
  CREATE POLICY "enrollments_select" ON training_enrollments FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "enrollments_insert" ON training_enrollments FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- funding
  DROP POLICY IF EXISTS "funding_select_own" ON funding_applications;
  DROP POLICY IF EXISTS "funding_insert_own" ON funding_applications;
  CREATE POLICY "funding_select_own" ON funding_applications FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "funding_insert_own" ON funding_applications FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- orders
  DROP POLICY IF EXISTS "orders_select_own" ON orders;
  DROP POLICY IF EXISTS "orders_insert_own" ON orders;
  DROP POLICY IF EXISTS "orders_update_own" ON orders;
  CREATE POLICY "orders_select_own" ON orders FOR SELECT USING (
    buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "orders_insert_own" ON orders FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "orders_update_own" ON orders FOR UPDATE USING (
    buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- order_items
  DROP POLICY IF EXISTS "order_items_select" ON order_items;
  CREATE POLICY "order_items_select" ON order_items FOR SELECT USING (
    order_id IN (SELECT id FROM orders WHERE buyer_id IN (
      SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
    ))
  );

  -- wallet
  DROP POLICY IF EXISTS "wallet_accounts_own" ON wallet_accounts;
  DROP POLICY IF EXISTS "wallet_tx_own" ON wallet_transactions;
  DROP POLICY IF EXISTS "paystack_payments_own" ON paystack_payments;
  DROP POLICY IF EXISTS "wallet_withdrawals_own" ON wallet_withdrawals;
  DROP POLICY IF EXISTS "daily_withdrawals_own" ON wallet_daily_withdrawals;
  DROP POLICY IF EXISTS "pin_attempts_own" ON wallet_pin_attempts;
  CREATE POLICY "wallet_accounts_own"    ON wallet_accounts        FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "wallet_tx_own"          ON wallet_transactions     FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "paystack_payments_own"  ON paystack_payments       FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "wallet_withdrawals_own" ON wallet_withdrawals      FOR SELECT USING (user_id = auth.uid());
  CREATE POLICY "daily_withdrawals_own"  ON wallet_daily_withdrawals FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "pin_attempts_own" ON wallet_pin_attempts FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- notifications
  DROP POLICY IF EXISTS "notifications_select_own" ON notifications;
  DROP POLICY IF EXISTS "notifications_update_own" ON notifications;
  CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- support
  DROP POLICY IF EXISTS "support_select_own" ON support_messages;
  DROP POLICY IF EXISTS "support_insert_own" ON support_messages;
  CREATE POLICY "support_select_own" ON support_messages FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
    OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
  );
  CREATE POLICY "support_insert_own" ON support_messages FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
    OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
  );

  -- cart
  DROP POLICY IF EXISTS "cart_own" ON cart_items;
  CREATE POLICY "cart_own" ON cart_items FOR ALL USING (auth.uid()::text = user_id);

  -- delivery addresses
  DROP POLICY IF EXISTS "delivery_own" ON delivery_addresses;
  CREATE POLICY "delivery_own" ON delivery_addresses FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- disputes
  DROP POLICY IF EXISTS "disputes_select_own" ON order_disputes;
  DROP POLICY IF EXISTS "disputes_insert_own" ON order_disputes;
  CREATE POLICY "disputes_select_own" ON order_disputes FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
    OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
  );
  CREATE POLICY "disputes_insert_own" ON order_disputes FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- ratings/comments
  DROP POLICY IF EXISTS "ratings_select" ON product_ratings;
  DROP POLICY IF EXISTS "ratings_insert" ON product_ratings;
  DROP POLICY IF EXISTS "comments_select" ON product_comments;
  DROP POLICY IF EXISTS "comments_insert" ON product_comments;
  CREATE POLICY "ratings_select"  ON product_ratings  FOR SELECT USING (true);
  CREATE POLICY "ratings_insert"  ON product_ratings  FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );
  CREATE POLICY "comments_select" ON product_comments FOR SELECT USING (true);
  CREATE POLICY "comments_insert" ON product_comments FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- push
  DROP POLICY IF EXISTS "push_subs_own" ON push_subscriptions;
  CREATE POLICY "push_subs_own" ON push_subscriptions FOR ALL USING (user_id = auth.uid());

  -- wishlists
  DROP POLICY IF EXISTS "wishlist_own" ON wishlists;
  CREATE POLICY "wishlist_own" ON wishlists FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- farmer ratings
  DROP POLICY IF EXISTS "farmer_ratings_select" ON farmer_ratings;
  DROP POLICY IF EXISTS "farmer_ratings_insert" ON farmer_ratings;
  CREATE POLICY "farmer_ratings_select" ON farmer_ratings FOR SELECT USING (true);
  CREATE POLICY "farmer_ratings_insert" ON farmer_ratings FOR INSERT WITH CHECK (
    buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- verification
  DROP POLICY IF EXISTS "verification_select_own" ON verification_requests;
  DROP POLICY IF EXISTS "verification_insert_own" ON verification_requests;
  CREATE POLICY "verification_select_own" ON verification_requests FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
    OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
  );
  CREATE POLICY "verification_insert_own" ON verification_requests FOR INSERT WITH CHECK (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

  -- cart reminders
  DROP POLICY IF EXISTS "cart_reminders_own" ON cart_abandonment_reminders;
  CREATE POLICY "cart_reminders_own" ON cart_abandonment_reminders FOR ALL USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

END $$;

-- ── RPCs ──────────────────────────────────────────────────────

CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, decrement_by INTEGER)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE current_qty INTEGER;
BEGIN
  SELECT quantity INTO current_qty FROM products WHERE id = product_id FOR UPDATE;
  IF current_qty IS NULL OR current_qty < decrement_by THEN RETURN FALSE; END IF;
  UPDATE products SET
    quantity     = quantity - decrement_by,
    is_available = (quantity - decrement_by) > 0,
    updated_at   = NOW()
  WHERE id = product_id;
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION decrement_product_stock(UUID, INTEGER) TO service_role;

CREATE OR REPLACE FUNCTION wallet_transfer(
  p_sender_id UUID, p_receiver_id UUID, p_amount NUMERIC, p_note TEXT DEFAULT NULL
) RETURNS TABLE(sender_balance NUMERIC, receiver_balance NUMERIC) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_sender_bal NUMERIC; v_receiver_bal NUMERIC;
BEGIN
  IF p_sender_id < p_receiver_id THEN
    SELECT balance_ngn INTO v_sender_bal   FROM wallet_accounts WHERE user_id = p_sender_id   FOR UPDATE;
    SELECT balance_ngn INTO v_receiver_bal FROM wallet_accounts WHERE user_id = p_receiver_id FOR UPDATE;
  ELSE
    SELECT balance_ngn INTO v_receiver_bal FROM wallet_accounts WHERE user_id = p_receiver_id FOR UPDATE;
    SELECT balance_ngn INTO v_sender_bal   FROM wallet_accounts WHERE user_id = p_sender_id   FOR UPDATE;
  END IF;
  IF v_sender_bal IS NULL   THEN RAISE EXCEPTION 'Sender wallet not found';    END IF;
  IF v_receiver_bal IS NULL THEN RAISE EXCEPTION 'Recipient wallet not found'; END IF;
  IF v_sender_bal < p_amount THEN RAISE EXCEPTION 'Insufficient balance';      END IF;
  UPDATE wallet_accounts SET balance_ngn = balance_ngn - p_amount, updated_at = now() WHERE user_id = p_sender_id;
  UPDATE wallet_accounts SET balance_ngn = balance_ngn + p_amount, updated_at = now() WHERE user_id = p_receiver_id;
  RETURN QUERY SELECT
    (SELECT balance_ngn FROM wallet_accounts WHERE user_id = p_sender_id),
    (SELECT balance_ngn FROM wallet_accounts WHERE user_id = p_receiver_id);
END;
$$;

CREATE OR REPLACE FUNCTION process_paystack_webhook(p_reference TEXT, p_user_id UUID, p_amount_ngn NUMERIC)
RETURNS TEXT LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_status TEXT; v_bal NUMERIC;
BEGIN
  SELECT status INTO v_status FROM paystack_payments WHERE reference = p_reference FOR UPDATE;
  IF v_status IS NULL    THEN RAISE EXCEPTION 'Payment reference not found'; END IF;
  IF v_status = 'success' THEN RETURN 'duplicate'; END IF;
  UPDATE paystack_payments SET status = 'success', confirmed_at = now() WHERE reference = p_reference;
  INSERT INTO wallet_accounts (user_id, balance_ngn, foodra_tag) VALUES (p_user_id, p_amount_ngn, '')
  ON CONFLICT (user_id) DO UPDATE SET balance_ngn = wallet_accounts.balance_ngn + p_amount_ngn, updated_at = now();
  SELECT balance_ngn INTO v_bal FROM wallet_accounts WHERE user_id = p_user_id;
  INSERT INTO wallet_transactions (user_id, type, category, amount_ngn, balance_after, reference, note)
  VALUES (p_user_id, 'credit', 'fund', p_amount_ngn, v_bal, p_reference, 'Wallet funded via Paystack');
  RETURN 'credited';
END;
$$;

CREATE OR REPLACE FUNCTION record_withdrawal_daily(p_user_id UUID, p_amount NUMERIC, p_limit NUMERIC DEFAULT 50000)
RETURNS TABLE(allowed BOOLEAN, withdrawn_today NUMERIC, remaining NUMERIC) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE v_today DATE := CURRENT_DATE; v_total NUMERIC;
BEGIN
  INSERT INTO wallet_daily_withdrawals (user_id, date, total_ngn) VALUES (p_user_id, v_today, 0)
  ON CONFLICT (user_id, date) DO NOTHING;
  SELECT total_ngn INTO v_total FROM wallet_daily_withdrawals WHERE user_id = p_user_id AND date = v_today FOR UPDATE;
  IF (v_total + p_amount) > p_limit THEN
    RETURN QUERY SELECT false, v_total, (p_limit - v_total); RETURN;
  END IF;
  UPDATE wallet_daily_withdrawals SET total_ngn = total_ngn + p_amount WHERE user_id = p_user_id AND date = v_today;
  RETURN QUERY SELECT true, (v_total + p_amount), (p_limit - v_total - p_amount);
END;
$$;

-- ── REALTIME ──────────────────────────────────────────────────

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='wallet_accounts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallet_accounts;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='notifications') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE notifications;
  END IF;
END $$;
