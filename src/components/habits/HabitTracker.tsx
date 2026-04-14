import { useState } from 'react';
import { format, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import type { Habit } from '@/types';

interface HabitTrackerProps {
  habits: Habit[];
  getTodayStatus: (id: string) => boolean;
  getStreak: (id: string) => number;
  onToggle: (id: string) => void;
  onAddHabit: (name: string) => void;
}

function WeeklyCalendar({ completionDates }: { completionDates: Date[] }) {
  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="flex gap-1">
      {days.map((day) => {
        const isCompleted = completionDates.some((d) => isSameDay(new Date(d), day));
        const isTodayDate = isToday(day);
        
        return (
          <div
            key={day.toISOString()}
            className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${
              isCompleted
                ? 'bg-green-500 text-white'
                : isTodayDate
                ? 'border-2 border-purple-500'
                : 'bg-gray-100'
            }`}
            title={format(day, 'EEEE d')}
          >
            {format(day, 'd')}
          </div>
        );
      })}
    </div>
  );
}

function AddHabitModal({
  isOpen,
  onClose,
  onAdd,
}: {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (name: string) => void;
}) {
  const [name, setName] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Nuevo Hábito</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del hábito..."
            className="w-full px-3 py-2 border border-gray-300 rounded-lg mb-4 focus:outline-none focus:ring-2 focus:ring-purple-500"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Agregar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function HabitTracker({
  habits,
  getTodayStatus,
  getStreak,
  onToggle,
  onAddHabit,
}: HabitTrackerProps) {
  const [showAddModal, setShowAddModal] = useState(false);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-semibold text-gray-800">Hábitos</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
        >
          + Agregar hábito
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p>No hay hábitos todavía.</p>
          <p className="text-sm">¡Agrega tu primer hábito para empezar!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm"
            >
              <div className="flex-1">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => onToggle(habit.id)}
                    className={`w-10 h-10 rounded-full border-2 flex items-center justify-center font-semibold transition-colors ${
                      getTodayStatus(habit.id)
                        ? 'bg-green-500 border-green-500 text-white'
                        : 'border-gray-300 hover:border-green-500 text-gray-500'
                    }`}
                  >
                    {getTodayStatus(habit.id) ? '✓' : '○'}
                  </button>
                  <span className="text-gray-800 font-medium">{habit.name}</span>
                  <span className="text-orange-500 text-lg" title="Racha actual">
                    🔥 {getStreak(habit.id)}
                  </span>
                </div>
              </div>
              
              <WeeklyCalendar completionDates={habit.completionDates} />
            </div>
          ))}
        </div>
      )}

      <AddHabitModal
        isOpen={showAddModal}
        onClose={() => setShowAddModal(false)}
        onAdd={onAddHabit}
      />
    </div>
  );
}