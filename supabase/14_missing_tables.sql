-- ============================================================
-- 14_missing_tables.sql — Tables referenced in code but missing
-- Run after 13_seed.sql
-- ============================================================

-- ─── 1. Farmer/User Ratings ────────────────────────────────
-- Used by /api/ratings and /api/users/[id]/stats
-- "ratings" is also queried as an alias from user stats route
CREATE TABLE IF NOT EXISTS farmer_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id  UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  buyer_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id) ON DELETE SET NULL,
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_farmer_ratings_farmer ON farmer_ratings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_farmer_ratings_buyer  ON farmer_ratings(buyer_id);

ALTER TABLE farmer_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "farmer_ratings_select" ON farmer_ratings FOR SELECT USING (true);
CREATE POLICY "farmer_ratings_insert" ON farmer_ratings FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- ─── 2. Verification Requests ──────────────────────────────
-- Used by /api/verification (farmer identity verification)
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

CREATE INDEX IF NOT EXISTS idx_verification_user   ON verification_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_verification_status ON verification_requests(status);

ALTER TABLE verification_requests ENABLE ROW LEVEL SECURITY;
CREATE POLICY "verification_select_own" ON verification_requests FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  OR EXISTS (SELECT 1 FROM users WHERE privy_id = auth.jwt() ->> 'sub' AND role IN ('admin','owner'))
);
CREATE POLICY "verification_insert_own" ON verification_requests FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- ─── 3. Rate Settings ──────────────────────────────────────
-- Used by /api/admin/rate (admin-configurable NGN/USDC rate)
CREATE TABLE IF NOT EXISTS rate_settings (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_ngn_per_usdc   NUMERIC(12,4) NOT NULL DEFAULT 1600,
  spread_percent      NUMERIC(5,2)  NOT NULL DEFAULT 1.5,
  updated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
  updated_at          TIMESTAMPTZ DEFAULT NOW(),
  created_at          TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE rate_settings ENABLE ROW LEVEL SECURITY;
-- Only admins write; anyone can read
CREATE POLICY "rate_settings_select" ON rate_settings FOR SELECT USING (true);

-- Seed one default row so GET never 404s
INSERT INTO rate_settings (base_ngn_per_usdc, spread_percent)
VALUES (1600, 1.5)
ON CONFLICT DO NOTHING;

-- ─── 4. Cart Abandonment Reminders ─────────────────────────
-- Used by /api/cart/remind and /api/orders/auto-status cron
CREATE TABLE IF NOT EXISTS cart_abandonment_reminders (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  items           JSONB NOT NULL DEFAULT '[]',
  total           NUMERIC(12,2) NOT NULL DEFAULT 0,
  reminder_count  INTEGER NOT NULL DEFAULT 0,
  last_reminded_at TIMESTAMPTZ,
  next_remind_at  TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cart_reminders_next ON cart_abandonment_reminders(next_remind_at);

ALTER TABLE cart_abandonment_reminders ENABLE ROW LEVEL SECURITY;
-- All access via service-role only (cron + server routes)
CREATE POLICY "cart_reminders_own" ON cart_abandonment_reminders FOR ALL USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
