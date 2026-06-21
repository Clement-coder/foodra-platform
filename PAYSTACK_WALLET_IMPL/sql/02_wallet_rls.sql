-- ============================================================
-- Foodra Wallet — Row Level Security Policies
-- Run AFTER 01_wallet_ledger.sql
-- ============================================================

ALTER TABLE wallet_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE paystack_payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_withdrawals ENABLE ROW LEVEL SECURITY;

-- wallet_accounts: user sees only their own row
CREATE POLICY "user_own_wallet" ON wallet_accounts
  FOR ALL USING (user_id = auth.uid());

-- wallet_transactions: user sees only their own
CREATE POLICY "user_own_transactions" ON wallet_transactions
  FOR ALL USING (user_id = auth.uid());

-- paystack_payments: user sees only their own
CREATE POLICY "user_own_payments" ON paystack_payments
  FOR ALL USING (user_id = auth.uid());

-- wallet_withdrawals: user sees only their own
CREATE POLICY "user_own_withdrawals" ON wallet_withdrawals
  FOR ALL USING (user_id = auth.uid());

-- NOTE: All actual mutations (credit/debit) must go through
-- server-side API routes using the admin Supabase client.
-- The RLS above is for read safety only.
