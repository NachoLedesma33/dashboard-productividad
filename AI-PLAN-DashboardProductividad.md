# Plan de Integración IA — Dashboard Productividad (Zero-Cost)

## Principio

100% gratis, sin APIs externas. Scoring ponderado, reglas, estadística.
Nada de LLMs, nada de tokens, nada de llamadas externas.

---

## Fase 0 — Alineación de Modelo de Datos

### Problema

Los módulos del plan original asumen campos que **no existen** en el modelo actual:

| Campo asumido | Módulo | ¿Existe hoy? |
|---------------|--------|-------------|
| `dueDate` | Scoring, Predictivo | ❌ |
| `estimatedHours` | Scoring, Pomodoro | ❌ |
| `type` (creative/deep/admin) | Scoring, Pomodoro | ❌ |
| `dependencies` | Scoring | ❌ |
| `tags` | Scoring | ❌ |
| `status` (pending/done) | Scoring | ❌ (`completed: boolean`) |
| `userProfile.peakHours` | Scoring, Pomodoro | ❌ |
| `context.mood` | Coach | ❌ |
| `PomodoroProfile.avgFocusTime` | Pomodoro | ❌ |
| `WeeklyHistory` / `projects` | Predictivo, Reporte | ❌ |

### Decisión

Para mantener el plan realista y evitable extender el modelo sin uso inmediato, cada
módulo se adaptará para operar **exclusivamente sobre los datos que ya existen**:
`Task` (id, title, priority, completed, completedAt, createdAt, recurringDays),
`Habit` (id, name, completionDates), `CompletionLogEntry` (taskId, dateKey, createdAt).
Si en el futuro se agregan nuevos campos, los algoritmos se extienden sin romper lo
existente.

### Estrategia de integración al bundle

Todos los módulos son funciones puras sin UI → se colocan en `src/utils/ai/` y se
importan dinámicamente (como ya se hace con `insightsEngine.ts`). Cada uno pesa
~2-3 KB y se lazy-loadea solo cuando se necesita.

**Eager (siempre cargado):** Ninguno.
**Lazy (bajo demanda):** scoring → al abrir "Plan del día"; coach → al abrir Insights;
predictor + reporte → al generar reporte semanal.

---

## 1. Priorización Inteligente (Scoring Ponderado de Tareas)

### Estrategia
Sin LLM. **Algoritmo de scoring** que evalúa cada tarea con múltiples factores
ponderados. Similar a cómo funciona el motor de priorización de ElasticSearch.

### Adaptación al modelo actual

Los factores se calculan sobre campos existentes en lugar de los asumidos:

| Factor original | Adaptación |
|----------------|------------|
| `urgency` (dueDate) | Se usa `priority` (high=1.0, medium=0.6, low=0.3) como proxy de urgencia. |
| `effort` (estimatedHours) | Se omite (no tenemos ese dato). Peso redistribuido. |
| `dependencies` | Se omite. Peso redistribuido. |
| `energyMatch` (task.type) | Se omite. Peso redistribuido. |
| `consistency` (history) | Se calcula desde `completedAt` en `completionLog`: tareas que el usuario postergó reciben menor score. |
| `goalAlignment` (tags) | Se omite o se usa `recurringDays` como proxy de compromiso. |

### Pesos ajustados

```typescript
const weights = {
  urgency:     0.50,   // Antes 0.35 — absorbedó peso de factores omitidos
  consistency: 0.30,   // Antes 0.10 — más relevante sin otros factores
  recurring:   0.20,   // NUEVO — tareas con recurrencia tienen más prioridad
}
```

### Implementación
```typescript
// TaskPrioritizer.ts — ~2KB
function scoreTask(task: Task, context: Context): number {
  const factors = {
    urgency: scoreUrgency(task.priority),
    consistency: scoreConsistency(task.id, context.recentLogs),
    recurring: task.recurringDays?.length ? 1.2 : 1.0,
  }

  const weights = {
    urgency: 0.50,
    consistency: 0.30,
    recurring: 0.20,
  }

  return Object.entries(factors)
    .reduce((score, [key, value]) => score + value * weights[key], 0)
}

function scoreUrgency(priority: 'high' | 'medium' | 'low'): number {
  if (priority === 'high')   return 1.0
  if (priority === 'medium') return 0.6
  return 0.3
}

function scoreConsistency(taskId: string, logs: CompletionLogEntry[]): number {
  // Si la tarea se completó ayer pero no hoy → 0.7 (moderada consistencia)
  // Si nunca se completó → 0.5
  // Si se completó hoy → 1.0
  const today = formatDateKey(new Date())
  const yesterday = formatDateKey(subDays(new Date(), 1))
  const completedToday = logs.some(l => l.taskId === taskId && l.dateKey === today)
  const completedYesterday = logs.some(l => l.taskId === taskId && l.dateKey === yesterday)
  if (completedToday) return 1.0
  if (completedYesterday) return 0.7
  return 0.5
}
```

**Nota:** `generateReason` y `generateSummary` no están definidos en el plan original.
Se implementarán como helpers internos que traducen el score a texto legible
(ej. "Alta urgencia + consistente").

### Costo de tokens
**Cero**.

---

## 2. Coach de Hábitos (Reglas + Estadísticas de Rachas)

### Estrategia
Sin LLM. **Máquina de estados para hábitos + estadísticas descriptivas**:

### Adaptación al modelo actual

- `h.streak` → se calcula sobre la marcha desde `completionDates` (ya lo hacemos en `habitStore.ts`)
- `h.completedDays` → se deriva de `completionDates` (array de timestamps). Se transforma a
  array de 0/1 por día para el cálculo de `weeklyRate`.
- `context.mood` → no existe. Esa regla se omite o se agrega en el futuro si se implementa
  un registro de estado de ánimo.
- `h.createdDaysAgo` → se calcula desde el primer `completionDate` o desde la fecha actual
  (no tenemos `createdAt` en Habit; se infiere).

### Implementación
```typescript
// HabitCoach.ts — ~2KB
function analyzeHabits(habits: Habit[], logs: CompletionLogEntry[]): HabitFeedback[] {
  return habits.map(h => {
    const feedback: HabitFeedback = { habit: h.name, messages: [] }
    const streak = calculateStreak(h.completionDates, isTodayCompleted(h))
    const completedDays = h.completionDates.map(d => {
      const date = new Date(d)
      date.setHours(0, 0, 0, 0)
      return date.getTime()
    })

    // Regla 1: Racha
    if (streak >= 21) {
      feedback.messages.push({ type: 'praise', text: `🔥 ${streak} días! Hábito consolidado.` })
    } else if (streak >= 7) {
      feedback.messages.push({ type: 'praise', text: `💪 ${streak} días! Ya es rutina.` })
    } else if (streak >= 3) {
      feedback.messages.push({ type: 'encourage', text: `Bien! Llevás ${streak} días seguidos.` })
    } else if (streak === 0 && completedDays.length > 0) {
      feedback.messages.push({ type: 'encourage', text: `Retomá el hábito! Ya lo hiciste antes.` })
    }

    // Regla 2: Consistencia semanal
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const last7 = Array.from({ length: 7 }, (_, i) => {
      const d = new Date(today)
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      return d.getTime()
    })
    const completedLast7 = last7.filter(day => completedDays.includes(day)).length
    const weeklyRate = completedLast7 / 7
    if (weeklyRate < 0.3) {
      feedback.messages.push({
        type: 'tip',
        text: `Esta semana solo ${Math.round(weeklyRate * 100)}%. Probá reducir la duración.`,
      })
    }

    // Regla 3: Sobrecarga de hábitos nuevos (inferido)
    const recentCount = habits.filter(h2 =>
      h2.completionDates.length <= 3
    ).length
    if (h.completionDates.length <= 3 && recentCount > 3) {
      feedback.messages.push({
        type: 'warning',
        text: `Estás empezando varios hábitos nuevos. Concentrate en 1-2 primero.`,
      })
    }

    return feedback
  })
}
```

### Integración UI
El coach se integra dentro del panel de **Insights** existente. No requiere componente
nuevo — solo un card adicional que muestre los mensajes del coach.

### Costo de tokens
**Cero**.

---

## 3. Pomodoro Adaptativo (Reglas + Historial)

### ⚠️ Nota de alcance

Este módulo tiene un **costo de UI significativo** que el plan original no refleja.
No es solo el algoritmo (~2 KB de lógica) — requiere:

- Componente de timer visual con cuenta regresiva (minutos:segundos)
- Notificación por audio al completar ciclo (Web Audio API o archivo)
- Botones de play/pausa/saltar
- Estado global del timer (Zustand store nueva o estado local elevado)
- Persistencia de sesiones completadas en Dexie (`pomodoroSession` table)
- Cálculo de `avgFocusTime` a partir de sesiones reales

**Estimación realista:** ~4-5 días (no 2).

### Estrategia
Sin LLM. **Ajuste dinámico basado en el historial del usuario**:

```typescript
// SmartPomodoro.ts — ~2KB (solo lógica, sin UI)
function calculatePomodoro(sessions: PomodoroSession[]): PomodoroConfig {
  const defaults = { focus: 25, break: 5, cycles: 4 }

  const avgFocusTime = sessions.length > 0
    ? Math.round(sessions.reduce((s, x) => s + x.focusDuration, 0) / sessions.length)
    : defaults.focus

  const breakTime = Math.round(avgFocusTime * 0.2)
  const finalFocus = Math.min(avgFocusTime, 55)

  return {
    focusDuration: finalFocus,
    breakDuration: Math.round(finalFocus * 0.2),
    cycles: Math.min(Math.floor((4 * (finalFocus + breakTime)) / (finalFocus + breakTime)), 6),
    reasoning: `Basado en tus ${sessions.length} sesiones anteriores: ${finalFocus} min óptimos.`,
  }
}
```

### Costo de tokens
**Cero**.

---

## 4. Análisis Predictivo (Estadística + Tendencias)

### Estrategia
Sin LLM. **Promedios móviles + detección de tendencias** operando sobre
`completionLog` (datos que ya existen).

### Alcance acotado al modelo actual

Se eliminan las referencias a `WeeklyHistory`, `projects`, `checkProjectDeadlines`
(no existen). Se trabaja directamente con `completionLog`:

- Tendencia semanal de tareas completadas (últimas 4 semanas)
- Día de la semana más/menos productivo
- Predicción simple para la próxima semana

```typescript
// ProductivityPredictor.ts — ~2KB
function predictWeek(logs: CompletionLogEntry[]): WeeklyPrediction {
  // Agrupar completados por semana (últimas 4)
  const weeks = aggregateByWeek(logs).slice(-4)

  // Promedio ponderado (más peso a la última semana)
  const weights = weeks.length === 4 ? [0.1, 0.2, 0.3, 0.4]
    : weeks.map((_, i) => (i + 1) / weeks.reduce((s, _, j) => s + j + 1, 0))
  const predictedTasks = Math.round(
    weeks.reduce((sum, w, i) => sum + w.count * weights[i], 0)
  )

  // Tendencia (regresión lineal simple)
  const counts = weeks.map(w => w.count)
  const slope = linearRegressionSlope(counts)
  const trendDirection = slope > 0.5 ? 'up'
    : slope < -0.5 ? 'down'
    : 'stable'

  // Día de la semana más/menos productivo
  const dayScores = aggregateByDayOfWeek(logs)
  const bestDay = dayScores.indexOf(Math.max(...dayScores))
  const worstDay = dayScores.indexOf(Math.min(...dayScores))
  const dayNames = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb']

  return {
    predictedTasks,
    trendDirection,
    bestDay: { day: dayNames[bestDay], score: dayScores[bestDay] },
    worstDay: { day: dayNames[worstDay], score: dayScores[worstDay] },
    insight: trendDirection === 'up'
      ? 'Vas en ascenso! Mejorando semana a semana.'
      : trendDirection === 'down'
      ? 'Últimas semanas bajaron. Revisá si hay algo externo afectando.'
      : 'Manteniendo ritmo constante. Buen trabajo!',
  }
}

function linearRegressionSlope(values: number[]): number {
  const n = values.length
  if (n < 2) return 0
  const xMean = (n - 1) / 2
  const yMean = values.reduce((a, b) => a + b, 0) / n
  let num = 0, den = 0
  for (let i = 0; i < n; i++) {
    num += (i - xMean) * (values[i] - yMean)
    den += (i - xMean) ** 2
  }
  return den === 0 ? 0 : num / den
}

function aggregateByDayOfWeek(logs: CompletionLogEntry[]): number[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]
  for (const log of logs) {
    const day = new Date(log.dateKey).getDay()
    counts[day]++
  }
  return counts
}

function aggregateByWeek(logs: CompletionLogEntry[]): { weekStart: string; count: number }[] {
  // Agrupa por ISO week; implementación estándar con getWeekStart helper
}
```

### Integración UI
Los resultados se muestran como un card adicional en el panel de **Insights**, justo
debajo del coach de hábitos. No requiere pantalla nueva.

### Costo de tokens
**Cero**.

---

## 5. Reporte Semanal Automático (Templates Narrativos)

### Estrategia
Sin LLM. **Template con placeholders** que se llenan con datos reales de la semana:

```typescript
// WeeklyReport.ts — ~2KB
function generateReport(data: WeeklyData): string {
  const rate = data.totalTasks > 0
    ? Math.round((data.completedTasks / data.totalTasks) * 100)
    : 0
  const habitsRate = data.totalHabits > 0
    ? Math.round(data.completedHabits / data.totalHabits * 100)
    : 0
  const prevRate = data.previousWeekRate ?? rate
  const trend = rate - prevRate

  return `
🏆 Reporte de Productividad - Semana ${data.weekNumber}

Resumen:
- Tareas: ${data.completedTasks}/${data.totalTasks} (${rate}% - ${trend > 0 ? '+' : ''}${trend}% vs semana pasada)
- Hábitos: ${habitsRate}% de cumplimiento
- Mejor día: ${data.bestDay} (${data.bestDayCount} tareas)
- Día más bajo: ${data.worstDay} (${data.worstDayCount} tareas)

${trend > 5 ? '✅ Mejoraste vs la semana pasada. Buen ritmo!'
  : trend < -5 ? '📉 Bajó un poco. Revisá qué pasó esta semana.'
  : '📊 Manteniendo consistencia.'}

Top recomendación:
${data.weakHabit
  ? `Enfocate en mantener "${data.weakHabit}" consistente esta semana.`
  : 'Definí 3 objetivos claros para arrancar la semana.'}
`.trim()
}
```

### Costo de tokens
**Cero**.

---

## Bonus — Daily Kickoff (NUEVO)

Al primer load del día, mostrar un toast no invasivo con:

> "📋 Hoy tenés X tareas. Tu mejor momento estimado: [hora]. 💪"

### Implementación (~0.5 día)

- Detecta si es el primer load del día (comparar fecha actual con `localStorage` key)
- Calcula el mejor momento usando `aggregateByDayOfWeek` del predictor
- Usa el sistema de toast existente
- Sin dependencias nuevas, sin UI adicional

### Costo de tokens
**Cero**.

---

## Resumen de Costos

| Feature | Costo | Dependencias nuevas | Implementación |
|---------|-------|---------------------|----------------|
| Priorización por scoring | $0 | 0 | Ponderación multi-factor sobre modelo actual |
| Coach de hábitos | $0 | 0 | Reglas + estadísticas sobre completionDates |
| Pomodoro adaptativo | $0 | Dexie table + store + UI component | ~4-5 días (incluye UI) |
| Análisis predictivo | $0 | 0 | Regresión sobre completionLog existente |
| Reporte semanal | $0 | 0 | Templates + placeholders |
| Daily Kickoff (bonus) | $0 | 0 | localStorage + toast existente |

**Costo total por usuario**: $0
**RAM adicional**: 0
**Dependencias externas**: 0

---

## Roadmap Ajustado

| Fase | Descripción | Esfuerzo |
|------|-------------|----------|
| 0 | Alinear modelo de datos (tipos, stores, DB) para los campos que se necesiten | ~1 día |
| 1 | Algoritmo de scoring + plan del día (solo sobre datos existentes) | ~2 días |
| 2 | Coach de hábitos (integrado en Insights panel) | ~1 día |
| 3 | Pomodoro adaptativo con UI completa (timer, audio, persistencia) | ~4-5 días |
| 4 | Predicción semanal + detección de patrones (desde completionLog) | ~1 día |
| 5 | Templates de reporte semanal | ~1 día |
| 6 | Daily Kickoff (bonus) | ~0.5 día |

**Total**: ~10-12 días hábiles, **$0 en costos de API**.

### Estrategia de testing

Todos los módulos son funciones puras: reciben datos, devuelven resultados.
Cada uno debe tener tests unitarios en Vitest (ya configurado) cubriendo:

- Scoring: valores límite (priority baja, sin recurrencia, etc.)
- Coach: cada regla individual (racha corta, racha larga, etc.)
- Predictor: regresión con datos conocidos (pendiente esperada)
- Reporte: template con datos vacíos, datos completos
