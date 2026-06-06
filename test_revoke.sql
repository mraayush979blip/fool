CREATE OR REPLACE FUNCTION debug_check_student(test_uid UUID)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    is_missing BOOLEAN;
BEGIN
    SELECT EXISTS (
        SELECT 1 FROM phases p
        LEFT JOIN phase_extensions pe ON pe.phase_id = p.id AND pe.student_id = test_uid
        WHERE (COALESCE(pe.extended_deadline, p.end_date) + INTERVAL '23 hours 59 minutes 59 seconds') < NOW() 
          AND p.is_active = true
          AND p.is_mandatory = true
          AND NOT EXISTS (
              SELECT 1 FROM submissions s
              WHERE s.student_id = test_uid
                AND s.phase_id = p.id
                AND s.status = 'valid'
          )
    ) INTO is_missing;
    RETURN is_missing;
END;
$$;
