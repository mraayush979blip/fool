'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Video, Zap, Loader2 } from 'lucide-react';

interface PhasePathSelectorProps {
    phase: any;
    isSelectingOption: boolean;
    onSelectOption: (optionId: string) => void;
}

export default function PhasePathSelector({ phase, isSelectingOption, onSelectOption }: PhasePathSelectorProps) {
    return (
        <div className="max-w-4xl mx-auto px-6 py-12 space-y-10">
            <Link href="/student" className="inline-flex items-center gap-2 text-muted hover:text-primary transition-colors mb-8">
                <ArrowLeft className="h-4 w-4" />
                <span className="text-sm font-bold">Back to Dashboard</span>
            </Link>

            <div className="text-center space-y-4">
                <h1 className="text-3xl md:text-5xl font-black tracking-tight text-foreground">Select Your Study Path</h1>
                <p className="text-muted text-lg max-w-2xl mx-auto">This phase offers multiple specialized video lessons and assignments. Please choose the one that best suits your current learning needs.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-8">
                {phase.options?.map((option: any) => (
                    <motion.button
                        key={option.id}
                        whileHover={{ y: -5 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => onSelectOption(option.id)}
                        disabled={isSelectingOption}
                        className="bg-card p-8 rounded-[2rem] border border-card-border shadow-sm hover:border-primary/30 text-left transition-all group relative overflow-hidden"
                    >
                        <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full -mr-16 -mt-16 group-hover:bg-primary/10 transition-colors" />
                        
                        <div className="relative space-y-4">
                            <div className="p-4 bg-primary/10 rounded-2xl w-fit">
                                <Video className="w-6 h-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="text-xl font-bold text-foreground mb-2 group-hover:text-primary transition-colors">{option.title}</h3>
                                <p className="text-sm font-medium text-muted line-clamp-2">Complete the specialized assignment and video lesson for this track.</p>
                            </div>
                            <div className="flex items-center text-[10px] font-black uppercase tracking-widest text-primary pt-4 group-hover:translate-x-1 transition-transform">
                                Select Path <Zap className="ml-2 w-3.5 h-3.5 fill-current" />
                            </div>
                        </div>
                    </motion.button>
                ))}
            </div>

            {isSelectingOption && (
                <div className="fixed inset-0 bg-[#050507]/90 z-50 flex items-center justify-center">
                    <Loader2 className="w-12 h-12 text-primary animate-spin" />
                </div>
            )}
        </div>
    );
}
