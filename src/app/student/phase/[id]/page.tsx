'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Video,
    FileText,
    Github,
    Send,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    Loader2
} from 'lucide-react';
import Link from 'next/link';
import YouTube from 'react-youtube';

interface PhasePageProps {
    params: Promise<{ id: string }>;
}

export default function PhaseDetailPage({ params }: PhasePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [phase, setPhase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [submissionType, setSubmissionType] = useState<'github' | 'file'>('github');
    const [githubUrl, setGithubUrl] = useState('');
    const [notes, setNotes] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);

    // Time tracking
    const lastBeatRef = useRef<number>(Date.now());
    const [timeSpent, setTimeSpent] = useState(0);

    useEffect(() => {
        const fetchPhaseData = async () => {
            setLoading(true);
            try {
                const { data: phaseData, error: phaseError } = await supabase
                    .from('phases')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (phaseError) throw phaseError;
                setPhase(phaseData);

                // Fetch existing submission
                const { data: subData } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('phase_id', id)
                    .eq('student_id', user?.id)
                    .single();

                if (subData) {
                    setSubmissionType(subData.submission_type);
                    setGithubUrl(subData.github_url || '');
                    setNotes(subData.notes || '');
                }

                // Fetch activity stats
                const { data: activityData } = await supabase
                    .from('student_phase_activity')
                    .select('total_time_spent_seconds')
                    .eq('phase_id', id)
                    .eq('student_id', user?.id)
                    .single();

                if (activityData) {
                    setTimeSpent(activityData.total_time_spent_seconds);
                }

            } catch (err: any) {
                console.error('Error fetching phase:', err);
                setError(err.message);
            } finally {
                setLoading(false);
            }
        };

        if (id && user) {
            fetchPhaseData();
        }
    }, [id, user]);

    // Heartbeat logic
    useEffect(() => {
        if (!phase || !user) return;

        const interval = setInterval(async () => {
            const now = Date.now();
            const diff = Math.floor((now - lastBeatRef.current) / 1000);

            if (diff >= 30) { // Heartbeat every 30 seconds
                lastBeatRef.current = now;

                try {
                    // Update activity record
                    const { data: existing } = await supabase
                        .from('student_phase_activity')
                        .select('id, total_time_spent_seconds')
                        .eq('phase_id', id)
                        .eq('student_id', user.id)
                        .single();

                    if (existing) {
                        await supabase
                            .from('student_phase_activity')
                            .update({
                                total_time_spent_seconds: existing.total_time_spent_seconds + diff,
                                last_activity_at: new Date().toISOString()
                            })
                            .eq('id', existing.id);
                        setTimeSpent(existing.total_time_spent_seconds + diff);
                    } else {
                        await supabase
                            .from('student_phase_activity')
                            .insert({
                                phase_id: id,
                                student_id: user.id,
                                total_time_spent_seconds: diff,
                                last_activity_at: new Date().toISOString()
                            });
                        setTimeSpent(diff);
                    }

                    // Also update global user time
                    const { data: userData } = await supabase
                        .from('users')
                        .select('total_time_spent_seconds')
                        .eq('id', user.id)
                        .single();

                    if (userData) {
                        await supabase
                            .from('users')
                            .update({
                                total_time_spent_seconds: (userData.total_time_spent_seconds || 0) + diff,
                                last_activity_at: new Date().toISOString()
                            })
                            .eq('id', user.id);
                    }
                } catch (err) {
                    console.error('Heartbeat error:', err);
                }
            }
        }, 10000); // Check every 10 seconds

        return () => clearInterval(interval);
    }, [phase, user, id]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;

        setSubmitting(true);
        setError(null);
        setSuccess(null);

        try {
            const { error: subError } = await supabase
                .from('submissions')
                .upsert({
                    student_id: user.id,
                    phase_id: id,
                    submission_type: submissionType,
                    github_url: submissionType === 'github' ? githubUrl : null,
                    file_url: submissionType === 'file' ? 'simulated_file_url' : null,
                    notes,
                    submitted_at: new Date().toISOString(),
                    status: 'valid'
                }, {
                    onConflict: 'student_id,phase_id'
                });

            if (subError) throw subError;

            setSuccess('Assignment submitted successfully!');

            // Log activity
            await supabase.from('activity_logs').insert({
                student_id: user.id,
                phase_id: id,
                activity_type: 'SUBMISSION_CREATED',
                payload: { type: submissionType }
            });

        } catch (err: any) {
            console.error('Submission error:', err);
            setError(err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const extractVideoId = (url: string) => {
        if (!url) return null;
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-12 w-12 text-blue-600" />
            </div>
        );
    }

    if (!phase) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Phase Not Found</h1>
                <p className="mt-2 text-gray-600">The phase you are looking for does not exist or has been removed.</p>
                <Link href="/student" className="mt-6 inline-flex items-center text-blue-600 hover:underline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    const videoId = extractVideoId(phase.youtube_url);

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
            <div className="flex items-center justify-between">
                <Link href="/student" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex items-center text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm">
                    <Clock className="h-4 w-4 mr-2 text-orange-500" />
                    <span>Time Spent: {Math.floor(timeSpent / 3600)}h {Math.floor((timeSpent % 3600) / 60)}m</span>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <div className="flex items-baseline space-x-3 mb-2">
                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md text-sm font-bold">Phase {phase.phase_number}</span>
                                <h1 className="text-2xl font-bold text-gray-900">{phase.title}</h1>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{phase.description}</p>
                        </div>

                        {videoId ? (
                            <div className="aspect-video bg-black">
                                <YouTube
                                    videoId={videoId}
                                    className="w-full h-full"
                                    opts={{
                                        width: '100%',
                                        height: '100%',
                                        playerVars: {
                                            autoplay: 0,
                                        },
                                    }}
                                />
                            </div>
                        ) : (
                            <div className="aspect-video bg-gray-100 flex items-center justify-center text-gray-400">
                                <div className="text-center">
                                    <Video className="h-12 w-12 mx-auto mb-2 opacity-20" />
                                    <p>No video available for this phase</p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
                            <FileText className="mr-2 h-5 w-5 text-blue-600" />
                            Learning Resources
                        </h2>
                        {phase.assignment_resource_url ? (
                            <a
                                href={phase.assignment_resource_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <ExternalLink className="mr-2 h-4 w-4" /> Download Assignment PDF
                            </a>
                        ) : (
                            <p className="text-gray-500 italic">No additional resources provided.</p>
                        )}
                    </div>
                </div>

                {/* Sidebar: Submission */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <Send className="mr-2 h-5 w-5 text-blue-600" />
                            Submit Assignment
                        </h2>

                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div className="space-y-3">
                                <label className="text-sm font-semibold text-gray-700 block">Submission Type</label>
                                <div className="grid grid-cols-2 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => setSubmissionType('github')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${submissionType === 'github'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <Github className="mr-2 h-4 w-4" /> GitHub
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => setSubmissionType('file')}
                                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${submissionType === 'file'
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                            }`}
                                    >
                                        <FileText className="mr-2 h-4 w-4" /> File
                                    </button>
                                </div>
                            </div>

                            {submissionType === 'github' ? (
                                <div className="space-y-2">
                                    <label htmlFor="githubUrl" className="text-sm font-semibold text-gray-700 block text-black">GitHub Repository URL</label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                                            <Github className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <input
                                            id="githubUrl"
                                            type="url"
                                            required={submissionType === 'github'}
                                            placeholder="https://github.com/user/repo"
                                            value={githubUrl}
                                            onChange={(e) => setGithubUrl(e.target.value)}
                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all"
                                        />
                                    </div>
                                </div>
                            ) : (
                                <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center">
                                    <p className="text-sm text-gray-500 italic">File upload is simulated in this version. Please provide notes instead.</p>
                                </div>
                            )}

                            <div className="space-y-2">
                                <label htmlFor="notes" className="text-sm font-semibold text-gray-700 block text-black">Notes (Optional)</label>
                                <textarea
                                    id="notes"
                                    rows={4}
                                    placeholder="Any additional information..."
                                    value={notes}
                                    onChange={(e) => setNotes(e.target.value)}
                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-black"
                                />
                            </div>

                            {error && (
                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start animate-pulse">
                                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                    {error}
                                </div>
                            )}

                            {success && (
                                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-start">
                                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                    {success}
                                </div>
                            )}

                            <button
                                type="submit"
                                disabled={submitting}
                                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                            >
                                {submitting ? (
                                    <>
                                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                        Submitting...
                                    </>
                                ) : (
                                    'Submit Assignment'
                                )}
                            </button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}

function ExternalLink(props: any) {
    return (
        <svg
            {...props}
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d="M15 3h6v6" />
            <path d="M10 14 21 3" />
            <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
        </svg>
    )
}
