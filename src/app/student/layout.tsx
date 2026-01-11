'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import { useAuth } from '@/contexts/AuthContext';
import { LogOut, User as UserIcon, BookOpen, Trophy, ShoppingBag } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import InstallPWA from '@/components/InstallPWA';

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
            className={`flex flex-col items-center justify-center w-full h-full space-y-1 relative transition-all duration-300 ${isActive ? 'text-blue-600 scale-105' : 'text-gray-500 hover:text-gray-900'
                }`}
        >
            {isActive && (
                <span className="absolute -top-1 w-1 h-1 bg-blue-600 rounded-full animate-pulse" />
            )}
            <Icon className={`h-6 w-6 transition-transform ${isActive ? 'text-blue-600 animate-nav-active' : 'text-gray-500'}`} />
            <span className="text-[10px] font-bold uppercase tracking-wider">{label}</span>
        </Link>
    );

    return (
        <ProtectedRoute requireRole="student">
            <div
                className="min-h-screen flex flex-col pb-20 md:pb-0 transition-colors duration-500"
                style={{ backgroundColor: 'var(--background)', color: 'var(--foreground)' }}
                data-theme={user?.equipped_theme || 'default'}
            >
                <nav className="sticky top-0 border-b transition-colors relative z-50 glass border-b-[var(--card-border)]">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                        <div className="flex justify-between h-16">
                            <div className="flex items-center space-x-8">
                                <Link href="/student" className="flex items-center space-x-2">
                                    <div className="bg-blue-600 p-1.5 rounded-lg shadow-blue-500/20 shadow-lg">
                                        <BookOpen className="h-6 w-6 text-white" />
                                    </div>
                                    <span className="text-xl font-black bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-indigo-600 tracking-tighter">
                                        Levelone
                                    </span>
                                </Link>

                                <div className="hidden md:flex items-center space-x-4">
                                    <Link
                                        href="/student"
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors ${pathname === '/student'
                                            ? 'bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        Dashboard
                                    </Link>
                                    <Link
                                        href="/student/compete"
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center ${pathname === '/student/compete'
                                            ? 'bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <Trophy className="h-4 w-4 mr-1.5" />
                                        Compete
                                    </Link>
                                    <Link
                                        href="/student/store"
                                        className={`px-3 py-2 rounded-lg text-sm font-bold transition-colors flex items-center ${pathname === '/student/store'
                                            ? 'bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'
                                            : 'text-gray-500 hover:text-gray-900 hover:bg-gray-50 dark:hover:bg-gray-800'
                                            }`}
                                    >
                                        <ShoppingBag className="h-4 w-4 mr-1.5" />
                                        Rewards
                                    </Link>
                                </div>
                            </div>

                            <div className="flex items-center space-x-2 md:space-x-4">
                                <InstallPWA />
                                <div className="hidden md:flex flex-col items-end mr-2">
                                    <span className="text-sm font-semibold text-gray-900 dark:text-white">{user?.name || user?.email}</span>
                                    <span className="text-xs text-gray-500 capitalize">{user?.role}</span>
                                </div>
                                <div className="bg-gray-100 dark:bg-gray-800 h-9 w-9 rounded-full flex items-center justify-center text-xl shadow-inner border border-gray-200 dark:border-gray-700">
                                    {user?.equipped_avatar || '👤'}
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

                <main className="flex-1 pb-10">
                    {children}
                </main>

                <footer className="hidden md:block border-t py-8 transition-colors bg-[var(--card-bg)] border-[var(--card-border)]">
                    <div className="max-w-7xl mx-auto px-4 text-center">
                        <p className="text-sm text-gray-500">
                            &copy; {new Date().getFullYear()} Levelone - sab ka sath sab vikas. All rights reserved.
                        </p>
                    </div>
                </footer>

                {/* Mobile Bottom Navigation */}
                <div className="md:hidden fixed bottom-4 left-4 right-4 h-16 z-50 glass rounded-2xl border shadow-2xl border-[var(--card-border)] overflow-hidden">
                    <div className="grid grid-cols-3 h-full">
                        <MobileNavLink
                            href="/student"
                            icon={BookOpen}
                            label="Learn"
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
                            label="Store"
                            isActive={pathname === '/student/store'}
                        />
                    </div>
                </div>
            </div>
        </ProtectedRoute>
    );
}
