-- UNIFIED FIX: Leaderboard & Rank Context RPC Type Mismatch
-- To apply: Copy and paste this into your Supabase SQL Editor and click 'RUN'.

-- 1. FIX: get_leaderboard_v2
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
        s_id::UUID,
        s_name::TEXT,
        s_avatar::TEXT,
        s_phases::BIGINT,
        s_points::INTEGER,
        s_streak::INTEGER,
        RANK() OVER (
            ORDER BY 
                s_phases DESC, 
                s_points DESC, 
                s_streak DESC, 
                last_sub ASC NULLS LAST
        )::BIGINT
    FROM student_metrics
    ORDER BY 7 ASC -- order by rank_position
    LIMIT 100;
END;
$$;

-- 2. FIX: get_student_rank_context
DROP FUNCTION IF EXISTS get_student_rank_context(UUID);
CREATE OR REPLACE FUNCTION get_student_rank_context(current_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    result JSONB;
BEGIN
    WITH ranked_users AS (
        SELECT 
            u.id::UUID as id,
            u.name::TEXT as name,
            u.equipped_avatar::TEXT as avatar,
            COALESCE(u.current_streak, 0)::INTEGER as current_streak,
            COALESCE(sub.completed_count, 0)::BIGINT as completed_phases,
            RANK() OVER (
                ORDER BY COALESCE(sub.completed_count, 0) DESC, u.current_streak DESC
            )::BIGINT as rank_position
        FROM users u
        LEFT JOIN (
            SELECT student_id, COUNT(*) as completed_count
            FROM submissions
            WHERE status = 'valid'
            GROUP BY student_id
        ) sub ON sub.student_id = u.id
        WHERE u.role = 'student' AND u.status = 'active'
    )
    SELECT jsonb_build_object(
        'rank', r.rank_position,
        'neighbors', (
            SELECT jsonb_agg(n)
            FROM (
                SELECT 
                    id, 
                    name, 
                    avatar, 
                    current_streak, 
                    completed_phases, 
                    rank_position 
                FROM ranked_users
                WHERE rank_position BETWEEN r.rank_position - 1 AND r.rank_position + 1
                ORDER BY rank_position ASC
            ) n
        )
    ) INTO result
    FROM ranked_users r
    WHERE r.id = current_student_id;

    RETURN result;
END;
$$;
