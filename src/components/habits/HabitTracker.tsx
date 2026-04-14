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
    <div className="flex gap-1 min-w-max">
      {days.map((day) => {
        const isCompleted = completionDates.some((d) => isSameDay(new Date(d), day));
        const isTodayDate = isToday(day);

        return (
          <div
            key={day.toISOString()}
            title={format(day, 'EEEE d MMM')}
            className={`w-7 h-7 shrink-0 rounded-lg flex items-center justify-center text-[10px] font-semibold transition-all duration-200 ${
              isCompleted
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm'
                : isTodayDate
                ? 'border-2 border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300'
                : 'bg-slate-100 dark:bg-slate-700/60 text-slate-400 dark:text-slate-500'
            }`}
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
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
      <div className="glass rounded-2xl p-6 w-full max-w-sm shadow-2xl">
        <h3 className="text-base font-bold mb-4 text-slate-800 dark:text-slate-100">
          Nuevo hábito
        </h3>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Nombre del hábito..."
            className="w-full px-3 py-2 text-sm border border-violet-200 dark:border-violet-700 rounded-lg mb-4 bg-white dark:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-violet-400 focus:border-transparent transition-all duration-200"
            autoFocus
          />
          <div className="flex gap-2 justify-end">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-all duration-200"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-sm bg-gradient-to-r from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 font-medium shadow-sm transition-all duration-200"
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
    <div className="flex flex-col h-full">
      {/* Header — same style as TaskBoard column */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            Hábitos
          </h2>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
            {habits.length}
          </span>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="w-7 h-7 flex items-center justify-center bg-gradient-to-br from-violet-500 to-pink-500 text-white rounded-lg hover:from-violet-600 hover:to-pink-600 transition-all duration-200 text-sm font-bold shadow-sm hover:shadow-md"
        >
          +
        </button>
      </div>

      {/* List */}
      {habits.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
          <span className="text-2xl mb-2">🎯</span>
          <p className="text-xs font-medium">Sin hábitos</p>
          <p className="text-xs mt-1">Agrega tu primer hábito</p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {habits.map((habit) => {
            const done = getTodayStatus(habit.id);
            const streak = getStreak(habit.id);
            return (
              <div
                key={habit.id}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200"
              >
                {/* Toggle button */}
                <button
                  onClick={() => onToggle(habit.id)}
                  className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 ${
                    done
                      ? 'bg-emerald-500 border-emerald-500'
                      : 'border-slate-300 dark:border-slate-600 hover:border-emerald-400'
                  }`}
                  aria-label="Completar hábito"
                >
                  {done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" />
                    </svg>
                  )}
                </button>

                {/* Name + streak */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-all duration-200 ${
                    done
                      ? 'line-through text-slate-400 dark:text-slate-500'
                      : 'text-slate-700 dark:text-slate-200'
                  }`}>
                    {habit.name}
                  </p>
                  {streak > 0 && (
                    <p className="text-[11px] text-orange-500 font-medium leading-none mt-0.5">
                      🔥 {streak} días seguidos
                    </p>
                  )}
                </div>

                {/* Weekly mini-calendar */}
                <div className="shrink-0 overflow-x-auto">
                  <WeeklyCalendar completionDates={habit.completionDates} />
                </div>
              </div>
            );
          })}
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