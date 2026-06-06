'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Send, Lock, AlertCircle, FileText, X, Upload, Github, CheckCircle2, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SubmissionPortalProps {
    phase: any;
    isUnlocked: boolean;
    isPastDeadline: boolean;
    formData: any;
    setFormData: any;
    submissions: any;
    currentAllowedType: string;
    handleFileSelect: (e: React.ChangeEvent<HTMLInputElement>, index: number) => void;
    handleRemoveFile: (index: number) => void;
    handleSubmit: (e: React.FormEvent, index: number) => void;
    submittingIndex: number | null;
}

export default function SubmissionPortal({
    phase,
    isUnlocked,
    isPastDeadline,
    formData,
    setFormData,
    submissions,
    currentAllowedType,
    handleFileSelect,
    handleRemoveFile,
    handleSubmit,
    submittingIndex
}: SubmissionPortalProps) {
    return (
        <div className="lg:col-span-4 space-y-8">
            <aside className="bg-card p-8 rounded-[2.5rem] shadow-sm border border-card-border sticky top-24 max-h-[calc(100vh-120px)] overflow-y-auto custom-scrollbar">
                <div className="flex items-center gap-3 mb-8">
                    <div className="bg-primary p-2 rounded-xl shadow-lg shadow-primary/20">
                        <Send className="h-4 w-4 text-white" />
                    </div>
                    <h2 className="text-xl font-bold text-foreground">Submission Portal</h2>
                </div>

                {!isUnlocked && !isPastDeadline && (
                    <div className="mb-10 p-6 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-4">
                            <Lock className="h-6 w-6 text-slate-400" />
                        </div>
                        <h3 className="text-sm font-bold mb-2">Submissions Locked</h3>
                        <p className="text-[11px] font-medium text-slate-400 uppercase tracking-wider leading-relaxed">
                            Please complete the required viewing time to enable assignment submission.
                        </p>
                    </div>
                )}

                {isPastDeadline && (
                    <div className="mb-10 p-6 bg-red-50 dark:bg-red-950/20 rounded-2xl border border-red-100 dark:border-red-500/10 flex flex-col items-center text-center">
                        <div className="w-12 h-12 bg-white dark:bg-slate-900 rounded-2xl flex items-center justify-center shadow-sm mb-4 text-red-500">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <h3 className="text-sm font-bold text-red-600 mb-2">Deadline Passed</h3>
                        <p className="text-[11px] font-medium text-red-500 uppercase tracking-wider leading-relaxed">
                            The submission window for this phase has closed.
                        </p>
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
                            <div key={idx} className={cn(
                                "space-y-6 pb-10",
                                idx < (phase.total_assignments || 1) ? 'border-b border-slate-100 dark:border-slate-800' : ''
                            )}>
                                <div className="flex items-center justify-between">
                                    <h3 className="text-sm font-black uppercase tracking-tighter flex items-center gap-2">
                                        Assignment Unit {idx.toString().padStart(2, '0')}
                                        {isSubmitted && (
                                            <span className="flex h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                                        )}
                                    </h3>
                                    {isSubmitted && (
                                        <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/10">Verified</span>
                                    )}
                                </div>

                                <form onSubmit={(e) => handleSubmit(e, idx)} className="space-y-6">
                                    {currentAllowedType === 'both' && (
                                        <div className="flex p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
                                            <button
                                                type="button"
                                                onClick={() => setFormData((p: any) => ({ ...p, [idx]: { ...p[idx], submissionType: 'github' } }))}
                                                className={cn(
                                                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                    data.submissionType === 'github' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'
                                                )}
                                            >
                                                Source Link
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setFormData((p: any) => ({ ...p, [idx]: { ...p[idx], submissionType: 'file' } }))}
                                                className={cn(
                                                    "flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all",
                                                    data.submissionType === 'file' ? 'bg-white dark:bg-slate-700 text-indigo-600 shadow-sm' : 'text-slate-400'
                                                )}
                                            >
                                                Local File
                                            </button>
                                        </div>
                                    )}

                                    <div className="space-y-4">
                                        {data.submissionType === 'github' ? (
                                            <div className="relative group">
                                                <div className="absolute inset-y-0 left-3.5 flex items-center pointer-events-none">
                                                    <Github className="h-4 w-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
                                                </div>
                                                <input
                                                    type="url"
                                                    placeholder="GitHub Repository URL"
                                                    value={data.githubUrl}
                                                    onChange={(e) => setFormData((p: any) => ({ ...p, [idx]: { ...p[idx], githubUrl: e.target.value } }))}
                                                    className="w-full !pl-10 text-sm font-medium"
                                                    disabled={!isUnlocked || isPastDeadline}
                                                />
                                            </div>
                                        ) : (
                                            <div className={cn(
                                                "group relative border-2 border-dashed rounded-2xl p-6 transition-all text-center",
                                                (!isUnlocked || isPastDeadline) ? 'opacity-50 grayscale bg-slate-50' : 'hover:border-indigo-600/30 hover:bg-indigo-600/[0.02]',
                                                data.selectedFile || data.existingFileUrl ? 'border-emerald-500/30 bg-emerald-500/[0.02]' : 'border-slate-200 dark:border-slate-800'
                                            )}>
                                                {data.selectedFile ? (
                                                    <div className="flex items-center justify-between gap-4">
                                                        <div className="flex items-center gap-3 overflow-hidden">
                                                            <FileText className="h-5 w-5 text-emerald-500 shrink-0" />
                                                            <span className="text-sm font-bold truncate">{data.selectedFile.name}</span>
                                                        </div>
                                                        <button type="button" onClick={() => handleRemoveFile(idx)} className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-500 rounded-lg transition-all"><X className="h-4 w-4" /></button>
                                                    </div>
                                                ) : (
                                                    <label className={cn("cursor-pointer block", (!isUnlocked || isPastDeadline) && 'pointer-events-none')}>
                                                        <input type="file" className="hidden" disabled={!isUnlocked || isPastDeadline} onChange={(e) => handleFileSelect(e, idx)} />
                                                        <Upload className="mx-auto h-8 w-8 text-slate-300 mb-3 group-hover:text-indigo-600 group-hover:scale-110 transition-all" />
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">Select Project File</p>
                                                    </label>
                                                )}
                                            </div>
                                        )}

                                        <textarea
                                            placeholder="Implementation notes (optional)..."
                                            value={data.notes}
                                            onChange={(e) => setFormData((p: any) => ({ ...p, [idx]: { ...p[idx], notes: e.target.value } }))}
                                            className="w-full h-24 text-sm font-medium resize-none pb-safe"
                                            disabled={!isUnlocked || isPastDeadline}
                                        />
                                    </div>

                                    <AnimatePresence>
                                        {data.error && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3 p-4 bg-red-50 dark:bg-red-950/20 text-red-600 rounded-xl border border-red-100 dark:border-red-500/10">
                                                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-bold uppercase tracking-tight leading-relaxed">{data.error}</p>
                                            </motion.div>
                                        )}
                                        {data.success && (
                                            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="flex items-start gap-3 p-4 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-xl border border-emerald-100 dark:border-emerald-500/10">
                                                <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
                                                <p className="text-[11px] font-bold uppercase tracking-tight leading-relaxed">{data.success}</p>
                                            </motion.div>
                                        )}
                                    </AnimatePresence>

                                    <button
                                        type="submit"
                                        disabled={submittingIndex === idx || !isUnlocked || isPastDeadline}
                                        className="w-full h-14 bg-indigo-600 text-white font-black uppercase tracking-[0.15em] text-[11px] rounded-2xl hover:bg-indigo-500 disabled:opacity-30 disabled:hover:bg-indigo-600 transition-all shadow-lg shadow-indigo-600/20 active:scale-[0.98] flex items-center justify-center relative overflow-hidden group"
                                    >
                                        <div className="absolute inset-x-0 bottom-0 h-1 bg-white/20 transform scale-x-0 group-hover:scale-x-100 transition-transform duration-500 origin-left" />
                                        {submittingIndex === idx ? (
                                            <Loader2 className="h-5 w-5 animate-spin" />
                                        ) : (
                                            <span>{isSubmitted ? 'Update Engineering Submission' : 'Commit Final Assignment'}</span>
                                        )}
                                    </button>
                                </form>
                            </div>
                        );
                    })}
                </div>
            </aside>
        </div>
    );
}
