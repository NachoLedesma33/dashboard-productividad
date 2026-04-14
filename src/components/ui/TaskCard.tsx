import { useState } from 'react';
import type { Task, Priority } from '@/types';

interface TaskCardProps {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}

const priorityColors: Record<Priority, string> = {
  high: 'bg-red-500 text-white',
  medium: 'bg-yellow-500 text-white',
  low: 'bg-gray-400 text-white',
};

const priorityLabels: Record<Priority, string> = {
  high: 'Alta',
  medium: 'Media',
  low: 'Baja',
};

export function TaskCard({ task, onToggle, onDelete, onPriorityChange }: TaskCardProps) {
  const [showSelect, setShowSelect] = useState(false);

  const handlePriorityChange = (priority: Priority) => {
    onPriorityChange(task.id, priority);
    setShowSelect(false);
  };

  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <input
        type="checkbox"
        checked={task.completed}
        onChange={() => onToggle(task.id)}
        className="w-5 h-5 rounded border-gray-300 text-purple-600 focus:ring-purple-500"
      />

      <span
        className={`flex-1 ${
          task.completed ? 'line-through text-gray-400' : 'text-gray-800'
        }`}
      >
        {task.title}
      </span>

      <div className="relative">
        <button
          onClick={() => setShowSelect(!showSelect)}
          className={`px-2 py-1 text-xs rounded-full cursor-pointer ${priorityColors[task.priority]}`}
        >
          {priorityLabels[task.priority]}
        </button>

        {showSelect && (
          <div className="absolute right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-lg z-10">
            {(['low', 'medium', 'high'] as Priority[]).map((p) => (
              <button
                key={p}
                onClick={() => handlePriorityChange(p)}
                className="block w-full px-3 py-2 text-left text-sm hover:bg-gray-100 first:rounded-t-lg last:rounded-b-lg"
              >
                {priorityLabels[p]}
              </button>
            ))}
          </div>
        )}
      </div>

      <button
        onClick={() => onDelete(task.id)}
        className="w-6 h-6 flex items-center justify-center text-gray-400 hover:text-red-500 transition-colors"
        aria-label="Eliminar tarea"
      >
        ✕
      </button>
    </div>
  );
}