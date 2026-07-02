import { Task, Reward, Redemption } from '../types';

const DEFAULT_TASKS: Task[] = [
  {
    id: 'task_1',
    title: '🍿 Set up a movie night together',
    description: 'Find a great film and make some delicious popcorn!',
    rewardHearts: 35,
    status: 'pending',
    approvalType: 'manual',
    assigneeId: 'demo_user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_2',
    title: '🥗 Prepare a healthy meal',
    description: 'Cook something nutritious and clean up afterwards.',
    rewardHearts: 50,
    status: 'completed', // starts as completed so you can see it in Approvals immediately!
    approvalType: 'manual',
    assigneeId: 'demo_user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  {
    id: 'task_3',
    title: '🧹 Do the dishes and clean the kitchen',
    description: 'Keep the shared space pristine.',
    rewardHearts: 25,
    status: 'pending',
    approvalType: 'manual',
    assigneeId: 'demo_user',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

const DEFAULT_REWARDS: Reward[] = [
  {
    id: 'reward_1',
    title: '🍦 Free Ice Cream Date',
    cost: 40,
    createdAt: new Date().toISOString()
  },
  {
    id: 'reward_2',
    title: '💆‍♂️ 30-Minute Back Massage',
    cost: 80,
    createdAt: new Date().toISOString()
  },
  {
    id: 'reward_3',
    title: '☕ Fancy Coffee on Me',
    cost: 20,
    createdAt: new Date().toISOString()
  }
];

const DEFAULT_REDEMPTIONS: Redemption[] = [
  {
    id: 'red_1',
    rewardId: 'reward_3',
    rewardTitle: '☕ Fancy Coffee on Me',
    cost: 20,
    status: 'pending',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
];

export const getDemoTasks = (): Task[] => {
  const data = localStorage.getItem('demo_tasks');
  if (!data) {
    localStorage.setItem('demo_tasks', JSON.stringify(DEFAULT_TASKS));
    return DEFAULT_TASKS;
  }
  return JSON.parse(data);
};

export const saveDemoTasks = (tasks: Task[]) => {
  localStorage.setItem('demo_tasks', JSON.stringify(tasks));
};

export const getDemoRewards = (): Reward[] => {
  const data = localStorage.getItem('demo_rewards');
  if (!data) {
    localStorage.setItem('demo_rewards', JSON.stringify(DEFAULT_REWARDS));
    return DEFAULT_REWARDS;
  }
  return JSON.parse(data);
};

export const saveDemoRewards = (rewards: Reward[]) => {
  localStorage.setItem('demo_rewards', JSON.stringify(rewards));
};

export const getDemoRedemptions = (): Redemption[] => {
  const data = localStorage.getItem('demo_redemptions');
  if (!data) {
    localStorage.setItem('demo_redemptions', JSON.stringify(DEFAULT_REDEMPTIONS));
    return DEFAULT_REDEMPTIONS;
  }
  return JSON.parse(data);
};

export const saveDemoRedemptions = (redemptions: Redemption[]) => {
  localStorage.setItem('demo_redemptions', JSON.stringify(redemptions));
};
