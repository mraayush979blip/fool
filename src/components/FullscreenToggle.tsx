'use client';

import React, { useState, useEffect } from 'react';
import { Maximize, Minimize } from 'lucide-react';

export default function FullscreenToggle() {
    const [isFullscreen, setIsFullscreen] = useState(false);
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        const handleFullscreenChange = () => {
            setIsFullscreen(!!document.fullscreenElement);
        };
        
        document.addEventListener('fullscreenchange', handleFullscreenChange);
        return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
    }, []);

    const toggleFullscreen = async () => {
        if (!document.fullscreenElement) {
            try {
                if (document.documentElement.requestFullscreen) {
                    await document.documentElement.requestFullscreen();
                } else if ((document.documentElement as any).webkitRequestFullscreen) {
                    await ((document.documentElement as any).webkitRequestFullscreen)();
                }
            } catch (err) {
                console.warn('Error attempting to enable fullscreen:', err);
            }
        } else {
            try {
                if (document.exitFullscreen) {
                    await document.exitFullscreen();
                } else if ((document as any).webkitExitFullscreen) {
                    await ((document as any).webkitExitFullscreen)();
                }
            } catch (err) {
                console.warn('Error attempting to exit fullscreen:', err);
            }
        }
    };

    if (!mounted) return null;

    return (
        <button
            onClick={toggleFullscreen}
            className="p-2 rounded-xl bg-card border border-card-border hover:border-primary/30 text-muted hover:text-foreground transition-all active:scale-95 flex items-center justify-center"
            aria-label="Toggle Fullscreen"
            title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
        >
            {isFullscreen ? <Minimize className="h-4 w-4" /> : <Maximize className="h-4 w-4" />}
        </button>
    );
}
