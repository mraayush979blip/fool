-- Bulk Revoke all active students
CREATE OR REPLACE FUNCTION admin_bulk_revoke_students()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    affected_count INTEGER := 0;
BEGIN
    UPDATE users 
    SET status = 'revoked', updated_at = NOW()
    WHERE role = 'student' AND status = 'active';
    
    GET DIAGNOSTICS affected_count = ROW_COUNT;

    -- Log system level bulk event
    INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
    VALUES (
        '00000000-0000-0000-0000-000000000000', -- System level
        NULL, 
        'ADMIN_BULK_REVOKE', 
        jsonb_build_object(
            'admin_id', auth.uid(),
            'affected_count', affected_count
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'affected_count', affected_count
    );
END;
$$;

-- Bulk Restore all revoked students (with phase bypass)
CREATE OR REPLACE FUNCTION admin_bulk_restore_students()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_record RECORD;
    affected_count INTEGER := 0;
    total_bypassed_phases INTEGER := 0;
    current_bypassed_phases INTEGER;
BEGIN
    -- Loop through all revoked students
    FOR student_record IN 
        SELECT id FROM users WHERE role = 'student' AND status = 'revoked'
    LOOP
        -- Re-use logic from admin_restore_student for each student
        -- (Ideally this would be a shared internal function, but we'll inline it for reliability)
        
        -- 1. Restore status
        UPDATE users SET status = 'active', updated_at = NOW() WHERE id = student_record.id;
        
        -- 2. Bypass missed mandatory phases
        current_bypassed_phases := 0;
        
        INSERT INTO submissions (
            student_id, 
            phase_id, 
            submission_type, 
            file_url, 
            notes,
            status
        )
        SELECT 
            student_record.id,
            p.id,
            'file',
            'admin-bypass-bulk-restore',
            'Automatically restored via bulk action by admin to enable access.',
            'valid'
        FROM phases p
        WHERE p.end_date < NOW() 
        AND p.is_active = true
        AND p.is_mandatory = true
        AND NOT EXISTS (
            SELECT 1 FROM submissions s 
            WHERE s.student_id = student_record.id 
            AND s.phase_id = p.id
            AND s.status = 'valid'
        )
        ON CONFLICT (student_id, phase_id) DO NOTHING;

        GET DIAGNOSTICS current_bypassed_phases = ROW_COUNT;
        
        total_bypassed_phases := total_bypassed_phases + current_bypassed_phases;
        affected_count := affected_count + 1;
    END LOOP;

    -- Log system level bulk event
    INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
    VALUES (
        '00000000-0000-0000-0000-000000000000', -- System level
        NULL, 
        'ADMIN_BULK_RESTORE', 
        jsonb_build_object(
            'admin_id', auth.uid(),
            'affected_count', affected_count,
            'total_bypassed_phases', total_bypassed_phases
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'affected_count', affected_count,
        'total_bypassed_phases', total_bypassed_phases
    );
END;
$$;
