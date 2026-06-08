'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Download, CheckCircle2, ChevronRight, Smartphone, AlertCircle, Zap } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePWAInstall } from '@/hooks/usePWAInstall';

const manualSteps = [
    {
        number: 1,
        title: 'Open Chrome Menu',
        description: 'Open Levelone in Chrome. Tap the three-dot menu icon (⋮) in the top right corner of the Chrome browser bar.',
        icon: '⋮',
        image: '/install-guide/android-step1.png',
        note: 'Make sure you tap Chrome\'s menu, not the Levelone app menu.',
    },
    {
        number: 2,
        title: 'Tap "Add to Home screen"',
        description: 'In the Chrome menu that opens, scroll down and tap "Add to Home screen" (or "Install app").',
        icon: '📲',
        image: '/install-guide/android-step2.png',
        note: 'This option installs Levelone directly to your device.',
    },
    {
        number: 3,
        title: 'Confirm Installation',
        description: 'A Chrome install prompt appears at the bottom — tap "Install". Levelone will be added to your home screen in seconds.',
        icon: '✅',
        image: '/install-guide/android-confirm.png',
        note: 'The app installs instantly. No download or app store needed.',
    },
];

export default function AndroidInstallPage() {
    const { isInstallable, isStandalone, handleInstallClick } = usePWAInstall();
    const [installing, setInstalling] = useState(false);
    const [installed, setInstalled] = useState(false);
    const [showManual, setShowManual] = useState(false);
    const [activeStep, setActiveStep] = useState(0);
    const [isAndroid, setIsAndroid] = useState(false);

    useEffect(() => {
        setIsAndroid(/Android/.test(navigator.userAgent));
    }, []);

    const handleInstall = async () => {
        setInstalling(true);
        await handleInstallClick();
        setInstalling(false);
        setInstalled(true);
    };

    if (isStandalone) {
        return (
            <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center px-6 font-sans">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 rounded-3xl bg-green-900/20 border border-green-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Already installed!</h1>
                    <p className="text-zinc-400 text-sm">Levelone is running as a native app on your Android device.</p>
                    <Link href="/student" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-green-600 text-white rounded-2xl font-bold text-sm hover:bg-green-500 transition-colors">
                        Go to Dashboard <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] font-sans text-white">
            <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-900/5 to-transparent pointer-events-none" />

            {/* Top Nav */}
            <div className="sticky top-0 z-10 bg-[#050507]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-3">
                <Link href="/install" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-zinc-300" />
                </Link>
                <div className="flex items-center gap-2">
                    <Smartphone className="w-4 h-4 text-green-400" />
                    <span className="text-sm font-black text-white">Install on Android</span>
                </div>
            </div>

            {/* Not Android warning */}
            {!isAndroid && (
                <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 font-medium">
                        This guide is for Android. Looking for{' '}
                        <Link href="/install/ios" className="underline">iOS guide</Link> or{' '}
                        <Link href="/install/desktop" className="underline">Desktop guide</Link>?
                    </p>
                </div>
            )}

            <div className="max-w-lg mx-auto px-4 pb-12 pt-6 space-y-8">

                {/* One-tap install (when browser supports it) */}
                {isInstallable && !showManual && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-green-700/30 bg-gradient-to-br from-green-900/20 to-slate-900/60 p-7 text-center space-y-5 shadow-[0_0_40px_rgba(34,197,94,0.08)]"
                    >
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-green-400">
                            <Zap className="w-3 h-3 fill-current" />
                            One-tap install available
                        </div>

                        <div className="w-16 h-16 rounded-2xl bg-green-900/30 border border-green-600/30 flex items-center justify-center mx-auto">
                            <Download className="w-7 h-7 text-green-400" />
                        </div>

                        <div>
                            <h2 className="text-xl font-black text-white mb-2">Install Levelone</h2>
                            <p className="text-zinc-400 text-sm">
                                Your browser supports direct installation. Tap the button below — no steps needed.
                            </p>
                        </div>

                        {installed ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5" /> Installed successfully!
                                </div>
                                <Link
                                    href="/student"
                                    className="inline-flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-2xl font-black text-sm hover:bg-green-500 transition-colors"
                                >
                                    Open App <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                disabled={installing}
                                className="w-full py-4 bg-green-600 hover:bg-green-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-green-600/20 hover:shadow-green-500/30 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {installing ? (
                                    <span className="animate-pulse">Installing…</span>
                                ) : (
                                    <><Download className="w-4 h-4" /> Install Now — It&apos;s Free</>
                                )}
                            </button>
                        )}

                        <button
                            onClick={() => setShowManual(true)}
                            className="text-[11px] text-zinc-500 hover:text-zinc-300 transition-colors font-medium underline underline-offset-2"
                        >
                            Button not working? Show manual steps
                        </button>
                    </motion.div>
                )}

                {/* Manual steps (fallback or when button doesn't work) */}
                {(!isInstallable || showManual) && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-6"
                    >
                        <div className="text-center">
                            <h2 className="text-xl font-black text-white mb-1">Manual Installation</h2>
                            <p className="text-sm text-zinc-400">Follow these 3 simple steps</p>
                        </div>

                        {/* Progress bar */}
                        <div className="flex gap-2">
                            {manualSteps.map((_, i) => (
                                <button
                                    key={i}
                                    onClick={() => setActiveStep(i)}
                                    className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${i <= activeStep ? 'bg-green-500' : 'bg-white/10'}`}
                                />
                            ))}
                        </div>

                        {/* Active step */}
                        <div className="space-y-4">
                            <div className="flex items-start gap-4">
                                <div className="w-14 h-14 rounded-2xl bg-green-900/20 border border-green-700/30 flex items-center justify-center text-2xl shrink-0">
                                    {manualSteps[activeStep].icon}
                                </div>
                                <div>
                                    <p className="text-[10px] font-black uppercase tracking-widest text-green-400 mb-1">
                                        Step {manualSteps[activeStep].number}
                                    </p>
                                    <h3 className="text-xl font-black text-white">{manualSteps[activeStep].title}</h3>
                                </div>
                            </div>

                            <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                                {manualSteps[activeStep].description}
                            </p>

                            {manualSteps[activeStep].image && (
                                <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#090a0f]">
                                    <Image
                                        src={manualSteps[activeStep].image}
                                        alt={manualSteps[activeStep].title}
                                        width={600}
                                        height={400}
                                        className="w-full object-cover"
                                    />
                                </div>
                            )}

                            {manualSteps[activeStep].note && (
                                <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
                                    <span className="text-green-400 text-sm">💡</span>
                                    <p className="text-xs text-zinc-400 font-medium leading-relaxed">{manualSteps[activeStep].note}</p>
                                </div>
                            )}
                        </div>

                        {/* Step nav */}
                        <div className="flex gap-3 pt-2">
                            {activeStep > 0 && (
                                <button
                                    onClick={() => setActiveStep(s => s - 1)}
                                    className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                                >
                                    Back
                                </button>
                            )}
                            {activeStep < manualSteps.length - 1 ? (
                                <button
                                    onClick={() => setActiveStep(s => s + 1)}
                                    className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white font-black text-sm hover:bg-green-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                                >
                                    Next Step <ChevronRight className="w-4 h-4" />
                                </button>
                            ) : (
                                <Link
                                    href="/student"
                                    className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white font-black text-sm hover:bg-green-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                                >
                                    <CheckCircle2 className="w-4 h-4" /> Done — Open App
                                </Link>
                            )}
                        </div>
                    </motion.div>
                )}
            </div>
        </div>
    );
}
