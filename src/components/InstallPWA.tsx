'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, Smartphone, Sparkles, Zap, MessageSquare, X, ChevronRight, Share, PlusSquare, ArrowUpCircle } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { cn } from '@/lib/utils';

interface InstallPWAProps {
    variant?: 'header' | 'menu';
}

export default function InstallPWA({ variant = 'header' }: InstallPWAProps) {
    const { isInstallable, isStandalone, isIOS, handleInstallClick } = usePWAInstall();
    const [showModal, setShowModal] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    const isInstalled = isStandalone;

    const onActionClick = () => {
        if (isInstalled) {
            console.log('🔄 PWA ENGINE: Clearing cache and reloading core...');
            if ('caches' in window) {
                caches.keys().then((names) => {
                    for (const name of names) caches.delete(name);
                });
            }
            localStorage.clear();
            sessionStorage.clear();
            window.location.reload();
        } else {
            setShowModal(true);
        }
    };

    const renderTrigger = () => {
        if (variant === 'header') {
            return (
                <button
                    onClick={onActionClick}
                    className="p-2 bg-primary/10 rounded-xl hover:bg-primary/20 transition-all group border border-primary/20"
                    aria-label="Install App"
                >
                    <Smartphone className="w-4 h-4 text-primary group-hover:scale-110 transition-transform" />
                </button>
            );
        }

        return (
            <button
                onClick={onActionClick}
                className="w-full flex items-center justify-between p-3 rounded-xl bg-primary/10 border border-primary/20 text-primary transition-all group shadow-sm shadow-primary/10 hover:bg-primary/20"
            >
                <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/20 rounded-lg group-hover:bg-primary/30">
                        <Smartphone className={cn("h-4 w-4 text-primary", !isInstalled && "animate-pulse")} />
                    </div>
                    <span className="text-xs font-black tracking-tight">
                        {isInstalled ? 'Update Core Engine' : 'Install Levelone'}
                    </span>
                </div>
                <div className="flex items-center gap-1">
                    {!isInstalled && (
                        <span className="text-[8px] font-black uppercase bg-primary text-white px-1.5 py-0.5 rounded-full">New</span>
                    )}
                    <ChevronRight className="h-3 w-3 opacity-50 group-hover:translate-x-0.5 transition-transform" />
                </div>
            </button>
        );
    };

    // Modal Content
    const modalContent = (
        <AnimatePresence>
            {showModal && (
                <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
                    {/* Overlay */}
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={() => setShowModal(false)}
                        className="absolute inset-0 bg-black/40 dark:bg-black/60 backdrop-blur-md"
                    />

                    {/* Modal Card */}
                    <motion.div
                        initial={{ scale: 0.9, opacity: 0, y: 20 }}
                        animate={{ scale: 1, opacity: 1, y: 0 }}
                        exit={{ scale: 0.9, opacity: 0, y: 20 }}
                        className="relative w-full max-w-sm bg-card border border-card-border rounded-[2.5rem] shadow-2xl p-8 overflow-hidden"
                    >
                        <button
                            onClick={() => setShowModal(false)}
                            className="absolute top-6 right-6 p-2 rounded-full hover:bg-card-border transition-colors"
                        >
                            <X className="w-4 h-4 text-muted" />
                        </button>

                        <div className="text-center mb-8">
                            <div className="mx-auto w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-4 border border-primary/20">
                                <Smartphone className="h-8 w-8 text-primary" />
                            </div>
                            <h3 className="text-xl font-black text-foreground mb-2">Install Levelone</h3>
                            <p className="text-[11px] text-muted font-bold tracking-tight">Access your portal instantly from home screen.</p>
                        </div>

                        {isIOS ? (
                            <div className="space-y-6">
                                <div className="p-5 bg-foreground/5 rounded-2xl border border-card-border">
                                    <p className="text-[10px] font-black uppercase tracking-widest text-primary mb-4 flex items-center gap-2">
                                        <Share className="w-3 h-3" /> Step-by-Step for iOS
                                    </p>
                                    <div className="space-y-4">
                                        {[
                                            { icon: <ArrowUpCircle className="w-4 h-4" />, text: 'Tap "Share" in Safari footer' },
                                            { icon: <PlusSquare className="w-4 h-4" />, text: 'Tap "Add to Home Screen"' },
                                            { icon: <Download className="w-4 h-4" />, text: 'Tap "Add" at the top right' }
                                        ].map((step, idx) => (
                                            <div key={idx} className="flex items-center gap-3 text-xs font-bold text-muted">
                                                <div className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                                                    {step.icon}
                                                </div>
                                                <span className="text-[10px] sm:text-xs">{step.text}</span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all"
                                >
                                    Got it, making space!
                                </button>
                            </div>
                        ) : (
                            <>
                                <div className="space-y-3 mb-8">
                                    {[
                                        { title: 'Offline-First', desc: 'Learning without internet.', icon: Zap },
                                        { title: 'Zero Latency', desc: 'Opens instantly.', icon: Sparkles },
                                        { title: 'Push Sync', desc: 'Stay updated.', icon: MessageSquare }
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

                                <button
                                    onClick={() => {
                                        handleInstallClick();
                                        setShowModal(false);
                                    }}
                                    className="w-full py-4 bg-primary text-white rounded-2xl font-black text-sm shadow-lg shadow-primary/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 group mb-4"
                                >
                                    <Download className="w-4 h-4 group-hover:bounce" />
                                    Launch Installation
                                </button>
                                <button
                                    onClick={() => setShowModal(false)}
                                    className="w-full py-2 text-muted font-bold text-[10px] uppercase tracking-widest hover:text-foreground transition-colors"
                                >
                                    Not now, continue in browser
                                </button>
                            </>
                        )}
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );

    return (
        <>
            {renderTrigger()}
            {mounted && typeof document !== 'undefined' && createPortal(modalContent, document.body)}
        </>
    );
}
