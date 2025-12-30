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
import { importStudentsAction } from '@/app/actions/students';
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

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setResult(null);
            setError(null);
        }
    };

    const processCSV = async () => {
        if (!file) return;
        setLoading(true);
        setResult(null);
        setError(null);

        try {
            const text = await file.text();

            // Robust line splitting: handles \r\n, \r, and \n
            const lines = text.split(/\r\n|\r|\n/).map(line => line.trim()).filter(line => line.length > 0);

            if (lines.length < 2) {
                const contentSnippet = text.substring(0, 100).replace(/\r/g, '\\r').replace(/\n/g, '\\n');
                throw new Error(`CSV file is too short. Found ${lines.length} non-empty line(s). Need at least a header and one data row. File start: "${contentSnippet}..."`);
            }

            const rows = lines.map(line => line.split(',').map(cell => cell.trim()));
            const headers = rows[0].map(h => h.toLowerCase());

            const nameIdx = headers.indexOf('name');
            const emailIdx = headers.indexOf('email');
            const numberIdx = headers.indexOf('number');
            const passwordIdx = headers.indexOf('password');

            if (nameIdx === -1 || emailIdx === -1 || numberIdx === -1 || passwordIdx === -1) {
                throw new Error('CSV must contain "name", "email", "number", and "password" columns.');
            }

            const studentsToImport = rows.slice(1).map((row, index) => {
                if (row.length < headers.length) return null;
                return {
                    name: row[nameIdx],
                    email: row[emailIdx],
                    roll_number: row[numberIdx],
                    password: row[passwordIdx]
                };
            }).filter((s): s is any => s !== null);

            if (studentsToImport.length === 0) {
                throw new Error('No valid student data found in CSV.');
            }

            const actionResult = await importStudentsAction(studentsToImport);

            if (!actionResult.success) {
                throw new Error(actionResult.errors?.join(', ') || 'Failed to import students');
            }

            setResult({
                total: studentsToImport.length,
                success: actionResult.successCount || 0,
                failed: actionResult.failedCount || 0,
                errors: actionResult.errors || []
            });

            // Record the import in database
            await supabase.from('csv_imports').insert({
                admin_id: user?.id,
                file_name: file.name,
                total_rows: studentsToImport.length,
                successful_count: actionResult.successCount,
                failed_count: actionResult.failedCount,
                error_details: actionResult.errors
            });

        } catch (err: any) {
            console.error('CSV Import error:', err);
            if (err.name === 'NotReadableError') {
                setError('The file could not be read. Please make sure it is not open in another program (like Excel) and try selecting it again.');
            } else {
                setError(err.message || 'An unexpected error occurred during import.');
            }
        } finally {
            setLoading(false);
        }
    };

    const downloadSample = () => {
        const csvContent = "name,email,number,password\nJohn Doe,john@example.com,STU001,Student@123\nJane Smith,jane@example.com,STU002,Student@456";
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.setAttribute('hidden', '');
        a.setAttribute('href', url);
        a.setAttribute('download', 'sample_students.csv');
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    };

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Import Students</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Bulk register students and create Auth accounts automatically.
                    </p>
                </div>
                <Link
                    href="/admin/students"
                    className="flex items-center text-sm text-gray-600 hover:text-gray-900"
                >
                    <ArrowLeft className="mr-1 h-4 w-4" />
                    Back to Students
                </Link>
            </div>

            <div className="bg-white p-8 rounded-xl shadow-sm border border-gray-200 space-y-8 text-black">
                <div className="bg-blue-50 border-l-4 border-blue-400 p-4">
                    <div className="flex">
                        <div className="flex-shrink-0">
                            <Info className="h-5 w-5 text-blue-400" aria-hidden="true" />
                        </div>
                        <div className="ml-3">
                            <p className="text-sm text-blue-700 font-bold">
                                CSV Requirement:
                            </p>
                            <p className="text-sm text-blue-600 mt-1">
                                Your file must include headers:
                                <code className="mx-1 font-mono bg-blue-100 px-1 rounded font-bold">name</code>,
                                <code className="mx-1 font-mono bg-blue-100 px-1 rounded font-bold">email</code>,
                                <code className="mx-1 font-mono bg-blue-100 px-1 rounded font-bold">number</code>,
                                and <code className="mx-1 font-mono bg-blue-100 px-1 rounded font-bold">password</code>.
                            </p>
                            <button
                                onClick={downloadSample}
                                className="mt-3 inline-flex items-center text-sm font-medium text-blue-700 hover:text-blue-600 font-bold"
                            >
                                <Download className="mr-1 h-4 w-4" /> Download Sample CSV
                            </button>
                        </div>
                    </div>
                </div>

                <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-12 transition-colors hover:border-blue-400">
                    <Upload className="h-12 w-12 text-gray-400 mb-4" />
                    <p className="text-sm text-gray-600 mb-4">Click to select or drag and drop your CSV file</p>
                    <input
                        type="file"
                        accept=".csv"
                        onChange={handleFileChange}
                        className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    {file && (
                        <div className="mt-4 flex items-center text-sm text-gray-900">
                            <FileText className="mr-2 h-4 w-4 text-blue-500" />
                            {file.name} ({(file.size / 1024).toFixed(2)} KB)
                        </div>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded-md flex items-center text-red-700">
                        <AlertCircle className="mr-2 h-5 w-5" />
                        {error}
                    </div>
                )}

                {result && (
                    <div className="bg-green-50 border border-green-200 p-6 rounded-lg space-y-4">
                        <div className="flex items-center text-green-800 font-bold">
                            <CheckCircle2 className="mr-2 h-6 w-6 text-green-500" />
                            Import Complete
                        </div>
                        <div className="grid grid-cols-3 gap-4 text-center">
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-gray-500 uppercase font-bold">Total</p>
                                <p className="text-xl font-bold">{result.total}</p>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-green-500 uppercase font-bold">Success</p>
                                <p className="text-xl font-bold text-green-600">{result.success}</p>
                            </div>
                            <div className="bg-white p-3 rounded shadow-sm">
                                <p className="text-xs text-red-500 uppercase font-bold">Failed</p>
                                <p className="text-xl font-bold text-red-600">{result.failed}</p>
                            </div>
                        </div>
                        {result.errors.length > 0 && (
                            <div className="mt-4">
                                <p className="text-sm font-medium text-red-800 mb-2 font-bold underline">Error Details:</p>
                                <ul className="text-xs text-red-600 bg-red-100 p-3 rounded list-disc list-inside space-y-1 max-h-40 overflow-y-auto font-bold">
                                    {result.errors.map((err, i) => <li key={i}>{err}</li>)}
                                </ul>
                            </div>
                        )}
                        <button
                            onClick={() => router.push('/admin/students')}
                            className="w-full py-2 bg-green-600 text-white rounded-md font-bold hover:bg-green-700"
                        >
                            View Students
                        </button>
                    </div>
                )}

                {!result && (
                    <button
                        onClick={processCSV}
                        disabled={!file || loading}
                        className="w-full flex justify-center items-center py-3 bg-blue-600 text-white rounded-md font-bold hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                    >
                        {loading ? (
                            <>
                                <Loader2 className="animate-spin mr-2 h-5 w-5" />
                                Processing CSV & Registering Students...
                            </>
                        ) : (
                            'Start Import'
                        )}
                    </button>
                )}
            </div>
        </div>
    );
}
