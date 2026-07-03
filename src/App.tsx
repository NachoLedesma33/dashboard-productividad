import { useEffect, useCallback, useMemo, useState, lazy, Suspense } from "react";
import { useTaskStore } from "@/store/taskStore";
import { useHabitStore } from "@/store/habitStore";
import { useDatabase } from "@/hooks/useDatabase";
import type { Insight } from "@/utils/analytics/insightsEngine";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/Toaster";
import { toast } from "@/lib/toast";
import { ClipboardList, CheckCircle2, TrendingUp, Flame } from "lucide-react";

const TaskBoard = lazy(() => import("@/components/tasks/TaskBoard").then((m) => ({ default: m.TaskBoard })));
const HabitTracker = lazy(() => import("@/components/habits/HabitTracker").then((m) => ({ default: m.HabitTracker })));
const InsightsPanel = lazy(() => import("@/components/ui/InsightsPanel").then((m) => ({ default: m.InsightsPanel })));
const ProductivityChart = lazy(() => import("@/components/charts/ProductivityChart").then((m) => ({ default: m.ProductivityChart })));

type Priority = "low" | "medium" | "high";

const DAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];

function TaskBoardSkeleton() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {["Alta", "Media", "Baja"].map((label) => (
        <div key={label} className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="h-5 w-2 rounded-full bg-surface-elevated animate-pulse" />
            <span className="text-sm font-semibold text-text-secondary">{label}</span>
          </div>
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-[88px] bg-surface-elevated rounded-xl animate-pulse p-4">
              <div className="h-3 w-3/4 bg-white/5 rounded animate-pulse mb-2" />
              <div className="h-2 w-1/3 bg-white/5 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

function App() {
  const { resetDatabase } = useDatabase();
  const {
    tasks,
    completionLog,
    fetchTasks,
    addTask,
    toggleTask,
    updatePriority,
    deleteTask,
    reorderTasks,
  } = useTaskStore();
  const {
    habits,
    fetchHabits,
    addHabit,
    toggleHabit,
    deleteHabit,
    getTodayStatus,
    getStreak,
  } = useHabitStore();

  useEffect(() => {
    import("@/db/database").then(({ purgeOldCompletionLogs }) => {
      purgeOldCompletionLogs(7);
    });
    fetchTasks();
    fetchHabits();
  }, [fetchTasks, fetchHabits]);

  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    import("@/utils/analytics/insightsEngine").then((m) => {
      setInsights(m.generateInsights(tasks, habits));
    });
  }, [tasks, habits]);

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
    const { seedDatabase } = await import("@/utils/seedData");
    await seedDatabase();
    window.location.reload();
  }, [resetDatabase]);

  const now = new Date();
  const today = `${DAY_NAMES[now.getDay()]}, ${now.getDate()} de ${MONTH_NAMES[now.getMonth()]}`;
  const todayKey = `${now.getFullYear()}-${now.getMonth()}-${now.getDate()}`;

  const totalTasks = tasks.length;
  const completedTasks = useMemo(() => tasks.filter((t) => t.completed), [tasks]);
  const completedCount = completedTasks.length;
  const rate = totalTasks > 0 ? Math.round((completedCount / totalTasks) * 100) : 0;
  const completedToday = useMemo(
    () =>
      completedTasks.filter((t) => {
        if (!t.completedAt) return false;
        const d = new Date(t.completedAt);
        return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}` === todayKey;
      }).length,
    [completedTasks, todayKey],
  );
  const bestStreak = useMemo(
    () => (habits.length > 0 ? Math.max(...habits.map((h) => getStreak(h.id)), 0) : 0),
    [habits, getStreak],
  );

  return (
    <div className="min-h-screen px-4 sm:px-6 lg:px-8 py-6 sm:py-8 lg:py-12">
      <div className="max-w-[1600px] mx-auto">
        {/* Header */}
        <header className="mb-10 pt-8 animate-slide-in">
          <div className="relative overflow-hidden rounded-[20px] bg-surface/70 backdrop-blur-xl border border-accent/10 shadow-lg">
            <div className="absolute inset-0 bg-gradient-to-br from-accent/[0.04] to-transparent pointer-events-none" />
            <div className="relative p-7 sm:p-8">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
                <div className="space-y-2">
                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-text-primary">
                    Dashboard de Productividad
                  </h1>
                  <p className="text-base text-text-secondary capitalize">
                    {today}
                  </p>
                </div>
                <Button
                  onClick={handleResetDemoData}
                  variant="default"
                  size="lg"
                  className="self-start font-semibold hover:-translate-y-0.5 transition-transform"
                >
                  Cargar datos demo
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Metrics */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-slide-in"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="surface-card p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-accent-soft flex items-center justify-center shrink-0">
                <ClipboardList className="w-5 h-5 text-accent" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-text-primary font-display leading-none mb-1">
                  {totalTasks}
                </p>
                <p className="text-xs text-text-secondary font-medium truncate">
                  Tareas totales
                </p>
              </div>
            </div>
          </div>
          <div className="surface-card p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-success/10 flex items-center justify-center shrink-0">
                <CheckCircle2 className="w-5 h-5 text-success" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-text-primary font-display leading-none mb-1">
                  {completedToday}
                </p>
                <p className="text-xs text-text-secondary font-medium truncate">
                  Completadas hoy
                </p>
              </div>
            </div>
          </div>
          <div className="surface-card p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-warning/10 flex items-center justify-center shrink-0">
                <TrendingUp className="w-5 h-5 text-warning" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-text-primary font-display leading-none mb-1">
                  {rate}%
                </p>
                <p className="text-xs text-text-secondary font-medium truncate">
                  Completadas
                </p>
              </div>
            </div>
          </div>
          <div className="surface-card p-4 rounded-2xl">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-priority-medium/10 flex items-center justify-center shrink-0">
                <Flame className="w-5 h-5 text-priority-medium" aria-hidden="true" />
              </div>
              <div className="min-w-0">
                <p className="text-2xl font-bold text-text-primary font-display leading-none mb-1">
                  {bestStreak}
                </p>
                <p className="text-xs text-text-secondary font-medium truncate">
                  Mejor racha
                </p>
              </div>
            </div>
          </div>
        </div>

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
                <h2 className="sr-only">Tareas</h2>
                <Suspense fallback={<TaskBoardSkeleton />}>
                  <TaskBoard
                    tasks={tasks}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onPriorityChange={handlePriorityChange}
                    onAddTask={handleAddTask}
                    onReorder={handleReorder}
                  />
                </Suspense>
              </div>
            </div>

            {/* Habits Panel */}
            <div className="xl:col-span-1">
              <div className="surface-card p-5 shadow-xl">
                <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="loading-spinner" /></div>}>
                  <HabitTracker
                    habits={habits}
                    getTodayStatus={getTodayStatus}
                    getStreak={getStreak}
                    onToggle={handleToggleHabit}
                    onDeleteHabit={handleDeleteHabit}
                    onAddHabit={handleAddHabit}
                  />
                </Suspense>
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
              <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="loading-spinner" /></div>}>
                <InsightsPanel insights={insights} />
              </Suspense>
            </div>

            {/* Productivity Chart */}
            <div className="surface-card p-5 shadow-xl">
              <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="loading-spinner" /></div>}>
                <ProductivityChart completionLog={completionLog} />
              </Suspense>
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
