import type { Task, Habit } from '@/types';

export const sampleTasks: Omit<Task, 'id' | 'createdAt' | 'completedAt'>[] = [
  { title: 'Revisar emails importantes', priority: 'high', completed: false },
  { title: 'Preparar presentación', priority: 'high', completed: true },
  { title: 'Actualizar documentación', priority: 'medium', completed: false },
  { title: 'Revisar código PR', priority: 'medium', completed: true },
  { title: 'Leer artículo de productividad', priority: 'low', completed: true },
  { title: 'Organizar archivos', priority: 'low', completed: false },
  { title: 'Reunión con equipo', priority: 'high', completed: false },
  { title: 'Enviar informe semanal', priority: 'medium', completed: true },
];

export const sampleHabits: Omit<Habit, 'id'>[] = [
  { name: 'Ejercicio matutino', completionDates: [] },
  { name: 'Meditar', completionDates: [] },
  { name: 'Leer 30 minutos', completionDates: [] },
  { name: 'Beber 2L de agua', completionDates: [] },
];

export function generateSampleTasks(count: number): Omit<Task, 'id'>[] {
  const tasks: Omit<Task, 'id'>[] = [];
  const priorities: Task['priority'][] = ['high', 'medium', 'low'];
  const titles = [
    'Completar proyecto',
    'Revisar documentos',
    'Enviar reporte',
    'Coordinar reunión',
    'Actualizar calendario',
    'Revisar presupuesto',
    'Preparar informe',
    'Organizar archivos',
  ];

  for (let i = 0; i < count; i++) {
    tasks.push({
      title: `${titles[i % titles.length]} #${i + 1}`,
      priority: priorities[i % priorities.length],
      completed: Math.random() > 0.5,
      completedAt: null,
      createdAt: new Date(),
    });
  }

  return tasks;
}