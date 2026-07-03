import { useToastListener, type Toast } from "@/lib/toast";
import { CheckCircle2, AlertCircle, Info } from "lucide-react";

const iconMap: Record<Toast["type"], React.ReactNode> = {
  success: <CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" />,
  error: <AlertCircle className="w-4 h-4 text-error" aria-hidden="true" />,
  info: <Info className="w-4 h-4 text-info" aria-hidden="true" />,
};

const borderMap: Record<Toast["type"], string> = {
  success: "border-l-success",
  error: "border-l-error",
  info: "border-l-info",
};

export function Toaster() {
  const toasts = useToastListener();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`flex items-center gap-2.5 px-4 py-3 rounded-xl text-sm font-medium shadow-2xl shadow-black/20 pointer-events-auto animate-toast-enter backdrop-blur-xl bg-surface/90 border border-border/50 border-l-4 ${borderMap[t.type]}`}
        >
          {iconMap[t.type]}
          <span className="text-text-primary">{t.message}</span>
        </div>
      ))}
    </div>
  );
}
