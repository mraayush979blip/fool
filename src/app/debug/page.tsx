'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';

export default function DebugPage() {
    const [authUser, setAuthUser] = useState<any>(null);
    const [dbUser, setDbUser] = useState<any>(null);
    const [error, setError] = useState<string>('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        checkAuth();
    }, []);

    const checkAuth = async () => {
        try {
            // Check auth session
            const { data: { session } } = await supabase.auth.getSession();
            console.log('Session:', session);

            if (session?.user) {
                setAuthUser(session.user);

                // Try to fetch from users table
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('*')
                    .eq('id', session.user.id)
                    .single();

                console.log('User data:', userData);
                console.log('User error:', userError);

                if (userError) {
                    setError(JSON.stringify(userError, null, 2));
                }

                if (userData) {
                    setDbUser(userData);
                }
            }
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const signOut = async () => {
        await supabase.auth.signOut();
        window.location.href = '/login';
    };

    if (loading) {
        return <div className="p-8">Loading...</div>;
    }

    return (
        <div className="p-8 max-w-4xl mx-auto">
            <h1 className="text-2xl font-bold mb-4">Debug Page</h1>

            <div className="space-y-4">
                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-bold mb-2">Auth User (Supabase Auth)</h2>
                    {authUser ? (
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(authUser, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-red-600">No auth user found</p>
                    )}
                </div>

                <div className="bg-white p-4 rounded shadow">
                    <h2 className="font-bold mb-2">Database User (users table)</h2>
                    {dbUser ? (
                        <pre className="bg-gray-100 p-2 rounded text-xs overflow-auto">
                            {JSON.stringify(dbUser, null, 2)}
                        </pre>
                    ) : (
                        <p className="text-red-600">❌ No user found in users table!</p>
                    )}
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 p-4 rounded">
                        <h2 className="font-bold mb-2 text-red-800">Error</h2>
                        <pre className="text-xs text-red-600 overflow-auto">{error}</pre>
                    </div>
                )}

                <div className="bg-blue-50 border border-blue-200 p-4 rounded">
                    <h2 className="font-bold mb-2">Fix Instructions</h2>
                    {authUser && !dbUser && (
                        <div className="space-y-2">
                            <p className="text-sm">Run this SQL in Supabase:</p>
                            <pre className="bg-white p-2 rounded text-xs border">
                                {`INSERT INTO users (id, email, name, role, status)
VALUES (
  '${authUser.id}',
  '${authUser.email}',
  'Admin User',
  'admin',
  'active'
)
ON CONFLICT (id) DO UPDATE SET
  role = 'admin',
  status = 'active';`}
                            </pre>
                        </div>
                    )}
                </div>

                <button
                    onClick={signOut}
                    className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
                >
                    Sign Out
                </button>
            </div>
        </div>
    );
}
