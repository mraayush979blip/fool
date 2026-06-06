-- Phase Extensions System SQL
-- Run this in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS public.phase_extensions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES public.phases(id) ON DELETE CASCADE,
    extended_deadline TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(student_id, phase_id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_phase_extensions_lookup ON public.phase_extensions(student_id, phase_id);

-- 1. Optimized global revocation check with Extensions
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
BEGIN
    WITH to_revoke AS (
        SELECT u.id, u.email
        FROM users u
        WHERE u.role = 'student' 
          AND u.status = 'active'
          AND EXISTS (
              SELECT 1 FROM phases p
              LEFT JOIN phase_extensions pe ON pe.phase_id = p.id AND pe.student_id = u.id
              WHERE (COALESCE(pe.extended_deadline, p.end_date) + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
                AND p.is_active = true
                AND p.is_mandatory = true
                AND NOT EXISTS (
                    SELECT 1 FROM submissions s
                    WHERE s.student_id = u.id
                      AND s.phase_id = p.id
                      AND s.status = 'valid'
                )
          )
    ),
    updated_revoked AS (
        UPDATE users u
        SET status = 'revoked', updated_at = NOW()
        FROM to_revoke
        WHERE u.id = to_revoke.id
        RETURNING u.email
    )
    SELECT COALESCE(array_agg(email), '{}') INTO revoked_emails FROM updated_revoked;
    
    revoked_count := array_length(revoked_emails, 1);
    IF revoked_count IS NULL THEN revoked_count := 0; END IF;

    IF revoked_count > 0 THEN
        INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
        SELECT u.id, NULL, 'SYSTEM_AUTO_REVOKE', jsonb_build_object('reason', 'Missing submission for mandatory ended phase (Optimized Batch)')
        FROM users u WHERE u.email = ANY(revoked_emails);
    END IF;

    WITH to_restore AS (
        SELECT u.id, u.email
        FROM users u
        WHERE u.role = 'student' 
          AND u.status = 'revoked'
          AND NOT EXISTS (
              SELECT 1 FROM phases p
              LEFT JOIN phase_extensions pe ON pe.phase_id = p.id AND pe.student_id = u.id
              WHERE (COALESCE(pe.extended_deadline, p.end_date) + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
                AND p.is_active = true
                AND p.is_mandatory = true
                AND NOT EXISTS (
                    SELECT 1 FROM submissions s
                    WHERE s.student_id = u.id
                      AND s.phase_id = p.id
                      AND s.status = 'valid'
                )
          )
    ),
    updated_restored AS (
        UPDATE users u
        SET status = 'active', updated_at = NOW()
        FROM to_restore
        WHERE u.id = to_restore.id
        RETURNING u.email
    )
    SELECT COALESCE(array_agg(email), '{}') INTO restored_emails FROM updated_restored;

    restored_count := array_length(restored_emails, 1);
    IF restored_count IS NULL THEN restored_count := 0; END IF;

    IF restored_count > 0 THEN
        INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
        SELECT u.id, NULL, 'SYSTEM_AUTO_RESTORE', jsonb_build_object('reason', 'All mandatory ended phases completed (Optimized Batch)')
        FROM users u WHERE u.email = ANY(restored_emails);
    END IF;

    RETURN jsonb_build_object(
        'revoked_count', revoked_count,
        'restored_count', restored_count,
        'revoked_emails', revoked_emails,
        'restored_emails', restored_emails
    );
END;
$$;

-- 2. Optimized self-check with Extensions
CREATE OR REPLACE FUNCTION check_and_revoke_self()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_student_id UUID;
    current_status TEXT;
    is_missing_submission BOOLEAN;
BEGIN
    current_student_id := auth.uid();
    IF current_student_id IS NULL THEN RETURN false; END IF;

    SELECT EXISTS (
        SELECT 1 FROM phases p
        LEFT JOIN phase_extensions pe ON pe.phase_id = p.id AND pe.student_id = current_student_id
        WHERE (COALESCE(pe.extended_deadline, p.end_date) + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
          AND p.is_active = true
          AND p.is_mandatory = true
          AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.student_id = current_student_id
                AND s.phase_id = p.id
                AND s.status = 'valid'
          )
    ) INTO is_missing_submission;

    SELECT status INTO current_status FROM users WHERE id = current_student_id;

    IF is_missing_submission THEN
        IF current_status = 'active' THEN
            UPDATE users SET status = 'revoked', updated_at = NOW() WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_REVOKE', jsonb_build_object('reason', 'Missing mandatory submission detected locally'));
        END IF;
        RETURN true;
    ELSE
        IF current_status = 'revoked' THEN
            UPDATE users SET status = 'active', updated_at = NOW() WHERE id = current_student_id;
            INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
            VALUES (current_student_id, NULL, 'SELF_AUTO_RESTORE', jsonb_build_object('reason', 'Conditions met locally'));
        END IF;
        RETURN false;
    END IF;
END;
$$;

-- 3. Admin Restore Student with Extensions
DROP FUNCTION IF EXISTS admin_restore_student(target_student_id UUID);
CREATE OR REPLACE FUNCTION admin_restore_student(target_student_id UUID, extension_days INTEGER)
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

    -- 2. Find ended phases where student has NO valid submission
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
        -- Insert or Update extension
        INSERT INTO phase_extensions (student_id, phase_id, extended_deadline)
        VALUES (target_student_id, phase_record.id, NOW() + (extension_days || ' days')::INTERVAL)
        ON CONFLICT (student_id, phase_id) DO UPDATE 
        SET extended_deadline = NOW() + (extension_days || ' days')::INTERVAL;
        
        missed_phases_count := missed_phases_count + 1;
    END LOOP;

    -- 3. Update user status to active
    UPDATE users 
    SET status = 'active', updated_at = NOW()
    WHERE id = target_student_id;

    -- 4. Log the action
    INSERT INTO activity_logs (student_id, phase_id, activity_type, payload)
    VALUES (
        target_student_id, 
        NULL, 
        'ADMIN_RESTORE', 
        jsonb_build_object(
            'restored_by', auth.uid(),
            'extension_days', extension_days,
            'extended_phases', missed_phases_count
        )
    );

    RETURN jsonb_build_object(
        'success', true,
        'email', restored_email,
        'extended_phases', missed_phases_count
    );
END;
$$;
