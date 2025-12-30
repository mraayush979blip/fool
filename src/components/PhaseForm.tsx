'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import {
    ArrowLeft,
    Save,
    Calendar,
    Video,
    FileText,
    CheckCircle2,
    AlertCircle
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';

interface PhaseFormProps {
    id?: string;
}

export default function PhaseForm({ id }: PhaseFormProps) {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(!!id);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState<Partial<Phase>>({
        phase_number: 1,
        title: '',
        description: '',
        youtube_url: '',
        assignment_resource_url: '',
        start_date: new Date().toISOString().split('T')[0],
        end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        is_active: true,
    });

    useEffect(() => {
        if (id) {
            fetchPhase();
        }
    }, [id]);

    const fetchPhase = async () => {
        try {
            const { data, error } = await supabase
                .from('phases')
                .select('*')
                .eq('id', id)
                .single();

            if (error) throw error;
            if (data) {
                setFormData({
                    ...data,
                    start_date: new Date(data.start_date).toISOString().split('T')[0],
                    end_date: new Date(data.end_date).toISOString().split('T')[0],
                });
            }
        } catch (error: any) {
            console.error('Error fetching phase:', error);
            setError(error.message);
        } finally {
            setFetching(false);
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            if (id) {
                const { error } = await supabase
                    .from('phases')
                    .update(formData)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('phases')
                    .insert([formData]);
                if (error) throw error;
            }
            router.push('/admin/phases');
        } catch (error: any) {
            console.error('Error saving phase:', error);
            setError(error.message);
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
        return (
            <div className="flex justify-center items-center h-64">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    return (
        <div className="max-w-4xl mx-auto space-y-6">
            <div className="flex items-center space-x-4">
                <button
                    onClick={() => router.back()}
                    className="p-2 hover:bg-gray-100 rounded-full transition-colors"
                >
                    <ArrowLeft className="h-6 w-6 text-gray-500" />
                </button>
                <h1 className="text-2xl font-bold text-gray-900">
                    {id ? 'Edit Phase' : 'Create New Phase'}
                </h1>
            </div>

            <form onSubmit={handleSubmit} className="space-y-8 bg-white p-8 rounded-xl shadow-sm border border-gray-200">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                    <div className="sm:col-span-2 text-blue-600">
                        <label htmlFor="phase_number" className="block text-sm font-bold">
                            Phase Number
                        </label>
                        <div className="mt-1">
                            <input
                                type="number"
                                name="phase_number"
                                id="phase_number"
                                required
                                min="1"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                value={formData.phase_number}
                                onChange={(e) => setFormData({ ...formData, phase_number: parseInt(e.target.value) })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-4">
                        <label htmlFor="title" className="block text-sm font-bold text-gray-700">
                            Phase Title
                        </label>
                        <div className="mt-1">
                            <input
                                type="text"
                                name="title"
                                id="title"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="e.g. Fundamental Concepts"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="description" className="block text-sm font-bold text-gray-700">
                            Description
                        </label>
                        <div className="mt-1">
                            <textarea
                                id="description"
                                name="description"
                                rows={3}
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                placeholder="What will students learn in this phase?"
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                            <Video className="mr-2 h-5 w-5 text-red-500" /> Resources
                        </h3>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="youtube_url" className="block text-sm font-bold text-gray-700">
                            YouTube Video URL
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                name="youtube_url"
                                id="youtube_url"
                                placeholder="https://www.youtube.com/watch?v=..."
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                value={formData.youtube_url || ''}
                                onChange={(e) => setFormData({ ...formData, youtube_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6">
                        <label htmlFor="assignment_resource_url" className="block text-sm font-bold text-gray-700">
                            Assignment Resource URL (Optional)
                        </label>
                        <div className="mt-1">
                            <input
                                type="url"
                                name="assignment_resource_url"
                                id="assignment_resource_url"
                                placeholder="Link to project boilerplate or instructions"
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                value={formData.assignment_resource_url || ''}
                                onChange={(e) => setFormData({ ...formData, assignment_resource_url: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-6 border-t border-gray-100 pt-6">
                        <h3 className="text-lg font-medium text-gray-900 flex items-center mb-4">
                            <Calendar className="mr-2 h-5 w-5 text-green-500" /> Timeline
                        </h3>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="start_date" className="block text-sm font-bold text-gray-700">
                            Start Date
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="start_date"
                                id="start_date"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                value={formData.start_date}
                                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                            />
                        </div>
                    </div>

                    <div className="sm:col-span-3">
                        <label htmlFor="end_date" className="block text-sm font-bold text-gray-700">
                            End Date (Deadline)
                        </label>
                        <div className="mt-1">
                            <input
                                type="date"
                                name="end_date"
                                id="end_date"
                                required
                                className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md py-2 px-3 border"
                                value={formData.end_date}
                                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                            />
                        </div>
                    </div>
                </div>

                {error && (
                    <div className="rounded-md bg-red-50 p-4 border border-red-200">
                        <div className="flex">
                            <AlertCircle className="h-5 w-5 text-red-400" aria-hidden="true" />
                            <div className="ml-3">
                                <p className="text-sm font-medium text-red-800">{error}</p>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex justify-end pt-6 border-t border-gray-100">
                    <button
                        type="button"
                        onClick={() => router.back()}
                        className="bg-white py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        Cancel
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="ml-3 inline-flex justify-center py-2 px-4 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? (
                            <span className="flex items-center">
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                Saving...
                            </span>
                        ) : (
                            <span className="flex items-center text-bold font-bold">
                                <Save className="-ml-1 mr-2 h-4 w-4" /> Save Phase
                            </span>
                        )}
                    </button>
                </div>
            </form>
        </div>
    );
}
