'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Trophy, Flame, Users, CheckCircle2, Loader2, ArrowLeft, Medal, Zap } from 'lucide-react';
import Link from 'next/link';
import BadgeList from '@/components/gamification/BadgeList';

interface LeaderboardEntry {
    id: string;
    name: string;
    avatar: string;
    completed_phases: number;
    current_streak: number;
}

interface PhaseStats {
    phase_number: number;
    title: string;
    completed_count: number;
}

interface RankContext {
    rank: number;
    neighbors: {
        id: string;
        name: string;
        avatar: string;
        rank_position: number;
        completed_phases: number;
        current_streak: number;
    }[];
}

export default function CompetePage() {
    const { user } = useAuth();
    const [loading, setLoading] = useState(true);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
    const [phaseStats, setPhaseStats] = useState<PhaseStats[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [badges, setBadges] = useState<any[]>([]);
    const [userBadges, setUserBadges] = useState<any[]>([]);
    const [rankContext, setRankContext] = useState<RankContext | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            // 1. Update own streak on page load
            if (user) {
                console.log('🔄 [Compete] Updating streak...');
                const { error: streakErr } = await supabase.rpc('update_student_streak', { student_uuid: user.id });
                if (streakErr) console.error('⚠️ [Compete] Streak update error:', streakErr);

                // Fetch User Badges
                console.log('🔄 [Compete] Fetching user badges...');
                const { data: ubData, error: ubErr } = await supabase
                    .from('user_badges')
                    .select('*')
                    .eq('user_id', user.id);
                if (ubErr) console.error('⚠️ [Compete] Badges fetch error:', ubErr);
                setUserBadges(ubData || []);

                // Fetch Rank Context
                console.log('🔄 [Compete] Fetching rank context...');
                const { data: rankData, error: rankErr } = await supabase
                    .rpc('get_student_rank_context', { current_student_id: user.id });
                if (rankErr) console.error('⚠️ [Compete] Rank context error:', rankErr);
                setRankContext(rankData);
            }

            // Fetch All Badges
            const { data: bData } = await supabase.from('badges').select('*');
            setBadges(bData || []);

            // 2. Fetch Leaderboard using new Optimized RPC
            console.log('🔄 [Compete] Fetching leaderboard...');
            const { data: lbData, error: lbError } = await supabase
                .rpc('get_leaderboard_v2');

            if (lbError) {
                console.error('❌ [Compete] Leaderboard RPC failed:', lbError);
                throw lbError;
            }

            const processedLB = (lbData || []).map((entry: any) => ({
                id: entry.user_id,
                name: entry.user_name,
                avatar: entry.user_avatar || '👤',
                current_streak: entry.current_streak || 0,
                completed_phases: Number(entry.completed_phases) || 0,
                activity_points: entry.activity_points || 0
            }));

            setLeaderboard(processedLB);

            // 3. Fetch Total Students
            const { count } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');
            setTotalStudents(count || 0);

            // 4. Fetch Phase Completion Stats
            const { data: phases } = await supabase
                .from('phases')
                .select('phase_number, title, id')
                .eq('is_active', true)
                .order('phase_number', { ascending: true });

            if (phases) {
                const stats = await Promise.all(phases.map(async (p) => {
                    const { count: completedCount } = await supabase
                        .from('submissions')
                        .select('*', { count: 'exact', head: true })
                        .eq('phase_id', p.id)
                        .eq('status', 'valid');

                    return {
                        phase_number: p.phase_number,
                        title: p.title,
                        completed_count: completedCount || 0
                    };
                }));
                setPhaseStats(stats);
            }

        } catch (error: any) {
            console.error('❌ [Compete] Global Fetch Error:', error);
            // If it's a Supabase error, it might not be an instance of Error
            if (error && typeof error === 'object') {
                console.error('Error Details:', JSON.stringify(error, null, 2));
            }
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
            {/* Header */}
            <div className="space-y-2">
                <Link href="/student" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 mb-4 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">Level Up Your Journey</h1>
                        <p className="text-gray-500 mt-1">Compete with fellow students and maintain your learning streak.</p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left Column: My Stats & Community */}
                <div className="lg:col-span-1 space-y-8">
                    {/* My Streak Card */}
                    <div className="bg-gradient-to-br from-orange-400 to-rose-500 rounded-3xl p-8 text-white shadow-xl shadow-orange-100 relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform duration-500">
                            <Flame className="h-32 w-32" />
                        </div>
                        <div className="relative z-10">
                            <div className="flex items-center space-x-2 bg-white/20 w-fit px-3 py-1 rounded-full backdrop-blur-sm mb-6">
                                <Flame className="h-4 w-4 fill-white" />
                                <span className="text-xs font-bold uppercase tracking-wider">Daily Streak</span>
                            </div>
                            <div className="flex items-end space-x-2">
                                <span className="text-6xl font-black">{user?.current_streak || 0}</span>
                                <span className="text-xl font-bold mb-2">Days</span>
                            </div>
                            <p className="mt-4 text-orange-50/80 font-medium">Keep it up! Your max streak is {user?.max_streak || 0} days.</p>
                        </div>
                    </div>

                    {/* Badge List (Mobile/Desktop stacked) */}
                    <div className="lg:col-span-1">
                        <BadgeList badges={badges} userBadges={userBadges} />
                    </div>

                    {/* Community Stats */}
                    <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
                        <div className="flex items-center space-x-3">
                            <div className="bg-blue-50 p-2 rounded-xl">
                                <Users className="h-5 w-5 text-blue-600" />
                            </div>
                            <h2 className="text-xl font-bold text-gray-900">Community Progress</h2>
                        </div>

                        <div className="space-y-4">
                            {phaseStats.map((stat) => (
                                <div key={stat.phase_number} className="relative group">
                                    <div className="flex justify-between items-center mb-1 bg-white relative z-10">
                                        <span className="text-sm font-semibold text-gray-700">Phase {stat.phase_number}</span>
                                        <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                                            {stat.completed_count} Completed
                                        </span>
                                    </div>
                                    <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden border border-gray-100">
                                        <div
                                            className="bg-gradient-to-r from-blue-500 to-indigo-600 h-full rounded-full transition-all duration-1000 group-hover:shadow-[0_0_10px_rgba(59,130,246,0.5)]"
                                            style={{ width: `${(stat.completed_count / (totalStudents || 1)) * 100}%` }}
                                        ></div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Right Column: Leaderboard */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden h-full flex flex-col">
                        <div className="p-8 border-b border-gray-50 bg-gray-50/30">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-3">
                                    <div className="bg-yellow-50 p-2 rounded-xl">
                                        <Trophy className="h-6 w-6 text-yellow-600" />
                                    </div>
                                    <h2 className="text-2xl font-black text-gray-900 tracking-tight">Top Contributors</h2>
                                </div>
                                <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">Global Ranking</span>
                            </div>
                        </div>

                        <div className="flex-1 overflow-auto">
                            <div className="divide-y divide-gray-50">
                                {leaderboard.map((entry, index) => (
                                    <div
                                        key={entry.id}
                                        className={`p-6 flex items-center justify-between hover:bg-gray-50/50 transition-colors ${entry.id === user?.id ? 'bg-blue-50/50' : ''
                                            }`}
                                    >
                                        <div className="flex items-center space-x-4">
                                            <div className="flex-shrink-0 w-10 text-center">
                                                {index < 3 ? (
                                                    <div className="relative">
                                                        <Medal className={`h-8 w-8 mx-auto ${index === 0 ? 'text-yellow-400' :
                                                            index === 1 ? 'text-gray-400' :
                                                                'text-amber-600'
                                                            }`} />
                                                        <span className="absolute inset-0 flex items-center justify-center text-[10px] font-black text-white mb-0.5">
                                                            {index + 1}
                                                        </span>
                                                    </div>
                                                ) : (
                                                    <span className="text-lg font-black text-gray-300">{index + 1}</span>
                                                )}
                                            </div>
                                            <div className="flex-shrink-0">
                                                <div className="h-10 w-10 rounded-full bg-gray-100 flex items-center justify-center text-xl shadow-inner border border-gray-200">
                                                    {entry.avatar}
                                                </div>
                                            </div>
                                            <div>
                                                <p className="font-bold text-gray-900 flex items-center">
                                                    {entry.name}
                                                    {entry.id === user?.id && (
                                                        <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">You</span>
                                                    )}
                                                </p>
                                                <div className="flex items-center mt-0.5 space-x-3 text-xs text-gray-500">
                                                    <span className="flex items-center">
                                                        <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                                        {entry.completed_phases} Phases
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Zap className="h-3 w-3 mr-1 text-yellow-500" />
                                                        {(entry as any).activity_points || 0} Points
                                                    </span>
                                                    <span className="flex items-center">
                                                        <Flame className={`h-3 w-3 mr-1 ${entry.current_streak > 0 ? 'text-orange-500' : 'text-gray-300'}`} />
                                                        {entry.current_streak} Streak
                                                    </span>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex flex-col items-end">
                                            <span className="text-xs font-black text-gray-400 bg-gray-100 px-3 py-1 rounded-lg uppercase tracking-wider">
                                                Level {Math.floor(entry.completed_phases / 1) + 1}
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* You Are Here Section */}
                                {rankContext && rankContext.rank > 10 && rankContext.neighbors && (
                                    <>
                                        <div className="p-4 bg-gray-50 flex items-center justify-center">
                                            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest">...</span>
                                        </div>
                                        <div className="bg-blue-50/30 border-t-2 border-b-2 border-blue-100">
                                            <div className="px-6 py-3 bg-blue-50 flex items-center justify-between">
                                                <h3 className="text-sm font-bold text-blue-800 uppercase tracking-wider">You Are Here</h3>
                                            </div>
                                            {rankContext.neighbors.map((neighbor) => (
                                                <div
                                                    key={neighbor.id}
                                                    className={`p-6 flex items-center justify-between ${neighbor.id === user?.id ? 'bg-blue-50' : 'bg-white opacity-70'}`}
                                                >
                                                    <div className="flex items-center space-x-4">
                                                        <div className="flex-shrink-0 w-10 text-center">
                                                            <span className="text-lg font-black text-gray-400">{neighbor.rank_position}</span>
                                                        </div>
                                                        <div className="flex-shrink-0">
                                                            <div className="h-8 w-8 rounded-full bg-gray-50 flex items-center justify-center text-lg border border-gray-100">
                                                                {neighbor.avatar || '👤'}
                                                            </div>
                                                        </div>
                                                        <div>
                                                            <p className="font-bold text-gray-900 flex items-center">
                                                                {neighbor.name}
                                                                {neighbor.id === user?.id && (
                                                                    <span className="ml-2 text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-full uppercase tracking-tighter">You</span>
                                                                )}
                                                            </p>
                                                            <div className="flex items-center mt-0.5 space-x-3 text-xs text-gray-500">
                                                                <span className="flex items-center">
                                                                    <CheckCircle2 className="h-3 w-3 mr-1 text-green-500" />
                                                                    {neighbor.completed_phases} Phases
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </>
                                )}

                                {leaderboard.length === 0 && (
                                    <div className="py-20 text-center">
                                        <Users className="h-12 w-12 text-gray-200 mx-auto mb-4" />
                                        <p className="text-gray-400 font-medium">No activity yet. Be the first!</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
