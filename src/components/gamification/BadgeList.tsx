import React from 'react';
import { Flame, Zap, Trophy, Crown, Mountain, Footprints, Award, Lock, Star } from 'lucide-react';

// Map string icon names to Lucide components
const IconMap: { [key: string]: any } = {
    Flame,
    Zap,
    Fire: Flame, // Fallback if Fire not imported or same as Flame
    Trophy,
    Crown,
    Mountain,
    Footprints,
    Award,
    Star
};

interface Badge {
    id: string;
    code: string;
    name: string;
    description: string;
    icon_name: string;
    category: string;
}

interface UserBadge {
    badge_id: string;
    earned_at: string;
}

interface BadgeListProps {
    badges: Badge[];
    userBadges: UserBadge[];
}

export default function BadgeList({ badges, userBadges }: BadgeListProps) {
    const earnedBadgeIds = new Set(userBadges.map(ub => ub.badge_id));

    // Group by category if needed, or just list
    const sortedBadges = [...badges].sort((a, b) => {
        const aEarned = earnedBadgeIds.has(a.id);
        const bEarned = earnedBadgeIds.has(b.id);
        // Show earned first
        if (aEarned && !bEarned) return -1;
        if (!aEarned && bEarned) return 1;
        return 0;
    });

    return (
        <div className="bg-white rounded-3xl p-8 border border-gray-100 shadow-sm space-y-6">
            <div className="flex items-center space-x-3">
                <div className="bg-purple-50 p-2 rounded-xl">
                    <Award className="h-5 w-5 text-purple-600" />
                </div>
                <div>
                    <h2 className="text-xl font-bold text-gray-900">Achievements</h2>
                    <p className="text-sm text-gray-500">
                        {userBadges.length} / {badges.length} Unlocked
                    </p>
                </div>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {sortedBadges.map((badge) => {
                    const isEarned = earnedBadgeIds.has(badge.id);
                    const Icon = IconMap[badge.icon_name] || Star;

                    return (
                        <div
                            key={badge.id}
                            className={`relative p-4 rounded-2xl border transition-all duration-200 group ${isEarned
                                ? 'bg-gradient-to-br from-purple-50 to-white border-purple-100 hover:shadow-md'
                                : 'bg-gray-50 border-gray-100 grayscale opacity-70'
                                }`}
                        >
                            <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-3 ${isEarned
                                ? 'bg-white shadow-sm text-purple-600'
                                : 'bg-gray-200 text-gray-400'
                                }`}>
                                {isEarned ? <Icon className="h-6 w-6" /> : <Lock className="h-5 w-5" />}
                            </div>

                            <h3 className={`font-bold text-sm mb-1 ${isEarned ? 'text-gray-900' : 'text-gray-500'}`}>
                                {badge.name}
                            </h3>
                            <p className="text-xs text-gray-500 leading-tight">
                                {badge.description}
                            </p>

                            {isEarned && (
                                <div className="absolute top-2 right-2">
                                    <div className="bg-yellow-400 rounded-full p-0.5">
                                        <div className="bg-white rounded-full p-px">
                                            <div className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>
    );
}
