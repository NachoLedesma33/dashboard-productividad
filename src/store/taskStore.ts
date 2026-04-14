import { create, type StateCreator } from 'zustand';
import type { Task } from '@/types';
import { getAllTasks, addTask as dbAddTask, updateTask as dbUpdateTask, deleteTask as dbDeleteTask } from '@/db/database';

interface TaskState {
  tasks: Task[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (title: string, priority: Task['priority']) => Promise<void>;
  toggleTask: (id: string) => Promise<void>;
  updatePriority: (id: string, priority: Task['priority']) => Promise<void>;
  reorderTasks: (tasks: Task[]) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
}

type TaskStateCreator = StateCreator<TaskState>;

const devLogger: (config: TaskStateCreator) => TaskStateCreator = (config) => (set, get, api) => {
  const originalSet = set;
  const loggedSet: typeof set = (partial) => {
    if (import.meta.env.DEV) {
      console.log('[TaskStore] Updating state');
    }
    return originalSet(partial);
  };
  return config(loggedSet, get, api);
};

export const useTaskStore = create<TaskState>()(devLogger((set, get) => ({
  tasks: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const tasks = await getAllTasks();
      set({ tasks, isLoading: false });
    } catch (error) {
      console.error('[TaskStore] Fetch error:', error);
      set({ isLoading: false });
    }
  },

  addTask: async (title, priority) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      priority,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
    };
    
    await dbAddTask(newTask);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const updatedCompleted = !task.completed;
    const updatedCompletedAt = updatedCompleted ? new Date() : null;

    await dbUpdateTask(id, { completed: updatedCompleted, completedAt: updatedCompletedAt });
    
    set((state) => ({
      tasks: state.tasks.map((t) =>
        t.id === id ? { ...t, completed: updatedCompleted, completedAt: updatedCompletedAt } : t
      ),
    }));
  },

  updatePriority: async (id, priority) => {
    await dbUpdateTask(id, { priority });
    
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, priority } : t)),
    }));
  },

  reorderTasks: async (tasks) => {
    set({ tasks });
    
    for (const task of tasks) {
      await dbUpdateTask(task.id, { ...task });
    }
  },

  deleteTask: async (id) => {
    await dbDeleteTask(id);
    
    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
})));