import { useState } from 'react';
import type { NotificationSettings } from '@/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Bell, BellOff, Clock, CalendarDays, Volume2, VolumeX } from 'lucide-react';

interface NotificationSettingsProps {
  settings: NotificationSettings;
  permission: NotificationPermission;
  isSupported: boolean;
  onUpdate: (partial: Partial<NotificationSettings>) => void;
  onEnable: () => Promise<NotificationPermission>;
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

export function NotificationSettingsPanel({
  settings,
  permission,
  isSupported,
  onUpdate,
  onEnable,
}: NotificationSettingsProps) {
  const [enableLoading, setEnableLoading] = useState(false);

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

export function NotificationSettingsDialog({
  settings,
  permission,
  isSupported,
  onUpdate,
  onEnable,
}: NotificationSettingsProps) {
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
        <NotificationSettingsPanel
          settings={settings}
          permission={permission}
          isSupported={isSupported}
          onUpdate={onUpdate}
          onEnable={onEnable}
        />
        <div className="flex justify-end pt-2">
          <DialogClose asChild>
            <Button variant="ghost" size="sm">Cerrar</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  );
}
