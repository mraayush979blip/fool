-- 1. Ensure Columns Exist in Users Table
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_banner VARCHAR(100) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_point_award_at TIMESTAMPTZ;

-- 2. Store Items Table
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    type VARCHAR(50) CHECK (type IN ('theme', 'banner', 'avatar_frame', 'other')),
    asset_value VARCHAR(255) NOT NULL,
    required_badge_id UUID REFERENCES badges(id),
    required_streak INTEGER,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. User Inventory Table
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMPTZ DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);

-- 4. RLS Implementation (Lowercase for safety)
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "everyone_view_store_items" ON store_items;
CREATE POLICY "everyone_view_store_items" ON store_items
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "users_view_own_inventory" ON user_inventory;
CREATE POLICY "users_view_own_inventory" ON user_inventory
    FOR SELECT USING (auth.uid() = user_id);

-- 5. Functions & RPCs
CREATE OR REPLACE FUNCTION award_points(target_user_id UUID, amount INTEGER, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users SET points = points + amount WHERE id = target_user_id;
END;
$$;

CREATE OR REPLACE FUNCTION award_activity_point()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_award TIMESTAMPTZ;
    cooldown_interval INTERVAL := '1 minute 50 seconds';
    _now TIMESTAMPTZ := NOW();
BEGIN
    SELECT last_point_award_at INTO last_award FROM users WHERE id = auth.uid();

    IF last_award IS NOT NULL AND _now < (last_award + cooldown_interval) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cooldown active');
    END IF;

    UPDATE users SET 
        points = points + 1,
        last_point_award_at = _now
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true, 'points', 1);
END;
$$;

-- 6. Initial Seed Data
DELETE FROM store_items WHERE code = 'DEFAULT_BANNER';

INSERT INTO store_items (code, name, description, cost, type, asset_value, required_streak)
VALUES 
('DEFAULT_THEME', 'Default Theme', 'The classic Levelone learning experience.', 0, 'theme', 'default', NULL),
('THEME_NEON', 'Neon Cyberpunk', 'A vibrant, glowing neon theme for your dashboard.', 500, 'theme', 'theme-neon', 3),
('THEME_DARK_PLUS', 'Midnight Pro', 'An ultra-dark, high contrast mode for late night coders.', 1000, 'theme', 'theme-midnight', NULL),
('FRAME_GOLD', 'Golden Frame', 'A shiny gold border for your avatar.', 2500, 'avatar_frame', 'frame-gold', 14),
('BANNER_SPACE', 'Deep Space', 'A cosmic background for your profile.', 2000, 'banner', '9H36Gjg5SLM', 7)
ON CONFLICT (code) DO NOTHING;
