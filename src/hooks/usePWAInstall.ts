'use client';

import { useState, useEffect } from 'react';

/**
 * usePWAInstall()
 * Modular hook to capture 'beforeinstallprompt' event and 
 * manage the PWA installation state for Levelone.
 */
export function usePWAInstall() {
    const [installPrompt, setInstallPrompt] = useState<any>(null);
    const [isInstallable, setIsInstallable] = useState(false);
    const [isStandalone, setIsStandalone] = useState(false);

    useEffect(() => {
        // Detect if the app is already in standalone mode
        const isStandaloneMatch = window.matchMedia('(display-mode: standalone)').matches;
        setIsStandalone(isStandaloneMatch);

        // Captured prompt listener
        const handler = (e: any) => {
            // Prevent Chrome 67 and earlier from automatically showing the prompt
            e.preventDefault();
            // Stash the event so it can be triggered later.
            setInstallPrompt(e);
            setIsInstallable(true);
            console.log('✅ PWA ENGINE: Install prompt stashed and ready.');
        };

        window.addEventListener('beforeinstallprompt', handler);

        // iOS detection/manual check
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent);
        if (isIOS && !isStandaloneMatch) {
            setIsInstallable(true); // Always "Installable" on iOS for the guide
        }

        return () => window.removeEventListener('beforeinstallprompt', handler);
    }, []);

    const handleInstallClick = async () => {
        if (!installPrompt) return;

        // Show the native browser prompt
        installPrompt.prompt();

        // Wait for the user to respond to the prompt
        const { outcome } = await installPrompt.userChoice;
        console.log(`✅ PWA ENGINE: User responded with: ${outcome}`);

        // We've used the prompt, throw it away
        setInstallPrompt(null);
        setIsInstallable(false);
    };

    return { 
        isInstallable, 
        isStandalone, 
        handleInstallClick,
        isIOS: /iPad|iPhone|iPod/.test(navigator.userAgent)
    };
}
