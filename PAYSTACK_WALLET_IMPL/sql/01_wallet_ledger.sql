-- ============================================================
-- Foodra Paystack Wallet — Ledger Tables
-- Run in Supabase SQL Editor
-- ============================================================

-- 1. Wallet Accounts (one per user)
CREATE TABLE IF NOT EXISTS wallet_accounts (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  balance_ngn  NUMERIC(14, 2) NOT NULL DEFAULT 0 CHECK (balance_ngn >= 0),
  foodra_tag   TEXT NOT NULL UNIQUE,  -- e.g. @emeka or FDR-00123
  pin_hash     TEXT,                  -- bcrypt hash of 4-digit PIN
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Auto-generate foodra_tag from user id if not set
CREATE OR REPLACE FUNCTION generate_foodra_tag()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.foodra_tag IS NULL OR NEW.foodra_tag = '' THEN
    NEW.foodra_tag := 'FDR-' || UPPER(SUBSTRING(NEW.user_id::TEXT, 1, 6));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_foodra_tag
  BEFORE INSERT ON wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION generate_foodra_tag();

-- 2. Wallet Transactions (full ledger history)
CREATE TABLE IF NOT EXISTS wallet_transactions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type          TEXT NOT NULL CHECK (type IN ('credit', 'debit')),
  category      TEXT NOT NULL CHECK (category IN (
                  'fund',        -- user funded wallet via Paystack
                  'send',        -- sent to another Foodra user
                  'receive',     -- received from another Foodra user
                  'purchase',    -- marketplace order payment
                  'refund',      -- order refunded
                  'withdraw'     -- withdrew to bank
                )),
  amount_ngn    NUMERIC(14, 2) NOT NULL CHECK (amount_ngn > 0),
  balance_after NUMERIC(14, 2) NOT NULL,
  reference     TEXT,            -- Paystack ref or internal ref
  note          TEXT,            -- human-readable description
  related_user_id UUID REFERENCES users(id),  -- for send/receive
  order_id      UUID,            -- for purchase/refund
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Paystack Payments (incoming payments record)
CREATE TABLE IF NOT EXISTS paystack_payments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  reference     TEXT NOT NULL UNIQUE,   -- Paystack reference
  amount_ngn    NUMERIC(14, 2) NOT NULL,
  status        TEXT NOT NULL DEFAULT 'pending'
                  CHECK (status IN ('pending', 'success', 'failed')),
  paystack_data JSONB,                  -- full webhook payload
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  confirmed_at  TIMESTAMPTZ
);

-- 4. Wallet Withdrawals (cash-out requests)
CREATE TABLE IF NOT EXISTS wallet_withdrawals (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount_ngn        NUMERIC(14, 2) NOT NULL CHECK (amount_ngn > 0),
  bank_code         TEXT NOT NULL,        -- Paystack bank code e.g. "058"
  bank_name         TEXT NOT NULL,
  account_number    TEXT NOT NULL,
  account_name      TEXT NOT NULL,        -- verified account name
  status            TEXT NOT NULL DEFAULT 'pending'
                      CHECK (status IN ('pending', 'approved', 'processing', 'completed', 'failed', 'rejected')),
  paystack_transfer_code TEXT,            -- from Paystack Transfer API
  paystack_transfer_ref  TEXT,
  admin_note        TEXT,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_wallet_transactions_user ON wallet_transactions(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_paystack_payments_ref ON paystack_payments(reference);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_user ON wallet_withdrawals(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wallet_withdrawals_status ON wallet_withdrawals(status);

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER wallet_accounts_updated_at
  BEFORE UPDATE ON wallet_accounts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER wallet_withdrawals_updated_at
  BEFORE UPDATE ON wallet_withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
