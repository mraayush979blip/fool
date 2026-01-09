-- 1. Update Users Table for Economy
ALTER TABLE users ADD COLUMN IF NOT EXISTS points INTEGER DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_theme VARCHAR(50) DEFAULT 'default';
ALTER TABLE users ADD COLUMN IF NOT EXISTS equipped_banner VARCHAR(100) DEFAULT 'default';

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
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. User Inventory Table
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);

-- RLS Policies
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Everyone can view store items" ON store_items
    FOR SELECT USING (true);

CREATE POLICY "Users can view their own inventory" ON user_inventory
    FOR SELECT USING (auth.uid() = user_id);

-- 4. RPC: Award Points
CREATE OR REPLACE FUNCTION award_points(target_user_id UUID, amount INTEGER, reason TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE users SET points = points + amount WHERE id = target_user_id;
END;
$$;

-- 5. RPC: Purchase Item
CREATE OR REPLACE FUNCTION purchase_item(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_points INTEGER;
    item_cost INTEGER;
    item_req_badge UUID;
    item_req_streak INTEGER;
    user_streak INTEGER;
    has_badge BOOLEAN;
    already_owned BOOLEAN;
BEGIN
    -- Check ownership
    SELECT EXISTS(SELECT 1 FROM user_inventory WHERE user_id = auth.uid() AND item_id = item_id_param)
    INTO already_owned;
    
    IF already_owned THEN
        RETURN jsonb_build_object('success', false, 'message', 'Item already owned');
    END IF;

    -- Get user stats
    SELECT points, current_streak INTO user_points, user_streak FROM users WHERE id = auth.uid();
    
    -- Get item details
    SELECT cost, required_badge_id, required_streak 
    INTO item_cost, item_req_badge, item_req_streak 
    FROM store_items WHERE id = item_id_param;

    -- Check cost
    IF user_points < item_cost THEN
        RETURN jsonb_build_object('success', false, 'message', 'Insufficient points');
    END IF;

    -- Check streak requirement
    IF item_req_streak IS NOT NULL AND user_streak < item_req_streak THEN
        RETURN jsonb_build_object('success', false, 'message', 'Streak requirement not met (' || item_req_streak || ' day streak needed)');
    END IF;

    -- Check badge requirement
    IF item_req_badge IS NOT NULL THEN
        SELECT EXISTS(SELECT 1 FROM user_badges WHERE user_id = auth.uid() AND badge_id = item_req_badge)
        INTO has_badge;
        
        IF NOT has_badge THEN
             RETURN jsonb_build_object('success', false, 'message', 'Badge requirement not met');
        END IF;
    END IF;

    -- Execute Purchase
    UPDATE users SET points = points - item_cost WHERE id = auth.uid();
    
    INSERT INTO user_inventory (user_id, item_id) VALUES (auth.uid(), item_id_param);

    RETURN jsonb_build_object('success', true, 'message', 'Purchase successful', 'new_balance', user_points - item_cost);
END;
$$;

-- 6. Trigger: Award Points on Badge Earned (+1000 pts)
CREATE OR REPLACE FUNCTION trigger_award_points_on_badge()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM award_points(NEW.user_id, 1000, 'Badge Earned');
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Drop trigger first to allow replacement
DROP TRIGGER IF EXISTS on_badge_earned ON user_badges;

CREATE TRIGGER on_badge_earned
AFTER INSERT ON user_badges
FOR EACH ROW
EXECUTE FUNCTION trigger_award_points_on_badge();

-- 7. Seed Initial Store Items
INSERT INTO store_items (code, name, description, cost, type, asset_value, required_streak)
VALUES 
('THEME_NEON', 'Neon Cyberpunk', 'A vibrant, glowing neon theme for your dashboard.', 500, 'theme', 'theme-neon', 3),
('THEME_DARK_PLUS', 'Midnight Pro', 'An ultra-dark, high contrast mode for late night coders.', 1000, 'theme', 'theme-midnight', NULL),
('FRAME_GOLD', 'Golden Frame', 'A shiny gold border for your avatar.', 2500, 'avatar_frame', 'frame-gold', 14),
('BANNER_SPACE', 'Deep Space', 'A cosmic background for your profile.', 2000, 'banner', 'banner-space', 7)
ON CONFLICT (code) DO NOTHING;
