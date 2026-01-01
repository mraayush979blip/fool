'use client';

import React from 'react';

export default function NeonLoader() {
    return (
        <div className="fixed inset-0 bg-black z-[9999] flex items-center justify-center overflow-hidden">
            <div className="relative flex flex-col items-center">
                {/* Thunderbolt / Neon Effect Container */}
                <div className="relative w-32 h-32 md:w-48 md:h-48">
                    {/* Outer Glow */}
                    <div className="absolute inset-0 bg-green-500 rounded-full blur-[80px] opacity-20 animate-pulse"></div>

                    {/* Thunderbolt Path SVG */}
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="w-full h-full text-green-400 drop-shadow-[0_0_15px_rgba(74,222,128,0.8)] animate-bounce-fast"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={1.5}
                            d="M13 2L3 14h9l-1 8 10-12h-9l1-8z"
                            className="animate-neon-flash"
                        />
                    </svg>
                </div>

                {/* Loading Text */}
                <h2 className="mt-8 text-2xl font-black tracking-widest text-transparent bg-clip-text bg-gradient-to-r from-green-300 via-green-500 to-green-300 animate-text-shimmer uppercase">
                    Levelone
                </h2>
            </div>

            <style jsx>{`
                @keyframes neon-flash {
                    0%, 100% { opacity: 1; filter: drop-shadow(0 0 10px #4ade80); }
                    50% { opacity: 0.5; filter: drop-shadow(0 0 20px #22c55e); }
                }
                .animate-neon-flash {
                    animation: neon-flash 0.1s infinite alternate;
                }
                .animate-bounce-fast {
                    animation: bounce 0.5s infinite;
                }
                @keyframes text-shimmer {
                    0% { background-position: -200% center; }
                    100% { background-position: 200% center; }
                }
                .animate-text-shimmer {
                    background-size: 200% auto;
                    animation: text-shimmer 3s linear infinite;
                }
            `}</style>
        </div>
    );
}
