import { useState } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCenter,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task, Priority } from '@/types';
import { TaskCard } from '@/components/ui/TaskCard';

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
  onPriorityChange,
}: {
  task: Task;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } =
    useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onToggle={onToggle}
        onDelete={onDelete}
        onPriorityChange={onPriorityChange}
      />
    </div>
  );
}

const columnConfig: Record<Priority, { title: string; accent: string; headerBg: string; emptyIcon: string }> = {
  high: {
    title: 'Alta prioridad',
    accent: 'border-t-red-400',
    headerBg: 'from-red-50 to-transparent dark:from-red-950/30',
    emptyIcon: '🔴',
  },
  medium: {
    title: 'Media prioridad',
    accent: 'border-t-amber-400',
    headerBg: 'from-amber-50 to-transparent dark:from-amber-950/30',
    emptyIcon: '🟡',
  },
  low: {
    title: 'Baja prioridad',
    accent: 'border-t-slate-400',
    headerBg: 'from-slate-50 to-transparent dark:from-slate-800/30',
    emptyIcon: '⚪',
  },
};

function Column({
  title,
  priority,
  tasks,
  onToggle,
  onDelete,
  onPriorityChange,
  onAddTask,
}: {
  title: string;
  priority: Priority;
  tasks: Task[];
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
  onPriorityChange: (id: string, priority: Priority) => void;
  onAddTask: (title: string, priority: Priority) => void;
}) {
  const [showInput, setShowInput] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const cfg = columnConfig[priority];

  const handleAdd = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), priority);
      setNewTaskTitle('');
      setShowInput(false);
    }
  };

  return (
    <div className={`flex-1 min-w-0 flex flex-col rounded-2xl border border-slate-200/60 dark:border-slate-700/60 border-t-4 ${cfg.accent} bg-white/40 dark:bg-slate-900/40 backdrop-blur-sm overflow-hidden`}>
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
              onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
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
      <div className="flex-1 p-3">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          <div className="flex flex-col gap-1.5">
            {tasks.map((task) => (
              <SortableTaskCard
                key={task.id}
                task={task}
                onToggle={onToggle}
                onDelete={onDelete}
                onPriorityChange={onPriorityChange}
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

  const highTasks = tasks.filter((t) => t.priority === 'high');
  const mediumTasks = tasks.filter((t) => t.priority === 'medium');
  const lowTasks = tasks.filter((t) => t.priority === 'low');

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    if (!over) return;
    const taskId = active.id as string;
    const overTask = tasks.find((t) => t.id === (over.id as string));
    if (!overTask) return;
    const newPriority = overTask.priority;
    if (newPriority !== tasks.find((t) => t.id === taskId)?.priority) {
      onPriorityChange(taskId, newPriority);
    }
  };

  const handleDragStart = (event: { active: { id: unknown } }) => {
    setActiveId(event.active.id as string);
  };

  const activeTask = activeId ? tasks.find((t) => t.id === activeId) : null;

  return (
    <DndContext
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
      onDragStart={handleDragStart}
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Column title={columnConfig.high.title} priority="high" tasks={highTasks} onToggle={onToggle} onDelete={onDelete} onPriorityChange={onPriorityChange} onAddTask={onAddTask} />
        <Column title={columnConfig.medium.title} priority="medium" tasks={mediumTasks} onToggle={onToggle} onDelete={onDelete} onPriorityChange={onPriorityChange} onAddTask={onAddTask} />
        <Column title={columnConfig.low.title} priority="low" tasks={lowTasks} onToggle={onToggle} onDelete={onDelete} onPriorityChange={onPriorityChange} onAddTask={onAddTask} />
      </div>

      <DragOverlay>
        {activeTask ? (
          <div className="shadow-2xl rotate-1 scale-105">
            <TaskCard
              task={activeTask}
              onToggle={() => {}}
              onDelete={() => {}}
              onPriorityChange={() => {}}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}