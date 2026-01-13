'use client';

import { useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export default function NotificationListener() {
    useEffect(() => {
        const channel = supabase
            .channel('public:notifications')
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'notifications',
                },
                (payload) => {
                    const newNotification = payload.new as { title: string; message: string };
                    toast.info(newNotification.title, {
                        description: newNotification.message,
                        duration: 5000,
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    return null;
}
