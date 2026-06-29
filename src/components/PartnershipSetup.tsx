import { useState } from 'react';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { doc, setDoc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { motion } from 'motion/react';
import { Partnership } from '../types';
import { Link2, Copy, Check, Sparkles, Send, ShieldAlert, Heart, ArrowRight } from 'lucide-react';

export default function PartnershipSetup() {
  const { userProfile, setUserProfile, setPartnership } = useStore();
  const [loading, setLoading] = useState(false);
  const [joinCode, setJoinCode] = useState('');
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const handleCreatePartnership = async () => {
    if (!userProfile) return;
    setLoading(true);
    try {
      const pRef = doc(db, 'partnerships', userProfile.id); // Use admin ID as partnership ID
      const newPartnership = {
        adminId: userProfile.id,
        userId: null,
        totalHearts: 124,
        streakCount: 7,
        createdAt: serverTimestamp(),
      };
      await setDoc(pRef, newPartnership);
      await updateDoc(doc(db, 'users', userProfile.id), {
        partnershipId: pRef.id
      });
      setUserProfile({ ...userProfile, partnershipId: pRef.id });
      setPartnership({ id: pRef.id, ...newPartnership, createdAt: new Date().toISOString() } as unknown as Partnership);
    } catch (err) {
      handleFirestoreError(err, OperationType.CREATE, 'partnerships');
    } finally {
      setLoading(false);
    }
  };

  const handleJoinPartnership = async () => {
    if (!userProfile || !joinCode) return;
    setLoading(true);
    setError('');
    try {
      const pRef = doc(db, 'partnerships', joinCode.trim());
      const pSnap = await getDoc(pRef);
      if (!pSnap.exists()) {
        setError("Invalid Code. Please verify your partner's invite code.");
        setLoading(false);
        return;
      }
      
      const pData = pSnap.data();
      if (pData.userId) {
        setError("This partnership space is already full.");
        setLoading(false);
        return;
      }

      await updateDoc(pRef, {
        userId: userProfile.id
      });
      await updateDoc(doc(db, 'users', userProfile.id), {
        partnershipId: joinCode.trim()
      });
      setUserProfile({ ...userProfile, partnershipId: joinCode.trim() });
      setPartnership({ id: joinCode.trim(), ...pData, userId: userProfile.id } as Partnership);
    } catch (err) {
       setError("Could not join space. Check connection.");
    } finally {
      setLoading(false);
    }
  };

  const copyCode = () => {
    if (userProfile?.partnershipId) {
      navigator.clipboard.writeText(userProfile.partnershipId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 relative bg-[#040105]">
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-1/4 left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="glass-premium-card w-full max-w-sm p-6 md:p-8 rounded-[2.5rem] flex flex-col relative overflow-hidden border border-rose-500/20"
      >
        <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"></div>

        <div className="flex flex-col items-center text-center space-y-4 mb-6">
          <div className="w-14 h-14 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center text-rose-400 relative">
            <Link2 className="w-6 h-6 animate-pulse" />
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500 absolute -bottom-1 -right-1" />
          </div>
          <div>
            <h2 className="text-xl font-extrabold text-white">Create Partnership</h2>
            <p className="text-[10px] text-rose-300 font-bold uppercase tracking-widest mt-1">Connect your space</p>
          </div>
        </div>

        {error && (
          <div className="bg-rose-500/10 border border-rose-500/25 text-rose-300 p-3.5 rounded-2xl mb-4 text-xs flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <span className="leading-relaxed">{error}</span>
          </div>
        )}

        {userProfile?.role === 'admin' ? (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400 leading-relaxed text-center px-2 font-medium">
              Create a gorgeous shared partnership space, then share your exclusive access key with your partner to begin your journey.
            </p>
            
            {!userProfile.partnershipId ? (
              <motion.button
                whileHover={{ scale: 1.01 }}
                whileTap={{ scale: 0.99 }}
                onClick={handleCreatePartnership}
                disabled={loading}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-2 cursor-pointer text-xs uppercase tracking-wider"
              >
                <Sparkles className="w-4 h-4 text-white animate-spin" />
                <span>{loading ? 'Initializing...' : 'Create Space'}</span>
              </motion.button>
            ) : (
              <div className="space-y-4">
                <div className="p-4 bg-slate-950 border border-rose-500/15 rounded-2xl flex items-center justify-between gap-3 relative group overflow-hidden">
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-rose-300 font-bold uppercase tracking-widest mb-1">Your Invite Code</p>
                    <p className="font-mono text-xs sm:text-sm font-black text-white select-all break-all tracking-wider">{userProfile.partnershipId}</p>
                  </div>
                  <motion.button 
                    whileTap={{ scale: 0.9 }}
                    onClick={copyCode} 
                    className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-xl transition-colors text-rose-400 hover:text-white cursor-pointer shrink-0"
                  >
                    {copied ? <Check className="w-4 h-4 text-emerald-400" /> : <Copy className="w-4 h-4" />}
                  </motion.button>
                </div>

                <div className="flex items-center justify-center gap-2 py-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
                  <span className="text-[10px] text-rose-300 font-bold uppercase tracking-wider">Waiting for partner to join...</span>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <p className="text-xs text-slate-400 leading-relaxed text-center px-2 font-medium">
              Paste the custom partnership invite code from your partner below to synchronize your goals and rewards.
            </p>
            <div>
              <input
                type="text"
                placeholder="Ex: enter invite code..."
                value={joinCode}
                onChange={(e) => setJoinCode(e.target.value)}
                className="w-full bg-slate-950 border border-rose-500/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-rose-500 text-xs font-bold text-white text-center tracking-wider transition-all"
              />
            </div>
            <motion.button
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.99 }}
              onClick={handleJoinPartnership}
              disabled={loading || !joinCode}
              className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black rounded-2xl shadow-[0_4px_20px_rgba(244,63,94,0.3)] transition-all flex items-center justify-center gap-2 disabled:opacity-40 cursor-pointer text-xs uppercase tracking-wider"
            >
              <Send className="w-4 h-4" />
              <span>{loading ? 'Connecting...' : 'Synchronize'}</span>
            </motion.button>
          </div>
        )}
      </motion.div>
    </div>
  );
}
