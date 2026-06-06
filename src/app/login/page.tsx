'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from '@/components/NeonLoader';
import { AlertCircle, Loader2, Lock, Mail, ArrowRight, Home, Eye, EyeOff, Shield } from 'lucide-react';
import Link from 'next/link';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);
    const { signIn, user, loading: authLoading } = useAuth();
    const router = useRouter();

    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        if (!authLoading && user) {
            if (user.role === 'admin') {
                window.location.href = '/admin';
            } else {
                window.location.href = '/student';
            }
        }
    }, [user, authLoading, router]);

    if (!mounted || authLoading) {
        return <NeonLoader />;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    await ((document.documentElement as any).webkitRequestFullscreen)();
                }
            } catch (e) {
                console.warn('Fullscreen request failed:', e);
            }
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to authenticate');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-background p-4 font-sans">
            <div className="w-full max-w-md bg-card border border-card-border rounded-3xl shadow-sm overflow-hidden flex flex-col">
                <div className="p-8 sm:p-10 flex-1">
                    {/* Header */}
                    <div className="flex flex-col items-center mb-8 text-center">
                        <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center mb-6 border border-primary/20">
                            <Shield className="w-6 h-6 text-primary" />
                        </div>
                        <h1 className="text-2xl font-black text-foreground tracking-tight mb-1">
                            Welcome back
                        </h1>
                        <p className="text-sm text-muted">
                            Log in to access your Levelone dashboard
                        </p>
                    </div>

                    {/* Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-500 p-3 rounded-xl flex items-center gap-3 text-sm font-medium">
                                <AlertCircle className="h-4 w-4 shrink-0" />
                                <p>{error}</p>
                            </div>
                        )}

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted ml-1">Email</label>
                            <div className="relative">
                                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="user@example.com"
                                    className="w-full !pl-11 pr-4 py-3 bg-background border border-card-border rounded-xl text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label className="text-xs font-bold text-muted ml-1">Password</label>
                            <div className="relative">
                                <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted" />
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    className="w-full !pl-11 pr-10 py-3 bg-background border border-card-border rounded-xl text-foreground placeholder:text-muted focus:border-primary focus:ring-1 focus:ring-primary transition-all outline-none"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted hover:text-foreground transition-colors z-10"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            className="w-full py-3.5 mt-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl font-bold transition-all flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:pointer-events-none"
                        >
                            {loading ? (
                                <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                                <>
                                    Log In
                                    <ArrowRight className="h-4 w-4" />
                                </>
                            )}
                        </button>
                    </form>

                    <div className="mt-8 flex items-center justify-center">
                        <Link href="/" className="inline-flex items-center gap-2 text-xs font-semibold text-muted hover:text-foreground transition-colors">
                            <Home className="h-3.5 w-3.5" />
                            Return Home
                        </Link>
                    </div>
                </div>

                <div className="p-4 border-t border-card-border bg-card-border/10 text-center flex items-center justify-between">
                    <p className="text-[10px] text-muted font-semibold tracking-wider uppercase">LevelOne Systems</p>
                    <button
                        type="button"
                        onClick={async () => {
                            if (confirm('Cleanse the cache?')) {
                                localStorage.clear();
                                if ('serviceWorker' in navigator) {
                                    const regs = await navigator.serviceWorker.getRegistrations();
                                    for (const reg of regs) await reg.unregister();
                                }
                                window.location.reload();
                            }
                        }}
                        className="text-[10px] font-bold text-red-500 hover:text-red-400 transition-colors uppercase"
                    >
                        Reset Cache
                    </button>
                </div>
            </div>
        </div>
    );
}
