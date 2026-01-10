-- RPC: Get Refined Leaderboard
-- Calculates ranking based on:
-- 1. Completed Phases (Primary)
-- 2. Activity Points (Secondary)
-- 3. Current Streak (Tertiary)
-- 4. Last Submission Time (Tie-breaker - earlier is better)

CREATE OR REPLACE FUNCTION get_leaderboard_v2()
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR,
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
            u.points as s_points,
            u.current_streak as s_streak,
            COUNT(s.id) FILTER (WHERE s.status = 'valid') as s_phases,
            MAX(s.submitted_at) FILTER (WHERE s.status = 'valid') as last_sub
        FROM users u
        LEFT JOIN submissions s ON u.id = s.student_id
        WHERE u.role = 'student' AND u.status = 'active'
        GROUP BY u.id
    )
    SELECT 
        s_id as user_id,
        s_name as user_name,
        s_phases as completed_phases,
        s_points as activity_points,
        s_streak as current_streak,
        RANK() OVER (
            ORDER BY 
                s_phases DESC, 
                s_points DESC, 
                s_streak DESC, 
                last_sub ASC NULLS LAST
        ) as rank_position
    FROM student_metrics
    ORDER BY rank_position ASC
    LIMIT 100; -- Limit to top 100 for performance
END;
$$;
