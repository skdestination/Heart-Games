import { create } from 'zustand';
import { UserProfile, Partnership } from '../types';

interface AppState {
  userProfile: UserProfile | null;
  partnership: Partnership | null;
  isDemoMode: boolean;
  setUserProfile: (profile: UserProfile | null) => void;
  setPartnership: (partnership: Partnership | null) => void;
  setIsDemoMode: (isDemoMode: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  userProfile: null,
  partnership: null,
  isDemoMode: false,
  setUserProfile: (profile) => set({ userProfile: profile }),
  setPartnership: (partnership) => set({ partnership }),
  setIsDemoMode: (isDemoMode) => set({ isDemoMode }),
}));
