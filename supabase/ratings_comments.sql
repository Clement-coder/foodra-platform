-- ============================================================
-- Farmer Ratings & Product Comments
-- Run AFTER schema.sql, escrow_migration.sql, notifications.sql
-- ============================================================

-- Farmer ratings (buyers rate farmers after confirmed delivery)
CREATE TABLE IF NOT EXISTS farmer_ratings (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  farmer_id   UUID REFERENCES users(id) ON DELETE CASCADE,
  buyer_id    UUID REFERENCES users(id) ON DELETE CASCADE,
  order_id    UUID REFERENCES orders(id) ON DELETE CASCADE,
  stars       SMALLINT NOT NULL CHECK (stars BETWEEN 1 AND 5),
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(order_id, buyer_id)  -- one rating per order
);

CREATE INDEX IF NOT EXISTS idx_ratings_farmer ON farmer_ratings(farmer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_buyer  ON farmer_ratings(buyer_id);
CREATE INDEX IF NOT EXISTS idx_ratings_order  ON farmer_ratings(order_id);

-- Product comments
CREATE TABLE IF NOT EXISTS product_comments (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id  UUID REFERENCES products(id) ON DELETE CASCADE,
  user_id     UUID REFERENCES users(id) ON DELETE CASCADE,
  comment     TEXT NOT NULL,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_comments_product ON product_comments(product_id);
CREATE INDEX IF NOT EXISTS idx_comments_user    ON product_comments(user_id);

-- RLS
ALTER TABLE farmer_ratings   ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_comments ENABLE ROW LEVEL SECURITY;

-- Realtime
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND tablename='product_comments') THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE product_comments;
  END IF;
END $$;
