'use client';

import { Coins } from 'lucide-react';

interface PointsDisplayProps {
    points: number;
    className?: string;
}

export default function PointsDisplay({ points, className = '' }: PointsDisplayProps) {
    return (
        <div className={`flex items-center space-x-2 bg-gradient-to-r from-yellow-100 to-amber-100 text-amber-900 px-4 py-2 rounded-full border border-amber-200 shadow-sm ${className}`}>
            <Coins className="h-5 w-5 text-amber-600 fill-amber-500" />
            <span className="font-extrabold text-lg font-mono">
                {points.toLocaleString()}
            </span>
            <span className="text-xs font-bold text-amber-700 uppercase tracking-wider ml-1">
                PTS
            </span>
        </div>
    );
}
