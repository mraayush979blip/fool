'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { ShieldAlert, Search, MessageCircle, CheckCircle2, Trash2, Eye, Clock, Mail, Phone, Loader2 } from 'lucide-react';

export default function AdminAppealsPage() {
    const [appeals, setAppeals] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [processingId, setProcessingId] = useState<string | null>(null);

    useEffect(() => {
        fetchAppeals();
    }, []);

    const fetchAppeals = async () => {
        try {
            const { data, error } = await supabase
                .from('revoke_appeals')
                .select(`
                    *,
                    users (name, email, phone),
                    phases (title)
                `)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setAppeals(data || []);
        } catch (err) {
            console.error('Error fetching appeals:', err);
        } finally {
            setLoading(false);
        }
    };

    const markAsSeen = async (id: string, currentStatus: string) => {
        if (currentStatus !== 'sent') return;
        try {
            await supabase.from('revoke_appeals').update({ status: 'seen' }).eq('id', id);
            setAppeals(prev => prev.map(a => a.id === id ? { ...a, status: 'seen' } : a));
        } catch (err) {
            console.error('Failed to mark seen:', err);
        }
    };

    const restoreStudent = async (appealId: string, studentId: string) => {
        const daysInput = window.prompt('How many days extension should this student get to complete their backlog? (e.g. 7)');
        if (daysInput === null) return;
        
        const extensionDays = parseInt(daysInput);
        if (isNaN(extensionDays) || extensionDays <= 0) {
            alert('Please enter a valid number of days.');
            return;
        }

        setProcessingId(appealId);
        try {
            // Call the NEW RPC
            const { error: restoreErr } = await supabase.rpc('admin_restore_student', {
                target_student_id: studentId,
                extension_days: extensionDays
            });
            if (restoreErr) throw restoreErr;

            // Update appeal status
            await supabase.from('revoke_appeals').update({ status: 'resolved' }).eq('id', appealId);
            
            setAppeals(prev => prev.map(a => a.id === appealId ? { ...a, status: 'resolved' } : a));
            
            if (confirm('Student restored! Would you like to notify them via WhatsApp now?')) {
                const appeal = appeals.find(a => a.id === appealId);
                openWhatsApp(appeal?.users?.phone, appeal?.users?.name, appeal?.phases?.title, extensionDays);
            }
        } catch (err: any) {
            alert('Failed to restore student: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const deleteAppeal = async (id: string) => {
        if (!confirm('Are you sure you want to delete this appeal? This cannot be undone.')) return;
        setProcessingId(id);
        try {
            await supabase.from('revoke_appeals').delete().eq('id', id);
            setAppeals(prev => prev.filter(a => a.id !== id));
        } catch (err: any) {
            alert('Failed to delete appeal: ' + err.message);
        } finally {
            setProcessingId(null);
        }
    };

    const openWhatsApp = (phone: string, studentName: string, phaseTitle: string | null, extensionDays?: number) => {
        if (!phone) {
            alert('No phone number available for this student.');
            return;
        }
        let text = `Hi ${studentName}, regarding your appeal to access Levelone${phaseTitle ? ` for ${phaseTitle}` : ''}...`;
        if (extensionDays) {
            text = `Hi ${studentName},\n\nYour Levelone account has been restored! You have been granted an extension of ${extensionDays} days to complete your backlog${phaseTitle ? ` for ${phaseTitle}` : ''}. Please log in and submit your assignment before the new deadline to avoid losing access again.\n\nBest,\nLevelone Admin`;
        }
        const url = `https://wa.me/${phone.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(text)}`;
        window.open(url, '_blank');
    };

    const filteredAppeals = appeals.filter(a => 
        a.users?.name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
        a.users?.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="max-w-6xl mx-auto space-y-6 pb-20 font-sans">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black text-gray-900 tracking-tighter">Revoke Appeals</h1>
                    <p className="mt-1 text-sm text-gray-500 font-medium">
                        Review and resolve access requests from revoked students.
                    </p>
                </div>
            </div>

            {/* Search */}
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-gray-200">
                <div className="relative max-w-md">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search by student name or email..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                    />
                </div>
            </div>

            {/* Appeals List */}
            {loading ? (
                <div className="flex justify-center p-12"><Loader2 className="w-8 h-8 animate-spin text-blue-500" /></div>
            ) : filteredAppeals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center">
                    <div className="w-16 h-16 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-4">
                        <CheckCircle2 className="w-8 h-8" />
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">All clear!</h3>
                    <p className="text-gray-500 mt-1">There are no pending appeals to review.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {filteredAppeals.map((appeal) => (
                        <div key={appeal.id} 
                            onMouseEnter={() => markAsSeen(appeal.id, appeal.status)}
                            className={`bg-white rounded-2xl border p-6 transition-all shadow-sm ${
                                appeal.status === 'sent' ? 'border-blue-200 ring-1 ring-blue-50' :
                                appeal.status === 'resolved' ? 'border-green-200 opacity-70' :
                                'border-gray-200'
                            }`}
                        >
                            <div className="flex flex-col md:flex-row gap-6 justify-between">
                                {/* Student Info & Reason */}
                                <div className="space-y-4 flex-1">
                                    <div className="flex items-start justify-between">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center font-bold text-gray-600">
                                                {appeal.users?.name?.charAt(0) || '?'}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-gray-900 text-lg leading-tight">{appeal.users?.name || 'Unknown User'}</h3>
                                                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500 mt-1">
                                                    <span className="flex items-center gap-1"><Mail className="w-3 h-3" /> {appeal.users?.email}</span>
                                                    <span className="flex items-center gap-1"><Phone className="w-3 h-3" /> {appeal.users?.phone || 'N/A'}</span>
                                                </div>
                                            </div>
                                        </div>
                                        {/* Status Badge */}
                                        <div className={`px-3 py-1 text-xs font-black uppercase tracking-widest rounded-lg flex items-center gap-1 ${
                                            appeal.status === 'sent' ? 'bg-blue-100 text-blue-700' :
                                            appeal.status === 'seen' ? 'bg-yellow-100 text-yellow-700' :
                                            'bg-green-100 text-green-700'
                                        }`}>
                                            {appeal.status === 'sent' && <Clock className="w-3 h-3" />}
                                            {appeal.status === 'seen' && <Eye className="w-3 h-3" />}
                                            {appeal.status === 'resolved' && <CheckCircle2 className="w-3 h-3" />}
                                            {appeal.status}
                                        </div>
                                    </div>

                                    {appeal.phases?.title && (
                                        <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-red-50 text-red-700 text-xs font-bold rounded-lg border border-red-100">
                                            <ShieldAlert className="w-3.5 h-3.5" />
                                            Revoked Phase: {appeal.phases.title}
                                        </div>
                                    )}

                                    <div className="bg-gray-50 p-4 rounded-xl border border-gray-100 relative">
                                        <span className="absolute -top-2 left-4 px-2 bg-gray-50 text-[10px] font-black uppercase tracking-widest text-gray-400">Student Reason</span>
                                        <p className="text-gray-700 text-sm whitespace-pre-wrap mt-1">"{appeal.reason}"</p>
                                        <p className="text-[10px] text-gray-400 mt-3 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> Submitted {new Date(appeal.created_at).toLocaleString()}
                                        </p>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="flex md:flex-col gap-2 shrink-0 md:w-48">
                                    {appeal.status !== 'resolved' && (
                                        <button
                                            onClick={() => restoreStudent(appeal.id, appeal.student_id)}
                                            disabled={processingId === appeal.id}
                                            className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95 disabled:opacity-50"
                                        >
                                            {processingId === appeal.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                                            Restore Access
                                        </button>
                                    )}
                                    <button
                                        onClick={() => openWhatsApp(appeal.users?.phone, appeal.users?.name, appeal.phases?.title)}
                                        className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-[#25D366] hover:bg-[#128C7E] text-white text-sm font-bold rounded-xl transition-all shadow-sm active:scale-95"
                                    >
                                        <MessageCircle className="w-4 h-4" />
                                        WhatsApp
                                    </button>
                                    <button
                                        onClick={() => deleteAppeal(appeal.id)}
                                        disabled={processingId === appeal.id}
                                        className="w-full flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-white border border-red-200 text-red-600 hover:bg-red-50 text-sm font-bold rounded-xl transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                        Delete
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
