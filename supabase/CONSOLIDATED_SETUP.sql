-- ==========================================
-- LEVELONE FULL DATABASE SETUP
-- ==========================================
-- This script sets up the entire database including tables, 
-- functions, RLS policies, and storage buckets.
-- Run this in your Supabase SQL Editor.

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. TABLES
-- Table: users
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
    status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
    total_time_spent_seconds INTEGER DEFAULT 0,
    current_streak INTEGER DEFAULT 0,
    points INTEGER DEFAULT 0,
    equipped_theme VARCHAR(50) DEFAULT 'default',
    equipped_banner VARCHAR(100) DEFAULT 'default',
    equipped_avatar TEXT DEFAULT '👤',
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    roll_number VARCHAR(50),
    batch VARCHAR(50),
    phone VARCHAR(20)
);

-- Table: phases
CREATE TABLE IF NOT EXISTS phases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    phase_number NUMERIC(10,2) UNIQUE NOT NULL,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    youtube_url VARCHAR(500),
    assignment_resource_url VARCHAR(500),
    assignment_file_url VARCHAR(500),
    allowed_submission_type VARCHAR(20) DEFAULT 'both' CHECK (allowed_submission_type IN ('github', 'file', 'both')),
    total_assignments INTEGER DEFAULT 1,
    min_seconds_required INTEGER DEFAULT 0,
    is_mandatory BOOLEAN DEFAULT true,
    points INTEGER DEFAULT 0,
    start_date TIMESTAMP NOT NULL,
    end_date TIMESTAMP NOT NULL,
    status VARCHAR(50) DEFAULT 'upcoming',
    is_active BOOLEAN DEFAULT true,
    is_paused BOOLEAN DEFAULT false,
    pause_reason TEXT,
    paused_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Table: submissions
CREATE TABLE IF NOT EXISTS submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    assignment_index INTEGER DEFAULT 1,
    submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('github', 'file')),
    github_url VARCHAR(500),
    file_url VARCHAR(500),
    notes TEXT,
    status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'late', 'deleted')),
    is_deleted BOOLEAN DEFAULT false,
    submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT submissions_student_phase_index_key UNIQUE (student_id, phase_id, assignment_index)
);

-- Table: submission_history
CREATE TABLE IF NOT EXISTS submission_history (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    assignment_index INTEGER DEFAULT 1,
    version INTEGER NOT NULL,
    submission_type VARCHAR(20) NOT NULL,
    github_url VARCHAR(500),
    file_url VARCHAR(500),
    notes TEXT,
    status VARCHAR(20),
    deadline_at TIMESTAMP,
    is_before_deadline BOOLEAN,
    created_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(submission_id, version)
);

-- Table: student_phase_activity
CREATE TABLE IF NOT EXISTS student_phase_activity (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
    total_time_spent_seconds INTEGER DEFAULT 0,
    video_duration_seconds INTEGER,
    video_watched_seconds INTEGER DEFAULT 0,
    video_completed BOOLEAN DEFAULT false,
    is_deleted BOOLEAN DEFAULT false,
    last_activity_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(student_id, phase_id)
);

-- Table: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID REFERENCES users(id) ON DELETE CASCADE,
    phase_id UUID REFERENCES phases(id) ON DELETE CASCADE,
    activity_type VARCHAR(50) NOT NULL,
    payload JSONB DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: csv_imports
CREATE TABLE IF NOT EXISTS csv_imports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id UUID NOT NULL REFERENCES users(id),
    file_name VARCHAR(255),
    total_rows INTEGER,
    successful_count INTEGER,
    failed_count INTEGER,
    error_details JSONB DEFAULT '[]',
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: badges
CREATE TABLE IF NOT EXISTS badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    icon_name VARCHAR(50),
    category VARCHAR(20) CHECK (category IN ('streak', 'completion', 'performance')),
    requirement_type VARCHAR(20) CHECK (requirement_type IN ('streak_days', 'phases_count', 'manual')),
    requirement_value INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: user_badges
CREATE TABLE IF NOT EXISTS user_badges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    badge_id UUID REFERENCES badges(id) ON DELETE CASCADE,
    earned_at TIMESTAMP DEFAULT NOW(),
    UNIQUE(user_id, badge_id)
);

-- Table: personal_goals
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

-- Table: challenges
CREATE TABLE IF NOT EXISTS challenges (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    challenger_id UUID REFERENCES users(id) ON DELETE CASCADE,
    opponent_id UUID REFERENCES users(id) ON DELETE CASCADE,
    challenge_type VARCHAR(20) CHECK (challenge_type IN ('race_next_phase', 'streak_week')),
    target_phase_id UUID REFERENCES phases(id),
    status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'declined')),
    winner_id UUID REFERENCES users(id),
    start_at TIMESTAMP DEFAULT NOW(),
    end_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: store_items
CREATE TABLE IF NOT EXISTS store_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    cost INTEGER NOT NULL DEFAULT 0,
    type VARCHAR(50) CHECK (type IN ('theme', 'banner', 'avatar_frame', 'avatar', 'other')),
    asset_value VARCHAR(255) NOT NULL,
    required_badge_id UUID REFERENCES badges(id),
    required_streak INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Table: user_inventory
CREATE TABLE IF NOT EXISTS user_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    item_id UUID REFERENCES store_items(id) ON DELETE CASCADE,
    purchased_at TIMESTAMP DEFAULT NOW(),
    is_equipped BOOLEAN DEFAULT FALSE,
    UNIQUE(user_id, item_id)
);

-- 3. INDEXES
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
CREATE INDEX IF NOT EXISTS idx_phases_phase_number ON phases(phase_number);
CREATE INDEX IF NOT EXISTS idx_submissions_student_phase ON submissions(student_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- 4. RLS ENABLING
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_phase_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_badges ENABLE ROW LEVEL SECURITY;
ALTER TABLE personal_goals ENABLE ROW LEVEL SECURITY;
ALTER TABLE challenges ENABLE ROW LEVEL SECURITY;

-- Helper function to avoid RLS recursion on users table
CREATE OR REPLACE FUNCTION public.check_is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN (
    SELECT (role = 'admin')
    FROM public.users
    WHERE id = auth.uid()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. RLS POLICIES
-- Users see own profile
DROP POLICY IF EXISTS "users_see_own_profile" ON users;
CREATE POLICY "users_see_own_profile" ON users FOR SELECT USING (auth.uid() = id);

-- Admins see all users (using helper function to avoid recursion)
DROP POLICY IF EXISTS "admins_see_all_users" ON users;
CREATE POLICY "admins_see_all_users" ON users FOR ALL USING (
    public.check_is_admin()
);

-- Everyone can see active phases
DROP POLICY IF EXISTS "everyone_see_active_phases" ON phases;
CREATE POLICY "everyone_see_active_phases" ON phases FOR SELECT USING (is_active = true);

-- Students see and manage own submissions
DROP POLICY IF EXISTS "students_manage_own_submissions" ON submissions;
CREATE POLICY "students_manage_own_submissions" ON submissions FOR ALL USING (auth.uid() = student_id);

-- Everyone can see badges
DROP POLICY IF EXISTS "Everyone can see badges" ON badges;
CREATE POLICY "Everyone can see badges" ON badges FOR SELECT USING (true);

-- Users view own inventory
DROP POLICY IF EXISTS "users_view_own_inventory" ON user_inventory;
CREATE POLICY "users_view_own_inventory" ON user_inventory FOR SELECT USING (auth.uid() = user_id);

-- 6. FUNCTIONS & RPCS
-- Function to award activity points
CREATE OR REPLACE FUNCTION award_points(target_user_id UUID, amount INTEGER, reason TEXT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
    UPDATE users SET points = points + amount WHERE id = target_user_id;
END;
$$;

-- Function for bidirectional revocation check
CREATE OR REPLACE FUNCTION check_and_revoke_students()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
    student_record RECORD;
    revoked_count INTEGER := 0;
    restored_count INTEGER := 0;
    revoked_emails TEXT[] := '{}';
    restored_emails TEXT[] := '{}';
    should_be_revoked BOOLEAN;
BEGIN
    FOR student_record IN SELECT id, email, status FROM users WHERE role = 'student' LOOP
        -- Check if student has missed any mandatory phase deadline
        SELECT EXISTS (
            SELECT 1 FROM phases p
            WHERE p.end_date < NOW() AND p.is_active = true AND p.is_mandatory = true
            AND NOT EXISTS (
                SELECT 1 FROM submissions s 
                WHERE s.student_id = student_record.id AND s.phase_id = p.id AND s.status = 'valid'
            )
        ) INTO should_be_revoked;

        IF should_be_revoked AND student_record.status = 'active' THEN
            UPDATE users SET status = 'revoked', updated_at = NOW() WHERE id = student_record.id;
            revoked_count := revoked_count + 1;
            revoked_emails := array_append(revoked_emails, student_record.email);
            INSERT INTO activity_logs (student_id, activity_type) VALUES (student_record.id, 'SYSTEM_AUTO_REVOKE');
        ELSIF NOT should_be_revoked AND student_record.status = 'revoked' THEN
            UPDATE users SET status = 'active', updated_at = NOW() WHERE id = student_record.id;
            restored_count := restored_count + 1;
            restored_emails := array_append(restored_emails, student_record.email);
            INSERT INTO activity_logs (student_id, activity_type) VALUES (student_record.id, 'SYSTEM_AUTO_RESTORE');
        END IF;
    END LOOP;

    RETURN jsonb_build_object(
        'revoked_count', revoked_count,
        'restored_count', restored_count,
        'revoked_emails', revoked_emails,
        'restored_emails', restored_emails
    );
END;
$$;

-- Function for bulk actions
CREATE OR REPLACE FUNCTION admin_bulk_revoke_students()
RETURNS JSONB LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE affected_count INTEGER := 0;
BEGIN
    UPDATE users SET status = 'revoked', updated_at = NOW() WHERE role = 'student' AND status = 'active';
    GET DIAGNOSTICS affected_count = ROW_COUNT;
    RETURN jsonb_build_object('success', true, 'affected_count', affected_count);
END;
$$;

-- 7. STORAGE BUCKETS (Run these inserts to ensure buckets exist)
INSERT INTO storage.buckets (id, name, public) VALUES ('assignment-documents', 'assignment-documents', true) ON CONFLICT (id) DO NOTHING;
INSERT INTO storage.buckets (id, name, public) VALUES ('student-submissions', 'student-submissions', true) ON CONFLICT (id) DO NOTHING;

-- 8. SEED DATA
-- Badges
INSERT INTO badges (code, name, description, icon_name, category, requirement_type, requirement_value) VALUES
('STREAK_3', 'Spark', 'Maintain a 3-day streak', 'Flame', 'streak', 'streak_days', 3),
('PHASE_1', 'First Step', 'Complete your first phase', 'Footprints', 'completion', 'phases_count', 1)
ON CONFLICT (code) DO NOTHING;

-- Store Items
INSERT INTO store_items (code, name, description, cost, type, asset_value) VALUES 
('CHAR_DEFAULT', 'Basic Student', 'A standard student avatar.', 0, 'avatar', '👤'),
('THEME_NEON', 'Neon Cyberpunk', 'A vibrant glowing neon theme.', 500, 'theme', 'theme-neon')
ON CONFLICT (code) DO NOTHING;

-- ==========================================
-- SETUP COMPLETE
-- ==========================================
