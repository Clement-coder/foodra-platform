-- Data Consistency Fixes Migration
-- Run this after all existing migrations to fix data consistency issues

-- 1. Atomic stock decrement function
CREATE OR REPLACE FUNCTION decrement_product_stock(product_id UUID, decrement_by INTEGER)
RETURNS BOOLEAN
LANGUAGE plpgsql
AS $$
DECLARE
    current_qty INTEGER;
BEGIN
    -- Lock row and get current quantity
    SELECT quantity INTO current_qty
    FROM products
    WHERE id = product_id
    FOR UPDATE;
    
    -- Check if sufficient stock exists
    IF current_qty IS NULL OR current_qty < decrement_by THEN
        RETURN FALSE;
    END IF;
    
    -- Update quantity and availability
    UPDATE products
    SET 
        quantity = current_qty - decrement_by,
        is_available = (current_qty - decrement_by) > 0,
        updated_at = NOW()
    WHERE id = product_id;
    
    RETURN TRUE;
END;
$$;

-- 2. Atomic training enrollment with capacity check
CREATE OR REPLACE FUNCTION enroll_with_capacity_check(
    p_training_id UUID,
    p_user_id UUID,
    p_full_name TEXT,
    p_phone_number TEXT,
    p_location TEXT
)
RETURNS UUID
LANGUAGE plpgsql
AS $$
DECLARE
    training_capacity INTEGER;
    current_enrollments INTEGER;
    enrollment_id UUID;
BEGIN
    -- Lock training row and get capacity
    SELECT capacity INTO training_capacity
    FROM trainings
    WHERE id = p_training_id
    FOR UPDATE;
    
    -- Count current enrollments
    SELECT COUNT(*) INTO current_enrollments
    FROM training_enrollments
    WHERE training_id = p_training_id;
    
    -- Check if user already enrolled
    IF EXISTS (SELECT 1 FROM training_enrollments WHERE training_id = p_training_id AND user_id = p_user_id) THEN
        RAISE EXCEPTION 'ALREADY_ENROLLED';
    END IF;
    
    -- Check capacity
    IF training_capacity IS NOT NULL AND current_enrollments >= training_capacity THEN
        RAISE EXCEPTION 'CAPACITY_FULL';
    END IF;
    
    -- Insert enrollment
    INSERT INTO training_enrollments (training_id, user_id, full_name, phone_number, location)
    VALUES (p_training_id, p_user_id, p_full_name, p_phone_number, p_location)
    RETURNING id INTO enrollment_id;
    
    RETURN enrollment_id;
END;
$$;

-- 3. Function to record unique product views (once per user per 24 hours)
CREATE OR REPLACE FUNCTION record_unique_view(p_product_id UUID, p_user_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
    -- Insert only if user hasn't viewed this product in last 24 hours
    INSERT INTO product_views (product_id, user_id, viewed_at)
    SELECT p_product_id, p_user_id, NOW()
    WHERE NOT EXISTS (
        SELECT 1 FROM product_views 
        WHERE product_id = p_product_id 
        AND user_id = p_user_id 
        AND viewed_at > NOW() - INTERVAL '24 hours'
    );
END;
$$;

-- 4. Add last_alert_sent column to wishlists for price alert cooldown
ALTER TABLE wishlists 
ADD COLUMN IF NOT EXISTS last_alert_sent TIMESTAMP WITH TIME ZONE;

-- 5. Add indexes for performance on frequently queried columns
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_orders_status_escrow 
ON orders(status, escrow_status) WHERE status != 'Cancelled';

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_product_views_user_time 
ON product_views(product_id, user_id, viewed_at);

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_wishlists_alerts 
ON wishlists(product_id, alert_price) WHERE alert_price IS NOT NULL;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_training_enrollments_capacity 
ON training_enrollments(training_id);

-- 6. Update any existing order statuses that have conflicts
UPDATE orders 
SET status = 'Delivered' 
WHERE escrow_status = 'released' AND status = 'Shipped' AND delivered_at IS NOT NULL;

UPDATE orders 
SET status = 'Cancelled' 
WHERE escrow_status = 'refunded' AND status NOT IN ('Cancelled', 'Refunded');

-- 7. Clean up duplicate product views from same user on same day (keep latest)
WITH ranked_views AS (
    SELECT id, 
           ROW_NUMBER() OVER (
               PARTITION BY product_id, user_id, DATE(viewed_at) 
               ORDER BY viewed_at DESC
           ) as rn
    FROM product_views 
    WHERE user_id IS NOT NULL
)
DELETE FROM product_views 
WHERE id IN (SELECT id FROM ranked_views WHERE rn > 1);

-- 8. Add constraints to prevent data inconsistencies
ALTER TABLE products 
ADD CONSTRAINT check_quantity_non_negative 
CHECK (quantity >= 0);

ALTER TABLE orders 
ADD CONSTRAINT check_total_amount_positive 
CHECK (total_amount > 0);

-- Create a view for consistent order states
CREATE OR REPLACE VIEW order_states AS
SELECT 
    id,
    CASE 
        WHEN escrow_status = 'disputed' THEN 'Disputed'
        WHEN escrow_status = 'refunded' THEN 'Refunded'
        WHEN escrow_status = 'locked' AND status = 'Cancelled' THEN 'Cancelled (Locked)'
        WHEN status = 'Delivered' THEN 'Delivered'
        WHEN status = 'Shipped' THEN 'Shipped'
        WHEN status = 'Processing' THEN 'Processing'
        WHEN status = 'Cancelled' THEN 'Cancelled'
        ELSE 'Pending'
    END as computed_state,
    status,
    escrow_status
FROM orders;
