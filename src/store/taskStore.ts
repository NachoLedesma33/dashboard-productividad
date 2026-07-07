import { create, type StateCreator } from 'zustand';
import { getDb } from '@/db/lazyDb';
import type { Task, CompletionLogEntry } from '@/types';

interface TaskState {
  tasks: Task[];
  completionLog: CompletionLogEntry[];
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
  completionLog: [],
  isLoading: false,

  fetchTasks: async () => {
    set({ isLoading: true });
    try {
      const { getAllTasks, updateTask, getCompletionLogs } = await getDb();
      const [tasks, completionLog] = await Promise.all([
        getAllTasks(),
        getCompletionLogs(),
      ]);

      const today = new Date();
      const todayKey = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, '0')}-${String(today.getDate()).padStart(2, '0')}`;

      const staleTasks = tasks.filter(
        (t) => t.completed && t.completedAt && (() => {
          const d = new Date(t.completedAt!);
          return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` !== todayKey;
        })()
      );

      if (staleTasks.length > 0) {
        await Promise.all(staleTasks.map((t) => updateTask(t.id, { completed: false, completedAt: null })));
        set({
          tasks: tasks.map((t) =>
            staleTasks.some((s) => s.id === t.id) ? { ...t, completed: false, completedAt: null } : t
          ),
          completionLog,
          isLoading: false,
        });
      } else {
        set({ tasks, completionLog, isLoading: false });
      }
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

    const { addTask: dbAddTask } = await getDb();
    await dbAddTask(newTask);
    set((state) => ({ tasks: [...state.tasks, newTask] }));
  },

  toggleTask: async (id) => {
    const task = get().tasks.find((t) => t.id === id);
    if (!task) return;

    const { updateTask: dbUpdateTask, addCompletionLog, removeTodayCompletionLog, formatDateKey } = await getDb();

    const updatedCompleted = !task.completed;
    const updatedCompletedAt = updatedCompleted ? new Date() : null;

    await dbUpdateTask(id, { completed: updatedCompleted, completedAt: updatedCompletedAt });

    if (updatedCompleted) {
      await addCompletionLog(id);
      const dateKey = formatDateKey(new Date());
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, completed: updatedCompleted, completedAt: updatedCompletedAt } : t
        ),
        completionLog: [
          ...state.completionLog,
          { id: Date.now(), taskId: id, dateKey, createdAt: new Date() },
        ],
      }));
    } else {
      await removeTodayCompletionLog(id);
      const dateKey = formatDateKey(new Date());
      set((state) => ({
        tasks: state.tasks.map((t) =>
          t.id === id ? { ...t, completed: updatedCompleted, completedAt: updatedCompletedAt } : t
        ),
        completionLog: state.completionLog.filter(
          (entry) => !(entry.taskId === id && entry.dateKey === dateKey)
        ),
      }));
    }
  },

  updatePriority: async (id, priority) => {
    const { updateTask: dbUpdateTask } = await getDb();
    await dbUpdateTask(id, { priority });

    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? { ...t, priority } : t)),
    }));
  },

  reorderTasks: async (tasks) => {
    set({ tasks });
    const { bulkUpdateTasks } = await getDb();
    await bulkUpdateTasks(tasks);
  },

  deleteTask: async (id) => {
    const { deleteTask: dbDeleteTask } = await getDb();
    await dbDeleteTask(id);

    set((state) => ({
      tasks: state.tasks.filter((t) => t.id !== id),
    }));
  },
})));
