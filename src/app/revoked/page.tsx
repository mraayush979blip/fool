'use client';

import { useAuth } from '@/contexts/AuthContext';
import { LogOut, ShieldAlert, Clock, CheckCircle2, AlertCircle, ArrowRight, Loader2, Send } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import NeonLoader from '@/components/NeonLoader';

export default function RevokedPage() {
    const { user, signOut } = useAuth();
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    
    const [missingPhase, setMissingPhase] = useState<any>(null);
    const [isWithin30Days, setIsWithin30Days] = useState(false);
    const [appeal, setAppeal] = useState<any>(null);
    const [reasonText, setReasonText] = useState('');
    const [motivation, setMotivation] = useState('');

    useEffect(() => {
        const fetchMotivation = async () => {
            try {
                const res = await fetch('/api/motivation');
                const data = await res.json();
                setMotivation(data.message);
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            } catch (e) {
                setMotivation("Tu yahan quit karne nahi aaya tha. Uth, aur kaam khatam kar!");
            }
        };

        fetchMotivation();

        if (!user) return;
        fetchRevokeDetails();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [user]);

    const fetchRevokeDetails = async () => {
        try {
            // 1. Fetch any existing appeals
            const { data: appeals } = await supabase
                .from('revoke_appeals')
                .select('*')
                .eq('student_id', user?.id)
                .order('created_at', { ascending: false });

            if (appeals && appeals.length > 0) {
                setAppeal(appeals[0]);
            }

            // 2. Determine missing phase (Admin revoke or phase deadline)
            const { data: phases } = await supabase
                .from('phases')
                .select('id, title, end_date')
                .eq('is_active', true)
                .eq('is_mandatory', true);

            let foundMissing = null;
            if (phases) {
                const now = new Date();
                const pastPhases = phases.filter(p => {
                    const deadline = new Date(p.end_date);
                    deadline.setHours(23, 59, 59, 999);
                    return deadline < now;
                });

                for (const phase of pastPhases) {
                    const { data: submissions } = await supabase
                        .from('submissions')
                        .select('id')
                        .eq('student_id', user?.id)
                        .eq('phase_id', phase.id)
                        .eq('status', 'valid');
                        
                    if (!submissions || submissions.length === 0) {
                        foundMissing = phase;
                        // Check if within 30 days
                        const thirtyDaysMs = 30 * 24 * 60 * 60 * 1000;
                        const phaseEnd = new Date(phase.end_date).getTime();
                        if (now.getTime() - phaseEnd <= thirtyDaysMs) {
                            setIsWithin30Days(true);
                        }
                        break;
                    }
                }
            }

            setMissingPhase(foundMissing);

        } catch (err) {
            console.error('Error fetching revoke details:', err);
        } finally {
            setLoading(false);
        }
    };

    const submitAppeal = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!reasonText.trim()) return;
        setSubmitting(true);
        try {
            const { error } = await supabase.from('revoke_appeals').insert({
                student_id: user?.id,
                phase_id: missingPhase?.id || null,
                reason: reasonText
            });

            if (error) throw error;
            setReasonText('');
            await fetchRevokeDetails(); // Refresh to get the new appeal
        } catch (err: any) {
            alert('Failed to submit appeal: ' + err.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleCheckStatus = async () => {
        setSubmitting(true);
        try {
            const { data: isRevoked } = await supabase.rpc('check_and_revoke_self');
            if (!isRevoked) {
                alert('Success! Your access has been restored.');
                window.location.href = '/student';
            } else {
                alert('You are still revoked. Please complete the missing phase.');
            }
        } catch (err: any) {
            console.error('Error checking status:', err);
            alert('An error occurred while checking your status.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <NeonLoader />;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 px-4 sm:px-6 lg:px-8 font-sans">
            <div className="max-w-xl mx-auto w-full">
                
                {/* Header */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-red-100 mb-6 border-4 border-red-50">
                        <ShieldAlert className="h-10 w-10 text-red-600" />
                    </div>
                    <h2 className="text-4xl font-black text-gray-900 tracking-tighter mb-2">
                        Access Revoked
                    </h2>
                    <p className="text-gray-500 font-medium max-w-sm mx-auto">
                        Your account has been temporarily suspended. Please review the details below.
                    </p>

                    {motivation && (
                        <div className="mt-8 mx-auto max-w-md p-5 bg-zinc-950 rounded-2xl border-2 border-red-500 shadow-[0_10px_30px_rgba(239,68,68,0.3)] transform -rotate-1">
                            <p className="text-red-500 font-black text-lg leading-snug uppercase tracking-wide font-mono">
                                ⚠️ "{motivation}"
                            </p>
                        </div>
                    )}
                </div>

                <div className="bg-white shadow-xl rounded-3xl border border-gray-100 overflow-hidden">
                    {/* Reason Box */}
                    <div className="p-8 border-b border-gray-100 bg-gray-50/50">
                        <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4">Revocation Reason</h3>
                        {missingPhase ? (
                            <div className="flex items-start gap-4 p-5 bg-red-50 rounded-2xl border border-red-100">
                                <AlertCircle className="w-6 h-6 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-red-900">Missed Deadline</h4>
                                    <p className="text-sm text-red-700 mt-1">
                                        You missed the mandatory deadline for <strong className="font-black">"{missingPhase.title}"</strong>.
                                    </p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-start gap-4 p-5 bg-orange-50 rounded-2xl border border-orange-100">
                                <AlertCircle className="w-6 h-6 text-orange-500 shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-bold text-orange-900">Admin Action</h4>
                                    <p className="text-sm text-orange-700 mt-1">
                                        Your access was manually revoked by an administrator. Please submit an appeal below.
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="p-8 space-y-8">
                        
                        {missingPhase && (
                            <div className="space-y-3">
                                <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest">Required Action</h3>
                                {isWithin30Days ? (
                                    <>
                                        <button
                                            onClick={() => router.push(`/student/phase/${missingPhase.id}`)}
                                            className="w-full flex items-center justify-between p-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all shadow-lg shadow-blue-600/20 active:scale-[0.98]"
                                        >
                                            <span className="flex items-center gap-3">
                                                <ArrowRight className="w-5 h-5" />
                                                Complete Phase Now
                                            </span>
                                        </button>
                                        <p className="text-xs text-gray-500 text-center font-medium">
                                            Completing this phase will automatically restore your dashboard access.
                                        </p>
                                    </>
                                ) : (
                                    <div className="p-4 bg-gray-50 rounded-2xl border border-gray-200 text-center">
                                        <p className="text-sm text-gray-600 font-medium">
                                            The 30-day grace period to complete this phase has expired. You must submit an appeal to request an extension from the administrator.
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Divider */}
                        <div className="relative">
                            <div className="absolute inset-0 flex items-center" aria-hidden="true">
                                <div className="w-full border-t border-gray-200" />
                            </div>
                            <div className="relative flex justify-center">
                                <span className="bg-white px-4 text-xs font-black text-gray-300 uppercase tracking-widest">OR</span>
                            </div>
                        </div>

                        {/* Appeal Section */}
                        <div className="space-y-4">
                            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center justify-between">
                                Submit Appeal
                                {appeal && (
                                    <span className={`px-2 py-1 rounded-md text-[10px] ${
                                        appeal.status === 'sent' ? 'bg-blue-50 text-blue-600' :
                                        appeal.status === 'seen' ? 'bg-yellow-50 text-yellow-600' :
                                        'bg-green-50 text-green-600'
                                    }`}>
                                        Status: {appeal.status.toUpperCase()}
                                    </span>
                                )}
                            </h3>

                            {appeal ? (
                                <div className="p-5 rounded-2xl border border-gray-100 bg-gray-50 space-y-3">
                                    <div className="flex items-center gap-2 text-sm font-bold text-gray-700">
                                        {appeal.status === 'sent' && <Clock className="w-4 h-4 text-blue-500" />}
                                        {appeal.status === 'seen' && <Clock className="w-4 h-4 text-yellow-500" />}
                                        {appeal.status === 'resolved' && <CheckCircle2 className="w-4 h-4 text-green-500" />}
                                        Appeal submitted on {new Date(appeal.created_at).toLocaleDateString()}
                                    </div>
                                    <p className="text-sm text-gray-500 bg-white p-3 rounded-xl border border-gray-100">
                                        "{appeal.reason}"
                                    </p>
                                    <p className="text-xs text-gray-400 font-medium">
                                        An admin will review your appeal shortly. You can submit another one if needed.
                                    </p>
                                </div>
                            ) : null}

                            <form onSubmit={submitAppeal} className="space-y-3">
                                <textarea
                                    value={reasonText}
                                    onChange={(e) => setReasonText(e.target.value)}
                                    placeholder="Explain to the admin why you were unable to complete the phase on time..."
                                    className="w-full min-h-[100px] p-4 bg-gray-50 border border-gray-200 rounded-2xl text-sm focus:bg-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all outline-none resize-none font-medium"
                                    required
                                />
                                <button
                                    type="submit"
                                    disabled={submitting || !reasonText.trim()}
                                    className="w-full flex items-center justify-center gap-2 p-3 rounded-xl bg-gray-900 hover:bg-black text-white font-bold transition-all disabled:opacity-50"
                                >
                                    {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                                    Send to Admin
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="p-6 bg-gray-50 border-t border-gray-100 flex items-center gap-3">
                        <button
                            onClick={handleCheckStatus}
                            disabled={submitting}
                            className="flex-1 py-2.5 text-sm font-bold text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors"
                        >
                            Refresh Status
                        </button>
                        <button
                            onClick={async () => {
                                await signOut();
                                router.push('/login');
                            }}
                            className="flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-bold text-red-600 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                        >
                            <LogOut className="w-4 h-4" /> Sign Out
                        </button>
                    </div>

                </div>
            </div>
        </div>
    );
}
