'use client';

import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

const ACTIVITY_TIMEOUT_MS = 30 * 1000; // 30 seconds of no input = idle
const AWARD_INTERVAL_MS = 2 * 60 * 1000; // 2 minutes

export default function ActivityTracker() {
    const { user } = useAuth();
    const lastActivityRef = useRef<number>(Date.now());
    const isIdleRef = useRef<boolean>(false);

    useEffect(() => {
        if (!user) return;

        // 1. Input Listeners
        const handleInput = () => {
            lastActivityRef.current = Date.now();
            isIdleRef.current = false;
        };

        window.addEventListener('mousemove', handleInput);
        window.addEventListener('keydown', handleInput);
        window.addEventListener('click', handleInput);
        window.addEventListener('scroll', handleInput);

        // 2. Point Awarding Interval
        const awardInterval = setInterval(async () => {
            const now = Date.now();
            const timeSinceActivity = now - lastActivityRef.current;

            // Only award if user has been active recently
            if (timeSinceActivity < ACTIVITY_TIMEOUT_MS) {
                try {
                    const { data, error } = await supabase.rpc('award_activity_point');

                    if (error) {
                        console.error('❌ [ActivityTracker] RPC Error:', error.message || 'Unknown error');
                        console.error('Error Code:', error.code);
                        console.error('Error Details:', error.details);
                        console.error('Error Hint:', error.hint);
                        console.log('Full Debug Error:', error);
                    } else if (data) {
                        if (data.success) {
                            console.log('✅ Activity point awarded');
                        } else {
                            // This matches the "Cooldown active" case from our SQL
                            console.log('ℹ️ Activity point status:', data.message);
                        }
                    }
                } catch (err) {
                    console.error('Failed to award activity point:', err);
                }
            } else {
                isIdleRef.current = true;
                // console.log('User is idle, no point awarded');
            }
        }, AWARD_INTERVAL_MS);

        return () => {
            window.removeEventListener('mousemove', handleInput);
            window.removeEventListener('keydown', handleInput);
            window.removeEventListener('click', handleInput);
            window.removeEventListener('scroll', handleInput);
            clearInterval(awardInterval);
        };
    }, [user]);

    return null; // Renderless component
}
