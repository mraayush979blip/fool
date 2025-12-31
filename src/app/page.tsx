'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

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

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return null;
}
