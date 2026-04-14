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

  return (
    <div className="flex-1 min-w-[280px] bg-gray-100 rounded-lg p-3">
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-semibold text-gray-700">
          {title} <span className="text-gray-500">({tasks.length})</span>
        </h3>
        <button
          onClick={() => setShowInput(!showInput)}
          className="w-7 h-7 flex items-center justify-center bg-purple-600 text-white rounded-full hover:bg-purple-700 transition-colors"
        >
          +
        </button>
      </div>

      {showInput && (
        <div className="mb-3 flex gap-2">
          <input
            type="text"
            value={newTaskTitle}
            onChange={(e) => setNewTaskTitle(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleAdd()}
            placeholder="Nueva tarea..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <button
            onClick={handleAdd}
            className="px-3 py-2 bg-purple-600 text-white rounded-lg text-sm hover:bg-purple-700"
          >
            Add
          </button>
        </div>
      )}

      <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div className="flex flex-col gap-2">
          {tasks.map((task) => (
            <SortableTaskCard
              key={task.id}
              task={task}
              onToggle={onToggle}
              onDelete={onDelete}
              onPriorityChange={onPriorityChange}
            />
          ))}
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
      <div className="flex gap-4">
        <Column
          title="Alta Prioridad"
          priority="high"
          tasks={highTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onPriorityChange={onPriorityChange}
          onAddTask={onAddTask}
        />
        <Column
          title="Media Prioridad"
          priority="medium"
          tasks={mediumTasks}
          onToggle={onToggle}
          onDelete={onDelete}
          onPriorityChange={onPriorityChange}
          onAddTask={onAddTask}
        />
        <Column
          title="Baja Prioridad"
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