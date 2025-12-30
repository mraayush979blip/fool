'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { RetentionStats } from '@/types/database';

import {
    Users,
    Shield,
    ShieldAlert,
    Layers,
    Plus,
    Upload,
    BarChart3,
    TrendingUp,
    Percent
} from 'lucide-react';
import Link from 'next/link';

export default function AdminDashboard() {
    const [stats, setStats] = useState({
        totalStudents: 0,
        activeStudents: 0,
        revokedStudents: 0,
        livePhases: 0,
    });
    const [retentionData, setRetentionData] = useState<RetentionStats | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchDashboardStats();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            // Fetch total students
            const { count: totalStudents } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student');

            // Fetch active students
            const { count: activeStudents } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('status', 'active');

            // Fetch revoked students
            const { count: revokedStudents } = await supabase
                .from('users')
                .select('*', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('status', 'revoked');

            // Fetch live phases
            const now = new Date().toISOString();
            const { count: livePhases } = await supabase
                .from('phases')
                .select('*', { count: 'exact', head: true })
                .eq('is_active', true)
                .eq('is_paused', false)
                .lte('start_date', now)
                .gte('end_date', now);

            setStats({
                totalStudents: totalStudents || 0,
                activeStudents: activeStudents || 0,
                revokedStudents: revokedStudents || 0,
                livePhases: livePhases || 0,
            });

            // Calculate retention
            const retentionPercent = totalStudents
                ? ((activeStudents || 0) / totalStudents * 100).toFixed(2)
                : '0';

            setRetentionData({
                total_students: totalStudents || 0,
                retained_count: activeStudents || 0,
                revoked_count: revokedStudents || 0,
                retention_percent: parseFloat(retentionPercent),
                pie_chart_data: [
                    { name: 'Active', value: activeStudents || 0, color: '#10b981' },
                    { name: 'Revoked', value: revokedStudents || 0, color: '#ef4444' },
                ],
            });
        } catch (error) {
            console.error('Error fetching dashboard stats:', error);
        } finally {
            setLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
                <div className="text-sm font-medium text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-200">
                    Last sync: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">Total Students</p>
                            <p className="text-3xl font-bold text-gray-900 mt-2">
                                {stats.totalStudents}
                            </p>
                        </div>
                        <div className="bg-blue-50 rounded-lg p-3">
                            <Users className="w-6 h-6 text-blue-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">Active Students</p>
                            <p className="text-3xl font-bold text-emerald-600 mt-2">
                                {stats.activeStudents}
                            </p>
                        </div>
                        <div className="bg-emerald-50 rounded-lg p-3">
                            <Shield className="w-6 h-6 text-emerald-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">Revoked Students</p>
                            <p className="text-3xl font-bold text-rose-600 mt-2">
                                {stats.revokedStudents}
                            </p>
                        </div>
                        <div className="bg-rose-50 rounded-lg p-3">
                            <ShieldAlert className="w-6 h-6 text-rose-600" />
                        </div>
                    </div>
                </div>

                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-sm font-semibold text-gray-500 uppercase">Live Phases</p>
                            <p className="text-3xl font-bold text-indigo-600 mt-2">
                                {stats.livePhases}
                            </p>
                        </div>
                        <div className="bg-indigo-50 rounded-lg p-3">
                            <Layers className="w-6 h-6 text-indigo-600" />
                        </div>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Retention Stats */}
                <div className="lg:col-span-2 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-gray-900 flex items-center">
                            <BarChart3 className="mr-2 h-5 w-5 text-gray-400" />
                            Student Retention Analysis
                        </h3>
                    </div>

                    {retentionData && (
                        <div className="space-y-6">
                            <div className="flex items-end justify-between">
                                <div className="space-y-4 flex-1">
                                    <div className="relative pt-1 max-w-sm">
                                        <div className="flex mb-2 items-center justify-between">
                                            <div>
                                                <span className="text-xs font-semibold inline-block py-1 px-2 uppercase rounded-full text-emerald-600 bg-emerald-100">
                                                    Retention Rate
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs font-semibold inline-block text-emerald-600 font-bold">
                                                    {retentionData.retention_percent}%
                                                </span>
                                            </div>
                                        </div>
                                        <div className="overflow-hidden h-2 mb-4 text-xs flex rounded bg-emerald-100">
                                            <div style={{ width: `${retentionData.retention_percent}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-emerald-500"></div>
                                        </div>
                                    </div>

                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="bg-gray-50 rounded-lg p-4 font-bold">
                                            <p className="text-xs text-gray-500 uppercase">Retained</p>
                                            <p className="text-xl font-bold text-gray-900">{retentionData.retained_count}</p>
                                        </div>
                                        <div className="bg-gray-50 rounded-lg p-4 font-bold">
                                            <p className="text-xs text-gray-500 uppercase">Dropped/Revoked</p>
                                            <p className="text-xl font-bold text-gray-900">{retentionData.revoked_count}</p>
                                        </div>
                                    </div>
                                </div>

                                <div className="hidden sm:flex flex-col items-center justify-center p-8 bg-emerald-50 rounded-2xl">
                                    <TrendingUp className="h-12 w-12 text-emerald-600 mb-2" />
                                    <span className="text-2xl font-black text-emerald-700">{retentionData.retention_percent}%</span>
                                    <span className="text-xs text-emerald-600 font-medium">Efficiency</span>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 font-bold">
                    <h3 className="text-lg font-bold text-gray-900 mb-6">Quick Actions</h3>
                    <div className="space-y-3">
                        <Link href="/admin/phases/new" className="w-full flex items-center justify-between p-4 bg-blue-50 hover:bg-blue-100 rounded-xl transition-colors group">
                            <div className="flex items-center">
                                <Plus className="h-5 w-5 text-blue-600 mr-3" />
                                <span className="text-sm font-bold text-blue-700">Create New Phase</span>
                            </div>
                            <span className="text-blue-300 group-hover:text-blue-600 transition-colors">→</span>
                        </Link>

                        <Link href="/admin/import" className="w-full flex items-center justify-between p-4 bg-emerald-50 hover:bg-emerald-100 rounded-xl transition-colors group">
                            <div className="flex items-center">
                                <Upload className="h-5 w-5 text-emerald-600 mr-3" />
                                <span className="text-sm font-bold text-emerald-700">Import Students</span>
                            </div>
                            <span className="text-emerald-300 group-hover:text-emerald-600 transition-colors">→</span>
                        </Link>

                        <Link href="/admin/students" className="w-full flex items-center justify-between p-4 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors group">
                            <div className="flex items-center">
                                <Users className="h-5 w-5 text-indigo-600 mr-3" />
                                <span className="text-sm font-bold text-indigo-700">View All Students</span>
                            </div>
                            <span className="text-indigo-300 group-hover:text-indigo-600 transition-colors">→</span>
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
