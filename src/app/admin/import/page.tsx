'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
    Upload,
    FileText,
    CheckCircle2,
    AlertCircle,
    Download,
    Loader2,
    Info,
    ArrowLeft
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';

export default function CSVImportPage() {
    const router = useRouter();
    const { user } = useAuth();
    const [file, setFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);
    const [result, setResult] = useState<{
        total: number;
        success: number;
        failed: number;
        errors: string[];
    } | null>(null);
    const [error, setError] = useState<string | null>(null);

    const [activeTab, setActiveTab] = useState<'csv' | 'manual'>('csv');
    const [manualData, setManualData] = useState({
        name: '',
        email: '',
        roll_number: '',
        phone: '',
        password: ''
    });

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const handleManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target.value as any || e.target;
        setManualData(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const submitStudents = async (students: any[], source: string) => {
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const response = await fetch('/api/students/import', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ students }),
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || `Server responded with status: ${response.status}`);
            }

            const actionResult = await response.json();

            setResult({
                total: students.length,
                success: actionResult.successCount || 0,
                failed: actionResult.failedCount || 0,
                errors: actionResult.errors || []
            });

            // Record the import in database
            await supabase.from('csv_imports').insert({
                admin_id: user?.id,
                file_name: source,
                total_rows: students.length,
                successful_count: actionResult.successCount,
                failed_count: actionResult.failedCount,
                error_details: actionResult.errors
            });

            if (actionResult.successCount > 0 && activeTab === 'manual') {
                setManualData({ name: '', email: '', roll_number: '', phone: '', password: '' });
            }

        } catch (err: any) {
            console.error('Import error:', err);
            setError(err.message || 'An unexpected error occurred during import.');
        } finally {
            setLoading(false);
        }
    };

    const processCSV = async () => {
        if (!file) return;
        try {
            const text = await file.text();
            const lines = text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(line => line.length > 0);
            if (lines.length < 2) throw new Error('CSV file is too short.');

            const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
            const headers = rows[0].map(h => h.toLowerCase());

            const nameIdx = headers.indexOf('name');
            const emailIdx = headers.indexOf('email');
            const rollNumberIdx = headers.findIndex(h => ['roll_number', 'roll_no', 'rollno', 'roll'].includes(h));
            const phoneIdx = headers.findIndex(h => ['phone', 'mobile', 'contact', 'number'].includes(h));
            const passwordIdx = headers.indexOf('password');

            if (nameIdx === -1 || emailIdx === -1 || passwordIdx === -1) {
                throw new Error('CSV must contain "name", "email", and "password" columns.');
            }

            const studentsToImport = rows.slice(1).map((row) => {
                if (row.length < headers.length) return null;
                return {
                    name: row[nameIdx],
                    email: row[emailIdx],
                    roll_number: rollNumberIdx !== -1 ? row[rollNumberIdx] : '',
                    phone: phoneIdx !== -1 ? row[phoneIdx] : '',
                    password: row[passwordIdx]
                };
            }).filter((s): s is any => s !== null);

            await submitStudents(studentsToImport, `CSV: ${file.name}`);

        } catch (err: any) {
            setError(err.message);
        }
    };

    const handleManualSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!manualData.name || !manualData.email || !manualData.password) {
            setError('Name, Email and Password are required.');
            return;
        }
        submitStudents([manualData], 'Manual Entry');
    };

    const downloadSample = () => {
        const csvContent = "name,email,roll_no,phone,password\nJohn Doe,john@example.com,STU001,9876543210,Student@123";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'sample_students.csv';
        a.click();
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Add Students</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Register students individually or in bulk via CSV.
                    </p>
                </div>
                <Link href="/admin/students" className="flex items-center text-sm text-gray-600 hover:text-gray-900 font-bold">
                    <ArrowLeft className="mr-1 h-4 w-4" /> Back to Students
                </Link>
            </div>

            <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden text-black">
                <div className="flex border-b border-gray-200 bg-gray-50">
                    <button
                        onClick={() => { setActiveTab('csv'); setResult(null); setError(null); }}
                        className={`flex-1 py-4 px-6 text-sm font-bold transition-colors ${activeTab === 'csv' ? 'bg-white border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Bulk Import (CSV)
                    </button>
                    <button
                        onClick={() => { setActiveTab('manual'); setResult(null); setError(null); }}
                        className={`flex-1 py-4 px-6 text-sm font-bold transition-colors ${activeTab === 'manual' ? 'bg-white border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}
                    >
                        Single Entry (Manual)
                    </button>
                </div>

                <div className="p-8 space-y-8">
                    {activeTab === 'csv' ? (
                        <div className="space-y-8">
                            <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                                <div className="flex">
                                    <Info className="h-5 w-5 text-blue-400 flex-shrink-0" />
                                    <div className="ml-3">
                                        <p className="text-sm text-blue-700 font-bold">Requirement:</p>
                                        <p className="text-sm text-blue-600 mt-1">Headers: <code className="font-mono bg-blue-100 px-1 rounded">name, email, roll_no, phone, password</code></p>
                                        <button onClick={downloadSample} className="mt-3 flex items-center text-sm font-bold text-blue-700 hover:text-blue-600">
                                            <Download className="mr-1 h-4 w-4" /> Download Sample
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 hover:border-blue-400 transition-colors">
                                <Upload className="h-12 w-12 text-gray-400 mb-4" />
                                <input type="file" accept=".csv" onChange={handleFileChange} className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100" />
                                {file && <div className="mt-4 flex items-center text-sm font-bold"><FileText className="mr-2 h-4 w-4 text-blue-500" />{file.name}</div>}
                            </div>
                        </div>
                    ) : (
                        <form onSubmit={handleManualSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Full Name *</label>
                                <input name="name" type="text" value={manualData.name} onChange={handleManualChange} required className="w-full font-bold" placeholder="e.g. John Doe" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Email Address *</label>
                                <input name="email" type="email" value={manualData.email} onChange={handleManualChange} required className="w-full font-bold" placeholder="john@example.com" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Roll Number</label>
                                <input name="roll_number" type="text" value={manualData.roll_number} onChange={handleManualChange} className="w-full font-bold" placeholder="e.g. STU001" />
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Phone Number</label>
                                <input name="phone" type="text" value={manualData.phone} onChange={handleManualChange} className="w-full font-bold" placeholder="e.g. 9876543210" />
                            </div>
                            <div className="md:col-span-2 space-y-1">
                                <label className="text-xs font-bold text-gray-500 uppercase">Initial Password *</label>
                                <input name="password" type="text" value={manualData.password} onChange={handleManualChange} required className="w-full font-bold" placeholder="Min 6 characters" />
                            </div>
                        </form>
                    )}

                    {error && <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-center text-red-700 font-bold"><AlertCircle className="mr-2 h-5 w-5" />{error}</div>}

                    {result && (
                        <div className="bg-green-50 border border-green-200 p-6 rounded-lg space-y-6">
                            <div className="flex items-center text-green-800 font-bold"><CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />Import Complete</div>
                            <div className="grid grid-cols-3 gap-4 text-center">
                                <div className="bg-white p-3 rounded shadow-sm border border-green-100"><p className="text-[10px] text-gray-500 uppercase font-black">Total</p><p className="text-xl font-bold">{result.total}</p></div>
                                <div className="bg-white p-3 rounded shadow-sm border border-green-100"><p className="text-[10px] text-green-500 uppercase font-black">Success</p><p className="text-xl font-bold text-green-600">{result.success}</p></div>
                                <div className="bg-white p-3 rounded shadow-sm border border-red-100"><p className="text-[10px] text-red-500 uppercase font-black">Failed</p><p className="text-xl font-bold text-red-600">{result.failed}</p></div>
                            </div>
                            {result.errors.length > 0 && (
                                <ul className="text-xs text-red-600 bg-red-100/50 p-4 rounded-xl list-disc list-inside space-y-1 max-h-40 overflow-y-auto font-bold border border-red-200">{result.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                            )}
                            <button onClick={() => router.push('/admin/students')} className="w-full py-3 bg-green-600 text-white rounded-xl font-bold hover:bg-green-700 transition-all">View Students</button>
                        </div>
                    )}

                    {!result && (
                        <button
                            onClick={activeTab === 'csv' ? processCSV : (e) => handleManualSubmit(e as any)}
                            disabled={(activeTab === 'csv' && !file) || loading}
                            className="w-full flex justify-center items-center py-4 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transform active:scale-[0.98] transition-all shadow-lg shadow-blue-600/20"
                        >
                            {loading ? <><Loader2 className="animate-spin mr-2 h-5 w-5" /> Processing...</> : activeTab === 'csv' ? 'Start CSV Import' : 'Register Single Student'}
                        </button>
                    )}
                </div>
            </div>
        </div>

    );
}
