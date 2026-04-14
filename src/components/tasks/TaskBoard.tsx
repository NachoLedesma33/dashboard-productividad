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
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
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

  const handleAdd = () => {
    if (newTaskTitle.trim()) {
      onAddTask(newTaskTitle.trim(), priority);
      setNewTaskTitle('');
      setShowInput(false);
    }
  };

  const columnColors: Record<Priority, string> = {
    high: 'border-red-200 dark:border-red-800',
    medium: 'border-amber-200 dark:border-amber-800',
    low: 'border-slate-200 dark:border-slate-700',
  };

  return (
    <div className={`flex-1 min-w-[280px] glass task-board-container rounded-2xl border-2 ${columnColors[priority]} transform transition-all duration-300 hover:scale-[1.02] hover:shadow-xl`}>
      <div className="flex items-center justify-between mb-10">
        <h3 className="font-bold text-lg text-slate-800 dark:text-slate-100">
          {title} <span className="text-sm font-normal text-slate-500 dark:text-slate-400">({tasks.length})</span>
        </h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="w-10 h-10 flex items-center justify-center bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-full hover:from-violet-600 hover:to-pink-600 transition-all duration-300 text-lg font-bold shadow-lg hover:shadow-xl transform hover:scale-110"
        >
          +
        </button>
      </div>

      {showInput && (
        <div className="mb-10 flex gap-6 animate-slide-in">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nueva tarea..."
            className="flex-1 px-5 py-4 text-sm border-2 border-violet-200 dark:border-violet-700 rounded-xl bg-white/80 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl text-sm hover:from-violet-600 hover:to-pink-600 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
          >
            Add
          </button>
        </div>
      )}

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="space-y-6 space-y-large">
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
            <div className="text-center py-20 text-slate-400 dark:text-slate-500">
              <div className="text-4xl mb-4">📝</div>
              <p className="text-sm">Sin tareas</p>
            </div>
          )}
        </div>
      </SortableContext>
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
    const overId = over.id as string;

    const overTask = tasks.find((t) => t.id === overId);
    if (!overTask) return;

    const newPriority = overTask.priority;
    if (newPriority !== taskId) {
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
      <div className="flex flex-col md:flex-row gap-8 column-gap">
        <Column
          title="Alta"
          priority="high"
          tasks={highTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onPriorityChange={onPriorityChange}
          onAddTask={onAddTask}
        />
        <Column
          title="Media"
          priority="medium"
          tasks={mediumTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onPriorityChange={onPriorityChange}
          onAddTask={onAddTask}
        />
        <Column
          title="Baja"
          priority="low"
          tasks={lowTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onPriorityChange={onPriorityChange}
          onAddTask={onAddTask}
        />
      </div>

      <DragOverlay>
        {activeTask ? (
          <TaskCard
            task={activeTask}
            onToggle={() => {}}
            onDelete={() => {}}
            onPriorityChange={() => {}}
          />
        ) : null}
      </DragOverlay>
    </DndContext>
  );
}