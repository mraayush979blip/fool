-- Phase-Based Learning Platform Database Schema
-- Safe setup script that checks for existing tables

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: users (check if exists first)
DO $$ 
BEGIN
  IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'users') THEN
    CREATE TABLE users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email VARCHAR(255) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      password_hash VARCHAR(255),
      role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
      status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
      total_time_spent_seconds INTEGER DEFAULT 0,
      last_activity_at TIMESTAMP,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW(),
      roll_number VARCHAR(50),
      batch VARCHAR(50),
      phone VARCHAR(20)
    );
    
    CREATE INDEX idx_users_email ON users(email);
    CREATE INDEX idx_users_status ON users(status);
    CREATE INDEX idx_users_role ON users(role);
    CREATE INDEX idx_users_created_at ON users(created_at DESC);
  END IF;
END $$;

-- Table 2: phases
CREATE TABLE IF NOT EXISTS phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  phase_number INTEGER UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  youtube_url VARCHAR(500),
  assignment_resource_url VARCHAR(500),
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

CREATE INDEX IF NOT EXISTS idx_phases_phase_number ON phases(phase_number);
CREATE INDEX IF NOT EXISTS idx_phases_start_date ON phases(start_date);
CREATE INDEX IF NOT EXISTS idx_phases_end_date ON phases(end_date);
CREATE INDEX IF NOT EXISTS idx_phases_is_active ON phases(is_active);
CREATE INDEX IF NOT EXISTS idx_phases_is_paused ON phases(is_paused);

-- Table 3: submissions
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('github', 'file')),
  github_url VARCHAR(500),
  file_url VARCHAR(500),
  notes TEXT,
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'late', 'deleted')),
  is_deleted BOOLEAN DEFAULT false,
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT one_submission_type CHECK (
    (submission_type = 'github' AND github_url IS NOT NULL AND file_url IS NULL) OR
    (submission_type = 'file' AND file_url IS NOT NULL AND github_url IS NULL)
  ),
  UNIQUE(student_id, phase_id)
);

CREATE INDEX IF NOT EXISTS idx_submissions_student_phase ON submissions(student_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_submissions_phase_id ON submissions(phase_id);
CREATE INDEX IF NOT EXISTS idx_submissions_student_id ON submissions(student_id);
CREATE INDEX IF NOT EXISTS idx_submissions_status ON submissions(status);
CREATE INDEX IF NOT EXISTS idx_submissions_submitted_at ON submissions(submitted_at);

-- Table 4: submission_history
CREATE TABLE IF NOT EXISTS submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
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

CREATE INDEX IF NOT EXISTS idx_submission_history_submission_phase ON submission_history(student_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_submission_history_version ON submission_history(submission_id, version);
CREATE INDEX IF NOT EXISTS idx_submission_history_created_at ON submission_history(created_at DESC);

-- Table 5: student_phase_activity
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

CREATE INDEX IF NOT EXISTS idx_student_phase_activity_student_phase ON student_phase_activity(student_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_student_phase_activity_phase_id ON student_phase_activity(phase_id);
CREATE INDEX IF NOT EXISTS idx_student_phase_activity_video_completed ON student_phase_activity(video_completed);

-- Table 6: activity_logs
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  activity_type VARCHAR(50) NOT NULL,
  payload JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_activity_logs_student_phase ON activity_logs(student_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX IF NOT EXISTS idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Table 7: csv_imports
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

CREATE INDEX IF NOT EXISTS idx_csv_imports_admin_id ON csv_imports(admin_id);
CREATE INDEX IF NOT EXISTS idx_csv_imports_created_at ON csv_imports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_phase_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist (to avoid conflicts)
DROP POLICY IF EXISTS "users_see_own_profile" ON users;
DROP POLICY IF EXISTS "admins_see_all_users" ON users;
DROP POLICY IF EXISTS "everyone_see_active_phases" ON phases;
DROP POLICY IF EXISTS "admins_manage_phases" ON phases;
DROP POLICY IF EXISTS "students_see_own_submissions" ON submissions;
DROP POLICY IF EXISTS "students_manage_own_submissions" ON submissions;
DROP POLICY IF EXISTS "admins_see_all_submissions" ON submissions;

-- RLS Policies
CREATE POLICY "users_see_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "admins_see_all_users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "everyone_see_active_phases" ON phases
  FOR SELECT USING (is_active = true);

CREATE POLICY "admins_manage_phases" ON phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "students_see_own_submissions" ON submissions
  FOR SELECT USING (auth.uid() = student_id);

CREATE POLICY "students_manage_own_submissions" ON submissions
  FOR ALL USING (auth.uid() = student_id);

CREATE POLICY "admins_see_all_submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Success message
DO $$
BEGIN
  RAISE NOTICE 'Database schema setup completed successfully!';
END $$;
