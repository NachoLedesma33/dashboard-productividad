import type { Task, Priority } from "@/types";
import { X } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

const priorityConfig: Record<
  Priority,
  { dot: string; bg: string; text: string; label: string }
> = {
  high: {
    dot: "bg-priority-high",
    bg: "bg-priority-high/10",
    text: "text-priority-high",
    label: "Alta",
  },
  medium: {
    dot: "bg-priority-medium",
    bg: "bg-priority-medium/10",
    text: "text-priority-medium",
    label: "Media",
  },
  low: {
    dot: "bg-priority-low",
    bg: "bg-priority-low/10",
    text: "text-priority-low",
    label: "Baja",
  },
};

export function TaskCard({ task, onToggle, onDelete }: TaskCardProps) {
  const cfg = priorityConfig[task.priority];

  return (
    <div className="group relative flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-elevated/40 hover:bg-surface-elevated/80 hover:shadow-md hover:-translate-y-0.5 backdrop-blur-sm transition-all duration-200 cursor-grab active:cursor-grabbing">
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

      <button
        data-no-dnd
        onClick={(e) => {
          e.stopPropagation();
          onToggle(task.id);
        }}
        className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
          task.completed
            ? "bg-accent border-accent"
            : "border-text-muted hover:border-accent"
        }`}
        aria-label="Completar tarea"
      >
        {task.completed && (
          <svg
            className="w-3 h-3 text-white"
            fill="none"
            viewBox="0 0 12 12"
            stroke="currentColor"
            strokeWidth={2.5}
          >
            <path
              className="animate-draw-check"
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M2 6l3 3 5-5"
              strokeDasharray="12"
              strokeDashoffset="0"
            />
          </svg>
        )}
      </button>

      <span
        className={`flex-1 text-sm font-medium leading-snug min-w-0 transition-all duration-200 ${
          task.completed
            ? "line-through text-text-muted"
            : "text-text-primary"
        }`}
      >
        {task.title}
      </span>

      <div className="relative shrink-0">
        <span
          data-no-dnd
          className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all duration-200 ${cfg.bg} ${cfg.text}`}
        >
          {cfg.label}
        </span>
      </div>

      <button
        data-no-dnd
        onClick={(e) => {
          e.stopPropagation();
          onDelete(task.id);
        }}
        className="w-6 h-6 shrink-0 flex items-center justify-center text-text-muted hover:text-priority-high hover:bg-priority-high/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-50 hover:!opacity-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Eliminar tarea"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
