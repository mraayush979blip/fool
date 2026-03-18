'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Menu, X, LogOut, Palette, MessageSquare, Bug, ChevronRight, Sun, Zap, Check, Users, Download, Smartphone, Sparkles } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import Link from 'next/link';
import { cn } from '@/lib/utils';

const themes = [
    { id: 'theme-light', name: 'Ivory', icon: Sun, color: '#0891b2' },
    { id: 'theme-dark', name: 'Midnight', icon: Zap, color: '#f59e0b' }
];

export default function NavigationMenu() {
    const [isOpen, setIsOpen] = useState(false);
    const { user, signOut, updateTheme } = useAuth();
    const { isInstallable, handleInstallClick } = usePWAInstall();
    const [mounted, setMounted] = useState(false);
    const [showInstallModal, setShowInstallModal] = useState(false);

    // Detect iOS and Standalone
    const isIOS = typeof navigator !== 'undefined' && /iPad|iPhone|iPod/.test(navigator.userAgent);
    const isStandalone = typeof window !== 'undefined' && window.matchMedia('(display-mode: standalone)').matches;

    useEffect(() => {
        setMounted(true);
    }, []);

    const currentTheme = user?.equipped_theme || 'theme-light';

    const menuVariants = {
        closed: {
            opacity: 0,
            scale: 0.95,
            y: -10,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        },
        open: {
            opacity: 1,
            scale: 1,
            y: 0,
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 30
            }
        }
    } as const;

    if (!mounted) {
        return (
            <button className="p-3 rounded-xl bg-card border border-card-border opacity-50">
                <Menu className="h-5 w-5 text-foreground" />
            </button>
        );
    }

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
                        {/* Overlay */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                            className="fixed inset-0 z-40 bg-black/5 dark:bg-black/40 backdrop-blur-[2px]"
                        />

                        {/* Dropdown Card */}
                        <motion.div
                            variants={menuVariants}
                            initial="closed"
                            animate="open"
                            exit="closed"
                            className="absolute right-0 mt-3 w-72 bg-card border border-card-border rounded-[2.5rem] shadow-2xl z-50 p-6 space-y-6 overflow-hidden"
                        >
                            {/* User Info Header */}
                            <div className="flex items-center gap-4 pb-4 border-b border-card-border">
                                <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-lg border border-primary/20">
                                    {user?.equipped_avatar || '👤'}
                                </div>
                                <div className="min-w-0">
                                    <p className="text-sm font-black text-foreground truncate">{user?.name || 'Student'}</p>
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted">Academic Node</p>
                                </div>
                            </div>

                            {/* Menu Sections */}
                            <div className="space-y-6">
                                {/* Action Buttons */}
                                <div className="space-y-1">
                                    {/* ALWAYS VISIBLE Install/Update Button - MOVED TO TOP */}
                                    <button
                                        onClick={() => {
                                            if (isStandalone) {
                                                window.location.reload(); // Refresh check
                                            } else {
                                                setShowInstallModal(true);
                                                setIsOpen(false);
                                            }
                                        }}
                                        className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all group shadow-sm shadow-primary/10 hover:bg-primary/20 mb-2"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30">
                                                <Smartphone className="h-4 w-4 text-primary animate-pulse" />
                                            </div>
                                            <span className="text-xs font-black tracking-tight">
                                                {isStandalone ? 'Check for Update' : 'Install Levelone'}
                                            </span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <span className="text-[8px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full">New</span>
                                            <ChevronRight className="h-3 w-3 opacity-50" />
                                        </div>
                                    </button>

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
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>

                                    <Link
                                        href="/student/team"
                                        onClick={() => setIsOpen(false)}
                                        className="w-full flex items-center justify-between p-3 rounded-xl hover:bg-primary/5 text-muted hover:text-primary transition-all group"
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-primary/10 rounded-lg group-hover:bg-primary/20">
                                                <Users className="h-4 w-4 text-primary" />
                                            </div>
                                            <span className="text-xs font-bold tracking-tight">Our Team</span>
                                        </div>
                                        <ChevronRight className="h-3.5 w-3.5 opacity-0 group-hover:opacity-100 transition-opacity" />
                                    </Link>

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

                                <div className="h-px bg-card-border mx-2" />

                                {/* Appearance Section */}
                                <div className="px-1">
                                    <p className="text-[9px] font-black uppercase tracking-widest text-muted mb-4 flex items-center gap-2">
                                        <Palette className="w-3 h-3" /> Appearance
                                    </p>
                                    <div className="grid grid-cols-3 gap-2">
                                        {themes.map((themeObj) => (
                                            <button
                                                key={themeObj.id}
                                                onClick={() => updateTheme(themeObj.id)}
                                                className={cn(
                                                    "flex flex-col items-center gap-2 p-3 rounded-2xl border transition-all relative group",
                                                    currentTheme === themeObj.id
                                                        ? "bg-primary/10 border-primary text-primary shadow-sm shadow-primary/10"
                                                        : "bg-background border-card-border text-muted hover:border-primary/30 hover:text-foreground"
                                                )}
                                            >
                                                <themeObj.icon className={cn("w-4 h-4 transition-transform", currentTheme === themeObj.id ? "scale-110" : "group-hover:scale-110")} />
                                                <span className="text-[9px] font-black uppercase tracking-widest">{themeObj.name}</span>
                                                {currentTheme === themeObj.id && (
                                                    <div className="absolute top-1 right-1">
                                                        <div className="bg-primary p-0.5 rounded-full">
                                                            <Check className="w-2.5 h-2.5 text-white" />
                                                        </div>
                                                    </div>
                                                )}
                                            </button>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="pt-2 text-center">
                                <p className="text-[8px] font-black uppercase tracking-widest text-muted opacity-40">Levelone Node v2.5.0</p>
                            </div>
                        </motion.div>
                    </>
                )}
            </AnimatePresence>

            {/* PWA Benefits & Install Modal */}
            <AnimatePresence>
                {showInstallModal && (
                    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6">
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setShowInstallModal(false)}
                            className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
                        />
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0, y: 20 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.9, opacity: 0, y: 20 }}
                            className="relative w-full max-w-md bg-card border border-card-border rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                        >
                            {/* Header */}
                            <div className="relative z-10 text-center mb-8">
                                <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                                    <Smartphone className="h-8 w-8 text-primary" />
                                </div>
                                <h3 className="text-xl font-black text-foreground mb-2">Install Levelone App</h3>
                                <p className="text-sm text-muted">Get the premium learning experience on your home screen.</p>
                            </div>

                            {/* Benefits List */}
                            <div className="space-y-4 mb-8">
                                {[
                                    { title: 'Offline Access', desc: 'Continue learning even without internet.', icon: Zap },
                                    { title: 'Instant Loading', desc: 'App opens instantly from your home screen.', icon: Sparkles },
                                    { title: 'Push Notifications', desc: 'Never miss a session or update.', icon: MessageSquare }
                                ].map((benefit, idx) => (
                                    <div key={idx} className="flex items-start gap-4 p-4 rounded-2xl bg-primary/5 border border-primary/10">
                                        <div className="p-2 bg-primary/10 rounded-lg">
                                            <benefit.icon className="h-4 w-4 text-primary" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-bold text-foreground">{benefit.title}</p>
                                            <p className="text-[10px] text-muted leading-relaxed">{benefit.desc}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>

                            {/* iOS Guide Section */}
                            {isIOS ? (
                                <div className="p-5 bg-foreground/5 rounded-2xl border border-card-border mb-6">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-3">How to Install on iOS</p>
                                    <ol className="text-[11px] text-muted font-bold space-y-3">
                                        <li className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">1</span>
                                            <span>Tap the <strong className="text-foreground">Share</strong> icon in Safari footer.</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">2</span>
                                            <span>Scroll down to <strong className="text-foreground">Add to Home Screen</strong>.</span>
                                        </li>
                                        <li className="flex items-center gap-3">
                                            <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-[10px]">3</span>
                                            <span>Tap <strong className="text-foreground">Add</strong> in the top right.</span>
                                        </li>
                                    </ol>
                                </div>
                            ) : (
                                <div className="space-y-3">
                                    <button
                                        onClick={() => {
                                            if (isInstallable) {
                                                handleInstallClick();
                                                setShowInstallModal(false);
                                            } else {
                                                alert('Installation prompt not ready. Make sure you are using Chrome or Edge.');
                                            }
                                        }}
                                        className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group"
                                    >
                                        <Download className="w-4 h-4 group-hover:bounce" />
                                        Confirm Installation
                                    </button>
                                    {!isInstallable && (
                                        <p className="text-[9px] text-center text-muted font-bold animate-pulse">
                                            Note: If you are on localhost, use "http://localhost:3000" only.
                                        </p>
                                    )}
                                </div>
                            )}

                            <button
                                onClick={() => setShowInstallModal(false)}
                                className="w-full py-2 mt-4 text-muted font-bold text-[10px] uppercase tracking-widest hover:text-foreground transition-colors"
                            >
                                Not now, continue in browser
                            </button>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>
        </div>
    );
}
