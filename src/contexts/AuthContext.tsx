'use client';

import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
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
    const userRef = useRef<User | null>(null);

    useEffect(() => {
        let mounted = true;

        const initializeAuth = async () => {
            console.log('🔄 [Auth] Initializing...');

            // Listen for auth changes
            const { data: { subscription } } = supabase.auth.onAuthStateChange(
                async (event, session) => {
                    if (!mounted) return;
                    console.log(`🔔 [Auth] State change: ${event}`);

                    // Only set loading true if we are changing state or initializing
                    // Avoid setting it true if we already have a user and it's just a token refresh, 
                    // unless we need to re-fetch the profile.

                    if (session?.user) {
                        // Optimization: Skip fetching profile if we already have the user loaded
                        // This prevents blocking UI on every token refresh
                        if (userRef.current && userRef.current.id === session.user.id) {
                            setSupabaseUser(session.user);
                            if (mounted) setLoading(false);
                            return;
                        }

                        try {
                            const { data: userData, error: userError } = await supabase
                                .from('users')
                                .select('*')
                                .eq('id', session.user.id)
                                .single();

                            if (!mounted) return;

                            if (userData) {
                                console.log('✅ [Auth] Profile loaded');
                                const newUser = userData as User;
                                setUser(newUser);
                                // Update ref immediately to prevent race conditions in subsequent events
                                userRef.current = newUser;
                                setSupabaseUser(session.user);
                            } else {
                                console.warn('⚠️ [Auth] User authenticated but profile missing');
                                setSupabaseUser(session.user);
                                setUser(null);
                                userRef.current = null;
                            }
                        } catch (err) {
                            console.error('❌ [Auth] Error fetching profile:', err);
                        } finally {
                            if (mounted) setLoading(false);
                        }
                    } else {
                        // Signed out
                        if (mounted) {
                            setUser(null);
                            userRef.current = null;
                            setSupabaseUser(null);
                            setLoading(false);
                        }
                    }
                }
            );

            return () => {
                mounted = false;
                subscription.unsubscribe();
            };
        };

        initializeAuth();
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
        userRef.current = null;
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
