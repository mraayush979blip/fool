'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSplashScreen() {
    const [phase, setPhase] = useState<'initial' | 'slash' | 'bloody' | 'hidden'>('initial');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // Create audio element
        audioRef.current = new Audio('/sounds/sword.mp3');
        audioRef.current.volume = 1.0;

        // Try to request fullscreen (might be blocked by browser without user gesture, but we try)
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}

        // Timing sequence
        const slashTimer = setTimeout(() => {
            setPhase('slash');
            if (audioRef.current) {
                // Play sound without asking permission
                audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
            }
        }, 800);

        const bloodyTimer = setTimeout(() => {
            setPhase('bloody');
        }, 1300);

        const hideTimer = setTimeout(() => {
            setPhase('hidden');
        }, 4000);

        return () => {
            clearTimeout(slashTimer);
            clearTimeout(bloodyTimer);
            clearTimeout(hideTimer);
            if (audioRef.current) {
                audioRef.current.pause();
            }
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
                {/* Background effects */}
                <div className="absolute inset-0 z-0">
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-red-900/10 blur-[100px] rounded-full animate-pulse-slow" />
                </div>

                <div className="relative z-10 flex flex-col items-center w-full h-full justify-center">
                    
                    {/* The Ninja */}
                    <motion.div
                        initial={{ scale: 0.8, y: 20, opacity: 0, filter: 'brightness(1)' }}
                        animate={{ 
                            scale: phase === 'slash' ? 1.1 : 1, 
                            y: 0, 
                            opacity: 1,
                            filter: phase === 'slash' ? 'brightness(1.5)' : 'brightness(1)'
                        }}
                        transition={{ duration: 0.5, ease: "easeOut" }}
                        className="relative"
                    >
                        {/* Flash effect when slashing */}
                        {phase === 'slash' && (
                            <div className="absolute inset-0 bg-white blur-[20px] opacity-80 rounded-full animate-ping" style={{ animationDuration: '0.3s' }} />
                        )}
                        
                        <img 
                            src="/icon-ninja-round.png" 
                            alt="Levelone Ninja" 
                            className={`w-48 h-48 object-contain transition-all duration-200 ${phase === 'slash' ? 'drop-shadow-[0_0_50px_rgba(220,38,38,0.8)]' : 'drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]'}`}
                        />
                    </motion.div>

                    {/* The Sword Slash */}
                    {phase !== 'initial' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1, rotate: -25 }}
                                animate={{ scaleX: 1, opacity: 0 }}
                                transition={{ duration: 0.5, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="w-[150vw] h-2 bg-white shadow-[0_0_30px_#fff,0_0_60px_#dc2626] rounded-full"
                            />
                        </div>
                    )}
                    
                    {/* Secondary Slash */}
                    {phase !== 'initial' && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center overflow-hidden z-20">
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1, rotate: 15 }}
                                animate={{ scaleX: 1, opacity: 0 }}
                                transition={{ duration: 0.4, delay: 0.1, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="w-[150vw] h-1.5 bg-white shadow-[0_0_20px_#fff,0_0_40px_#dc2626] rounded-full"
                            />
                        </div>
                    )}

                    {/* Bloody Branding */}
                    <div className="mt-12 h-24 flex items-center justify-center">
                        {phase === 'bloody' && (
                            <motion.div
                                initial={{ scale: 1.5, opacity: 0 }}
                                animate={{ scale: 1, opacity: 1 }}
                                transition={{ type: "spring", stiffness: 200, damping: 10 }}
                                className="relative flex flex-col items-center"
                            >
                                <h1 className="text-5xl md:text-7xl font-black tracking-[-0.05em] text-red-600 drop-shadow-[0_0_15px_rgba(220,38,38,0.8)]" style={{ fontFamily: 'impact, sans-serif' }}>
                                    LEVEL<span className="text-white drop-shadow-none">ONE</span>
                                </h1>
                                
                                {/* Blood drips simulation */}
                                <div className="absolute top-full left-1/4 w-1 bg-red-600 rounded-b-full shadow-[0_0_5px_#dc2626]" style={{ animation: 'bloodDrip 2s ease-in forwards' }} />
                                <div className="absolute top-full left-1/2 w-1.5 bg-red-600 rounded-b-full shadow-[0_0_5px_#dc2626]" style={{ animation: 'bloodDrip 1.5s ease-in forwards 0.2s' }} />
                                <div className="absolute top-full right-1/4 w-1 bg-red-600 rounded-b-full shadow-[0_0_5px_#dc2626]" style={{ animation: 'bloodDrip 2.2s ease-in forwards 0.1s' }} />
                            </motion.div>
                        )}
                    </div>
                </div>
                
                {/* CSS for Blood Drips */}
                <style dangerouslySetInnerHTML={{__html: `
                    @keyframes bloodDrip {
                        0% { height: 0px; opacity: 1; }
                        80% { height: 60px; opacity: 1; }
                        100% { height: 80px; opacity: 0; }
                    }
                `}} />
            </motion.div>
        </AnimatePresence>
    );
}
