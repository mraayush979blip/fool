'use client';

import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from './NeonLoader';
import { useRouter, usePathname } from 'next/navigation';
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
    const pathname = usePathname();

    useEffect(() => {
        if (!loading) {
            if (!user) {
                router.push('/login');
            } else if (user.status === 'revoked') {
                const isPhasePath = pathname?.startsWith('/student/phase/');
                if (!isPhasePath) {
                    router.push('/revoked');
                }
            } else if (requireRole && user.role !== requireRole) {
                router.push('/unauthorized');
            }
        }
    }, [user, loading, requireRole, router, pathname]);


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

    if (!loading) {
        // Validation logic handles redirects in existing useEffect
        const isPhasePath = pathname?.startsWith('/student/phase/');
        const isRevokedAndBlocked = user?.status === 'revoked' && !isPhasePath;
        
        if (!user || (requireRole && user.role !== requireRole) || isRevokedAndBlocked) {
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
