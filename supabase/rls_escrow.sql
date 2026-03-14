-- ============================================================
-- RLS Additions: Escrow & Farmer Order Access
-- Run AFTER rls.sql and escrow_migration.sql
-- ============================================================

-- Farmers can view order_items for their own products
-- (so they can see incoming orders)
CREATE POLICY "Farmers can view order items for their products"
  ON order_items FOR SELECT
  USING (
    product_id IN (
      SELECT id FROM products
      WHERE farmer_id IN (
        SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
      )
    )
  );

-- Farmers can view orders that contain their products
CREATE POLICY "Farmers can view orders containing their products"
  ON orders FOR SELECT
  USING (
    id IN (
      SELECT order_id FROM order_items
      WHERE product_id IN (
        SELECT id FROM products
        WHERE farmer_id IN (
          SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
        )
      )
    )
  );

-- Allow updating escrow_status on orders (service role only via API)
-- Buyers can update escrow_status on their own orders
CREATE POLICY "Buyers can update own order escrow status"
  ON orders FOR UPDATE
  USING (
    buyer_id IN (
      SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
    )
  );

-- Allow updating escrow_status on order_items
CREATE POLICY "Buyers can update escrow status on own order items"
  ON order_items FOR UPDATE
  USING (
    order_id IN (
      SELECT id FROM orders WHERE buyer_id IN (
        SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub'
      )
    )
  );
