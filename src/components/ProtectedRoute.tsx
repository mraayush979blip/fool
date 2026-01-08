'use client';

import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from './NeonLoader';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

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


    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (loading) {
            // Only show loader if loading takes longer than 500ms
            timeoutId = setTimeout(() => setShowLoader(true), 500);
        } else {
            setShowLoader(false);
        }
        return () => clearTimeout(timeoutId);
    }, [loading]);

    // Show children immediately if not loading
    if (!loading) {
        // Validation logic handles redirects in existing useEffect
        if (!user || (requireRole && user.role !== requireRole) || user.status === 'revoked') {
            return null;
        }
        return <>{children}</>;
    }

    // If loading, show NeonLoader only if threshold passed
    if (showLoader) {
        return <NeonLoader />;
    }

    // While loading but before threshold, render nothing (or minimal spinner if preferred)
    return null;
}
