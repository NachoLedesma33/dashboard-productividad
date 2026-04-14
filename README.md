# Dashboard de Productividad

Una aplicación web moderna para gestionar tareas y hábitos personales, con análisis inteligente de productividad e interfaz glassmorphism completamente offline.

---

## ✨ Características principales

### 📋 Gestión de Tareas (Kanban)
- Tablero Kanban con **3 columnas de prioridad**: Alta, Media y Baja
- **Arrastrar y soltar** (drag & drop) para mover tareas entre columnas usando `@dnd-kit`
- Crear tareas directamente desde cada columna con input inline
- Marcar tareas como completadas con checkbox personalizado
- Cambiar la prioridad de una tarea desde un dropdown compacto
- Eliminar tareas con botón que aparece al hacer hover
- Persistencia automática en base de datos local (IndexedDB)

### 🎯 Seguimiento de Hábitos
- Agregar hábitos personales ilimitados
- Marcar hábitos completados por día (toggle)
- **Calendario semanal** que muestra el historial de la semana actual
- Contador de **racha activa** (días consecutivos completados)
- Cálculo automático de racha actual y mejor racha histórica
- Persistencia local: los datos sobreviven recargas del navegador

### 📊 Gráfico de Productividad
- Gráfico de barras con las **tareas completadas en los últimos 7 días**
- Visualización interactiva con tooltips por día
- Construido con `recharts` + `ResponsiveContainer`

### 💡 Motor de Insights
Análisis automático de patrones de productividad basado en datos reales:

| Insight | Condición |
|---|---|
| 🌅 Productividad matutina | +60% de tareas completadas entre 6h y 12h |
| 🌙 Productividad nocturna | +60% de tareas completadas entre 18h y 24h |
| 📈 Mejor día de la semana | Detecta el día con más tareas completadas (mín. 3) |
| ⚠️ Demora en tareas importantes | Tareas de alta prioridad tardaron +2 días en completarse |
| 🔥 Excelente racha | Hábito con racha histórica mayor a 5 días |

---

## 🏗️ Arquitectura

```
src/
├── components/
│   ├── charts/
│   │   └── ProductivityChart.tsx   # Gráfico de barras últimos 7 días
│   ├── habits/
│   │   └── HabitTracker.tsx        # Lista de hábitos + calendario semanal
│   ├── tasks/
│   │   └── TaskBoard.tsx           # Board Kanban con DnD
│   └── ui/
│       ├── InsightsPanel.tsx       # Panel de insights automáticos
│       └── TaskCard.tsx            # Tarjeta individual de tarea
├── db/
│   ├── database.ts                 # Configuración Dexie + operaciones CRUD
│   └── sampleData.ts               # Datos de ejemplo
├── hooks/
│   └── useDatabase.ts              # Hook para inicialización y reset de DB
├── store/
│   ├── taskStore.ts                # Store Zustand para tareas
│   └── habitStore.ts               # Store Zustand para hábitos
├── types/
│   └── index.ts                    # Tipos TypeScript (Task, Habit, Priority)
├── utils/
│   ├── analytics/
│   │   └── insightsEngine.ts       # Motor de análisis de productividad
│   └── seedData.ts                 # Cargador de datos demo
├── App.tsx                         # Layout principal y composición
├── App.css                         # Estilos de botones y spinner
├── index.css                       # Tokens de diseño, glassmorphism, animaciones
└── main.tsx                        # Entry point React
```

---

## 🛠️ Stack tecnológico

| Categoría | Tecnología | Versión |
|---|---|---|
| Framework | React | 19 |
| Lenguaje | TypeScript | ~6.0 |
| Build tool | Vite | 8 |
| Estilos | Tailwind CSS | 4 |
| Plugin Tailwind | @tailwindcss/vite | 4 |
| Estado global | Zustand | 5 |
| Base de datos | Dexie (IndexedDB) | 4 |
| Drag & Drop | @dnd-kit/core + sortable | 6/10 |
| Gráficos | Recharts | 3 |
| Fechas | date-fns | 4 |

---

## 💾 Persistencia de datos

La aplicación usa **IndexedDB** a través de **Dexie.js** como base de datos del lado del cliente. Toda la información se almacena localmente en el navegador sin necesidad de un servidor backend.

### Esquema de base de datos

```ts
// Base de datos: 'productivity-db' (versión 1)

// Tabla: tasks
interface Task {
  id: string;          // UUID generado con crypto.randomUUID()
  title: string;
  priority: 'low' | 'medium' | 'high';
  completed: boolean;
  completedAt: Date | null;
  createdAt: Date;
}

// Tabla: habits
interface Habit {
  id: string;          // UUID generado con crypto.randomUUID()
  name: string;
  completionDates: Date[];  // Historial completo de días completados
}
```

### Índices
- `tasks`: indexado por `id`, `priority`, `completedAt`
- `habits`: indexado por `id`

---

## 🗂️ Estado global (Zustand)

### `useTaskStore`
```ts
fetchTasks()                           // Carga tareas desde IndexedDB
addTask(title, priority)               // Crea y persiste una nueva tarea
toggleTask(id)                         // Completa / descompleta una tarea
updatePriority(id, priority)           // Cambia la prioridad de una tarea
deleteTask(id)                         // Elimina una tarea
reorderTasks(tasks)                    // Reordena tareas tras DnD
```

### `useHabitStore`
```ts
fetchHabits()                          // Carga hábitos desde IndexedDB
addHabit(name)                         // Crea y persiste un nuevo hábito
toggleHabit(id)                        // Marca / desmarca el hábito hoy
getTodayStatus(id)  → boolean          // ¿Fue completado hoy?
getStreak(id)       → number           // Racha actual (días consecutivos)
getBestStreak(id)   → number           // Mejor racha histórica
```

> En modo desarrollo ambos stores emiten logs por consola en cada actualización de estado.

---

## 🎨 Sistema de diseño

### Paleta de colores

| Uso | Color |
|---|---|
| Acento principal | Violeta `#8b5cf6` |
| Acento hover | Violeta oscuro `#7c3aed` |
| Gradiente acento | `from-violet-500 to-pink-500` |
| Prioridad Alta | Rojo `red-500` |
| Prioridad Media | Ámbar `amber-400` |
| Prioridad Baja | Gris `slate-400` |
| Hábito completado | Esmeralda `emerald-500` |

### Glassmorphism

La clase `.glass` aplica el efecto en modo claro y oscuro:

```css
/* Claro */
background: rgba(255, 255, 255, 0.85);
backdrop-filter: blur(10px);
border: 1px solid rgba(255, 255, 255, 0.2);

/* Oscuro */
background: rgba(30, 41, 59, 0.85);
border: 1px solid rgba(255, 255, 255, 0.1);
```

### Animaciones disponibles

| Clase | Efecto |
|---|---|
| `animate-slide-in` | Aparece subiendo desde abajo (0.6s) |
| `animate-fade-in` | Aparece con fade + translateY (0.4s) |
| `animate-pulse-slow` | Pulso de opacidad suave (2s loop) |

### Tema claro / oscuro
Se activa automáticamente según la preferencia del sistema operativo (`prefers-color-scheme`). No requiere toggle manual.

---

## 🚀 Instalación y uso

### Requisitos
- Node.js 18+
- npm 9+

### Pasos

```bash
# Clonar el repositorio
git clone <url-del-repo>
cd dashboard-productividad

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`.

### Scripts disponibles

| Comando | Descripción |
|---|---|
| `npm run dev` | Servidor de desarrollo con HMR |
| `npm run build` | Compilación para producción (`tsc + vite build`) |
| `npm run preview` | Preview del build de producción |
| `npm run lint` | Linting con ESLint |

### Datos de demo
Dentro de la aplicación, el botón **"Cargar datos demo"** en el header limpia la base de datos y carga un conjunto de tareas y hábitos de ejemplo para explorar todas las funcionalidades.

---

## 📐 Responsive

| Breakpoint | Comportamiento |
|---|---|
| Mobile (`< md`) | Columnas Kanban en stack vertical |
| Tablet (`md`) | Columnas Kanban en fila horizontal |
| Desktop (`xl`) | Tasks ocupa 2/3, Habits ocupa 1/3 |
| Ultra-wide | Layout fijo a `max-w-7xl` centrado |

---

## 🔧 Configuración del proyecto

### `vite.config.ts`
```ts
plugins: [react(), tailwindcss()]  // Plugin nativo de TW v4 para Vite
resolve: { alias: { '@': './src' } }  // Alias de paths
```

### `tsconfig.app.json`
- Target: ES2020
- Paths alias `@/*` → `./src/*`
- Strict mode habilitado

---

## 📁 Convenciones del código

- **Componentes**: PascalCase, archivos `.tsx`
- **Stores**: camelCase con prefijo `use`, archivos `.ts`
- **Tipos**: interfaces en `src/types/index.ts`
- **Imports**: path alias `@/` para evitar rutas relativas largas
- **Estado**: nunca mutación directa; siempre a través del store Zustand
- **DB**: todas las operaciones de IndexedDB centralizadas en `src/db/database.ts`
