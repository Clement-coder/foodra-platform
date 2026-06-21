-- ============================================================
-- 03_rls.sql — Row Level Security Policies
-- Run after 01_schema.sql and 02_wallet.sql
-- ============================================================

ALTER TABLE users                ENABLE ROW LEVEL SECURITY;
ALTER TABLE products             ENABLE ROW LEVEL SECURITY;
ALTER TABLE trainings            ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE funding_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders               ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items          ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_accounts      ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_transactions  ENABLE ROW LEVEL SECURITY;
ALTER TABLE paystack_payments    ENABLE ROW LEVEL SECURITY;
ALTER TABLE wallet_withdrawals   ENABLE ROW LEVEL SECURITY;

-- Users
CREATE POLICY "users_select_all"    ON users FOR SELECT USING (true);
CREATE POLICY "users_insert_own"    ON users FOR INSERT WITH CHECK (privy_id = auth.jwt() ->> 'sub');
CREATE POLICY "users_update_own"    ON users FOR UPDATE USING (privy_id = auth.jwt() ->> 'sub');

-- Products (anyone views, only server manages)
CREATE POLICY "products_select"     ON products FOR SELECT USING (is_available = true OR is_available = false);

-- Trainings
CREATE POLICY "trainings_select"    ON trainings FOR SELECT USING (true);

-- Training enrollments
CREATE POLICY "enrollments_select"  ON training_enrollments FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "enrollments_insert"  ON training_enrollments FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Funding applications
CREATE POLICY "funding_select_own"  ON funding_applications FOR SELECT USING (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "funding_insert_own"  ON funding_applications FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Orders
CREATE POLICY "orders_select_own"   ON orders FOR SELECT USING (
  buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "orders_insert_own"   ON orders FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);

-- Order items
CREATE POLICY "order_items_select"  ON order_items FOR SELECT USING (
  order_id IN (SELECT id FROM orders WHERE buyer_id IN (
    SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
  ))
);

-- Wallet (read own only — all writes via server/admin client)
CREATE POLICY "wallet_accounts_own"     ON wallet_accounts     FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wallet_tx_own"           ON wallet_transactions  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "paystack_payments_own"   ON paystack_payments    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "wallet_withdrawals_own"  ON wallet_withdrawals   FOR SELECT USING (user_id = auth.uid());

-- NOTE: All INSERT/UPDATE on wallet tables must go through server API routes
-- using the Supabase admin/service role client, which bypasses RLS.
