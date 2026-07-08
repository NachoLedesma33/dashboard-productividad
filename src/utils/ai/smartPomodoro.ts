export interface PomodoroSession {
  focusDuration: number;
  breakDuration: number;
  completedAt: Date;
}

export interface PomodoroConfig {
  focusDuration: number;
  breakDuration: number;
  cycles: number;
  reasoning: string;
}

export function calculatePomodoro(sessions: PomodoroSession[]): PomodoroConfig {
  const defaults = { focus: 25, break: 5, cycles: 4 };

  const avgFocusTime = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + x.focusDuration, 0) / sessions.length)
    : defaults.focus;

  const finalFocus = Math.min(avgFocusTime, 55);
  const breakTime = Math.round(finalFocus * 0.2);

  const cycleCount = Math.min(
    Math.floor((4 * (finalFocus + breakTime)) / (finalFocus + breakTime)),
    6,
  );

  return {
    focusDuration: finalFocus,
    breakDuration: breakTime,
    cycles: Math.max(cycleCount, 1),
    reasoning: sessions.length > 0
      ? `Basado en tus ${sessions.length} sesiones anteriores: ${finalFocus} min óptimos.`
      : 'Sin sesiones previas. Arrancamos con valores por defecto.',
  };
}
