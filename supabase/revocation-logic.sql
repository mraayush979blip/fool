-- Migration: Allow phase_id to be NULL in activity_logs for system-level events
ALTER TABLE activity_logs ALTER COLUMN phase_id DROP NOT NULL;

-- Function to check and sync status for all students (Revoke/Restore)
CREATE OR REPLACE FUNCTION check_and_revoke_students()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    revoked_count INTEGER := 0;
    restored_count INTEGER := 0;
    revoked_emails TEXT[] := '{}';
    restored_emails TEXT[] := '{}';
    student_record RECORD;
    missing_mandatory_submission BOOLEAN;
BEGIN
    -- Loop through all student users
    FOR student_record IN 
        SELECT id, email, name, status FROM users 
        WHERE role = 'student'
    LOOP
        -- Check if there's any ended, active, mandatory phase without a valid submission
        SELECT EXISTS (
            SELECT 1 FROM phases p
            WHERE p.end_date < NOW() 
            AND p.is_active = true
            AND p.is_mandatory = true
            AND NOT EXISTS (
                SELECT 1 FROM submissions s
                WHERE s.student_id = student_record.id
                AND s.phase_id = p.id
                AND s.status = 'valid'
            )
        ) INTO missing_mandatory_submission;

        -- CASE 1: Student should be revoked but is currently active
        IF missing_mandatory_submission AND student_record.status = 'active' THEN
            UPDATE users SET 
                status = 'revoked',
                updated_at = NOW()
            WHERE id = student_record.id;
            
            revoked_count := revoked_count + 1;
            revoked_emails := array_append(revoked_emails, student_record.email);

            -- Log revocation
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (
                student_record.id, 
                NULL, 
                'SYSTEM_AUTO_REVOKE', 
                jsonb_build_object('reason', 'Missing submission for mandatory ended phase')
            );

        -- CASE 2: Student should be active but is currently revoked (RESTORE)
        ELSIF NOT missing_mandatory_submission AND student_record.status = 'revoked' THEN
            UPDATE users SET 
                status = 'active',
                updated_at = NOW()
            WHERE id = student_record.id;
            
            restored_count := restored_count + 1;
            restored_emails := array_append(restored_emails, student_record.email);

            -- Log restoration
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (
                student_record.id, 
                NULL, 
                'SYSTEM_AUTO_RESTORE', 
                jsonb_build_object('reason', 'All mandatory ended phases completed or made optional')
            );
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'revoked_count', revoked_count,
        'restored_count', restored_count,
        'revoked_emails', revoked_emails,
        'restored_emails', restored_emails
    );
END;
$$;

-- Function for students to trigger their own status sync
CREATE OR REPLACE FUNCTION check_and_revoke_self()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_student_id UUID;
    current_status TEXT;
    missing_mandatory_submission BOOLEAN;
BEGIN
    current_student_id := auth.uid();
    
    IF current_student_id IS NULL THEN
        RETURN false;
    END IF;

    -- Get current status
    SELECT status INTO current_status FROM users WHERE id = current_student_id;

    -- Check if there's any ended, active, mandatory phase without a valid submission
    SELECT EXISTS (
        SELECT 1 FROM phases p
        WHERE p.end_date < NOW() 
        AND p.is_active = true
        AND p.is_mandatory = true
        AND NOT EXISTS (
            SELECT 1 FROM submissions s
            WHERE s.student_id = current_student_id
            AND s.phase_id = p.id
            AND s.status = 'valid'
        )
    ) INTO missing_mandatory_submission;

    IF missing_mandatory_submission THEN
        -- Ensure they are revoked
        IF current_status = 'active' THEN
            UPDATE users SET 
                status = 'revoked',
                updated_at = NOW()
            WHERE id = current_student_id;
            
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (
                current_student_id, 
                NULL, 
                'SELF_AUTO_REVOKE', 
                jsonb_build_object('reason', 'Missing submission for mandatory ended phase detected on dashboard')
            );
        END IF;
        RETURN true; -- Student is revoked
    ELSE
        -- Ensure they are restored if previously revoked
        IF current_status = 'revoked' THEN
            UPDATE users SET 
                status = 'active',
                updated_at = NOW()
            WHERE id = current_student_id;
            
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (
                current_student_id, 
                NULL, 
                'SELF_AUTO_RESTORE', 
                jsonb_build_object('reason', 'Mandatory submission condition met')
            );
        END IF;
        RETURN false; -- Student is active
    END IF;
END;
$$;
