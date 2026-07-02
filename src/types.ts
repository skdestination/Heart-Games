export type Role = 'admin' | 'user';

export interface UserProfile {
  id: string;
  email: string;
  role: Role;
  partnershipId?: string;
  createdAt: string;
}

export interface Partnership {
  id: string;
  adminId: string;
  userId?: string;
  totalHearts: number;
  streakCount: number;
  createdAt: string;
  claimedLevelRewards: number[];
}

export interface DailyProgressItem {
  id: string;
  title: string;
  rewardHearts: number;
  completed: boolean;
  category: 'workout' | 'reading' | 'water' | 'meditation' | 'diet';
  description: string;
  targetValue?: number; // e.g. 2000 for water
  unit?: string; // e.g. 'ml'
  rule?: string; // e.g. 'Complete before 10 AM'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  rewardHearts: number;
  status: 'pending' | 'completed' | 'approved';
  assigneeId: string;
  createdAt: string;
  updatedAt: string;
  reminderCount?: number;
  reminderInterval?: string;
  reminderTimings?: string[];
  approvalType: 'manual' | 'automatic';
  deadline?: string;
  penaltyApplied?: boolean;
}

export interface GiftRequest {
  id: string;
  level: number;
  requestText: string;
  status: 'pending' | 'fulfilled';
  createdAt: string;
}

export interface Reward {
  id: string;
  title: string;
  cost: number;
  createdAt: string;
}

export interface Redemption {
  id: string;
  rewardId: string;
  rewardTitle: string;
  cost: number;
  status: 'pending' | 'fulfilled';
  createdAt: string;
  updatedAt: string;
}
