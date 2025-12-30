import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// Strict check for valid URL format to prevent crashing the build
const isValidUrl = supabaseUrl && (supabaseUrl.startsWith('http://') || supabaseUrl.startsWith('https://'));

if (!isValidUrl) {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [Supabase] Missing or invalid NEXT_PUBLIC_SUPABASE_URL. Using placeholder for build.');
    }
}

export const supabase = createClient(
    isValidUrl ? supabaseUrl : 'https://placeholder.supabase.co',
    (isValidUrl && supabaseAnonKey) ? supabaseAnonKey : 'placeholder-key'
);

// Helper function to get current user
export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

// Helper function to sign in
export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

// Helper function to sign out
export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
