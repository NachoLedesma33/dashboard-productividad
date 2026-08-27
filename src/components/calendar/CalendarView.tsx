import { useState, useMemo, useEffect } from 'react';
import { useCalendarStore } from '@/store/calendarStore';
import type { CalendarEvent, CalendarEventCategory } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogClose } from '@/components/ui/dialog';

const WEEKDAYS = ['Lu', 'Ma', 'Mi', 'Ju', 'Vi', 'Sa', 'Do'];
const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const CATS: CalendarEventCategory[] = ['tarea', 'examen', 'medico', 'reunion', 'personal', 'otro'];
const C = { tarea: { l: 'T', name: 'Tarea', c: '#c9956a' }, examen: { l: 'E', name: 'Examen', c: '#c47a6a' }, medico: { l: 'M', name: 'Médico', c: '#7aa87a' }, reunion: { l: 'R', name: 'Reunión', c: '#8898a8' }, personal: { l: 'P', name: 'Personal', c: '#c4a060' }, otro: { l: 'O', name: 'Otro', c: '#a89888' } };

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

function DayDialog({ dateKey }: { dateKey: string }) {
  const [title, setTitle] = useState(''), [cat, setCat] = useState<CalendarEventCategory>('personal');
  const [editing, setEditing] = useState<string | null>(null), [editTitle, setEditTitle] = useState(''), [editCat, setEditCat] = useState<CalendarEventCategory>('personal');
  const { events, addEvent, deleteEvent, updateEvent } = useCalendarStore();
  const [d, m, y] = dateKey.split('-');
  const dayEvents = useMemo(() => events.filter(e => e.dateKey === dateKey), [events, dateKey]);

  const handleAdd = (e: React.FormEvent) => { e.preventDefault(); if (title.trim()) { addEvent(title.trim(), dateKey, cat); setTitle(''); setCat('personal'); } };
  const handleDelete = (id: string) => { deleteEvent(id); };
  const startEdit = (ev: CalendarEvent) => { setEditing(ev.id); setEditTitle(ev.title); setEditCat(ev.category); };
  const saveEdit = () => { if (editing && editTitle.trim()) { updateEvent(editing, { title: editTitle.trim(), category: editCat }); setEditing(null); } };
  const cancelEdit = () => { setEditing(null); };

  return (
    <div className="space-y-3">
      <p className="text-xs text-text-secondary text-center font-medium">{parseInt(d)} de {MONTH_NAMES[parseInt(m) - 1]} {y}</p>

      {dayEvents.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {dayEvents.map(ev => (
            <div key={ev.id} className="flex items-center gap-2 p-1.5 rounded bg-surface-elevated">
              <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: C[ev.category].c }} />
              {editing === ev.id ? (
                <div className="flex-1 flex flex-col gap-1">
                  <Input value={editTitle} onChange={e => setEditTitle(e.target.value)} className="h-6 text-[11px]" autoFocus />
                  <div className="flex gap-1 flex-wrap">
                    {CATS.map(c => (
                      <button key={c} type="button" onClick={() => setEditCat(c)} className={`px-1.5 py-0.5 text-[9px] rounded border ${editCat === c ? 'bg-accent text-white border-transparent' : 'border-border text-text-secondary'}`}>{C[c].name}</button>
                    ))}
                  </div>
                  <div className="flex gap-1 justify-end">
                    <Button variant="outline" onClick={cancelEdit} className="h-5 text-[9px]">Cancelar</Button>
                    <Button variant="ghost" onClick={saveEdit} className="h-5 text-[9px]">Guardar</Button>
                  </div>
                </div>
              ) : (
                <>
                  <span className="flex-1 text-[11px] text-text-primary truncate">{ev.title}</span>
                  <button onClick={() => startEdit(ev)} className="text-[9px] text-accent hover:underline">Editar</button>
                  <button onClick={() => handleDelete(ev.id)} className="text-[9px] text-[var(--clay-error)] hover:underline">Borrar</button>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleAdd} className="space-y-2 border-t border-border/30 pt-2">
        <p className="text-[10px] text-text-muted font-medium">Agregar nuevo</p>
        <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Evento" autoFocus className="h-7 text-xs" />
        <div className="flex flex-wrap gap-1">
          {CATS.map(c => (
            <button key={c} type="button" onClick={() => setCat(c)} className={`px-2 py-1 text-[11px] rounded border ${cat === c ? 'bg-accent text-white border-transparent' : 'border-border text-text-secondary'}`}>{C[c].name}</button>
          ))}
        </div>
        <div className="flex gap-2 justify-end">
          <DialogClose asChild><Button variant="outline" type="button" className="h-6 text-[10px]">Cerrar</Button></DialogClose>
          <Button type="submit" variant="ghost" className="h-6 text-[10px]">Agregar</Button>
        </div>
      </form>
    </div>
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
    <div className="flex flex-col w-full pt-1">
      <div className="flex items-center justify-between mb-1.5">
        <div className="flex items-center gap-1.5">
          <Calendar className="w-4 h-4 text-accent" />
          <h2 className="text-xs font-bold text-text-primary">Calendario</h2>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={prev} className="w-6 h-6 rounded bg-surface-elevated hover:text-accent flex items-center justify-center" aria-label="Ant">
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <span className="text-xs font-bold font-display text-text-primary">{MONTH_NAMES[m]} {y}</span>
          {!isT(y, m, 1) && <button onClick={today} className="text-[10px] text-accent px-1.5 py-0.5 rounded bg-accent-soft">Hoy</button>}
          <button onClick={next} className="w-6 h-6 rounded bg-surface-elevated hover:text-accent flex items-center justify-center" aria-label="Sig">
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 gap-px mb-1">
        {WEEKDAYS.map((d, i) => (
          <div key={d} className={`text-center text-[10px] font-semibold py-1 ${i >= 5 ? 'text-priority-medium/70' : 'text-text-muted'}`}>{d}</div>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-px">
        {[...Array(fd)].map((_, i) => <div key={i} />)}
        {[...Array(dm)].map((_, i) => (
          <DayCell key={i} day={i + 1} year={y} month={m} events={ebd[i + 1] || []} onClick={() => setAd(`${y}-${String(m + 1).padStart(2, '0')}-${String(i + 1).padStart(2, '0')}`)} />
        ))}
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2 pt-2 border-t border-border/30">
        {CATS.map(c => (
          <div key={c} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: C[c].c }} />
            <span className="text-[11px] text-text-muted">{C[c].name}</span>
          </div>
        ))}
      </div>
      <Dialog open={!!ad} onOpenChange={o => !o && setAd(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader><DialogTitle className="text-sm">Eventos del día</DialogTitle></DialogHeader>
          {ad && <DayDialog dateKey={ad} />}
        </DialogContent>
      </Dialog>
    </div>
  );
}
