-- Function to record unique product views (once per user per 24 hours)
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

-- Add last_alert_sent column to wishlists for price alert cooldown
ALTER TABLE wishlists 
ADD COLUMN IF NOT EXISTS last_alert_sent TIMESTAMP WITH TIME ZONE;
