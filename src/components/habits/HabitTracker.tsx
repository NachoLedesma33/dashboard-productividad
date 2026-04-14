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
    <div className="flex gap-3">
      {days.map((day) => {
        const isCompleted = completionDates.some((d) => isSameDay(new Date(d), day));
        const isTodayDate = isToday(day);
        
        return (
          <div
            key={day.toISOString()}
            className={`w-12 h-12 rounded-xl flex items-center justify-center text-xs font-semibold transition-all duration-300 transform hover:scale-110 ${
              isCompleted
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-lg hover:shadow-xl'
                : isTodayDate
                ? 'border-2 border-violet-500 bg-gradient-to-br from-violet-50 to-pink-50 dark:from-violet-900 dark:to-pink-900 text-violet-600 dark:text-violet-300 shadow-md hover:shadow-lg animate-pulse-slow'
                : 'bg-slate-100 dark:bg-slate-700 text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-600'
            }`}
            title={format(day, 'EEEE d MMM')}
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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-slide-in">
      <div className="glass rounded-2xl p-8 w-full max-w-sm shadow-2xl border-0 transform transition-all duration-300">
        <h3 className="text-xl font-bold mb-6 bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Nuevo Hábito</h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del hábito..."
            className="w-full px-4 py-4 border-2 border-violet-200 dark:border-violet-700 rounded-xl mb-6 bg-white/80 dark:bg-slate-800/80 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent backdrop-blur-sm transition-all duration-300"
            autoFocus
          />
          <div className="flex gap-3 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-3 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-all duration-300"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-3 bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-xl hover:from-violet-600 hover:to-pink-600 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
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
    <div className="space-y-12">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Hábitos</h2>
        <button
          onClick={() => setShowAddModal(true)}
          className="px-8 py-4 bg-gradient-to-r from-violet-500 to-pink-500 text-white text-sm rounded-xl hover:from-violet-600 hover:to-pink-600 font-medium shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-300"
        >
          + Agregar
        </button>
      </div>

      {habits.length === 0 ? (
        <div className="text-center py-24 text-slate-500">
          <div className="text-6xl mb-8">🎯</div>
          <p className="mb-4 text-lg font-medium">No hay hábitos todavía.</p>
          <p className="text-sm">¡Agrega tu primer hábito!</p>
        </div>
      ) : (
        <div className="space-y-10 space-y-large">
          {habits.map((habit) => (
            <div
              key={habit.id}
              className="flex items-center gap-10 p-10 glass habit-card rounded-2xl border-0 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300"
            >
              <button
                onClick={() => onToggle(habit.id)}
                className={`w-16 h-16 rounded-2xl border-2 flex items-center justify-center font-bold text-xl transition-all transform hover:scale-110 ${
                  getTodayStatus(habit.id)
                    ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 border-emerald-500 text-white shadow-lg hover:shadow-xl'
                    : 'border-slate-300 dark:border-slate-600 hover:border-emerald-500 text-slate-400 hover:text-emerald-500'
                }`}
              >
                {getTodayStatus(habit.id) ? '✓' : '○'}
              </button>

              <div className="flex-1 min-w-0">
                <p className="font-semibold text-xl truncate text-slate-700 dark:text-slate-200 mb-3">{habit.name}</p>
                <p className="text-sm text-orange-500 font-medium">🔥 {getStreak(habit.id)} días seguidos</p>
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