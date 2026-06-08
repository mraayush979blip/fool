'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Monitor, CheckCircle2, ChevronRight, Download, Zap, MousePointer2 } from 'lucide-react';
import Link from 'next/link';
import Image from 'next/image';
import { usePWAInstall } from '@/hooks/usePWAInstall';

// Method 1: URL bar install button (Chrome/Edge/Brave)
// Method 2: Chrome ⋮ menu → Install Levelone...
// Method 3: Edge Apps menu

const methods = [
    {
        id: 'urlbar',
        name: 'URL Bar Button',
        tag: '⚡ Easiest',
        tagColor: 'bg-blue-900/50 text-blue-400',
        description: 'Chrome, Edge and Brave show a small install icon inside the address bar when a PWA is ready to install.',
        steps: [
            'Look at the address bar at the top of your browser',
            'On the right side of the URL, find the install icon — it looks like a monitor with a down arrow (⬇)',
            'Click it — an install dialog will appear',
            'Click "Install" to confirm',
        ],
        image: '/install-guide/desktop-urlbar.png',
        note: 'If you don\'t see the icon, your browser may need to be on Chrome, Edge, or Brave. Firefox does not support this.',
    },
    {
        id: 'chrome',
        name: 'Chrome Menu',
        tag: 'Chrome / Brave',
        tagColor: 'bg-zinc-800 text-zinc-400',
        description: 'Use Chrome\'s browser menu (⋮) to find the install option.',
        steps: [
            'Click the three-dot ⋮ menu in the very top-right corner of the Chrome browser window',
            'Look for "Install Levelone…" in the dropdown list',
            'Click it — a confirmation popup appears',
            'Click "Install" to confirm',
        ],
        image: '/install-guide/desktop-chrome-menu-real.png',
        note: 'On Brave, the option is also called "Install Levelone…". On Edge, go to Apps → Install this site as an app.',
    },
];

export default function DesktopInstallPage() {
    const { isInstallable, isStandalone, handleInstallClick } = usePWAInstall();
    const [installing, setInstalling] = useState(false);
    const [installed, setInstalled] = useState(false);
    const [activeMethod, setActiveMethod] = useState(0);

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
                    <p className="text-zinc-400 text-sm">Levelone is running as a desktop app.</p>
                    <Link href="/student" className="inline-flex items-center gap-2 mt-4 px-6 py-3 bg-blue-600 text-white rounded-2xl font-bold text-sm hover:bg-blue-500 transition-colors">
                        Go to Dashboard <ChevronRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#050507] font-sans text-white">
            <div className="fixed top-0 left-0 right-0 h-64 bg-gradient-to-b from-blue-900/5 to-transparent pointer-events-none" />

            {/* Top Nav */}
            <div className="sticky top-0 z-10 bg-[#050507]/90 backdrop-blur-md border-b border-white/5 px-4 py-4 flex items-center gap-3">
                <Link href="/install" className="p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                    <ArrowLeft className="w-4 h-4 text-zinc-300" />
                </Link>
                <div className="flex items-center gap-2">
                    <Monitor className="w-4 h-4 text-blue-400" />
                    <span className="text-sm font-black text-white">Install on Desktop</span>
                </div>
            </div>

            <div className="max-w-lg mx-auto px-4 pb-12 pt-6 space-y-8">

                {/* One-tap install (when browser fires the event) */}
                {isInstallable && (
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="rounded-3xl border border-blue-700/30 bg-gradient-to-br from-blue-900/20 to-slate-900/60 p-7 text-center space-y-5 shadow-[0_0_40px_rgba(59,130,246,0.08)]"
                    >
                        <div className="flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-400">
                            <Zap className="w-3 h-3 fill-current" />
                            Browser ready — instant install
                        </div>
                        <div className="w-16 h-16 rounded-2xl bg-blue-900/30 border border-blue-600/30 flex items-center justify-center mx-auto">
                            <Download className="w-7 h-7 text-blue-400" />
                        </div>
                        <div>
                            <h2 className="text-xl font-black text-white mb-2">Install Levelone</h2>
                            <p className="text-zinc-400 text-sm">Your browser is ready. Click the button below — no extra steps.</p>
                        </div>
                        {installed ? (
                            <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2 text-green-400 font-bold text-sm">
                                    <CheckCircle2 className="w-5 h-5" /> Installed! Check your taskbar or apps menu.
                                </div>
                                <Link href="/student" className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-2xl font-black text-sm hover:bg-blue-500 transition-colors">
                                    Open App <ChevronRight className="w-4 h-4" />
                                </Link>
                            </div>
                        ) : (
                            <button
                                onClick={handleInstall}
                                disabled={installing}
                                className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-2xl font-black text-sm transition-all shadow-lg shadow-blue-600/20 hover:scale-[1.01] active:scale-[0.98] disabled:opacity-60 flex items-center justify-center gap-2"
                            >
                                {installing ? <span className="animate-pulse">Installing…</span> : <><Download className="w-4 h-4" /> Install Now — One Click</>}
                            </button>
                        )}
                    </motion.div>
                )}

                {/* Manual methods */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.1 }}
                    className="space-y-5"
                >
                    <div>
                        <h2 className="text-lg font-black text-white mb-1">
                            {isInstallable ? 'Or use your browser directly' : 'Install from your browser'}
                        </h2>
                        <p className="text-sm text-zinc-400">Two ways — pick the one that works for you</p>
                    </div>

                    {/* Method tabs */}
                    <div className="flex gap-2">
                        {methods.map((m, i) => (
                            <button
                                key={i}
                                onClick={() => setActiveMethod(i)}
                                className={`flex-1 py-2.5 px-3 rounded-xl text-xs font-black transition-all border ${
                                    activeMethod === i
                                        ? 'bg-blue-600 text-white border-blue-500 shadow-lg shadow-blue-600/20'
                                        : 'bg-white/5 border-white/10 text-zinc-400 hover:text-white hover:bg-white/10'
                                }`}
                            >
                                {m.name}
                            </button>
                        ))}
                    </div>

                    {/* Active method */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeMethod}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.2 }}
                            className="space-y-4"
                        >
                            {/* Tag + description */}
                            <div className="flex items-center gap-2">
                                <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-full ${methods[activeMethod].tagColor}`}>
                                    {methods[activeMethod].tag}
                                </span>
                            </div>
                            <p className="text-sm text-zinc-400 font-medium leading-relaxed">
                                {methods[activeMethod].description}
                            </p>

                            {/* Screenshot */}
                            <div className="rounded-2xl overflow-hidden border border-white/10 bg-[#090a0f]">
                                <Image
                                    src={methods[activeMethod].image}
                                    alt={methods[activeMethod].name}
                                    width={900}
                                    height={600}
                                    className="w-full object-cover"
                                />
                            </div>

                            {/* Steps */}
                            <div className="space-y-2">
                                {methods[activeMethod].steps.map((step, i) => (
                                    <div
                                        key={i}
                                        className="flex items-start gap-3 p-3.5 rounded-xl bg-[#090a0f] border border-white/8"
                                    >
                                        <div className="w-6 h-6 rounded-lg bg-blue-900/40 border border-blue-700/40 flex items-center justify-center text-xs font-black text-blue-400 shrink-0">
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-zinc-300 font-medium leading-relaxed">{step}</p>
                                    </div>
                                ))}
                            </div>

                            {/* Note */}
                            <div className="flex items-start gap-3 p-4 rounded-xl bg-white/3 border border-white/8">
                                <span className="text-blue-400 text-sm">💡</span>
                                <p className="text-xs text-zinc-400 font-medium leading-relaxed">
                                    {methods[activeMethod].note}
                                </p>
                            </div>
                        </motion.div>
                    </AnimatePresence>

                    {/* Firefox warning */}
                    <div className="flex items-start gap-3 p-4 rounded-xl bg-amber-900/10 border border-amber-700/20">
                        <span className="text-amber-400 text-sm">⚠️</span>
                        <div>
                            <p className="text-xs text-amber-300 font-bold mb-0.5">Firefox not supported</p>
                            <p className="text-xs text-zinc-500 font-medium">Firefox does not support PWA installation. Please use Chrome, Edge, or Brave.</p>
                        </div>
                    </div>

                    <Link href="/student" className="block text-center text-xs text-zinc-500 hover:text-zinc-300 transition-colors font-medium underline underline-offset-2 mt-2">
                        Skip — continue in browser
                    </Link>
                </motion.div>
            </div>
        </div>
    );
}
