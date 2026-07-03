import type { Insight } from '@/utils/analytics/insightsEngine';
import { Lightbulb } from 'lucide-react';

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-text-primary tracking-tight">
            Insights
          </h2>
          <span className="text-xs font-semibold text-text-muted bg-surface-elevated rounded-full px-2 py-0.5">
            {insights.length}
          </span>
        </div>
        <Lightbulb className="w-5 h-5 text-accent" aria-hidden="true" />
      </div>

      {insights.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-text-muted">
          <div className="relative mb-4">
            <div className="w-14 h-14 rounded-full border-2 border-dashed border-accent/20 animate-spin" style={{ animationDuration: '8s' }} />
            <Lightbulb className="w-5 h-5 absolute inset-0 m-auto text-accent/30" aria-hidden="true" />
          </div>
          <p className="text-xs font-medium text-center leading-relaxed">
            Completa más tareas para recibir<br />recomendaciones personalizadas
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
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
        </div>
      )}
    </div>
  );
}
