-- Product wishlist table (server-side persistence for logged-in users)
CREATE TABLE IF NOT EXISTS wishlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  alert_price numeric,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, product_id)
);

CREATE INDEX IF NOT EXISTS idx_wishlists_user ON wishlists(user_id);

-- RLS
ALTER TABLE wishlists ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own wishlist" ON wishlists
  USING (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid)
  WITH CHECK (user_id = (current_setting('request.jwt.claims', true)::json->>'sub')::uuid);
