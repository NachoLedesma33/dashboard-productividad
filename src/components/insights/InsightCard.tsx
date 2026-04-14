import type { Insight } from '@/utils/analytics/insightsEngine';

interface InsightCardProps {
  insight: Insight;
}

export function InsightCard({ insight }: InsightCardProps) {
  return (
    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-purple-50 to-pink-50 border border-purple-100 rounded-lg">
      <span className="text-2xl">{insight.emoji}</span>
      <p className="text-gray-800 font-medium">{insight.message}</p>
    </div>
  );
}