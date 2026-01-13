'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';
import {
    BookOpen,
    Video,
    CheckCircle2,
    Clock,
    ChevronRight,
    Trophy,
    Zap,
    Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getPhaseStatus } from '@/lib/utils';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ completedCount: 0, totalTimeSeconds: 0, points: 0 });
    const [submissions, setSubmissions] = useState<Set<string>>(new Set());

    const formatDuration = (seconds: number) => {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);
        if (hours > 0) return `${hours}h ${minutes}m`;
        return `${minutes}m`;
    };

    useEffect(() => {
        const fetchDashboardData = async () => {
            if (!user) return;
            if (phases.length === 0) setLoading(true);
            try {
                // Check if student should be revoked (self-check)
                const { data: isRevoked, error: revokeError } = await supabase.rpc('check_and_revoke_self');
                if (revokeError) {
                    console.error('Error in self-revocation check:', {
                        message: revokeError.message,
                        details: revokeError.details,
                        hint: revokeError.hint,
                        code: revokeError.code
                    });
                } else if (isRevoked) {
                    window.location.href = '/revoked';
                    return;
                }

                // Parallelize independent data fetching
                const [
                    streakResult,
                    phasesResult,
                    userResult,
                    submissionsResult,
                    activityResult
                ] = await Promise.all([
                    // Update streak
                    supabase.rpc('update_student_streak', { student_uuid: user.id }),

                    // Fetch phases (ALL active ones, regardless of pause or date)
                    supabase
                        .from('phases')
                        .select('*')
                        .eq('is_active', true)
                        .order('phase_number', { ascending: true }),

                    // Fetch student stats
                    supabase
                        .from('users')
                        .select('total_time_spent_seconds, points')
                        .eq('id', user.id)
                        .single(),

                    // Fetch all submissions for status tracking
                    supabase
                        .from('submissions')
                        .select('phase_id')
                        .eq('student_id', user.id),

                    // Fetch total phase-specific learning time
                    supabase
                        .from('student_phase_activity')
                        .select('total_time_spent_seconds')
                        .eq('student_id', user.id)
                ]);

                if (phasesResult.error) throw phasesResult.error;

                setPhases(phasesResult.data || []);

                // Track submission IDs for status badges
                const submissionIds = new Set((submissionsResult.data || []).map((s: any) => s.phase_id));
                setSubmissions(submissionIds);

                // Calculate total learning time from all phases
                const totalLearningTime = (activityResult.data || []).reduce((acc: number, curr: any) => acc + (curr.total_time_spent_seconds || 0), 0);

                setStats({
                    completedCount: submissionsResult.data?.length || 0,
                    totalTimeSeconds: totalLearningTime,
                    points: userResult.data?.points || 0
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        if (user?.id) {
            fetchDashboardData();
        }
    }, [user?.id]);

    const getGreeting = () => {
        const hour = new Date().getHours();
        if (hour < 12) return 'Good morning';
        if (hour < 17) return 'Good afternoon';
        return 'Good evening';
    };

    const DashboardSkeleton = () => (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 animate-pulse">
            <div className="h-32 md:h-48 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full" />
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[1, 2, 3, 4].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-xl" />
                ))}
            </div>
            <div className="space-y-4">
                <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded w-48" />
                {[1, 2, 3].map(i => (
                    <div key={i} className="h-24 bg-gray-100 dark:bg-gray-800 rounded-2xl w-full" />
                ))}
            </div>
        </div>
    );

    if (loading) {
        return <DashboardSkeleton />;
    }

    const livePhasesCount = phases.filter((p: Phase) => getPhaseStatus(p.start_date, p.end_date, p.is_paused) === 'live').length;

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            {/* Profile Banner */}
            {user?.equipped_banner && user.equipped_banner !== 'default' && (
                <div
                    className="h-32 md:h-48 rounded-2xl overflow-hidden shadow-lg border border-white/10 relative group"
                >
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/60 z-10" />
                    <img
                        src={`https://img.youtube.com/vi/${user.equipped_banner}/maxresdefault.jpg`}
                        alt="Profile Banner"
                        className="w-full h-full object-cover"
                    />
                    <div className="absolute bottom-6 left-8 z-20">
                        <h2 className="text-2xl font-black text-white drop-shadow-md">
                            {getGreeting()}, {user.name}
                        </h2>
                    </div>
                </div>
            )}

            <header className={(user?.equipped_banner && user.equipped_banner !== 'default') ? 'hidden' : 'mb-10 text-center md:text-left relative'}>
                <div className="flex flex-col md:flex-row md:items-end md:justify-between">
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>
                            {getGreeting()}, <span className="text-blue-600">{user?.name || 'Student'}</span>
                        </h1>
                        <p className="mt-2 text-lg font-medium opacity-80" style={{ color: 'var(--text-muted, #4b5563)' }}>Keep going, you're doing great!</p>
                    </div>
                    <div className="mt-4 md:mt-0 flex items-center justify-center md:justify-end space-x-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                        <span className="flex h-2 w-2 rounded-full bg-green-500 animate-pulse" />
                        <span>Live • Updated {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
                <div className="p-5 rounded-2xl shadow-sm border transition-all flex flex-col items-center justify-center text-center space-y-2 group hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-xl bg-blue-500/10 text-blue-600 group-hover:bg-blue-500 group-hover:text-white transition-all">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted, #6b7280)' }}>Active</p>
                        <p className="text-xl font-black" style={{ color: 'var(--foreground)' }}>{livePhasesCount}</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl shadow-sm border transition-all flex flex-col items-center justify-center text-center space-y-2 group hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-xl bg-green-500/10 text-green-600 group-hover:bg-green-500 group-hover:text-white transition-all">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted, #6b7280)' }}>Done</p>
                        <p className="text-xl font-black" style={{ color: 'var(--foreground)' }}>{stats.completedCount}</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl shadow-sm border transition-all flex flex-col items-center justify-center text-center space-y-2 group hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-xl bg-yellow-500/10 text-yellow-600 group-hover:bg-yellow-500 group-hover:text-white transition-all">
                        <Zap className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted, #6b7280)' }}>Points</p>
                        <p className="text-xl font-black" style={{ color: 'var(--foreground)' }}>{(stats as any).points || 0}</p>
                    </div>
                </div>
                <div className="p-5 rounded-2xl shadow-sm border transition-all flex flex-col items-center justify-center text-center space-y-2 group hover:shadow-md hover:-translate-y-1" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-xl bg-purple-500/10 text-purple-600 group-hover:bg-purple-500 group-hover:text-white transition-all">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted, #6b7280)' }}>Time</p>
                        <p className="text-xl font-black" style={{ color: 'var(--foreground)' }}>{formatDuration(stats.totalTimeSeconds)}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold flex items-center" style={{ color: 'var(--foreground)' }}>
                    <Video className="mr-2 h-5 w-5" style={{ color: 'var(--theme-primary, #2563eb)' }} />
                    Available Learning Phases
                </h2>

                {phases.length === 0 ? (
                    <div className="bg-white p-12 rounded-xl border border-dashed border-gray-300 text-center">
                        <p className="text-gray-500">No active phases available at the moment.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6">
                        {phases.map((phase: Phase) => {
                            const status = getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused);
                            const isLive = status === 'live';
                            const isPaused = status === 'paused';
                            const isUpcoming = status === 'upcoming';
                            const isEnded = status === 'ended';
                            const isLocked = isPaused || isUpcoming;

                            const content = (
                                <div
                                    className={`group p-5 rounded-2xl shadow-sm border transition-all flex flex-col md:flex-row md:items-center justify-between ${isLocked ? 'opacity-75 cursor-not-allowed bg-gray-50/50 grayscale-[0.5]' : 'hover:shadow-xl hover:border-blue-500/30 active:scale-[0.98]'
                                        }`}
                                    style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}
                                >
                                    <div className="flex items-center space-x-5">
                                        <div
                                            className={`h-14 w-14 rounded-2xl flex items-center justify-center font-black shrink-0 transition-all border shadow-sm ${!isLocked && 'group-hover:rotate-3'}`}
                                            style={{
                                                backgroundColor: isLocked ? 'var(--card-border, #f3f4f6)' : 'var(--theme-primary, #2563eb)11',
                                                color: isLocked ? '#9ca3af' : 'var(--theme-primary, #2563eb)',
                                                borderColor: isLocked ? '#e5e7eb' : 'var(--theme-primary, #2563eb)33'
                                            }}
                                        >
                                            {isLocked ? <Lock className="h-6 w-6" /> : `P${phase.phase_number}`}
                                        </div>
                                        <div>
                                            <div className="flex items-center gap-2 flex-wrap">
                                                <h3 className={`text-xl font-bold transition-colors ${!isLocked && 'group-hover:text-blue-600'}`} style={{ color: isLocked ? '#6b7280' : 'var(--foreground)' }}>
                                                    {phase.title}
                                                </h3>
                                                {!phase.is_mandatory && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-400 rounded-full uppercase tracking-widest border border-gray-200">
                                                        Optional
                                                    </span>
                                                )}
                                                {isPaused && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-yellow-100 text-yellow-600 rounded-full uppercase tracking-widest border border-yellow-200">
                                                        Paused
                                                    </span>
                                                )}
                                                {isUpcoming && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-blue-100 text-blue-600 rounded-full uppercase tracking-widest border border-blue-200">
                                                        Starts • {new Date(phase.start_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                                {isLive && (
                                                    <span className="px-2 py-0.5 text-[10px] font-bold bg-orange-100 text-orange-600 rounded-full uppercase tracking-widest border border-orange-200">
                                                        Deadline • {new Date(phase.end_date).toLocaleDateString()}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-sm line-clamp-1 max-w-xl mt-0.5" style={{ color: 'var(--text-muted, #6b7280)' }}>
                                                {isUpcoming ? `Phase starts on ${new Date(phase.start_date).toLocaleDateString()}` : phase.description}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="mt-5 md:mt-0 flex items-center justify-between md:justify-end space-x-8 border-t md:border-t-0 pt-4 md:pt-0">
                                        <div className="flex flex-col items-start md:items-end">
                                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-muted, #9ca3af)' }}>Status</span>
                                            <span className={`text-sm font-black ${isLocked ? 'text-gray-400' : submissions.has(phase.id) ? 'text-green-500' : 'text-orange-400'}`}>
                                                {isPaused ? 'Paused' : isUpcoming ? 'Locked' : submissions.has(phase.id) ? 'Completed' : 'Continue'}
                                            </span>
                                        </div>
                                        <div className={`h-10 w-10 rounded-full bg-gray-50 dark:bg-gray-800 flex items-center justify-center transition-all shadow-inner ${!isLocked && 'group-hover:bg-blue-600 group-hover:text-white'}`}>
                                            {isLocked ? <Lock className="h-4 w-4 text-gray-400" /> : <ChevronRight className="h-5 w-5" />}
                                        </div>
                                    </div>
                                </div>
                            );

                            return isLocked ? (
                                <div key={phase.id}>{content}</div>
                            ) : (
                                <Link key={phase.id} href={`/student/phase/${phase.id}`}>
                                    {content}
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
