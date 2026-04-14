import { useState } from 'react';
import type { Task, Priority } from '@/types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}

const priorityStyles: Record<Priority, { bg: string; text: string; label: string }> = {
  high: { bg: 'bg-red-50 dark:bg-red-950', text: 'text-red-600 dark:text-red-400', label: 'Alta' },
  medium: { bg: 'bg-amber-50 dark:bg-amber-950', text: 'text-amber-600 dark:text-amber-400', label: 'Media' },
  low: { bg: 'bg-slate-50 dark:bg-slate-800', text: 'text-slate-600 dark:text-slate-400', label: 'Baja' },
};

export function TaskCard({ task, onToggle, onDelete, onPriorityChange }: TaskCardProps) {
  const [showSelect, setShowSelect] = useState(false);
  const priority = priorityStyles[task.priority];

  return (
    <div className="flex items-center gap-6 p-7 glass task-card rounded-2xl border-0 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 cursor-move">
      {/* Checkbox */}
      <div className="relative">
        <input
          type="checkbox"
          checked={task.completed}
          onChange={() => onToggle(task.id)}
          className="w-6 h-6 rounded-lg border-2 border-violet-300 text-violet-600 focus:ring-2 focus:ring-violet-500 focus:ring-offset-2 cursor-pointer transition-all duration-300 hover:border-violet-500"
        />
        {task.completed && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <svg className="w-4 h-4 text-violet-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
            </svg>
          </div>
        )}
      </div>

      {/* Title */}
      <span
        className={`flex-1 font-medium transition-all duration-300 ${
          task.completed
            ? 'line-through text-slate-400 dark:text-slate-500'
            : 'text-slate-700 dark:text-slate-200'
        }`}
      >
        {task.title}
      </span>

      {/* Priority Badge */}
      <div className="relative">
        <button
          onClick={() => setShowSelect(!showSelect)}
          className={`px-6 py-3 text-sm font-semibold rounded-xl cursor-pointer transition-all duration-300 hover:scale-105 shadow-sm hover:shadow-md ${priority.bg} ${priority.text}`}
        >
          {priority.label}
        </button>

        {showSelect && (
          <div className="absolute right-0 mt-3 glass rounded-xl shadow-2xl z-10 overflow-hidden border-0 animate-slide-in">
            {(['low', 'medium', 'high'] as Priority[]).map((p) => {
              const ps = priorityStyles[p];
              return (
                <button
                  key={p}
                  onClick={() => {
                    onPriorityChange(task.id, p);
                    setShowSelect(false);
                  }}
                  className={`block w-full px-6 py-3 text-left text-sm hover:bg-violet-50 dark:hover:bg-violet-900/30 transition-colors ${ps.text} font-medium`}
                >
                  {ps.label}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Button */}
      <button
        onClick={() => onDelete(task.id)}
        className="w-10 h-10 flex items-center justify-center text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all duration-300 text-lg font-medium"
        aria-label="Eliminar tarea"
      >
        ✕
      </button>
    </div>
  );
}