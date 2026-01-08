-- Function to restore a student and bypass missed phases
CREATE OR REPLACE FUNCTION admin_restore_student(target_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    restored_email TEXT;
    missed_phases_count INTEGER := 0;
    phase_record RECORD;
BEGIN
    -- 1. Check if user exists and is a student
    SELECT email INTO restored_email
    FROM users 
    WHERE id = target_student_id AND role = 'student';

    IF restored_email IS NULL THEN
        RAISE EXCEPTION 'Student not found or valid';
    END IF;

    -- 2. Update user status to active
    UPDATE users 
    SET status = 'active', updated_at = NOW()
    WHERE id = target_student_id;

    -- 3. Find ended phases where student has NO valid submission
    FOR phase_record IN 
        SELECT id, title 
        FROM phases 
        WHERE end_date < NOW() 
        AND is_active = true
        AND NOT EXISTS (
            SELECT 1 FROM submissions 
            WHERE student_id = target_student_id 
            AND phase_id = phases.id
            AND status = 'valid'
        )
    LOOP
        -- Insert a bypass submission
        INSERT INTO submissions (
            student_id, 
            phase_id, 
            submission_type, 
            file_url, 
            notes,
            status
        ) VALUES (
            target_student_id,
            phase_record.id,
            'file',
            'admin-bypass-restore',
            'Automatically restored by admin to enable access to next phase.',
            'valid'
        );
        
        missed_phases_count := missed_phases_count + 1;
    END LOOP;

    -- 4. Log the action
    INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
    VALUES (
        target_student_id, 
        NULL, 
        'ADMIN_RESTORE', 
        jsonb_build_object(
            'restored_by', auth.uid(),
            'bypassed_phases', missed_phases_count
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'email', restored_email,
        'bypassed_phases', missed_phases_count
    );
END;
$$;
