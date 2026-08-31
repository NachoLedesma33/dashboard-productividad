import { useState, useRef, useEffect } from "react";
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Circle, Eye, EyeOff, Repeat, Bell } from "lucide-react";

const DAY_LABELS = ["D", "L", "M", "M", "J", "V", "S"];
const DAY_ABBR = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];

interface TaskBoardProps {
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTask: (id: string, title: string, priority: Priority, recurringDays?: number[], reminderAt?: Date | null, reminderMessage?: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onAddTask: (title: string, priority: Priority, recurringDays?: number[], reminderAt?: Date | null, reminderMessage?: string) => void;
  onReorder: (tasks: Task[]) => void;
}

function SortableTaskCard({
  task,
  onToggle,
  onDelete,
  onEdit,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
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
      <TaskCard task={task} onToggle={onToggle} onDelete={onDelete} onEdit={onEdit} />
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
  { title: string; accent: string; clayBg: string; emptyIcon: string }
> = {
  high: {
    title: "Alta prioridad",
    accent: "border-t-priority-high",
    clayBg: "clay-high",
    emptyIcon: "red",
  },
  medium: {
    title: "Media prioridad",
    accent: "border-t-priority-medium",
    clayBg: "clay-medium",
    emptyIcon: "amber",
  },
  low: {
    title: "Baja prioridad",
    accent: "border-t-priority-low",
    clayBg: "clay-low",
    emptyIcon: "slate",
  },
};

function DayPicker({
  selected,
  onChange,
}: {
  selected: number[];
  onChange: (days: number[]) => void;
}) {
  const toggle = (day: number) => {
    if (selected.includes(day)) {
      onChange(selected.filter((d) => d !== day));
    } else {
      onChange([...selected, day]);
    }
  };

  return (
    <div className="flex gap-1">
      {DAY_LABELS.map((label, i) => (
        <button
          key={i}
          type="button"
          onClick={() => toggle(i)}
          aria-label={DAY_ABBR[i]}
          className={`w-7 h-7 text-xs font-semibold rounded-full transition-colors ${
            selected.includes(i)
              ? "bg-accent text-white"
              : "bg-surface-elevated text-text-secondary hover:bg-accent/20"
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function AddTaskInput({
  priority,
  onAdd,
  onClose,
}: {
  priority: Priority;
  onAdd: (title: string, priority: Priority, recurringDays?: number[], reminderAt?: Date | null, reminderMessage?: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState("");
  const [showRecurring, setShowRecurring] = useState(false);
  const [recurringDays, setRecurringDays] = useState<number[]>([]);
  const [showReminder, setShowReminder] = useState(false);
  const [reminderAt, setReminderAt] = useState("");
  const [reminderMessage, setReminderMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const handleAdd = () => {
    if (title.trim()) {
      const reminderDate = reminderAt ? new Date(reminderAt) : undefined;
      onAdd(
        title.trim(),
        priority,
        recurringDays.length > 0 ? recurringDays : undefined,
        reminderDate ?? null,
        reminderMessage || undefined
      );
      setTitle("");
      setRecurringDays([]);
      setShowRecurring(false);
      setShowReminder(false);
      setReminderAt("");
      setReminderMessage("");
      onClose();
    }
  };

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div ref={wrapperRef} className="px-4 pt-3 pb-2 animate-fade-in space-y-2">
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          placeholder="Nueva tarea..."
          aria-label="Nueva tarea"
        />
        <Button onClick={handleAdd} variant="ghost" size="sm" aria-label="Confirmar tarea">
          ✓
        </Button>
      </div>
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowRecurring(!showRecurring)}
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
            showRecurring || recurringDays.length > 0
              ? "text-accent"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
          Repetir
          {recurringDays.length > 0 && (
            <span className="text-text-secondary">
              ({recurringDays.map((d) => DAY_LABELS[d]).join(" ")})
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={() => setShowReminder(!showReminder)}
          className={`flex items-center gap-1 text-xs font-medium transition-colors ${
            showReminder || reminderAt
              ? "text-accent"
              : "text-text-muted hover:text-text-secondary"
          }`}
        >
          <Bell className="w-3.5 h-3.5" aria-hidden="true" />
          Recordar
        </button>
      </div>
      {showRecurring && (
        <DayPicker selected={recurringDays} onChange={setRecurringDays} />
      )}
      {showReminder && (
        <div className="space-y-2 animate-fade-in">
          <input
            type="datetime-local"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            className="block w-full px-3 py-2 text-sm rounded-xl bg-surface-elevated border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Fecha y hora del recordatorio"
          />
          <Input
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="Mensaje del recordatorio (opcional)"
            aria-label="Mensaje del recordatorio"
          />
        </div>
      )}
    </div>
  );
}

const priorityOptions: { value: Priority; label: string; color: string }[] = [
  { value: "high", label: "Alta", color: "bg-priority-high" },
  { value: "medium", label: "Media", color: "bg-priority-medium" },
  { value: "low", label: "Baja", color: "bg-priority-low" },
];

function EditTaskDialog({
  task,
  onSave,
  onClose,
}: {
  task: Task;
  onSave: (title: string, priority: Priority, recurringDays?: number[], reminderAt?: Date | null, reminderMessage?: string) => void;
  onClose: () => void;
}) {
  const [title, setTitle] = useState(task.title);
  const [priority, setPriority] = useState<Priority>(task.priority);
  const [recurringDays, setRecurringDays] = useState<number[]>(task.recurringDays ?? []);
  const [reminderAt, setReminderAt] = useState(() => {
    if (task.reminderAt) {
      const d = new Date(task.reminderAt);
      const pad = (n: number) => String(n).padStart(2, "0");
      return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
    }
    return "";
  });
  const [reminderMessage, setReminderMessage] = useState(task.reminderMessage ?? "");

  const handleSave = () => {
    if (title.trim()) {
      const reminderDate = reminderAt ? new Date(reminderAt) : null;
      onSave(
        title.trim(),
        priority,
        recurringDays.length > 0 ? recurringDays : undefined,
        reminderDate,
        reminderMessage || undefined
      );
      onClose();
    }
  };

  return (
    <DialogContent className="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>Editar tarea</DialogTitle>
      </DialogHeader>
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">Título</label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSave()}
            placeholder="Título de la tarea..."
            aria-label="Título de la tarea"
            autoFocus
          />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-semibold text-text-secondary">Prioridad</label>
          <div className="flex gap-2">
            {priorityOptions.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setPriority(opt.value)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl text-xs font-semibold transition-all duration-200 ${
                  priority === opt.value
                    ? "bg-accent text-white"
                    : "bg-surface-elevated text-text-secondary hover:bg-accent/20"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${opt.color}`} aria-hidden="true" />
                {opt.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => setRecurringDays([])}
            className="flex items-center gap-1.5 text-xs font-medium transition-colors text-text-secondary hover:text-text-primary"
          >
            <Repeat className="w-3.5 h-3.5" aria-hidden="true" />
            Repetir
            {recurringDays.length > 0 && (
              <span className="text-text-secondary">
                ({recurringDays.map((d) => DAY_LABELS[d]).join(" ")})
              </span>
            )}
            {recurringDays.length > 0 && <span className="text-text-muted">· tocar para limpiar</span>}
          </button>
          <DayPicker selected={recurringDays} onChange={setRecurringDays} />
        </div>
        <div className="h-px bg-border" />
        <div className="space-y-2">
          <label className="flex items-center gap-1.5 text-xs font-semibold text-text-secondary">
            <Bell className="w-3.5 h-3.5" aria-hidden="true" />
            Recordatorio
          </label>
          <input
            type="datetime-local"
            value={reminderAt}
            onChange={(e) => setReminderAt(e.target.value)}
            className="block w-full px-3 py-2 text-sm rounded-xl bg-surface-elevated border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
            aria-label="Fecha y hora del recordatorio"
          />
          <Input
            value={reminderMessage}
            onChange={(e) => setReminderMessage(e.target.value)}
            placeholder="Mensaje del recordatorio (opcional)"
            aria-label="Mensaje del recordatorio"
          />
        </div>
      </div>
      <DialogFooter>
        <DialogClose asChild>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button onClick={handleSave} variant="ghost">Guardar</Button>
      </DialogFooter>
    </DialogContent>
  );
}

function Column({
  title,
  priority,
  tasks,
  onToggle,
  onDelete,
  onEditTask,
  onAddTask,
}: {
  title: string;
  priority: Priority;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEditTask: (id: string) => void;
  onAddTask: (title: string, priority: Priority, recurringDays?: number[], reminderAt?: Date | null, reminderMessage?: string) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const cfg = columnConfig[priority];
  const { setNodeRef: setDroppableNodeRef } = useDroppable({ id: priority });

  return (
    <div
      className={`flex-1 min-w-0 flex flex-col surface-card border-t-4 ${cfg.accent} hover:shadow-clay-elevated transition-all duration-300 overflow-hidden snap-start min-w-[85vw] md:min-w-0`}
    >
      <div className="px-4 py-3 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-bold text-text-primary tracking-tight">
              {title}
            </h3>
            <span className="text-xs font-semibold text-text-muted bg-surface-elevated rounded-full px-2 py-0.5">
              {tasks.length}
            </span>
          </div>
          <Button
            onClick={() => setShowInput(!showInput)}
            variant="ghost"
            size="iconSm"
            aria-label="Agregar tarea"
          >
            +
          </Button>
        </div>
      </div>

      {showInput && (
        <AddTaskInput priority={priority} onAdd={onAddTask} onClose={() => setShowInput(false)} />
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
                onEdit={onEditTask}
              />
            ))}
            {tasks.length === 0 && (
              <div className="flex flex-col items-center justify-center py-10 text-text-muted">
                <Circle className={`w-6 h-6 mb-2 ${emptyIconColor[cfg.emptyIcon]}`} fill="currentColor" aria-hidden="true" />
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
  onEditTask,
  onPriorityChange,
  onAddTask,
  onReorder,
}: TaskBoardProps) {
  const [activeId, setActiveId] = useState<string | null>(null);
  const [hideCompleted, setHideCompleted] = useState(false);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
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
          className="flex items-center gap-1.5 text-xs font-medium text-text-secondary hover:text-text-primary transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded-lg px-2 py-1 -mx-2"
          aria-label={hideCompleted ? "Mostrar completadas" : "Ocultar completadas"}
        >
          {hideCompleted ? <EyeOff className="w-3.5 h-3.5" aria-hidden="true" /> : <Eye className="w-3.5 h-3.5" aria-hidden="true" />}
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
        <div className="flex md:grid md:grid-cols-[2fr_2fr_2fr] gap-4 overflow-x-auto snap-x snap-mandatory md:overflow-visible md:snap-none scroll-smooth">
          <Column
            title={columnConfig.high.title}
            priority="high"
            tasks={highTasks}
            onToggle={onToggle}
            onDelete={onDelete}
            onEditTask={setEditingTaskId}
            onAddTask={onAddTask}
          />
          <Column
            title={columnConfig.medium.title}
            priority="medium"
            tasks={mediumTasks}
            onToggle={onToggle}
            onDelete={onDelete}
            onEditTask={setEditingTaskId}
            onAddTask={onAddTask}
          />
          <Column
            title={columnConfig.low.title}
            priority="low"
            tasks={lowTasks}
            onToggle={onToggle}
            onDelete={onDelete}
            onEditTask={setEditingTaskId}
            onAddTask={onAddTask}
          />
        </div>
      </DndContext>

      {editingTaskId && (() => {
        const editingTask = tasks.find((t) => t.id === editingTaskId);
        if (!editingTask) return null;
        return (
          <Dialog open onOpenChange={(open) => !open && setEditingTaskId(null)}>
            <EditTaskDialog
              task={editingTask}
              onSave={(title, priority, recurringDays, reminderAt, reminderMessage) =>
                onEditTask(editingTask.id, title, priority, recurringDays, reminderAt, reminderMessage)
              }
              onClose={() => setEditingTaskId(null)}
            />
          </Dialog>
        );
      })()}

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
            <div className="shadow-2xl shadow-accent/10 rotate-3 scale-[1.02] opacity-95 ring-1 ring-accent/20 rounded-xl">
              <TaskCard task={activeTask} onToggle={() => {}} onDelete={() => {}} />
            </div>
          </div>,
          document.body,
        )}
    </>
  );
}
