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
    Loader2,
    Upload,
    X
} from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { getPhaseStatus } from '@/lib/utils';
import { isValidGitHubUrl, isValidFileSize, formatFileSize, isValidAssignmentFileType } from '@/utils/validation';

interface PhasePageProps {
    params: Promise<{ id: string }>;
}

export default function PhaseDetailPage({ params }: PhasePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();

    const [phase, setPhase] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);

    // Multiple submissions state
    const [submissions, setSubmissions] = useState<Record<number, any>>({});
    const [formData, setFormData] = useState<Record<number, {
        submissionType: 'github' | 'file';
        githubUrl: string;
        notes: string;
        selectedFile: File | null;
        existingFileUrl: string | null;
        success?: string | null;
        error?: string | null;
    }>>({});

    const [success, setSuccess] = useState<string | null>(null);
    const [isVideoStarted, setIsVideoStarted] = useState(false);

    const [timeSpent, setTimeSpent] = useState(0);
    const timeSpentRef = useRef(0);
    const [isUnlocked, setIsUnlocked] = useState(false);

    useEffect(() => {
        const fetchPhaseData = async () => {
            if (!phase) setLoading(true); // Only show spinner on initial load
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

                const { data: phaseData, error: phaseError } = await supabase
                    .from('phases')
                    .select('*')
                    .eq('id', id)
                    .single();

                if (phaseError) throw phaseError;

                // Security check: Don't allow access to upcoming or paused phases
                const status = getPhaseStatus(phaseData.start_date, phaseData.end_date, phaseData.is_paused);
                if (status === 'upcoming' || status === 'paused') {
                    router.push('/student');
                    return;
                }

                setPhase(phaseData);

                // Fetch all submissions for this phase
                const { data: subData } = await supabase
                    .from('submissions')
                    .select('*')
                    .eq('phase_id', id)
                    .eq('student_id', user?.id);

                const submissionsMap: Record<number, any> = {};
                const initialFormData: any = {};

                // Initialize form data for all required assignments
                const totalAssignments = phaseData.total_assignments || 1;
                for (let i = 1; i <= totalAssignments; i++) {
                    initialFormData[i] = {
                        submissionType: phaseData.allowed_submission_type === 'file' ? 'file' : 'github',
                        githubUrl: '',
                        notes: '',
                        selectedFile: null,
                        existingFileUrl: null
                    };
                }

                if (subData) {
                    subData.forEach(sub => {
                        const idx = sub.assignment_index || 1;
                        submissionsMap[idx] = sub;
                        initialFormData[idx] = {
                            submissionType: sub.submission_type,
                            githubUrl: sub.github_url || '',
                            notes: sub.notes || '',
                            selectedFile: null,
                            existingFileUrl: sub.file_url || null
                        };
                    });
                }

                setSubmissions(submissionsMap);
                setFormData(initialFormData);

                // Fetch activity stats
                const { data: activityData } = await supabase
                    .from('student_phase_activity')
                    .select('total_time_spent_seconds, video_completed')
                    .eq('phase_id', id)
                    .eq('student_id', user?.id)
                    .single();

                const spent = activityData?.total_time_spent_seconds || 0;
                setTimeSpent(spent);
                setVideoCompleted(activityData?.video_completed || false);

                // Fix: Stricter unlock check (Respects admin time, fallbacks to video if no time set)
                const req = phaseData.min_seconds_required || 0;
                let shouldBeUnlocked = false;

                console.log('Phase Unlock Debug:', {
                    bypass: phaseData.bypass_time_requirement,
                    timeSpent: spent,
                    req: req,
                    video: activityData?.video_completed
                });

                if (phaseData.bypass_time_requirement) {
                    shouldBeUnlocked = true;
                } else if (req > 0) {
                    shouldBeUnlocked = spent >= req;
                } else {
                    // If no time requirement set by admin, fallback to requiring video completion
                    shouldBeUnlocked = activityData?.video_completed || false;
                }

                setIsUnlocked(shouldBeUnlocked);
                if (shouldBeUnlocked) {
                    console.log('🔓 [Phase] Unlocked (spent:', spent, 'req:', req, 'video:', videoCompleted, ')');
                }
            } catch (err: any) {
                console.error('Error fetching phase:', err);
            } finally {
                setLoading(false);
            }
        };

        if (id && user?.id) {
            fetchPhaseData();
        }
    }, [id, user, router, videoCompleted, phase]);

    // 1. Live Ticking Timer (Every second)
    useEffect(() => {
        if (!phase || !user) return;

        const timer = setInterval(() => {
            setTimeSpent(prev => {
                const next = prev + 1;
                timeSpentRef.current = next;
                return next;
            });
        }, 1000);

        return () => clearInterval(timer);
    }, [phase, user]);

    // Update internal ref whenever state changes (e.g. from fetch)
    useEffect(() => {
        timeSpentRef.current = timeSpent;
    }, [timeSpent]);

    // 3. Dynamic Unlock Check (Runs every second as timer ticks)
    useEffect(() => {
        if (!phase) return;

        const req = phase.min_seconds_required || 0;
        let shouldUnlock = false;

        if (phase.bypass_time_requirement) {
            shouldUnlock = true;
        } else if (req > 0) {
            // Admin set a time limit -> Unlock if time spent >= limit
            shouldUnlock = timeSpent >= req;
        } else {
            // No time limit -> Unlock if video completed
            shouldUnlock = videoCompleted;
        }

        setIsUnlocked(prev => {
            if (prev !== shouldUnlock) {
                console.log(shouldUnlock ? '🔓 Phase Unlocked!' : '🔒 Phase Locked');
                return shouldUnlock;
            }
            return prev;
        });
    }, [timeSpent, phase, videoCompleted]);

    // 2. Heartbeat logic (Sync with DB every 30 seconds)
    useEffect(() => {
        if (!phase || !user) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                const currentSeconds = timeSpentRef.current;

                // Update activity record in DB
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
                            total_time_spent_seconds: currentSeconds,
                            last_activity_at: new Date().toISOString()
                        })
                        .eq('id', existing.id);
                } else {
                    await supabase
                        .from('student_phase_activity')
                        .insert({
                            phase_id: id,
                            student_id: user.id,
                            total_time_spent_seconds: currentSeconds,
                            last_activity_at: new Date().toISOString()
                        });
                }

                // Periodic check for auto-unlock
                const reqSeconds = phase.min_seconds_required || 0;
                let meetsCondition = false;

                if (reqSeconds > 0) {
                    meetsCondition = currentSeconds >= reqSeconds;
                } else {
                    // Fallback to video completion if no time requirement
                    meetsCondition = videoCompleted;
                }

                if (meetsCondition) {
                    setIsUnlocked(prev => {
                        if (!prev) {
                            setSuccess('Congratulations! You have spent enough time to unlock the assignment submission.');
                            return true;
                        }
                        return true;
                    });
                }

            } catch (err) {
                console.error('Heartbeat error:', err);
            }
        }, 30000); // 30 second sync

        return () => clearInterval(heartbeatInterval);
    }, [phase, user, id, isVideoStarted, videoCompleted]); // Added isVideoStarted and videoCompleted to catch state changes!

    // Video end handler removed (unused)

    const handleDownloadAssignment = async (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`Download failed with status: ${response.status}`);
            }

            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('text/html')) {
                throw new Error('Download failed: The server returned an HTML page instead of a file.');
            }

            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;

            // Extract filename from URL or use a default
            const filename = url.split('/').pop() || 'assignment.pdf';
            link.download = filename;

            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);

            console.log('✅ Direct download triggered for:', filename);
        } catch (err) {
            console.error('Download error:', err);
            // Fallback to opening in new tab
            window.open(url, '_blank');
        }
    };

    const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, index: number) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!isValidAssignmentFileType(file)) {
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: 'Invalid file type. Please upload PDF, JPG, or PNG files only.' }
            }));
            return;
        }

        if (!isValidFileSize(file, 2)) {
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: `File size must be less than 2MB. Current size: ${formatFileSize(file.size)}` }
            }));
            return;
        }

        setFormData(prev => ({
            ...prev,
            [index]: { ...prev[index], selectedFile: file, error: null }
        }));
    };

    const handleRemoveFile = (index: number) => {
        setFormData(prev => ({
            ...prev,
            [index]: { ...prev[index], selectedFile: null, existingFileUrl: null }
        }));
    };

    const handleFileUpload = async (index: number) => {
        const data = formData[index];
        if (!data?.selectedFile || !user) return null;

        setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: null } }));

        try {
            const fileExt = data.selectedFile.name.split('.').pop();
            // Use index in filename to avoid clashes
            const fileName = `${user.id}/${id}/submission_${index}.${fileExt}`;
            const filePath = `${fileName}`;

            const { error: uploadError } = await supabase.storage
                .from('student-submissions')
                .upload(filePath, data.selectedFile, {
                    cacheControl: '3600',
                    upsert: true
                });

            if (uploadError) throw uploadError;

            const { data: { publicUrl } } = supabase.storage
                .from('student-submissions')
                .getPublicUrl(filePath);

            return `${publicUrl}?t=${Date.now()}`;
        } catch (error: any) {
            console.error('Error uploading file:', error);
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: 'Failed to upload file: ' + error.message }
            }));
            return null;
        }
    };

    const handleSubmit = async (e: React.FormEvent, index: number) => {
        e.preventDefault();
        if (!user) return;

        if (!isUnlocked) {
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: 'Please complete the video lecture before submitting your assignment.' }
            }));
            return;
        }

        const data = formData[index];
        setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: null, success: null } }));

        // Validation
        let finalFileUrl = data.existingFileUrl;

        if (data.submissionType === 'github') {
            if (!data.githubUrl || !isValidGitHubUrl(data.githubUrl)) {
                setFormData(prev => ({
                    ...prev,
                    [index]: { ...prev[index], error: 'Please enter a valid GitHub repository URL (e.g., https://github.com/username/repo)' }
                }));
                return;
            }
        } else if (data.submissionType === 'file') {
            if (!data.selectedFile && !data.existingFileUrl) {
                setFormData(prev => ({
                    ...prev,
                    [index]: { ...prev[index], error: 'Please select a file to upload.' }
                }));
                return;
            }
        }

        setSubmittingIndex(index);

        try {
            // Upload file if needed
            if (data.submissionType === 'file' && data.selectedFile) {
                const uploadedUrl = await handleFileUpload(index);
                if (!uploadedUrl) {
                    setSubmittingIndex(null);
                    return;
                }
                finalFileUrl = uploadedUrl;
            }

            const { error: subError } = await supabase
                .from('submissions')
                .upsert({
                    student_id: user.id,
                    phase_id: id,
                    assignment_index: index,
                    submission_type: data.submissionType,
                    github_url: data.submissionType === 'github' ? data.githubUrl : null,
                    file_url: data.submissionType === 'file' ? finalFileUrl : null,
                    notes: data.notes,
                    submitted_at: new Date().toISOString(),
                    status: 'valid'
                }, {
                    onConflict: 'student_id,phase_id,assignment_index'
                });

            if (subError) throw subError;

            setFormData(prev => ({
                ...prev,
                [index]: {
                    ...prev[index],
                    success: 'Assignment submitted successfully!',
                    existingFileUrl: finalFileUrl || prev[index].existingFileUrl,
                    selectedFile: null
                }
            }));

            // Register completion in local submissions state
            setSubmissions(prev => ({
                ...prev,
                [index]: {
                    ...prev[index],
                    submitted_at: new Date().toISOString() // Mock for UI
                }
            }));

            // Log activity
            await supabase.from('activity_logs').insert({
                student_id: user.id,
                phase_id: id,
                activity_type: 'SUBMISSION_CREATED',
                payload: { type: data.submissionType, index }
            });

        } catch (err: any) {
            console.error('Submission error:', err);
            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], error: err.message }
            }));
        } finally {
            setSubmittingIndex(null);
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

    if (phase.is_paused) {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <Clock className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Phase Paused</h1>
                <p className="mt-2 text-gray-600">This phase has been temporarily paused by the instructor. Please check back later.</p>
                <Link href="/student" className="mt-6 inline-flex items-center text-blue-600 hover:underline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    const status = getPhaseStatus(phase.start_date, phase.end_date, phase.is_paused);

    if (status === 'upcoming') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <Clock className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Phase Not Started</h1>
                <p className="mt-2 text-gray-600">This phase is scheduled to start on {new Date(phase.start_date).toLocaleDateString()}. Please check back then!</p>
                <Link href="/student" className="mt-6 inline-flex items-center text-blue-600 hover:underline">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
            </div>
        );
    }

    if (status === 'ended') {
        return (
            <div className="max-w-4xl mx-auto px-4 py-12 text-center">
                <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                <h1 className="text-2xl font-bold text-gray-900">Phase Ended</h1>
                <p className="mt-2 text-gray-600">The deadline for this phase has passed. You can no longer access this assignment.</p>
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
                <div className="flex items-center space-x-4">
                    {isUnlocked && (
                        <div className="flex items-center text-xs font-bold text-green-600 bg-green-50 px-3 py-1 rounded-full border border-green-100">
                            <CheckCircle2 className="h-3 w-3 mr-1" />
                            Assignment Unlocked
                        </div>
                    )}
                    <div className="flex items-center text-sm text-gray-500 bg-white px-3 py-1 rounded-full border border-gray-100 shadow-sm font-mono">
                        <Clock className="h-4 w-4 mr-2 text-orange-500" />
                        <span>
                            Time Spent: {Math.floor(timeSpent / 3600)}h {Math.floor((timeSpent % 3600) / 60)}m {timeSpent % 60}s
                        </span>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-black">
                {/* Main Content */}
                <div className="lg:col-span-2 space-y-8">
                    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                        <div className="p-6 border-b border-gray-50">
                            <div className="flex items-baseline space-x-3 mb-2">
                                <span className="bg-blue-100 text-blue-700 px-2.5 py-0.5 rounded-md text-sm font-bold">Phase {phase.phase_number}</span>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center">
                                    {phase.title}
                                    {!phase.is_mandatory && (
                                        <span className="ml-3 px-2 py-1 text-xs font-bold bg-gray-100 text-gray-500 rounded-lg uppercase tracking-wider">
                                            Optional
                                        </span>
                                    )}
                                    <span className="ml-3 px-2.5 py-1 text-xs font-bold bg-orange-100 text-orange-700 rounded-lg uppercase tracking-wider border border-orange-200">
                                        Deadline: {new Date(phase.end_date).toLocaleDateString()}
                                    </span>
                                </h1>
                            </div>
                            <p className="text-gray-600 leading-relaxed">{phase.description}</p>
                        </div>

                        {videoId ? (
                            <div className="aspect-video bg-black relative">
                                {!isVideoStarted ? (
                                    <div
                                        className="absolute inset-0 z-10 cursor-pointer group"
                                        onClick={() => setIsVideoStarted(true)}
                                    >
                                        <Image
                                            src={`https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`}
                                            alt="Video Thumbnail"
                                            fill
                                            className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                            unoptimized
                                        />
                                        <div className="absolute inset-0 flex items-center justify-center">
                                            <div className="w-20 h-14 bg-red-600 rounded-xl flex items-center justify-center group-hover:bg-red-700 transition-colors shadow-xl">
                                                <div className="w-0 h-0 border-y-[10px] border-y-transparent border-l-[18px] border-l-white ml-1"></div>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <iframe
                                        width="100%"
                                        height="100%"
                                        src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0`}
                                        frameBorder="0"
                                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                        allowFullScreen
                                        className="w-full h-full"
                                    ></iframe>
                                )}
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
                        {phase.assignment_file_url ? (
                            <button
                                onClick={(e) => handleDownloadAssignment(e, phase.assignment_file_url)}
                                className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <FileText className="mr-2 h-4 w-4" /> Download Assignment Document
                            </button>
                        ) : phase.assignment_resource_url ? (
                            <button
                                onClick={(e) => handleDownloadAssignment(e, phase.assignment_resource_url)}
                                className="inline-flex items-center px-4 py-2 bg-gray-50 text-gray-700 rounded-lg hover:bg-gray-100 transition-colors border border-gray-200"
                            >
                                <FileText className="mr-2 h-4 w-4" /> Download Assignment PDF
                            </button>
                        ) : (
                            <p className="text-gray-500 italic">No additional resources provided.</p>
                        )}
                    </div>
                </div>

                {/* Sidebar: Submission */}
                <div className="space-y-8">
                    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 sticky top-24 max-h-[85vh] overflow-y-auto">
                        <h2 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                            <Send className="mr-2 h-5 w-5 text-blue-600" />
                            Submit Assignments
                        </h2>

                        {!isUnlocked && phase?.min_seconds_required > 0 && (
                            <div className="mb-6 p-4 bg-orange-50 border border-orange-100 rounded-xl flex items-start">
                                <AlertCircle className="h-5 w-5 text-orange-600 mr-3 shrink-0 mt-0.5" />
                                <p className="text-sm text-orange-800">
                                    <strong>Video Required:</strong> Please complete the video lecture before submitting your assignments.
                                </p>
                            </div>
                        )}

                        {success && (
                            <div className="mb-6 p-4 bg-green-50 border border-green-100 rounded-xl flex items-start">
                                <CheckCircle2 className="h-5 w-5 text-green-600 mr-3 shrink-0 mt-0.5" />
                                <p className="text-sm text-green-800">{success}</p>
                            </div>
                        )}

                        <div className="space-y-12">
                            {Array.from({ length: phase.total_assignments || 1 }, (_, i) => i + 1).map((idx) => {
                                const data = formData[idx] || {
                                    submissionType: 'github',
                                    githubUrl: '',
                                    notes: '',
                                    selectedFile: null,
                                    existingFileUrl: null
                                };
                                const isSubmitted = !!submissions[idx];

                                return (
                                    <div key={idx} className={`space-y-6 pb-8 ${idx < (phase.total_assignments || 1) ? 'border-b border-gray-100' : ''}`}>
                                        <div className="flex items-center justify-between">
                                            <h3 className="text-md font-bold text-gray-800 flex items-center">
                                                Assignment #{idx}
                                                {isSubmitted && (
                                                    <span className="ml-2 flex items-center text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded-full uppercase tracking-wider font-extrabold">
                                                        <CheckCircle2 className="h-2 w-2 mr-1" />
                                                        Completed
                                                    </span>
                                                )}
                                            </h3>
                                        </div>

                                        <form onSubmit={(e) => handleSubmit(e, idx)} className="space-y-6">
                                            {phase.allowed_submission_type === 'both' && (
                                                <div className="space-y-3">
                                                    <label className="text-sm font-semibold text-gray-700 block">Submission Type</label>
                                                    <div className="grid grid-cols-2 gap-2">
                                                        <button
                                                            type="button"
                                                            disabled={!isUnlocked}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                [idx]: { ...prev[idx], submissionType: 'github' }
                                                            }))}
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${data.submissionType === 'github'
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            <Github className="mr-2 h-4 w-4" /> GitHub
                                                        </button>
                                                        <button
                                                            type="button"
                                                            disabled={!isUnlocked}
                                                            onClick={() => setFormData(prev => ({
                                                                ...prev,
                                                                [idx]: { ...prev[idx], submissionType: 'file' }
                                                            }))}
                                                            className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all flex items-center justify-center ${data.submissionType === 'file'
                                                                ? 'bg-blue-600 text-white border-blue-600 shadow-md'
                                                                : 'bg-white text-gray-600 border-gray-200 hover:border-blue-300'
                                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                                        >
                                                            <FileText className="mr-2 h-4 w-4" /> File
                                                        </button>
                                                    </div>
                                                </div>
                                            )}

                                            {data.submissionType === 'github' ? (
                                                <div className="space-y-2">
                                                    <label htmlFor={`githubUrl-${idx}`} className="text-sm font-semibold text-gray-700 block text-black">GitHub Repository URL</label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-black">
                                                            <Github className="h-4 w-4 text-gray-400" />
                                                        </div>
                                                        <input
                                                            id={`githubUrl-${idx}`}
                                                            type="url"
                                                            disabled={!isUnlocked}
                                                            required={data.submissionType === 'github'}
                                                            placeholder="https://github.com/user/repo"
                                                            value={data.githubUrl}
                                                            onChange={(e) => setFormData(prev => ({
                                                                ...prev,
                                                                [idx]: { ...prev[idx], githubUrl: e.target.value }
                                                            }))}
                                                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all disabled:bg-gray-50 disabled:text-gray-400"
                                                        />
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="space-y-2">
                                                    <label className="text-sm font-semibold text-gray-700 block">Upload File</label>
                                                    {data.selectedFile || data.existingFileUrl ? (
                                                        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
                                                            <div className="flex items-center justify-between">
                                                                <div className="flex items-center overflow-hidden">
                                                                    <FileText className="h-5 w-5 text-blue-500 mr-2 shrink-0" />
                                                                    <div className="truncate">
                                                                        <p className="text-sm font-medium text-gray-900 truncate">
                                                                            {data.selectedFile ? data.selectedFile.name : 'Submitted File'}
                                                                        </p>
                                                                        {data.selectedFile && (
                                                                            <p className="text-xs text-gray-500">{formatFileSize(data.selectedFile.size)}</p>
                                                                        )}
                                                                        {!data.selectedFile && data.existingFileUrl && (
                                                                            <button
                                                                                type="button"
                                                                                onClick={(e) => handleDownloadAssignment(e, data.existingFileUrl!)}
                                                                                className="text-xs text-blue-600 hover:underline bg-transparent border-0 p-0 cursor-pointer"
                                                                            >
                                                                                View Submitted
                                                                            </button>
                                                                        )}
                                                                    </div>
                                                                </div>
                                                                {isUnlocked && (
                                                                    <button
                                                                        type="button"
                                                                        onClick={() => handleRemoveFile(idx)}
                                                                        className="ml-2 p-1 text-gray-400 hover:text-red-500"
                                                                    >
                                                                        <X className="h-4 w-4" />
                                                                    </button>
                                                                )}
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors bg-gray-50">
                                                            <input
                                                                type="file"
                                                                id={`file-upload-${idx}`}
                                                                className="hidden"
                                                                accept=".pdf,image/png,image/jpeg,image/jpg"
                                                                onChange={(e) => handleFileSelect(e, idx)}
                                                                disabled={!isUnlocked}
                                                            />
                                                            <label htmlFor={`file-upload-${idx}`} className={`cursor-pointer flex flex-col items-center ${!isUnlocked ? 'pointer-events-none opacity-50' : ''}`}>
                                                                <Upload className="h-8 w-8 text-gray-400 mb-2" />
                                                                <span className="text-sm font-medium text-gray-700">Click to upload</span>
                                                                <span className="text-xs text-gray-500 mt-1">PDF, PNG, JPG (max 2MB)</span>
                                                            </label>
                                                        </div>
                                                    )}
                                                </div>
                                            )}

                                            <div className="space-y-2">
                                                <label htmlFor={`notes-${idx}`} className="text-sm font-semibold text-gray-700 block text-black">Notes (Optional)</label>
                                                <textarea
                                                    id={`notes-${idx}`}
                                                    rows={3}
                                                    disabled={!isUnlocked}
                                                    placeholder="Any additional information..."
                                                    value={data.notes}
                                                    onChange={(e) => setFormData(prev => ({
                                                        ...prev,
                                                        [idx]: { ...prev[idx], notes: e.target.value }
                                                    }))}
                                                    className="block w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all resize-none text-black disabled:bg-gray-50 disabled:text-gray-400"
                                                />
                                            </div>

                                            {data.error && (
                                                <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg flex items-start animate-pulse">
                                                    <AlertCircle className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                                    {data.error}
                                                </div>
                                            )}

                                            {data.success && (
                                                <div className="p-3 bg-green-50 text-green-700 text-sm rounded-lg flex items-start">
                                                    <CheckCircle2 className="h-4 w-4 mr-2 mt-0.5 shrink-0" />
                                                    {data.success}
                                                </div>
                                            )}

                                            <button
                                                type="submit"
                                                disabled={submittingIndex === idx || !isUnlocked}
                                                className="w-full bg-blue-600 text-white font-bold py-3 px-4 rounded-xl hover:bg-blue-700 transition-all shadow-lg shadow-blue-200 disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center"
                                            >
                                                {submittingIndex === idx ? (
                                                    <>
                                                        <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                                        Submitting...
                                                    </>
                                                ) : (
                                                    isSubmitted ? 'Update Assignment' : 'Submit Assignment'
                                                )}
                                            </button>
                                        </form>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}


