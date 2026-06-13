-- Atomic training enrollment with capacity check
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
