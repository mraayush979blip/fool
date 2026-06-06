'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { LayoutDashboard, Trophy, ShoppingBag, Sparkles, User, Settings, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TutorialPage() {
    const sections = [
        {
            icon: LayoutDashboard,
            title: 'Dashboard',
            color: 'text-blue-500',
            bg: 'bg-blue-500/10',
            description: 'Your central hub. Here you can view your overall progress, active courses, and jump right back into your learning path.'
        },
        {
            icon: Trophy,
            title: 'Compete',
            color: 'text-amber-500',
            bg: 'bg-amber-500/10',
            description: 'Ready for a challenge? Participate in coding phases, compete with other students on the leaderboard, and earn points!'
        },
        {
            icon: ShoppingBag,
            title: 'Rewards Store',
            color: 'text-purple-500',
            bg: 'bg-purple-500/10',
            description: 'Spend your hard-earned points here! Unlock cool avatars, new UI themes, and other fun digital upgrades.'
        },
        {
            icon: Sparkles,
            title: 'AI Help',
            color: 'text-emerald-500',
            bg: 'bg-emerald-500/10',
            description: 'Stuck on a problem? Our built-in AI assistant is here to guide you, explain complex concepts, and help you debug your code.'
        },
        {
            icon: User,
            title: 'Profile & Menu',
            color: 'text-rose-500',
            bg: 'bg-rose-500/10',
            description: 'Click the hamburger menu to equip your avatars, change your visual theme (Dark/Light mode), and report bugs.'
        }
    ];

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: { staggerChildren: 0.1 }
        }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } }
    };

    return (
        <div className="max-w-4xl mx-auto space-y-12">
            <div className="flex items-center gap-4 mb-8">
                <Link href="/student" className="p-3 rounded-xl bg-card border border-card-border hover:border-primary/50 transition-all text-muted hover:text-foreground">
                    <ArrowLeft className="w-5 h-5" />
                </Link>
                <div>
                    <h1 className="text-4xl font-black tracking-tight text-foreground">How to Use Levelone</h1>
                    <p className="text-muted mt-2">Welcome! Here is a quick guide to everything you can do on your platform.</p>
                </div>
            </div>

            <motion.div 
                variants={containerVariants}
                initial="hidden"
                animate="visible"
                className="grid gap-6 md:grid-cols-2"
            >
                {sections.map((section, index) => (
                    <motion.div 
                        key={index}
                        variants={itemVariants}
                        className="p-6 rounded-[2rem] bg-card border border-card-border shadow-sm hover:shadow-lg transition-all"
                    >
                        <div className="flex items-center gap-4 mb-4">
                            <div className={`p-4 rounded-2xl ${section.bg}`}>
                                <section.icon className={`w-8 h-8 ${section.color}`} />
                            </div>
                            <h2 className="text-xl font-bold">{section.title}</h2>
                        </div>
                        <p className="text-muted leading-relaxed font-medium">
                            {section.description}
                        </p>
                    </motion.div>
                ))}
            </motion.div>

            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 p-8 rounded-[2.5rem] bg-gradient-to-br from-primary/20 via-primary/5 to-transparent border border-primary/20 text-center"
            >
                <div className="inline-flex items-center justify-center p-4 bg-primary/20 rounded-full mb-6">
                    <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-2xl font-black mb-4">Ready to start?</h2>
                <p className="text-muted max-w-lg mx-auto mb-8">
                    Dive into your dashboard and start your first learning phase to earn points!
                </p>
                <Link 
                    href="/student" 
                    className="inline-flex items-center gap-2 px-8 py-4 bg-primary text-primary-foreground font-bold rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-lg shadow-primary/30"
                >
                    Go to Dashboard
                </Link>
            </motion.div>
        </div>
    );
}
