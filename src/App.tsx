import { useEffect, useMemo, useCallback } from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { useTaskStore } from "@/store/taskStore";
import { useHabitStore } from "@/store/habitStore";
import { useDatabase } from "@/hooks/useDatabase";
import { TaskBoard } from "@/components/tasks/TaskBoard";
import { HabitTracker } from "@/components/habits/HabitTracker";
import { InsightsPanel } from "@/components/ui/InsightsPanel";
import { ProductivityChart } from "@/components/charts/ProductivityChart";
import { generateInsights } from "@/utils/analytics/insightsEngine";
import { seedDatabase } from "@/utils/seedData";
import type { Priority } from "@/types";
import "./App.css";

function LoadingSpinner() {
  return (
    <div className="flex items-center justify-center min-h-[200px]">
      <div className="loading-spinner" />
    </div>
  );
}

function App() {
  const { isLoading: dbLoading, resetDatabase } = useDatabase();
  const {
    tasks,
    isLoading: tasksLoading,
    fetchTasks,
    addTask,
    toggleTask,
    updatePriority,
    deleteTask,
  } = useTaskStore();
  const {
    habits,
    isLoading: habitsLoading,
    fetchHabits,
    addHabit,
    toggleHabit,
    getTodayStatus,
    getStreak,
  } = useHabitStore();

  useEffect(() => {
    fetchTasks();
    fetchHabits();
  }, [fetchTasks, fetchHabits]);

  const insights = useMemo(
    () => generateInsights(tasks, habits),
    [tasks, habits],
  );

  const handleAddTask = useCallback(
    async (title: string, priority: Priority) => {
      await addTask(title, priority);
    },
    [addTask],
  );

  const handleResetDemoData = useCallback(async () => {
    await resetDatabase();
    await seedDatabase();
    window.location.reload();
  }, [resetDatabase]);

  const isLoading = dbLoading || tasksLoading || habitsLoading;
  const today = format(new Date(), "EEEE, d 'de' MMMM", { locale: es });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 sm:p-8 lg:p-12">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <header className="mb-12 pt-8 animate-slide-in">
          <div className="glass rounded-3xl p-8 shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">
                  Dashboard de Productividad
                </h1>
                <p className="text-lg text-slate-600 dark:text-slate-300 capitalize">
                  {today}
                </p>
              </div>
              <button
                onClick={handleResetDemoData}
                className="btn btn-secondary self-start px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 transform hover:scale-105 transition-all duration-300 shadow-lg"
              >
                Cargar datos demo
              </button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="space-y-12">
          {/* Top Row: Tasks and Habits */}
          <div
            className="grid grid-cols-1 xl:grid-cols-3 gap-8 animate-slide-in"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Task Board */}
            <div className="xl:col-span-2">
              <div className="glass rounded-2xl shadow-xl border-0 p-5 transition-all duration-300">
                <TaskBoard
                  tasks={tasks}
                  onToggle={toggleTask}
                  onDelete={deleteTask}
                  onPriorityChange={updatePriority}
                  onAddTask={handleAddTask}
                />
              </div>
            </div>

            {/* Habits Panel */}
            <div className="xl:col-span-1">
              <div className="glass rounded-2xl shadow-xl border-0 p-5 transition-all duration-300">
                <HabitTracker
                  habits={habits}
                  getTodayStatus={getTodayStatus}
                  getStreak={getStreak}
                  onToggle={toggleHabit}
                  onAddHabit={addHabit}
                />
              </div>
            </div>
          </div>

          {/* Bottom Row: Insights and Chart */}
          <div
            className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-slide-in"
            style={{ animationDelay: "0.2s" }}
          >
            {/* Insights */}
            <div className="glass rounded-2xl shadow-xl border-0 p-5 transition-all duration-300">
              <InsightsPanel insights={insights} />
            </div>

            {/* Productivity Chart */}
            <div className="glass rounded-2xl shadow-xl border-0 p-5 transition-all duration-300">
              <ProductivityChart tasks={tasks} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className="mt-16 pt-8 animate-slide-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="glass rounded-2xl p-6 text-center">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Dashboard de Productividad © 2024
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}

export default App;
