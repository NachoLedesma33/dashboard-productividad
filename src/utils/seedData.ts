import { subDays, startOfDay } from 'date-fns';
import type { Task, Habit } from '@/types';
import { db } from '@/db/database';

function createDateWithHour(base: Date, hour: number): Date {
  const d = new Date(base);
  d.setHours(hour, 0, 0, 0);
  return d;
}

function subHours(date: Date, hours: number): Date {
  return new Date(date.getTime() - hours * 60 * 60 * 1000);
}

export async function seedDatabase(): Promise<void> {
  const today = new Date();
  const todayStart = startOfDay(today);

  const sampleTasks: Task[] = [
    {
      id: crypto.randomUUID(),
      title: 'Revisar emails importantes',
      priority: 'high',
      completed: true,
      completedAt: createDateWithHour(todayStart, 8),
      createdAt: subHours(createDateWithHour(todayStart, 8), 2),
    },
    {
      id: crypto.randomUUID(),
      title: 'Preparar presentación para reunión',
      priority: 'high',
      completed: true,
      completedAt: createDateWithHour(todayStart, 14),
      createdAt: subHours(createDateWithHour(todayStart, 14), 5),
    },
    {
      id: crypto.randomUUID(),
      title: 'Actualizar documentación del proyecto',
      priority: 'medium',
      completed: true,
      completedAt: createDateWithHour(todayStart, 21),
      createdAt: subHours(createDateWithHour(todayStart, 21), 3),
    },
    {
      id: crypto.randomUUID(),
      title: 'Revisar pull requests pendientes',
      priority: 'medium',
      completed: false,
      completedAt: null,
      createdAt: subDays(today, 1),
    },
    {
      id: crypto.randomUUID(),
      title: 'Organizar archivos del proyecto',
      priority: 'low',
      completed: false,
      completedAt: null,
      createdAt: today,
    },
  ];

  const sampleHabits: Habit[] = [
    {
      id: crypto.randomUUID(),
      name: 'Ejercicio matutino',
      completionDates: [],
    },
    {
      id: crypto.randomUUID(),
      name: 'Meditar 15 minutos',
      completionDates: [subDays(today, 1), subDays(today, 2), subDays(today, 3)],
    },
    {
      id: crypto.randomUUID(),
      name: 'Leer 30 minutos',
      completionDates: [
        subDays(today, 1),
        subDays(today, 2),
        subDays(today, 3),
        subDays(today, 4),
        subDays(today, 5),
        subDays(today, 6),
        subDays(today, 7),
      ],
    },
  ];

  await db.tasks.bulkPut(sampleTasks);
  await db.habits.bulkPut(sampleHabits);
}