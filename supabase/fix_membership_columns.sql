-- ============================================================
-- Migration: Fix membership score and trigger column references
-- Run this in Supabase SQL Editor
-- ============================================================

-- Fix compute_membership_score: orders uses buyer_id, order_disputes uses user_id
CREATE OR REPLACE FUNCTION compute_membership_score(p_user_id UUID)
RETURNS INTEGER AS $$
DECLARE
  v_user RECORD;
  v_orders_count INTEGER;
  v_disputes_count INTEGER;
  v_weeks_old INTEGER;
  v_score INTEGER := 0;
BEGIN
  SELECT * INTO v_user FROM users WHERE id = p_user_id;
  IF NOT FOUND THEN RETURN 0; END IF;

  -- Profile complete: 20pts
  IF v_user.name IS NOT NULL AND v_user.phone IS NOT NULL
     AND v_user.location IS NOT NULL AND v_user.avatar_url IS NOT NULL THEN
    v_score := v_score + 20;
  END IF;

  -- Account age: 2pts/week, max 20pts
  v_weeks_old := EXTRACT(EPOCH FROM (NOW() - v_user.created_at)) / 604800;
  v_score := v_score + LEAST(v_weeks_old * 2, 20);

  -- Orders: 5pts each, max 30pts
  SELECT COUNT(*) INTO v_orders_count FROM orders WHERE buyer_id = p_user_id;
  v_score := v_score + LEAST(v_orders_count * 5, 30);

  -- No disputes: 20pts
  SELECT COUNT(*) INTO v_disputes_count FROM order_disputes WHERE user_id = p_user_id;
  IF v_disputes_count = 0 THEN
    v_score := v_score + 20;
  END IF;

  -- Verified: 10pts
  IF v_user.is_verified THEN
    v_score := v_score + 10;
  END IF;

  RETURN LEAST(v_score, 100);
END;
$$ LANGUAGE plpgsql;

-- Fix trigger: orders uses buyer_id not user_id
CREATE OR REPLACE FUNCTION trg_order_membership()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM refresh_user_membership(NEW.buyer_id);
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
