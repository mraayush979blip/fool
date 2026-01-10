-- 1. Ensure points column exists and NOT NULL for all users
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ALTER COLUMN last_point_award_at TYPE TIMESTAMPTZ;
UPDATE users SET points = 0 WHERE points IS NULL;

-- 2. Ensure is_mandatory column exists
ALTER TABLE phases ADD COLUMN IF NOT EXISTS is_mandatory BOOLEAN DEFAULT true;

-- 3. Optimized Point Awarding RPC (1 point per 1 minute rule)
CREATE OR REPLACE FUNCTION award_activity_point()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_award TIMESTAMPTZ;
    cooldown_interval INTERVAL := '50 seconds'; -- Allow awarding every 1 minute
BEGIN
    SELECT last_point_award_at INTO last_award FROM users WHERE id = auth.uid();

    -- Check cooldown using TIMESTAMPTZ
    IF last_award IS NOT NULL AND NOW() < (last_award + cooldown_interval) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cooldown active');
    END IF;

    -- Award point and increment time spent (with COALESCE for safety)
    UPDATE users SET 
        points = COALESCE(points, 0) + 1,
        total_time_spent_seconds = COALESCE(total_time_spent_seconds, 0) + 60, -- 1 point = 1 minute
        last_point_award_at = NOW()
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true, 'points', 1);
END;
$$;

-- 4. Update revocation logic to ignore optional phases
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
