'use client';

import { motion } from 'framer-motion';

export default function StudentTemplate({ children }: { children: React.ReactNode }) {
    return (
        <div className="relative w-full h-full">
            {/* The Fast Sword Slash Transition */}
            <motion.div
                className="pointer-events-none fixed inset-0 z-[9999] flex items-center justify-center overflow-hidden"
                initial={{ opacity: 1 }}
                animate={{ opacity: 0, transitionEnd: { display: "none" } }}
                transition={{ duration: 0.1, delay: 0.6 }}
            >
                {/* Top Half Cover */}
                <motion.div
                    className="absolute top-0 left-0 right-0 h-1/2 bg-[#050507]"
                    initial={{ y: 0 }}
                    animate={{ y: "-100%" }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
                />
                
                {/* Bottom Half Cover */}
                <motion.div
                    className="absolute bottom-0 left-0 right-0 h-1/2 bg-[#050507]"
                    initial={{ y: 0 }}
                    animate={{ y: "100%" }}
                    transition={{ duration: 0.4, delay: 0.2, ease: [0.76, 0, 0.24, 1] }}
                />

                {/* The Horizontal Sword Slash */}
                <motion.div
                    className="absolute h-1 bg-gradient-to-r from-white via-blue-500 to-white shadow-[0_0_30px_#3b82f6]"
                    initial={{ width: "0%", opacity: 1, scaleY: 3 }}
                    animate={{ width: "200%", opacity: 0, scaleY: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                />
            </motion.div>

            {/* Page Content Reveal */}
            <motion.div
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.4, delay: 0.2, ease: "easeOut" }}
                className="w-full h-full"
            >
                {children}
            </motion.div>
        </div>
    );
}
