'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase, getCurrentUser, signIn, signOut } from '@/lib/supabase';
import { User } from '@/types/database';

interface AuthContextType {
    user: User | null;
    supabaseUser: SupabaseUser | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Check active session
        const checkUser = async () => {
            try {
                setLoading(true);
                console.log('🔄 [Auth] Starting session check...');
                const { data: { session }, error: sessionError } = await supabase.auth.getSession();

                if (sessionError) {
                    console.error('❌ [Auth] Session error:', sessionError.message);
                    return;
                }

                if (session?.user) {
                    setSupabaseUser(session.user);
                    console.log('👤 [Auth] Session found for:', session.user.email);

                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    if (userError) {
                        console.error('❌ [Auth] Database profile fetch error:', userError.message);
                    }

                    if (userData) {
                        setUser(userData as User);
                        console.log('✅ [Auth] Profile loaded successfully');
                    } else {
                        console.warn('⚠️ [Auth] User not in users table. NOT signing out to avoid loops.');
                        // Note: We don't sign out automatically here anymore.
                        // This allows transient issues or manual fixes without losing the session.
                    }
                } else {
                    console.log('ℹ️ [Auth] No active session found');
                }
            } catch (error: any) {
                console.error('🔴 [Auth] Unexpected error during checkUser:', error.message || error);
            } finally {
                setLoading(false);
            }
        };

        const timeout = setTimeout(() => {
            console.warn('⚠️ [Auth] Session check timed out');
            setLoading(false);
        }, 15000);

        checkUser().finally(() => clearTimeout(timeout));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                console.log(`🔔 [Auth] State change: ${event}`);

                if (session?.user) {
                    setSupabaseUser(session.user);
                    setLoading(true); // Ensure loading is true while fetching profile

                    // Fetch user details
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    console.log('Auth state change - User data found:', !!userData);

                    if (userData) {
                        setUser(userData as User);
                    } else {
                        console.error('User not found in users table for:', session.user.email);
                        console.error('User ID:', session.user.id);
                        if (userError) console.error('Error details:', userError);
                        setUser(null);
                    }
                    setLoading(false);
                } else {
                    setSupabaseUser(null);
                    setUser(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        try {
            setLoading(true);
            await signIn(email, password);

            // Wait a bit for onAuthStateChange to trigger and fetch user
            // or manually fetch it here for a faster/more reliable response to the caller
            const { data: { user: authUser } } = await supabase.auth.getUser();
            if (authUser) {
                const { data: userData } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', authUser.id)
                    .single();

                if (userData) {
                    setUser(userData as User);
                }
            }
        } catch (error) {
            setLoading(false);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const handleSignOut = async () => {
        await signOut();
        setUser(null);
        setSupabaseUser(null);
    };

    return (
        <AuthContext.Provider
            value={{
                user,
                supabaseUser,
                loading,
                signIn: handleSignIn,
                signOut: handleSignOut,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
}
