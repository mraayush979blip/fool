-- points-trigger.sql
-- Strictly links points to time spent (1 min = 1 point)

-- 1. Add column to track points awarded per phase to prevent double-counting
ALTER TABLE student_phase_activity 
ADD COLUMN IF NOT EXISTS points_earned INTEGER DEFAULT 0;

-- 2. Create Trigger Function to Sync Time to Points
CREATE OR REPLACE FUNCTION sync_time_to_points()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    new_calculated_points INTEGER;
    point_diff INTEGER;
BEGIN
    -- Calculate how many points the user SHOULD have based on current time (1 pt per 60s)
    new_calculated_points := FLOOR(NEW.total_time_spent_seconds / 60);
    
    -- Calculate difference between what they should have and what was already given for this phase
    point_diff := new_calculated_points - OLD.points_earned;

    -- Only update if there are new points to award
    IF point_diff > 0 THEN
        -- Add points to the main users table
        UPDATE users 
        SET points = COALESCE(points, 0) + point_diff
        WHERE id = NEW.student_id;
        
        -- Update the points_earned tracker for this phase activity
        NEW.points_earned := new_calculated_points;
    END IF;

    RETURN NEW;
END;
$$;

-- 3. Attach Trigger
DROP TRIGGER IF EXISTS trg_sync_time_to_points ON student_phase_activity;
CREATE TRIGGER trg_sync_time_to_points
BEFORE UPDATE OF total_time_spent_seconds ON student_phase_activity
FOR EACH ROW
EXECUTE FUNCTION sync_time_to_points();

-- 4. Initial Sync: Update existing points for all users
-- This ensures that everyone's current time spent is immediately converted to points
DO $$
DECLARE
    rec RECORD;
BEGIN
    FOR rec IN SELECT id, student_id, total_time_spent_seconds FROM student_phase_activity LOOP
        UPDATE student_phase_activity 
        SET points_earned = FLOOR(total_time_spent_seconds / 60)
        WHERE id = rec.id;
    END LOOP;

    -- Refresh global users.points based on the sum of points_earned
    -- WARNING: Commented out to prevent overwriting points spent on rewards
    /*
    UPDATE users u
    SET points = (
        SELECT COALESCE(SUM(points_earned), 0)
        FROM student_phase_activity
        WHERE student_id = u.id
    )
    WHERE role = 'student';
    */
END $$;
