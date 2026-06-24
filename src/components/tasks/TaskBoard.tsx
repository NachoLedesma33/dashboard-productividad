import { useState, useRef } from "react";
import { createPortal } from "react-dom";
import {
  DndContext,
  pointerWithin,
  useDroppable,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
  type DragMoveEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Task, Priority } from "@/types";
import { TaskCard } from "@/components/ui/TaskCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Circle, Eye, EyeOff } from "lucide-react";

interface TaskBoardProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onAddTask: (title: string, priority: Priority) => void;
  onReorder: (tasks: Task[]) => void;
}

function SortableTaskCard({
  task,
  onToggle,
  onDelete,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const filteredListeners = (() => {
    const original = listeners as unknown as Record<string, (e: Event) => void>;

    const wrappedOnPointerDown = (event: Event) => {
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

    const wrappedOnMouseDown = (event: Event) => {
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
      onPointerDown: wrappedOnPointerDown,
      onMouseDown: wrappedOnMouseDown,
    } as typeof listeners;
  })();

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    touchAction: "none",
  };

  return (
    <div ref={setNodeRef} style={style} data-sortable {...attributes} {...filteredListeners}>
      <TaskCard task={task} onToggle={onToggle} onDelete={onDelete} />
    </div>
  );
}

const emptyIconColor: Record<string, string> = {
  red: "text-red-400 dark:text-red-500",
  amber: "text-amber-400 dark:text-amber-500",
  slate: "text-slate-300 dark:text-slate-600",
};

const columnConfig: Record<
  Priority,
  { title: string; accent: string; headerBg: string; emptyIcon: string }
> = {
  high: {
    title: "Alta prioridad",
    accent: "border-t-red-400",
    headerBg: "from-red-50 to-transparent dark:from-red-950/30",
    emptyIcon: "red",
  },
  medium: {
    title: "Media prioridad",
    accent: "border-t-amber-400",
    headerBg: "from-amber-50 to-transparent dark:from-amber-950/30",
    emptyIcon: "amber",
  },
  low: {
    title: "Baja prioridad",
    accent: "border-t-slate-400",
    headerBg: "from-slate-50 to-transparent dark:from-slate-800/30",
    emptyIcon: "slate",
  },
};

function Column({
  title,
  priority,
  tasks,
  onToggle,
  onDelete,
  onAddTask,
}: {
  title: string;
  priority: Priority;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (title: string, priority: Priority) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState("");
  const cfg = columnConfig[priority];
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
      className={`flex-1 min-w-0 flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-700/60 border-t-4 ${cfg.accent} bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden snap-start min-w-[85vw] md:min-w-0`}
    >
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
          <Button
            onClick={() => setShowInput(!showInput)}
            variant="gradient"
            size="iconSm"
          >
            +
          </Button>
        </div>
      </div>

      {showInput && (
        <div className="px-4 pt-3 pb-2 animate-fade-in">
          <div className="flex gap-2">
            <Input
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Nueva tarea..."
              autoFocus
            />
            <Button onClick={handleAdd} variant="gradient" size="sm">
              ✓
            </Button>
          </div>
        </div>
      )}

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
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
                <Circle className={`w-6 h-6 mb-2 ${emptyIconColor[cfg.emptyIcon]}`} fill="currentColor" />
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
  onReorder,
}: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const overlayRef = useRef<HTMLDivElement>(null);
  const offsetRef = useRef({ x: 0, y: 0 });
  const initialPointerRef = useRef({ x: 0, y: 0 });

  const visible = hideCompleted ? tasks.filter((t) => !t.completed) : tasks;
  const highTasks = visible.filter((t) => t.priority === "high");
  const mediumTasks = visible.filter((t) => t.priority === "medium");
  const lowTasks = visible.filter((t) => t.priority === "low");

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        distance: 5,
        delay: 200,
        tolerance: 5,
      },
    }),
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
    const e = event.activatorEvent as PointerEvent;
    initialPointerRef.current = { x: e.clientX, y: e.clientY };
    const el = (e.target as Element).closest("[data-sortable]") as HTMLElement | null;
    if (el) {
      const rect = el.getBoundingClientRect();
      offsetRef.current = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }
  };

  const handleDragMove = (event: DragMoveEvent) => {
    if (overlayRef.current) {
      const o = offsetRef.current;
      const init = initialPointerRef.current;
      const cx = init.x + event.delta.x;
      const cy = init.y + event.delta.y;
      overlayRef.current.style.transform = `translate(${cx - o.x}px, ${cy - o.y}px)`;
    }
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;

    const taskId = active.id as string;
    const overId = over.id as string;

    const activeTask = tasks.find((t) => t.id === taskId);
    if (!activeTask) return;

    let targetPriority: Priority;
    if (overId === "high" || overId === "medium" || overId === "low") {
      targetPriority = overId as Priority;
    } else {
      const overTask = tasks.find((t) => t.id === overId);
      if (!overTask) return;
      targetPriority = overTask.priority;
    }

    if (targetPriority !== activeTask.priority) {
      onPriorityChange(taskId, targetPriority);
    } else if (active.id !== over.id && !hideCompleted) {
      const columnTasks = tasks.filter((t) => t.priority === targetPriority);
      const oldIndex = columnTasks.findIndex((t) => t.id === taskId);
      const newIndex = columnTasks.findIndex((t) => t.id === overId);

      if (oldIndex !== -1 && newIndex !== -1) {
        const reordered = arrayMove(columnTasks, oldIndex, newIndex);
        const otherTasks = tasks.filter((t) => t.priority !== targetPriority);
        onReorder([...otherTasks, ...reordered]);
      }
    }
  };

  const handleDragCancel = () => {
    setActiveId(null);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <>
      <div className="flex items-center justify-end mb-2">
        <button
          onClick={() => setHideCompleted(!hideCompleted)}
          className="flex items-center gap-1.5 text-xs font-medium text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
          aria-label={hideCompleted ? "Mostrar completadas" : "Ocultar completadas"}
        >
          {hideCompleted ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          {hideCompleted ? "Mostrar completadas" : "Ocultar completadas"}
        </button>
      </div>

      <DndContext
        sensors={sensors}
        collisionDetection={pointerWithin}
        onDragStart={handleDragStart}
        onDragMove={handleDragMove}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex md:grid md:grid-cols-3 gap-4 overflow-x-auto snap-x snap-mandatory md:overflow-visible md:snap-none scroll-smooth">
          <Column
            title={columnConfig.high.title}
            priority="high"
            tasks={highTasks}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddTask={onAddTask}
          />
          <Column
            title={columnConfig.medium.title}
            priority="medium"
            tasks={mediumTasks}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddTask={onAddTask}
          />
          <Column
            title={columnConfig.low.title}
            priority="low"
            tasks={lowTasks}
            onToggle={onToggle}
            onDelete={onDelete}
            onAddTask={onAddTask}
          />
        </div>
      </DndContext>

      {activeTask &&
        createPortal(
          <div
            ref={overlayRef}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              zIndex: 9999,
              pointerEvents: "none",
              willChange: "transform",
            }}
          >
            <div className="shadow-2xl rotate-2 opacity-95">
              <TaskCard task={activeTask} onToggle={() => {}} onDelete={() => {}} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
