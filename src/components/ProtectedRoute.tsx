'use client';

import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from './NeonLoader';
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
        return <NeonLoader />;
    }

    if (!user || (requireRole && user.role !== requireRole) || user.status === 'revoked') {
        return null;
    }

    return <>{children}</>;
}
