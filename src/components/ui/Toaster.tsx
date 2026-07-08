import { useToastListener, type Toast } from "@/lib/toast";

const emojiMap: Record<Toast["type"], string> = {
  success: "✓",
  error: "✗",
  info: "·",
};

export function Toaster() {
  const toasts = useToastListener();

  return (
    <div className="fixed bottom-6 right-6 z-[9999] flex flex-col gap-2.5 pointer-events-none max-w-sm w-full" role="status" aria-live="polite" aria-atomic="true">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="flex items-center gap-2.5 px-4 py-3 pr-6 rounded-full text-sm font-semibold pointer-events-auto animate-toast-enter"
          style={{
            background: 'var(--clay-toast-bg)',
            color: 'var(--clay-text-primary)',
            boxShadow: 'var(--clay-shadow-ambient), 0 1px 2px var(--clay-inset-top) inset, 0 -1px 2px var(--clay-inset-bottom) inset',
            clipPath: 'polygon(4% 0%, 96% 0%, 100% 18%, 100% 82%, 96% 100%, 4% 100%, 0% 82%, 0% 18%)',
          }}
        >
          <span className="icon-clay text-sm">{emojiMap[t.type]}</span>
          <span>{t.message}</span>
        </div>
      ))}
    </div>
  );
}
