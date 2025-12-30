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
    const [stats, setStats] = useState({
        completedCount: 0,
        totalTimeSeconds: 0
    });

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
                    console.error('Error in self-revocation check:', revokeError);
                } else if (isRevoked) {
                    window.location.href = '/revoked';
                    return;
                }

                // Fetch phases
                const { data: phasesData, error: phasesError } = await supabase
                    .from('phases')
                    .select('*')
                    .eq('is_active', true)
                    .eq('is_paused', false)
                    .order('phase_number', { ascending: true });

                if (phasesError) throw phasesError;

                // Only show LIVE phases
                const livePhases = (phasesData || []).filter(phase => {
                    const status = getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused);
                    return status === 'live';
                });

                setPhases(livePhases);

                // Fetch student stats
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('total_time_spent_seconds')
                    .eq('id', user.id)
                    .single();

                // Fetch completed phases
                const { data: subData } = await supabase
                    .from('submissions')
                    .select('phase_id')
                    .eq('student_id', user.id)
                    .eq('status', 'valid');

                setStats({
                    completedCount: subData?.length || 0,
                    totalTimeSeconds: userData?.total_time_spent_seconds || 0
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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <header className="mb-10">
                <h1 className="text-3xl font-bold text-gray-900">My Learning Journey</h1>
                <p className="mt-2 text-gray-600">Track your progress and complete your training phases.</p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4">
                    <div className="bg-blue-50 p-3 rounded-lg text-blue-600">
                        <BookOpen className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Active Phases</p>
                        <p className="text-2xl font-bold text-gray-900">{phases.length}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 text-black">
                    <div className="bg-green-50 p-3 rounded-lg text-green-600">
                        <Trophy className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Completed</p>
                        <p className="text-2xl font-bold text-gray-900">{stats.completedCount}</p>
                    </div>
                </div>
                <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 flex items-center space-x-4 text-black">
                    <div className="bg-orange-50 p-3 rounded-lg text-orange-600">
                        <Clock className="h-6 w-6" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-500 uppercase">Time Spent</p>
                        <p className="text-2xl font-bold text-gray-900">{formatDuration(stats.totalTimeSeconds)}</p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <h2 className="text-xl font-bold text-gray-900 flex items-center">
                    <Video className="mr-2 h-5 w-5 text-blue-600" />
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
                                className="group bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all flex flex-col md:flex-row md:items-center justify-between"
                            >
                                <div className="flex items-center space-x-4">
                                    <div className="h-12 w-12 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-bold shrink-0">
                                        P{phase.phase_number}
                                    </div>
                                    <div>
                                        <h3 className="text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                                            {phase.title}
                                        </h3>
                                        <p className="text-sm text-gray-500 line-clamp-1 max-w-xl">
                                            {phase.description}
                                        </p>
                                    </div>
                                </div>
                                <div className="mt-4 md:mt-0 flex items-center space-x-6">
                                    <div className="flex flex-col items-end">
                                        <span className="text-xs font-medium text-gray-400 uppercase">Status</span>
                                        <span className="text-sm font-semibold text-gray-700">Not Started</span>
                                    </div>
                                    <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-blue-500 group-hover:translate-x-1 transition-all" />
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
