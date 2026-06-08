'use client';

import { useState, useEffect, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import {
    Video,
    FileText,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Github,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Send,
    Clock,
    AlertCircle,
    CheckCircle2,
    ArrowLeft,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Loader2,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Upload,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    X,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Trophy,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Target,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Zap,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Shield,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    MessageSquare,
    ChevronDown,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    Lock
} from 'lucide-react';
import Link from 'next/link';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { getPhaseStatus, cn } from '@/lib/utils';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { isValidGitHubUrl, isValidFileSize, formatFileSize, isValidAssignmentFileType } from '@/utils/validation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import PremiumPlayer from '@/components/PremiumPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import ExpandableText from '@/components/ui/ExpandableText';
import PhasePathSelector from './components/PhasePathSelector';
import SubmissionPortal from './components/SubmissionPortal';

interface PhasePageProps {
    params: Promise<{ id: string }>;
}

export default function PhaseDetailPage({ params }: PhasePageProps) {
    const { id } = use(params);
    const router = useRouter();
    const { user } = useAuth();
    const queryClient = useQueryClient();

    // --- State Variables ---
    const [timeSpent, setTimeSpent] = useState(0);
    const timeSpentRef = useRef(0);
    const [videoCompleted, setVideoCompleted] = useState(false);
    const [isUnlocked, setIsUnlocked] = useState(false);
    const [submittingIndex, setSubmittingIndex] = useState<number | null>(null);
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [success, setSuccess] = useState<string | null>(null);
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [isVideoStarted, setIsVideoStarted] = useState(false);
    const [selectedOptionId, setSelectedOptionId] = useState<string | null>(null);
    const [isSelectingOption, setIsSelectingOption] = useState(false);

    // --- Data Fetching (React Query) ---

    // 1. Fetch Phase Data
    const { data: phase, isLoading: phaseLoading } = useQuery({
        queryKey: ['phase', id, user?.id],
        queryFn: async () => {
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { data: isRevoked } = await supabase.rpc('check_and_revoke_self');
            // If the user is revoked, we STILL want them to be able to fetch the phase
            // because they need to complete it to restore their access.
            // The dashboard/layout blocks them from accessing other things.

            const { data, error } = await supabase
                .from('phases')
                .select('id, phase_number, title, description, youtube_url, assignment_file_url, assignment_resource_url, allowed_submission_type, start_date, end_date, is_paused, bypass_time_requirement, min_seconds_required, total_assignments, has_multiple_options, options')
                .eq('id', id)
                .single();

            if (error) throw error;

            // Fetch the most recent active extension for this student across ALL phases
            // Extensions are student-wide: today + N days grants access to submit any phase
            const { data: extRows } = await supabase
                .from('phase_extensions')
                .select('extended_deadline')
                .eq('student_id', user?.id)
                .order('extended_deadline', { ascending: false })
                .limit(1);

            const phaseData = data as any;
            if (extRows && extRows.length > 0) {
                const latestDeadline = extRows[0].extended_deadline;
                // Only apply extension if it's still in the future
                if (new Date(latestDeadline) > new Date()) {
                    phaseData.extended_deadline = latestDeadline;
                }
            }

            const status = getPhaseStatus(data.start_date, data.end_date, data.is_paused);
            if (status === 'upcoming' || status === 'paused') {
                router.push('/student');
                return null;
            }
            return phaseData;
        },
        enabled: !!id && !!user,
        staleTime: 0,
        refetchOnMount: 'always',
    });

    // 2. Fetch Submissions
    const { data: submissionsData } = useQuery({
        queryKey: ['submissions', id, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('submissions')
                .select('*')
                .eq('phase_id', id)
                .eq('student_id', user?.id);
            return data || [];
        },
        enabled: !!id && !!user,
    });

    // 3. Fetch Activity Stats
    const { data: activityData } = useQuery({
        queryKey: ['activity', id, user?.id],
        queryFn: async () => {
            const { data } = await supabase
                .from('student_phase_activity')
                .select('total_time_spent_seconds, video_watched_seconds, video_completed, selected_option_id')
                .eq('phase_id', id)
                .eq('student_id', user?.id)
                .maybeSingle();
            return data;
        },
        enabled: !!id && !!user,
    });

    // --- Sync Query Data to State ---
    useEffect(() => {
        if (activityData) {
            setTimeSpent(activityData.total_time_spent_seconds || 0);
            timeSpentRef.current = activityData.total_time_spent_seconds || 0;
            setVideoCompleted(activityData.video_completed || false);
            setSelectedOptionId(activityData.selected_option_id || null);
        }
    }, [activityData]);

    useEffect(() => {
        if (phase && submissionsData) {
            // Wait for selection if multiple options present
            if (phase.has_multiple_options && !selectedOptionId) return;

            const submissionsMap: Record<number, any> = {};
            const initialFormData: any = {};

            const totalAssignments = phase.has_multiple_options ? 1 : (phase.total_assignments || 1);
            const selectedOption = phase.has_multiple_options 
                ? phase.options?.find((o: any) => o.id === selectedOptionId)
                : null;
            const currentAllowedType = phase.has_multiple_options 
                ? selectedOption?.allowed_submission_type || phase.allowed_submission_type
                : phase.allowed_submission_type;

            submissionsData.forEach((sub: any) => {
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

            for (let i = 1; i <= totalAssignments; i++) {
                if (!initialFormData[i]) {
                    initialFormData[i] = {
                        submissionType: currentAllowedType === 'file' ? 'file' : 'github',
                        githubUrl: '',
                        notes: '',
                        selectedFile: null,
                        existingFileUrl: null
                    };
                }
            }

            setSubmissions(submissionsMap);
            setFormData(initialFormData);
        }
    }, [phase, submissionsData, selectedOptionId]);

    // --- Core Logic Hooks ---

    // Timer logic
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

    // Unlock logic
    useEffect(() => {
        if (!phase) return;
        const req = phase.min_seconds_required || 0;
        let shouldUnlock = false;

        if (phase.bypass_time_requirement) {
            shouldUnlock = true;
        } else if (req > 0) {
            shouldUnlock = timeSpent >= req;
        } else {
            shouldUnlock = videoCompleted;
        }

        setIsUnlocked(shouldUnlock);
    }, [timeSpent, phase, videoCompleted]);

    // Heartbeat sync
    useEffect(() => {
        if (!phase || !user) return;

        const heartbeatInterval = setInterval(async () => {
            try {
                const currentSeconds = timeSpentRef.current;
                const { data: existing } = await supabase
                    .from('student_phase_activity')
                    .select('id')
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
            } catch (err) {
                console.error('Heartbeat error:', err);
            }
        }, 30000);

        return () => clearInterval(heartbeatInterval);
    }, [phase, user, id]);

    // --- Derived State ---
    const isPastDeadline = phase ? (() => {
        const now = new Date();
        const deadline = phase.extended_deadline
            ? new Date(phase.extended_deadline)
            : (() => {
                const d = new Date(phase.end_date);
                d.setHours(23, 59, 59, 999);
                return d;
            })();
            
        // Allow a 30-day grace period after the deadline for revoked students to recover access
        const graceDeadline = new Date(deadline);
        graceDeadline.setDate(graceDeadline.getDate() + 30);
        return now > graceDeadline;
    })() : false;

    // --- Handlers ---

    const handleDownloadAssignment = async (e: React.MouseEvent, url: string) => {
        e.preventDefault();
        try {
            const response = await fetch(url);
            if (!response.ok) throw new Error(`Download failed with status: ${response.status}`);
            const blob = await response.blob();
            const blobUrl = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = blobUrl;
            const filename = url.split('/').pop() || 'assignment.pdf';
            link.download = filename;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (err) {
            console.error('Download error:', err);
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
                [index]: { ...prev[index], error: `File size must be less than 2MB.` }
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

        try {
            const fileExt = data.selectedFile.name.split('.').pop();
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
        if (!user || !isUnlocked || isPastDeadline) return;

        const data = formData[index];
        setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: null, success: null } }));

        let finalFileUrl = data.existingFileUrl;

        if (data.submissionType === 'github') {
            if (!data.githubUrl || !isValidGitHubUrl(data.githubUrl)) {
                setFormData(prev => ({
                    ...prev,
                    [index]: { ...prev[index], error: 'Please enter a valid GitHub repository URL' }
                }));
                return;
            }
        } else if (data.submissionType === 'file') {
            if (!data.selectedFile && !data.existingFileUrl) {
                setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: 'Please select a file' } }));
                return;
            }
        }

        setSubmittingIndex(index);

        try {
            if (data.submissionType === 'file' && data.selectedFile) {
                const uploadedUrl = await handleFileUpload(index);
                if (!uploadedUrl) {
                    setSubmittingIndex(null);
                    return;
                }
                finalFileUrl = uploadedUrl;
            }

            // OPTIMISTIC UPDATE: Update UI immediately
            const previousSubmissions = { ...submissions };
            const previousFormData = { ...formData };
            const optimisticTimestamp = new Date().toISOString();

            setSubmissions(prev => ({
                ...prev,
                [index]: {
                    submitted_at: optimisticTimestamp,
                    status: 'valid' // Assume valid for now
                }
            }));

            setFormData(prev => ({
                ...prev,
                [index]: {
                    ...prev[index],
                    success: 'Syncing...', // Better than 'Success' immediately
                    existingFileUrl: finalFileUrl || prev[index].existingFileUrl,
                    selectedFile: null
                }
            }));

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
                    submitted_at: optimisticTimestamp,
                    status: 'valid'
                }, {
                    onConflict: 'student_id,phase_id,assignment_index'
                });

            if (subError) {
                // REVERT on error
                setSubmissions(previousSubmissions);
                setFormData(previousFormData);
                throw subError;
            }

            setFormData(prev => ({
                ...prev,
                [index]: { ...prev[index], success: 'Verified & Committed!' }
            }));

            // Silent refresh in background
            queryClient.invalidateQueries({ queryKey: ['submissions', id] });

        } catch (err: any) {
            console.error('Submission error:', err);
            setFormData(prev => ({ ...prev, [index]: { ...prev[index], error: err.message } }));
        } finally {
            setSubmittingIndex(null);
        }
    };

    // Removed extractVideoId as PremiumPlayer now accepts url directly
    const handleSelectOption = async (optionId: string) => {
        if (!user || !id) return;
        setIsSelectingOption(true);
        try {
            const { data: existing } = await supabase
                .from('student_phase_activity')
                .select('id')
                .eq('phase_id', id)
                .eq('student_id', user.id)
                .maybeSingle();

            if (existing) {
                await supabase
                    .from('student_phase_activity')
                    .update({ selected_option_id: optionId })
                    .eq('id', existing.id);
            } else {
                await supabase
                    .from('student_phase_activity')
                    .insert({
                        phase_id: id,
                        student_id: user.id,
                        selected_option_id: optionId,
                        total_time_spent_seconds: 0,
                        video_watched_seconds: 0
                    });
            }
            setSelectedOptionId(optionId);
            queryClient.invalidateQueries({ queryKey: ['activity', id, user.id] });
        } catch (err) {
            console.error('Error selecting option:', err);
        } finally {
            setIsSelectingOption(false);
        }
    };

    // --- Render Helpers ---

    if (phaseLoading) {
        return (
            <div className="flex flex-col justify-center items-center min-h-[80vh]">
                <div className="relative">
                    <div className="h-16 w-16 rounded-full border-4 border-indigo-100 border-t-indigo-600 animate-spin" />
                </div>
                <p className="mt-6 text-xs font-black text-slate-400 uppercase tracking-widest animate-pulse">Initializing Specialized Content...</p>
            </div>
        );
    }

    if (!phase) {
        return (
            <div className="max-w-4xl mx-auto px-6 py-24 text-center">
                <div className="bg-red-50 dark:bg-red-950/20 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-6">
                    <AlertCircle className="h-8 w-8 text-red-600" />
                </div>
                <h1 className="text-3xl font-black tracking-tight mb-4">Module Unavailable</h1>
                <p className="text-slate-500 mb-8">The requested learning phase could not be found or access has been restricted.</p>
                <Link href="/student" className="inline-flex items-center px-6 py-3 bg-indigo-600 text-white rounded-2xl font-bold transition-all hover:scale-105 active:scale-95 shadow-lg shadow-indigo-600/20">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Return to Command Center
                </Link>
            </div>
        );
    }

    const selectedOption = phase.has_multiple_options 
        ? phase.options?.find((o: any) => o.id === selectedOptionId)
        : null;

    const currentYoutubeUrl = phase.has_multiple_options ? selectedOption?.youtube_url : phase.youtube_url;
    const currentAssignmentFileUrl = phase.has_multiple_options ? selectedOption?.assignment_file_url : phase.assignment_file_url;
    const currentAssignmentResourceUrl = phase.has_multiple_options ? selectedOption?.assignment_resource_url : phase.assignment_resource_url;
    const currentAllowedType = phase.has_multiple_options ? selectedOption?.allowed_submission_type || phase.allowed_submission_type : phase.allowed_submission_type;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const totalAssignments = phase.has_multiple_options ? 1 : (phase.total_assignments || 1);

    if (phase.has_multiple_options && !selectedOptionId) {
        return (
            <PhasePathSelector 
                phase={phase} 
                isSelectingOption={isSelectingOption} 
                onSelectOption={handleSelectOption} 
            />
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-6 py-8 space-y-10 font-sans text-foreground">
            {/* Action Bar */}
            <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-card-border">
                <Link href="/student" className="inline-flex items-center gap-2 group text-muted hover:text-primary transition-colors">
                    <div className="p-2 bg-card rounded-xl border border-card-border shadow-sm group-hover:border-primary/20 transition-all">
                        <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
                    </div>
                    <span className="text-sm font-bold tracking-tight">Return to Dashboard</span>
                </Link>
                <div className="flex items-center gap-4">
                    <AnimatePresence>
                        {isUnlocked && (
                            <motion.div
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-emerald-600 bg-emerald-500/10 px-4 py-2 rounded-xl border border-emerald-500/20"
                            >
                                <CheckCircle2 className="h-3.5 w-3.5" />
                                Submissions Unlocked
                            </motion.div>
                        )}
                    </AnimatePresence>
                    <div className="flex items-center gap-3 bg-card px-4 py-2 rounded-xl border border-card-border shadow-sm font-bold text-xs text-foreground">
                        <Clock className="h-4 w-4 text-primary" />
                        <span className="tabular-nums">
                            {Math.floor(timeSpent / 3600)}h {Math.floor((timeSpent % 3600) / 60)}m {timeSpent % 60}s
                        </span>
                    </div>
                </div>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Content Stream */}
                <div className="lg:col-span-8 space-y-10">
                    <div className="bg-card rounded-[2.5rem] shadow-sm border border-card-border overflow-hidden">
                        <div className="p-8 md:p-10">
                            <div className="flex items-center gap-3 mb-6">
                                <span className="bg-primary/10 text-primary px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-primary/20">Phase {phase.phase_number}</span>
                                <div className="h-1 w-1 rounded-full bg-card-border" />
                                {phase.extended_deadline ? (
                                    <span className="text-xs font-bold text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)]">
                                        Extended Deadline: {new Date(phase.extended_deadline).toLocaleDateString()}
                                    </span>
                                ) : (
                                    <span className="text-xs font-bold text-muted">Deadline: {new Date(phase.end_date).toLocaleDateString()}</span>
                                )}
                            </div>
                            <h1 className="text-3xl md:text-4xl font-black tracking-tight mb-4 text-foreground">{phase.title}</h1>
                            <ExpandableText text={phase.description} maxLength={150} className="text-muted leading-relaxed text-lg" />
                        </div>

                        {currentYoutubeUrl ? (
                            <div className="p-2 md:p-4 bg-slate-50 dark:bg-slate-950 border-t border-slate-200 dark:border-slate-800">
                                <PremiumPlayer url={currentYoutubeUrl} phaseId={id} studentId={user?.id || ''} initialProgress={activityData?.video_watched_seconds || 0} />
                            </div>
                        ) : (
                            <div className="aspect-video bg-slate-100 dark:bg-slate-900 flex flex-col items-center justify-center text-slate-400 border-t border-slate-200 dark:border-slate-800">
                                <Video className="h-12 w-12 mb-4 opacity-20" />
                                <p className="font-bold text-sm uppercase tracking-widest">No Stream Available</p>
                            </div>
                        )}
                    </div>

                    {/* Resources */}
                    <div className="bg-card p-8 md:p-10 rounded-[2.5rem] shadow-sm border border-card-border">
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-xl font-bold flex items-center gap-3 text-foreground">
                                <FileText className="w-5 h-5 text-primary" />
                                Engineering Resources
                            </h2>
                        </div>
                        {phase.assignment_file_url || phase.assignment_resource_url || currentAssignmentFileUrl || currentAssignmentResourceUrl ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <button
                                    onClick={(e) => handleDownloadAssignment(e, currentAssignmentFileUrl || currentAssignmentResourceUrl || '')}
                                    className="flex items-center justify-between p-5 bg-slate-50 dark:bg-slate-800/50 hover:bg-white dark:hover:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-800 transition-all group"
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="p-3 bg-white dark:bg-slate-900 rounded-xl shadow-sm group-hover:scale-110 transition-transform">
                                            <FileText className="h-5 w-5 text-indigo-600" />
                                        </div>
                                        <div className="text-left">
                                            <p className="text-sm font-bold">Assignment Specification</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">PDF Document</p>
                                        </div>
                                    </div>
                                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                                </button>
                            </div>
                        ) : (
                            <div className="text-center py-10 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
                                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">No additional resources found</p>
                            </div>
                        )}
                    </div>
                </div>

                {/* Submission Sidebar */}
                <SubmissionPortal 
                    phase={phase}
                    isUnlocked={isUnlocked}
                    isPastDeadline={isPastDeadline}
                    formData={formData}
                    setFormData={setFormData}
                    submissions={submissions}
                    currentAllowedType={currentAllowedType}
                    handleFileSelect={handleFileSelect}
                    handleRemoveFile={handleRemoveFile}
                    handleSubmit={handleSubmit}
                    submittingIndex={submittingIndex}
                />
            </div>
        </div>
    );
}
