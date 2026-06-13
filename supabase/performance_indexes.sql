-- Performance Indexes (Run separately after main migration)
-- These must be run outside of transaction blocks

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_escrow 
ON orders(status, escrow_status) WHERE status != 'Cancelled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_user_time 
ON product_views(product_id, user_id, viewed_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_alerts 
ON wishlists(product_id, alert_price) WHERE alert_price IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_enrollments_capacity 
ON training_enrollments(training_id);
