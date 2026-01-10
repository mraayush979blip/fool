-- 1. Add equipped_avatar column to users
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_avatar TEXT DEFAULT '👤';

-- Fix store_items type constraint to allow 'avatar'
ALTER TABLE store_items DROP CONSTRAINT IF EXISTS store_items_type_check;
ALTER TABLE store_items ADD CONSTRAINT store_items_type_check CHECK (type IN ('theme', 'banner', 'avatar_frame', 'avatar', 'other'));

-- 2. Clear old theme/banner rewards
DELETE FROM store_items WHERE type IN ('theme', 'banner', 'avatar_frame');

-- 3. Insert Character Rewards
INSERT INTO store_items (code, name, description, cost, type, asset_value)
VALUES 
    ('CHAR_DEFAULT', 'Basic Student', 'A standard student avatar.', 0, 'avatar', '👤'),
    ('CHAR_NINJA', 'Code Ninja', 'For those who write silent but deadly code.', 50, 'avatar', '🥷'),
    ('CHAR_WIZARD', 'Logic Wizard', 'Master of the arcane syntax.', 100, 'avatar', '🧙'),
    ('CHAR_ROCKET', 'Rocket Dev', 'Taking your progress to the moon.', 200, 'avatar', '🚀'),
    ('CHAR_ROBOT', 'AI Assistant', 'Highly efficient learning machine.', 300, 'avatar', '🤖'),
    ('CHAR_DRAGON', 'Fire Breather', 'Spitting hot code daily.', 500, 'avatar', '🐲'),
    ('CHAR_CROWN', 'Phase King/Queen', 'The ultimate symbol of completion.', 1000, 'avatar', '👑')
ON CONFLICT (code) DO UPDATE SET 
    name = EXCLUDED.name,
    description = EXCLUDED.description,
    cost = EXCLUDED.cost,
    asset_value = EXCLUDED.asset_value;

-- 4. Update get_leaderboard_v2 to include avatar
DROP FUNCTION IF EXISTS get_leaderboard_v2();
CREATE OR REPLACE FUNCTION get_leaderboard_v2()
RETURNS TABLE (
    user_id UUID,
    user_name VARCHAR,
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
        s_avatar as user_avatar,
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
    LIMIT 100;
END;
$$;

-- 5. Update get_student_rank_context
CREATE OR REPLACE FUNCTION get_student_rank_context(current_student_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    current_rank BIGINT;
    result JSONB;
BEGIN
    -- Get rank of the current student
    WITH all_ranks AS (
        SELECT 
            user_id,
            rank_position
        FROM get_leaderboard_v2()
    )
    SELECT rank_position INTO current_rank
    FROM all_ranks
    WHERE user_id = current_student_id;

    -- Fetch neighbors (2 above, 2 below)
    WITH all_data AS (
        SELECT * FROM get_leaderboard_v2()
    ),
    neighbors AS (
        SELECT * FROM all_data
        WHERE rank_position BETWEEN (current_rank - 2) AND (current_rank + 2)
    )
    SELECT jsonb_build_object(
        'rank', current_rank,
        'neighbors', jsonb_agg(jsonb_build_object(
            'id', user_id,
            'name', user_name,
            'avatar', user_avatar,
            'rank_position', rank_position,
            'completed_phases', completed_phases,
            'current_streak', current_streak
        ))
    ) INTO result
    FROM neighbors;

    RETURN result;
END;
$$;

-- 6. Update equip_item to handle avatar type
CREATE OR REPLACE FUNCTION equip_item(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    user_id_val UUID := auth.uid();
BEGIN
    -- Check if item exists and user owns it
    SELECT * INTO item_record 
    FROM store_items si
    JOIN user_inventory ui ON si.id = ui.item_id
    WHERE si.id = item_id_param AND ui.user_id = user_id_val;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Item not owned or not found');
    END IF;

    -- Update user based on item type
    IF item_record.type = 'theme' THEN
        UPDATE users SET equipped_theme = item_record.asset_value WHERE id = user_id_val;
    ELSIF item_record.type = 'banner' THEN
        UPDATE users SET equipped_banner = item_record.asset_value WHERE id = user_id_val;
    ELSIF item_record.type = 'avatar' THEN
        UPDATE users SET equipped_avatar = item_record.asset_value WHERE id = user_id_val;
    END IF;

    RETURN jsonb_build_object('success', true);
END;
$$;
