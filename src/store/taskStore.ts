import { create, type StateCreator } from 'zustand';
import { getDb } from '@/db/lazyDb';
import type { Task, CompletionLogEntry } from '@/types';

interface TaskState {
  tasks: Task[];
  completionLog: CompletionLogEntry[];
  isLoading: boolean;
  fetchTasks: () => Promise<void>;
  addTask: (title: string, priority: Task['priority'], recurringDays?: number[]) => Promise<void>;
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
      const { getAllTasks, getCompletionLogs, updateTask, deleteTask, formatDateKey, addCompletionLog } = await getDb();
      const [tasks, completionLog] = await Promise.all([
        getAllTasks(),
        getCompletionLogs(),
      ]);

      const today = new Date();
      const todayKey = formatDateKey(today);
      const todayDay = today.getDay();

      // Backfill: ensure every completed task with a completedAt has a completionLog entry
      const existingEntries = new Set(completionLog.map(e => `${e.taskId}:${e.dateKey}`));
      for (const task of tasks) {
        if (!task.completed || !task.completedAt) continue;
        const taskDayKey = formatDateKey(new Date(task.completedAt));
        const key = `${task.id}:${taskDayKey}`;
        if (!existingEntries.has(key)) {
          await addCompletionLog(task.id, new Date(task.completedAt));
          completionLog.push({ id: Date.now() + Math.random(), taskId: task.id, dateKey: taskDayKey, createdAt: new Date() });
          existingEntries.add(key);
        }
      }

      const toDelete: string[] = [];
      const toUncheck: string[] = [];

      for (const task of tasks) {
        if (!task.completed) continue;
        if (!task.completedAt) continue;

        const taskDayKey = formatDateKey(new Date(task.completedAt));
        if (taskDayKey !== todayKey) {
          const hasSchedule = task.recurringDays && task.recurringDays.length > 0;
          if (hasSchedule && task.recurringDays!.includes(todayDay)) {
            toUncheck.push(task.id);
          } else {
            toDelete.push(task.id);
          }
        }
      }

      if (toDelete.length > 0) {
        await Promise.all(toDelete.map((id) => deleteTask(id)));
      }
      if (toUncheck.length > 0) {
        await Promise.all(toUncheck.map((id) => updateTask(id, { completed: false, completedAt: null })));
      }

      const filteredTasks = tasks.filter((t) => !toDelete.includes(t.id));
      const mappedTasks = filteredTasks.map((t) =>
        toUncheck.includes(t.id) ? { ...t, completed: false, completedAt: null } : t
      );

      set({ tasks: mappedTasks, completionLog, isLoading: false });
    } catch (error) {
      console.error('[TaskStore] Fetch error:', error);
      set({ isLoading: false });
    }
  },

  addTask: async (title, priority, recurringDays) => {
    const newTask: Task = {
      id: crypto.randomUUID(),
      title,
      priority,
      completed: false,
      completedAt: null,
      createdAt: new Date(),
      recurringDays: recurringDays && recurringDays.length > 0 ? recurringDays : undefined,
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
