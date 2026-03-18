'use client';

import { useEffect } from 'react';

/**
 * PWADriver Component
 * Handles the registration of the Service Worker to enable PWA installation 
 * and offline functionality for Levelone students.
 */
export default function PWADriver() {
    useEffect(() => {
        // Only run on the client and if the browser supports service workers
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
            const registerSW = async () => {
                try {
                    // Register the service worker from our public folder
                    const registration = await navigator.serviceWorker.register('/sw.js', {
                        scope: '/'
                    });

                    // Force update if a new worker is found
                    registration.onupdatefound = () => {
                        const newWorker = registration.installing;
                        if (newWorker) {
                            newWorker.onstatechange = () => {
                                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                                    console.log('🔄 Levelone: New version detected! Preparing to update...');
                                    // Could show a toast here to the student
                                }
                            };
                        }
                    };

                    console.log('✅ PWA: Service Worker registered successfully');
                } catch (error) {
                    console.error('❌ PWA: Service Worker registration failed:', error);
                }
            };

            // Call the registration function
            registerSW();
        }
    }, []);

    return null; // Headless component, no UI needed
}
