'use client';

import { useRef, useState, useEffect } from 'react';
import _ReactPlayer from 'react-player';
const ReactPlayer = _ReactPlayer as any;
import { supabase } from '@/lib/supabase';

interface PremiumPlayerProps {
    videoId: string;
    phaseId: string;
    studentId: string;
    initialProgress: number;
    onComplete?: () => void;
}

export default function PremiumPlayer({ videoId, phaseId, studentId, initialProgress, onComplete }: PremiumPlayerProps) {
    const playerRef = useRef<any>(null);
    const lastSavedTimeRef = useRef(initialProgress);
    const [isClient, setIsClient] = useState(false);

    // Ensure we only render react-player on the client to prevent HTML5 video fallbacks during SSR
    useEffect(() => {
        setIsClient(true);
    }, []);

    const handleProgress = async (state: any) => {
        // Save progress every 10 seconds
        if (Math.abs(state.playedSeconds - lastSavedTimeRef.current) >= 10) {
            lastSavedTimeRef.current = state.playedSeconds;
            try {
                await supabase
                    .from('student_phase_activity')
                    .update({ video_watched_seconds: Math.floor(state.playedSeconds) })
                    .eq('phase_id', phaseId)
                    .eq('student_id', studentId);
            } catch (err) {
                console.error("Failed to save video progress", err);
            }
        }
    };

    if (!isClient) {
        return (
            <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-md flex items-center justify-center">
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            </div>
        );
    }

    return (
        <div className="relative aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-md">
            {initialProgress > 5 && (
                <div className="absolute top-4 left-4 z-20 bg-black/60 backdrop-blur-sm text-white px-3 py-1.5 rounded-lg text-xs font-bold pointer-events-none">
                    Resuming from {Math.floor(initialProgress / 60)}:{(Math.floor(initialProgress % 60)).toString().padStart(2, '0')}
                </div>
            )}
            <ReactPlayer
                ref={playerRef}
                url={`https://www.youtube.com/watch?v=${videoId}`}
                width="100%"
                height="100%"
                controls={true}
                onProgress={handleProgress}
                progressInterval={2000}
                config={{
                    youtube: {
                        playerVars: { 
                            showinfo: 1, 
                            modestbranding: 1,
                            start: Math.floor(initialProgress)
                        }
                    } as any
                }}
            />
        </div>
    );
}
