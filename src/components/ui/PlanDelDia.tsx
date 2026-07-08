import { useEffect, useState } from 'react';
import type { Task, CompletionLogEntry, Priority } from '@/types';
import type { ScoredTask } from '@/utils/ai/taskPrioritizer';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface PlanDelDiaProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tasks: Task[];
  completionLog: CompletionLogEntry[];
}

const PRIORITY_COLORS: Record<Priority, string> = {
  high: 'bg-priority-high',
  medium: 'bg-priority-medium',
  low: 'bg-priority-low',
};

function ScoreBar({ score }: { score: number }) {
  const pct = Math.min(Math.round((score / 1.5) * 100), 100);
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1.5 rounded-full overflow-hidden" style={{ background: 'var(--clay-progress-track)' }}>
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{ background: 'var(--clay-progress-fill)', width: `${pct}%` }}
        />
      </div>
      <span className="text-[11px] font-medium text-text-secondary w-6 text-right">{Math.round(score * 100)}</span>
    </div>
  );
}

export function PlanDelDia({ open, onOpenChange, tasks, completionLog }: PlanDelDiaProps) {
  const [scored, setScored] = useState<ScoredTask[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setLoading(true);

    import('@/utils/ai/taskPrioritizer').then(({ prioritizeTasks }) => {
      if (cancelled) return;
      setScored(prioritizeTasks(tasks, completionLog));
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [open, tasks, completionLog]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Plan del día</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-10">
            <div className="loading-spinner" />
          </div>
        ) : scored.length === 0 ? (
          <p className="text-sm text-text-secondary text-center py-8">
            No hay tareas pendientes. Buen trabajo! 🎉
          </p>
        ) : (
          <div className="flex flex-col gap-2 max-h-[60vh] overflow-y-auto">
            {scored.map((s, i) => (
              <div
                key={s.task.id}
                className="flex flex-col gap-1.5 px-4 py-3 rounded-xl surface-card animate-fade-in"
                style={{ animationDelay: `${i * 30}ms` }}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="text-xs font-bold text-text-muted w-5 shrink-0">#{i + 1}</span>
                    <div className={`w-2 h-2 rounded-full shrink-0 ${PRIORITY_COLORS[s.task.priority]}`} />
                    <p className="text-sm font-medium text-text-primary truncate">{s.task.title}</p>
                  </div>
                  <DialogClose asChild>
                    <Button variant="ghost" size="sm" className="text-xs shrink-0 ml-2">
                      Hacer
                    </Button>
                  </DialogClose>
                </div>
                <div className="flex items-center justify-between pl-7">
                  <span className="text-[11px] text-text-muted">{s.reason}</span>
                </div>
                <div className="pl-7">
                  <ScoreBar score={s.score} />
                </div>
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
