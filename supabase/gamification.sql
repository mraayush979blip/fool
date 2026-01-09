-- 1. Badges System
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL, -- e.g., 'STREAK_3', 'PHASE_1'
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50), -- lucide-react icon name e.g., 'Flame', 'Trophy'
    category VARCHAR(20) CHECK (category IN ('streak', 'completion', 'performance')),
    requirement_type VARCHAR(20) CHECK (requirement_type IN ('streak_days', 'phases_count', 'manual')),
    requirement_value INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Seed Initial Badges (Safe Insert)
INSERT INTO badges (code, name, description, icon_name, category, requirement_type, requirement_value) VALUES
-- Streak Badges
('STREAK_3', 'Spark', 'Maintain a 3-day streak', 'Flame', 'streak', 'streak_days', 3),
('STREAK_7', 'Flame', 'Maintain a 7-day streak', 'Zap', 'streak', 'streak_days', 7),
('STREAK_30', 'Inferno', 'Maintain a 30-day streak', 'Fire', 'streak', 'streak_days', 30),
-- Completion Badges
('PHASE_1', 'First Step', 'Complete your first phase', 'Footprints', 'completion', 'phases_count', 1),
('PHASE_HALF', 'Halfway There', 'Complete 50% of all phases', 'Mountain', 'completion', 'manual', 0),
('PHASE_ALL', 'Completionist', 'Complete all phases', 'Crown', 'completion', 'manual', 0),
-- Performance Badges
('TOP_10', 'Top 10 Finisher', 'Reach the Top 10 on the leaderboard', 'Award', 'performance', 'manual', 0)
ON CONFLICT (code) DO NOTHING;


-- 2. Personal Goals
CREATE TABLE IF NOT EXISTS personal_goals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    goal_type VARCHAR(20) CHECK (goal_type IN ('streak', 'phase_completion')),
    target_value INTEGER NOT NULL,
    current_value INTEGER DEFAULT 0,
    start_date DATE DEFAULT CURRENT_DATE,
    end_date DATE NOT NULL,
    status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'completed', 'failed')),
    created_at TIMESTAMP DEFAULT NOW()
);

-- 3. Head-to-Head Challenges
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_type VARCHAR(20) CHECK (challenge_type IN ('race_next_phase', 'streak_week')),
    target_phase_id UUID REFERENCES phases(id), -- If specific phase race
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
    winner_id UUID REFERENCES users(id),
    start_at TIMESTAMP DEFAULT NOW(),
    end_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- 4. RLS Policies (Drop first to avoid errors on retry)
DO $$ BEGIN
    -- Badges
    DROP POLICY IF EXISTS "Everyone can see badges" ON badges;
    ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Everyone can see badges" ON badges FOR SELECT USING (true);

    -- User Badges
    DROP POLICY IF EXISTS "Users view own badges" ON user_badges;
    ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users view own badges" ON user_badges FOR SELECT USING (user_id = auth.uid());

    -- Personal Goals
    DROP POLICY IF EXISTS "Users manage own goals" ON personal_goals;
    ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users manage own goals" ON personal_goals FOR ALL USING (user_id = auth.uid());

    -- Challenges
    DROP POLICY IF EXISTS "Users see own challenges" ON challenges;
    ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;
    CREATE POLICY "Users see own challenges" ON challenges FOR SELECT USING (challenger_id = auth.uid() OR opponent_id = auth.uid());
END $$;

-- 5. Helper Functions & Triggers

-- Function to check and award streak badges automatically
CREATE OR REPLACE FUNCTION check_streak_badges()
RETURNS TRIGGER AS $$
DECLARE
    badge_rec RECORD;
BEGIN
    FOR badge_rec IN SELECT * FROM badges WHERE category = 'streak' LOOP
        IF NEW.current_streak >= badge_rec.requirement_value THEN
            INSERT INTO user_badges (user_id, badge_id)
            VALUES (NEW.id, badge_rec.id)
            ON CONFLICT DO NOTHING;
        END IF;
    END LOOP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Safe Trigger Creation
DROP TRIGGER IF EXISTS trigger_check_streak_badges ON users;
CREATE TRIGGER trigger_check_streak_badges
AFTER UPDATE OF current_streak ON users
FOR EACH ROW
EXECUTE FUNCTION check_streak_badges();

-- Function to check completion badges
CREATE OR REPLACE FUNCTION check_completion_badges()
RETURNS TRIGGER AS $$
DECLARE
    completed_count INTEGER;
    badge_rec RECORD;
BEGIN
    IF NEW.status = 'valid' THEN
        SELECT COUNT(*) INTO completed_count FROM submissions 
        WHERE student_id = NEW.student_id AND status = 'valid';

        IF completed_count >= 1 THEN
            INSERT INTO user_badges (user_id, badge_id)
            SELECT NEW.student_id, id FROM badges WHERE code = 'PHASE_1'
            ON CONFLICT DO NOTHING;
        END IF;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_check_completion_badges ON submissions;
CREATE TRIGGER trigger_check_completion_badges
AFTER INSERT OR UPDATE OF status ON submissions
FOR EACH ROW
EXECUTE FUNCTION check_completion_badges();
