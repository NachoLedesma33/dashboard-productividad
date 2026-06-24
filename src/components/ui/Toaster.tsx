import { useToastListener, type Toast } from "@/lib/toast";

const typeStyles: Record<Toast["type"], string> = {
  success: "bg-emerald-600 text-white",
  error: "bg-red-600 text-white",
  info: "bg-slate-800 dark:bg-slate-200 text-white dark:text-slate-900",
};

export function Toaster() {
  const toasts = useToastListener();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`px-4 py-2.5 rounded-xl text-sm font-medium shadow-2xl pointer-events-auto animate-slide-in ${typeStyles[t.type]}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  );
}
