-- FIX: Leaderboard RPC Structure Mismatch
-- Solves the error: "Returned type character varying(255) does not match expected type text"

DROP FUNCTION IF EXISTS get_leaderboard_v2();

CREATE OR REPLACE FUNCTION get_leaderboard_v2()
RETURNS TABLE (
    user_id UUID,
    user_name TEXT,
    user_avatar TEXT,
    completed_phases BIGINT,
    activity_points INTEGER,
    current_streak INTEGER,
    rank_position BIGINT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    RETURN QUERY
    WITH student_metrics AS (
        SELECT 
            u.id as s_id,
            u.name as s_name,
            u.equipped_avatar as s_avatar,
            COALESCE(u.points, 0) as s_points,
            COALESCE(u.current_streak, 0) as s_streak,
            COUNT(s.id) FILTER (WHERE s.status = 'valid') as s_phases,
            MAX(s.submitted_at) FILTER (WHERE s.status = 'valid') as last_sub
        FROM users u
        LEFT JOIN submissions s ON u.id = s.student_id
        WHERE u.role = 'student' AND u.status = 'active'
        GROUP BY u.id
    )
    SELECT 
        s_id::UUID as user_id,
        s_name::TEXT as user_name,
        s_avatar::TEXT as user_avatar,
        s_phases::BIGINT as completed_phases,
        s_points::INTEGER as activity_points,
        s_streak::INTEGER as current_streak,
        RANK() OVER (
            ORDER BY 
                s_phases DESC, 
                s_points DESC, 
                s_streak DESC, 
                last_sub ASC NULLS LAST
        )::BIGINT as rank_position
    FROM student_metrics
    ORDER BY rank_position ASC
    LIMIT 100;
END;
$$;
