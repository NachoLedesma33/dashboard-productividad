import type { Habit } from '@/types';

export interface CoachMessage {
  type: 'praise' | 'encourage' | 'tip' | 'warning' | 'understanding';
  text: string;
}

export interface HabitFeedback {
  habit: string;
  messages: CoachMessage[];
}

function getTodayStart(): Date {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
}

function isTodayCompleted(habit: Habit): boolean {
  const today = getTodayStart();
  return habit.completionDates.some((date) => {
    const d = new Date(date);
    d.setHours(0, 0, 0, 0);
    return d.getTime() === today.getTime();
  });
}

function calculateStreak(completionDates: Date[], current: boolean): number {
  if (completionDates.length === 0) return 0;

  const sorted = [...completionDates]
    .map((d) => {
      const date = new Date(d);
      date.setHours(0, 0, 0, 0);
      return date.getTime();
    })
    .sort((a, b) => b - a);

  const today = getTodayStart().getTime();
  const yesterday = today - 86400000;
  let streak = 0;
  let checkDate = current ? today : yesterday;

  for (const timestamp of sorted) {
    if (timestamp === checkDate) {
      streak++;
      checkDate -= 86400000;
    } else if (timestamp < checkDate) {
      break;
    }
  }

  return streak;
}

export function analyzeHabits(habits: Habit[]): HabitFeedback[] {
  return habits.map(h => {
    const feedback: HabitFeedback = { habit: h.name, messages: [] };
    const done = isTodayCompleted(h);
    const streak = calculateStreak(h.completionDates, done);
    const uniqueDays = [...new Set(
      h.completionDates.map(d => {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);
        return date.getTime();
      })
    )];

    if (streak >= 21) {
      feedback.messages.push({ type: 'praise', text: `🔥 ${streak} días! Hábito consolidado.` });
    } else if (streak >= 7) {
      feedback.messages.push({ type: 'praise', text: `💪 ${streak} días! Ya es rutina.` });
    } else if (streak >= 3) {
      feedback.messages.push({ type: 'encourage', text: `Bien! Llevás ${streak} días seguidos.` });
    } else if (streak === 0 && uniqueDays.length > 0) {
      feedback.messages.push({ type: 'encourage', text: `"${h.name}": retomá el hábito! Ya lo hiciste antes.` });
    }

    const today = getTodayStart();
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      d.setHours(0, 0, 0, 0);
      return d.getTime();
    });
    const completedLast7 = last7.filter(day => uniqueDays.includes(day)).length;
    const weeklyRate = completedLast7 / 7;
    if (weeklyRate < 0.3 && streak === 0) {
      feedback.messages.push({
        type: 'tip',
        text: `"${h.name}": esta semana solo ${Math.round(weeklyRate * 100)}%. Probá reducir la duración.`,
      });
    }

    const recentCount = habits.filter(h2 =>
      h2.completionDates.length <= 3
    ).length;
    if (h.completionDates.length <= 3 && recentCount > 3) {
      feedback.messages.push({
        type: 'warning',
        text: 'Estás empezando varios hábitos nuevos. Concentrate en 1-2 primero.',
      });
    }

    return feedback;
  });
}
