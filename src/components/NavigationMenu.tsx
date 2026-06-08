'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Palette, ChevronRight, Sun, Zap, Check, Users, Bug, HelpCircle, Shield, Smartphone } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Link from 'next/link';
import { cn } from '@/lib/utils';


const themes = [
    { id: 'theme-light', name: 'Ivory', icon: Sun },
    { id: 'theme-dark', name: 'Midnight', icon: Zap }
];

export default function NavigationMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut, updateTheme } = useAuth();
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = user?.equipped_theme || 'theme-light';

    const menuVariants: any = {
        closed: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        },
        open: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: { type: 'spring', stiffness: 300, damping: 30 }
        }
    };

    if (!mounted) return (
        <button className="p-3 rounded-xl bg-card border border-card-border opacity-50">
            <Menu className="h-5 w-5 text-foreground" />
        </button>
    );

    return (
        <div className="relative">
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-3 rounded-xl bg-card border border-card-border hover:border-primary/30 transition-all active:scale-95 group relative z-50 shadow-sm"
                aria-label="Toggle Menu"
            >
                {isOpen ? <X className="h-5 w-5 text-foreground" /> : <Menu className="h-5 w-5 text-foreground" />}
            </button>

            <AnimatePresence>
                {isOpen && (
                    <>
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/5 dark:bg-black/40 backdrop-blur-[2px]"
                        />

                        <motion.div
                            variants={menuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="absolute right-0 mt-3 w-72 bg-card border border-card-border rounded-[2.5rem] shadow-2xl z-50 p-6 space-y-6 overflow-hidden"
                        >
                            {/* User Header */}
                            <div className="flex items-center gap-4 pb-4 border-b border-card-border">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg border border-primary/20">
                                    {user?.equipped_avatar || '👤'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-foreground truncate">{user?.name || 'Student'}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Academic Node</p>
                                </div>
                            </div>

                            <div className="space-y-6">
                                {/* Install App — links to the dedicated /install guide */}
                                <div className="px-1">
                                    <Link
                                        href="/install"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all group shadow-sm shadow-primary/10 hover:bg-primary/20"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30">
                                                <Smartphone className="h-4 w-4 text-primary animate-pulse" />
                                            </div>
                                            <span className="text-xs font-black tracking-tight">Install Levelone</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[8px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full">New</span>
                                            <ChevronRight className="h-3 w-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                                        </div>
                                    </Link>
                                </div>

                                <div className="space-y-1">
                                    <Link
                                        href="/student/tutorial"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                                                <HelpCircle className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">How to Use</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:translate-x-0.5 transition-all" />
                                    </Link>

                                    <Link
                                        href="/student/report"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                                                <Bug className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">Report Bug or Review</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:translate-x-0.5 transition-all" />
                                    </Link>

                                    <div className="w-full flex items-center justify-center p-4 rounded-xl border border-primary/10 bg-gradient-to-r from-primary/5 to-transparent relative overflow-hidden">
                                        <div className="absolute top-0 right-0 w-16 h-16 bg-primary/10 blur-xl rounded-full translate-x-1/2 -translate-y-1/2" />
                                        <div className="flex items-center gap-2">
                                            <Shield className="h-4 w-4 text-primary" />
                                            <span className="text-xs font-black tracking-[0.2em] text-primary uppercase">LEVELONE</span>
                                        </div>
                                    </div>

                                    <button
                                        onClick={() => {
                                            signOut();
                                            setIsOpen(false);
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-red-500/5 text-muted hover:text-red-500 transition-all group mt-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-red-500/10 rounded-lg group-hover:bg-red-500/20">
                                                <LogOut className="h-4 w-4 text-red-500" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight text-red-500/80">Logout</span>
                                        </div>
                                    </button>
                                </div>


                            </div>
                            <div className="pt-2 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Levelone Node v2.5.5</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </div>
    );
}
