-- Safe store items seed - inserts all avatars, skips if already exists
-- Run this in Supabase SQL Editor

INSERT INTO "public"."store_items" 
  ("id", "code", "name", "description", "cost", "type", "asset_value", "required_badge_id", "required_streak", "created_at") 
VALUES 
  ('0f003be9-07b3-40fd-8860-d316165f7b3e', 'CHAR_DEFAULT', 'Basic Student',      'The standard Levelone student avatar.',               0,    'avatar', '🧑‍💻', null, null, '2026-01-10 20:02:40'),
  ('0fe02b47-92ab-4009-b4f3-fb1a39cbc244', 'CHAR_DRAGON',  'Fire Breather',       'Spitting hot code daily.',                            500,  'avatar', '🐲',  null, null, '2026-01-10 20:42:39'),
  ('1dd208e5-f271-4606-825c-bd1329367b06', 'CHAR_WIZARD',  'Logic Wizard',        'Master of the arcane syntax.',                        1500, 'avatar', '🧙',  null, null, '2026-01-10 20:42:39'),
  ('2878850b-38f0-48b5-bbc4-034e3b5413e1', 'CHAR_CROWN',   'Phase King/Queen',    'The ultimate symbol of completion.',                  1000, 'avatar', '👑',  null, null, '2026-01-10 20:42:39'),
  ('2ac321fc-4371-4b4f-af95-35201d48cbd5', 'CHAR_ROBOT',   'AI Assistant',        'Highly efficient learning machine.',                  2000, 'avatar', '🤖',  null, null, '2026-01-10 20:42:39'),
  ('5500c83d-cb1d-48f3-b7b4-ae16b7667b99', 'CHAR_NINJA',   'Code Ninja',          'For those who write silent but deadly code.',         50,   'avatar', '🥷',  null, 3,    '2026-01-10 20:42:39'),
  ('55da8e31-ae82-4c7f-92dc-575ead566d92', 'CHAR_ROCKET',  'Rocket Dev',          'Taking your progress to the moon.',                   3000, 'avatar', '🚀',  null, null, '2026-01-10 20:42:39')
ON CONFLICT (code) DO UPDATE SET
  asset_value = EXCLUDED.asset_value,
  name        = EXCLUDED.name,
  description = EXCLUDED.description;
