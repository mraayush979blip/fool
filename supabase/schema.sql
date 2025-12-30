-- Phase-Based Learning Platform Database Schema
-- Run this in Supabase SQL Editor

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Table 1: users
CREATE TABLE users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Auth & Basic Info
  email VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  password_hash VARCHAR(255),
  
  -- Role & Status
  role VARCHAR(20) NOT NULL DEFAULT 'student' CHECK (role IN ('admin', 'student')),
  status VARCHAR(20) NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'revoked')),
  
  -- Tracking
  total_time_spent_seconds INTEGER DEFAULT 0,
  last_activity_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Optional
  roll_number VARCHAR(50),
  batch VARCHAR(50),
  phone VARCHAR(20)
);

-- Indexes for users
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_status ON users(status);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- Table 2: phases
CREATE TABLE phases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Identity
  phase_number INTEGER UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  
  -- Video & Resources
  youtube_url VARCHAR(500),
  assignment_resource_url VARCHAR(500),
  
  -- Dates & Status
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  status VARCHAR(50) DEFAULT 'upcoming',
  
  -- Control
  is_active BOOLEAN DEFAULT true,
  is_paused BOOLEAN DEFAULT false,
  pause_reason TEXT,
  paused_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for phases
CREATE INDEX idx_phases_phase_number ON phases(phase_number);
CREATE INDEX idx_phases_start_date ON phases(start_date);
CREATE INDEX idx_phases_end_date ON phases(end_date);
CREATE INDEX idx_phases_is_active ON phases(is_active);
CREATE INDEX idx_phases_is_paused ON phases(is_paused);

-- Table 3: submissions
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  
  -- Submission Data
  submission_type VARCHAR(20) NOT NULL CHECK (submission_type IN ('github', 'file')),
  github_url VARCHAR(500),
  file_url VARCHAR(500),
  notes TEXT,
  
  -- Status
  status VARCHAR(20) DEFAULT 'valid' CHECK (status IN ('valid', 'late', 'deleted')),
  is_deleted BOOLEAN DEFAULT false,
  
  -- Timestamps
  submitted_at TIMESTAMP NOT NULL DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: exactly one of github_url or file_url must be non-null
  CONSTRAINT one_submission_type CHECK (
    (submission_type = 'github' AND github_url IS NOT NULL AND file_url IS NULL) OR
    (submission_type = 'file' AND file_url IS NOT NULL AND github_url IS NULL)
  ),
  
  -- Unique per (student, phase)
  UNIQUE(student_id, phase_id)
);

-- Indexes for submissions
CREATE INDEX idx_submissions_student_phase ON submissions(student_id, phase_id);
CREATE INDEX idx_submissions_phase_id ON submissions(phase_id);
CREATE INDEX idx_submissions_student_id ON submissions(student_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_submitted_at ON submissions(submitted_at);

-- Table 4: submission_history
CREATE TABLE submission_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  
  -- Version Info
  version INTEGER NOT NULL,
  
  -- Submission Data (snapshot)
  submission_type VARCHAR(20) NOT NULL,
  github_url VARCHAR(500),
  file_url VARCHAR(500),
  notes TEXT,
  
  -- Status Snapshot
  status VARCHAR(20),
  
  -- Time Info
  deadline_at TIMESTAMP,
  is_before_deadline BOOLEAN,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  
  -- Constraint: unique version per submission
  UNIQUE(submission_id, version)
);

-- Indexes for submission_history
CREATE INDEX idx_submission_history_submission_phase ON submission_history(student_id, phase_id);
CREATE INDEX idx_submission_history_version ON submission_history(submission_id, version);
CREATE INDEX idx_submission_history_created_at ON submission_history(created_at DESC);

-- Table 5: student_phase_activity
CREATE TABLE student_phase_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  
  -- Time Tracking
  total_time_spent_seconds INTEGER DEFAULT 0,
  
  -- Video Tracking
  video_duration_seconds INTEGER,
  video_watched_seconds INTEGER DEFAULT 0,
  video_completed BOOLEAN DEFAULT false,
  
  -- Status
  is_deleted BOOLEAN DEFAULT false,
  last_activity_at TIMESTAMP,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  -- Unique per (student, phase)
  UNIQUE(student_id, phase_id)
);

-- Indexes for student_phase_activity
CREATE INDEX idx_student_phase_activity_student_phase ON student_phase_activity(student_id, phase_id);
CREATE INDEX idx_student_phase_activity_phase_id ON student_phase_activity(phase_id);
CREATE INDEX idx_student_phase_activity_video_completed ON student_phase_activity(video_completed);

-- Table 6: activity_logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Foreign Keys
  student_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  phase_id UUID NOT NULL REFERENCES phases(id) ON DELETE CASCADE,
  
  -- Activity Type
  activity_type VARCHAR(50) NOT NULL,
  
  -- Payload (JSON, varies by type)
  payload JSONB DEFAULT '{}',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for activity_logs
CREATE INDEX idx_activity_logs_student_phase ON activity_logs(student_id, phase_id);
CREATE INDEX idx_activity_logs_activity_type ON activity_logs(activity_type);
CREATE INDEX idx_activity_logs_created_at ON activity_logs(created_at DESC);

-- Table 7: csv_imports
CREATE TABLE csv_imports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Import Info
  admin_id UUID NOT NULL REFERENCES users(id),
  file_name VARCHAR(255),
  
  -- Results
  total_rows INTEGER,
  successful_count INTEGER,
  failed_count INTEGER,
  
  -- Details
  error_details JSONB DEFAULT '[]',
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

-- Indexes for csv_imports
CREATE INDEX idx_csv_imports_admin_id ON csv_imports(admin_id);
CREATE INDEX idx_csv_imports_created_at ON csv_imports(created_at DESC);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE phases ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_phase_activity ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE csv_imports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can see their own profile
CREATE POLICY "users_see_own_profile" ON users
  FOR SELECT USING (auth.uid() = id);

-- Admins can see all users
CREATE POLICY "admins_see_all_users" ON users
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Everyone can see active phases
CREATE POLICY "everyone_see_active_phases" ON phases
  FOR SELECT USING (is_active = true);

-- Admins can manage phases
CREATE POLICY "admins_manage_phases" ON phases
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Students can see their own submissions
CREATE POLICY "students_see_own_submissions" ON submissions
  FOR SELECT USING (auth.uid() = student_id);

-- Students can create/update their own submissions
CREATE POLICY "students_manage_own_submissions" ON submissions
  FOR ALL USING (auth.uid() = student_id);

-- Admins can see all submissions
CREATE POLICY "admins_see_all_submissions" ON submissions
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Similar policies for other tables...
-- (Add more RLS policies as needed)
