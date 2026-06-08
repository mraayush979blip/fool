'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function GlobalSplashScreen() {
    const [phase, setPhase] = useState<'rolling' | 'standing' | 'readying' | 'attacking' | 'slashed' | 'bloody' | 'hidden'>('rolling');
    const audioRef = useRef<HTMLAudioElement | null>(null);

    useEffect(() => {
        // We use the generated .wav sword sound
        audioRef.current = new Audio('/sounds/sword.wav');
        audioRef.current.volume = 1.0;

        // Try to request fullscreen silently
        try {
            if (document.documentElement.requestFullscreen) {
                document.documentElement.requestFullscreen().catch(() => {});
            }
        } catch (e) {}

        // Timing sequence
        // 0 - 800ms: Rolling in
        const standTimer = setTimeout(() => {
            setPhase('standing');
        }, 800);

        // 800 - 1300ms: Standing, then readying sword
        const readyTimer = setTimeout(() => {
            setPhase('readying');
        }, 1300);

        // 1300 - 1600ms: Attacking lunge
        const attackTimer = setTimeout(() => {
            setPhase('attacking');
        }, 1800);

        // 1600ms: The slash impacts the screen
        const slashTimer = setTimeout(() => {
            setPhase('slashed');
            if (audioRef.current) {
                audioRef.current.play().catch(e => console.warn('Audio play blocked:', e));
            }
        }, 1900);

        // 2200ms: Blood and branding
        const bloodyTimer = setTimeout(() => {
            setPhase('bloody');
        }, 2500);

        // 4500ms: Fade out
        const hideTimer = setTimeout(() => {
            setPhase('hidden');
        }, 4500);

        return () => {
            clearTimeout(standTimer);
            clearTimeout(readyTimer);
            clearTimeout(attackTimer);
            clearTimeout(slashTimer);
            clearTimeout(bloodyTimer);
            clearTimeout(hideTimer);
        };
    }, []);

    if (phase === 'hidden') return null;

    // Animation variants for the Ninja
    const ninjaVariants = {
        rolling: {
            x: -300,
            y: 100,
            rotate: -360,
            scale: 0.5,
            opacity: 0,
        },
        standing: {
            x: 0,
            y: 0,
            rotate: 0,
            scale: 0.8,
            opacity: 1,
            transition: { type: "spring", stiffness: 100, damping: 15 }
        },
        readying: {
            x: -20,
            y: 10,
            rotate: -15,
            scale: 0.85,
            opacity: 1,
            transition: { duration: 0.4, ease: "easeOut" }
        },
        attacking: {
            x: 100,
            y: -50,
            rotate: 45,
            scale: 1.5,
            opacity: 1,
            filter: 'brightness(1.5)',
            transition: { duration: 0.1, ease: "easeIn" }
        },
        slashed: {
            x: 150,
            y: -20,
            rotate: 45,
            scale: 1.2,
            opacity: 0, // Fade out after attacking
            filter: 'brightness(0.5)',
            transition: { duration: 0.4, ease: "easeOut" }
        },
        bloody: {
            x: 150,
            y: -20,
            rotate: 45,
            scale: 1.2,
            opacity: 0,
        }
    };

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 1 }}
                exit={{ opacity: 0, scale: 1.1 }}
                transition={{ duration: 0.8, ease: "easeInOut" }}
                className="fixed inset-0 z-[10000] flex flex-col items-center justify-center bg-[#030303] overflow-hidden"
            >
                {/* Background Blood Moon / Aura */}
                <div className="absolute inset-0 z-0">
                    <motion.div 
                        initial={{ opacity: 0 }}
                        animate={{ opacity: phase === 'bloody' ? 1 : 0 }}
                        transition={{ duration: 1 }}
                        className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[40rem] h-[40rem] bg-red-900/20 blur-[120px] rounded-full" 
                    />
                </div>

                <div className="relative z-10 w-full h-full flex flex-col items-center justify-center">
                    
                    {/* The Ninja */}
                    <motion.div
                        variants={ninjaVariants}
                        initial="rolling"
                        animate={phase}
                        className="relative z-30"
                    >
                        <img 
                            src="/icon-ninja-round.png" 
                            alt="Levelone Ninja" 
                            className="w-48 h-48 object-contain drop-shadow-[0_0_20px_rgba(255,255,255,0.2)]"
                        />
                    </motion.div>

                    {/* The Sword Scratch / Slash */}
                    {(phase === 'slashed' || phase === 'bloody') && (
                        <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-20">
                            {/* Primary Deep Scratch */}
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1 }}
                                animate={{ scaleX: 1, opacity: phase === 'bloody' ? 0.2 : 1 }}
                                transition={{ duration: 0.15, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="absolute w-[120vw] h-3 bg-white shadow-[0_0_30px_#fff,0_0_60px_#dc2626,inset_0_0_10px_#dc2626] rounded-full rotate-[-30deg]"
                            />
                            {/* Secondary Scratch */}
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1 }}
                                animate={{ scaleX: 1, opacity: phase === 'bloody' ? 0 : 0.8 }}
                                transition={{ duration: 0.1, delay: 0.05, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="absolute w-[100vw] h-1.5 bg-white shadow-[0_0_20px_#fff,0_0_40px_#dc2626] rounded-full rotate-[-25deg] translate-y-8"
                            />
                            {/* Third Scratch */}
                            <motion.div 
                                initial={{ scaleX: 0, opacity: 1 }}
                                animate={{ scaleX: 1, opacity: phase === 'bloody' ? 0 : 0.6 }}
                                transition={{ duration: 0.2, delay: 0.1, ease: "easeOut" }}
                                style={{ originX: 0 }}
                                className="absolute w-[110vw] h-1 bg-white shadow-[0_0_15px_#fff,0_0_30px_#dc2626] rounded-full rotate-[-35deg] -translate-y-12"
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

                    {/* Bloody Branding */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-40">
                        {phase === 'bloody' && (
                            <motion.div
                                initial={{ scale: 2, opacity: 0, filter: 'blur(20px)' }}
                                animate={{ scale: 1, opacity: 1, filter: 'blur(0px)' }}
                                transition={{ type: "spring", stiffness: 150, damping: 12 }}
                                className="relative flex flex-col items-center"
                            >
                                <h1 className="text-6xl md:text-8xl font-black tracking-[-0.05em] text-red-600 drop-shadow-[0_0_25px_rgba(220,38,38,0.9)]" style={{ fontFamily: 'impact, sans-serif' }}>
                                    LEVEL<span className="text-white drop-shadow-[0_0_15px_rgba(255,255,255,0.5)]">ONE</span>
                                </h1>
                                
                                {/* Blood drips simulation */}
                                <div className="absolute top-[80%] left-[20%] w-1.5 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626]" style={{ animation: 'bloodDrip 2s ease-in forwards' }} />
                                <div className="absolute top-[80%] left-[45%] w-2 bg-red-600 rounded-b-full shadow-[0_0_10px_#dc2626]" style={{ animation: 'bloodDrip 1.5s ease-in forwards 0.3s' }} />
                                <div className="absolute top-[80%] right-[30%] w-1.5 bg-red-600 rounded-b-full shadow-[0_0_8px_#dc2626]" style={{ animation: 'bloodDrip 2.2s ease-in forwards 0.1s' }} />
                                <div className="absolute top-[80%] right-[10%] w-1 bg-red-600 rounded-b-full shadow-[0_0_5px_#dc2626]" style={{ animation: 'bloodDrip 1.8s ease-in forwards 0.5s' }} />
                                
                                <p className="mt-4 text-xs font-black uppercase tracking-[0.4em] text-red-500/80 drop-shadow-[0_0_5px_rgba(220,38,38,0.5)]">
                                    Prepare to Strike
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
