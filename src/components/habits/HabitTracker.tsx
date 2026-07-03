import { useState, useRef } from 'react';
import { format } from 'date-fns';
import type { Habit } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Target, Flame, X } from 'lucide-react';
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
  onDeleteHabit: (id: string) => void;
  onAddHabit: (name: string) => void;
}

function AggregateHeatmap({ habits }: { habits: Habit[] }) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const totalWeeks = 20;
  const cell = 12; // px
  const gap = 2;   // px

  // Find the Monday of the current week
  const dow = today.getDay(); // 0=Sun
  const thisMonday = new Date(today);
  thisMonday.setDate(today.getDate() - (dow === 0 ? 6 : dow - 1));

  // Build weeks array (oldest → newest)
  const weeks: Date[][] = [];
  for (let w = 0; w < totalWeeks; w++) {
    const week: Date[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(thisMonday);
      date.setDate(date.getDate() - (totalWeeks - 1 - w) * 7 + d);
      date.setHours(0, 0, 0, 0);
      week.push(date);
    }
    weeks.push(week);
  }

  // Compute month label ranges
  const monthRanges: { name: string; start: number; end: number }[] = [];
  let curMonth: number | null = null;
  let curStart = 0;
  weeks.forEach((week, i) => {
    const m = week[3].getMonth();
    if (curMonth !== null && m !== curMonth) {
      monthRanges.push({ name: format(new Date(2024, curMonth), 'MMM'), start: curStart, end: i });
      curStart = i;
    }
    curMonth = m;
  });
  if (curMonth !== null) monthRanges.push({ name: format(new Date(2024, curMonth), 'MMM'), start: curStart, end: totalWeeks });

  const colW = cell + gap;

  const getCount = (date: Date) =>
    habits.filter(h =>
      h.completionDates.some(cd => {
        const d = new Date(cd);
        d.setHours(0, 0, 0, 0);
        return d.getTime() === date.getTime();
      })
    ).length;

  const maxCount = habits.length || 1;

  const levels = [
    'bg-surface-elevated',
    'bg-success/20',
    'bg-success/40',
    'bg-success/65',
    'bg-success',
  ];

  const getLevel = (c: number) => {
    if (c === 0) return 0;
    const r = c / maxCount;
    return r <= 0.25 ? 1 : r <= 0.5 ? 2 : r <= 0.75 ? 3 : 4;
  };

  const dayLabels = ['Lun', '', 'Mié', '', 'Vie', '', ''];

  return (
    <div className="p-4 rounded-xl bg-surface-elevated/20 overflow-x-auto">
      {/* Header: title + legend */}
      <div className="flex items-center justify-between mb-3">
        <span className="text-[10px] font-medium text-text-muted tracking-wide uppercase">Actividad últimos meses</span>
        <div className="flex items-center gap-1">
          <span className="text-[9px] text-text-muted">Menos</span>
          <div className={`w-2.5 h-2.5 rounded-sm ${levels[0]}`} />
          <div className={`w-2.5 h-2.5 rounded-sm ${levels[1]}`} />
          <div className={`w-2.5 h-2.5 rounded-sm ${levels[2]}`} />
          <div className={`w-2.5 h-2.5 rounded-sm ${levels[3]}`} />
          <div className={`w-2.5 h-2.5 rounded-sm ${levels[4]}`} />
          <span className="text-[9px] text-text-muted">Más</span>
        </div>
      </div>

      {/* Month labels */}
      <div className="flex mb-0.5" style={{ paddingLeft: '33px' }}>
        {monthRanges.map((m, i) => (
          <div
            key={i}
            style={{ width: `${(m.end - m.start) * colW - gap}px` }}
            className="text-[10px] font-medium text-text-muted leading-none shrink-0"
          >
            {m.name}
          </div>
        ))}
      </div>

      {/* Day rows */}
      <div className="flex flex-col" style={{ gap: `${gap}px` }}>
        {dayLabels.map((label, d) => {
          const todayInThisRow = new Date();
          todayInThisRow.setHours(0, 0, 0, 0);
          return (
            <div key={d} className="flex items-center" style={{ gap: '4px' }}>
              <span className="w-7 text-[10px] text-text-muted text-right leading-none shrink-0">
                {label}
              </span>
              <div className="flex shrink-0" style={{ gap: `${gap}px` }}>
                {weeks.map((week, w) => {
                  const date = week[d];
                  const c = getCount(date);
                  const level = getLevel(c);
                  const isToday = date.getTime() === todayInThisRow.getTime();
                  return (
                    <div
                      key={`${w}-${d}`}
                      title={`${format(date, 'd MMM yyyy')}: ${c} ${c === 1 ? 'hábito' : 'hábitos'}`}
                      className={`w-3 h-3 rounded-sm transition-colors duration-200 ${levels[level]} ${isToday ? 'ring-1 ring-white/40' : ''}`}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
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
        aria-label="Nombre del hábito"
        autoFocus
      />
      <div className="flex gap-2 justify-end">
        <DialogClose asChild ref={closeRef}>
          <Button variant="outline">Cancelar</Button>
        </DialogClose>
        <Button type="submit" variant="ghost">Agregar</Button>
      </div>
    </form>
  );
}

export function HabitTracker({
  habits,
  getTodayStatus,
  getStreak,
  onToggle,
  onDeleteHabit,
  onAddHabit,
}: HabitTrackerProps) {

  return (
    <div className="flex flex-col h-full">
      {/* Header — same style as TaskBoard column */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-text-primary tracking-tight">
            Hábitos
          </h2>
          <span className="text-xs font-semibold text-text-muted bg-surface-elevated rounded-full px-2 py-0.5">
            {habits.length}
          </span>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button variant="ghost" size="iconSm" aria-label="Agregar hábito">+</Button>
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
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-text-muted">
          <Target className="w-6 h-6 mb-2 text-text-muted" aria-hidden="true" />
          <p className="text-xs font-medium">Sin hábitos</p>
          <p className="text-xs mt-1">Agrega tu primer hábito</p>
        </div>
      ) : (
        <>
        <div className="mb-3">
          <AggregateHeatmap habits={habits} />
        </div>
        <div className="flex flex-col gap-1.5">
          {habits.map((habit) => {
            const done = getTodayStatus(habit.id);
            const streak = getStreak(habit.id);
            return (
              <div
                key={habit.id}
                className="group flex items-center gap-3 px-4 py-3 rounded-xl bg-surface-elevated/40 hover:bg-surface-elevated/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
              >
                {/* Toggle button */}
                <button
                  onClick={() => onToggle(habit.id)}
                  className={`w-5 h-5 shrink-0 rounded-md border-2 flex items-center justify-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ${
                    done
                      ? 'bg-accent border-accent'
                      : 'border-text-muted hover:border-accent'
                  }`}
                  aria-label="Completar hábito"
                >
                  {done && (
                    <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 12 12" stroke="currentColor" strokeWidth={2.5} aria-hidden="true">
                      <path className="animate-draw-check" strokeLinecap="round" strokeLinejoin="round" d="M2 6l3 3 5-5" strokeDasharray="12" strokeDashoffset="0" />
                    </svg>
                  )}
                </button>

                {/* Name + streak */}
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate transition-all duration-200 ${
                    done
                      ? 'line-through text-text-muted'
                      : 'text-text-primary'
                  }`}>
                    {habit.name}
                  </p>
                  {streak > 0 && (
                    <p className="text-[11px] text-priority-medium font-medium leading-none mt-0.5">
                      <Flame className="w-3.5 h-3.5 inline-block -mt-0.5" aria-hidden="true" /> {streak} días seguidos
                    </p>
                  )}
                </div>

                {/* Delete button */}
                <button
                  onClick={() => onDeleteHabit(habit.id)}
                  className="w-6 h-6 shrink-0 flex items-center justify-center text-text-muted hover:text-priority-high hover:bg-priority-high/10 rounded-lg transition-all duration-200 opacity-0 group-hover:opacity-100 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                  aria-label="Eliminar hábito"
                >
                  <X className="w-3 h-3" aria-hidden="true" />
                </button>
              </div>
            );
          })}
        </div>
        </>
      )}

    </div>
  );
}