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
    Trophy
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { getPhaseStatus } from '@/lib/utils';

export default function StudentDashboard() {
    const { user } = useAuth();
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [stats, setStats] = useState({ completedCount: 0, totalTimeSeconds: 0 });
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
            setLoading(true);
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
                    submissionsResult
                ] = await Promise.all([
                    // Update streak
                    supabase.rpc('update_student_streak', { student_uuid: user.id }),

                    // Fetch phases
                    supabase
                        .from('phases')
                        .select('*')
                        .eq('is_active', true)
                        .eq('is_paused', false)
                        .order('phase_number', { ascending: true }),

                    // Fetch student stats
                    supabase
                        .from('users')
                        .select('total_time_spent_seconds')
                        .eq('id', user.id)
                        .single(),

                    // Fetch all submissions for status tracking
                    supabase
                        .from('submissions')
                        .select('phase_id')
                        .eq('student_id', user.id)
                ]);

                if (phasesResult.error) throw phasesResult.error;

                // Process phases
                const livePhases = (phasesResult.data || []).filter(phase => {
                    const status = getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused);
                    return status === 'live';
                });

                setPhases(livePhases);

                // Track submission IDs for status badges
                const submissionIds = new Set((submissionsResult.data || []).map(s => s.phase_id));
                setSubmissions(submissionIds);

                setStats({
                    completedCount: submissionsResult.data?.length || 0,
                    totalTimeSeconds: userResult.data?.total_time_spent_seconds || 0
                });

            } catch (error) {
                console.error('Error fetching dashboard data:', error);
            } finally {
                setLoading(false);
            }
        };

        fetchDashboardData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
            </div>
        );
    }

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
                            Welcome back, {user.name}
                        </h2>
                    </div>
                </div>
            )}

            <header className={user?.equipped_banner ? 'hidden' : 'mb-10'}>
                <h1 className="text-3xl font-bold" style={{ color: 'var(--foreground)' }}>My Learning Journey</h1>
                <p className="mt-2" style={{ color: 'var(--text-muted, #4b5563)' }}>Track your progress and complete your training phases.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="p-6 rounded-xl shadow-sm border transition-all flex items-center space-x-4" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-primary, #2563eb)22', color: 'var(--theme-primary, #2563eb)' }}>
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted, #6b7280)' }}>Active Phases</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{phases.length}</p>
                    </div>
                </div>
                <div className="p-6 rounded-xl shadow-sm border transition-all flex items-center space-x-4" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-primary, #2563eb)22', color: 'var(--theme-primary, #2563eb)' }}>
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted, #6b7280)' }}>Completed</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{stats.completedCount}</p>
                    </div>
                </div>
                <div className="p-6 rounded-xl shadow-sm border transition-all flex items-center space-x-4" style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: 'var(--theme-primary, #2563eb)22', color: 'var(--theme-primary, #2563eb)' }}>
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium uppercase" style={{ color: 'var(--text-muted, #6b7280)' }}>Time Spent</p>
                        <p className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>{formatDuration(stats.totalTimeSeconds)}</p>
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
                    <div className="grid grid-cols-1 gap-4">
                        {phases.map((phase) => (
                            <Link
                                key={phase.id}
                                href={`/student/phase/${phase.id}`}
                                className="group p-6 rounded-xl shadow-sm border transition-all flex flex-col md:flex-row md:items-center justify-between"
                                style={{ backgroundColor: 'var(--card-bg, #ffffff)', borderColor: 'var(--card-border, #f3f4f6)' }}
                            >
                                <div className="flex items-center space-x-4">
                                    <div
                                        className="h-12 w-12 rounded-full flex items-center justify-center font-bold shrink-0 transition-all border"
                                        style={{ backgroundColor: 'var(--theme-primary, #2563eb)22', color: 'var(--theme-primary, #2563eb)', borderColor: 'var(--theme-primary, #2563eb)44' }}
                                    >
                                        P{phase.phase_number}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold group-hover:translate-x-1 transition-all flex items-center" style={{ color: 'var(--foreground)' }}>
                                            {phase.title}
                                            {!phase.is_mandatory && (
                                                <span className="ml-2 px-2 py-0.5 text-[10px] font-bold bg-gray-100 text-gray-500 rounded uppercase tracking-wider">
                                                    Optional
                                                </span>
                                            )}
                                        </h3>
                                        <p className="text-sm line-clamp-1 max-w-xl" style={{ color: 'var(--text-muted, #6b7280)' }}>
                                            {phase.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center space-x-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-medium uppercase" style={{ color: 'var(--text-muted, #9ca3af)' }}>Status</span>
                                        <span className={`text-sm font-bold ${submissions.has(phase.id) ? 'text-green-600' : 'text-orange-500'}`}>
                                            {submissions.has(phase.id) ? 'Submitted' : 'Not Started'}
                                        </span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 transition-all group-hover:translate-x-1" style={{ color: 'var(--theme-primary, #2563eb)' }} />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
