-- Atomic stock decrement function
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
