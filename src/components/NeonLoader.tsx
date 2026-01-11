'use client';

import React from 'react';
import { useAuth } from '@/contexts/AuthContext';

export default function NeonLoader() {
    const { user } = useAuth();
    const theme = user?.equipped_theme || 'default';

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden transition-colors duration-700"
            style={{ backgroundColor: 'var(--background, #000000)' }}
            data-theme={theme}
        >
            {/* Ambient Background Glow */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-[var(--theme-primary)] opacity-10 blur-[120px] animate-pulse" />
            </div>

            <div className="relative flex flex-col items-center">
                {/* Thunderbolt / Neon Effect Container */}
                <div className="relative w-32 h-32 md:w-48 md:h-48">
                    {/* Dynamic Glow Layer */}
                    <div className="absolute inset-0 bg-[var(--theme-primary)] rounded-full blur-[60px] opacity-20 animate-neon-pulse" />

                    {/* Thunderbolt Path SVG */}
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-full h-full text-[var(--theme-primary)] drop-shadow-[0_0_15px_rgba(var(--theme-primary-rgb),0.8)] animate-bounce-gentle"
                        style={{ filter: 'drop-shadow(0 0 20px var(--theme-primary))' }}
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                            className="animate-thunder-strike"
                        />
                    </svg>
                </div>

                {/* Loading Text */}
                <div className="mt-8 flex flex-col items-center space-y-2">
                    <h2 className="text-3xl font-black tracking-[0.2em] text-transparent bg-clip-text bg-gradient-to-r from-[var(--theme-primary)] via-[var(--foreground)] to-[var(--theme-primary)] animate-text-shimmer-fast uppercase">
                        Levelone
                    </h2>
                    <div className="flex space-x-1">
                        <span className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-bounce [animation-delay:-0.3s]" />
                        <span className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-bounce [animation-delay:-0.15s]" />
                        <span className="w-1 h-1 rounded-full bg-[var(--theme-primary)] animate-bounce" />
                    </div>
                </div>
            </div>

            <style jsx>{`
                @keyframes thunder-strike {
                    0%, 10%, 20%, 30%, 50%, 70%, 90%, 100% { opacity: 1; transform: scale(1); filter: brightness(1); }
                    5%, 15%, 25%, 60%, 80% { opacity: 0.7; transform: scale(0.98); filter: brightness(1.5) drop-shadow(0 0 30px var(--theme-primary)); }
                }
                .animate-thunder-strike {
                    animation: thunder-strike 3s infinite;
                }
                @keyframes neon-pulse {
                    0%, 100% { transform: scale(0.8); opacity: 0.1; }
                    50% { transform: scale(1.2); opacity: 0.3; }
                }
                .animate-neon-pulse {
                    animation: neon-pulse 2s ease-in-out infinite;
                }
                @keyframes bounce-gentle {
                    0%, 100% { transform: translateY(0); }
                    50% { transform: translateY(-10px); }
                }
                .animate-bounce-gentle {
                    animation: bounce-gentle 2s ease-in-out infinite;
                }
                @keyframes text-shimmer-fast {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .animate-text-shimmer-fast {
                    background-size: 200% auto;
                    animation: text-shimmer-fast 2s linear infinite;
                }
            `}</style>
        </div>
    );
}
