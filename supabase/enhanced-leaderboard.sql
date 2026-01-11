-- Function to get a student's rank and neighbors
CREATE OR REPLACE FUNCTION get_student_rank_context(current_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    student_rank BIGINT;
    result JSONB;
BEGIN
    -- 1. Calculate Rank for all students using a CTE
    -- Note: This might be heavy for very large datasets, but fine for <10k users
    WITH ranked_users AS (
        SELECT 
            u.id,
            u.name,
            u.equipped_avatar as avatar,
            u.current_streak,
            COALESCE(sub.completed_count, 0) as completed_phases,
            RANK() OVER (
                ORDER BY COALESCE(sub.completed_count, 0) DESC, u.current_streak DESC
            ) as rank_position
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
                SELECT * FROM ranked_users
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
