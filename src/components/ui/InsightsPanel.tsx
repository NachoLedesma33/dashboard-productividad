import type { Insight } from '@/utils/analytics/insightsEngine';

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="flex flex-col h-full">
      {/* Header — same pattern as TaskBoard column */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h2 className="text-sm font-bold text-slate-700 dark:text-slate-200 tracking-tight">
            Insights
          </h2>
          <span className="text-xs font-semibold text-slate-400 dark:text-slate-500 bg-slate-100 dark:bg-slate-800 rounded-full px-2 py-0.5">
            {insights.length}
          </span>
        </div>
        <span className="text-base" title="Insights de productividad">💡</span>
      </div>

      {/* List */}
      {insights.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center py-10 text-slate-400 dark:text-slate-600">
          <span className="text-2xl mb-2">💡</span>
          <p className="text-xs font-medium text-center leading-relaxed">
            Completa más tareas para recibir recomendaciones
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-1.5">
          {insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-start gap-3 px-4 py-3 rounded-xl bg-white/60 dark:bg-slate-800/60 backdrop-blur-sm hover:bg-white/80 dark:hover:bg-slate-800/80 hover:shadow-md transition-all duration-200 animate-fade-in"
            >
              <span className="text-lg shrink-0 leading-none mt-0.5">{insight.emoji}</span>
              <p className="text-sm font-medium text-slate-700 dark:text-slate-200 leading-snug">
                {insight.message}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}