# Estrategia de Publicación — Dashboard de Productividad

---

## 1. Propuesta de Valor (1 línea)

> Dashboard de productividad 100% frontend, zero-cost, que funciona sin backend ni APIs de IA — ideal para freelancers, estudiantes y equipos chicos que quieren organizarse sin depender de servicios externos.

---

## 2. Público Objetivo

| Segmento | Por qué le sirve |
|----------|------------------|
| Freelancers | Gestión de tareas + hábitos + predicción semanal, todo local sin pagar suscripciones |
| Estudiantes | Seguimiento de hábitos de estudio, pomodoro adaptativo, reporte semanal |
| Desarrolladores | Proyecto open-source de referencia (React + Vite + Dexie + PWA + IA zero-cost) |
| Equipos chicos | Tablero kanban compartido vía PWA, sin servidor |

---

## 3. Canales de Publicación

### LinkedIn — Post técnico (gancho: "armé mi propio dashboard")

**Formato:** Artículo + carrusel de capturas

**Título sugerido:**
> Armé un dashboard de productividad con React + Dexie + IA (zero-cost) y esto aprendí

**Estructura del post:**

```
🧵 1/7 Arranqué este proyecto porque quería algo simple:
- Sin backend, sin APIs, sin suscripciones
- 100% local en el navegador (IndexedDB)
- IA sin LLMs: scoring ponderado, reglas, estadística pura

🧵 2/7 Stack técnico:
- React 19 + Vite + TypeScript
- Dexie.js (IndexedDB wrapper)
- Tailwind v4 + shadcn/ui
- PWA (instalable en el celular)
- date-fns, recharts, dnd-kit

🧵 3/7 Features principales:
✅ Kanban drag & drop con prioridades
✅ Hábitos con heatmap estilo GitHub (20 semanas)
✅ Scoring inteligente de tareas (plan del día)
✅ Coach de hábitos automático
✅ Predicción semanal + reporte descargable
✅ Pomodoro adaptativo (según tu historial)
✅ Tareas recurrentes con auto-limpieza
✅ Gráfico de productividad 7 días
✅ Dark mode, responsive, instalable

🧵 4/7 IA zero-cost — mi approach:
En vez de llamar APIs caras, usé:
- Algoritmo de scoring con 3 factores (urgencia, consistencia, recurrencia)
- Máquina de reglas para hábitos (racha, sobrecarga, consistencia)
- Regresión lineal simple para predicción de tendencias
- Templates narrativos para reportes semanales
- Todo en ~6 KB gzip, todo lazy-loaded

🧵 5/7 Lo que aprendí optimizando Lighthouse:
- Self-hostear fuentes (Inter + Space Grotesk) elimina render blocking
- Lazy loading + code splitting por feature
- Dynamic imports para Dexie (97 kB → chunk under demand)
- Sin tailwind-merge ni date-fns locale en el bundle crítico
- El resultado: ~215 kB eager, ~90+ potencial en Lighthouse

🧵 6/7 Para qué sirve:
- Freelancers: organizan tareas + hábitos sin pagar Notion/Todoist
- Estudiantes: seguimiento de rachas, reporte semanal
- Devs: proyecto de referencia para aprender React + PWA + patrones

🧵 7/7 Links:
- Demo: [URL]
- Repo: https://github.com/NachoLedesma33/dashboard-productividad
- Tech stack completo en el README

Si te sirve, dale like y compartí 🚀
```

### LinkedIn — Post corto (gancho: "sin suscripciones")

**Título:** Dejé de pagar Todoist y me armé mi propio dashboard

```
Dejé de pagar Todoist y armé mi propio dashboard de productividad.

Sin backend. Sin APIs. Sin suscripciones.

React 19 + Dexie (IndexedDB) + Tailwind v4 + PWA
IA zero-cost (scoring, reglas, estadística)
Instalable en el celu, modo oscuro, responsive

Features:
• Kanban drag & drop
• Hábitos con heatmap
• Plan del día con scoring automático
• Reporte semanal descargable
• Pomodoro que se adapta a vos
• Tareas recurrentes

100% open-source:
https://github.com/NachoLedesma33/dashboard-productividad

¿Todavía usás apps de pago para organizarte? 🤔
```

### GitHub — README actualizado

El README actual debería incluir:

```markdown
# Dashboard de Productividad

Dashboard de productividad local-first,零-cost, con IA sin LLMs.

**Stack:** React 19 · Vite · TypeScript · Dexie.js · Tailwind v4 · PWA

## Features

| Feature | Descripción |
|---------|-------------|
| 📋 Kanban | Drag & drop con prioridades (alta/media/baja), portal overlay |
| 🔥 Hábitos | Heatmap estilo GitHub (20 semanas), rachas, streak tracking |
| 🤖 Plan del día | Scoring automático: urgencia + consistencia + recurrencia |
| 🧠 Coach de hábitos | Feedback automático según rachas y consistencia |
| 📈 Predicción semanal | Regresión lineal sobre historial de completados |
| 📊 Gráfico 7 días | Bar chart con escala fija sobre total de tareas |
| ⏱️ Pomodoro | Adaptativo según promedio histórico de concentración |
| 📋 Reporte semanal | Descargable en .txt con recomendaciones |
| 🌙 Dark mode | Paleta siempre-oscura con acento indigo |
| 📱 PWA | Instalable, offline-ready, service worker |
| ♻️ Tareas recurrentes | Selector de días, auto-limpieza al completar |
| 🧹 Auto-cleanup | Tareas completadas sin recurrencia se eliminan solas |
| 🚀 Rendimiento | ~215 kB eager, lazy loading por feature, self-hosted fonts |

## IA — Cómo funciona (zero-cost)

Ninguna feature de IA usa LLMs ni APIs externas. Todo es:

- **Scoring:** Algoritmo ponderado (urgencia × 0.5 + consistencia × 0.3 + recurrencia × 0.2)
- **Coach de hábitos:** 4 reglas (racha corta, racha larga, consistencia semanal, sobrecarga)
- **Predicción:** Regresión lineal simple sobre promedios móviles
- **Pomodoro:** Promedio histórico de sesiones + multiplicadores por hora del día

## Instalación

```bash
npm install
npm run dev     # desarrollo
npm run build   # producción
npm run test    # tests
```

## Licencia

MIT
```

### Landing page — Copy para web

Si quisieras armar una landing simple:

**Hero:**
> Organizate sin suscripciones.
> Dashboard de productividad inteligente que funciona 100% en tu navegador.

**Secciones:**

1. **Sin backend, sin cuentas** — Todo queda en tu navegador (IndexedDB). No subís tus datos a ningún servidor.

2. **IA que no cuesta** — Scoring de tareas, coach de hábitos, predicción semanal. Sin LLMs, sin APIs caras. Solo matemática y reglas.

3. **Instalable** — Agregalo a tu pantalla de inicio como una app más. Funciona offline.

4. **Para freelancers, estudiantes y equipos chicos** — Kanban, hábitos, pomodoro, reportes. Todo lo que necesitás sin pagar.

**CTA:** Probalo ahora · GitHub

---

## 4. Capturas recomendadas para el post

1. **Dashboard completo** — vista general con métricas, kanban y hábitos
2. **Plan del día** — dialog con tareas scroleables y barras de score
3. **Heatmap de hábitos** — los 20 weeks con tooltip
4. **Gráfico de productividad** — barras con escala fija
5. **Reporte semanal** — el .txt descargado
6. **Lighthouse score** — para mostrar optimización

---

## 5. Hashtags para LinkedIn

```
#React #TypeScript #Vite #PWA #Productividad #OpenSource #Frontend #Dexie #TailwindCSS
#SinBackend #ZeroCost #IA #Lighthouse #Performance #WebDev
```

---

## 6. Timeline sugerido

| Día | Acción |
|-----|--------|
| 1 | Publicar post técnico en LinkedIn (carrusel) |
| 3 | Publicar post corto en LinkedIn |
| 5 | Actualizar README de GitHub |
| 7 | Compartir en Reddit r/reactjs, r/webdev |
| 10 | Si aplica, subir landing page a Vercel/Netlify |
