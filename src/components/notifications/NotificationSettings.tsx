import { useState } from 'react';
import type { NotificationSettings, Task, Habit, CalendarEvent } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Bell, BellOff, Clock, CalendarDays, Volume2, VolumeX, ListChecks } from 'lucide-react';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  permission: NotificationPermission;
  isSupported: boolean;
  onUpdate: (partial: Partial<NotificationSettings>) => void;
  onEnable: () => Promise<NotificationPermission>;
  tasks?: Task[];
  habits?: Habit[];
  events?: CalendarEvent[];
  onUpdateTaskReminder?: (id: string, reminderAt: Date | null, message: string) => void;
  onUpdateEventReminder?: (id: string, reminderAt: Date | null, message: string) => void;
  onUpdateHabitReminder?: (id: string, time: string | null) => void;
}

const ADVANCE_OPTIONS = [
  { value: 5, label: '5 min antes' },
  { value: 15, label: '15 min antes' },
  { value: 30, label: '30 min antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 día antes' },
];

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full transition-colors duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 ${
        checked ? 'bg-accent' : 'bg-surface-elevated'
      }`}
    >
      <span
        className={`pointer-events-none block h-4 w-4 rounded-full bg-white shadow-lg ring-0 transition-transform duration-200 ${
          checked ? 'translate-x-6' : 'translate-x-1'
        }`}
      />
    </button>
  );
}

function toLocalInput(date: Date | null | undefined): string {
  if (!date) return '';
  const d = new Date(date);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(value: string): Date {
  return new Date(value);
}

function defaultWhen(days = 0): string {
  const d = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  d.setMinutes(d.getMinutes() + 60);
  return toLocalInput(d);
}

function ItemRow({
  title,
  checked,
  onToggle,
  hasWhen,
  whenValue,
  onWhen,
  messageValue,
  onMessage,
  kind,
}: {
  title: string;
  checked: boolean;
  onToggle: (v: boolean) => void;
  hasWhen: boolean;
  whenValue: string;
  onWhen: (v: string) => void;
  messageValue: string;
  onMessage: (v: string) => void;
  kind: 'datetime' | 'time';
}) {
  return (
    <div className="rounded-lg bg-surface-elevated p-2 space-y-1.5">
      <div className="flex items-center gap-2">
        <Toggle checked={checked} onChange={onToggle} disabled={!hasWhen} />
        <span className="flex-1 text-xs text-text-primary font-medium truncate">{title}</span>
      </div>
      {checked && (
        <div className="space-y-1.5">
          <input
            type={kind}
            value={whenValue}
            onChange={(e) => onWhen(e.target.value)}
            className="block w-full px-2 py-1 text-xs rounded-lg bg-background border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
          />
          <Input
            value={messageValue}
            onChange={(e) => onMessage(e.target.value)}
            placeholder="Mensaje (opcional)"
            className="h-7 text-xs"
          />
        </div>
      )}
    </div>
  );
}

export function NotificationSettingsPanel({
  settings,
  permission,
  isSupported,
  onUpdate,
  onEnable,
  tasks,
  habits,
  events,
  onUpdateTaskReminder,
  onUpdateEventReminder,
  onUpdateHabitReminder,
}: NotificationSettingsProps) {
  const [enableLoading, setEnableLoading] = useState(false);
  const [taskDrafts, setTaskDrafts] = useState<Record<string, { when: string; msg: string }>>({});
  const [eventDrafts, setEventDrafts] = useState<Record<string, { when: string; msg: string }>>({});

  const handleEnable = async () => {
    setEnableLoading(true);
    await onEnable();
    setEnableLoading(false);
  };

  if (!isSupported) {
    return (
      <div className="text-center py-8 text-text-muted">
        <BellOff className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">Las notificaciones no son compatibles con este navegador</p>
      </div>
    );
  }

  const visibleTasks = (tasks ?? []).filter((t) => !t.completed);
  const visibleEvents = events ?? [];

  return (
    <div className="space-y-5">
      {/* Master toggle */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {settings.enabled ? (
            <Bell className="w-5 h-5 text-accent" />
          ) : (
            <BellOff className="w-5 h-5 text-text-muted" />
          )}
          <div>
            <p className="text-sm font-semibold text-text-primary">Notificaciones</p>
            <p className="text-xs text-text-muted">
              {permission === 'granted'
                ? 'Permiso concedido'
                : permission === 'denied'
                ? 'Permiso denegado'
                : 'Sin permiso'}
            </p>
          </div>
        </div>
        {permission === 'granted' ? (
          <Toggle checked={settings.enabled} onChange={(v) => (v ? handleEnable() : onUpdate({ enabled: false }))} />
        ) : (
          <Button
            onClick={handleEnable}
            variant="ghost"
            size="sm"
            disabled={enableLoading || permission === 'denied'}
          >
            {permission === 'denied' ? 'Bloqueado' : 'Activar'}
          </Button>
        )}
      </div>

      {settings.enabled && (
        <>
          <div className="h-px bg-border" />

          {/* Task reminders */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarDays className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">Recordatorios de tareas</span>
              </div>
              <Toggle
                checked={settings.taskReminders}
                onChange={(v) => onUpdate({ taskReminders: v })}
              />
            </div>
            {settings.taskReminders && (
              <div className="ml-6 space-y-2">
                <label className="text-xs text-text-muted">Anticipación</label>
                <div className="flex flex-wrap gap-1.5">
                  {ADVANCE_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      type="button"
                      onClick={() => onUpdate({ advanceMinutes: opt.value })}
                      className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-all duration-200 ${
                        settings.advanceMinutes === opt.value
                          ? 'bg-accent text-white'
                          : 'bg-surface-elevated text-text-secondary hover:bg-accent/20'
                      }`}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Daily habit reminder */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">Recordatorio diario de hábitos</span>
              </div>
              <Toggle
                checked={settings.dailyHabitReminder}
                onChange={(v) => onUpdate({ dailyHabitReminder: v })}
              />
            </div>
            {settings.dailyHabitReminder && (
              <div className="ml-6">
                <label className="text-xs text-text-muted">Hora del recordatorio</label>
                <input
                  type="time"
                  value={settings.dailyHabitTime}
                  onChange={(e) => onUpdate({ dailyHabitTime: e.target.value })}
                  className="mt-1 block w-full max-w-[160px] px-3 py-2 text-sm rounded-xl bg-surface-elevated border border-border text-text-primary focus:outline-none focus:ring-2 focus:ring-accent"
                />
              </div>
            )}
          </div>

          <div className="h-px bg-border" />

          {/* Items with reminders */}
          {(visibleTasks.length > 0 || visibleEvents.length > 0 || (habits ?? []).length > 0) && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <ListChecks className="w-4 h-4 text-text-secondary" />
                <span className="text-sm font-medium text-text-primary">Notificar estos elementos</span>
              </div>

              {visibleTasks.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Tareas</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {visibleTasks.map((t) => {
                      const draft = taskDrafts[t.id] ?? {
                        when: t.reminderAt ? toLocalInput(t.reminderAt) : defaultWhen(),
                        msg: t.reminderMessage ?? '',
                      };
                      return (
                        <ItemRow
                          key={t.id}
                          kind="datetime"
                          title={t.title}
                          checked={!!t.reminderAt}
                          hasWhen
                          whenValue={draft.when}
                          onWhen={(v) => setTaskDrafts((s) => ({ ...s, [t.id]: { ...draft, when: v } }))}
                          messageValue={draft.msg}
                          onMessage={(v) => setTaskDrafts((s) => ({ ...s, [t.id]: { ...draft, msg: v } }))}
                          onToggle={(v) => {
                            if (!v) {
                              onUpdateTaskReminder?.(t.id, null, '');
                            } else {
                              onUpdateTaskReminder?.(t.id, fromLocalInput(draft.when), draft.msg);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {visibleEvents.length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Calendario</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {visibleEvents.map((ev) => {
                      const evDefault = (() => {
                        if (ev.reminderAt) return toLocalInput(ev.reminderAt);
                        const base = new Date(ev.dateKey + 'T00:00:00');
                        if (ev.time) {
                          const [hh, mm] = ev.time.split(':').map(Number);
                          base.setHours(hh, mm, 0, 0);
                        } else {
                          base.setHours(9, 0, 0, 0);
                        }
                        return toLocalInput(base);
                      })();
                      const draft = eventDrafts[ev.id] ?? {
                        when: evDefault,
                        msg: ev.reminderMessage ?? '',
                      };
                      return (
                        <ItemRow
                          key={ev.id}
                          kind="datetime"
                          title={ev.title}
                          checked={!!ev.reminderAt}
                          hasWhen
                          whenValue={draft.when}
                          onWhen={(v) => setEventDrafts((s) => ({ ...s, [ev.id]: { ...draft, when: v } }))}
                          messageValue={draft.msg}
                          onMessage={(v) => setEventDrafts((s) => ({ ...s, [ev.id]: { ...draft, msg: v } }))}
                          onToggle={(v) => {
                            if (!v) {
                              onUpdateEventReminder?.(ev.id, null, '');
                            } else {
                              onUpdateEventReminder?.(ev.id, fromLocalInput(draft.when), draft.msg);
                            }
                          }}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {(habits ?? []).length > 0 && (
                <div className="space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wide text-text-muted font-semibold">Hábitos</p>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {(habits ?? []).map((h) => (
                      <ItemRow
                        key={h.id}
                        kind="time"
                        title={h.name}
                        checked={!!h.reminderTime}
                        hasWhen
                        whenValue={h.reminderTime ?? ''}
                        onWhen={(v) => onUpdateHabitReminder?.(h.id, v || null)}
                        messageValue=""
                        onMessage={() => {}}
                        onToggle={(v) => onUpdateHabitReminder?.(h.id, v ? (h.reminderTime ?? '09:00') : null)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="h-px bg-border" />

          {/* Sound */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {settings.sound ? (
                <Volume2 className="w-4 h-4 text-text-secondary" />
              ) : (
                <VolumeX className="w-4 h-4 text-text-secondary" />
              )}
              <span className="text-sm font-medium text-text-primary">Sonido</span>
            </div>
            <Toggle checked={settings.sound} onChange={(v) => onUpdate({ sound: v })} />
          </div>
        </>
      )}
    </div>
  );
}

export function NotificationSettingsDialog(props: NotificationSettingsProps) {
  const { settings } = props;
  return (
    <Dialog>
      <DialogTrigger asChild>
        <button
          className="relative w-10 h-10 flex items-center justify-center rounded-xl transition-all duration-200"
          style={{
            background: 'var(--clay-btn-bg)',
            color: 'var(--clay-btn-text)',
            boxShadow: '0 1px 2px var(--clay-inset-top) inset, 0 -1px 2px var(--clay-inset-bottom) inset, var(--clay-shadow-ambient)',
            clipPath: 'polygon(4% 0%, 96% 0%, 100% 18%, 100% 82%, 96% 100%, 4% 100%, 0% 82%, 0% 18%)',
          }}
          aria-label="Configurar notificaciones"
        >
          <Bell className="w-4 h-4" aria-hidden="true" />
          {settings.enabled && (
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-accent animate-pulse" />
          )}
        </button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Configurar notificaciones</DialogTitle>
        </DialogHeader>
        <NotificationSettingsPanel {...props} />
        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Cerrar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
