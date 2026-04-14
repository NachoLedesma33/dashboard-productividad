import { create, type StateCreator } from 'zustand';
import type { Habit } from '@/types';
import { addHabit as dbAddHabit, toggleHabitToday as dbToggleHabit, getAllHabits as dbGetAllHabits } from '@/db/database';

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isTodayCompleted(habit: Habit): boolean {
  const today = getTodayStart();
  return habit.completionDates.some((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
}

function calculateStreak(completionDates: Date[], current: boolean): number {
  if (completionDates.length === 0) return 0;

  const sorted = [...completionDates]
    .map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .sort((a, b) => b - a);

  const today = getTodayStart().getTime();
  const yesterday = today - 86400000;

  let streak = 0;
  let checkDate = current ? today : yesterday;

  for (const timestamp of sorted) {
    if (timestamp === checkDate) {
      streak++;
      checkDate -= 86400000;
    } else if (timestamp < checkDate) {
      break;
    }
  }

  return streak;
}

function calculateBestStreak(completionDates: Date[]): number {
  if (completionDates.length === 0) return 0;

  const uniqueDates = [...new Set(
    completionDates.map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
  )].sort((a, b) => a - b);

  let best = 1;
  let current = 1;

  for (let i = 1; i < uniqueDates.length; i++) {
    if (uniqueDates[i] - uniqueDates[i - 1] === 86400000) {
      current++;
      best = Math.max(best, current);
    } else {
      current = 1;
    }
  }

  return best;
}

interface HabitState {
  habits: Habit[];
  isLoading: boolean;
  fetchHabits: () => Promise<void>;
  addHabit: (name: string) => Promise<void>;
  toggleHabit: (habitId: string) => Promise<void>;
  getTodayStatus: (habitId: string) => boolean;
  getStreak: (habitId: string) => number;
  getBestStreak: (habitId: string) => number;
}

type HabitStateCreator = StateCreator<HabitState>;

const devLogger: (config: HabitStateCreator) => HabitStateCreator = (config) => (set, get, api) => {
  const originalSet = set;
  const loggedSet: typeof set = (partial) => {
    if (import.meta.env.DEV) {
      console.log('[HabitStore] Updating state');
    }
    return originalSet(partial);
  };
  return config(loggedSet, get, api);
};

export const useHabitStore = create<HabitState>()(devLogger((set, get) => ({
  habits: [],
  isLoading: false,

  fetchHabits: async () => {
    set({ isLoading: true });
    try {
      const habits = await dbGetAllHabits();
      set({ habits, isLoading: false });
    } catch (error) {
      console.error('[HabitStore] Fetch error:', error);
      set({ isLoading: false });
    }
  },

  addHabit: async (name) => {
    const newHabit: Habit = {
      id: crypto.randomUUID(),
      name,
      completionDates: [],
    };
    
    await dbAddHabit(newHabit);
    set((state) => ({ habits: [...state.habits, newHabit] }));
  },

  toggleHabit: async (habitId) => {
    await dbToggleHabit(habitId);
    
    set((state) => ({
      habits: state.habits.map((h) => {
        if (h.id !== habitId) return h;
        
        const today = getTodayStart();
        const existingIndex = h.completionDates.findIndex((date) => {
          const d = new Date(date);
          d.setHours(0, 0, 0, 0);
          return d.getTime() === today.getTime();
        });

        if (existingIndex >= 0) {
          return {
            ...h,
            completionDates: h.completionDates.filter((_, i) => i !== existingIndex),
          };
        } else {
          return {
            ...h,
            completionDates: [...h.completionDates, new Date()],
          };
        }
      }),
    }));
  },

  getTodayStatus: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return false;
    return isTodayCompleted(habit);
  },

  getStreak: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    return calculateStreak(habit.completionDates, isTodayCompleted(habit));
  },

  getBestStreak: (habitId) => {
    const habit = get().habits.find((h) => h.id === habitId);
    if (!habit) return 0;
    return calculateBestStreak(habit.completionDates);
  },
})));