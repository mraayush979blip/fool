'use client';

import ProtectedRoute from '@/components/ProtectedRoute';
import dynamic from 'next/dynamic';

const AdminSidebar = dynamic(() => import('@/components/AdminSidebar'), {
    ssr: false,
    loading: () => <div className="w-64 bg-white border-r border-gray-200 hidden md:block" />
});

export default function AdminLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <ProtectedRoute requireRole="admin">
            <div className="flex flex-col md:flex-row h-screen bg-gray-50">
                <AdminSidebar />
                <div className="flex-1 flex flex-col overflow-hidden">
                    <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-4 md:p-8">
                        {children}
                    </main>
                </div>
            </div>
        </ProtectedRoute>
    );
}

