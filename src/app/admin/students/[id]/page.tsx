'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
    ArrowLeft,
    User,
    Mail,
    Phone,
    Calendar,
    Layers,
    CheckCircle2,
    Clock,
    Shield,
    ShieldOff,
    Activity,
    Github,
    Link as LinkIcon
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { User as UserType, Submission, Phase } from '@/types/database';

export default function StudentDetailPage() {
    const params = useParams();
    const router = useRouter();
    const id = params.id as string;

    const [student, setStudent] = useState<UserType | null>(null);
    const [submissions, setSubmissions] = useState<(Submission & { phase: Phase })[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStudentData();
    }, [id]);

    const fetchStudentData = async () => {
        setLoading(true);
        try {
            // Fetch student info
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('*')
                .eq('id', id)
                .single();

            if (userError) throw userError;
            setStudent(userData);

            // Fetch submissions with phase info
            const { data: subData, error: subError } = await supabase
                .from('submissions')
                .select(`
          *,
          phase:phases(*)
        `)
                .eq('student_id', id)
                .order('created_at', { ascending: false });

            if (subError) throw subError;
            setSubmissions(subData as any);

            // Fetch activity stats
            const { data: activityData } = await supabase
                .from('student_phase_activity')
                .select('total_time_spent_seconds')
                .eq('student_id', id);

            if (activityData) {
                const totalSeconds = activityData.reduce((acc, curr) => acc + (curr.total_time_spent_seconds || 0), 0);
                const hrs = Math.floor(totalSeconds / 3600);
                setStudent(prev => prev ? { ...prev, total_time_spent_seconds: totalSeconds } : null);
            }

        } catch (error) {
            console.error('Error fetching student details:', error);
        } finally {
            setLoading(false);
        }
    };

    const toggleStatus = async () => {
        if (!student) return;
        const newStatus = student.status === 'active' ? 'revoked' : 'active';
        if (!confirm(`Are you sure you want to ${newStatus === 'revoked' ? 'revoke access' : 'restore access'} for ${student.name}?`)) return;

        try {
            const { error } = await supabase
                .from('users')
                .update({ status: newStatus })
                .eq('id', student.id);

            if (error) throw error;
            fetchStudentData();
        } catch (error) {
            console.error('Error updating student status:', error);
        }
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    if (!student) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-500 font-bold">Student not found.</p>
                <button onClick={() => router.back()} className="mt-4 text-blue-600 hover:underline">Go Back</button>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </button>
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">{student.name}</h1>
                    <p className="text-sm text-gray-500 font-bold underline">ID: {student.roll_number || 'N/A'}</p>
                </div>
                <div className="ml-auto flex items-center space-x-3">
                    <span className={`px-3 py-1 rounded-full text-sm font-bold border-2 ${student.status === 'active'
                        ? 'bg-green-50 text-green-700 border-green-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                        }`}>
                        {student.status.toUpperCase()}
                    </span>
                    <button
                        onClick={toggleStatus}
                        className={`p-2 rounded-lg border-2 transition-colors ${student.status === 'active'
                            ? 'bg-white border-red-200 text-red-600 hover:bg-red-50'
                            : 'bg-white border-green-200 text-green-600 hover:bg-green-50'
                            }`}
                    >
                        {student.status === 'active' ? <ShieldOff className="h-5 w-5" /> : <Shield className="h-5 w-5" />}
                    </button>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                {/* Profile Card */}
                <div className="md:col-span-1 space-y-6">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 font-bold">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <User className="mr-2 h-5 w-5 text-blue-500" />
                            General Information
                        </h3>
                        <div className="space-y-4">
                            <div className="flex items-center text-sm">
                                <Mail className="mr-3 h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{student.email}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Phone className="mr-3 h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">{student.phone || 'No phone number'}</span>
                            </div>
                            <div className="flex items-center text-sm">
                                <Calendar className="mr-3 h-4 w-4 text-gray-400" />
                                <span className="text-gray-600">Joined on {new Date(student.created_at).toLocaleDateString()}</span>
                            </div>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 font-bold">
                        <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <Activity className="mr-2 h-5 w-5 text-emerald-500" />
                            Progress Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="bg-emerald-50 p-4 rounded-xl">
                                <p className="text-xs text-emerald-600 font-bold uppercase">Phases Completed</p>
                                <p className="text-2xl font-black text-emerald-700">
                                    {submissions.filter(s => s.status === 'valid').length}
                                </p>
                            </div>
                            <div className="bg-blue-50 p-4 rounded-xl font-bold">
                                <p className="text-xs text-blue-600 font-bold uppercase">Total Watchtime</p>
                                <p className="text-2xl font-black text-blue-700">
                                    {Math.round((student.total_time_spent_seconds || 0) / 3600)}h
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submissions History */}
                <div className="md:col-span-2 space-y-6 font-bold">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                        <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <Layers className="mr-2 h-5 w-5 text-indigo-500" />
                            Submission History
                        </h3>

                        {submissions.length === 0 ? (
                            <div className="text-center py-12 bg-gray-50 rounded-xl border border-dashed border-gray-300">
                                <Clock className="mx-auto h-12 w-12 text-gray-300" />
                                <p className="mt-2 text-sm text-gray-500">No assignments submitted yet.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {submissions.map((sub) => (
                                    <div key={sub.id} className="p-4 border border-gray-100 rounded-xl hover:bg-gray-50 transition-colors">
                                        <div className="flex items-start justify-between">
                                            <div>
                                                <div className="flex items-center space-x-2">
                                                    <span className="text-sm font-bold text-indigo-600">Phase {sub.phase.phase_number}:</span>
                                                    <span className="text-sm font-bold text-gray-900">{sub.phase.title}</span>
                                                </div>
                                                <div className="mt-2 flex items-center space-x-4">
                                                    {sub.github_url && (
                                                        <a
                                                            href={sub.github_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center text-xs text-gray-500 hover:text-blue-600"
                                                        >
                                                            <Github className="mr-1 h-3 w-3" /> GitHub Repo
                                                        </a>
                                                    )}
                                                    {sub.file_url && (
                                                        <a
                                                            href={sub.file_url}
                                                            target="_blank"
                                                            rel="noreferrer"
                                                            className="inline-flex items-center text-xs text-gray-500 hover:text-blue-600"
                                                        >
                                                            <LinkIcon className="mr-1 h-3 w-3" /> Project Files
                                                        </a>
                                                    )}
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <span className="text-xs text-gray-400 block mb-1">
                                                    {new Date(sub.updated_at).toLocaleDateString()}
                                                </span>
                                                {sub.status === 'valid' ? (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-green-100 text-green-800 text-black">
                                                        <CheckCircle2 className="mr-1 h-3 w-3" /> Valid
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold bg-yellow-100 text-yellow-800">
                                                        Pending Review
                                                    </span>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
