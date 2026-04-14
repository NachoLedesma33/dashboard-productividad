import type { Habit } from '@/types';

interface HabitCardProps {
  habit: Habit;
  isCompletedToday: boolean;
  streak: number;
  onToggle: (id: string) => void;
}

export function HabitCard({ habit, isCompletedToday, streak, onToggle }: HabitCardProps) {
  return (
    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-shadow">
      <button
        onClick={() => onToggle(habit.id)}
        className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
          isCompletedToday
            ? 'bg-green-500 border-green-500 text-white'
            : 'border-gray-300 hover:border-green-500'
        }`}
      >
        {isCompletedToday && '✓'}
      </button>

      <span className="flex-1 text-gray-800">{habit.name}</span>

      <div className="text-sm text-gray-500">
        <span className="font-semibold text-orange-500">{streak}</span> días
      </div>
    </div>
  );
}