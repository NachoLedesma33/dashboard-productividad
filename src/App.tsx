import { useEffect, useMemo, useCallback } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useTaskStore } from '@/store/taskStore';
import { useHabitStore } from '@/store/habitStore';
import { useDatabase } from '@/hooks/useDatabase';
import { TaskBoard } from '@/components/tasks/TaskBoard';
import { HabitTracker } from '@/components/habits/HabitTracker';
import { InsightsPanel } from '@/components/ui/InsightsPanel';
import { ProductivityChart } from '@/components/charts/ProductivityChart';
import { generateInsights } from '@/utils/analytics/insightsEngine';
import { seedDatabase } from '@/utils/seedData';
import type { Priority } from '@/types';
import './App.css';

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center p-8">
      <div className="w-8 h-8 border-4 border-purple-600 border-t-transparent rounded-full animate-spin" />
    </div>
  );
}

function App() {
  const { isLoading: dbLoading, resetDatabase } = useDatabase();
  const { tasks, isLoading: tasksLoading, fetchTasks, addTask, toggleTask, updatePriority, deleteTask } = useTaskStore();
  const { habits, isLoading: habitsLoading, fetchHabits, addHabit, toggleHabit, getTodayStatus, getStreak } = useHabitStore();

  useEffect(() => {
    fetchTasks();
    fetchHabits();
  }, [fetchTasks, fetchHabits]);

  const insights = useMemo(() => generateInsights(tasks, habits), [tasks, habits]);

  const handleAddTask = useCallback(async (title: string, priority: Priority) => {
    await addTask(title, priority);
  }, [addTask]);

  const handleResetDemoData = useCallback(async () => {
    await resetDatabase();
    await seedDatabase();
    window.location.reload();
  }, [resetDatabase]);

  const isLoading = dbLoading || tasksLoading || habitsLoading;
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <header className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800">Dashboard de Productividad</h1>
            <p className="text-gray-500 mt-1 capitalize">{today}</p>
          </div>
          <button
            onClick={handleResetDemoData}
            className="px-4 py-2 text-sm text-gray-500 hover:text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100 transition-colors"
          >
            Load Demo Data
          </button>
        </div>
      </header>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <TaskBoard
            tasks={tasks}
            onToggle={toggleTask}
            onDelete={deleteTask}
            onPriorityChange={updatePriority}
            onAddTask={handleAddTask}
          />
        </div>

        <div className="space-y-6">
          <HabitTracker
            habits={habits}
            getTodayStatus={getTodayStatus}
            getStreak={getStreak}
            onToggle={toggleHabit}
            onAddHabit={addHabit}
          />

          <InsightsPanel insights={insights} />
        </div>
      </div>

      <div className="mt-6">
        <ProductivityChart tasks={tasks} />
      </div>
    </div>
  );
}

export default App;