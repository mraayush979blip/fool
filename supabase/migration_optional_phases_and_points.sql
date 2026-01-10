-- 1. Add is_mandatory column to phases
ALTER TABLE phases ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true;

-- 2. Update award_activity_point RPC for faster awarding (1pt/1min)
CREATE OR REPLACE FUNCTION award_activity_point()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_award TIMESTAMP;
    cooldown_interval INTERVAL := '50 seconds'; -- Allow awarding every minute
    current_time TIMESTAMP := NOW();
BEGIN
    SELECT last_point_award_at INTO last_award FROM users WHERE id = auth.uid();

    -- Check cooldown
    IF last_award IS NOT NULL AND current_time < (last_award + cooldown_interval) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cooldown active');
    END IF;

    -- Award point
    UPDATE users SET 
        points = COALESCE(points, 0) + 1,
        last_point_award_at = current_time
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true, 'points', 1);
END;
$$;

-- 3. Update revocation logic to ignore optional phases
CREATE OR REPLACE FUNCTION check_and_revoke_students()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revoked_count INTEGER := 0;
    revoked_emails TEXT[] := '{}';
    student_record RECORD;
    missing_submission BOOLEAN;
BEGIN
    FOR student_record IN 
        SELECT id, email, name FROM users 
        WHERE role = 'student' AND status = 'active'
    LOOP
        SELECT EXISTS (
            SELECT 1 FROM phases p
            WHERE p.end_date < NOW() 
            AND p.is_active = true
            AND p.is_mandatory = true -- ONLY check mandatory phases
            AND NOT EXISTS (
                SELECT 1 FROM submissions s
                WHERE s.student_id = student_record.id
                AND s.phase_id = p.id
                AND s.status = 'valid'
            )
        ) INTO missing_submission;

        IF missing_submission THEN
            UPDATE users SET 
                status = 'revoked',
                updated_at = NOW()
            WHERE id = student_record.id;
            
            revoked_count := revoked_count + 1;
            revoked_emails := array_append(revoked_emails, student_record.email);

            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (student_record.id, NULL, 'SYSTEM_AUTO_REVOKE', jsonb_build_object('reason', 'Missing submission for mandatory ended phase'));
        END IF;
    END LOOP;

    RETURN jsonb_build_object('revoked_count', revoked_count, 'revoked_emails', revoked_emails);
END;
$$;

CREATE OR REPLACE FUNCTION check_and_revoke_self()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_revoked BOOLEAN := false;
    current_student_id UUID;
    missing_submission BOOLEAN;
BEGIN
    current_student_id := auth.uid();
    IF current_student_id IS NULL THEN RETURN false; END IF;
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = current_student_id AND status = 'active') THEN RETURN false; END IF;

    SELECT EXISTS (
        SELECT 1 FROM phases p
        WHERE p.end_date < NOW() 
        AND p.is_active = true
        AND p.is_mandatory = true -- ONLY check mandatory phases
        AND NOT EXISTS (
            SELECT 1 FROM submissions s
            WHERE s.student_id = current_student_id
            AND s.phase_id = p.id
            AND s.status = 'valid'
        )
    ) INTO missing_submission;

    IF missing_submission THEN
        UPDATE users SET status = 'revoked', updated_at = NOW() WHERE id = current_student_id;
        INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
        VALUES (current_student_id, NULL, 'SELF_AUTO_REVOKE', jsonb_build_object('reason', 'Missing submission for mandatory ended phase'));
        is_revoked := true;
    END IF;

    RETURN is_revoked;
END;
$$;
