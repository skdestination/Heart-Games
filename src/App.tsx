/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect } from 'react';
import { useAuth } from './lib/useAuth';
import { useStore } from './store/useStore';
import { db, handleFirestoreError, OperationType } from './lib/firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { Partnership } from './types';
import { Capacitor } from '@capacitor/core';
import { App as CapApp } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';
import AuthPage from './components/AuthPage';
import Onboarding from './components/Onboarding';
import PartnershipSetup from './components/PartnershipSetup';
import AdminDashboard from './components/AdminDashboard';
import UserDashboard from './components/UserDashboard';

export default function App() {
  const { user, loading } = useAuth();
  const { userProfile, partnership, setPartnership, isDemoMode, setIsDemoMode, setUserProfile } = useStore();

  useEffect(() => {
    if (Capacitor.isNativePlatform()) {
      StatusBar.setStyle({ style: Style.Dark }).catch(console.error);
      StatusBar.setOverlaysWebView({ overlay: true }).catch(console.error);
      
      CapApp.addListener('backButton', ({ canGoBack }) => {
        if (!canGoBack) {
          // If we are at the root, do nothing or exit depending on preference
          // Preventing default by not calling CapApp.exitApp() keeps the app alive
        } else {
          window.history.back();
        }
      });
    }
  }, []);

  useEffect(() => {
    if (userProfile?.partnershipId && !isDemoMode) {
      const unsubscribe = onSnapshot(doc(db, 'partnerships', userProfile.partnershipId), (docSnap) => {
        if (docSnap.exists()) {
          setPartnership({ id: docSnap.id, ...docSnap.data() } as Partnership);
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `partnerships/${userProfile.partnershipId}`);
      });
      return () => unsubscribe();
    }
  }, [userProfile?.partnershipId, setPartnership, isDemoMode]);

  const handleToggleDemoMode = () => {
    if (isDemoMode) {
      setIsDemoMode(false);
      setUserProfile(null);
      setPartnership(null);
    } else {
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
        totalHearts: 120,
        streakCount: 7,
        createdAt: new Date().toISOString()
      });
    }
  };

  const handleToggleRole = () => {
    if (!userProfile) return;
    setUserProfile({
      ...userProfile,
      role: userProfile.role === 'admin' ? 'user' : 'admin'
    });
  };

  // If loading and not in demo mode
  if (loading && !isDemoMode) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-pink-500 border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  // Developer Control Panel (rendered on top of everything)
  const renderDevControls = () => {
    if (Capacitor.isNativePlatform()) return null;
    return (
      <div className="w-full bg-slate-900 border-b border-pink-500/30 p-3 text-xs flex flex-wrap items-center justify-between gap-2 z-50 relative">
      <div className="flex items-center gap-2">
        <span className="text-pink-400 font-bold">🛠️ Developer Sandbox:</span>
        <span className="text-slate-300">Bypass restrictions</span>
      </div>
      <div className="flex items-center gap-2">
        <button
          onClick={handleToggleDemoMode}
          className={`px-3 py-1.5 rounded-lg font-semibold transition-all ${
            isDemoMode ? 'bg-red-500 text-white' : 'bg-pink-500 hover:bg-pink-600 text-white'
          }`}
        >
          {isDemoMode ? '🔌 Stop Demo Mode' : '🚀 Start Demo Mode'}
        </button>
        {isDemoMode && (
          <button
            onClick={handleToggleRole}
            className="px-3 py-1.5 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-semibold transition-all"
          >
            🔄 Switch to {userProfile?.role === 'admin' ? 'Partner User' : 'Partner Admin'}
          </button>
        )}
      </div>
    </div>
    );
  };

  // If in demo mode, skip auth checks entirely!
  if (isDemoMode && userProfile) {
    return (
      <div className="min-h-screen w-full max-w-lg mx-auto bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col">
        {renderDevControls()}
        <div className="flex-1 overflow-y-auto">
          {userProfile.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
        </div>
      </div>
    );
  }

  // Normal flow
  if (!user) {
    return (
      <div className="min-h-screen w-full max-w-lg mx-auto bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        {renderDevControls()}
        <div className="flex-1">
          <AuthPage />
        </div>
      </div>
    );
  }

  if (!userProfile) {
    return (
      <div className="min-h-screen w-full max-w-lg mx-auto bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        {renderDevControls()}
        <div className="flex-1">
          <Onboarding />
        </div>
      </div>
    );
  }
  
  if (!userProfile.partnershipId || (userProfile.role === 'admin' && !partnership?.userId)) {
    return (
      <div className="min-h-screen w-full max-w-lg mx-auto bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col justify-between">
        {renderDevControls()}
        <div className="flex-1">
          <PartnershipSetup />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full max-w-lg mx-auto bg-slate-950 shadow-2xl relative overflow-hidden flex flex-col">
      {renderDevControls()}
      <div className="flex-1 overflow-y-auto">
        {userProfile.role === 'admin' ? <AdminDashboard /> : <UserDashboard />}
      </div>
    </div>
  );
}
