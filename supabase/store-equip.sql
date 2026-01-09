-- RPC: Equip Item
CREATE OR REPLACE FUNCTION equip_item(item_id_param UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    item_type VARCHAR;
    is_owned BOOLEAN;
BEGIN
    -- Check ownership
    SELECT EXISTS(SELECT 1 FROM user_inventory WHERE user_id = auth.uid() AND item_id = item_id_param)
    INTO is_owned;
    
    IF NOT is_owned THEN
        RETURN jsonb_build_object('success', false, 'message', 'Item not owned');
    END IF;

    -- Get item type
    SELECT type INTO item_type FROM store_items WHERE id = item_id_param;

    -- Update user profile based on type
    IF item_type = 'theme' THEN
        UPDATE users SET equipped_theme = (SELECT asset_value FROM store_items WHERE id = item_id_param) WHERE id = auth.uid();
    ELSIF item_type = 'banner' THEN
        UPDATE users SET equipped_banner = (SELECT asset_value FROM store_items WHERE id = item_id_param) WHERE id = auth.uid();
    ELSE
        -- For other types (frames, etc.), we might handle them differently or just log it for now.
        -- Assuming 'avatar_frame' might be added to users table later or stored in a JSONB profile column.
        RETURN jsonb_build_object('success', true, 'message', 'Equipped (Note: UI update required for this type)');
    END IF;

    -- Update inventory is_equipped flag (optional, but good for UI)
    -- First unequip same type
    -- (This part is complex if multiple items of same type exist, keeping it simple: just track in users table is easier for now)
    
    RETURN jsonb_build_object('success', true, 'message', 'Item equipped successfully');
END;
$$;
