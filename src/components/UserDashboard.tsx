import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, increment } from 'firebase/firestore';
import { Task, Reward, Redemption } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { getDemoTasks, saveDemoTasks, getDemoRewards, saveDemoRewards, getDemoRedemptions, saveDemoRedemptions } from '../lib/demoStorage';
import { 
  Heart, 
  Flame, 
  LogOut, 
  Check, 
  Gift, 
  Lock, 
  Unlock, 
  Sparkles, 
  User, 
  ListTodo, 
  Clock, 
  Award, 
  AlertCircle,
  CheckCircle2,
  Bell,
  ChevronRight,
  TrendingUp,
  Droplet,
  GlassWater,
  Dumbbell,
  BookOpen,
  Coffee,
  CheckCircle,
  Plus,
  Shield,
  Eye,
  Camera,
  MessageSquare,
  HelpCircle,
  Moon,
  Info
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Seed mock checklist data for high-fidelity representation of Screen 4
interface DailyProgressItem {
  id: string;
  title: string;
  rewardHearts: number;
  completed: boolean;
  category: 'workout' | 'reading' | 'water' | 'meditation' | 'diet';
  description: string;
}

const DEFAULT_DAILY_ITEMS: DailyProgressItem[] = [
  { id: 'daily_1', title: 'Morning Workout', rewardHearts: 5, completed: true, category: 'workout', description: 'Complete your full workout session in the morning.' },
  { id: 'daily_2', title: 'Read 20 Pages', rewardHearts: 3, completed: true, category: 'reading', description: 'Read at least 20 pages of your favorite book.' },
  { id: 'daily_3', title: 'Drink 2L Water', rewardHearts: 2, completed: false, category: 'water', description: 'Hydrate continuously throughout the day.' },
  { id: 'daily_4', title: 'Meditation 10 mins', rewardHearts: 3, completed: true, category: 'meditation', description: 'Take 10 minutes to breathe and focus.' },
  { id: 'daily_5', title: 'No Sugar Day', rewardHearts: 5, completed: false, category: 'diet', description: 'Avoid any refined sugar today.' }
];

const WEEKLY_STATS_DATA = [
  { name: 'Mon', hearts: 12 },
  { name: 'Tue', hearts: 18 },
  { name: 'Wed', hearts: 15 },
  { name: 'Thu', hearts: 24 },
  { name: 'Fri', hearts: 20 },
  { name: 'Sat', hearts: 32 },
  { name: 'Sun', hearts: 42 },
];

export default function UserDashboard() {
  const { userProfile, partnership, isDemoMode, setPartnership } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  
  // Luxury 4-tab system
  const [activeTab, setActiveTab] = useState<'home' | 'tasks' | 'rewards' | 'profile'>('home');
  const [rewardsSubTab, setRewardsSubTab] = useState<'all' | 'claimed'>('all');

  // Interactive Level and XP State
  const [userXp, setUserXp] = useState(850);
  const [userLevel, setUserLevel] = useState(12);

  // Daily Progress Items (from image)
  const [dailyItems, setDailyItems] = useState<DailyProgressItem[]>(() => {
    const saved = localStorage.getItem('heartgoals_daily_items');
    return saved ? JSON.parse(saved) : DEFAULT_DAILY_ITEMS;
  });

  // Drink Water Tracker states (Screen 7 in image)
  const [waterMilliliters, setWaterMilliliters] = useState<number>(() => {
    const saved = localStorage.getItem('heartgoals_water_ml');
    return saved ? parseInt(saved) : 1500;
  });
  const waterGoal = 2000;

  // Selected Detail Modals
  const [selectedTask, setSelectedTask] = useState<DailyProgressItem | null>(null);
  const [proofImage, setProofImage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isWaterModalOpen, setIsWaterModalOpen] = useState(false);
  const [showNotificationBadge, setShowNotificationBadge] = useState(true);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  // Profile Edit Modal State
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [profileName, setProfileName] = useState('My Love 💕');
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Sync state to local storage
  useEffect(() => {
    localStorage.setItem('heartgoals_daily_items', JSON.stringify(dailyItems));
  }, [dailyItems]);

  useEffect(() => {
    localStorage.setItem('heartgoals_water_ml', waterMilliliters.toString());
  }, [waterMilliliters]);

  useEffect(() => {
    if (isDemoMode) {
      setTasks(getDemoTasks());
      setRewards(getDemoRewards());
      setRedemptions(getDemoRedemptions());

      const syncDemoData = () => {
        setTasks(getDemoTasks());
        setRewards(getDemoRewards());
        setRedemptions(getDemoRedemptions());
      };

      const interval = setInterval(syncDemoData, 1000);
      window.addEventListener('storage', syncDemoData);
      return () => {
        clearInterval(interval);
        window.removeEventListener('storage', syncDemoData);
      };
    }

    if (!partnership?.id) return;
    const tasksRef = collection(db, 'partnerships', partnership.id, 'tasks');
    const rewardsRef = collection(db, 'partnerships', partnership.id, 'rewards');
    const redemptionsRef = collection(db, 'partnerships', partnership.id, 'redemptions');

    const uTasks = onSnapshot(query(tasksRef), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    const uRewards = onSnapshot(query(rewardsRef), (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reward)));
    });
    const uRedemptions = onSnapshot(query(redemptionsRef), (snap) => {
      setRedemptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Redemption)));
    });

    return () => { uTasks(); uRewards(); uRedemptions(); };
  }, [partnership?.id, isDemoMode]);

  const markTaskCompleted = async (task: Task) => {
    if (isDemoMode) {
      const currentTasks = getDemoTasks();
      const updated = currentTasks.map(t => {
        if (t.id === task.id) {
          return { ...t, status: 'completed' as const, updatedAt: new Date().toISOString() };
        }
        return t;
      });
      saveDemoTasks(updated);
      setTasks(updated);
      return;
    }

    if (!partnership?.id) return;
    try {
      await updateDoc(doc(db, 'partnerships', partnership.id, 'tasks', task.id), {
        status: 'completed',
        updatedAt: serverTimestamp()
      });
    } catch (error) {
      console.error(error);
    }
  };

  const toggleDailyItem = (itemId: string) => {
    let xpIncrement = 0;
    let heartIncrement = 0;

    const updated = dailyItems.map(item => {
      if (item.id === itemId) {
        const nextCompleted = !item.completed;
        if (nextCompleted) {
          xpIncrement = 50;
          heartIncrement = item.rewardHearts;
        } else {
          heartIncrement = -item.rewardHearts;
        }
        return { ...item, completed: nextCompleted };
      }
      return item;
    });

    setDailyItems(updated);

    if (xpIncrement > 0) {
      setUserXp(prevXp => {
        const total = prevXp + xpIncrement;
        if (total >= 1200) {
          setUserLevel(lvl => lvl + 1);
          return total - 1200;
        }
        return total;
      });
    }

    if (heartIncrement !== 0 && partnership) {
      const nextHearts = Math.max(0, partnership.totalHearts + heartIncrement);
      setPartnership({
        ...partnership,
        totalHearts: nextHearts
      });
      if (!isDemoMode && partnership.id) {
        updateDoc(doc(db, 'partnerships', partnership.id), {
          totalHearts: increment(heartIncrement)
        }).catch(console.error);
      }
    }
  };

  const addWater = (amount: number) => {
    const prevWater = waterMilliliters;
    const nextWater = Math.min(waterGoal, prevWater + amount);
    setWaterMilliliters(nextWater);

    if (nextWater >= waterGoal && prevWater < waterGoal) {
      // Just unlocked the water daily goal! Toggle it in list!
      setDailyItems(items => items.map(it => it.category === 'water' && !it.completed ? { ...it, completed: true } : it));
      setUserXp(p => p + 100);
      if (partnership) {
        setPartnership({ ...partnership, totalHearts: partnership.totalHearts + 2 });
        if (!isDemoMode && partnership.id) {
          updateDoc(doc(db, 'partnerships', partnership.id), {
            totalHearts: increment(2)
          }).catch(console.error);
        }
      }
    }
  };

  const redeemReward = async (reward: Reward) => {
    if (!partnership?.id || (partnership.totalHearts < reward.cost)) return;

    if (isDemoMode) {
      const currentRedemptions = getDemoRedemptions();
      const newRed: Redemption = {
        id: 'demo_red_' + Date.now(),
        rewardId: reward.id,
        rewardTitle: reward.title,
        cost: reward.cost,
        status: 'pending',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [newRed, ...currentRedemptions];
      saveDemoRedemptions(updated);
      setRedemptions(updated);

      setPartnership({
        ...partnership,
        totalHearts: partnership.totalHearts - reward.cost,
      });
      return;
    }

    try {
      const newRef = doc(collection(db, 'partnerships', partnership.id, 'redemptions'));
      await setDoc(newRef, {
        rewardId: reward.id,
        rewardTitle: reward.title,
        cost: reward.cost,
        status: 'pending',
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      await updateDoc(doc(db, 'partnerships', partnership.id), {
        totalHearts: increment(-reward.cost)
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'redemptions');
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setProofImage(reader.result as string);
        setIsUploading(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const completeTaskWithProof = () => {
    if (selectedTask) {
      toggleDailyItem(selectedTask.id);
      setSelectedTask(null);
      setProofImage(null);
    }
  };

  const pendingTasks = tasks.filter(t => t.status === 'pending');
  const awaitingApprovalTasks = tasks.filter(t => t.status === 'completed');

  // Category Icon Map
  const getCategoryIcon = (cat: string) => {
    switch (cat) {
      case 'workout': return <Dumbbell className="w-4 h-4 text-rose-400" />;
      case 'reading': return <BookOpen className="w-4 h-4 text-violet-400" />;
      case 'water': return <Droplet className="w-4 h-4 text-sky-400" />;
      case 'meditation': return <Sparkles className="w-4 h-4 text-amber-400" />;
      default: return <Coffee className="w-4 h-4 text-pink-400" />;
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-[#060306] pb-28 relative text-slate-100 overflow-x-hidden">
      
      {/* Background Neon Blurs */}
      <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[350px] h-[350px] bg-rose-500/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute top-[40%] right-[-100px] w-[250px] h-[250px] bg-violet-600/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Main Content Render based on Active Tab */}
      <div className="flex-1">
        <AnimatePresence mode="wait">
          
          {/* HOME TAB (Mockup Screen 4 & 7) */}
          {activeTab === 'home' && (
            <motion.div
              key="home-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-5 space-y-5"
            >
              {/* Header */}
              <div className="flex justify-between items-center pt-5">
                <div>
                  <h2 className="text-xl font-extrabold tracking-tight text-white flex items-center gap-1.5">
                    Good Morning, Love 💕
                  </h2>
                  <p className="text-xs text-rose-300/80 font-semibold mt-0.5">Let's make today amazing ✨</p>
                </div>
                <div className="flex items-center gap-2 relative">
                  <button 
                    onClick={() => {
                      setShowNotificationBadge(false);
                      setNotificationsOpen(!notificationsOpen);
                    }}
                    className="p-3 bg-[#160c15] border border-rose-500/20 rounded-2xl text-rose-400 hover:text-white transition-all relative cursor-pointer"
                  >
                    <Bell className="w-5 h-5 animate-pulse" />
                    {showNotificationBadge && (
                      <span className="absolute top-2 right-2 w-2.5 h-2.5 bg-rose-500 rounded-full glow-pink-strong"></span>
                    )}
                  </button>
                </div>
              </div>

              {/* Notification dropdown simulation */}
              <AnimatePresence>
                {notificationsOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="p-4 bg-[#140813] border border-rose-500/30 rounded-2xl shadow-xl space-y-2 relative z-50"
                  >
                    <p className="text-xs font-black text-rose-400 uppercase tracking-wider">Latest Activities</p>
                    <div className="space-y-1 text-xs text-slate-300">
                      <p className="p-2 bg-rose-950/20 rounded-lg">💖 Partner approved task "Prepare healthy meal" (+50 Hearts)</p>
                      <p className="p-2 bg-rose-950/20 rounded-lg">🍿 Partner added reward "Movie Night" to the shop!</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Level Progress Indicator */}
              <div className="p-4 glass-premium-card rounded-3xl relative overflow-hidden">
                <div className="flex justify-between items-center mb-2">
                  <div className="flex items-center gap-1.5">
                    <Shield className="w-4 h-4 text-rose-400 animate-pulse" />
                    <span className="text-xs font-black uppercase tracking-wider text-rose-300">Level {userLevel}</span>
                  </div>
                  <span className="text-xs font-bold text-slate-400">{userXp} / 1200 XP</span>
                </div>
                <div className="w-full h-2.5 bg-rose-950/40 rounded-full overflow-hidden p-[1px] border border-rose-500/10">
                  <motion.div 
                    initial={{ width: 0 }}
                    animate={{ width: `${(userXp / 1200) * 100}%` }}
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 via-pink-400 to-violet-500 shadow-[0_0_12px_rgba(244,63,94,0.6)]"
                  />
                </div>
              </div>

              {/* Total Hearts Balance */}
              <div className="p-6 glass-premium-card rounded-[2.5rem] relative overflow-hidden group border border-rose-500/20">
                {/* Background glowing sphere */}
                <div className="absolute right-0 bottom-0 w-32 h-32 bg-rose-500/10 rounded-full blur-2xl group-hover:bg-rose-500/20 transition-all pointer-events-none"></div>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-[10px] text-rose-300/70 font-extrabold uppercase tracking-widest">Your Hearts</p>
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-5xl font-black text-white tracking-tight text-glow">{partnership?.totalHearts || 0}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 font-bold mt-2">Total Relationship Hearts</p>
                  </div>
                  {/* Glowing, beating heart illustration */}
                  <div className="relative flex items-center justify-center w-20 h-20 bg-rose-950/30 border border-rose-500/25 rounded-full shadow-inner shadow-rose-950/50">
                    <div className="absolute inset-0 bg-rose-500/5 rounded-full blur-xl animate-pulse"></div>
                    <Heart className="w-10 h-10 text-rose-500 fill-rose-500 animate-bounce cursor-pointer filter drop-shadow-[0_0_15px_rgba(244,63,94,0.6)]" />
                  </div>
                </div>
              </div>

              {/* Today's Progress Checklist */}
              <div className="space-y-3">
                <div className="flex justify-between items-center px-1">
                  <h3 className="text-[11px] text-rose-300/80 uppercase font-black tracking-widest flex items-center gap-1.5">
                    <TrendingUp className="w-3.5 h-3.5" />
                    <span>Today's Progress</span>
                  </h3>
                  <span className="text-xs text-rose-400 font-black bg-rose-500/10 border border-rose-500/20 px-2.5 py-0.5 rounded-full">
                    {dailyItems.filter(i => i.completed).length} / {dailyItems.length} Completed
                  </span>
                </div>

                <div className="space-y-2.5">
                  {dailyItems.map((item) => (
                    <div 
                      key={item.id}
                      className="p-4 glass-premium-card rounded-2xl flex items-center justify-between border border-rose-500/10 hover:border-rose-500/25 transition-all group cursor-pointer"
                      onClick={() => {
                        if (item.category === 'water') {
                          setIsWaterModalOpen(true);
                        } else {
                          setSelectedTask(item);
                        }
                      }}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className="p-2.5 bg-[#170817] border border-rose-500/20 rounded-xl">
                          {getCategoryIcon(item.category)}
                        </div>
                        <div>
                          <h4 className="text-sm font-bold text-slate-100 group-hover:text-rose-300 transition-colors">{item.title}</h4>
                          <span className="text-[10px] text-rose-400 font-black flex items-center gap-1 mt-0.5">
                            <Heart className="w-2.5 h-2.5 fill-rose-400" />
                            <span>+{item.rewardHearts} Hearts</span>
                          </span>
                        </div>
                      </div>

                      {/* Custom premium checkbox */}
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          if (item.category === 'water') {
                            setIsWaterModalOpen(true);
                          } else {
                            toggleDailyItem(item.id);
                          }
                        }}
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all border ${
                          item.completed 
                            ? 'bg-rose-500 border-rose-400 text-white shadow-[0_0_10px_rgba(244,63,94,0.5)]' 
                            : 'bg-transparent border-slate-600 hover:border-rose-500'
                        }`}
                      >
                        {item.completed && <Check className="w-3.5 h-3.5 stroke-[3px]" />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              {/* Fast navigation suggestion banners */}
              <div 
                className="p-5 rounded-[2rem] bg-gradient-to-r from-[#1b091c] to-[#0d040e] border border-rose-500/20 flex justify-between items-center cursor-pointer hover:border-rose-500/40 transition-all"
                onClick={() => setActiveTab('rewards')}
              >
                <div className="space-y-1">
                  <p className="text-xs font-black text-rose-400 uppercase tracking-wider">Unused Balance</p>
                  <p className="text-sm font-extrabold text-white">Spend your hearts in the Shop 🎁</p>
                </div>
                <ChevronRight className="w-5 h-5 text-rose-400" />
              </div>
            </motion.div>
          )}

          {/* TASKS TAB (Slightly improved screen 4 workflow) */}
          {activeTab === 'tasks' && (
            <motion.div
              key="tasks-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-5 space-y-6"
            >
              <div className="pt-5">
                <h2 className="text-2xl font-black text-white tracking-tight">Active Partner Tasks</h2>
                <p className="text-xs text-slate-400">Complete tasks set by your partner to claim your rewards.</p>
              </div>

              <div className="space-y-4">
                <h3 className="text-[10px] text-rose-300 font-extrabold uppercase tracking-widest flex items-center gap-1.5 pl-1">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pending Tasks</span>
                </h3>

                {pendingTasks.length === 0 ? (
                  <div className="text-center py-10 rounded-3xl border border-dashed border-rose-500/20 bg-[#120712]/30">
                    <Sparkles className="w-8 h-8 text-rose-500/40 mx-auto mb-2" />
                    <p className="text-xs font-extrabold text-slate-400">No partner-specific tasks right now.</p>
                    <p className="text-[10px] text-slate-500 mt-1">Enjoy your day or ask partner to set new ones!</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {pendingTasks.map(task => (
                      <div key={task.id} className="p-5 glass-premium-card rounded-3xl border border-rose-500/10 space-y-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-2">
                            <h4 className="font-extrabold text-base text-slate-100 break-words">{task.title}</h4>
                            {task.description && <p className="text-xs text-slate-400 mt-1 break-words">{task.description}</p>}
                            {task.reminderCount && task.reminderCount > 0 ? (
                              <div className="inline-flex items-center gap-1.5 mt-2.5 bg-rose-500/10 border border-rose-500/20 px-2.5 py-1 rounded-xl text-[9px] text-rose-300 font-bold uppercase tracking-wider">
                                <span>🔔 Reminds {task.reminderCount}x • {task.reminderInterval}</span>
                              </div>
                            ) : (
                              <div className="inline-flex items-center gap-1.5 mt-2.5 bg-slate-900/50 border border-slate-800 px-2.5 py-1 rounded-xl text-[9px] text-slate-500 font-bold uppercase tracking-wider">
                                <span>No active alerts</span>
                              </div>
                            )}
                          </div>
                          <span className="bg-rose-500/15 border border-rose-500/30 text-rose-400 px-3 py-1 rounded-full text-xs font-black flex items-center gap-1 shrink-0">
                            <Heart className="w-3 h-3 fill-rose-400" />
                            <span>+{task.rewardHearts}</span>
                          </span>
                        </div>
                        <motion.button 
                          whileTap={{ scale: 0.98 }}
                          onClick={() => markTaskCompleted(task)}
                          className="w-full py-3 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl text-xs font-black shadow-[0_4px_15px_rgba(244,63,94,0.2)] flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Check className="w-4 h-4" />
                          <span>Mark as Completed</span>
                        </motion.button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {awaitingApprovalTasks.length > 0 && (
                <div className="space-y-3 pt-2">
                  <h3 className="text-[10px] text-amber-400 font-extrabold uppercase tracking-widest flex items-center gap-1.5 pl-1">
                    <Clock className="w-3.5 h-3.5" />
                    <span>Awaiting Approval ({awaitingApprovalTasks.length})</span>
                  </h3>
                  <div className="space-y-2">
                    {awaitingApprovalTasks.map(task => (
                      <div key={task.id} className="p-4 bg-[#140813] border border-white/[0.04] rounded-2xl flex justify-between items-center opacity-80">
                        <span className="text-xs text-slate-300 font-semibold">{task.title}</span>
                        <div className="flex items-center gap-1.5 text-amber-400/90 text-[10px] bg-amber-500/10 border border-amber-500/20 px-2.5 py-0.5 rounded-full font-black">
                          <Clock className="w-2.5 h-2.5 animate-spin" />
                          <span>Under Review</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {/* REWARDS TAB (Mockup Screen 8) */}
          {activeTab === 'rewards' && (
            <motion.div
              key="rewards-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-5 space-y-6"
            >
              <div className="pt-5">
                <h2 className="text-2xl font-black text-white tracking-tight">Rewards Store</h2>
                <p className="text-xs text-slate-400">Redeem sweet physical or romantic prizes offered by your partner.</p>
              </div>

              {/* Your Balance Balance Header */}
              <div className="p-4 bg-gradient-to-br from-[#1d071b] to-[#0a020a] border border-rose-500/20 rounded-3xl flex justify-between items-center">
                <div>
                  <p className="text-[10px] text-rose-300/80 font-black uppercase tracking-widest">Your Balance</p>
                  <p className="text-2xl font-black text-white mt-0.5">{partnership?.totalHearts || 0} Hearts</p>
                </div>
                <div className="w-12 h-12 bg-rose-500/15 border border-rose-500/30 rounded-full flex items-center justify-center">
                  <Heart className="w-6 h-6 text-rose-400 fill-rose-400 animate-pulse" />
                </div>
              </div>

              {/* Sub-Tabs: All vs My Redemptions */}
              <div className="flex bg-[#120712] p-1 rounded-2xl border border-rose-500/10">
                <button 
                  onClick={() => setRewardsSubTab('all')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${rewardsSubTab === 'all' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  All Rewards
                </button>
                <button 
                  onClick={() => setRewardsSubTab('claimed')}
                  className={`flex-1 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer ${rewardsSubTab === 'claimed' ? 'bg-rose-500 text-white shadow-md' : 'text-slate-400 hover:text-white'}`}
                >
                  My Rewards ({redemptions.length})
                </button>
              </div>

              {rewardsSubTab === 'all' && (
                <div className="grid grid-cols-2 gap-4">
                  {rewards.length === 0 ? (
                    <div className="col-span-2 text-center py-10 bg-[#120712]/30 rounded-3xl border border-dashed border-rose-500/20">
                      <p className="text-xs text-slate-500 font-bold">No romantic rewards loaded yet.</p>
                    </div>
                  ) : (
                    rewards.map(reward => {
                      const canAfford = (partnership?.totalHearts || 0) >= reward.cost;
                      return (
                        <div key={reward.id} className="p-5 glass-premium-card rounded-3xl flex flex-col justify-between items-center text-center gap-3 relative overflow-hidden group border border-rose-500/10">
                          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"></div>
                          
                          <div className="p-3 bg-rose-500/10 border border-rose-500/20 rounded-2xl text-rose-400 relative">
                            <Gift className="w-5 h-5 animate-pulse" />
                          </div>

                          <div className="mt-1">
                            <h4 className="font-extrabold text-sm text-slate-100 line-clamp-1">{reward.title}</h4>
                            <p className="text-rose-300 font-bold text-xs mt-1 flex items-center justify-center gap-1">
                              <Heart className="w-3 h-3 fill-rose-300" />
                              <span>{reward.cost} Hearts</span>
                            </p>
                          </div>

                          <motion.button
                            whileTap={canAfford ? { scale: 0.95 } : {}}
                            disabled={!canAfford}
                            onClick={() => redeemReward(reward)}
                            className={`w-full py-2.5 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                              canAfford 
                                ? 'bg-gradient-to-r from-rose-500 to-violet-600 hover:from-rose-600 hover:to-violet-700 text-white shadow-md shadow-rose-500/20' 
                                : 'bg-white/[0.02] text-slate-500 border border-white/5 cursor-not-allowed'
                            }`}
                          >
                            {canAfford ? (
                              <>
                                <Unlock className="w-3 h-3" />
                                <span>Redeem</span>
                              </>
                            ) : (
                              <>
                                <Lock className="w-3 h-3 text-slate-600" />
                                <span>Locked</span>
                              </>
                            )}
                          </motion.button>
                        </div>
                      );
                    })
                  )}
                </div>
              )}

              {rewardsSubTab === 'claimed' && (
                <div className="space-y-3">
                  {redemptions.length === 0 ? (
                    <div className="text-center py-10 bg-[#120712]/30 rounded-3xl border border-dashed border-rose-500/20">
                      <p className="text-xs text-slate-500 font-bold">You haven't claimed any rewards yet.</p>
                    </div>
                  ) : (
                    redemptions.map(red => (
                      <div key={red.id} className="p-4 glass-premium-card rounded-2xl flex justify-between items-center border border-rose-500/10">
                        <div className="flex items-center gap-3">
                          <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
                            <Gift className="w-4 h-4" />
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-slate-100">{red.rewardTitle}</h4>
                            <p className="text-[10px] text-slate-400 font-semibold mt-0.5">{red.cost} Hearts • Claimed</p>
                          </div>
                        </div>

                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-black tracking-wider uppercase ${
                          red.status === 'fulfilled' 
                            ? 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-400' 
                            : 'bg-amber-500/10 border border-amber-500/20 text-amber-400'
                        }`}>
                          {red.status === 'fulfilled' ? 'Fulfilled' : 'Pending partner'}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              )}
            </motion.div>
          )}

          {/* PROFILE TAB (Mockup Screen 9 & 11) */}
          {activeTab === 'profile' && (
            <motion.div
              key="profile-tab"
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3 }}
              className="p-5 space-y-6"
            >
              {/* Partner Profile Header */}
              <div className="flex items-center gap-4 pt-5">
                <div className="relative">
                  <div className="w-16 h-16 rounded-full bg-rose-500/15 border-2 border-rose-500/50 flex items-center justify-center overflow-hidden">
                    <User className="w-8 h-8 text-rose-400" />
                  </div>
                  <span className="absolute bottom-0 right-0 w-4 h-4 bg-emerald-500 rounded-full border-2 border-[#060306]"></span>
                </div>
                <div>
                  <h2 className="text-xl font-extrabold text-white">{profileName}</h2>
                  <p className="text-xs text-rose-400 font-bold mt-0.5">Partner User Profile</p>
                </div>
              </div>

              {/* Weekly Progress Area Chart (Screen 9 in Image) */}
              <div className="p-5 glass-premium-card rounded-3xl border border-rose-500/10 space-y-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="text-xs font-black uppercase text-rose-300 tracking-wider">Weekly Progress</h3>
                    <p className="text-xs text-slate-400 font-bold mt-0.5">Hearts Accumulation</p>
                  </div>
                  <span className="text-xs font-black text-rose-400 bg-rose-500/10 px-2.5 py-0.5 rounded-full">This Week</span>
                </div>

                <div className="h-44 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={WEEKLY_STATS_DATA} margin={{ top: 10, right: 5, left: -25, bottom: 0 }}>
                      <defs>
                        <linearGradient id="colorHearts" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip contentStyle={{ background: '#160c15', borderColor: '#f43f5e', borderRadius: '12px', fontSize: '12px' }} />
                      <Area type="monotone" dataKey="hearts" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHearts)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Stats Overview Grid (Screen 9) */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-rose-300 font-black uppercase tracking-widest pl-1">Stats Overview</h3>
                <div className="grid grid-cols-2 gap-3.5">
                  <div className="p-4 glass-premium-card rounded-2xl border border-rose-500/10 flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400">
                      <CheckCircle2 className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Completed</p>
                      <p className="text-lg font-black text-white mt-0.5">18 Tasks</p>
                    </div>
                  </div>

                  <div className="p-4 glass-premium-card rounded-2xl border border-rose-500/10 flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 rounded-xl text-rose-400 animate-pulse">
                      <Heart className="w-5 h-5 fill-rose-500" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Earned</p>
                      <p className="text-lg font-black text-white mt-0.5">64 Hearts</p>
                    </div>
                  </div>

                  <div className="p-4 glass-premium-card rounded-2xl border border-rose-500/10 flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 rounded-xl text-amber-500">
                      <Flame className="w-5 h-5 fill-amber-500 animate-bounce" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Streak</p>
                      <p className="text-lg font-black text-amber-400 mt-0.5">7 Days</p>
                    </div>
                  </div>

                  <div className="p-4 glass-premium-card rounded-2xl border border-rose-500/10 flex items-center gap-3">
                    <div className="p-2.5 bg-rose-500/10 rounded-xl text-violet-400">
                      <Award className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Level</p>
                      <p className="text-lg font-black text-violet-400 mt-0.5">{userLevel}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Keep growing together Banner (Screen 10 in Image) */}
              <div className="p-5 rounded-3xl bg-gradient-to-br from-[#1c0817] to-[#0a0208] border border-rose-500/20 relative overflow-hidden">
                <div className="absolute right-[-20px] bottom-[-20px] w-24 h-24 bg-rose-500/5 rounded-full blur-xl"></div>
                <h4 className="text-sm font-black text-white leading-snug">Keep growing together, <br />one goal at a time. 💕</h4>
                <p className="text-[11px] text-rose-300 font-extrabold mt-2 uppercase tracking-widest">You + Me = Unstoppable 💪</p>
              </div>

              {/* Menu Options (Screen 11) */}
              <div className="p-2 glass-premium-card rounded-3xl border border-rose-500/10 divide-y divide-rose-500/5">
                <div 
                  className="flex justify-between items-center p-3.5 hover:bg-rose-500/5 transition-all rounded-t-2xl cursor-pointer"
                  onClick={() => setIsEditProfileOpen(true)}
                >
                  <span className="text-sm font-bold text-slate-200">Edit Profile</span>
                  <ChevronRight className="w-4 h-4 text-rose-400" />
                </div>
                <div 
                  className="flex justify-between items-center p-3.5 hover:bg-rose-500/5 transition-all cursor-pointer"
                  onClick={() => setRemindersEnabled(!remindersEnabled)}
                >
                  <span className="text-sm font-bold text-slate-200">Daily Reminders</span>
                  <div className={`w-10 h-5 rounded-full transition-all p-0.5 cursor-pointer ${remindersEnabled ? 'bg-rose-500 flex justify-end' : 'bg-slate-700 flex justify-start'}`}>
                    <span className="w-4 h-4 bg-white rounded-full"></span>
                  </div>
                </div>
                <div 
                  className="flex justify-between items-center p-3.5 hover:bg-rose-500/5 transition-all cursor-pointer"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                >
                  <span className="text-sm font-bold text-slate-200">Haptics & Audio Effects</span>
                  <div className={`w-10 h-5 rounded-full transition-all p-0.5 cursor-pointer ${soundEnabled ? 'bg-rose-500 flex justify-end' : 'bg-slate-700 flex justify-start'}`}>
                    <span className="w-4 h-4 bg-white rounded-full"></span>
                  </div>
                </div>
                <div 
                  onClick={() => signOut(auth)}
                  className="flex justify-between items-center p-3.5 hover:bg-rose-500/5 transition-all rounded-b-2xl cursor-pointer text-rose-400"
                >
                  <span className="text-sm font-bold">Sign Out</span>
                  <LogOut className="w-4 h-4" />
                </div>
              </div>
            </motion.div>
          )}

        </AnimatePresence>
      </div>

      {/* DRINK WATER DETAILED MODAL (Mockup Screen 7) */}
      <AnimatePresence>
        {isWaterModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-6 relative overflow-hidden"
            >
              {/* Top reflection lines */}
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"></div>

              {/* Close Button */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setIsWaterModalOpen(false)}
                  className="p-2.5 bg-rose-500/10 border border-rose-500/20 rounded-full text-rose-400 text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                >
                  Back
                </button>
                <div className="text-center">
                  <h3 className="text-base font-extrabold text-white">Drink Water</h3>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">Daily Goal Tracker</p>
                </div>
                <div className="w-10"></div> {/* Spacer */}
              </div>

              {/* Goal Balance */}
              <div className="text-center">
                <p className="text-xs text-slate-400 font-bold">Daily Goal</p>
                <p className="text-2xl font-black text-white mt-0.5">{(waterMilliliters / 1000).toFixed(1)}L / {(waterGoal / 1000).toFixed(1)}L</p>
              </div>

              {/* Large Circle Water fluid/wave graphic (Screen 7) */}
              <div className="flex justify-center my-6 relative">
                <div className="w-48 h-48 rounded-full border-[3px] border-rose-500/30 p-1 relative flex items-center justify-center shadow-[0_0_30px_rgba(244,63,94,0.15)] bg-slate-950/40 overflow-hidden water-sphere">
                  
                  {/* Glowing 3D Specular Sheen */}
                  <div className="water-glass-gloss" />

                  {/* Wave liquid container */}
                  <div className="water-wave-container">
                    {/* Rising Bubbles inside the sphere */}
                    {Array.from({ length: 6 }).map((_, i) => {
                      const bubbleDrift = -15 + Math.random() * 30;
                      const size = 5 + Math.random() * 6;
                      const delay = Math.random() * 5;
                      const duration = 3 + Math.random() * 4;
                      return (
                        <div 
                          key={i} 
                          className="water-bubble" 
                          style={{
                            left: `${15 + Math.random() * 70}%`,
                            animationDelay: `${delay}s`,
                            animationDuration: `${duration}s`,
                            width: `${size}px`,
                            height: `${size}px`,
                            '--bubble-drift': `${bubbleDrift}px`,
                          } as React.CSSProperties}
                        />
                      );
                    })}

                    {/* Back Wave */}
                    <div 
                      className="water-wave-back"
                      style={{ 
                        top: `${100 - Math.min(100, (waterMilliliters / waterGoal) * 100)}%` 
                      }}
                    />

                    {/* Front Wave */}
                    <div 
                      className="water-wave-front"
                      style={{ 
                        top: `${100 - Math.min(100, (waterMilliliters / waterGoal) * 100)}%` 
                      }}
                    />
                  </div>

                  {/* Percentage Indicator */}
                  <div className="relative text-center z-10 select-none pointer-events-none">
                    <span className="text-4xl font-black text-white tracking-tight drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">
                      {Math.round((waterMilliliters / waterGoal) * 100)}%
                    </span>
                    <p className="text-[10px] text-rose-200 font-bold uppercase mt-1 tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]">
                      Goal Completed
                    </p>
                  </div>
                </div>
              </div>

              {/* Grid of Cups / Glasses (representing 250ml each) */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Tap to Log Cups</span>
                  <span className="text-[10px] text-rose-300 font-bold">{Math.round(waterMilliliters / 250)} / 8 Glasses</span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {Array.from({ length: 8 }).map((_, i) => {
                    const isFilled = waterMilliliters >= (i + 1) * 250;
                    return (
                      <motion.button
                        key={i}
                        whileHover={{ scale: 1.05, translateY: -1 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setWaterMilliliters((i + 1) * 250)}
                        className={`p-2.5 rounded-xl border flex flex-col items-center justify-center relative transition-all duration-300 cursor-pointer ${
                          isFilled
                            ? 'bg-rose-500/10 border-rose-500/40 text-rose-400 shadow-[0_0_12px_rgba(244,63,94,0.15)]'
                            : 'bg-slate-950/40 border-slate-800 text-slate-600 hover:text-slate-400'
                        }`}
                      >
                        {isFilled && (
                          <motion.span 
                            layoutId="water-spark"
                            className="absolute top-1 right-1 w-1.5 h-1.5 bg-pink-500 rounded-full"
                          />
                        )}
                        <GlassWater className={`w-5 h-5 ${isFilled ? 'animate-bounce text-rose-400' : ''}`} />
                        <span className="text-[9px] font-bold mt-1 text-slate-400">{(i + 1) * 250}ml</span>
                      </motion.button>
                    );
                  })}
                </div>
              </div>

              {/* 5 cup additions & custom */}
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-2.5">
                  <button 
                    onClick={() => addWater(250)}
                    className="p-3 bg-[#170918] hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl text-center cursor-pointer transition-all"
                  >
                    <Droplet className="w-4 h-4 text-rose-400 mx-auto mb-1 animate-pulse" />
                    <span className="text-xs font-bold text-slate-300">250ml</span>
                  </button>
                  <button 
                    onClick={() => addWater(500)}
                    className="p-3 bg-[#170918] hover:bg-rose-500/10 border border-rose-500/20 hover:border-rose-500/40 rounded-2xl text-center cursor-pointer transition-all"
                  >
                    <Droplet className="w-4 h-4 text-rose-400 mx-auto mb-1 animate-pulse" />
                    <span className="text-xs font-bold text-slate-300">500ml</span>
                  </button>
                  <button 
                    onClick={() => setWaterMilliliters(0)}
                    className="p-3 bg-slate-950/40 hover:bg-rose-500/10 border border-slate-800 hover:border-rose-500/40 rounded-2xl text-center cursor-pointer transition-all"
                  >
                    <Info className="w-4 h-4 text-slate-500 mx-auto mb-1" />
                    <span className="text-xs font-bold text-slate-400">Reset</span>
                  </button>
                </div>

                {waterMilliliters >= waterGoal && (
                  <motion.div 
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="p-3 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-center text-xs font-black text-rose-300"
                  >
                    🎉 Great job! You reached your daily water goal. 💧🧘‍♂️
                  </motion.div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TASK DETAILS MODAL (Mockup Screen 5) */}
      <AnimatePresence>
        {selectedTask && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-5 relative"
            >
              <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"></div>

              {/* Top back */}
              <div className="flex justify-between items-center">
                <button 
                  onClick={() => setSelectedTask(null)}
                  className="p-2 bg-rose-500/10 border border-rose-500/20 rounded-xl text-rose-400 text-xs font-bold hover:bg-rose-500/20 cursor-pointer"
                >
                  Back
                </button>
                <h3 className="text-sm font-extrabold text-white">Task Details</h3>
                <div className="w-10"></div>
              </div>

              {/* Animated Gym icon or generic */}
              <div className="flex justify-center py-4">
                <div className="w-24 h-24 rounded-full border-2 border-rose-500/35 bg-[#1a091a] flex items-center justify-center shadow-[0_0_20px_rgba(244,63,94,0.3)] animate-pulse">
                  {selectedTask.category === 'workout' && <Dumbbell className="w-10 h-10 text-rose-500" />}
                  {selectedTask.category === 'reading' && <BookOpen className="w-10 h-10 text-violet-500" />}
                  {selectedTask.category === 'meditation' && <Sparkles className="w-10 h-10 text-amber-500" />}
                  {selectedTask.category === 'diet' && <Coffee className="w-10 h-10 text-pink-500" />}
                </div>
              </div>

              <div className="text-center space-y-1.5">
                <h4 className="text-xl font-black text-white">{selectedTask.title}</h4>
                <div className="inline-flex items-center gap-1 bg-rose-500/15 border border-rose-500/30 px-3 py-1 rounded-full text-xs font-black text-rose-400">
                  <Heart className="w-3 h-3 fill-rose-400" />
                  <span>{selectedTask.rewardHearts} Hearts</span>
                </div>
                <p className="text-xs text-slate-400 mt-2 leading-relaxed px-4">{selectedTask.description}</p>
              </div>

              {/* Upload Proof box */}
              <div className="space-y-2">
                <p className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider">Upload Proof (Optional)</p>
                <div className="grid grid-cols-2 gap-3">
                  <label className="border border-dashed border-rose-500/20 hover:border-rose-500/50 bg-slate-950/40 rounded-2xl h-24 flex flex-col items-center justify-center cursor-pointer transition-all">
                    <Camera className="w-6 h-6 text-rose-500/60 mb-1" />
                    <span className="text-[10px] font-bold text-slate-400">Take Photo</span>
                    <input type="file" accept="image/*" onChange={handleProofUpload} className="hidden" />
                  </label>

                  <div className="border border-rose-500/15 bg-slate-950/40 rounded-2xl h-24 overflow-hidden relative flex items-center justify-center">
                    {proofImage ? (
                      <img src={proofImage} alt="proof" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-[10px] font-bold text-slate-500">No Image Uploaded</span>
                    )}
                  </div>
                </div>
              </div>

              {/* Complete Action */}
              <motion.button 
                whileTap={{ scale: 0.98 }}
                onClick={completeTaskWithProof}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-2xl text-xs font-black shadow-[0_4px_15px_rgba(244,63,94,0.3)] cursor-pointer"
              >
                Mark as Complete
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* EDIT PROFILE MODAL */}
      <AnimatePresence>
        {isEditProfileOpen && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <h3 className="text-base font-extrabold text-white">Edit Profile</h3>
              <div className="space-y-1.5">
                <label className="text-xs text-slate-400 font-bold">Display Name</label>
                <input 
                  type="text" 
                  value={profileName} 
                  onChange={(e) => setProfileName(e.target.value)}
                  className="w-full p-3.5 bg-[#130713] border border-rose-500/20 rounded-2xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3 bg-slate-950/40 border border-slate-800 text-slate-300 rounded-2xl text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  onClick={() => setIsEditProfileOpen(false)}
                  className="flex-1 py-3 bg-rose-500 text-white rounded-2xl text-xs font-bold cursor-pointer shadow-md shadow-rose-500/25"
                >
                  Save Changes
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PRESET LUXURY BOTTOM NAVIGATION BAR */}
      <div className="fixed bottom-4 left-4 right-4 z-40">
        <div className="glass-premium px-6 py-3 rounded-3xl border border-rose-500/15 flex justify-between items-center shadow-[0_12px_45px_rgba(0,0,0,0.9)]">
          <button 
            onClick={() => setActiveTab('home')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'home' ? 'text-rose-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Heart className={`w-5 h-5 ${activeTab === 'home' ? 'fill-rose-500' : ''}`} />
            <span className="text-[10px] font-bold">Home</span>
          </button>
          <button 
            onClick={() => setActiveTab('tasks')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'tasks' ? 'text-rose-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <ListTodo className="w-5 h-5" />
            <span className="text-[10px] font-bold">Tasks</span>
          </button>
          <button 
            onClick={() => setActiveTab('rewards')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'rewards' ? 'text-rose-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <Gift className="w-5 h-5" />
            <span className="text-[10px] font-bold">Rewards</span>
          </button>
          <button 
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 cursor-pointer transition-all ${activeTab === 'profile' ? 'text-rose-400 scale-105' : 'text-slate-400 hover:text-slate-200'}`}
          >
            <User className="w-5 h-5" />
            <span className="text-[10px] font-bold">Profile</span>
          </button>
        </div>
      </div>

    </div>
  );
}
