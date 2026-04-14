import type { Insight } from '@/utils/analytics/insightsEngine';

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div>
      <div className="flex items-center justify-between mb-12">
        <h2 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-pink-600 bg-clip-text text-transparent">Insights</h2>
        <button
          className="w-12 h-12 flex items-center justify-center text-slate-400 hover:text-violet-600 hover:bg-violet-50 dark:hover:bg-violet-900/30 rounded-xl transition-all duration-300 transform hover:scale-110"
          title="Regenerar insights"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.732 5.313l1.92-1.92A4.978 4.978 0 0014 7V4.757a1 1 0 00-1.414-1.414l-2.243 2.243A7.008 7.008 0 013.1 4.758V3a1 1 0 00-1.707-.707l-2.343 2.343a.998.998 0 01-.456.131A1 1 0 002 7v2.757a1 1 0 001.707.707l2.343-2.343a.998.998 0 01.456-.131 1 1 0 00.707-1.707V3a1 1 0 011-1z"
              clipRule="evenodd"
            />
            <path
              fillRule="evenodd"
              d="M16 18a1 1 0 001-1v-2.101a7.002 7.002 0 00-11.732-5.313l-1.92 1.92A4.978 4.978 0 006 13v-2.757a1 1 0 00-1.414-1.414l-2.243 2.243A7.008 7.008 0 0116.9 11.242V13a1 1 0 001.707.707l2.343-2.343a.998.998 0 01.456-.131A1 1 0 0018 13v-2.757a1 1 0 00-1.707-.707l-2.343 2.343a.998.998 0 01-.456.131 1 1 0 00-.707 1.707V13a1 1 0 001 1z"
              clipRule="evenodd"
            />
          </svg>
        </button>
      </div>

      <div className="space-y-10 space-y-large">
        {insights.length === 0 ? (
          <div className="text-center py-24 text-slate-500">
            <div className="text-6xl mb-8">💡</div>
            <p className="mb-4 text-lg font-medium">Completa más tareas para recibir</p>
            <p className="text-sm">recomendaciones personalizadas</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-center gap-10 p-10 glass insight-card rounded-2xl border-0 hover:shadow-xl transform hover:scale-[1.02] transition-all duration-300 animate-slide-in"
            >
              <div className="text-4xl animate-pulse-slow">{insight.emoji}</div>
              <p className="font-semibold text-slate-700 dark:text-slate-200 text-lg leading-relaxed">{insight.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}