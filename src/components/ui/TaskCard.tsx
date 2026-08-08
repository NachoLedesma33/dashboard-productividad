import { memo, useCallback } from "react";
import type { Task, Priority } from "@/types";
import { Pencil, X } from "lucide-react";

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onEdit?: (id: string) => void;
}

const priorityConfig: Record<
  Priority,
  { dot: string; clayBg: string; text: string; label: string }
> = {
  high: {
    dot: "bg-priority-high",
    clayBg: "clay-high",
    text: "text-[#d49a8a]",
    label: "Alta",
  },
  medium: {
    dot: "bg-priority-medium",
    clayBg: "clay-medium",
    text: "text-[#d4b080]",
    label: "Media",
  },
  low: {
    dot: "bg-priority-low",
    clayBg: "clay-low",
    text: "text-[#8ab88a]",
    label: "Baja",
  },
};

export const TaskCard = memo(function TaskCard({ task, onToggle, onDelete, onEdit }: TaskCardProps) {
  const cfg = priorityConfig[task.priority];

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onToggle(task.id);
    },
    [task.id, onToggle],
  );

  const handleEdit = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onEdit?.(task.id);
    },
    [task.id, onEdit],
  );

  const handleDelete = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onDelete(task.id);
    },
    [task.id, onDelete],
  );

  return (
    <div className={`group relative flex items-center gap-3 px-4 py-3 rounded-xl ${cfg.clayBg} hover:-translate-y-0.5 transition-all duration-200 cursor-grab active:cursor-grabbing`}
      style={{
        boxShadow: '0 1px 2px var(--clay-inset-top) inset, 0 -1px 2px var(--clay-inset-bottom) inset, var(--clay-shadow-ambient)',
      }}
    >

      <button
        data-no-dnd
        onClick={handleToggle}
        className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
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
            aria-hidden="true"
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
          className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all duration-200 ${cfg.clayBg} ${cfg.text}`}
          style={{
            boxShadow: '0 1px 1px var(--clay-inset-top) inset, 0 -1px 1px var(--clay-inset-bottom) inset',
          }}
        >
          {cfg.label}
        </span>
      </div>

      <button
        data-no-dnd
        onClick={handleEdit}
        className="w-6 h-6 shrink-0 flex items-center justify-center text-text-muted hover:text-accent rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-50 hover:!opacity-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Editar tarea"
      >
        <Pencil className="w-3.5 h-3.5 icon-clay" aria-hidden="true" />
      </button>

      <button
        data-no-dnd
        onClick={handleDelete}
        className="w-6 h-6 shrink-0 flex items-center justify-center text-text-muted hover:text-priority-high rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-50 hover:!opacity-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
        aria-label="Eliminar tarea"
      >
        <X className="w-3.5 h-3.5 icon-clay" aria-hidden="true" />
      </button>
    </div>
  );
});
