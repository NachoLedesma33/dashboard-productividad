import { useState } from "react";
import {
  DndContext,
  DragOverlay,
  closestCenter,
  useDroppable,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Priority } from "@/types";
import { TaskCard } from "@/components/ui/TaskCard";

interface TaskBoardProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onAddTask: (title: string, priority: Priority) => void;
}

function SortableTaskCard({
  task,
  onToggle,
  onDelete,
  setDragOffset,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  setDragOffset: (offset: { x: number; y: number } | null) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  // Wrap listeners to prevent starting a drag when interacting with controls
  // that have the `data-no-dnd` attribute (like buttons, checkbox, delete, etc.).
  const filteredListeners = (() => {
    const original = listeners as unknown as Record<string, (e: Event) => void>;

    const onPointerDown = (event: Event) => {
      const target = event?.target as Element | null;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("[data-no-dnd]")
      ) {
        return;
      }
      original.onPointerDown?.(event);
    };

    const onMouseDown = (event: Event) => {
      const target = event?.target as Element | null;
      if (
        target &&
        typeof target.closest === "function" &&
        target.closest("[data-no-dnd]")
      ) {
        return;
      }
      original.onMouseDown?.(event);
    };

    return {
      ...listeners,
      onPointerDown,
      onMouseDown,
    } as typeof listeners;
  })();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...filteredListeners}
      onPointerDown={(e) => {
        try {
          const target = e.target as Element | null;
          if (
            target &&
            typeof target.closest === "function" &&
            target.closest("[data-no-dnd]")
          ) {
            // clicking an internal control — don't set offset nor start drag
            setDragOffset(null);
            // still allow the filtered listener to decide (it will ignore if data-no-dnd)
            filteredListeners?.onPointerDown?.(e as unknown as Event);
            return;
          }
          const el = e.currentTarget as HTMLElement | null;
          if (el) {
            const rect = el.getBoundingClientRect();
            setDragOffset({
              x: e.clientX - rect.left,
              y: e.clientY - rect.top,
            });
          }
        } catch {
          setDragOffset(null);
        }
        // Call the original onPointerDown so dnd-kit can start the drag.
        filteredListeners?.onPointerDown?.(e as unknown as Event);
      }}
    >
      <TaskCard task={task} onToggle={onToggle} onDelete={onDelete} />
    </div>
  );
}

const columnConfig: Record<
  Priority,
  { title: string; accent: string; headerBg: string; emptyIcon: string }
> = {
  high: {
    title: "Alta prioridad",
    accent: "border-t-red-400",
    headerBg: "from-red-50 to-transparent dark:from-red-950/30",
    emptyIcon: "🔴",
  },
  medium: {
    title: "Media prioridad",
    accent: "border-t-amber-400",
    headerBg: "from-amber-50 to-transparent dark:from-amber-950/30",
    emptyIcon: "🟡",
  },
  low: {
    title: "Baja prioridad",
    accent: "border-t-slate-400",
    headerBg: "from-slate-50 to-transparent dark:from-slate-800/30",
    emptyIcon: "⚪",
  },
};

function Column({
  title,
  priority,
  tasks,
  onToggle,
  onDelete,
  onAddTask,
  setDragOffset,
}: {
  title: string;
  priority: Priority;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (title: string, priority: Priority) => void;
  setDragOffset: (offset: { x: number; y: number } | null) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const cfg = columnConfig[priority];
  // Make the column a droppable area so dropping into an empty column works
  const { setNodeRef: setDroppableNodeRef } = useDroppable({ id: priority });

  const handleAdd = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), priority);
      setNewTaskTitle("");
      setShowInput(false);
    }
  };

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-700/60 border-t-4 ${cfg.accent} bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden`}
    >
      {/* Column header */}
      <div className={`px-4 py-3 bg-gradient-to-b ${cfg.headerBg}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
              {title}
            </h3>
            <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </div>
          <button
            onClick={() => setShowInput(!showInput)}
            className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 text-sm font-bold shadow-sm hover:shadow-md"
          >
            +
          </button>
        </div>
      </div>

      {/* Add task input */}
      {showInput && (
        <div className="px-4 pt-3 pb-2 animate-fade-in">
          <div className="flex gap-2">
            <input
              type="text"
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nueva tarea..."
              className="flex-1 px-3 py-2 text-sm border border-violet-200 dark:border-violet-700 rounded-lg bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
              autoFocus
            />
            <button
              onClick={handleAdd}
              className="px-3 py-2 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg text-sm font-medium hover:from-violet-600 hover:to-pink-600 shadow-sm transition-all duration-200"
            >
              ✓
            </button>
          </div>
        </div>
      )}

      {/* Task list */}
      <div className="flex-1 p-3" ref={setDroppableNodeRef}>
        <SortableContext
          items={tasks.map((t) => t.id)}
          strategy={verticalListSortingStrategy}
        >
          <div className="flex flex-col gap-1.5">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                setDragOffset={setDragOffset}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
                <span className="text-2xl mb-2">{cfg.emptyIcon}</span>
                <p className="text-xs font-medium">Sin tareas</p>
              </div>
            )}
          </div>
        </SortableContext>
      </div>
    </div>
  );
}

export function TaskBoard({
  tasks,
  onToggle,
  onDelete,
  onPriorityChange,
  onAddTask,
}: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [pointerPos, setPointerPos] = useState<{ x: number; y: number } | null>(
    null,
  );
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number } | null>(
    null,
  );

  const highTasks = tasks.filter((t) => t.priority === "high");
  const mediumTasks = tasks.filter((t) => t.priority === "medium");
  const lowTasks = tasks.filter((t) => t.priority === "low");

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    // stop tracking pointer when drag ends
    setPointerPos(null);
    if (!over) return;
    const taskId = active.id as string;

    // If over.id is one of the column ids (priority), use that priority.
    const overId = over.id as string;
    let newPriority: Priority | null = null;
    if (overId === "high" || overId === "medium" || overId === "low") {
      newPriority = overId as Priority;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      newPriority = overTask.priority;
    }

    const currentPriority = tasks.find((t) => t.id === taskId)?.priority;
    if (!currentPriority || !newPriority) return;
    if (newPriority !== currentPriority) {
      onPriorityChange(taskId, newPriority);
    }
  };

  const handleDragStart = (event: { active: { id: unknown } }) => {
    const id = event.active.id as string;
    setActiveId(id);
    // start tracking pointer to position the overlay under the cursor
    const onPointerMove = (e: PointerEvent) => {
      setPointerPos({ x: e.clientX, y: e.clientY });
    };
    // attach listener
    window.addEventListener("pointermove", onPointerMove);
    // store a one-time cleanup when drag ends: remove listener after drag ends
    const removeListener = () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", removeListener);
    };
    window.addEventListener("pointerup", removeListener);
    // ensure dragOffset remains if set by pointerdown; if none, fallback to center
    if (!dragOffset && activeId == null) {
      // nothing — overlay will use pointer position fallback
    }
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column
          title={columnConfig.high.title}
          priority="high"
          tasks={highTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onAddTask={onAddTask}
          setDragOffset={setDragOffset}
        />
        <Column
          title={columnConfig.medium.title}
          priority="medium"
          tasks={mediumTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onAddTask={onAddTask}
          setDragOffset={setDragOffset}
        />
        <Column
          title={columnConfig.low.title}
          priority="low"
          tasks={lowTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onAddTask={onAddTask}
          setDragOffset={setDragOffset}
        />
      </div>

      <DragOverlay>
        {activeTask && pointerPos ? (
          // Position overlay at the pointer so it doesn't offset below the cursor
          <div
            style={{
              position: "fixed",
              left: pointerPos.x,
              top: pointerPos.y - 8,
              transform: "translate(-50%, 0)",
              zIndex: 9999,
            }}
          >
            <div className="shadow-2xl">
              <TaskCard
                task={activeTask}
                onToggle={() => {}}
                onDelete={() => {}}
              />
            </div>
          </div>
        ) : activeTask ? (
          <div className="shadow-2xl">
            <TaskCard
              task={activeTask}
              onToggle={() => {}}
              onDelete={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}
