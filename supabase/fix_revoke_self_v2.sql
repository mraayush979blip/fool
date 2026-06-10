-- FIX: check_and_revoke_self — handles future-only phases and stuck-revoked students
-- Run this in Supabase SQL Editor

CREATE OR REPLACE FUNCTION check_and_revoke_self()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_student_id UUID;
    current_role       TEXT;
    current_status     TEXT;
    has_missed_phase   BOOLEAN;
    has_any_ended_mandatory_phase BOOLEAN;
BEGIN
    current_student_id := auth.uid();
    IF current_student_id IS NULL THEN RETURN false; END IF;

    -- Admins can never be revoked
    SELECT role, status INTO current_role, current_status
    FROM users WHERE id = current_student_id;

    IF current_role = 'admin' THEN
        IF current_status = 'revoked' THEN
            UPDATE users SET status = 'active', updated_at = NOW()
            WHERE id = current_student_id;
        END IF;
        RETURN false;
    END IF;

    -- SAFETY CHECK: are there any ended mandatory phases at all?
    -- If all phases are in the future (or there are no phases), no one should be revoked.
    SELECT EXISTS (
        SELECT 1 FROM phases p
        WHERE (p.end_date + INTERVAL '23 hours 59 minutes 59 seconds') < NOW()
          AND p.is_active = true
          AND p.is_mandatory = true
    ) INTO has_any_ended_mandatory_phase;

    IF NOT has_any_ended_mandatory_phase THEN
        -- No ended mandatory phases exist — restore if wrongly revoked, then return safe
        IF current_status = 'revoked' THEN
            UPDATE users SET status = 'active', updated_at = NOW()
            WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_RESTORE',
                    jsonb_build_object('reason', 'No ended mandatory phases exist — student restored'));
        END IF;
        RETURN false;
    END IF;

    -- Check for missed mandatory phase submissions (with optional extension support)
    SELECT EXISTS (
        SELECT 1 FROM phases p
        LEFT JOIN phase_extensions pe
               ON pe.phase_id = p.id AND pe.student_id = current_student_id
        WHERE (COALESCE(pe.extended_deadline, p.end_date) + INTERVAL '23 hours 59 minutes 59 seconds') < NOW()
          AND p.is_active = true
          AND p.is_mandatory = true
          AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.student_id = current_student_id
                AND s.phase_id = p.id
                AND s.status = 'valid'
          )
    ) INTO has_missed_phase;

    IF has_missed_phase THEN
        IF current_status = 'active' THEN
            UPDATE users SET status = 'revoked', updated_at = NOW()
            WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_REVOKE',
                    jsonb_build_object('reason', 'Missing mandatory submission detected on login'));
        END IF;
        RETURN true;
    ELSE
        IF current_status = 'revoked' THEN
            UPDATE users SET status = 'active', updated_at = NOW()
            WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_RESTORE',
                    jsonb_build_object('reason', 'All mandatory ended phases completed — access restored'));
        END IF;
        RETURN false;
    END IF;
END;
$$;
