'use client';

import { Download } from 'lucide-react';
import { usePWAInstall } from '@/hooks/usePWAInstall';

export default function InstallPWA() {
    const { isInstallable, handleInstallClick } = usePWAInstall();

    if (!isInstallable) return null;

    return (
        <button
            onClick={handleInstallClick}
            className="flex items-center space-x-2 px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-all shadow-sm hover:shadow-md animate-pulse hover:animate-none"
            title="Install Levelone App"
        >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Install App</span>
        </button>
    );
}
