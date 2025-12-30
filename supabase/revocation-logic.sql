-- Migration: Allow phase_id to be NULL in activity_logs for system-level events
ALTER TABLE activity_logs ALTER COLUMN phase_id DROP NOT NULL;

-- Function to check and revoke students who missed deadlines
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
    -- Loop through all active students
    FOR student_record IN 
        SELECT id, email, name FROM users 
        WHERE role = 'student' AND status = 'active'
    LOOP
        -- Check if there's any ended phase without a valid submission
        SELECT EXISTS (
            SELECT 1 FROM phases p
            WHERE p.end_date < NOW() -- Phase has ended
            AND p.is_active = true
            AND NOT EXISTS (
                SELECT 1 FROM submissions s
                WHERE s.student_id = student_record.id
                AND s.phase_id = p.id
                AND s.status = 'valid' -- Must have a valid submission
            )
        ) INTO missing_submission;

        -- If a submission is missing for an ended phase, revoke access
        IF missing_submission THEN
            UPDATE users SET 
                status = 'revoked',
                updated_at = NOW()
            WHERE id = student_record.id;
            
            revoked_count := revoked_count + 1;
            revoked_emails := array_append(revoked_emails, student_record.email);

            -- Log activity
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (
                student_record.id, 
                NULL, -- System level event
                'SYSTEM_AUTO_REVOKE', 
                jsonb_build_object('reason', 'Missing submission for ended phase')
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'revoked_count', revoked_count,
        'revoked_emails', revoked_emails
    );
END;
$$;

-- Function for students to trigger their own revocation check
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
    -- Get current user ID (Supabase auth context)
    current_student_id := auth.uid();
    
    IF current_student_id IS NULL THEN
        RETURN false;
    END IF;

    -- Check if student is active
    IF NOT EXISTS (SELECT 1 FROM users WHERE id = current_student_id AND status = 'active') THEN
        RETURN false;
    END IF;

    -- Check if there's any ended phase without a valid submission
    SELECT EXISTS (
        SELECT 1 FROM phases p
        WHERE p.end_date < NOW() -- Phase has ended
        AND p.is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM submissions s
            WHERE s.student_id = current_student_id
            AND s.phase_id = p.id
            AND s.status = 'valid'
        )
    ) INTO missing_submission;

    IF missing_submission THEN
        UPDATE users SET 
            status = 'revoked',
            updated_at = NOW()
        WHERE id = current_student_id;
        
        -- Log activity
        INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
        VALUES (
            current_student_id, 
            NULL, -- System level event
            'SELF_AUTO_REVOKE', 
            jsonb_build_object('reason', 'Missing submission for ended phase detected on dashboard')
        );
        
        is_revoked := true;
    END IF;

    RETURN is_revoked;
END;
$$;
