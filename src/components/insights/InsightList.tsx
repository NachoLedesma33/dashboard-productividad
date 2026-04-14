import type { Insight } from '@/utils/analytics/insightsEngine';
import { InsightCard } from './InsightCard';

interface InsightListProps {
  insights: Insight[];
}

export function InsightList({ insights }: InsightListProps) {
  if (insights.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>Completa tareas y hábitos para ver insights</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {insights.map((insight) => (
        <InsightCard key={insight.id} insight={insight} />
      ))}
    </div>
  );
}