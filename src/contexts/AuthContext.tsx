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
                const { data: { session } } = await supabase.auth.getSession();

                if (session?.user) {
                    setSupabaseUser(session.user);

                    // Fetch user details from users table
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    console.log('Initial check - Session user:', session.user.email);
                    console.log('Initial check - User data:', userData);
                    console.log('Initial check - Error:', userError);

                    if (userData) {
                        setUser(userData as User);
                    } else {
                        console.error('❌ User not found in users table!');
                        console.error('Email:', session.user.email);
                        console.error('ID:', session.user.id);
                        console.error('Error:', userError);
                        // Sign out if user not found in database
                        await supabase.auth.signOut();
                    }
                }
            } catch (error) {
                console.error('Error checking user:', error);
            } finally {
                setLoading(false);
            }
        };

        // Add timeout to prevent infinite loading
        const timeout = setTimeout(() => {
            console.warn('Auth check timeout - setting loading to false');
            setLoading(false);
        }, 5000);

        checkUser().finally(() => clearTimeout(timeout));

        // Listen for auth changes
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
            async (event, session) => {
                if (session?.user) {
                    setSupabaseUser(session.user);

                    // Fetch user details
                    const { data: userData, error: userError } = await supabase
                        .from('users')
                        .select('*')
                        .eq('id', session.user.id)
                        .single();

                    console.log('Auth state change - User data:', userData);
                    console.log('Auth state change - Error:', userError);

                    if (userData) {
                        setUser(userData as User);
                    } else {
                        console.error('User not found in users table for:', session.user.email);
                        console.error('User ID:', session.user.id);
                        console.error('Error details:', userError);
                    }
                } else {
                    setSupabaseUser(null);
                    setUser(null);
                }
                setLoading(false);
            }
        );

        return () => {
            subscription.unsubscribe();
        };
    }, []);

    const handleSignIn = async (email: string, password: string) => {
        // Only perform the sign in. 
        // onAuthStateChange listener will handle the userData fetching 
        // and setting the state to avoid redundant calls.
        await signIn(email, password);
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
