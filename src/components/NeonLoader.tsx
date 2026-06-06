'use client';

import { motion } from 'framer-motion';

export default function NeonLoader({ 
  text = 'Channeling Chakra...',
  fullScreen = true
}: { 
  text?: string;
  fullScreen?: boolean;
}) {
  const containerClasses = fullScreen 
    ? "fixed inset-0 z-[100] flex items-center justify-center bg-[#050507]"
    : "flex items-center justify-center p-8 bg-transparent";

  return (
    <div className={containerClasses}>
      <div className="relative flex flex-col items-center">
        {/* Shuriken Spinner */}
        <div className="relative w-24 h-24 mb-8">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{
              duration: 1.5,
              ease: "linear",
              repeat: Infinity
            }}
            className="absolute inset-0 flex items-center justify-center"
          >
            {/* 4 Point Shuriken */}
            <svg viewBox="0 0 100 100" className="w-full h-full drop-shadow-[0_0_15px_rgba(59,130,246,0.8)]">
              <path 
                d="M50 0 L55 45 L100 50 L55 55 L50 100 L45 55 L0 50 L45 45 Z" 
                fill="#3b82f6" 
                stroke="#1e3a8a" 
                strokeWidth="2" 
              />
              <circle cx="50" cy="50" r="10" fill="#050507" />
            </svg>
          </motion.div>
          
          {/* Outer glow ring */}
          <div className="absolute inset-0 rounded-full border border-blue-500/20 animate-ping"></div>
        </div>

        {/* Loading Text */}
        <div className="flex flex-col items-center gap-2">
          <h3 className="text-sm font-bold uppercase tracking-[0.3em] text-blue-400 drop-shadow-[0_0_8px_rgba(59,130,246,0.5)]">
            {text}
          </h3>
          
          {/* Progress Bar Container */}
          <div className="w-48 h-1 bg-zinc-900 rounded-full overflow-hidden mt-2 border border-zinc-800">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-600 via-blue-400 to-purple-500"
              initial={{ x: '-100%' }}
              animate={{ x: '100%' }}
              transition={{
                duration: 1.5,
                ease: "easeInOut",
                repeat: Infinity
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
