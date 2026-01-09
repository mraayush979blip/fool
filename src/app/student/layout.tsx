'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, BookOpen, Trophy, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import ActivityTracker from '@/components/gamification/ActivityTracker';

export default function StudentLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const { user, signOut } = useAuth();
    const pathname = usePathname();

    const MobileNavLink = ({ href, icon: Icon, label, isActive }: { href: string; icon: any; label: string; isActive: boolean }) => (
        <Link
            href={href}
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 ${isActive ? 'text-blue-600' : 'text-gray-500 hover:text-gray-900'
                }`}
        >
            <Icon className={`h-6 w-6 ${isActive ? 'text-blue-600' : 'text-gray-500'}`} />
            <span className="text-xs font-medium">{label}</span>
        </Link>
    );

    return (
        <ProtectedRoute requireRole="student">
            <ActivityTracker />
            <div className="min-h-screen bg-gray-50 flex flex-col pb-16 md:pb-0">
                <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center space-x-8">
                                <Link href="/student" className="flex items-center space-x-2">
                                    <div className="bg-blue-600 p-1.5 rounded-lg">
                                        <BookOpen className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600">
                                        Levelone
                                    </span>
                                </Link>

                                <div className="hidden md:flex items-center space-x-4">
                                    <Link
                                        href="/student"
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${pathname === '/student'
                                            ? 'bg-blue-50 text-blue-700'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/student/compete"
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center ${pathname === '/student/compete'
                                            ? 'bg-yellow-50 text-yellow-700'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <Trophy className="h-4 w-4 mr-1.5" />
                                        Compete
                                    </Link>
                                    <Link
                                        href="/student/store"
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center ${pathname === '/student/store'
                                            ? 'bg-purple-50 text-purple-700'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50'
                                            }`}
                                    >
                                        <ShoppingBag className="h-4 w-4 mr-1.5" />
                                        Rewards
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-center space-x-4">
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-sm font-semibold text-gray-900">{user?.name || user?.email}</span>
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

                <footer className="hidden md:block bg-white border-t border-gray-200 py-8">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} Levelone - sab ka sath sab vikas. All rights reserved.
                        </p>
                    </div>
                </footer>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 h-16 z-50 pb-safe">
                    <div className="grid grid-cols-3 h-full">
                        <MobileNavLink
                            href="/student"
                            icon={BookOpen}
                            label="Dashboard"
                            isActive={pathname === '/student'}
                        />
                        <MobileNavLink
                            href="/student/compete"
                            icon={Trophy}
                            label="Compete"
                            isActive={pathname === '/student/compete'}
                        />
                        <MobileNavLink
                            href="/student/store"
                            icon={ShoppingBag}
                            label="Rewards"
                            isActive={pathname === '/student/store'}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
