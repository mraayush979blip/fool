'use client';

import { Lock, Check, ShoppingBag, AlertCircle } from 'lucide-react';

export interface StoreItem {
    id: string;
    code: string;
    name: string;
    description: string;
    cost: number;
    type: string;
    asset_value: string;
    required_badge_id?: string;
    required_streak?: number;
}

interface StoreItemCardProps {
    item: StoreItem;
    isOwned: boolean;
    isEquipped: boolean;
    canAfford: boolean;
    lockedReason: string | null;
    onPurchase: (item: StoreItem) => void;
    onEquip: (item: StoreItem) => void;
    purchasing: boolean;
}

export default function StoreItemCard({
    item,
    isOwned,
    isEquipped,
    canAfford,
    lockedReason,
    onPurchase,
    onEquip,
    purchasing
}: StoreItemCardProps) {
    const isLocked = !!lockedReason;

    return (
        <div className={`relative bg-white rounded-2xl border ${isEquipped ? 'border-purple-500 shadow-md ring-1 ring-purple-500' : 'border-gray-200'} overflow-hidden transition-all hover:shadow-lg flex flex-col h-full`}>

            {/* Visual Preview Placeholder */}
            <div className={`h-32 bg-gradient-to-br ${getGradientForType(item.type)} flex items-center justify-center relative p-4`}>
                <span className="text-4xl filter drop-shadow opacity-50">
                    {getIconForType(item.type)}
                </span>

                {isEquipped && (
                    <div className="absolute top-2 right-2 bg-purple-600 text-white text-xs font-bold px-2 py-1 rounded-full flex items-center shadow-sm">
                        <Check className="h-3 w-3 mr-1" /> Equipped
                    </div>
                )}

                {isLocked && (
                    <div className="absolute inset-0 bg-gray-900/50 backdrop-blur-[2px] flex items-center justify-center p-4 text-center">
                        <div className="bg-white/90 p-3 rounded-xl shadow-lg">
                            <Lock className="h-6 w-6 text-gray-500 mx-auto mb-1" />
                            <p className="text-xs font-bold text-gray-700">{lockedReason}</p>
                        </div>
                    </div>
                )}
            </div>

            <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <h3 className="font-bold text-gray-900 line-clamp-1">{item.name}</h3>
                    <span className={`text-xs font-bold px-2 py-1 rounded-md uppercase tracking-wide ${getTypeColor(item.type)}`}>
                        {item.type.replace('_', ' ')}
                    </span>
                </div>

                <p className="text-sm text-gray-500 mb-4 flex-1 line-clamp-2">
                    {item.description}
                </p>

                <div className="mt-auto">
                    {isOwned ? (
                        <button
                            onClick={() => onEquip(item)}
                            disabled={isEquipped || (item.code !== 'DEFAULT_THEME' && item.code !== 'DEFAULT_BANNER' && item.type !== 'avatar_frame')}
                            className={`w-full py-2.5 rounded-xl font-bold text-sm transition-colors flex items-center justify-center
                                ${isEquipped
                                    ? 'bg-gray-100 text-gray-400 cursor-default'
                                    : (item.code !== 'DEFAULT_THEME' && item.code !== 'DEFAULT_BANNER' && item.type !== 'avatar_frame')
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                                        : 'bg-purple-600 hover:bg-purple-700 text-white shadow-sm'
                                }`}
                        >
                            {isEquipped ? 'Active' : (item.code !== 'DEFAULT_THEME' && item.code !== 'DEFAULT_BANNER' && item.type !== 'avatar_frame') ? 'Upcoming' : 'Equip'}
                        </button>
                    ) : (
                        <div className="flex items-center space-x-2">
                            <button
                                onClick={() => onPurchase(item)}
                                disabled={isLocked || !canAfford || purchasing}
                                className={`flex-1 py-2.5 rounded-xl font-bold text-sm transition-all flex items-center justify-center
                                    ${isLocked
                                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                        : !canAfford
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            : 'bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-500 hover:to-orange-600 text-white shadow-sm hover:shadow-orange-200'
                                    }`}
                            >
                                {purchasing ? (
                                    <span className="animate-pulse">Processing...</span>
                                ) : (
                                    <>
                                        {isLocked ? (
                                            <Lock className="h-4 w-4 mr-1.5" />
                                        ) : !canAfford ? (
                                            <AlertCircle className="h-4 w-4 mr-1.5" />
                                        ) : (
                                            <ShoppingBag className="h-4 w-4 mr-1.5" />
                                        )}
                                        {item.cost.toLocaleString()}
                                    </>
                                )}
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

function getGradientForType(type: string): string {
    switch (type) {
        case 'theme': return 'from-indigo-100 to-purple-100';
        case 'banner': return 'from-pink-100 to-rose-100';
        case 'avatar_frame': return 'from-amber-100 to-yellow-100';
        default: return 'from-gray-100 to-gray-200';
    }
}

function getIconForType(type: string): string {
    switch (type) {
        case 'theme': return '🎨';
        case 'banner': return '🖼️';
        case 'avatar_frame': return '🤳';
        default: return '📦';
    }
}

function getTypeColor(type: string): string {
    switch (type) {
        case 'theme': return 'bg-indigo-100 text-indigo-700';
        case 'banner': return 'bg-pink-100 text-pink-700';
        case 'avatar_frame': return 'bg-amber-100 text-amber-700';
        default: return 'bg-gray-100 text-gray-700';
    }
}
