'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Share, PlusSquare, CheckCircle2, ChevronRight, Apple, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';

const steps = [
    {
        number: 1,
        title: 'Open Levelone in Safari',
        description: 'Open Levelone in Safari on your iPhone or iPad. Make sure you\'re using Safari — not Chrome or any other browser.',
        icon: '🧭',
        image: '/install-guide/levelone-mobile.png',
        note: 'Safari is the default browser on iPhone/iPad. If you\'re in another browser, copy the URL and paste it in Safari.',
    },
    {
        number: 2,
        title: 'Tap the Share button',
        description: 'At the bottom of Safari, tap the Share button — it looks like a box with an arrow pointing up. Scroll down in the share menu and tap "Add to Home Screen".',
        icon: '⬆️',
        image: '/install-guide/ios-step1.png',
        note: 'If you can\'t see the toolbar, scroll up slightly on the page to reveal it.',
    },
    {
        number: 3,
        title: 'Tap "Add to Home Screen"',
        description: 'Scroll down in the share menu and tap "Add to Home Screen". It has a plus icon next to it.',
        icon: '➕',
        image: '/install-guide/ios-step2.png',
        note: 'You may need to scroll down the share sheet to find this option.',
    },
    {
        number: 4,
        title: 'Tap "Add" to confirm',
        description: 'On the confirmation screen, tap "Add" in the top right corner. Levelone will appear on your home screen instantly!',
        icon: '✅',
        image: '/install-guide/ios-step3.png',
        note: 'You can rename the app if you want, but "Levelone" is already set for you.',
    },
];

export default function IOSInstallPage() {
    const [activeStep, setActiveStep] = useState(0);
    const [isIOS, setIsIOS] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        setIsIOS(/iPad|iPhone|iPod/.test(navigator.userAgent));
        setIsStandalone(window.matchMedia('(display-mode: standalone)').matches);
    }, []);

    if (isStandalone) {
        return (
            <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center px-6 font-sans">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-20 h-20 rounded-3xl bg-green-900/20 border border-green-500/30 flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(34,197,94,0.15)]">
                        <CheckCircle2 className="w-10 h-10 text-green-400" />
                    </div>
                    <h1 className="text-2xl font-black text-white">Already installed!</h1>
                    <p className="text-zinc-400 text-sm">Levelone is running as an installed app on your device.</p>
                    <Link href="/student" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-500 transition-colors">
                        Go to Dashboard <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] font-sans text-white">
            {/* Glow background */}
            <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-slate-800/10 to-transparent pointer-events-none" />

            {/* Top Nav */}
            <div className="sticky top-0 z-10 bg-[#050507]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-3">
                <Link href="/install" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-zinc-300" />
                </Link>
                <div className="flex items-center gap-2">
                    <Apple className="w-4 h-4 text-zinc-300" />
                    <span className="text-sm font-black text-white">Install on iPhone / iPad</span>
                </div>
                <div className="ml-auto text-[10px] font-black uppercase tracking-widest text-slate-500 bg-slate-800/50 px-2 py-1 rounded-full">
                    {activeStep + 1} / {steps.length}
                </div>
            </div>

            {/* Non-iOS warning */}
            {!isIOS && (
                <div className="mx-4 mt-4 p-3 rounded-xl bg-amber-900/20 border border-amber-700/30 flex items-start gap-3">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-300 font-medium">
                        This guide is for iPhone/iPad. Looks like you&apos;re on a different device —{' '}
                        <Link href="/install/android" className="underline">Android guide</Link> or{' '}
                        <Link href="/install/desktop" className="underline">Desktop guide</Link>.
                    </p>
                </div>
            )}

            <div className="max-w-lg mx-auto px-4 pb-24 pt-6">
                {/* Step tabs */}
                <div className="flex gap-2 mb-8">
                    {steps.map((step, i) => (
                        <button
                            key={i}
                            onClick={() => setActiveStep(i)}
                            className={`flex-1 h-1.5 rounded-full transition-all duration-300 ${
                                i <= activeStep ? 'bg-blue-500' : 'bg-white/10'
                            }`}
                        />
                    ))}
                </div>

                {/* Active step */}
                <AnimatePresence mode="wait">
                    <motion.div
                        key={activeStep}
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.25, ease: 'easeOut' }}
                        className="space-y-6"
                    >
                        {/* Step header */}
                        <div className="flex items-start gap-4">
                            <div className="w-14 h-14 rounded-2xl bg-blue-900/20 border border-blue-700/30 flex items-center justify-center text-2xl shrink-0">
                                {steps[activeStep].icon}
                            </div>
                            <div>
                                <p className="text-[10px] font-black uppercase tracking-widest text-blue-400 mb-1">
                                    Step {steps[activeStep].number}
                                </p>
                                <h2 className="text-xl font-black text-white leading-tight">
                                    {steps[activeStep].title}
                                </h2>
                            </div>
                        </div>

                        {/* Description */}
                        <p className="text-zinc-300 text-sm leading-relaxed font-medium">
                            {steps[activeStep].description}
                        </p>

                        {/* Image */}
                        {steps[activeStep].image && (
                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#090a0f]">
                                <Image
                                    src={steps[activeStep].image}
                                    alt={steps[activeStep].title}
                                    width={600}
                                    height={400}
                                    className="w-full object-cover"
                                />
                            </div>
                        )}

                        {/* Note */}
                        {steps[activeStep].note && (
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
                                <span className="text-blue-400 text-sm">💡</span>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                    {steps[activeStep].note}
                                </p>
                            </div>
                        )}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* Fixed bottom nav */}
            <div className="fixed bottom-0 left-0 right-0 bg-[#050507]/95 backdrop-blur-md border-t border-white/5 px-4 py-4">
                <div className="max-w-lg mx-auto flex gap-3">
                    {activeStep > 0 && (
                        <button
                            onClick={() => setActiveStep(s => s - 1)}
                            className="px-5 py-3.5 rounded-2xl bg-white/5 border border-white/10 text-white font-bold text-sm hover:bg-white/10 transition-colors"
                        >
                            Back
                        </button>
                    )}
                    {activeStep < steps.length - 1 ? (
                        <button
                            onClick={() => setActiveStep(s => s + 1)}
                            className="flex-1 py-3.5 rounded-2xl bg-blue-600 text-white font-black text-sm hover:bg-blue-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-blue-600/20"
                        >
                            Next Step <ChevronRight className="w-4 h-4" />
                        </button>
                    ) : (
                        <Link
                            href="/student"
                            className="flex-1 py-3.5 rounded-2xl bg-green-600 text-white font-black text-sm hover:bg-green-500 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-green-600/20"
                        >
                            <CheckCircle2 className="w-4 h-4" /> All Done — Open App
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}
