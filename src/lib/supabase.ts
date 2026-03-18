import { createClient } from '@supabase/supabase-js';

// Use DIRECT path ONLY for absolute reliability on EdgeOne
let supabaseUrl = (process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tclvquwsxbntvwvozeto.supabase.co').trim();
if (supabaseUrl && !supabaseUrl.startsWith('http')) {
    supabaseUrl = `https://${supabaseUrl}`;
}
// Fixed direct host address
const finalBaseUrl = supabaseUrl;
const supabaseAnonKey = (process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '').trim();

export const supabase = createClient(
    finalBaseUrl,
    supabaseAnonKey || 'placeholder-key',
    {
        auth: {
            persistSession: true,
            autoRefreshToken: true,
            detectSessionInUrl: true,
            flowType: 'pkce'
        },
        global: {
            headers: {
                'x-client-info': 'levelone-bypass-v2.1'
            }
        }
    }
);

export async function getCurrentUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
}

export async function signIn(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });
    if (error) throw error;
    return data;
}

export async function signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
}
