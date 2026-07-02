import { getLevelInfo } from '../lib/helpers';
import React, { useState, useEffect } from 'react';
import { useStore } from '../store/useStore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import { collection, query, onSnapshot, doc, updateDoc, setDoc, serverTimestamp, deleteDoc, increment } from 'firebase/firestore';
import { Task, Reward, Redemption, GiftRequest, DailyProgressItem } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { auth } from '../lib/firebase';
import { signOut } from 'firebase/auth';
import { getDemoTasks, saveDemoTasks, getDemoRewards, saveDemoRewards, getDemoRedemptions, saveDemoRedemptions } from '../lib/demoStorage';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { 
  Heart, 
  Flame, 
  LogOut, 
  Plus, 
  Trash2, 
  Sparkles, 
  Gift, 
  Check, 
  Clock, 
  ListTodo, 
  Award, 
  User, 
  ShieldAlert,
  ChevronRight,
  PlusCircle,
  HelpCircle,
  TrendingUp,
  MessageSquare,
  Activity,
  Award as LevelIcon,
  X,
  Compass,
  CornerDownRight,
  CheckCircle2,
  Trash
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function AdminDashboard() {
  const { userProfile, partnership, isDemoMode, setPartnership } = useStore();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [dailyItems, setDailyItems] = useState<DailyProgressItem[]>([]);
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [requests, setRequests] = useState<GiftRequest[]>([]);

  // Selected sub-view/modal trigger based on mockup Grid actions
  const [activeAdminAction, setActiveAdminAction] = useState<
    'none' | 'add_task' | 'manage_hearts' | 'manage_rewards' | 'approve_tasks' | 'analytics' | 'send_message' | 'manage_progress' | 'view_progress'
  >('none');

  // Input states
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDescription, setNewTaskDescription] = useState('');
  const [newTaskReward, setNewTaskReward] = useState('10');
  const [reminderCount, setReminderCount] = useState(3);
  const [reminderInterval, setReminderInterval] = useState('Every 2 hours');
  const [newApprovalType, setNewApprovalType] = useState<'manual' | 'automatic'>('manual');
  const [newDeadline, setNewDeadline] = useState('');
  
  const [newRewardTitle, setNewRewardTitle] = useState('');
  const [newRewardCost, setNewRewardCost] = useState('20');

  const [adjustHeartsAmount, setAdjustHeartsAmount] = useState('10');
  const [adjustHeartsReason, setAdjustHeartsReason] = useState('Bonus for being amazing! 💕');

  const [messageContent, setMessageContent] = useState('');
  const [messagesLog, setMessagesLog] = useState<{id: string, text: string, time: string}[]>([
    { id: 'm1', text: 'Good morning love, have an amazing day! ✨', time: '9:00 AM' },
    { id: 'm2', text: 'You killed that morning workout! So proud of you. 🏋️‍♀️', time: '10:30 AM' }
  ]);

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
    const dailyItemsRef = collection(db, 'partnerships', partnership.id, 'dailyItems');
    const rewardsRef = collection(db, 'partnerships', partnership.id, 'rewards');
    const redemptionsRef = collection(db, 'partnerships', partnership.id, 'redemptions');
    const requestsRef = collection(db, 'partnerships', partnership.id, 'requests');

    const uTasks = onSnapshot(query(tasksRef), (snap) => {
      setTasks(snap.docs.map(d => ({ id: d.id, ...d.data() } as Task)));
    });
    const uDailyItems = onSnapshot(query(dailyItemsRef), (snap) => {
      setDailyItems(snap.docs.map(d => ({ id: d.id, ...d.data() } as DailyProgressItem)));
    });
    const uRewards = onSnapshot(query(rewardsRef), (snap) => {
      setRewards(snap.docs.map(d => ({ id: d.id, ...d.data() } as Reward)));
    });
    const uRedemptions = onSnapshot(query(redemptionsRef), (snap) => {
      setRedemptions(snap.docs.map(d => ({ id: d.id, ...d.data() } as Redemption)));
    });
    const uRequests = onSnapshot(query(requestsRef), (snap) => {
      setRequests(snap.docs.map(d => ({ id: d.id, ...d.data() } as GiftRequest)));
    });

    return () => { uTasks(); uDailyItems(); uRewards(); uRedemptions(); uRequests(); };
  }, [partnership?.id, isDemoMode]);

  const handleCreateTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle || !newTaskReward) return;

    if (isDemoMode) {
       const currentTasks = getDemoTasks();
       const newTask: Task = {
         id: 'demo_task_' + Date.now(),
         title: newTaskTitle,
         description: newTaskDescription,
         rewardHearts: parseInt(newTaskReward) || 10,
         status: 'pending',
         assigneeId: 'demo_user',
         createdAt: new Date().toISOString(),
         updatedAt: new Date().toISOString(),
         reminderCount: reminderCount,
         reminderInterval: reminderInterval,
         approvalType: newApprovalType,
         deadline: newDeadline || undefined,
       };
       const updated = [newTask, ...currentTasks];
       saveDemoTasks(updated);
       setTasks(updated);
       setNewTaskTitle('');
       setNewTaskDescription('');
       setNewTaskReward('10');
       setReminderCount(3);
       setReminderInterval('Every 2 hours');
       setNewDeadline('');
       setActiveAdminAction('none');
       return;
    }

    if (!partnership?.id || !partnership.userId) return;
    try {
      const newRef = doc(collection(db, 'partnerships', partnership.id, 'tasks'));
      await setDoc(newRef, {
        title: newTaskTitle,
        description: newTaskDescription,
        rewardHearts: parseInt(newTaskReward),
        status: 'pending',
        assigneeId: partnership.userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        reminderCount: reminderCount,
        reminderInterval: reminderInterval,
        approvalType: newApprovalType,
        deadline: newDeadline || null,
      });
      setNewTaskTitle('');
      setNewTaskDescription('');
      setNewTaskReward('10');
      setReminderCount(3);
      setReminderInterval('Every 2 hours');
      setNewDeadline('');
      setActiveAdminAction('none');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'tasks');
    }
  };

  const handleCreateReward = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRewardTitle || !newRewardCost) return;

    if (isDemoMode) {
      const currentRewards = getDemoRewards();
      const newReward: Reward = {
        id: 'demo_reward_' + Date.now(),
        title: newRewardTitle,
        cost: parseInt(newRewardCost) || 10,
        createdAt: new Date().toISOString(),
      };
      const updated = [newReward, ...currentRewards];
      saveDemoRewards(updated);
      setRewards(updated);
      setNewRewardTitle('');
      setNewRewardCost('20');
      setActiveAdminAction('none');
      return;
    }

    if (!partnership?.id) return;
    try {
      const newRef = doc(collection(db, 'partnerships', partnership.id, 'rewards'));
      await setDoc(newRef, {
        title: newRewardTitle,
        cost: parseInt(newRewardCost),
        createdAt: serverTimestamp(),
      });
      setNewRewardTitle('');
      setNewRewardCost('20');
      setActiveAdminAction('none');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'rewards');
    }
  };

  const handleAdjustHearts = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await Haptics.impact({ style: ImpactStyle.Heavy });
    } catch (e) {}
    const amount = parseInt(adjustHeartsAmount) || 0;
    if (!partnership) return;

    const nextHearts = Math.max(0, (partnership.totalHearts || 0) + amount);

    if (isDemoMode) {
      setPartnership({
        ...partnership,
        totalHearts: nextHearts
      });
      // push simple simulated message
      setMessagesLog(prev => [
        { id: Date.now().toString(), text: `Granted ${amount} Hearts for: ${adjustHeartsReason}`, time: 'Just Now' },
        ...prev
      ]);
      setActiveAdminAction('none');
      return;
    }

    try {
      await updateDoc(doc(db, 'partnerships', partnership.id), {
        totalHearts: increment(amount)
      });
      setActiveAdminAction('none');
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!messageContent) return;
    setMessagesLog(prev => [
      { id: Date.now().toString(), text: messageContent, time: 'Just Now' },
      ...prev
    ]);
    setMessageContent('');
  };

  const approveTask = async (task: Task) => {
    try {
      await Haptics.impact({ style: ImpactStyle.Medium });
    } catch (e) {}
    if (isDemoMode) {
      const currentTasks = getDemoTasks();
      const updated = currentTasks.map(t => {
        if (t.id === task.id) {
          return { ...t, status: 'approved' as const, updatedAt: new Date().toISOString() };
        }
        return t;
      });
      saveDemoTasks(updated);
      setTasks(updated);

      if (partnership) {
        setPartnership({
          ...partnership,
          totalHearts: (partnership.totalHearts || 0) + task.rewardHearts,
        });
      }
      return;
    }

    if (!partnership?.id) return;
    try {
      await updateDoc(doc(db, 'partnerships', partnership.id, 'tasks', task.id), {
        status: 'approved',
        updatedAt: serverTimestamp()
      });
      await updateDoc(doc(db, 'partnerships', partnership.id), {
        totalHearts: increment(task.rewardHearts)
      });
    } catch (err) {
      console.error(err);
    }
  };

  const fulfillRedemption = async (r: Redemption) => {
    if (isDemoMode) {
      const currentRedemptions = getDemoRedemptions();
      const updated = currentRedemptions.map(item => {
        if (item.id === r.id) {
          return { ...item, status: 'fulfilled' as const, updatedAt: new Date().toISOString() };
        }
        return item;
      });
      saveDemoRedemptions(updated);
      setRedemptions(updated);
      return;
    }

    if (!partnership?.id) return;
    try {
      await updateDoc(doc(db, 'partnerships', partnership.id, 'redemptions', r.id), {
        status: 'fulfilled',
        updatedAt: serverTimestamp()
      });
    } catch (err) {
      console.error(err);
    }
  };

  const deleteTask = async (id: string) => {
    if (isDemoMode) {
      const currentTasks = getDemoTasks();
      const updated = currentTasks.filter(t => t.id !== id);
      saveDemoTasks(updated);
      setTasks(updated);
      return;
    }

    if (!partnership?.id) return;
    await deleteDoc(doc(db, 'partnerships', partnership.id, 'tasks', id));
  };

  const deleteReward = async (id: string) => {
    if (isDemoMode) {
      const currentRewards = getDemoRewards();
      const updated = currentRewards.filter(r => r.id !== id);
      saveDemoRewards(updated);
      setRewards(updated);
      return;
    }

    if (!partnership?.id) return;
    await deleteDoc(doc(db, 'partnerships', partnership.id, 'rewards', id));
  };

  const completedTasksCount = tasks.filter(t => t.status === 'completed').length;
  const pendingRedemptionsCount = redemptions.filter(r => r.status === 'pending').length;
  const totalApprovalsCount = completedTasksCount + pendingRedemptionsCount;

  return (
    <div className="flex flex-col min-h-screen bg-[#060306] pb-24 relative text-slate-100 overflow-x-hidden">
      
      {/* Background neon glows */}
      <div className="absolute top-0 right-10 w-80 h-80 bg-rose-500/10 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[30%] left-[-50px] w-72 h-72 bg-violet-600/5 rounded-full blur-[90px] pointer-events-none"></div>

      {/* Header Container (Premium glass screen style) */}
      <div className="p-6 pt-8 space-y-2">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-black text-white tracking-tight text-glow flex items-center gap-2">
              Admin Hub
            </h1>
            <p className="text-xs text-rose-300/80 font-bold tracking-wider uppercase">Manage partner progress & rewards</p>
          </div>
          <button 
            onClick={() => signOut(auth)} 
            className="p-3 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 rounded-2xl text-rose-400 hover:text-white transition-all cursor-pointer"
          >
            <LogOut className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* ACTION DASHBOARD GRID (Mockup Screen 6) */}
      <div className="p-5 grid grid-cols-2 gap-4">
        
        {/* ADD TASK ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('add_task')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <Plus className="w-6 h-6" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Add Task</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Assign goals</p>
          </div>
        </motion.div>

        {/* MANAGE HEARTS ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('manage_hearts')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg animate-pulse">
            <Heart className="w-5 h-5 fill-rose-500" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Manage Hearts</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Adjust balance</p>
          </div>
        </motion.div>

        {/* MANAGE REWARDS ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('manage_rewards')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Manage Shop</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Rewards catalog</p>
          </div>
        </motion.div>

        {/* APPROVE TASKS ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('approve_tasks')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group relative"
        >
          {totalApprovalsCount > 0 && (
            <span className="absolute top-2.5 right-2.5 w-6 h-6 bg-rose-500 text-white font-extrabold text-xs flex items-center justify-center rounded-full shadow-[0_0_12px_rgba(244,63,94,0.6)] animate-bounce">
              {totalApprovalsCount}
            </span>
          )}
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <Check className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Approve Tasks</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Verify completions</p>
          </div>
        </motion.div>

        {/* MANAGE PROGRESS ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('manage_progress')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Progress Items</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Edit daily goals</p>
          </div>
        </motion.div>

        {/* VIEW TODAY'S PROGRESS ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('view_progress')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">View Progress</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Today's checklist</p>
          </div>
        </motion.div>

        {/* ANALYTICS ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('analytics')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Analytics</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Performance charts</p>
          </div>
        </motion.div>

        {/* SEND MESSAGE ACTION CARD */}
        <motion.div 
          whileHover={{ translateY: -3 }}
          onClick={() => setActiveAdminAction('send_message')}
          className="p-5 glass-premium-card rounded-3xl border border-rose-500/15 text-center flex flex-col items-center justify-center gap-3 cursor-pointer group"
        >
          <div className="w-12 h-12 bg-rose-500/10 group-hover:bg-rose-500/20 border border-rose-500/30 rounded-2xl flex items-center justify-center text-rose-400 shadow-lg">
            <MessageSquare className="w-5 h-5" />
          </div>
          <div>
            <h4 className="font-extrabold text-sm text-white">Send Message</h4>
            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Relationship feed</p>
          </div>
        </motion.div>

      </div>

      {/* PARTNER OVERVIEW BOTTOM CARD (Footer in Screen 6) */}
      <div className="p-5">
        <h3 className="text-[10px] text-rose-300 font-extrabold uppercase tracking-widest mb-3 pl-1">Partner Overview</h3>
        
        <div className="p-5 glass-premium-card rounded-[2rem] border border-rose-500/20 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
              if (!partnership?.userId) {
                setActiveAdminAction('send_message'); // Or create a new 'invite' action
              } else {
                setActiveAdminAction('send_message');
              }
            }}>
              <div className="w-12 h-12 rounded-full bg-rose-500/10 border-2 border-rose-500/30 flex items-center justify-center overflow-hidden">
                <User className="w-6 h-6 text-rose-400" />
              </div>
              <div>
                <h4 className="font-extrabold text-sm text-white">{partnership?.userId ? 'Partner User' : 'Waiting for Partner...'}</h4>
                <p className="text-[10px] text-rose-300 font-black uppercase mt-0.5">{partnership?.userId ? `Level ${getLevelInfo(partnership?.totalHearts || 0).level} • Active` : 'Share code to connect'}</p>
              </div>
            </div>
            
            <div className="flex items-center gap-1.5 bg-rose-500/15 border border-rose-500/20 px-3 py-1 rounded-full">
              <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
              <span className="text-xs font-black text-white">{partnership?.totalHearts || 0} Hearts</span>
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
              <span>Daily Tasks Progress</span>
              <span>{dailyItems.filter(i => i.completed).length} / {dailyItems.length}</span>
            </div>
            <div className="w-full h-2 bg-rose-950/50 rounded-full overflow-hidden border border-rose-500/10">
              <div 
                className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-500" 
                style={{ width: `${dailyItems.length > 0 ? (dailyItems.filter(i => i.completed).length / dailyItems.length) * 100 : 0}%` }}>
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* --- FLOATING DETAILED MODAL SHEETS --- */}
      <AnimatePresence>

        {/* ADD TASK MODAL */}
        {activeAdminAction === 'add_task' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Create New Task</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateTask} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Task Title</label>
                  <input 
                    type="text" required placeholder="e.g. Read 20 pages, Water flowers"
                    value={newTaskTitle} onChange={e => setNewTaskTitle(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Description (Optional)</label>
                  <textarea 
                    placeholder="Provide details about the task..." rows={2}
                    value={newTaskDescription} onChange={e => setNewTaskDescription(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                
                {/* Reminders section */}
                <div className="p-3 bg-rose-500/5 border border-rose-500/10 rounded-2xl space-y-3">
                  <span className="text-[10px] text-rose-300 font-black uppercase tracking-wider block">🔔 Free Reminders</span>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Frequency</label>
                      <select 
                        value={reminderCount} onChange={e => setReminderCount(parseInt(e.target.value))}
                        className="w-full p-2 bg-slate-950 border border-rose-500/20 rounded-lg text-xs font-bold text-slate-200 focus:outline-none"
                      >
                        <option value="0">No Reminders</option>
                        <option value="1">1x Daily</option>
                        <option value="2">2x Daily</option>
                        <option value="3">3x Daily</option>
                        <option value="4">4x Daily</option>
                        <option value="5">5x Daily</option>
                      </select>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] text-slate-400 font-bold uppercase">Timing Interval</label>
                      <select 
                        value={reminderInterval} onChange={e => setReminderInterval(e.target.value)}
                        className="w-full p-2 bg-slate-950 border border-rose-500/20 rounded-lg text-xs font-bold text-slate-200 focus:outline-none"
                      >
                        <option value="Every 1 hour">Every 1 hour</option>
                        <option value="Every 2 hours">Every 2 hours</option>
                        <option value="Every 4 hours">Every 4 hours</option>
                        <option value="Every 8 hours">Every 8 hours</option>
                        <option value="Morning & Evening">Morning & Night</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Heart Reward</label>
                  <input 
                    type="number" required min="1"
                    value={newTaskReward} onChange={e => setNewTaskReward(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Approval Type</label>
                  <select
                    value={newApprovalType} onChange={e => setNewApprovalType(e.target.value as 'manual' | 'automatic')}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  >
                    <option value="manual">Manual Approval</option>
                    <option value="automatic">Automatic Approval</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Deadline</label>
                  <input 
                    type="datetime-local"
                    value={newDeadline} onChange={e => setNewDeadline(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-500/25 cursor-pointer mt-2">
                  Assign Task
                </button>
              </form>

              {/* List of active tasks */}
              <div className="pt-2 border-t border-rose-500/10 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Active Assigned Tasks</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {tasks.filter(t => t.status === 'pending').map(t => (
                    <div key={t.id} className="p-2.5 bg-slate-950/40 rounded-xl flex justify-between items-center text-xs border border-white/[0.02] gap-2">
                      <div className="flex-1 min-w-0">
                        <span className="font-semibold block truncate text-slate-100">{t.title}</span>
                        {t.reminderCount && t.reminderCount > 0 ? (
                          <span className="text-[9px] text-rose-400 font-bold block mt-0.5 uppercase tracking-wide">
                            🔔 Reminds {t.reminderCount}x • {t.reminderInterval}
                          </span>
                        ) : (
                          <span className="text-[9px] text-slate-500 block mt-0.5">No notifications configured</span>
                        )}
                      </div>
                      <button onClick={() => deleteTask(t.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer p-1 shrink-0"><Trash className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MANAGE HEARTS MODAL */}
        {activeAdminAction === 'manage_hearts' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Adjust Partner Hearts</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleAdjustHearts} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Amount (positive or negative)</label>
                  <input 
                    type="number" required
                    value={adjustHeartsAmount} onChange={e => setAdjustHeartsAmount(e.target.value)}
                    className="w-full p-3.5 bg-slate-950 border border-rose-500/20 rounded-xl text-lg font-black text-center text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Adjustment Reason</label>
                  <input 
                    type="text" required
                    value={adjustHeartsReason} onChange={e => setAdjustHeartsReason(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-xs text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-500/25 cursor-pointer">
                  Save Adjustment
                </button>
                <button type="button" onClick={async () => {
                   if(confirm('Are you sure you want to reset all hearts to zero?')) {
                     await updateDoc(doc(db, 'partnerships', partnership!.id), { totalHearts: 0 });
                     setActiveAdminAction('none');
                   }
                }} className="w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-2xl text-xs font-black cursor-pointer">
                  Reset Hearts to Zero
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}

        {/* VIEW PROGRESS MODAL */}
        {activeAdminAction === 'view_progress' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4 max-h-[80vh] flex flex-col"
            >
              <div className="flex justify-between items-center shrink-0">
                <h3 className="text-base font-extrabold text-white">Today's Progress</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>
              
              <div className="space-y-1 shrink-0">
                <div className="flex justify-between text-[10px] text-slate-400 font-bold uppercase">
                  <span>Daily Tasks Progress</span>
                  <span>{dailyItems.filter(i => i.completed).length} / {dailyItems.length}</span>
                </div>
                <div className="w-full h-2 bg-rose-950/50 rounded-full overflow-hidden border border-rose-500/10">
                  <div 
                    className="h-full rounded-full bg-gradient-to-r from-rose-500 to-violet-500 transition-all duration-500" 
                    style={{ width: `${dailyItems.length > 0 ? (dailyItems.filter(i => i.completed).length / dailyItems.length) * 100 : 0}%` }}>
                  </div>
                </div>
              </div>

              <div className="space-y-2.5 overflow-y-auto pr-1 pb-4">
                {dailyItems.map(item => (
                  <div key={item.id} className="p-3 bg-slate-950/40 rounded-xl border border-rose-500/10 flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="text-xs font-bold text-slate-200">{item.title}</h4>
                      <p className="text-[9px] text-slate-500">{item.rule || item.description}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-[10px] text-rose-400 font-bold">+{item.rewardHearts} <Heart className="w-2.5 h-2.5 inline fill-rose-400" /></span>
                      <button
                        onClick={async () => {
                          if (!partnership?.id) return;
                          await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { completed: !item.completed });
                        }}
                        className={`w-6 h-6 rounded-md flex items-center justify-center border transition-all ${item.completed ? 'bg-rose-500 border-rose-500' : 'bg-transparent border-rose-500/30'}`}
                      >
                        {item.completed && <Check className="w-3 h-3 text-white" />}
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* MANAGE PROGRESS MODAL */}
        {activeAdminAction === 'manage_progress' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Daily Progress Items</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* List of existing progress items */}
              <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1">
                {dailyItems.map(item => (
                  <div key={item.id} className="p-4 bg-slate-950/60 rounded-2xl border border-white/[0.05] space-y-3">
                    <div className="flex justify-between items-start gap-2">
                      <div className="flex-1">
                        <input 
                          value={item.title}
                          onChange={async (e) => {
                            if (!partnership?.id) return;
                            await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { title: e.target.value });
                          }}
                          className="w-full bg-transparent font-bold text-sm text-white focus:outline-none focus:border-rose-500/50 border-b border-transparent"
                        />
                        <input 
                          value={item.description}
                          onChange={async (e) => {
                            if (!partnership?.id) return;
                            await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { description: e.target.value });
                          }}
                          className="w-full bg-transparent text-[10px] text-slate-400 focus:outline-none"
                        />
                        <select
                          value={item.category}
                          onChange={async (e) => {
                            if (!partnership?.id) return;
                            await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { category: e.target.value });
                          }}
                          className="bg-slate-800 text-white rounded p-1 text-[10px] mt-1"
                        >
                          <option value="workout">Workout</option>
                          <option value="reading">Reading</option>
                          <option value="water">Water</option>
                          <option value="meditation">Meditation</option>
                          <option value="diet">Diet</option>
                        </select>
                      </div>
                      <button onClick={async () => {
                        if (!partnership?.id) return;
                        await deleteDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id));
                      }} className="text-slate-500 hover:text-rose-400 cursor-pointer p-1"><Trash className="w-4 h-4" /></button>
                    </div>
                    <div className="flex gap-2 items-center text-xs">
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            value={item.rewardHearts || 0}
                            onChange={async (e) => {
                              if (!partnership?.id) return;
                              await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { rewardHearts: Number(e.target.value) });
                            }}
                            className="w-12 p-1 bg-slate-800 rounded text-center"
                          />
                          <span className="text-slate-500">Hearts</span>
                        </div>
                        
                        <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            value={item.targetValue || 0}
                            onChange={async (e) => {
                              if (!partnership?.id) return;
                              await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { targetValue: Number(e.target.value) });
                            }}
                            className="w-16 p-1 bg-slate-800 rounded text-center"
                            placeholder="Target"
                          />
                          <input 
                            type="text"
                            value={item.unit || ''}
                            onChange={async (e) => {
                              if (!partnership?.id) return;
                              await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { unit: e.target.value });
                            }}
                            className="w-12 p-1 bg-slate-800 rounded text-center"
                            placeholder="Unit"
                          />
                        </div>
                        <div className="flex-1">
                          <input 
                            type="text"
                            value={item.rule || ''}
                            onChange={async (e) => {
                              if (!partnership?.id) return;
                              await updateDoc(doc(db, 'partnerships', partnership.id, 'dailyItems', item.id), { rule: e.target.value });
                            }}
                            className="w-full p-1 bg-slate-800 rounded text-center text-xs"
                            placeholder="Rule (e.g. Before 10am)"
                          />
                        </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-2 pt-4">
                <button 
                  onClick={() => setActiveAdminAction('none')}
                  className="w-full py-3 bg-violet-600 hover:bg-violet-700 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
                >
                  Save Changes
                </button>
                <button 
                  onClick={async () => {
                    if (!partnership?.id) return;
                    const newRef = doc(collection(db, 'partnerships', partnership.id, 'dailyItems'));
                    await setDoc(newRef, {
                      title: 'New Daily Item',
                      rewardHearts: 5,
                      completed: false,
                      category: 'workout',
                      description: 'New daily goal',
                    });
                  }}
                  className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-black shadow-md cursor-pointer"
                >
                  Add Item
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
        {activeAdminAction === 'manage_rewards' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Manage Store Offerings</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleCreateReward} className="space-y-3.5">
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Reward Title</label>
                  <input 
                    type="text" required placeholder="e.g. Free Ice Cream Date, Back Massage"
                    value={newRewardTitle} onChange={e => setNewRewardTitle(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Heart Cost</label>
                  <input 
                    type="number" required min="1"
                    value={newRewardCost} onChange={e => setNewRewardCost(e.target.value)}
                    className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-xl text-sm font-bold text-white focus:outline-none focus:border-rose-500"
                  />
                </div>
                <button type="submit" className="w-full py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-2xl text-xs font-black shadow-md shadow-rose-500/25 cursor-pointer">
                  Add Reward to Catalog
                </button>
              </form>

              {/* List of existing rewards */}
              <div className="pt-2 border-t border-rose-500/10 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Available Store Catalog</p>
                <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                  {rewards.map(r => (
                    <div key={r.id} className="p-2.5 bg-slate-950/40 rounded-xl flex justify-between items-center text-xs border border-white/[0.02]">
                      <div className="truncate max-w-[180px]">
                        <span className="font-semibold block">{r.title}</span>
                        <span className="text-[9px] text-rose-400 font-bold">{r.cost} Hearts</span>
                      </div>
                      <button onClick={() => deleteReward(r.id)} className="text-slate-500 hover:text-rose-400 cursor-pointer"><Trash className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* APPROVE TASKS MODAL */}
        {activeAdminAction === 'approve_tasks' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Approve Verifications</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* Sub tabs inside approval list */}
              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                <div>
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider mb-2">Completed Tasks Review</h4>
                  {completedTasksCount === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/35 rounded-2xl">No tasks awaiting heart release.</p>
                  ) : (
                    <div className="space-y-2">
                      {tasks.filter(t => t.status === 'completed').map(task => (
                        <div key={task.id} className="p-4 bg-slate-950 border border-rose-500/10 rounded-2xl space-y-3">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="font-bold text-sm text-slate-200">{task.title}</p>
                              <span className="text-[10px] text-rose-400 font-bold block mt-0.5">Value: +{task.rewardHearts} Hearts</span>
                            </div>
                            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-400 text-[9px] font-black uppercase px-2 py-0.5 rounded-full">Proof uploaded</span>
                          </div>
                          
                          <div className="flex gap-2">
                            <button 
                              onClick={() => approveTask(task)}
                              className="flex-1 py-2 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black cursor-pointer"
                            >
                              Approve & Pay
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="pt-2 border-t border-rose-500/10">
                  <h4 className="text-xs font-black text-rose-300 uppercase tracking-wider mb-2">Claimed Rewards Redemptions</h4>
                  {pendingRedemptionsCount === 0 ? (
                    <p className="text-xs text-slate-500 text-center py-4 bg-slate-950/35 rounded-2xl">No reward redemptions require fulfillment.</p>
                  ) : (
                    <div className="space-y-2">
                      {redemptions.filter(r => r.status === 'pending').map(red => (
                        <div key={red.id} className="p-4 bg-slate-950 border border-rose-500/10 rounded-2xl flex justify-between items-center">
                          <div>
                            <p className="font-bold text-sm text-slate-200">{red.rewardTitle}</p>
                            <p className="text-[10px] text-slate-400 font-bold mt-0.5">Deducted: {red.cost} Hearts</p>
                          </div>
                          <button 
                            onClick={() => fulfillRedemption(red)}
                            className="py-2 px-3.5 bg-rose-500 text-white rounded-xl text-xs font-black cursor-pointer"
                          >
                            Deliver Prize
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* ANALYTICS MODAL */}
        {activeAdminAction === 'analytics' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Relationship Stats</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              {/* Sparkline chart */}
              <div className="p-4 bg-[#140813] border border-rose-500/20 rounded-2xl h-44">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={[
                    { name: 'Mon', hearts: 12 },
                    { name: 'Tue', hearts: 18 },
                    { name: 'Wed', hearts: 15 },
                    { name: 'Thu', hearts: 24 },
                    { name: 'Fri', hearts: 20 },
                    { name: 'Sat', hearts: 32 },
                    { name: 'Sun', hearts: 42 },
                  ]}>
                    <defs>
                      <linearGradient id="colorHeartsAdmin" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4}/>
                        <stop offset="95%" stopColor="#f43f5e" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="name" stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke="#64748b" fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip contentStyle={{ background: '#160c15', borderColor: '#f43f5e', borderRadius: '12px', fontSize: '12px' }} />
                    <Area type="monotone" dataKey="hearts" stroke="#f43f5e" strokeWidth={3} fillOpacity={1} fill="url(#colorHeartsAdmin)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3.5 bg-slate-950/40 border border-white/[0.02] rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Assigned Goals</span>
                  <span className="block text-lg font-black text-white mt-1">{tasks.length} Goals</span>
                </div>
                <div className="p-3.5 bg-slate-950/40 border border-white/[0.02] rounded-xl text-center">
                  <span className="text-[10px] text-slate-400 font-bold uppercase">Store Rewards</span>
                  <span className="block text-lg font-black text-white mt-1">{rewards.length} Items</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

        {/* SEND MESSAGE FEED MODAL */}
        {activeAdminAction === 'send_message' && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-[#060306]/90 flex items-center justify-center p-5 backdrop-blur-md"
          >
            <motion.div 
              initial={{ scale: 0.95, y: 15 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95, y: 15 }}
              className="w-full max-w-sm glass-premium-card rounded-[2.5rem] p-6 border border-rose-500/35 space-y-4"
            >
              <div className="flex justify-between items-center">
                <h3 className="text-base font-extrabold text-white">Send Sweet Quote</h3>
                <button onClick={() => setActiveAdminAction('none')} className="p-1.5 bg-rose-500/10 rounded-full text-rose-400 cursor-pointer"><X className="w-4 h-4" /></button>
              </div>

              <form onSubmit={handleSendMessage} className="space-y-3">
                <textarea 
                  required placeholder="Type something loving, sweet, or encouraging..." rows={3}
                  value={messageContent} onChange={e => setMessageContent(e.target.value)}
                  className="w-full p-3 bg-slate-950 border border-rose-500/20 rounded-2xl text-xs text-white focus:outline-none focus:border-rose-500"
                />
                <button type="submit" className="w-full py-2.5 bg-rose-500 hover:bg-rose-600 text-white rounded-xl text-xs font-black shadow-md shadow-rose-500/25 cursor-pointer">
                  Send Quote
                </button>
              </form>

              {/* Feed logs */}
              <div className="pt-2 border-t border-rose-500/10 space-y-2">
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Relationship Quote Feed Log</p>
                <div className="max-h-40 overflow-y-auto space-y-2 pr-1">
                  {messagesLog.map(m => (
                    <div key={m.id} className="p-3 bg-slate-950/40 rounded-xl border border-white/[0.02]">
                      <p className="text-xs text-slate-300 font-semibold">{m.text}</p>
                      <span className="text-[9px] text-rose-400 font-bold mt-1 block">{m.time}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
