'use client';

import { useState, useRef } from 'react';
import _ReactPlayer from 'react-player';
const ReactPlayer = _ReactPlayer as any;
import { Play, Loader2, RotateCcw, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';

interface PremiumPlayerProps {
    videoId: string;
    phaseId: string;
    studentId: string;
    initialProgress: number;
    onComplete?: () => void;
}

export default function PremiumPlayer({ videoId, phaseId, studentId, initialProgress, onComplete }: PremiumPlayerProps) {
    const [isPlaying, setIsPlaying] = useState(false);
    const [isReady, setIsReady] = useState(false);
    const [showResumePrompt, setShowResumePrompt] = useState(initialProgress > 5); // Only prompt if > 5 secs
    const [startAtTime, setStartAtTime] = useState<number | null>(null);
    const playerRef = useRef<any>(null);
    const lastSavedTimeRef = useRef(initialProgress);

    // Format seconds to mm:ss
    const formatTime = (seconds: number) => {
        const m = Math.floor(seconds / 60);
        const s = Math.floor(seconds % 60);
        return `${m}:${s.toString().padStart(2, '0')}`;
    };

    const handleStart = (resume: boolean) => {
        setShowResumePrompt(false);
        setIsPlaying(true);
        if (resume) {
            setStartAtTime(initialProgress);
        }
    };

    const handleReady = () => {
        setIsReady(true);
        if (startAtTime !== null && playerRef.current) {
            playerRef.current.seekTo(startAtTime, 'seconds');
            setStartAtTime(null); // Clear after seeking
        }
    };

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

    return (
        <div className="relative group aspect-video rounded-xl overflow-hidden bg-black border border-slate-200 dark:border-slate-800 shadow-md">
            {showResumePrompt ? (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900 z-30 text-white">
                    <Clock className="w-12 h-12 mb-4 text-blue-400 opacity-80" />
                    <h3 className="text-xl font-bold mb-2">Resume Video?</h3>
                    <p className="text-slate-400 mb-6 text-sm">You left off at {formatTime(initialProgress)}</p>
                    <div className="flex gap-4">
                        <button
                            onClick={() => handleStart(false)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg border border-slate-700 hover:bg-slate-800 transition-colors text-sm font-bold"
                        >
                            <RotateCcw className="w-4 h-4" /> Start Over
                        </button>
                        <button
                            onClick={() => handleStart(true)}
                            className="flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-600 hover:bg-blue-500 transition-colors text-sm font-bold"
                        >
                            <Play className="w-4 h-4 fill-current" /> Resume
                        </button>
                    </div>
                </div>
            ) : !isPlaying ? (
                <div 
                    className="absolute inset-0 z-20 cursor-pointer group"
                    onClick={() => handleStart(false)}
                >
                    <img
                        src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                        alt="Video Preview"
                        className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                    />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/10 transition-colors">
                        <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                            <Play className="w-8 h-8 text-white fill-white ml-1" />
                        </div>
                    </div>
                </div>
            ) : null}

            {(!showResumePrompt && isPlaying) && (
                <div className="absolute inset-0 w-full h-full">
                    {!isReady && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black z-10">
                            <Loader2 className="w-10 h-10 text-white animate-spin opacity-50" />
                        </div>
                    )}
                    <ReactPlayer
                        ref={playerRef}
                        url={`https://www.youtube.com/watch?v=${videoId}`}
                        width="100%"
                        height="100%"
                        playing={isReady}
                        controls={true}
                        onReady={handleReady}
                        onProgress={handleProgress}
                        progressInterval={2000} // Fire every 2 seconds
                        config={{
                            youtube: {
                                playerVars: { showinfo: 1, modestbranding: 1 }
                            } as any
                        }}
                    />
                </div>
            )}
        </div>
    );
}
