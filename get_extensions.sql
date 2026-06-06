CREATE OR REPLACE FUNCTION debug_get_extensions(test_uid UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    res JSONB;
BEGIN
    SELECT jsonb_agg(row_to_json(pe)) INTO res
    FROM phase_extensions pe
    WHERE pe.student_id = test_uid;
    RETURN res;
END;
$$;
