'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
    Plus,
    Search,
    MoreVertical,
    Pause,
    Play,
    Edit2,
    Trash2,
    ExternalLink,
    Layers
} from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { Phase } from '@/types/database';
import { format } from 'date-fns';

export default function PhaseListPage() {
    const [phases, setPhases] = useState<Phase[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');

    useEffect(() => {
        fetchPhases();
    }, []);

    const fetchPhases = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from('phases')
                .select('*')
                .order('phase_number', { ascending: true });

            if (error) throw error;
            setPhases(data || []);
        } catch (error) {
            console.error('Error fetching phases:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePause = async (phase: Phase) => {
        try {
            const { error } = await supabase
                .from('phases')
                .update({
                    is_paused: !phase.is_paused,
                    paused_at: !phase.is_paused ? new Date().toISOString() : null
                })
                .eq('id', phase.id);

            if (error) throw error;
            fetchPhases();
        } catch (error) {
            console.error('Error toggling phase status:', error);
        }
    };

    const deletePhase = async (id: string) => {
        if (!confirm('Are you sure you want to delete this phase? This will also delete all student submissions for this phase.')) return;

        try {
            const { error } = await supabase
                .from('phases')
                .delete()
                .eq('id', id);

            if (error) throw error;
            fetchPhases();
        } catch (error) {
            console.error('Error deleting phase:', error);
        }
    };

    const filteredPhases = phases.filter(phase =>
        phase.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        phase.phase_number.toString().includes(searchQuery)
    );

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Learning Phases</h1>
                    <p className="mt-1 text-sm text-gray-500">
                        Manage your curriculum phases and student deadlines.
                    </p>
                </div>
                <Link
                    href="/admin/phases/new"
                    className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                    <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                    Create Phase
                </Link>
            </div>

            {/* Search and Filter */}
            <div className="flex items-center px-4 py-3 bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="relative flex-1">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Search className="h-5 w-5 text-gray-400" aria-hidden="true" />
                    </div>
                    <input
                        type="text"
                        className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="Search phases by title or number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
            </div>

            {/* Phase Grid */}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                </div>
            ) : filteredPhases.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg border border-gray-200 shadow-sm">
                    <Layers className="mx-auto h-12 w-12 text-gray-400" />
                    <h3 className="mt-2 text-sm font-medium text-gray-900">No phases found</h3>
                    <p className="mt-1 text-sm text-gray-500">Get started by creating a new learning phase.</p>
                    <div className="mt-6">
                        <Link
                            href="/admin/phases/new"
                            className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
                        >
                            <Plus className="-ml-1 mr-2 h-5 w-5" aria-hidden="true" />
                            New Phase
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="bg-white shadow overflow-hidden sm:rounded-md border border-gray-200">
                    <ul className="divide-y divide-gray-200">
                        {filteredPhases.map((phase) => (
                            <li key={phase.id}>
                                <div className="px-4 py-4 flex items-center sm:px-6 hover:bg-gray-50 transition-colors">
                                    <div className="min-w-0 flex-1 sm:flex sm:items-center sm:justify-between">
                                        <div className="truncate">
                                            <div className="flex items-center text-sm font-medium text-blue-600 truncate">
                                                <span className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-bold mr-3">
                                                    Phase {phase.phase_number}
                                                </span>
                                                <span className="text-lg font-bold text-gray-900">{phase.title}</span>
                                            </div>
                                            <div className="mt-2 flex">
                                                <div className="flex items-center text-sm text-gray-500 mr-6">
                                                    <span>
                                                        {new Date(phase.start_date).toLocaleDateString()} - {new Date(phase.end_date).toLocaleDateString()}
                                                    </span>
                                                </div>
                                                <div className="flex items-center">
                                                    {phase.is_paused ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                                            Paused
                                                        </span>
                                                    ) : phase.status === 'live' ? (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                                            Live
                                                        </span>
                                                    ) : (
                                                        <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-gray-100 text-gray-800">
                                                            {phase.status}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="ml-5 flex-shrink-0 flex space-x-2">
                                        <button
                                            onClick={() => togglePause(phase)}
                                            title={phase.is_paused ? "Resume Phase" : "Pause Phase"}
                                            className="p-2 text-gray-400 hover:text-yellow-600 transition-colors"
                                        >
                                            {phase.is_paused ? <Play className="h-5 w-5" /> : <Pause className="h-5 w-5" />}
                                        </button>
                                        <Link
                                            href={`/admin/phases/${phase.id}/edit`}
                                            className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                                        >
                                            <Edit2 className="h-5 w-5" />
                                        </Link>
                                        <button
                                            onClick={() => deletePhase(phase.id)}
                                            className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                        >
                                            <Trash2 className="h-5 w-5" />
                                        </button>
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );
}
