import { useEffect, useState } from 'react';
import type { Insight } from '@/utils/analytics/insightsEngine';
import type { Habit, CompletionLogEntry } from '@/types';
import type { HabitFeedback } from '@/utils/ai/habitCoach';
import type { WeeklyPrediction } from '@/utils/ai/productivityPredictor';
import { Lightbulb, Brain, TrendingUp } from 'lucide-react';

interface InsightsPanelProps {
  insights: Insight[];
  habits: Habit[];
  completionLog: CompletionLogEntry[];
}

const COACH_ICONS: Record<string, string> = {
  praise: '🔥',
  encourage: '💪',
  tip: '💡',
  warning: '⚠️',
  understanding: '🤗',
};

export function InsightsPanel({ insights, habits, completionLog }: InsightsPanelProps) {
  const [coachFeedbacks, setCoachFeedbacks] = useState<HabitFeedback[]>([]);
  const [prediction, setPrediction] = useState<WeeklyPrediction | null>(null);
  const [loadingAI, setLoadingAI] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const [{ analyzeHabits }, { predictWeek }] = await Promise.all([
          import('@/utils/ai/habitCoach'),
          import('@/utils/ai/productivityPredictor'),
        ]);
        if (cancelled) return;
        setCoachFeedbacks(habits.length > 0 ? analyzeHabits(habits) : []);
        setPrediction(completionLog.length > 0 ? predictWeek(completionLog) : null);
      } catch {
        // AI modules failed to load, silently degrade
      } finally {
        if (!cancelled) setLoadingAI(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [habits, completionLog]);

  const hasCoach = coachFeedbacks.some(f => f.messages.length > 0);
  const coachMessages = coachFeedbacks.flatMap(f => f.messages);

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-text-primary tracking-tight">
            Recomendaciones
          </h2>
          <span className="text-xs font-semibold text-text-muted bg-surface-elevated rounded-full px-2 py-0.5">
            {insights.length + (hasCoach ? coachMessages.length : 0) + (prediction ? 1 : 0)}
          </span>
        </div>
        <Lightbulb className="w-5 h-5 text-accent" aria-hidden="true" />
      </div>

      {insights.length === 0 && !hasCoach && !prediction ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-text-muted">
          {loadingAI ? (
            <div className="loading-spinner mb-4" />
          ) : (
            <>
              <div className="relative mb-4">
                <div className="w-14 h-14 rounded-full border-2 border-dashed border-accent/20 animate-spin" style={{ animationDuration: '8s' }} />
                <Lightbulb className="w-5 h-5 absolute inset-0 m-auto text-accent/30" aria-hidden="true" />
              </div>
              <p className="text-xs font-medium text-center leading-relaxed">
                Completa más tareas para recibir<br />recomendaciones personalizadas
              </p>
            </>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {/* Existing insights */}
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-elevated/40 hover:bg-surface-elevated/80 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 animate-fade-in"
            >
              <span className="text-lg shrink-0 leading-none mt-0.5">{insight.emoji}</span>
              <p className="text-sm font-medium text-text-primary leading-snug">
                {insight.message}
              </p>
            </div>
          ))}

          {/* Coach de hábitos */}
          {hasCoach && (
            <>
              <div className="flex items-center gap-2 mt-2 mb-1">
                <Brain className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Coach de hábitos</span>
              </div>
              {coachMessages.map((msg, i) => (
                <div
                  key={`coach-${i}`}
                  className="flex items-start gap-3 px-4 py-3 rounded-xl bg-surface-elevated/40 animate-fade-in"
                >
                  <span className="text-lg shrink-0 leading-none mt-0.5">{COACH_ICONS[msg.type] || '💡'}</span>
                  <p className="text-sm font-medium text-text-primary leading-snug">
                    {msg.text}
                  </p>
                </div>
              ))}
            </>
          )}

          {/* Predicción semanal */}
          {prediction && (
            <>
              <div className="flex items-center gap-2 mt-2 mb-1">
                <TrendingUp className="w-4 h-4 text-accent" aria-hidden="true" />
                <span className="text-xs font-semibold text-text-secondary uppercase tracking-wide">Predicción semanal</span>
              </div>
              <div className="px-4 py-3 rounded-xl bg-surface-elevated/40 animate-fade-in space-y-1">
                <p className="text-sm font-medium text-text-primary">{prediction.insight}</p>
                <p className="text-xs text-text-secondary">
                  Pronóstico: ~{prediction.predictedTasks} tareas la próxima semana
                </p>
                <p className="text-xs text-text-secondary">
                  Mejor día: {prediction.bestDay.day} · Día más bajo: {prediction.worstDay.day}
                </p>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
