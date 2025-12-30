'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function ProtectedRoute({
    children,
    requireRole,
}: {
    children: React.ReactNode;
    requireRole?: 'admin' | 'student';
}) {
    const { user, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.status === 'revoked') {
                router.push('/revoked');
            } else if (requireRole && user.role !== requireRole) {
                router.push('/unauthorized');
            }
        }
    }, [user, loading, requireRole, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900"></div>
            </div>
        );
    }

    if (!user || (requireRole && user.role !== requireRole) || user.status === 'revoked') {
        return null;
    }

    return <>{children}</>;
}
