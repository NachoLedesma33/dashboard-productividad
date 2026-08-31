# Plan E2E — Cobertura restante (Playwright)

> Estado: PLAN, pendiente de implementación. Solo notificaciones cubiertas (14 tests aprobados).
> Stack: `@playwright/test` + `playwright.config.ts` (webServer = `npm run preview -- --port 4173`, proyectos `desktop-chromium` y `mobile-chromium`).
> Cómo correr: build primero (`npm run build`), luego `npm run e2e`.

## Convenciones compartidas

- Antes de cada suite: arrancar DB limpia (borrar IndexedDB `productivity-db` vía `context.addInitScript` o `page.evaluate`), evitar contaminación entre tests.
- Selección semántica (roles, aria-label, placeholder). La app ya usa `aria-label` en tablero/hábitos.
- Suite `e2e/` dividida por feature. Cada archivo un solo dominio.
- Para testing determinista de fechas/hábitos, un helper que siembre datos directo en IndexedDB (reutilizar `lazyDb`/`database` no aplica en e2e; usar `page.evaluate` + Dexie en window, o seed vía UI).

## Fases propuestas

### Fase E2E-01 — Core tasks & tablero (`e2e/tasks.spec.ts`)
- [ ] Agregar tarea en cada columna (alta/media/baja) → aparece con prioridad y badge
- [ ] Completar tarea → check + línea tachada + conteo "Completadas hoy" +1
- [ ] Desmarcar tarea → vuelve pendiente
- [ ] Editar título/prioridad → persiste (verificar en IndexedDB)
- [ ] Eliminar tarea → desaparece
- [ ] Toggle "Ocultar completadas"
- [ ] Tareas recurrentes: crear con días, completar, y (simulación) verificar unhcheck en día siguiente programado
- [ ] Drag & drop cambiar columna (alta↔media) — validar con emulación touch en mobile
- [ ] Reordenar dentro de columna
- [ ] Persistencia tras reload (tareas quedan en IndexedDB)

### Fase E2E-02 — Hábitos (`e2e/habits.spec.ts`)
- [ ] Agregar hábito → aparece en lista
- [ ] Completar hábito hoy → check + streak "1 día"
- [ ] Desmarcar hoy → streak vuelve a 0
- [ ] Streak multi-día: sembrar `completionDates` en IndexedDB y verificar cálculo
- [ ] Editar nombre → persiste
- [ ] Eliminar hábito → desaparece
- [ ] Heatmap: sembrar fechas → celdas con nivel >0
- [ ] Contador de hábitos del header

### Fase E2E-03 — Calendario (`e2e/calendar.spec.ts`)
- [ ] Navegar meses (prev/next/today)
- [ ] Crear evento (categoría + fecha + hora) → aparece en el día
- [ ] Ver/editar evento
- [ ] Eliminar evento
- [ ] Categorías visibles/distintas
- [ ] Persistencia tras reload

### Fase E2E-04 — Insights & Analytics (`e2e/insights.spec.ts`)
- [ ] Métricas del header (totales, completadas hoy, %, mejor racha)
- [ ] InsightsPanel: sembrar datos → se generan insights (sin texto vacío)
- [ ] ProductivityChart: sembrar `completionLog` → gráfico con datos
- [ ] Cambio de rango/vista si existe

### Fase E2E-05 — Plan del día (`e2e/plan.dia.spec.ts`)
- [ ] Abrir dialog "Plan del día" → renderiza tareas/hábitos del día
- [ ] Interacciones (marcar/desmarcar dentro del plan) si aplican
- [ ] Cerrar dialog

### Fase E2E-06 — UI global & temas (`e2e/ui.spec.ts`)
- [ ] Dark/light toggle persiste en `localStorage['theme']` y aplica `data-theme`
- [ ] Toast: agregar tarea muestra toast, se auto-cierra
- [ ] "Cargar datos demo" → seed + reload (data visible)
- [ ] Footer/header renderizan

### Fase E2E-07 — PWA & offline (`e2e/pwa.spec.ts`)
- [ ] Service worker registrado (`navigator.serviceWorker` en page)
- [ ] Manifest correcto
- [ ] Offline: `context.setOffline(true)` → app carga desde cache (tareas visibles)
- [ ] Reload offline funciona

### Fase E2E-08 — Recorrido completo (flujo usuario) (`e2e/onboarding.spec.ts`)
- [ ] Happy path end-to-end: crear tarea → completar → crear hábito → completar → ver insight → generar reporte semanal (descarga)
- [ ] Multi-step combinando suites anteriores

## Dependencias
- Fase E2E-06 (toast/demo/theme) depende de nada; independiente, hacerla junto a E2E-01.
- E2E-07 (PWA/offline) es la más frágil: requiere build con SW y validar cache. Hacerla después de que las suites de UI estén estables.
- E2E-08 al final, sobre base estable.

## Prioridad sugerida
1. E2E-01 (core) — mayor riesgo de regresión
2. E2E-02 (hábitos)
3. E2E-06 (theme/toast/demo) — rápido
4. E2E-03 (calendario)
5. E2E-05 (plan del día)
6. E2E-04 (insights)
7. E2E-07 (PWA/offline)
8. E2E-08 (onboarding)

## Notas
- No implementar ninguna fase hasta que el usuario revise y apruebe este plan.
- Los tests corren contra `npm run preview` (build de producción), igual que Vercel.
- Ci potencial: `npx playwright install --with-deps chromium` + `npm run build` + `npm run e2e`.
