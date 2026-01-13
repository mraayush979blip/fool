'use client';

import { useState, useEffect, use } from 'react';
import Link from 'next/link';
import {
    ArrowLeft,
    Github,
    FileText,
    ExternalLink,
    Search,
    BarChart3,
    Users,
    CheckCircle2,
    XCircle,
    Download
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase, Submission, User } from '@/types/database';
import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Cell,
    PieChart,
    Pie
} from 'recharts';

interface ExtendedSubmission extends Submission {
    student: {
        name: string;
        roll_number: string;
        batch: string;
    };
}

export default function PhaseAssignmentDetailsPage({ params }: { params: Promise<{ phaseId: string }> }) {
    const { phaseId } = use(params);
    const [phase, setPhase] = useState<Phase | null>(null);
    const [submissions, setSubmissions] = useState<ExtendedSubmission[]>([]);
    const [totalStudents, setTotalStudents] = useState(0);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        if (phaseId) {
            fetchData();
        }
    }, [phaseId]);

    const fetchData = async () => {
        setLoading(true);
        try {
            // Fetch phase details
            const { data: phaseData, error: phaseError } = await supabase
                .from('phases')
                .select('*')
                .eq('id', phaseId)
                .single();

            if (phaseError) throw phaseError;
            setPhase(phaseData);

            // Fetch total active students
            const { count, error: studentsError } = await supabase
                .from('users')
                .select('id', { count: 'exact', head: true })
                .eq('role', 'student')
                .eq('status', 'active');

            if (studentsError) throw studentsError;
            setTotalStudents(count || 0);

            // Fetch submissions with student info
            const { data: subsData, error: subsError } = await supabase
                .from('submissions')
                .select('*, student:users(name, roll_number, batch)')
                .eq('phase_id', phaseId)
                .is('is_deleted', false);

            if (subsError) throw subsError;
            setSubmissions((subsData as any) || []);

        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const filteredSubmissions = submissions.filter(sub =>
        sub.student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        sub.student.batch?.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const submittedCount = submissions.length;
    const pendingCount = Math.max(0, totalStudents - submittedCount);
    const submissionRate = totalStudents > 0 ? (submittedCount / totalStudents) * 100 : 0;

    const chartData = [
        { name: 'Submitted', value: submittedCount, color: '#10b981' }, // green-500
        { name: 'Pending', value: pendingCount, color: '#ef4444' }, // red-500
    ];

    const COLORS = ['#10b981', '#ef4444'];

    if (loading) {
        return (
            <div className="flex justify-center items-center h-full">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!phase) {
        return (
            <div className="text-center py-12">
                <h2 className="text-2xl font-bold text-gray-900">Phase not found</h2>
                <Link href="/admin/assignment" className="text-blue-600 hover:underline mt-4 inline-block">
                    Back to assignments
                </Link>
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center space-x-4">
                <Link
                    href="/admin/assignment"
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-600" />
                </Link>
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tight">Phase {phase.phase_number}: {phase.title}</h1>
                    <p className="text-gray-500 font-medium tracking-tight">Assignment Submissions & Analytics</p>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <Users className="h-6 w-6 text-blue-600" />
                        </div>
                        <span className="text-2xl font-black text-gray-900">{totalStudents}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Total Students</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-green-50 rounded-lg">
                            <CheckCircle2 className="h-6 w-6 text-green-600" />
                        </div>
                        <span className="text-2xl font-black text-green-600">{submittedCount}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Submitted</p>
                </div>
                <div className="bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div className="p-2 bg-red-50 rounded-lg">
                            <XCircle className="h-6 w-6 text-red-600" />
                        </div>
                        <span className="text-2xl font-black text-red-600">{pendingCount}</span>
                    </div>
                    <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Pending</p>
                </div>
            </div>

            {/* Graph and Details */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Submission Graph */}
                <div className="lg:col-span-1 bg-white p-6 rounded-2xl border border-gray-200 shadow-sm">
                    <div className="flex items-center space-x-2 mb-6">
                        <BarChart3 className="h-5 w-5 text-gray-900" />
                        <h3 className="font-black text-gray-900 uppercase tracking-tight">Submission Ratio</h3>
                    </div>
                    <div className="h-64">
                        <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                                <Pie
                                    data={chartData}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={80}
                                    paddingAngle={5}
                                    dataKey="value"
                                >
                                    {chartData.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="mt-4 text-center">
                        <span className="text-3xl font-black text-gray-900">{submissionRate.toFixed(1)}%</span>
                        <p className="text-sm font-bold text-gray-500 uppercase tracking-wider">Completion Rate</p>
                    </div>
                </div>

                {/* Submissions Table */}
                <div className="lg:col-span-2 bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                    <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <h3 className="font-black text-gray-900 uppercase tracking-tight">Submissions List</h3>
                        <div className="relative flex-1 max-w-xs">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search students..."
                                className="w-full pl-9 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-gray-50 border-b border-gray-100">
                                <tr>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Student</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Roll No. / Batch</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider">Submitted At</th>
                                    <th className="px-6 py-4 text-xs font-bold text-gray-500 uppercase tracking-wider text-right">Action</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {filteredSubmissions.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-6 py-12 text-center text-gray-500 font-medium">
                                            No submissions found.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredSubmissions.map((sub) => (
                                        <tr key={sub.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4">
                                                <div className="font-bold text-gray-900">{sub.student.name}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-600">
                                                <div>{sub.student.roll_number || 'N/A'}</div>
                                                <div className="text-xs text-gray-400">{sub.student.batch || 'N/A'}</div>
                                            </td>
                                            <td className="px-6 py-4 text-sm text-gray-500">
                                                {new Date(sub.submitted_at).toLocaleString()}
                                            </td>
                                            <td className="px-6 py-4 text-right">
                                                {sub.submission_type === 'github' ? (
                                                    <a
                                                        href={sub.github_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 bg-gray-900 text-white text-xs font-bold rounded-lg hover:bg-gray-800 transition-colors"
                                                    >
                                                        <Github className="h-3.5 w-3.5 mr-1.5" />
                                                        GitHub
                                                        <ExternalLink className="h-3 w-3 ml-1.5 opacity-50" />
                                                    </a>
                                                ) : (
                                                    <a
                                                        href={sub.file_url}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 transition-colors"
                                                    >
                                                        <Download className="h-3.5 w-3.5 mr-1.5" />
                                                        File
                                                        <ExternalLink className="h-3 w-3 ml-1.5 opacity-50" />
                                                    </a>
                                                )}
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
}
