-- Add missing RLS policies for student activity and logs
-- Run this in Supabase SQL Editor

-- 1. Student Phase Activity
ALTER TABLE student_phase_activity ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_manage_own_activity" ON student_phase_activity;
CREATE POLICY "students_manage_own_activity" ON student_phase_activity
    FOR ALL USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admins_see_all_activity" ON student_phase_activity;
CREATE POLICY "admins_see_all_activity" ON student_phase_activity
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 2. Activity Logs
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_create_own_logs" ON activity_logs;
CREATE POLICY "students_create_own_logs" ON activity_logs
    FOR INSERT WITH CHECK (auth.uid() = student_id);

DROP POLICY IF EXISTS "students_see_own_logs" ON activity_logs;
CREATE POLICY "students_see_own_logs" ON activity_logs
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admins_see_all_logs" ON activity_logs;
CREATE POLICY "admins_see_all_logs" ON activity_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );

-- 3. Submission History
ALTER TABLE submission_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "students_see_own_history" ON submission_history;
CREATE POLICY "students_see_own_history" ON submission_history
    FOR SELECT USING (auth.uid() = student_id);

DROP POLICY IF EXISTS "admins_see_all_history" ON submission_history;
CREATE POLICY "admins_see_all_history" ON submission_history
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users WHERE id = auth.uid() AND role = 'admin'
        )
    );
