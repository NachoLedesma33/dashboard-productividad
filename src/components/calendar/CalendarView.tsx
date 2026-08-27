import { useState, useRef, useMemo, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import type { CalendarEvent, CalendarEventCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CATS: CalendarEventCategory[] = ['tarea', 'examen', 'medico', 'reunion', 'personal', 'otro'];
const C = { tarea: { l: 'T', c: '#c9956a' }, examen: { l: 'E', c: '#c47a6a' }, medico: { l: 'M', c: '#7aa87a' }, reunion: { l: 'R', c: '#8898a8' }, personal: { l: 'P', c: '#c4a060' }, otro: { l: 'O', c: '#a89888' } };

function getDM(y: number, m: number) { return new Date(y, m + 1, 0).getDate(); }
function getFD(y: number, m: number) { const d = new Date(y, m, 1).getDay(); return d === 0 ? 6 : d - 1; }
function isT(y: number, m: number, d: number) { const n = new Date(); return n.getFullYear() === y && n.getMonth() === m && n.getDate() === d; }
function isP(y: number, m: number, d: number) { const dt = new Date(y, m, d); dt.setHours(23, 59, 59, 999); const t = new Date(); t.setHours(0, 0, 0, 0); return dt < t; }

function DayCell({ day, year, month, events, onClick }: { day: number; year: number; month: number; events: CalendarEvent[]; onClick: () => void }) {
  const p = isP(year, month, day), t = isT(year, month, day);
  return (
    <button
      type="button"
      onClick={onClick}
      className={`relative w-full h-[56px] rounded flex flex-col items-center justify-center cursor-pointer hover:bg-[var(--clay-accent-soft)] ${p ? 'opacity-40' : ''} ${t ? 'ring-1 ring-[var(--clay-accent)]' : ''}`}
      style={{ background: t ? 'var(--clay-accent-soft)' : 'var(--clay-surface)' }}
    >
      <span className={`text-sm font-semibold leading-none ${p ? 'text-text-muted' : t ? 'text-accent' : 'text-text-primary'}`}>{day}</span>
      {events.length > 0 && !p && (
        <div className="flex gap-0.5 mt-1">
          {events.slice(0, 3).map(e => (
            <div key={e.id} className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: C[e.category].c }} />
          ))}
        </div>
      )}
      {p && (
        <svg className="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 40 40">
          <line x1="10" y1="10" x2="30" y2="30" stroke="var(--clay-error)" strokeWidth="2.5" strokeLinecap="round" />
          <line x1="30" y1="10" x2="10" y2="30" stroke="var(--clay-error)" strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      )}
    </button>
  );
}

function AddEventForm({ dateKey }: { dateKey: string }) {
  const [title, setTitle] = useState(''), [cat, setCat] = useState<CalendarEventCategory>('personal');
  const ref = useRef<HTMLButtonElement>(null);
  const add = useCalendarStore(s => s.addEvent);
  const [d, m, y] = dateKey.split('-');
  const handle = (e: React.FormEvent) => { e.preventDefault(); if (title.trim()) { add(title.trim(), dateKey, cat); ref.current?.click(); } };
  return (
    <form onSubmit={handle} className="space-y-2">
      <p className="text-xs text-text-secondary text-center font-medium">{parseInt(d)} de {MONTH_NAMES[parseInt(m) - 1]} {y}</p>
      <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Evento" autoFocus className="h-7 text-xs" />
      <div className="flex flex-wrap gap-1">
        {CATS.map(c => (
          <button key={c} type="button" onClick={() => setCat(c)} className={`px-1.5 py-0.5 text-[10px] rounded border ${cat === c ? 'bg-accent text-white border-transparent' : 'border-border text-text-secondary'}`}>{C[c].l}</button>
        ))}
      </div>
      <div className="flex gap-2 justify-end">
        <DialogClose asChild ref={ref}><Button variant="outline" type="button" className="h-6 text-[10px]">Cancelar</Button></DialogClose>
        <Button type="submit" variant="ghost" className="h-6 text-[10px]">Agregar</Button>
      </div>
    </form>
  );
}

export function CalendarView() {
  const n = new Date(), [y, setY] = useState(n.getFullYear()), [m, setM] = useState(n.getMonth()), [ad, setAd] = useState<string | null>(null);
  const { events, fetchEvents } = useCalendarStore();
  useEffect(() => { fetchEvents(); }, [fetchEvents]);
  const dm = getDM(y, m), fd = getFD(y, m);
  const me = useMemo(() => events.filter(e => { const d = new Date(e.dateKey); return d.getFullYear() === y && d.getMonth() === m; }), [events, y, m]);
  const ebd = useMemo(() => { const o: Record<number, CalendarEvent[]> = {}; me.forEach(e => { const d = parseInt(e.dateKey.split('-')[2]); (o[d] ||= []).push(e); }); return o; }, [me]);
  const prev = () => setM(c => c === 0 ? (setY(p => p - 1), 11) : c - 1);
  const next = () => setM(c => c === 11 ? (setY(p => p + 1), 0) : c + 1);
  const today = () => { const x = new Date(); setY(x.getFullYear()); setM(x.getMonth()); };

  return (
    <div className="flex flex-col w-full">
      <div className="flex items-center justify-between mb-0.5">
        <div className="flex items-center gap-1">
          <Calendar className="w-3.5 h-3.5 text-accent" />
          <h2 className="text-[11px] font-bold text-text-primary">Calendario</h2>
        </div>
        <div className="flex items-center gap-1.5">
          <button onClick={prev} className="w-5 h-5 rounded bg-surface-elevated hover:text-accent flex items-center justify-center" aria-label="Ant">
            <ChevronLeft className="w-3 h-3" />
          </button>
          <span className="text-[11px] font-bold font-display text-text-primary">{MONTH_NAMES[m]} {y}</span>
          {!isT(y, m, 1) && <button onClick={today} className="text-[9px] text-accent px-1 py-px rounded bg-accent-soft">Hoy</button>}
          <button onClick={next} className="w-5 h-5 rounded bg-surface-elevated hover:text-accent flex items-center justify-center" aria-label="Sig">
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px mb-px">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-semibold py-0.5 ${i >= 5 ? 'text-priority-medium/70' : 'text-text-muted'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {[...Array(fd)].map((_, i) => <div key={i} />)}
        {[...Array(dm)].map((_, i) => (
          <DayCell key={i} day={i + 1} year={y} month={m} events={ebd[i + 1] || []} onClick={() => setAd(`${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-0.5 mt-1 pt-1 border-t border-border/30">
        {CATS.map(c => (
          <div key={c} className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: C[c].c }} />
            <span className="text-[10px] text-text-muted">{C[c].l}</span>
          </div>
        ))}
      </div>
      <Dialog open={!!ad} onOpenChange={o => !o && setAd(null)}>
        <DialogContent className="sm:max-w-xs">
          <DialogHeader><DialogTitle className="text-sm">Nuevo evento</DialogTitle></DialogHeader>
          {ad && <AddEventForm dateKey={ad} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
