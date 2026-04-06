-- ============================================================
-- Migration: Wallet Funding (NGN → USDC bank transfer requests)
-- Run AFTER schema.sql and escrow_migration.sql
-- ============================================================

-- Admin-configurable exchange rate settings
CREATE TABLE IF NOT EXISTS rate_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base_ngn_per_usdc DECIMAL(18,4) NOT NULL,   -- admin-set base rate
  spread_percent     DECIMAL(5,2)  NOT NULL DEFAULT 2.5, -- profit margin %
  updated_by         UUID REFERENCES users(id),
  updated_at         TIMESTAMPTZ DEFAULT NOW()
);

-- Seed a default rate only if table is empty
INSERT INTO rate_settings (base_ngn_per_usdc, spread_percent)
SELECT 1600, 2.5
WHERE NOT EXISTS (SELECT 1 FROM rate_settings);

-- Wallet funding requests (NGN bank transfer → USDC credit)
CREATE TABLE IF NOT EXISTS wallet_funding_requests (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID REFERENCES users(id) ON DELETE CASCADE,
  reference       TEXT UNIQUE NOT NULL,          -- e.g. RC-A1B2C3
  ngn_amount      DECIMAL(18,2) NOT NULL,
  usdc_amount     DECIMAL(18,6) NOT NULL,        -- exact USDC user will receive
  rate_ngn_per_usdc DECIMAL(18,4) NOT NULL,      -- effective rate at time of request
  spread_percent  DECIMAL(5,2)  NOT NULL,
  status          TEXT NOT NULL DEFAULT 'Pending'
    CHECK (status IN ('Pending', 'Confirmed', 'Rejected', 'Expired')),
  expires_at      TIMESTAMPTZ NOT NULL,           -- 20 min from creation
  admin_note      TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wfr_user      ON wallet_funding_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_wfr_reference ON wallet_funding_requests(reference);
CREATE INDEX IF NOT EXISTS idx_wfr_status    ON wallet_funding_requests(status);
CREATE INDEX IF NOT EXISTS idx_wfr_expires   ON wallet_funding_requests(expires_at);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_wfr_timestamp()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = NOW(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_wfr_updated_at ON wallet_funding_requests;
CREATE TRIGGER trg_wfr_updated_at
  BEFORE UPDATE ON wallet_funding_requests
  FOR EACH ROW EXECUTE FUNCTION update_wfr_timestamp();

-- RLS (tables are accessed exclusively via service role key in API routes, which bypasses RLS)
ALTER TABLE wallet_funding_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE rate_settings ENABLE ROW LEVEL SECURITY;

-- Realtime for wallet_funding_requests
ALTER PUBLICATION supabase_realtime ADD TABLE wallet_funding_requests;
