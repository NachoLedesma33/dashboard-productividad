import { useState } from 'react';
import type { Task, Priority } from '@/types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}

const priorityConfig: Record<Priority, { dot: string; bg: string; text: string; label: string }> = {
  high: {
    dot: 'bg-red-500',
    bg: 'bg-red-50 dark:bg-red-950/60',
    text: 'text-red-600 dark:text-red-400',
    label: 'Alta',
  },
  medium: {
    dot: 'bg-amber-400',
    bg: 'bg-amber-50 dark:bg-amber-950/60',
    text: 'text-amber-600 dark:text-amber-400',
    label: 'Media',
  },
  low: {
    dot: 'bg-slate-400',
    bg: 'bg-slate-50 dark:bg-slate-800/60',
    text: 'text-slate-500 dark:text-slate-400',
    label: 'Baja',
  },
};

export function TaskCard({ task, onToggle, onDelete, onPriorityChange }: TaskCardProps) {
  const [showSelect, setShowSelect] = useState(false);
  const cfg = priorityConfig[task.priority];

  return (
    <div className="group relative flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 cursor-grab active:cursor-grabbing">

      {/* Priority dot */}
      <span className={`w-2 h-2 rounded-full shrink-0 ${cfg.dot}`} />

      {/* Custom checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onToggle(task.id); }}
        className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
          task.completed
            ? 'bg-violet-500 border-violet-500'
            : 'border-slate-300 dark:border-slate-600 hover:border-violet-400'
        }`}
        aria-label="Completar tarea"
      >
        {task.completed && (
          <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
          </svg>
        )}
      </button>

      {/* Title */}
      <span
        className={`flex-1 text-sm font-medium leading-snug min-w-0 transition-all duration-200 ${
          task.completed
            ? 'line-through text-slate-400 dark:text-slate-500'
            : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {task.title}
      </span>

      {/* Priority badge (compact) */}
      <div className="relative shrink-0">
        <button
          onClick={(e) => { e.stopPropagation(); setShowSelect(!showSelect); }}
          className={`px-2 py-0.5 text-xs font-semibold rounded-md transition-all duration-200 ${cfg.bg} ${cfg.text}`}
        >
          {cfg.label}
        </button>

        {showSelect && (
          <div className="absolute right-0 top-full mt-1 glass rounded-xl shadow-xl z-20 overflow-hidden min-w-[88px] animate-fade-in">
            {(['high', 'medium', 'low'] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => { onPriorityChange(task.id, p); setShowSelect(false); }}
                className={`flex items-center gap-2 w-full px-3 py-2 text-left text-xs font-medium hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors ${priorityConfig[p].text}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${priorityConfig[p].dot}`} />
                {priorityConfig[p].label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Delete button — visible on hover */}
      <button
        onClick={(e) => { e.stopPropagation(); onDelete(task.id); }}
        className="w-6 h-6 shrink-0 flex items-center justify-center text-slate-300 dark:text-slate-600 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 text-xs"
        aria-label="Eliminar tarea"
      >
        ✕
      </button>
    </div>
  );
}