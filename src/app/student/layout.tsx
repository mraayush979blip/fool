'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, BookOpen } from 'lucide-react';
import Link from 'next/link';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, signOut } = useAuth();

    return (
        <ProtectedRoute requireRole="student">
            <div className="min-h-screen bg-gray-50 flex flex-col">
                <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center">
                                <Link href="/student" className="flex items-center space-x-2">
                                    <div className="bg-blue-600 p-1.5 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                        Learning Portal
                                    </span>
                                </Link>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-sm font-semibold text-gray-900">{user?.user_metadata?.name || user?.email}</span>
                                    <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                                </div>
                                <div className="bg-gray-100 p-2 rounded-full text-gray-600">
                                    <UserIcon className="h-5 w-5" />
                                </div>
                                <button
                                    onClick={() => signOut()}
                                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                                    title="Sign Out"
                                >
                                    <LogOut className="h-5 w-5" />
                                </button>
                            </div>
                        </div>
                    </div>
                </nav>

                <main className="flex-1">
                    {children}
                </main>

                <footer className="bg-white border-t border-gray-200 py-8">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} Phase-Based Learning Portal. All rights reserved.
                        </p>
                    </div>
                </footer>
            </div>
        </ProtectedRoute>
    );
}
