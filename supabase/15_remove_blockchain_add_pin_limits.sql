-- ============================================================
-- 15_remove_blockchain_add_pin_limits.sql
--
-- 1. Remove all blockchain / escrow columns
-- 2. Remove 'farmer' role — only buyer / admin / owner
-- 3. Daily withdrawal limit table (₦50,000 / day)
-- 4. PIN brute-force protection table
-- 5. Drop rate_settings & wallet_funding_requests (USDC removed)
-- 6. decrement_product_stock RPC
-- 7. wallet_transfer atomic RPC
-- 8. process_paystack_webhook idempotent RPC
-- 9. record_withdrawal_daily RPC (enforces ₦50k limit)
-- ============================================================

-- ─── 1. Remove escrow columns from orders ───────────────────
-- Drop dependent views first
DROP VIEW IF EXISTS order_states CASCADE;

ALTER TABLE orders
  DROP COLUMN IF EXISTS escrow_tx_hash CASCADE,
  DROP COLUMN IF EXISTS escrow_status CASCADE,
  DROP COLUMN IF EXISTS usdc_amount CASCADE;

-- ─── 2. Remove escrow columns from order_items ──────────────
ALTER TABLE order_items
  DROP COLUMN IF EXISTS escrow_order_id CASCADE,
  DROP COLUMN IF EXISTS escrow_status CASCADE,
  DROP COLUMN IF EXISTS farmer_wallet CASCADE;

-- ─── 3. Remove 'farmer' role ────────────────────────────────
UPDATE users SET role = 'buyer' WHERE role = 'farmer';

ALTER TABLE users DROP CONSTRAINT IF EXISTS users_role_check;
ALTER TABLE users ADD CONSTRAINT users_role_check
  CHECK (role IN ('buyer', 'admin', 'owner'));

-- ─── 4. Daily withdrawal tracking ───────────────────────────
CREATE TABLE IF NOT EXISTS wallet_daily_withdrawals (
  user_id   UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date      DATE NOT NULL DEFAULT CURRENT_DATE,
  total_ngn NUMERIC(14,2) NOT NULL DEFAULT 0 CHECK (total_ngn >= 0),
  PRIMARY KEY (user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_daily_withdrawals_user_date
  ON wallet_daily_withdrawals(user_id, date);

ALTER TABLE wallet_daily_withdrawals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "daily_withdrawals_own" ON wallet_daily_withdrawals
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- ─── 5. PIN brute-force protection ──────────────────────────
-- Locked for 15 min after 5 consecutive failures
CREATE TABLE IF NOT EXISTS wallet_pin_attempts (
  user_id      UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  fail_count   INTEGER NOT NULL DEFAULT 0,
  locked_until TIMESTAMPTZ,
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE wallet_pin_attempts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "pin_attempts_own" ON wallet_pin_attempts
  FOR SELECT USING (
    user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
  );

-- ─── 6. Drop USDC / rate_settings ───────────────────────────
DROP TABLE IF EXISTS rate_settings CASCADE;
DROP TABLE IF EXISTS wallet_funding_requests CASCADE;

-- ─── 7. decrement_product_stock RPC ─────────────────────────
CREATE OR REPLACE FUNCTION decrement_product_stock(
  product_id   UUID,
  decrement_by INTEGER
)
RETURNS BOOLEAN AS $$
DECLARE
  current_qty INTEGER;
BEGIN
  SELECT quantity INTO current_qty
    FROM products WHERE id = product_id FOR UPDATE;

  IF current_qty IS NULL OR current_qty < decrement_by THEN
    RETURN FALSE;
  END IF;

  UPDATE products
     SET quantity     = quantity - decrement_by,
         is_available = (quantity - decrement_by) > 0,
         updated_at   = NOW()
   WHERE id = product_id;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 8. Atomic wallet transfer RPC ──────────────────────────
-- Locks both wallets in UUID order to prevent deadlocks
CREATE OR REPLACE FUNCTION wallet_transfer(
  p_sender_id   UUID,
  p_receiver_id UUID,
  p_amount      NUMERIC,
  p_note        TEXT DEFAULT NULL
)
RETURNS TABLE(sender_balance NUMERIC, receiver_balance NUMERIC) AS $$
DECLARE
  v_sender_bal   NUMERIC;
  v_receiver_bal NUMERIC;
BEGIN
  -- Lock in consistent order
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
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 9. Idempotent Paystack webhook credit RPC ───────────────
-- Returns 'credited' or 'duplicate' — safe to retry
CREATE OR REPLACE FUNCTION process_paystack_webhook(
  p_reference  TEXT,
  p_user_id    UUID,
  p_amount_ngn NUMERIC
)
RETURNS TEXT AS $$
DECLARE
  v_status TEXT;
  v_bal    NUMERIC;
BEGIN
  SELECT status INTO v_status
    FROM paystack_payments WHERE reference = p_reference FOR UPDATE;

  IF v_status IS NULL  THEN RAISE EXCEPTION 'Payment reference not found'; END IF;
  IF v_status = 'success' THEN RETURN 'duplicate'; END IF;

  UPDATE paystack_payments
     SET status = 'success', confirmed_at = now()
   WHERE reference = p_reference;

  INSERT INTO wallet_accounts (user_id, balance_ngn, foodra_tag)
  VALUES (p_user_id, p_amount_ngn, '')
  ON CONFLICT (user_id)
  DO UPDATE SET balance_ngn = wallet_accounts.balance_ngn + p_amount_ngn, updated_at = now();

  SELECT balance_ngn INTO v_bal FROM wallet_accounts WHERE user_id = p_user_id;

  INSERT INTO wallet_transactions (user_id, type, category, amount_ngn, balance_after, reference, note)
  VALUES (p_user_id, 'credit', 'fund', p_amount_ngn, v_bal, p_reference, 'Wallet funded via Paystack');

  RETURN 'credited';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ─── 10. Daily withdrawal limit RPC (₦50,000 / day) ─────────
-- Call before deducting balance. Returns allowed=true and updates tally,
-- or allowed=false with how much is remaining today.
CREATE OR REPLACE FUNCTION record_withdrawal_daily(
  p_user_id UUID,
  p_amount  NUMERIC,
  p_limit   NUMERIC DEFAULT 50000
)
RETURNS TABLE(allowed BOOLEAN, withdrawn_today NUMERIC, remaining NUMERIC) AS $$
DECLARE
  v_today DATE := CURRENT_DATE;
  v_total NUMERIC;
BEGIN
  INSERT INTO wallet_daily_withdrawals (user_id, date, total_ngn)
  VALUES (p_user_id, v_today, 0)
  ON CONFLICT (user_id, date) DO NOTHING;

  SELECT total_ngn INTO v_total
    FROM wallet_daily_withdrawals
   WHERE user_id = p_user_id AND date = v_today
     FOR UPDATE;

  IF (v_total + p_amount) > p_limit THEN
    RETURN QUERY SELECT false, v_total, (p_limit - v_total);
    RETURN;
  END IF;

  UPDATE wallet_daily_withdrawals
     SET total_ngn = total_ngn + p_amount
   WHERE user_id = p_user_id AND date = v_today;

  RETURN QUERY SELECT true, (v_total + p_amount), (p_limit - v_total - p_amount);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
