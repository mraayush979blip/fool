'use client';

import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from '@/components/NeonLoader';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function HomePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    console.log('🏠 [Home] Auth state:', { loading, userEmail: user?.email, userRole: user?.role });
    if (!loading) {
      if (!user) {
        console.log('🏠 [Home] No user, redirecting to login');
        router.push('/login');
      } else if (user.role === 'admin') {
        console.log('🏠 [Home] Admin detected, redirecting to /admin');
        router.push('/admin');
      } else if (user.role === 'student') {
        console.log('🏠 [Home] Student detected, redirecting to /student');
        router.push('/student');
      }
    }
  }, [user, loading, router]);


  const [showLoader, setShowLoader] = useState(false);

  useEffect(() => {
    let timeoutId: NodeJS.Timeout;
    if (loading) {
      timeoutId = setTimeout(() => setShowLoader(true), 500);
    } else {
      setShowLoader(false);
    }
    return () => clearTimeout(timeoutId);
  }, [loading]);

  if (loading) {
    if (showLoader) {
      return <NeonLoader />;
    }
    return null;
  }

  return null;
}
