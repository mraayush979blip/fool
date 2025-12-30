import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

if (!isValidUrl) {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [Supabase Admin] Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Using placeholder for build.');
    }
}

export const supabaseAdmin = createClient(
    isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co',
    (isValidUrl && supabaseServiceRoleKey) ? supabaseServiceRoleKey : 'placeholder-key',
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
