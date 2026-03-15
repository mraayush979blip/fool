'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import NeonLoader from '@/components/NeonLoader';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { AlertCircle, ArrowRight, Loader2, Lock, Mail, Shield } from 'lucide-react';

export default function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const { signIn, user, loading: authLoading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!authLoading && user) {
            router.push('/');
        }
    }, [user, authLoading, router]);

    const [showLoader, setShowLoader] = useState(false);

    useEffect(() => {
        let timeoutId: NodeJS.Timeout;
        if (authLoading) {
            timeoutId = setTimeout(() => setShowLoader(true), 500);
        } else {
            setShowLoader(false);
        }
        return () => clearTimeout(timeoutId);
    }, [authLoading]);

    if (authLoading) {
        if (showLoader) {
            return <NeonLoader />;
        }
        return null;
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signIn(email, password);
            router.push('/');
        } catch (err: any) {
            console.error('Login error:', err);
            setError(err.message || 'Failed to sign in');
        } finally {
            setLoading(false);
        }
    };

    const containerVariants: Variants = {
        hidden: { opacity: 0, y: 20 },
        visible: { 
            opacity: 1, 
            y: 0,
            transition: { 
                type: "spring" as const,
                stiffness: 100,
                damping: 20,
                staggerChildren: 0.1,
                delayChildren: 0.2
            }
        }
    };

    const itemVariants: Variants = {
        hidden: { opacity: 0, x: -10 },
        visible: { 
            opacity: 1, 
            x: 0,
            transition: { type: "spring" as const, stiffness: 100 }
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-black overflow-hidden relative font-sans">
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_0%,transparent_70%)] pointer-events-none" />
            
            <motion.div 
                initial="hidden"
                animate="visible"
                variants={containerVariants}
                className="w-full max-w-md p-8 relative z-10"
            >
                {/* Logo Section */}
                <div className="flex flex-col items-center mb-12">
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 0.8, ease: "easeOut" }}
                        className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(255,255,255,0.2)] relative"
                    >
                        <div className="w-6 h-6 bg-black rotate-45" />
                        <div className="absolute inset-0 rounded-full border border-white/20 animate-ping" />
                    </motion.div>
                    
                    <h1 className="text-4xl md:text-5xl font-black text-white tracking-tighter mb-2">
                        LEVELONE
                    </h1>
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/40">
                        Institutional Node Login
                    </p>
                </div>

                {/* Form Section */}
                <form onSubmit={handleSubmit} className="space-y-5">
                    <motion.div variants={itemVariants} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                            Identification
                        </label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                required
                                placeholder="name@organization.com"
                                className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 outline-none focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/50 transition-all"
                            />
                        </div>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2">
                        <label className="text-[10px] font-black uppercase tracking-widest text-white/50 ml-1">
                            Credential
                        </label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-white/20 group-focus-within:text-white/60 transition-colors" />
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                placeholder="••••••••"
                                className="w-full pl-11 pr-4 py-4 bg-white/5 border border-white/10 rounded-2xl text-white placeholder:text-white/20 outline-none focus:bg-white/10 focus:border-white/20 focus:ring-1 focus:ring-white/50 transition-all"
                            />
                        </div>
                    </motion.div>

                    <AnimatePresence>
                        {error && (
                            <motion.div 
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="bg-red-500/10 border border-red-500/20 p-4 rounded-xl flex items-center gap-3 overflow-hidden"
                            >
                                <AlertCircle className="h-4 w-4 text-red-500 shrink-0" />
                                <span className="text-[10px] font-black uppercase tracking-widest text-red-500">
                                    {error}
                                </span>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    <motion.button
                        variants={itemVariants}
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.98 }}
                        disabled={loading}
                        className="w-full py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl shadow-[0_0_40px_rgba(255,255,255,0.15)] hover:shadow-[0_0_50px_rgba(255,255,255,0.25)] transition-all flex items-center justify-center gap-3 disabled:opacity-50 mt-4"
                    >
                        {loading ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                            <>
                                Authenticate
                                <ArrowRight className="h-4 w-4" />
                            </>
                        )}
                    </motion.button>
                </form>

                {/* Footer Section */}
                <motion.div 
                    variants={itemVariants}
                    className="mt-12 pt-8 border-t border-white/5 flex flex-col items-center gap-6"
                >
                    <button
                        type="button"
                        onClick={async () => {
                            if (confirm('Initiate complete system cache purge?')) {
                                localStorage.clear();
                                if ('serviceWorker' in navigator) {
                                    const regs = await navigator.serviceWorker.getRegistrations();
                                    for (const reg of regs) await reg.unregister();
                                }
                                window.location.reload();
                            }
                        }}
                        className="text-white/20 hover:text-red-500 text-[9px] font-black uppercase tracking-[0.2em] transition-colors flex items-center gap-2"
                    >
                        <Shield className="h-3 w-3" />
                        Reset Core Buffer
                    </button>
                    
                    <div className="flex flex-col items-center">
                        <p className="text-white/10 text-[8px] font-black uppercase tracking-widest">
                            Secure Shell Protocol v2.4.0
                        </p>
                        <p className="text-white/10 text-[8px] font-black uppercase tracking-widest">
                            © 2026 Levelone Data Systems
                        </p>
                    </div>
                </motion.div>
            </motion.div>
        </div>
    );
}
