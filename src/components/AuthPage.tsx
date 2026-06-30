import { useState, FormEvent } from 'react';
import { auth, db } from '../lib/firebase';
import { signInWithEmailAndPassword, createUserWithEmailAndPassword, GoogleAuthProvider, signInWithCredential } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { useStore } from '../store/useStore';
import { motion, AnimatePresence } from 'motion/react';
import { UserProfile } from '../types';
import { Heart, ChevronRight, LogIn, Mail, Lock } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

export default function AuthPage() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const { setUserProfile, isDemoMode, setIsDemoMode, setPartnership } = useStore();
  
  // Custom screen sequence inside Auth: 'welcome' | 'auth_methods'
  const [authStep, setAuthStep] = useState<'welcome' | 'auth_methods'>('welcome');

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError('');
      
      const result = await FirebaseAuthentication.signInWithGoogle();
      if (result.credential?.idToken) {
        const credential = GoogleAuthProvider.credential(result.credential.idToken);
        const userCredential = await signInWithCredential(auth, credential);
        const user = userCredential.user;

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
      } else {
        setError('Google sign in failed. No token received.');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Google Sign-In failed.');
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      setError('Please fill in all fields.');
      return;
    }
    setLoading(true);
    setError('');

    try {
      if (authMode === 'login') {
        const result = await signInWithEmailAndPassword(auth, email.trim(), password);
        const user = result.user;

        const docRef = doc(db, 'users', user.uid);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          setUserProfile({ id: docSnap.id, ...docSnap.data() } as UserProfile);
        } else {
          setUserProfile(null);
        }
      } else {
        await createUserWithEmailAndPassword(auth, email.trim(), password);
        // Note: useAuth listener will automatically discover the new user is logged in
        // and guide them through Onboarding role selection page.
      }
    } catch (err: any) {
      if (err.code === 'auth/invalid-credential') {
        setError('Incorrect email or password. Please try again.');
      } else if (err.code === 'auth/email-already-in-use') {
        setError('An account with this email address already exists.');
      } else if (err.code === 'auth/weak-password') {
        setError('Password should be at least 6 characters.');
      } else if (err.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else {
        setError(err.message || 'Authentication failed. Please check your connection.');
      }
    } finally {
      setLoading(false);
    }
  };

  const startDemoShortcut = () => {
    setIsDemoMode(true);
    setUserProfile({
      id: 'demo_admin',
      email: 'demo@heartgoals.com',
      role: 'admin',
      partnershipId: 'demo_partnership',
      createdAt: new Date().toISOString()
    });
    setPartnership({
      id: 'demo_partnership',
      adminId: 'demo_admin',
      userId: 'demo_user',
      totalHearts: 124,
      streakCount: 7,
      createdAt: new Date().toISOString()
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen p-5 relative overflow-hidden bg-[#040105]">
      
      {/* Upper and lower ambient blurs */}
      <div className="absolute top-[-50px] left-1/2 -translate-x-1/2 w-96 h-96 bg-rose-500/10 rounded-full blur-[110px] pointer-events-none"></div>
      <div className="absolute bottom-[-50px] left-1/3 w-80 h-80 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none"></div>

      <AnimatePresence mode="wait">
        
        {/* STEP 1: WELCOME SCREEN (Screen 1 in image mockup) */}
        {authStep === 'welcome' && (
          <motion.div 
            key="welcome-step"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.5 }}
            className="w-full max-w-sm flex flex-col items-center text-center space-y-8 p-4"
          >
            {/* Glowing Big Neon Heart Ring */}
            <div className="relative w-40 h-40 flex items-center justify-center">
              {/* Outer light aura */}
              <div className="absolute inset-0 bg-rose-500/10 rounded-full blur-3xl animate-pulse"></div>
              {/* Spinning glow lines */}
              <div className="absolute inset-0 rounded-full border-2 border-dashed border-rose-500/25 animate-[spin_40s_linear_infinite]"></div>
              {/* Fine neon circle frame */}
              <div className="absolute inset-3 rounded-full border border-rose-500/30 bg-[#0c050c] shadow-[0_0_40px_rgba(244,63,94,0.15)] flex items-center justify-center">
                <Heart className="w-16 h-16 text-rose-500 fill-rose-500 animate-bounce filter drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]" />
              </div>
            </div>

            {/* Typography */}
            <div className="space-y-3">
              <h1 className="text-4xl font-extrabold tracking-tight text-white">
                Heart <span className="text-rose-500 text-glow">Goals</span>
              </h1>
              <p className="text-sm text-slate-400 font-medium px-4">
                Grow together. Love stronger.
              </p>
            </div>

            {/* Actions */}
            <div className="w-full space-y-4 pt-4 px-2">
              {error && (
                <div className="w-full p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs text-center leading-relaxed">
                  {error}
                </div>
              )}

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => {
                  setError('');
                  setAuthStep('auth_methods');
                }}
                className="w-full py-4 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white rounded-3xl text-sm font-black tracking-wide shadow-[0_4px_25px_rgba(244,63,94,0.4)] flex items-center justify-center gap-3 cursor-pointer"
              >
                <span>Get Started</span>
                <ChevronRight className="w-4 h-4" />
              </motion.button>

              {!Capacitor.isNativePlatform() && (
                <button 
                  onClick={startDemoShortcut}
                  className="w-full text-xs text-rose-400 hover:text-white font-extrabold tracking-wider uppercase underline underline-offset-4 cursor-pointer"
                >
                  Bypass with Sandbox Demo
                </button>
              )}
            </div>
          </motion.div>
        )}

        {/* STEP 2: AUTH METHODS & EMAIL AUTH */}
        {authStep === 'auth_methods' && (
          <motion.div 
            key="auth-methods-step"
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -15 }}
            transition={{ duration: 0.4 }}
            className="w-full max-w-sm glass-premium-card p-6 md:p-8 rounded-[2.5rem] flex flex-col items-center relative overflow-hidden border border-rose-500/20"
          >
            {/* Top mirror line */}
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-rose-400/20 to-transparent"></div>

            <div className="relative mb-4">
              <div className="w-12 h-12 bg-rose-500/10 border border-rose-500/25 rounded-2xl flex items-center justify-center">
                <LogIn className="w-6 h-6 text-rose-400" />
              </div>
            </div>

            <h2 className="text-xl font-extrabold text-white">
              {authMode === 'login' ? 'Welcome Back' : 'Create Account'}
            </h2>
            <p className="text-xs text-slate-400 text-center mt-2 px-3">
              {authMode === 'login' 
                ? 'Sign in to sync goals, streaks, and milestones with your partner.'
                : 'Sign up to start sharing a physical goal space with your partner.'}
            </p>

            {error && (
              <div className="w-full p-3.5 bg-rose-500/10 border border-rose-500/25 rounded-2xl text-rose-300 text-xs text-center mt-4 leading-relaxed">
                {error}
              </div>
            )}

            <div className="w-full mt-6 space-y-4">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={loading}
                className="w-full bg-white text-slate-900 hover:bg-slate-100 font-bold py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(255,255,255,0.1)] disabled:opacity-50 text-xs cursor-pointer"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path
                    fill="currentColor"
                    d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  />
                  <path
                    fill="currentColor"
                    d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  />
                  <path
                    fill="currentColor"
                    d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  />
                </svg>
                Continue with Google
              </button>

              <div className="relative flex items-center py-2">
                <div className="flex-grow border-t border-rose-500/10"></div>
                <span className="flex-shrink-0 mx-4 text-slate-500 text-[10px] uppercase font-bold tracking-wider">or</span>
                <div className="flex-grow border-t border-rose-500/10"></div>
              </div>
            </div>

            <form onSubmit={handleAuthSubmit} className="w-full space-y-4">
              {/* Email Input */}
              <div className="space-y-1.5 w-full">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1 animate-pulse" htmlFor="email-input">
                  Email Address
                </label>
                <div className="relative flex items-center">
                  <Mail className="absolute left-4 w-4 h-4 text-slate-500" />
                  <input
                    id="email-input"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#130713]/80 border border-rose-500/15 focus:border-rose-500/40 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div className="space-y-1.5 w-full">
                <label className="text-[11px] font-bold text-slate-400 uppercase tracking-wider ml-1" htmlFor="password-input">
                  Password
                </label>
                <div className="relative flex items-center">
                  <Lock className="absolute left-4 w-4 h-4 text-slate-500" />
                  <input
                    id="password-input"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 bg-[#130713]/80 border border-rose-500/15 focus:border-rose-500/40 rounded-2xl text-sm text-white placeholder-slate-600 focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full mt-2 bg-gradient-to-r from-rose-500 to-rose-600 hover:from-rose-600 hover:to-rose-700 text-white font-black py-3.5 px-4 rounded-2xl transition-all flex items-center justify-center gap-3 shadow-[0_4px_15px_rgba(244,63,94,0.2)] disabled:opacity-50 text-xs cursor-pointer"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <span>{authMode === 'login' ? 'Sign In' : 'Sign Up'}</span>
                )}
              </button>
            </form>

            <div className="w-full space-y-4 mt-5 text-center">
              {/* Toggle Mode */}
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setError('');
                }}
                className="text-xs text-rose-400 hover:text-white font-bold transition-colors underline underline-offset-4 cursor-pointer"
              >
                {authMode === 'login' ? "Don't have an account? Sign up" : 'Already have an account? Sign in'}
              </button>

              {!Capacitor.isNativePlatform() && (
                <button
                  type="button"
                  onClick={startDemoShortcut}
                  className="w-full bg-slate-950 hover:bg-[#140614] text-slate-300 font-bold py-3 px-4 rounded-2xl border border-rose-500/20 transition-all flex items-center justify-center gap-1.5 text-[10px] uppercase tracking-wider cursor-pointer"
                >
                  <span>🚀 Bypass with Demo Mode</span>
                  <ChevronRight className="w-3.5 h-3.5 opacity-60 text-rose-400" />
                </button>
              )}

              <button
                type="button"
                onClick={() => {
                  setAuthStep('welcome');
                  setError('');
                }}
                className="w-full py-1 text-xs text-slate-400 hover:text-white font-semibold cursor-pointer text-center"
              >
                Cancel
              </button>
            </div>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}
