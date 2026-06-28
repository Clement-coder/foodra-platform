-- 26_enroll_rpc.sql
-- Creates the atomic enrollment function used by /api/trainings/enroll
-- Checks capacity, prevents duplicates, and inserts the enrollment row atomically.

CREATE OR REPLACE FUNCTION enroll_with_capacity_check(
  p_training_id  UUID,
  p_user_id      UUID,
  p_full_name    TEXT,
  p_phone_number TEXT,
  p_location     TEXT
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_capacity  INTEGER;
  v_enrolled  INTEGER;
BEGIN
  -- Lock the training row to prevent race conditions
  SELECT capacity INTO v_capacity
  FROM trainings
  WHERE id = p_training_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'TRAINING_NOT_FOUND';
  END IF;

  -- Check for duplicate enrollment
  IF EXISTS (
    SELECT 1 FROM training_enrollments
    WHERE training_id = p_training_id AND user_id = p_user_id
  ) THEN
    RAISE EXCEPTION 'ALREADY_ENROLLED';
  END IF;

  -- Count current enrollments
  SELECT COUNT(*) INTO v_enrolled
  FROM training_enrollments
  WHERE training_id = p_training_id;

  IF v_enrolled >= v_capacity THEN
    RAISE EXCEPTION 'CAPACITY_FULL';
  END IF;

  -- Insert enrollment
  INSERT INTO training_enrollments (training_id, user_id, full_name, phone_number, location)
  VALUES (p_training_id, p_user_id, p_full_name, p_phone_number, p_location);

  RETURN jsonb_build_object(
    'success', true,
    'enrolled', v_enrolled + 1,
    'capacity', v_capacity
  );
END;
$$;
