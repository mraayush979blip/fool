-- Add streak tracking to users table
ALTER TABLE users 
ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS max_streak INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Function to update student streak
-- This should be called whenever a student does something meaningful (e.g., visits dashboard or submits)
CREATE OR REPLACE FUNCTION update_student_streak(student_uuid UUID)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    today DATE := CURRENT_DATE;
    last_active DATE;
    new_streak INTEGER;
BEGIN
    -- Get last activity date
    SELECT last_activity_date INTO last_active FROM users WHERE id = student_uuid;

    IF last_active IS NULL THEN
        -- First time activity
        new_streak := 1;
    ELSIF last_active = today THEN
        -- Already updated today, keep current streak
        SELECT current_streak INTO new_streak FROM users WHERE id = student_uuid;
        RETURN new_streak;
    ELSIF last_active = today - INTERVAL '1 day' THEN
        -- Continued streak
        SELECT current_streak + 1 INTO new_streak FROM users WHERE id = student_uuid;
    ELSE
        -- Streak broken
        new_streak := 1;
    END IF;

    -- Update user stats
    UPDATE users SET
        current_streak = new_streak,
        max_streak = GREATEST(max_streak, new_streak),
        last_activity_date = today,
        updated_at = NOW()
    WHERE id = student_uuid;

    RETURN new_streak;
END;
$$;
