'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import AdvancedCyberNinja from './AdvancedCyberNinja';

export default function GlobalSplashScreen() {
    const [phase, setPhase] = useState<'animating' | 'slashed' | 'bloody' | 'hidden'>('animating');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Real sword sound
        audioRef.current = new Audio('/sounds/sword.wav');
        audioRef.current.volume = 1.0;

        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        } catch (e) {}

        // We assume the real GIF takes ~1.5 seconds to reach the "slash" moment.
        // 1600ms: The slash impacts the screen
        const slashTimer = setTimeout(() => {
            setPhase('slashed');
            if (audioRef.current) {
                audioRef.current.play().catch(() => {}); // silent catch for strict autoplay policies
            }
        }, 1600);

        // 2200ms: Blood and branding
        const bloodyTimer = setTimeout(() => {
            setPhase('bloody');
        }, 2200);

        // 4500ms: Fade out
        const hideTimer = setTimeout(() => {
            setPhase('hidden');
        }, 4500);

        return () => {
            clearTimeout(slashTimer);
            clearTimeout(bloodyTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (phase === 'hidden') return null;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#030303] overflow-hidden"
            >
                {/* Background Blue Moon / Aura */}
                <div className="absolute inset-0 z-0">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: phase === 'bloody' ? 1 : 0 }}
                        transition={{ duration: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-blue-900/30 blur-[120px] rounded-full" 
                    />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                    
                    {/* The Advanced Cyber Ninja */}
                    <div className="relative z-30 flex items-center justify-center">
                        <AdvancedCyberNinja phase={phase} />
                    </div>

                    {/* The Sword Scratch / Slash */}
                    {(phase === 'slashed' || phase === 'bloody') && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                            {/* Primary Deep Scratch */}
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1 }}
                                animate={{ scaleX: 1, opacity: phase === 'bloody' ? 0.2 : 1 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="absolute w-[120vw] h-3 bg-white shadow-[0_0_30px_#fff,0_0_60px_#3b82f6,inset_0_0_10px_#3b82f6] rounded-full rotate-[-30deg]"
                            />
                            {/* Secondary Scratch */}
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1 }}
                                animate={{ scaleX: 1, opacity: phase === 'bloody' ? 0 : 0.8 }}
                                transition={{ duration: 0.1, delay: 0.05, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="absolute w-[100vw] h-1.5 bg-white shadow-[0_0_20px_#fff,0_0_40px_#3b82f6] rounded-full rotate-[-25deg] translate-y-8"
                            />
                            {/* Third Scratch */}
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1 }}
                                animate={{ scaleX: 1, opacity: phase === 'bloody' ? 0 : 0.6 }}
                                transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="absolute w-[110vw] h-1 bg-white shadow-[0_0_15px_#fff,0_0_30px_#3b82f6] rounded-full rotate-[-35deg] -translate-y-12"
                            />
                            
                            {/* Impact Flash */}
                            <motion.div 
                                initial={{ opacity: 1, scale: 1 }}
                                animate={{ opacity: 0, scale: 3 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                className="absolute w-64 h-64 bg-white mix-blend-overlay blur-[20px] rounded-full"
                            />
                        </div>
                    )}

                    {/* Cyber Branding */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                        {phase === 'bloody' && (
                            <motion.div
                                initial={{ scale: 2, opacity: 0, filter: 'blur(20px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                transition={{ type: "spring", stiffness: 150, damping: 12 }}
                                className="relative flex flex-col items-center mt-32"
                            >
                                <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] text-blue-500 drop-shadow-[0_0_25px_rgba(59,130,246,0.9)]" style={{ fontFamily: 'impact, sans-serif' }}>
                                    LEVEL<span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">ONE</span>
                                </h1>
                                
                                {/* Digital drips simulation */}
                                <div className="absolute top-[80%] left-[20%] w-1.5 bg-blue-500 rounded-b-full shadow-[0_0_8px_#3b82f6]" style={{ animation: 'bloodDrip 2s ease-in forwards' }} />
                                <div className="absolute top-[80%] left-[45%] w-2 bg-blue-500 rounded-b-full shadow-[0_0_10px_#3b82f6]" style={{ animation: 'bloodDrip 1.5s ease-in forwards 0.3s' }} />
                                <div className="absolute top-[80%] right-[30%] w-1.5 bg-blue-500 rounded-b-full shadow-[0_0_8px_#3b82f6]" style={{ animation: 'bloodDrip 2.2s ease-in forwards 0.1s' }} />
                                <div className="absolute top-[80%] right-[10%] w-1 bg-blue-500 rounded-b-full shadow-[0_0_5px_#3b82f6]" style={{ animation: 'bloodDrip 1.8s ease-in forwards 0.5s' }} />
                                
                                <p className="mt-4 text-xs font-black uppercase tracking-[0.4em] text-blue-400/80 drop-shadow-[0_0_5px_rgba(59,130,246,0.5)]">
                                    System Online
                                </p>
                            </motion.div>
                        )}
                    </div>
                </div>
                
                {/* CSS for Blood Drips */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes bloodDrip {
                        0% { height: 0px; opacity: 1; transform: translateY(0); }
                        80% { height: 80px; opacity: 1; transform: translateY(0); }
                        100% { height: 120px; opacity: 0; transform: translateY(20px); }
                    }
                `}} />
            </motion.div>
        </AnimatePresence>
    );
}
