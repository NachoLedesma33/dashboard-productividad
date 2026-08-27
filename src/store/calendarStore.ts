import { create } from 'zustand';
import type { CalendarEvent, CalendarEventCategory } from '@/types';

const STORAGE_KEY = 'ritmo-calendar-events';

function loadEvents(): CalendarEvent[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as Array<Omit<CalendarEvent, 'createdAt'> & { createdAt: string }>;
    return parsed.map(e => ({ ...e, createdAt: new Date(e.createdAt) }));
  } catch {
    return [];
  }
}

function saveEvents(events: CalendarEvent[]) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
}

function dateToKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

interface CalendarState {
  events: CalendarEvent[];
  fetchEvents: () => void;
  addEvent: (title: string, dateKey: string, category: CalendarEventCategory, time?: string) => void;
  deleteEvent: (id: string) => void;
  updateEvent: (id: string, changes: Partial<Omit<CalendarEvent, 'id' | 'createdAt'>>) => void;
  getEventsForDate: (dateKey: string) => CalendarEvent[];
  getEventsForMonth: (year: number, month: number) => CalendarEvent[];
}

export const useCalendarStore = create<CalendarState>((set, get) => ({
  events: [],

  fetchEvents: () => {
    set({ events: loadEvents() });
  },

  addEvent: (title, dateKey, category, time) => {
    const event: CalendarEvent = {
      id: `cal-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      title,
      dateKey,
      category,
      time,
      createdAt: new Date(),
    };
    const updated = [...get().events, event];
    saveEvents(updated);
    set({ events: updated });
  },

  deleteEvent: (id) => {
    const updated = get().events.filter(e => e.id !== id);
    saveEvents(updated);
    set({ events: updated });
  },

  updateEvent: (id, changes) => {
    const updated = get().events.map(e => e.id === id ? { ...e, ...changes } : e);
    saveEvents(updated);
    set({ events: updated });
  },

  getEventsForDate: (dateKey) => {
    return get().events.filter(e => e.dateKey === dateKey);
  },

  getEventsForMonth: (year, month) => {
    const prefix = `${year}-${String(month + 1).padStart(2, '0')}`;
    return get().events.filter(e => e.dateKey.startsWith(prefix));
  },
}));

export { dateToKey };
