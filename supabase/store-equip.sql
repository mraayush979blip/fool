-- RPC: Equip Item
CREATE OR REPLACE FUNCTION equip_item(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_record RECORD;
    user_id_val UUID := auth.uid();
BEGIN
    -- 1. Check if item exists and user owns it
    SELECT si.type, si.asset_value INTO item_record 
    FROM store_items si
    JOIN user_inventory ui ON si.id = ui.item_id
    WHERE si.id = item_id_param AND ui.user_id = user_id_val;

    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'message', 'Item not owned or not found');
    END IF;

    -- 2. Update user profile based on item type
    IF item_record.type = 'theme' THEN
        UPDATE users SET equipped_theme = item_record.asset_value WHERE id = user_id_val;
    ELSIF item_record.type = 'banner' THEN
        UPDATE users SET equipped_banner = item_record.asset_value WHERE id = user_id_val;
    ELSIF item_record.type = 'avatar' THEN
        UPDATE users SET equipped_avatar = item_record.asset_value WHERE id = user_id_val;
    ELSE
        RETURN jsonb_build_object('success', false, 'message', 'Unknown item type: ' || item_record.type);
    END IF;

    RETURN jsonb_build_object('success', true, 'message', 'Equipped successfully');
END;
$$;
