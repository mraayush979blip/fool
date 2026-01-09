-- Add column to track last award time to prevent abuse
ALTER TABLE users ADD COLUMN IF NOT EXISTS last_point_award_at TIMESTAMP;

-- RPC: Award Activity Point
-- Awards 1 point if at least 1 minute 50 seconds have passed since last award.
CREATE OR REPLACE FUNCTION award_activity_point()
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    last_award TIMESTAMP;
    cooldown_interval INTERVAL := '1 minute 50 seconds'; -- Slightly less than 2 mins to account for network latency
    current_time TIMESTAMP := NOW();
BEGIN
    SELECT last_point_award_at INTO last_award FROM users WHERE id = auth.uid();

    -- Check cooldown
    IF last_award IS NOT NULL AND current_time < (last_award + cooldown_interval) THEN
        RETURN jsonb_build_object('success', false, 'message', 'Cooldown active');
    END IF;

    -- Award point
    UPDATE users SET 
        points = points + 1,
        last_point_award_at = current_time
    WHERE id = auth.uid();

    RETURN jsonb_build_object('success', true, 'points', 1);
END;
$$;
