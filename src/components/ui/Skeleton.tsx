import { cn } from '@/lib/utils';

/**
 * Skeleton — animated shimmer placeholder block.
 * Matches the app's dark card aesthetic.
 */
export function Skeleton({ className }: { className?: string }) {
    return (
        <div
            className={cn(
                'animate-pulse rounded-xl bg-white/5 relative overflow-hidden',
                className
            )}
        >
            {/* Shimmer sweep */}
            <div className="absolute inset-0 -translate-x-full animate-[shimmer_1.6s_infinite] bg-gradient-to-r from-transparent via-white/8 to-transparent" />
        </div>
    );
}
