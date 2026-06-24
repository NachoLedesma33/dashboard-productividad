import { useState, useRef } from 'react';
import { format, isToday, startOfWeek, addDays, isSameDay } from 'date-fns';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';

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
    <div className="flex gap-0.5 sm:gap-1">
      {days.map((day) => {
        const isCompleted = completionDates.some((d) => isSameDay(new Date(d), day));
        const isTodayDate = isToday(day);

        return (
          <div
            key={day.toISOString()}
            title={format(day, 'EEEE d MMM')}
            className={`w-5 h-5 sm:w-7 sm:h-7 shrink-0 rounded-md sm:rounded-lg flex items-center justify-center text-[8px] sm:text-[10px] font-semibold transition-all duration-200 ${
              isCompleted
                ? 'bg-gradient-to-br from-emerald-400 to-emerald-600 text-white shadow-sm'
                : isTodayDate
                ? 'border border-violet-400 bg-violet-50 dark:bg-violet-900/30 text-violet-600 dark:text-violet-300'
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

function AddHabitForm({ onAdd }: { onAdd: (name: string) => void }) {
  const [name, setName] = useState('');
  const closeRef = useRef<HTMLButtonElement>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name.trim()) {
      onAdd(name.trim());
      setName('');
      closeRef.current?.click();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="Nombre del hábito..."
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <DialogClose asChild ref={closeRef}>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" variant="gradient">Agregar</Button>
      </div>
    </form>
  );
}

export function HabitTracker({
  habits,
  getTodayStatus,
  getStreak,
  onToggle,
  onAddHabit,
}: HabitTrackerProps) {

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
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="gradient" size="iconSm">+</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-sm">
            <DialogHeader>
              <DialogTitle>Nuevo hábito</DialogTitle>
            </DialogHeader>
            <AddHabitForm onAdd={onAddHabit} />
          </DialogContent>
        </Dialog>
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

    </div>
  );
}