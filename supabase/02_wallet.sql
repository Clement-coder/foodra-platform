-- ============================================================
-- 02_wallet.sql — Paystack Custodial Wallet Tables
-- Run after 01_schema.sql
-- ============================================================

-- One wallet per user — balance is NGN held in Foodra's Paystack account
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance_ngn NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (balance_ngn >= 0),
  foodra_tag  TEXT NOT NULL UNIQUE,
  pin_hash    TEXT,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate foodra_tag from user_id prefix
CREATE OR REPLACE FUNCTION generate_foodra_tag()
RETURNS TRIGGER AS $$
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

-- Full ledger of every debit/credit
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category      TEXT NOT NULL CHECK (category IN ('fund', 'send', 'receive', 'purchase', 'refund', 'withdraw')),
  amount_ngn    NUMERIC(14,2) NOT NULL CHECK (amount_ngn > 0),
  balance_after NUMERIC(14,2) NOT NULL,
  reference     TEXT,
  note          TEXT,
  related_user_id UUID REFERENCES users(id),
  order_id      UUID REFERENCES orders(id) ON DELETE SET NULL,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Paystack incoming payment records
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

-- Cash-out requests (NGN to bank)
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

-- Indexes
CREATE INDEX IF NOT EXISTS idx_wallet_tx_user       ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_ref ON paystack_payments(reference);
CREATE INDEX IF NOT EXISTS idx_withdrawals_user      ON wallet_withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_status    ON wallet_withdrawals(status);

-- Auto updated_at
CREATE OR REPLACE FUNCTION update_updated_at_col()
RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS wallet_accounts_updated_at ON wallet_accounts;
CREATE TRIGGER wallet_accounts_updated_at
  BEFORE UPDATE ON wallet_accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

DROP TRIGGER IF EXISTS wallet_withdrawals_updated_at ON wallet_withdrawals;
CREATE TRIGGER wallet_withdrawals_updated_at
  BEFORE UPDATE ON wallet_withdrawals FOR EACH ROW EXECUTE FUNCTION update_updated_at_col();

-- Realtime for wallet_accounts so balance updates instantly in UI
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables
    WHERE pubname='supabase_realtime' AND tablename='wallet_accounts') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE wallet_accounts;
  END IF;
END $$;
