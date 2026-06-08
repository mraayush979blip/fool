'use client';

import { motion } from 'framer-motion';
import { useEffect, useRef } from 'react';

let cachedAudioCtx: AudioContext | null = null;

const getAudioContext = () => {
    if (typeof window === 'undefined') return null;
    if (!cachedAudioCtx) {
        const AudioC = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioC) cachedAudioCtx = new AudioC();
    }
    if (cachedAudioCtx && cachedAudioCtx.state === 'suspended') {
        cachedAudioCtx.resume();
    }
    return cachedAudioCtx;
};

const playSwordSwoosh = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Create white noise buffer
        const bufferSize = ctx.sampleRate * 0.2; // 0.2 seconds
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Bandpass filter to make it sound like wind/swoosh
        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.Q.value = 1.5;
        
        // Sweep the frequency down fast for a "slash" effect
        filter.frequency.setValueAtTime(5000, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.15);

        // Volume envelope (sharp attack, quick decay)
        const gainNode = ctx.createGain();
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(1.5, ctx.currentTime + 0.02);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        noise.connect(filter);
        filter.connect(gainNode);
        gainNode.connect(ctx.destination);

        noise.start();
        noise.stop(ctx.currentTime + 0.2);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

const playKnifeSound = () => {
    try {
        const ctx = getAudioContext();
        if (!ctx) return;

        // Metallic "ting/shing" sound
        const osc = ctx.createOscillator();
        const osc2 = ctx.createOscillator();
        const gainNode = ctx.createGain();

        // High frequency for metallic sound
        osc.type = 'sine';
        osc.frequency.setValueAtTime(4500, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(800, ctx.currentTime + 0.15);

        osc2.type = 'triangle';
        osc2.frequency.setValueAtTime(6000, ctx.currentTime);
        osc2.frequency.exponentialRampToValueAtTime(1500, ctx.currentTime + 0.15);

        // Very quick sharp envelope
        gainNode.gain.setValueAtTime(0, ctx.currentTime);
        gainNode.gain.linearRampToValueAtTime(0.8, ctx.currentTime + 0.01);
        gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);

        osc.connect(gainNode);
        osc2.connect(gainNode);
        gainNode.connect(ctx.destination);

        osc.start();
        osc2.start();
        osc.stop(ctx.currentTime + 0.15);
        osc2.stop(ctx.currentTime + 0.15);
    } catch (e) {
        console.error("Audio playback failed", e);
    }
};

export default function AdvancedCyberNinja({ phase }: { phase: 'animating' | 'slashed' | 'bloody' | 'hidden' }) {
    const isAttacking = phase === 'slashed' || phase === 'bloody';
    const isReadying = phase === 'animating';
    const playedAttackSound = useRef(false);

    useEffect(() => {
        if (isAttacking && !playedAttackSound.current) {
            playSwordSwoosh();
            playedAttackSound.current = true;
        } else if (!isAttacking) {
            playedAttackSound.current = false;
        }
    }, [isAttacking]);

    const handleNinjaClick = () => {
        playKnifeSound();
        if (typeof navigator !== 'undefined' && navigator.vibrate) {
            navigator.vibrate(40); // Quick sharp vibration
        }
    };

    return (
        <motion.div
            onClick={handleNinjaClick}
            className="relative w-80 h-80 md:w-[450px] md:h-[450px] cursor-crosshair"
            initial={{ y: 200, opacity: 0, scale: 0.8 }}
            animate={{
                y: isAttacking ? 50 : 0,
                opacity: phase === 'hidden' ? 0 : 1,
                scale: isAttacking ? 1.15 : 1,
            }}
            transition={{
                type: "spring", stiffness: 60, damping: 20,
                opacity: { duration: 0.5 },
            }}
        >
            {/* The Katana (Energy Sword) */}
            <motion.div
                className="absolute top-1/2 left-1/2 z-40 flex items-center w-[500px]"
                style={{ originX: 0.15, marginTop: '-10px', marginLeft: '-50px' }}
                initial={{ rotate: -140, opacity: 0 }}
                animate={{
                    rotate: isAttacking ? 45 : -150,
                    x: isAttacking ? 30 : -20,
                    y: isAttacking ? 50 : -20,
                    opacity: isAttacking ? 1 : isReadying ? 1 : 0,
                }}
                transition={{ duration: isAttacking ? 0.2 : 0.8, ease: isAttacking ? "circOut" : "easeInOut" }}
            >
                {/* Sword Hilt */}
                <div className="w-24 h-4 bg-zinc-900 rounded-l-md border-y border-l border-zinc-700 shadow-lg relative z-10 flex-shrink-0" />
                {/* Sword Guard */}
                <div className="w-3 h-12 bg-zinc-800 border border-zinc-600 rounded-sm z-20 flex-shrink-0 -ml-1" />
                {/* Plasma Blade */}
                <motion.div 
                    className="h-2 rounded-r-full bg-white z-0 -ml-1"
                    style={{
                        boxShadow: '0 0 10px #fff, 0 0 20px #ef4444, 0 0 40px #ef4444, 0 0 80px #ef4444',
                    }}
                    initial={{ width: 350 }}
                    animate={{
                        width: isAttacking ? 450 : 350,
                        boxShadow: isAttacking 
                            ? '0 0 20px #fff, 0 0 40px #ef4444, 0 0 80px #ef4444, 0 0 120px #ef4444' 
                            : '0 0 10px #fff, 0 0 20px #ef4444, 0 0 40px #ef4444, 0 0 80px #ef4444',
                    }}
                />
            </motion.div>

            {/* Ninja Body / Silhouette */}
            <motion.div
                className="absolute inset-0 z-20 flex items-end justify-center drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]"
                animate={{
                    y: isAttacking ? 20 : 0,
                    scale: isAttacking ? 1.05 : 1,
                }}
            >
                <svg viewBox="0 0 500 500" className="w-full h-full">
                    <defs>
                        <filter id="redGlow" x="-50%" y="-50%" width="200%" height="200%">
                            <feGaussianBlur stdDeviation="8" result="blur" />
                            <feMerge>
                                <feMergeNode in="blur" />
                                <feMergeNode in="blur" />
                                <feMergeNode in="SourceGraphic" />
                            </feMerge>
                        </filter>
                        <linearGradient id="metalGradient" x1="0" y1="0" x2="1" y2="1">
                            <stop offset="0%" stopColor="#2a2a2a" />
                            <stop offset="100%" stopColor="#0f0f0f" />
                        </linearGradient>
                        <linearGradient id="darkMetal" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#1a1a1a" />
                            <stop offset="100%" stopColor="#050505" />
                        </linearGradient>
                    </defs>

                    {/* Shoulders */}
                    <path d="M 170 300 L 30 450 L 250 480 Z" fill="url(#metalGradient)" stroke="#333" strokeWidth="2" />
                    <path d="M 330 300 L 470 450 L 250 480 Z" fill="#111" stroke="#222" strokeWidth="2" />
                    
                    {/* Chest / Collar */}
                    <path d="M 170 300 L 250 360 L 330 300 L 280 480 L 220 480 Z" fill="url(#darkMetal)" stroke="#1a1a1a" strokeWidth="2" />
                    
                    {/* Neck Guard */}
                    <path d="M 180 280 L 250 330 L 320 280 L 250 360 Z" fill="#000" />

                    {/* Head base shadow */}
                    <path d="M 250 60 C 120 60, 120 200, 140 250 L 250 380 L 360 250 C 380 200, 380 60, 250 60 Z" fill="#050505" />

                    {/* Forehead Plate */}
                    <path d="M 250 80 L 160 200 L 250 240 L 340 200 Z" fill="url(#metalGradient)" stroke="#333" strokeWidth="1" />
                    <path d="M 250 80 C 150 80, 150 200, 160 200 Z" fill="#1f1f1f" stroke="#333" strokeWidth="1" />
                    <path d="M 250 80 C 350 80, 350 200, 340 200 Z" fill="#0a0a0a" stroke="#111" strokeWidth="1" />

                    {/* Jaw/Cheek Plates */}
                    <path d="M 150 230 L 250 280 L 250 360 L 170 300 Z" fill="#1a1a1a" stroke="#2a2a2a" strokeWidth="1" />
                    <path d="M 350 230 L 250 280 L 250 360 L 330 300 Z" fill="#0f0f0f" stroke="#1a1a1a" strokeWidth="1" />

                    {/* Side/Ear Plates */}
                    <path d="M 145 200 L 150 230 L 170 300 L 110 240 Z" fill="#111" stroke="#222" strokeWidth="1" />
                    <path d="M 355 200 L 350 230 L 330 300 L 390 240 Z" fill="#050505" stroke="#111" strokeWidth="1" />

                    {/* Visor Glass */}
                    <path d="M 155 205 L 250 245 L 345 205 L 350 220 L 250 270 L 150 220 Z" fill="#000" />
                    
                    {/* Glowing Eyes */}
                    <motion.path 
                        d="M 180 222 L 235 245 L 240 238 L 185 215 Z" 
                        fill="#ef4444" 
                        filter="url(#redGlow)"
                        animate={{
                            opacity: isAttacking ? 1 : 0.8,
                            scaleY: isAttacking ? 0.2 : 1,
                        }}
                    />
                    <motion.path 
                        d="M 320 222 L 265 245 L 260 238 L 315 215 Z" 
                        fill="#ef4444" 
                        filter="url(#redGlow)"
                        animate={{
                            opacity: isAttacking ? 1 : 0.8,
                            scaleY: isAttacking ? 0.2 : 1,
                        }}
                    />

                    {/* Visor Edge Highlight */}
                    <path d="M 155 205 L 250 245 L 345 205" fill="none" stroke="#333" strokeWidth="2" />
                    <path d="M 150 220 L 250 270 L 350 220" fill="none" stroke="#ef4444" strokeWidth="1" opacity="0.5" />
                </svg>
            </motion.div>

        </motion.div>
    );
}
