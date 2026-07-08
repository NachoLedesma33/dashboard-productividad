const KICKOFF_KEY = 'daily-kickoff-date';

export function shouldShowKickoff(): boolean {
  const today = new Date();
  const todayStr = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}`;
  const last = localStorage.getItem(KICKOFF_KEY);
  if (last === todayStr) return false;
  localStorage.setItem(KICKOFF_KEY, todayStr);
  return true;
}

export function getKickoffMessage(
  totalTasks: number,
  completedToday: number,
  bestHour: number,
): string {
  const hourLabel = `${bestHour}:00`;
  return `📋 Hoy tenés ${totalTasks} tarea${totalTasks !== 1 ? 's' : ''} (${completedToday} hecha${completedToday !== 1 ? 's' : ''}). Horario pico estimado: ${hourLabel}. 💪`;
}
