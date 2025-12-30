import { createClient } from '@supabase/supabase-js';

let supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// If the user provided just the project ID (e.g. tclvquwsxbntvwvozeto), convert it to a full URL
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}.supabase.co`;
}

const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

if (!isValidUrl) {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [Supabase Admin] Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Using placeholder for build.');
    }
}

export const supabaseAdmin = createClient(
    (isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co') as string,
    ((isValidUrl && supabaseServiceRoleKey) ? supabaseServiceRoleKey : 'placeholder-key') as string,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    });
