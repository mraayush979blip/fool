'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';
import { Loader2, ArrowLeft, ShoppingBag, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import StoreItemCard, { StoreItem } from '@/components/gamification/StoreItemCard';
import PointsDisplay from '@/components/gamification/PointsDisplay';
import { toast } from 'sonner';

export default function StorePage() {
    const { user, refreshUser } = useAuth();
    const [loading, setLoading] = useState(true);
    const [items, setItems] = useState<StoreItem[]>([]);
    const [userPoints, setUserPoints] = useState(0);
    const [userStreak, setUserStreak] = useState(0);
    const [equippedItems, setEquippedItems] = useState<{ theme: string, banner: string, avatar: string }>({
        theme: 'default',
        banner: 'default',
        avatar: '👤'
    });
    const [inventory, setInventory] = useState<Set<string>>(new Set());
    const [purchasingId, setPurchasingId] = useState<string | null>(null);

    const fetchData = async () => {
        setLoading(true);
        try {
            if (!user) return;

            // 1. Fetch User Stats (Points, Streak, Equips)
            const { data: userData } = await supabase
                .from('users')
                .select('points, current_streak, equipped_theme, equipped_banner, equipped_avatar')
                .eq('id', user.id)
                .single();

            if (userData) {
                setUserPoints(userData.points || 0);
                setUserStreak(userData.current_streak || 0);
                setEquippedItems({
                    theme: userData.equipped_theme || 'default',
                    banner: userData.equipped_banner || 'default',
                    avatar: userData.equipped_avatar || '👤'
                });
            }

            // 2. Fetch User Inventory
            const { data: invData } = await supabase
                .from('user_inventory')
                .select('item_id')
                .eq('user_id', user.id);

            const invSet = new Set((invData || []).map((i: any) => i.item_id));
            setInventory(invSet);

            // 3. Fetch Store Items
            const { data: itemData } = await supabase
                .from('store_items')
                .select('*')
                .order('cost', { ascending: true });

            const fetchedItems = itemData || [];

            // 4. Prepend Default Options (Ensure they always exist even if SQL wasn't run)
            const defaultItems: StoreItem[] = [
                {
                    id: 'default-avatar-id',
                    code: 'CHAR_DEFAULT',
                    name: 'Student',
                    description: 'The standard Levelone student avatar.',
                    cost: 0,
                    type: 'avatar',
                    asset_value: '👤'
                }
            ];

            // Only add defaults if they don't already exist in the database results
            let finalItems = [...defaultItems.filter(d => !fetchedItems.some(f => f.code === d.code)), ...fetchedItems]
                .filter(item => item.code !== 'DEFAULT_BANNER');

            // 5. Final Sort: Default Avatar MUST be first, then order by cost
            finalItems = finalItems.sort((a, b) => {
                if (a.code === 'CHAR_DEFAULT') return -1;
                if (b.code === 'CHAR_DEFAULT') return 1;
                return a.cost - b.cost;
            });

            setItems(finalItems);

        } catch (error) {
            console.error('Error fetching store data:', error);
            toast.error('Failed to load store');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchData();
    }, [user]);

    const handlePurchase = async (item: StoreItem) => {
        if (!user || purchasingId) return;

        setPurchasingId(item.id);
        try {
            const { data, error } = await supabase.rpc('purchase_item', { item_id_param: item.id });

            if (error) throw error;

            if (data.success) {
                toast.success(`Purchased ${item.name}!`);
                setUserPoints(data.new_balance); // Optimistic update from RPC return
                setInventory(prev => new Set(prev).add(item.id));
            } else {
                toast.error(data.message || 'Purchase failed');
            }
        } catch (error: any) {
            console.error('Purchase error:', error);
            toast.error(error.message || 'Failed to complete purchase');
        } finally {
            setPurchasingId(null);
        }
    };

    const handleEquip = async (item: StoreItem) => {
        try {
            if (!user) return;

            // SPECIAL CASE: Defaults might not be in the database inventory
            if (item.id === 'default-avatar-id' || item.id === 'default-banner-id' || item.id === 'default-theme-id') {
                let column = 'equipped_avatar';
                if (item.type === 'theme') column = 'equipped_theme';
                if (item.type === 'banner') column = 'equipped_banner';

                const { error } = await supabase
                    .from('users')
                    .update({ [column]: item.asset_value })
                    .eq('id', user.id);

                if (error) throw error;

                toast.success(`${item.name} Equipped!`);

                // Update local state
                setEquippedItems(prev => ({
                    ...prev,
                    [item.type]: item.asset_value
                }));
            } else {
                // REGULAR CASE: Real items in database
                const { data, error } = await supabase.rpc('equip_item', { item_id_param: item.id });

                if (error) throw error;

                if (data.success) {
                    toast.success(`${item.name} Equipped!`);
                    // Update local state based on item type
                    if (item.type === 'theme') {
                        setEquippedItems(prev => ({ ...prev, theme: item.asset_value }));
                    } else if (item.type === 'banner') {
                        setEquippedItems(prev => ({ ...prev, banner: item.asset_value }));
                    } else if (item.type === 'avatar') {
                        setEquippedItems(prev => ({ ...prev, avatar: item.asset_value }));
                    }
                } else {
                    toast.error(data.message || 'Equip failed');
                    return;
                }
            }

            // Refresh global user state in AuthContext to apply theme changes immediately
            await refreshUser();

        } catch (error: any) {
            console.error('Equip error:', error);
            toast.error('Failed to equip item');
        }
    };

    // Check if item is currently equipped
    const isItemEquipped = (item: StoreItem) => {
        if (item.type === 'theme') return equippedItems.theme === item.asset_value;
        if (item.type === 'banner') return equippedItems.banner === item.asset_value;
        if (item.type === 'avatar') return equippedItems.avatar === item.asset_value;
        return false;
    };

    const getLockedReason = (item: StoreItem): string | null => {
        if (item.required_streak && userStreak < item.required_streak) {
            return `Requires ${item.required_streak} Day Streak`;
        }
        // Badge checks would ideally go here if we fetched badge IDs, 
        // but purchase_item RPC handles the hard check.
        // For UI, we might need to fetch user badges to show this visually.
        return null;
    };

    if (loading) {
        return (
            <div className="flex justify-center items-center min-h-[60vh]">
                <Loader2 className="animate-spin h-12 w-12 text-purple-600" />
            </div>
        );
    }

    return (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 pb-16">
            {/* Header */}
            <div className="space-y-4">
                <Link href="/student" className="inline-flex items-center text-sm text-gray-500 hover:text-gray-900 transition-colors">
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back to Dashboard
                </Link>
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight flex items-center">
                            <ShoppingBag className="mr-3 h-8 w-8 text-purple-600" />
                            Points Store
                        </h1>
                        <p className="text-gray-500 mt-1">Spend your hard-earned points on exclusive rewards.</p>
                    </div>
                    <PointsDisplay points={userPoints} className="self-start md:self-auto" />
                </div>
            </div>

            {/* Fake Permission Message */}
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-r-xl flex items-start space-x-3 shadow-sm animate-pulse">
                <AlertCircle className="h-5 w-5 text-red-600 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-red-800">Ineligibility Warning</p>
                    <p className="text-sm text-red-700">
                        You are currently not eligible for some premium rewards. The admin has not given the permission to use the theme yet for your account status.
                    </p>
                </div>
            </div>

            {/* Store Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                {items.map((item) => (
                    <StoreItemCard
                        key={item.id}
                        item={item}
                        isOwned={item.cost === 0 || inventory.has(item.id)}
                        isEquipped={isItemEquipped(item)}
                        canAfford={userPoints >= item.cost}
                        lockedReason={getLockedReason(item)}
                        onPurchase={handlePurchase}
                        onEquip={handleEquip}
                        purchasing={purchasingId === item.id}
                    />
                ))}
            </div>
        </div>
    );
}
