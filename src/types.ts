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
