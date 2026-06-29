import { useState } from 'react';
import { auth, db } from '../lib/firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';
import { Role, UserProfile } from '../types';
import { Sparkles, Shield, User, ArrowRight, Heart } from 'lucide-react';

export default function Onboarding() {
  const [loading, setLoading] = useState(false);
  const { setUserProfile } = useStore();

  const handleSelectRole = async (role: Role) => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userDoc = {
        email: auth.currentUser.email || '',
        role,
        partnershipId: null,
        createdAt: serverTimestamp(),
      };
      await setDoc(doc(db, 'users', auth.currentUser.uid), userDoc);
      setUserProfile({ id: auth.currentUser.uid, ...userDoc, createdAt: new Date().toISOString() } as unknown as UserProfile);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 relative bg-[#040105]">
      {/* Background lights */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-80 h-80 bg-rose-500/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/4 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-premium-card w-full max-w-sm p-6 md:p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden border border-rose-500/20"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"></div>

        <h2 className="text-2xl font-black text-center tracking-tight text-white mb-1">
          Choose your role
        </h2>
        <p className="text-slate-400 mb-8 text-center text-xs leading-relaxed font-bold uppercase tracking-wider text-rose-300/80">
          Select how you want to continue
        </p>

        <div className="flex flex-col gap-4 w-full">
          
          {/* OPTION 1: ADMIN (Shield with Heart Icon) */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole('admin')}
            disabled={loading}
            className="group relative flex items-center gap-4 p-5 text-left bg-[#130713]/80 hover:bg-rose-950/20 border border-rose-500/15 hover:border-rose-500/40 rounded-2xl transition-all cursor-pointer shadow-lg"
          >
            <div className="p-3.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-400 relative">
              <Shield className="w-6 h-6" />
              <Heart className="w-3 h-3 text-rose-500 fill-rose-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-100 group-hover:text-rose-300 transition-colors">Partner Admin</span>
                <ArrowRight className="w-4 h-4 text-rose-400 transform group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Create tasks, manage hearts, approve tasks and manage rewards.
              </p>
            </div>
          </motion.button>
          
          {/* OPTION 2: USER (Avatar Circle Icon) */}
          <motion.button
            whileHover={{ scale: 1.02, translateY: -2 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => handleSelectRole('user')}
            disabled={loading}
            className="group relative flex items-center gap-4 p-5 text-left bg-[#130713]/80 hover:bg-rose-950/20 border border-rose-500/15 hover:border-rose-500/40 rounded-2xl transition-all cursor-pointer shadow-lg"
          >
            <div className="p-3.5 rounded-full bg-rose-500/15 border border-rose-500/35 text-rose-400">
              <User className="w-6 h-6 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span className="font-extrabold text-sm text-slate-100 group-hover:text-rose-300 transition-colors">Partner User</span>
                <ArrowRight className="w-4 h-4 text-rose-400 transform group-hover:translate-x-1 transition-transform" />
              </div>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                Complete tasks, earn hearts, redeem rewards and level up.
              </p>
            </div>
          </motion.button>

        </div>

        <p className="text-[10px] text-center text-slate-500 font-bold uppercase mt-8 tracking-wider">
          You can switch roles anytime
        </p>
      </motion.div>
    </div>
  );
}
