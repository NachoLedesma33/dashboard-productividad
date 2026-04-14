import type { Insight } from '@/utils/analytics/insightsEngine';

interface InsightsPanelProps {
  insights: Insight[];
}

export function InsightsPanel({ insights }: InsightsPanelProps) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-800">Insights</h2>
        <button
          className="text-gray-400 hover:text-purple-600 transition-colors"
          title="Regenerar insights"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5"
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

      <div className="space-y-3">
        {insights.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <p>Completa más tareas para recibir</p>
            <p className="text-sm">recomendaciones personalizadas</p>
          </div>
        ) : (
          insights.map((insight) => (
            <div
              key={insight.id}
              className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg animate-fade-in"
            >
              <span className="text-2xl">{insight.emoji}</span>
              <p className="text-gray-800 font-medium">{insight.message}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}