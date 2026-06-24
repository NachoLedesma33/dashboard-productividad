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
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/Toaster";
import { toast } from "@/lib/toast";
import { generateInsights } from "@/utils/analytics/insightsEngine";
import { seedDatabase } from "@/utils/seedData";
import type { Priority } from "@/types";

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
    reorderTasks,
  } = useTaskStore();
  const {
    habits,
    isLoading: habitsLoading,
    fetchHabits,
    addHabit,
    toggleHabit,
    deleteHabit,
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
      toast("Tarea agregada", "success");
    },
    [addTask],
  );

  const handleDeleteTask = useCallback(
    async (id: string) => {
      await deleteTask(id);
      toast("Tarea eliminada", "info");
    },
    [deleteTask],
  );

  const handlePriorityChange = useCallback(
    async (id: string, priority: Priority) => {
      const task = tasks.find((t) => t.id === id);
      await updatePriority(id, priority);
      const labels: Record<Priority, string> = { high: "Alta", medium: "Media", low: "Baja" };
      toast(task ? `"${task.title}" movida a ${labels[priority]}` : "Prioridad actualizada", "info");
    },
    [updatePriority, tasks],
  );

  const handleReorder = useCallback(
    async (reordered: import("@/types").Task[]) => {
      await reorderTasks(reordered);
    },
    [reorderTasks],
  );

  const handleToggleTask = useCallback(
    async (id: string) => {
      const task = tasks.find((t) => t.id === id);
      const wasDone = task?.completed ?? false;
      await toggleTask(id);
      toast(wasDone ? "Tarea desmarcada" : "Tarea completada", "success");
    },
    [toggleTask, tasks],
  );

  const handleAddHabit = useCallback(
    async (name: string) => {
      await addHabit(name);
      toast("Hábito agregado", "success");
    },
    [addHabit],
  );

  const handleDeleteHabit = useCallback(
    async (id: string) => {
      await deleteHabit(id);
      toast("Hábito eliminado", "info");
    },
    [deleteHabit],
  );

  const handleToggleHabit = useCallback(
    async (id: string) => {
      const wasDone = getTodayStatus(id);
      await toggleHabit(id);
      toast(wasDone ? "Hábito desmarcado" : "Hábito completado", "success");
    },
    [toggleHabit, getTodayStatus],
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
          <div className="surface-card p-8 shadow-xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
                  Dashboard de Productividad
                </h1>
                <p className="text-lg text-text-secondary capitalize">
                  {today}
                </p>
              </div>
              <Button
                onClick={handleResetDemoData}
                variant="default"
                size="lg"
                className="self-start transform hover:scale-105 font-semibold"
              >
                Cargar datos demo
              </Button>
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
              <div className="surface-card p-5 shadow-xl">
                <TaskBoard
                  tasks={tasks}
                  onToggle={handleToggleTask}
                  onDelete={handleDeleteTask}
                  onPriorityChange={handlePriorityChange}
                  onAddTask={handleAddTask}
                  onReorder={handleReorder}
                />
              </div>
            </div>

            {/* Habits Panel */}
            <div className="xl:col-span-1">
              <div className="surface-card p-5 shadow-xl">
                <HabitTracker
                  habits={habits}
                  getTodayStatus={getTodayStatus}
                  getStreak={getStreak}
                  onToggle={handleToggleHabit}
                  onDeleteHabit={handleDeleteHabit}
                  onAddHabit={handleAddHabit}
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
            <div className="surface-card p-5 shadow-xl">
              <InsightsPanel insights={insights} />
            </div>

            {/* Productivity Chart */}
            <div className="surface-card p-5 shadow-xl">
              <ProductivityChart tasks={tasks} />
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className="mt-16 pt-8 animate-slide-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="surface-card p-6 text-center">
            <p className="text-sm text-text-muted">
              Dashboard de Productividad © 2024
            </p>
          </div>
        </footer>
      </div>

      <Toaster />
    </div>
  );
}

export default App;
