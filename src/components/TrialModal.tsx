'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { Swords, Code, Quote, ArrowRight } from 'lucide-react';

export default function TrialModal() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function checkTrialStatus() {
      if (!user) return;

      // 1. Check local storage first to avoid network requests & 400 errors
      const localStatus = localStorage.getItem(`ninja_trial_${user.id}`);
      if (localStatus === 'completed') {
        setLoading(false);
        return;
      }

      try {
        // 2. Fallback to checking Supabase
        const { data, error } = await supabase
          .from('users')
          .select('trial_completed')
          .eq('id', user.id)
          .single();
          
        if (error) {
          // If we get a 400 (table missing), fallback to session storage so we don't spam them
          if (!sessionStorage.getItem('ninja_trial_shown')) {
            setIsOpen(true);
            sessionStorage.setItem('ninja_trial_shown', 'true');
          }
          setLoading(false);
          return;
        }

        if (!data?.trial_completed) {
          setIsOpen(true);
        } else {
          localStorage.setItem(`ninja_trial_${user.id}`, 'completed');
        }
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      } catch (e) {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }
    
    checkTrialStatus();
  }, [user]);

  const handleCompleteTrial = async () => {
    setIsOpen(false);
    if (!user) return;

    // Immediately cache as completed locally
    localStorage.setItem(`ninja_trial_${user.id}`, 'completed');

    try {
      const { error } = await supabase
        .from('users')
        .upsert({ id: user.id, trial_completed: true }, { onConflict: 'id' });
        
      if (error) {
        // Silently fail if column/table doesn't exist
      }
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      // Silently fail
    }
  };

  if (loading) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 sm:p-6">
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-[#050507]/95"
          />
          
          <motion.div 
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            className="relative w-full max-w-2xl bg-[#090a0f] border border-blue-900/50 rounded-[2rem] shadow-[0_0_50px_rgba(59,130,246,0.2)] overflow-hidden"
          >
            {/* Top liquid glow */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50" />
            
            <div className="p-8 sm:p-12 text-center space-y-8 relative z-10">
              <motion.div
                initial={{ rotate: -180, scale: 0 }}
                animate={{ rotate: 0, scale: 1 }}
                transition={{ type: "spring", delay: 0.2 }}
                className="mx-auto w-20 h-20 bg-[#050507] border border-blue-500/30 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(59,130,246,0.3)]"
              >
                <Swords className="w-10 h-10 text-blue-400 drop-shadow-[0_0_10px_rgba(59,130,246,0.8)]" />
              </motion.div>

              <div className="space-y-4">
                <h2 className="text-3xl sm:text-4xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 uppercase tracking-tighter">
                  The Ninja's Path Begins
                </h2>
                
                <div className="relative p-6 border border-zinc-800/50 bg-[#050507]/50 rounded-2xl">
                  <Quote className="absolute top-4 left-4 w-6 h-6 text-zinc-700" />
                  <p className="text-zinc-300 font-medium leading-relaxed italic text-lg sm:text-xl px-8">
                    "Just as the ninja masters the shadows through endless repetition, the coder masters the machine through relentless debugging. Silence the errors, execute with precision, and your logic will become absolute."
                  </p>
                  <Quote className="absolute bottom-4 right-4 w-6 h-6 text-zinc-700 rotate-180" />
                </div>
              </div>

              <button 
                onClick={handleCompleteTrial}
                className="btn-liquid-metal w-full sm:w-auto px-12 py-4 uppercase tracking-[0.2em] font-bold text-sm inline-flex items-center justify-center gap-3"
              >
                <span className="btn-liquid-metal-inner flex items-center gap-2">
                  Accept The Path
                  <ArrowRight className="w-4 h-4 text-blue-400" />
                </span>
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
