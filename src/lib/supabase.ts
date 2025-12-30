import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// During build time (prerendering), these might be missing.
// We provide a fallback to avoid crashing the build, but warn the developer.
if (!supabaseUrl || !supabaseAnonKey) {
    if (typeof window === 'undefined' && process.env.NODE_ENV === 'production') {
        console.warn('⚠️ [Supabase] Missing environment variables. Static generation might fail if these are required.');
    }
}

export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co',
    supabaseAnonKey || 'placeholder-key'
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
