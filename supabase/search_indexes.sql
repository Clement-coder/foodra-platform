-- Full-text search index on products for faster search
CREATE INDEX IF NOT EXISTS idx_products_fts ON products
  USING gin(to_tsvector('english', coalesce(name, '') || ' ' || coalesce(description, '') || ' ' || coalesce(category, '')));

-- Index on price for range queries
CREATE INDEX IF NOT EXISTS idx_products_price ON products(price);

-- Index on location for location filter
CREATE INDEX IF NOT EXISTS idx_products_location ON products(location);

-- Composite index for common marketplace query
CREATE INDEX IF NOT EXISTS idx_products_available_created ON products(is_available, created_at DESC)
  WHERE is_available = true;
