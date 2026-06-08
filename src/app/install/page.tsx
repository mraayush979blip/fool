'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Smartphone, Monitor, Apple, ChevronRight, Zap, Shield } from 'lucide-react';
import Image from 'next/image';

type Platform = 'ios' | 'android' | 'desktop' | null;

function detectPlatform(): Platform {
    if (typeof navigator === 'undefined') return null;
    const ua = navigator.userAgent;
    if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
    if (/Android/.test(ua)) return 'android';
    return 'desktop';
}

const platforms = [
    {
        id: 'ios' as const,
        label: 'iPhone / iPad',
        sublabel: 'iOS · Safari Required',
        icon: Apple,
        gradient: 'from-slate-700 to-slate-900',
        glow: 'rgba(148,163,184,0.2)',
        border: 'border-slate-600/40',
        tag: 'Step-by-step guide',
        tagColor: 'bg-slate-700/60 text-slate-300',
    },
    {
        id: 'android' as const,
        label: 'Android',
        sublabel: 'Chrome · Samsung Browser',
        icon: Smartphone,
        gradient: 'from-green-900 to-slate-900',
        glow: 'rgba(34,197,94,0.2)',
        border: 'border-green-700/30',
        tag: 'One-tap install',
        tagColor: 'bg-green-900/50 text-green-400',
    },
    {
        id: 'desktop' as const,
        label: 'Desktop / Laptop',
        sublabel: 'Chrome · Edge · Brave',
        icon: Monitor,
        gradient: 'from-blue-900 to-slate-900',
        glow: 'rgba(59,130,246,0.2)',
        border: 'border-blue-700/30',
        tag: 'Browser install button',
        tagColor: 'bg-blue-900/50 text-blue-400',
    },
];

export default function InstallPage() {
    const router = useRouter();
    const [detected, setDetected] = useState<Platform>(null);
    const [selected, setSelected] = useState<Platform>(null);

    useEffect(() => {
        const p = detectPlatform();
        setDetected(p);
    }, []);

    const handleSelect = (id: Platform) => {
        setSelected(id);
        setTimeout(() => {
            router.push(`/install/${id}`);
        }, 350);
    };

    return (
        <div className="min-h-screen bg-[#050507] flex flex-col items-center justify-center px-4 py-12 font-sans relative overflow-hidden">
            {/* Background glow orbs */}
            <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
            <div className="absolute bottom-0 left-1/4 w-[400px] h-[200px] bg-purple-600/5 rounded-full blur-3xl pointer-events-none" />

            <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
                className="w-full max-w-lg relative z-10"
            >
                {/* App Preview Image */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.5 }}
                    className="mb-8 rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-blue-900/20"
                >
                    <Image
                        src="/install-guide/levelone-preview.png"
                        alt="Levelone App — Mobile and Desktop"
                        width={900}
                        height={500}
                        className="w-full object-cover"
                        priority
                    />
                </motion.div>

                {/* Platform Cards */}
                <div className="space-y-4">
                    {platforms.map((platform, i) => {
                        const Icon = platform.icon;
                        const isDetected = detected === platform.id;
                        const isSelected = selected === platform.id;

                        return (
                            <motion.button
                                key={platform.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 + i * 0.08, duration: 0.4, ease: 'easeOut' }}
                                onClick={() => handleSelect(platform.id)}
                                className={`w-full group relative overflow-hidden rounded-2xl border transition-all duration-300 p-5 text-left
                                    ${platform.border}
                                    ${isDetected
                                        ? 'bg-gradient-to-r ' + platform.gradient + ' shadow-lg'
                                        : 'bg-[#090a0f] hover:bg-[#0d0e14]'
                                    }
                                    ${isSelected ? 'scale-95 opacity-60' : 'hover:-translate-y-0.5 hover:shadow-xl active:scale-[0.98]'}
                                `}
                                style={isDetected ? { boxShadow: `0 0 30px ${platform.glow}` } : {}}
                            >
                                {/* Recommended badge */}
                                {isDetected && (
                                    <div className="absolute top-3 right-3 flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-white/10 text-white px-2 py-0.5 rounded-full">
                                        <Shield className="w-2.5 h-2.5" />
                                        Your device
                                    </div>
                                )}

                                <div className="flex items-center gap-4">
                                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 bg-white/5 border border-white/10`}>
                                        <Icon className="w-6 h-6 text-white" />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-0.5">
                                            <p className="text-base font-black text-white">{platform.label}</p>
                                            <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${platform.tagColor}`}>
                                                {platform.tag}
                                            </span>
                                        </div>
                                        <p className="text-[11px] text-zinc-400 font-medium">{platform.sublabel}</p>
                                    </div>
                                    <ChevronRight className="w-4 h-4 text-zinc-500 group-hover:text-zinc-300 group-hover:translate-x-0.5 transition-all shrink-0" />
                                </div>
                            </motion.button>
                        );
                    })}
                </div>

                {/* Footer note */}
                <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.6 }}
                    className="text-center text-[10px] text-zinc-600 mt-8 font-medium"
                >
                    Free install · No app store required · Works offline
                </motion.p>
            </motion.div>
        </div>
    );
}
