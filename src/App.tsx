import { useEffect, useCallback, useMemo, useState, lazy, Suspense } from "react";
import { useTaskStore } from "@/store/taskStore";
import { useHabitStore } from "@/store/habitStore";
import { useDatabase } from "@/hooks/useDatabase";
import type { Insight } from "@/utils/analytics/insightsEngine";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/Toaster";
import { toast } from "@/lib/toast";
import { PlanDelDia } from "@/components/ui/PlanDelDia";
import { Sparkles, FileText, Sun, Moon } from "lucide-react";

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

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const stored = localStorage.getItem('theme');
    return stored === 'light' ? 'light' : 'dark';
  });

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#0d0a08' : '#f5f0e8');
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme(prev => prev === 'dark' ? 'light' : 'dark');
  }, []);
  const {
    tasks,
    completionLog,
    fetchTasks,
    addTask,
    toggleTask,
    updateTask,
    updatePriority,
    deleteTask,
    reorderTasks,
  } = useTaskStore();
  const {
    habits,
    fetchHabits,
    addHabit,
    updateHabit,
    toggleHabit,
    deleteHabit,
    getTodayStatus,
    getStreak,
  } = useHabitStore();

  const [planOpen, setPlanOpen] = useState(false);

  useEffect(() => {
    import("@/db/database").then(({ purgeOldCompletionLogs }) => {
      purgeOldCompletionLogs(7);
    });
    fetchTasks().then(() => {
      const store = useTaskStore.getState();
      const all = store.tasks.length;
      const done = store.tasks.filter(t => t.completed).length;
      import("@/utils/ai/dailyKickoff").then(({ shouldShowKickoff, getKickoffMessage }) => {
        if (shouldShowKickoff()) {
          toast(getKickoffMessage(all, done, 10), "info");
        }
      });
    });
    fetchHabits();
  }, [fetchTasks, fetchHabits]);

  const [insights, setInsights] = useState<Insight[]>([]);

  useEffect(() => {
    import("@/utils/analytics/insightsEngine").then((m) => {
      setInsights(m.generateInsights(tasks, habits, completionLog));
    });
  }, [tasks, habits, completionLog]);

  const handleAddTask = useCallback(
    async (title: string, priority: Priority, recurringDays?: number[]) => {
      await addTask(title, priority, recurringDays);
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

  const handleEditTask = useCallback(
    async (id: string, title: string, priority: Priority, recurringDays?: number[]) => {
      await updateTask(id, { title, priority, recurringDays });
      toast("Tarea actualizada", "success");
    },
    [updateTask],
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

  const handleEditHabit = useCallback(
    async (id: string, name: string) => {
      await updateHabit(id, name);
      toast("Hábito actualizado", "success");
    },
    [updateHabit],
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

  const handleWeeklyReport = useCallback(async () => {
    const { generateReport } = await import("@/utils/ai/weeklyReport");
    const report = generateReport(habits, completionLog);
    const blob = new Blob([report], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `reporte-semanal-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Reporte semanal descargado", "success");
  }, [habits, completionLog]);

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
          <div className="surface-card p-7 sm:p-8">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
              <div className="space-y-2">
                <div className="flex items-center gap-3">
                  <span className="text-2xl sm:text-3xl lg:text-4xl font-bold font-display text-engraved tracking-tight">
                    En Ritmo
                  </span>
                  <span className="hidden sm:inline-block w-px h-6 bg-border/50" aria-hidden="true"></span>
                  <span className="text-sm font-medium text-text-secondary uppercase tracking-wide opacity-70">
                    Dashboard de Productividad
                  </span>
                </div>
                <p className="text-base text-text-secondary capitalize">
                  {today}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  onClick={() => setPlanOpen(true)}
                  variant="default"
                  size="lg"
                  className="self-start font-semibold"
                >
                  <Sparkles className="w-4 h-4 mr-1.5 icon-clay" aria-hidden="true" />
                  Plan del día
                </Button>
                <Button
                  onClick={handleWeeklyReport}
                  variant="outline"
                  size="lg"
                  className="self-start font-semibold"
                >
                  <FileText className="w-4 h-4 mr-1.5 icon-clay" aria-hidden="true" />
                  Reporte semanal
                </Button>
                <Button
                  onClick={handleResetDemoData}
                  variant="ghost"
                  size="lg"
                  className="self-start font-semibold"
                >
                  Cargar datos demo
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Metrics — piedras ovaladas */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10 animate-slide-in"
          style={{ animationDelay: "0.05s" }}
        >
          <div className="flex flex-col items-center py-6 px-4 surface-card clip-pebble">
            <p className="text-3xl font-bold font-display text-engraved leading-none mb-1">
              {totalTasks}
            </p>
            <p className="text-xs text-text-secondary font-medium text-center">
              Tareas totales hoy
            </p>
          </div>
          <div className="flex flex-col items-center py-6 px-4 surface-card clip-pebble">
            <p className="text-3xl font-bold font-display text-engraved leading-none mb-1">
              {completedToday}
            </p>
            <p className="text-xs text-text-secondary font-medium text-center">
              Completadas hoy
            </p>
          </div>
          <div className="flex flex-col items-center py-6 px-4 surface-card clip-pebble">
            <p className="text-3xl font-bold font-display text-engraved leading-none mb-1">
              {rate}%
            </p>
            <p className="text-xs text-text-secondary font-medium text-center">
              Completadas
            </p>
          </div>
          <div className="flex flex-col items-center py-6 px-4 surface-card clip-pebble">
            <p className="text-3xl font-bold font-display text-engraved leading-none mb-1">
              {bestStreak}
            </p>
            <p className="text-xs text-text-secondary font-medium text-center">
              Mejor racha
            </p>
          </div>
        </div>

        {/* Plan del día dialog */}
        <PlanDelDia
          open={planOpen}
          onOpenChange={setPlanOpen}
          tasks={tasks}
          completionLog={completionLog}
        />

        {/* Main Content */}
        <main className="space-y-12">
          {/* Top Row: Tasks and Habits */}
          <div
            className="grid grid-cols-1 xl:grid-cols-[10fr_1fr] gap-8 animate-slide-in"
            style={{ animationDelay: "0.1s" }}
          >
            {/* Task Board */}
            <div>
              <div className="surface-card p-5 clip-pebble">
                <h2 className="sr-only">Tareas</h2>
                <Suspense fallback={<TaskBoardSkeleton />}>
                  <TaskBoard
                    tasks={tasks}
                    onToggle={handleToggleTask}
                    onDelete={handleDeleteTask}
                    onEditTask={handleEditTask}
                    onPriorityChange={handlePriorityChange}
                    onAddTask={handleAddTask}
                    onReorder={handleReorder}
                  />
                </Suspense>
              </div>
            </div>

            {/* Habits Panel */}
            <div>
              <div className="surface-card p-5">
                <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="loading-spinner" /></div>}>
                  <HabitTracker
                    habits={habits}
                    getTodayStatus={getTodayStatus}
                    getStreak={getStreak}
                    onToggle={handleToggleHabit}
                    onDeleteHabit={handleDeleteHabit}
                    onAddHabit={handleAddHabit}
                    onEditHabit={handleEditHabit}
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
            <div className="surface-card p-5">
              <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="loading-spinner" /></div>}>
                <InsightsPanel insights={insights} habits={habits} completionLog={completionLog} />
              </Suspense>
            </div>

            {/* Productivity Chart */}
            <div className="surface-card p-5">
              <Suspense fallback={<div className="flex items-center justify-center min-h-[200px]"><div className="loading-spinner" /></div>}>
                <ProductivityChart completionLog={completionLog} totalTasks={totalTasks} />
              </Suspense>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer
          className="mt-16 pt-8 animate-slide-in"
          style={{ animationDelay: "0.3s" }}
        >
          <div className="surface-card p-6 text-center clip-pebble">
            <p className="text-sm text-text-muted">
              En Ritmo © {new Date().getFullYear()}
            </p>
          </div>
        </footer>
      </div>

      <Toaster />

      {/* Floating theme toggle */}
      <button
        onClick={toggleTheme}
        className="fixed bottom-6 left-6 z-[9999] w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
        aria-label={theme === 'dark' ? 'Activar tema claro' : 'Activar tema oscuro'}
        style={{
          background: 'var(--clay-btn-bg)',
          color: 'var(--clay-btn-text)',
          boxShadow: '0 1px 2px var(--clay-inset-top) inset, 0 -1px 2px var(--clay-inset-bottom) inset, var(--clay-shadow-ambient)',
          clipPath: 'polygon(4% 0%, 96% 0%, 100% 18%, 100% 82%, 96% 100%, 4% 100%, 0% 82%, 0% 18%)',
        }}
      >
        {theme === 'dark' ? <Sun className="w-4 h-4 icon-clay" aria-hidden="true" /> : <Moon className="w-4 h-4 icon-clay" aria-hidden="true" />}
      </button>
    </div>
  );
}

export default App;
