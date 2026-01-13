'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    LayoutDashboard,
    Layers,
    Users,
    Upload,
    Settings,
    LogOut,
    FileText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';
import InstallPWA from './InstallPWA';

const navItems = [
    { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
    { name: 'Phases', href: '/admin/phases', icon: Layers },
    { name: 'Assignment', href: '/admin/assignment', icon: FileText },
    { name: 'Students', href: '/admin/students', icon: Users },
    { name: 'Import CSV', href: '/admin/student-import', icon: Upload },
];

export default function AdminSidebar() {
    const pathname = usePathname();
    const { signOut, user } = useAuth();

    return (
        <div className="flex flex-col w-64 bg-white border-r border-gray-200">
            <div className="flex flex-col flex-grow pt-5 pb-4 overflow-y-auto">
                <div className="flex items-center flex-shrink-0 px-4 mb-8">
                    <span className="text-xl font-black text-gray-900 tracking-tighter">Levelone</span>
                    <span className="ml-2 px-1.5 py-0.5 text-[10px] font-bold text-blue-600 bg-blue-50 rounded uppercase tracking-wider">Admin</span>
                </div>
                <nav className="flex-1 px-2 space-y-1 bg-white">
                    {navItems.map((item) => {
                        const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                        return (
                            <Link
                                key={item.name}
                                href={item.href}
                                className={cn(
                                    'group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors',
                                    isActive
                                        ? 'bg-blue-50 text-blue-700'
                                        : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                                )}
                            >
                                <item.icon
                                    className={cn(
                                        'mr-3 flex-shrink-0 h-5 w-5',
                                        isActive ? 'text-blue-700' : 'text-gray-400 group-hover:text-gray-500'
                                    )}
                                    aria-hidden="true"
                                />
                                {item.name}
                            </Link>
                        );
                    })}
                </nav>
            </div>
            <div className="flex-shrink-0 flex flex-col border-t border-gray-200 p-4 space-y-4">
                <InstallPWA />
                <div className="flex-shrink-0 w-full group block">
                    <div className="flex items-center">
                        <div className="ml-3">
                            <p className="text-sm font-medium text-gray-700">{user?.name}</p>
                            <button
                                onClick={() => signOut()}
                                className="flex items-center text-xs font-medium text-gray-500 group-hover:text-gray-700 mt-1"
                            >
                                <LogOut className="mr-1 h-3 w-3" />
                                Sign Out
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
