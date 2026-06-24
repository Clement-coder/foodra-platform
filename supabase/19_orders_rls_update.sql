-- ============================================================
-- 19_orders_rls_update.sql
-- Add missing UPDATE policy on orders table for buyers
-- Run in Supabase SQL editor
-- ============================================================

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename = 'orders' AND policyname = 'orders_update_own'
  ) THEN
    CREATE POLICY "orders_update_own" ON orders FOR UPDATE USING (
      buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
    );
  END IF;
END $$;
