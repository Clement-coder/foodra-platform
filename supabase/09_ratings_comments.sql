-- ============================================================
-- 09_ratings_comments.sql — Product Comments & Ratings
-- Run after 01_schema.sql
-- ============================================================

-- Product ratings (buyers rate after delivery)
CREATE TABLE IF NOT EXISTS product_ratings (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  buyer_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id   UUID REFERENCES orders(id) ON DELETE CASCADE,
  stars      SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, buyer_id)
);

CREATE INDEX IF NOT EXISTS idx_ratings_product ON product_ratings(product_id);
CREATE INDEX IF NOT EXISTS idx_ratings_buyer   ON product_ratings(buyer_id);

-- Product comments
CREATE TABLE IF NOT EXISTS product_comments (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  comment    TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_user    ON product_comments(user_id);

ALTER TABLE product_ratings  ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "ratings_select"  ON product_ratings FOR SELECT USING (true);
CREATE POLICY "ratings_insert"  ON product_ratings FOR INSERT WITH CHECK (
  buyer_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
CREATE POLICY "comments_select" ON product_comments FOR SELECT USING (true);
CREATE POLICY "comments_insert" ON product_comments FOR INSERT WITH CHECK (
  user_id IN (SELECT id FROM users WHERE privy_id = auth.jwt() ->> 'sub')
);
