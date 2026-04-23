-- Product views tracking for analytics
CREATE TABLE IF NOT EXISTS product_views (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  user_id uuid REFERENCES users(id) ON DELETE SET NULL,
  viewed_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_views_product ON product_views(product_id);
CREATE INDEX IF NOT EXISTS idx_product_views_time ON product_views(viewed_at DESC);

-- Materialized view for top products by views (refresh daily)
CREATE MATERIALIZED VIEW IF NOT EXISTS product_view_counts AS
  SELECT product_id, COUNT(*) AS view_count
  FROM product_views
  WHERE viewed_at > now() - interval '30 days'
  GROUP BY product_id;

CREATE UNIQUE INDEX IF NOT EXISTS idx_product_view_counts ON product_view_counts(product_id);
