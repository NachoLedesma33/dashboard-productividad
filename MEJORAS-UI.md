# Plan de Mejora UI — Claymorphism + Soft 3D + Organic UI

## Filosofía del estilo

> La app se siente como arcilla modelada a mano: formas orgánicas, profundidad suave,
> iluminación natural. Cada elemento parece tangible, como si pudieras tocarlo.

**Referentes visuales:** arcilla polimérica, plastilina, diseño infantil sofisticado,
interfaces táctiles para niños, museos de ciencia interactivos, branding de
「Cocomelody aesthetic」.

---

## 1. Principios de diseño

| Principio | Aplicación |
|-----------|------------|
| **Tactilidad** | Todo elemento invita al tacto: sombras que simulan luz natural, rebote al presionar, micro deformaciones en hover |
| **Organicidad** | Nada es perfectamente cuadrado. Forms: border-radius irregulares, blob-shapes en backgrounds, contenedores asimétricos |
| **Profundidad suave** | Capas flotando con separación Z: surface está en z=0, cards en z=2, modales en z=8. Cada capa con su sombra clay |
| **Monochromatic warmth** | Paleta tierra: marrones, terracotas, cremas, arcilla, verde musgo. La "arcilla" no es fría |

---

## 2. Paleta "Arcilla"

```css
@theme {
  /* Base - arcilla cruda */
  --color-bg: #F5F0E8;           /* Fondo general: beige arcilla claro */
  --color-surface: #EDE5D5;      /* Superficie: arcilla ligeramente más oscura */
  --color-surface-elevated: #E3D9C5; /* Arcilla seca */

  /* Elementos de arcilla coloreada */
  --color-clay-rose: #E8C4C4;    /* Arcilla rosa - para prioridad alta */
  --color-clay-sage: #C4D4C4;    /* Arcilla verde salvia - para completado */
  --color-clay-amber: #E8D4A0;   /* Arcilla ámbar - para prioridad media */
  --color-clay-stone: #D5D0C8;   /* Arcilla piedra - para baja prioridad */
  --color-clay-terra: #D4B8A8;   /* Arcilla terracota - acento cálido */

  /* Acento principal - arcilla pigmentada */
  --color-accent: #B88A6E;       /* Terracota medio */
  --color-accent-soft: #D4B8A8;  /* Terracota clara */

  /* Texto */
  --color-text-primary: #2C2418;  /* Marrón oscuro (no negro puro) */
  --color-text-secondary: #6B5D4C; /* Marrón medio */
  --color-text-muted: #9A8B78;    /* Marrón claro */

  /* Funcionales */
  --color-success: #8FA88A;       /* Verde arcilla */
  --color-warning: #C4A84C;       /* Mostaza arcilla */
  --color-error: #C47A6A;        /* Terracota quemada */
  --color-border: #D5C8B8;       /* Borde arcilla */

  /* Sombras clay (key light desde arriba-izquierda) */
  --shadow-clay-ambient: 0 4px 12px rgba(44, 36, 24, 0.12);
  --shadow-clay-key: 0 2px 4px rgba(255, 255, 255, 0.6) inset,
                     0 -1px 2px rgba(44, 36, 24, 0.08) inset;
  --shadow-clay-elevated: 0 8px 24px rgba(44, 36, 24, 0.15),
                          0 2px 4px rgba(255, 255, 255, 0.5) inset,
                          0 -2px 4px rgba(44, 36, 24, 0.1) inset;
  --shadow-clay-pressed: 0 1px 2px rgba(44, 36, 24, 0.15) inset,
                         0 2px 4px rgba(44, 36, 24, 0.05);
  --shadow-clay-glow: 0 0 20px rgba(180, 138, 110, 0.25);
}
```

**Luz desde arriba-izquierda:** El inset de color blanco simula luz entrando,
el inset oscuro simula sombra propia de la arcilla. Esto da el efecto 3D suave.

---

## 3. Background — Arcilla modelada

```css
body {
  background-color: #F5F0E8;
  background-image:
    /* Blob orgánico principal - como una mancha de arcilla */
    radial-gradient(ellipse 90% 50% at 10% 20%, rgba(237, 229, 213, 0.8), transparent),
    radial-gradient(ellipse 70% 60% at 90% 80%, rgba(227, 217, 197, 0.6), transparent),
    /* Textura sutil de "poro" de arcilla */
    repeating-linear-gradient(
      45deg,
      transparent,
      transparent 20px,
      rgba(200, 190, 175, 0.03) 20px,
      rgba(200, 190, 175, 0.03) 21px
    );
}
```

El fondo no es un color plano: tiene "manchas" orgánicas que simulan las
imperfecciones naturales de la arcilla. Sin líneas rectas ni gradientes
mecánicos.

---

## 4. Cards — Clay containers

### Forma

Las cards NO son rectángulos perfectos. Usan `clip-path` para bordes
ligeramente irregulares u orgánicos:

```css
.surface-card {
  /* Forma orgánica sutil - cada card es ligeramente distinta */
  /* Se asigna aleatoriamente o por posición */
  clip-path: polygon(
    0% 4%, 2% 0%, 98% 0%, 100% 3%,
    100% 97%, 98% 100%, 3% 100%, 0% 96%
  );

  /* Clay textura */
  background: #EDE5D5;
  border-radius: 0; /* Sin border-radius estándar - clip-path es la forma */

  /* Clay shadow - dual source */
  box-shadow:
    var(--shadow-clay-ambient),
    var(--shadow-clay-key);

  /* Transición táctil */
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.surface-card:hover {
  transform: translateY(-4px) scale(1.01);
  box-shadow:
    var(--shadow-clay-elevated),
    var(--shadow-clay-glow);
}

.surface-card:active {
  transform: translateY(1px) scale(0.99);
  box-shadow: var(--shadow-clay-pressed);
}
```

**Variantes de clip-path para distintas cards:**

```css
/* Card tipo "guijarro" - más redondeada en un extremo */
.clip-pebble {
  clip-path: polygon(
    4% 0%, 96% 0%, 100% 8%, 100% 92%,
    96% 100%, 4% 100%, 0% 92%, 0% 8%
  );
}

/* Card tipo "hoja" - asimétrica */
.clip-leaf {
  clip-path: polygon(
    0% 6%, 8% 0%, 92% 2%, 100% 10%,
    98% 90%, 90% 100%, 10% 98%, 2% 90%, 0% 80%
  );
}

/* Card tipo "nube" - completamente orgánica */
.clip-cloud {
  clip-path: ellipse(48% 46% at 50% 50%);
}
```

### Profundidad Z

Cada sección del dashboard tiene una altura Z distinta:

| Elemento | Z-level | Sombra |
|----------|---------|--------|
| Body | 0 | — |
| Surface cards | 2 | clay-key + ambient |
| Task cards | 4 | clay-elevated |
| Modal/Dialog | 10 | clay-elevated × 2 |
| Toast | 12 | clay-elevated + glow |
| Drag overlay | 20 | clay-elevated max + rotate |

---

## 5. Componentes específicos

### 5a. TaskCard — "Clay Tile"

```
┌──────────────────────────────┐
│  ○ Título de la tarea        │  ← Clip-path orgánico sutil
│    ●●●○○○                     │
│  ┌────────────────────────┐  │
│  │ ████████░░ 75          │  │  ← Barra de progreso clay
│  └────────────────────────┘  │
│  🔥 3 días  │  📋 Alta       │  ← Tags como bolitas de arcilla
└──────────────────────────────┘
```

```
Forma: clip-path irregular (variante por índice par/impar)
Fondo: clay-stone (baja), clay-amber (media), clay-rose (alta)
Grosor 3D: 
  - Parte superior más clara (inset white)
  - Borde inferior más oscuro (inset transparent)
Checkbox: Círculo de arcilla que al presionarse 
  se hunde (pressed shadow) y aparece un check 
  cincelado (como grabado en la arcilla)
Tags: Pequeñas esferas de arcilla coloreada 
  con sombra propia
```

**Animación de completado:**
1. Checkbox se hunde (pressed shadow, 100ms)
2. Card hace squash (scaleY 0.98, 150ms)
3. Check grabado aparece (stroke-dashoffset animado)
4. Card se estira de vuelta (scaleY 1.02 → 1, 200ms)
5. Sutil glow de éxito

### 5b. TaskBoard Columns — "Arcilla estratificada"

Cada columna es una capa de arcilla con distinto color y altura.

```
 ┌─────────────────────────┐
 │  Alta prioridad  [3]    │  ← Arcilla rosa (clay-rose)
 │  ┌───────────────────┐  │
 │  │ Clay Tile (task)  │  │  ← Task cards incrustadas
 │  ├───────────────────┤  │
 │  │ Clay Tile (task)  │  │
 │  └───────────────────┘  │
 │  ┌ ─ ─ ─ ─ ─ ─ ─ ─ ┐  │
 │  │  + Agregar tarea  │  │  ← Línea punteada como "arcilla por moldear"
 │  └ ─ ─ ─ ─ ─ ─ ─ ─ ┘  │
 └─────────────────────────┘
   ↑ Sombra proyectada sobre la superficie
```

**Layering:** Las columnas en desktop se muestran como losas de arcilla
separadas, cada una con su propia sombra proyectada sobre el fondo.
En mobile, scroll horizontal con snap, como si deslizaras losas.

### 5c. HabitTracker Heatmap — "Jardín de arcilla"

El heatmap se transforma en un jardín de pequeñas bolitas de arcilla:

```
        Ene     Feb     Mar     ← Etiquetas moldeadas en arcilla
Lun   ● ● ◯ ● ● ◯ ◯ ● ◯ ●   ← Bolitas: arcilla coloreada
      ◯ ◯ ● ● ◯ ◯ ● ● ● ◯        con sombra 3D individual
Mié   ● ◯ ◯ ◯ ● ◯ ◯ ◯ ● ◯
      ◯ ● ● ◯ ◯ ● ● ◯ ◯ ◯
Vie   ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯ ◯
```

```css
.clay-dot {
  width: 14px;
  height: 14px;
  border-radius: 50%;
  background: radial-gradient(
    circle at 35% 30%,
    rgba(255,255,255,0.3),  /* Highlight */
    var(--color) 60%,        /* Color base */
    rgba(0,0,0,0.1) 100%    /* Sombra inferior */
  );
  box-shadow:
    0 2px 4px rgba(44,36,24,0.15),
    0 1px 2px rgba(255,255,255,0.3) inset;
  transition: all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* Niveles: arcilla sin pigmento → totalmente pigmentada */
.level-0 { --color: #E3D9C5; }  /* Arcilla cruda */
.level-1 { --color: #B8C8A8; }  /* Arcilla con poco pigmento verde */
.level-2 { --color: #8FA88A; }  /* Arcilla pigmento medio */
.level-3 { --color: #6B8868; }  /* Arcilla pigmento alto */
.level-4 { --color: #4A6848; }  /* Arcilla totalmente pigmentada */
```

Cada bolita es una esfera 3D con highlight y sombra. Al hacer hover,
se eleva (translateY -2px, shadow más grande). Al hacer click, se hunde
y "estampa" (pressed state).

### 5d. Metrics — "Piedras de arcilla"

Las 4 métricas del header se convierten en piedras de arcilla pulida:

```
┌─────────────────────────────────────────────────┐
│                                                   │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐
│  │  ┌──┐    │  │  ┌──┐    │  │  ┌──┐    │  │  ┌──┐    │
│  │  │12│    │  │  │8 │    │  │  │75│    │  │  │5 │    │
│  │  └──┘    │  │  └──┘    │  │  └──┘    │  │  └──┘    │
│  │ Tareas   │  │ Complet. │  │ Porcent. │  │ Racha    │
│  │ totales  │  │ hoy      │  │          │  │          │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘
│                                                   │
└─────────────────────────────────────────────────┘
   ↑ Cada métrica es una piedra ovalada con forma
     asimétrica, sombra clay, y el número parece
     "grabado" en la superficie
```

Las piedras tienen `clip-path: ellipse(45% 42% at 50% 50%)` o variantes
levemente distintas para que no parezcan perfectas.

El icono de Lucide dentro de cada piedra se reemplaza por un pequeño
bajorrelieve: el icono se renderiza con `opacity: 0.3` y un inset
shadow que simula estar hundido en la arcilla.

### 5e. Header — "Loseta de arcilla"

El header pierde el glass/blur y se convierte en una gruesa losa de
arcilla con bordes redondeados orgánicamente:

```
┌────────────────────────────────────────────────────────────┐
│  ┌──────────────────────────────────────────────────────┐  │
│  │  Dashboard de Productividad        [Plan][Reporte]   │  │
│  │  Miércoles, 8 de Julio                              │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                            │
│     ┌─────┐ ┌─────┐ ┌─────┐ ┌─────┐                      │
│     │ 12  │ │  8  │ │ 75% │ │  5  │   ← Metrics como      │
│     └─────┘ └─────┘ └─────┘ └─────┘     piedras ovaladas  │
│                                                            │
└────────────────────────────────────────────────────────────┘
```

Sin backdrop-blur. La losa tiene `clip-path` orgánico y sombra clay.

### 5f. Plan del día dialog — "Cuenco de arcilla"

El modal se abre como un cuenco de arcilla girando desde abajo:

```css
@keyframes bowl-rise {
  from {
    transform: translateY(60%) scale(0.9) rotateX(10deg);
    opacity: 0;
  }
  to {
    transform: translateY(0) scale(1) rotateX(0deg);
    opacity: 1;
  }
}
```

El contenido del modal (tareas scrolleables) está dentro del cuenco.
El borde superior del modal sigue un path orgánico.

### 5g. Toasts — "Burbujas de arcilla"

Los toasts son burbujas ovaladas que emergen desde abajo:

```
  ┌──────────────────────┐
  │  ✓ Tarea completada  │  ← Forma ovalada asimétrica
  └──────────────────────┘       con sombra clay
       ↑ emerge flotando
```

Animación: emerge con `scale(0.8) translateY(20px)` → `scale(1) translateY(0)`,
como una burbuja de arcilla que sube a la superficie.

### 5h. Botones — "Arcilla presionable"

Los botones parecen hechos de arcilla que al presionarlos se deforman:

```css
.btn-clay {
  background: #D4B8A8;
  clip-path: polygon(4% 0%, 96% 0%, 100% 20%, 100% 80%, 96% 100%, 4% 100%, 0% 80%, 0% 20%);
  box-shadow:
    var(--shadow-clay-key),
    var(--shadow-clay-ambient);
  transition: all 0.15s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.btn-clay:hover {
  transform: translateY(-2px);
  box-shadow:
    var(--shadow-clay-elevated),
    var(--shadow-clay-glow);
}

.btn-clay:active {
  transform: translateY(1px) scale(0.97);
  box-shadow: var(--shadow-clay-pressed);
}
```

Los botones tienen forma de "pastilla de arcilla": no rectangulares,
con bordes que simulan haber sido cortados a mano.

---

## 6. Tipografía — "Grabada en arcilla"

| Uso | Fuente | Peso | Efecto |
|-----|--------|------|--------|
| Headings principales | **Space Grotesk** | 700 | Parece tallado en arcilla: `text-shadow: 0 1px 2px rgba(44,36,24,0.1)` |
| Body | **Inter** | 400 | Texto plano, sin sombra |
| Métricas grandes | **Space Grotesk** | 800 | Con sombra interior (`inset text-shadow`) para efecto grabado |
| Labels | **Inter** | 600, 10px, uppercase | Tracking amplio (0.08em) |
| Números en score | **Space Grotesk** | 700 | |

**Efecto de texto grabado** para métricas y títulos:

```css
.text-engraved {
  color: #2C2418;
  text-shadow:
    0 1px 1px rgba(255,255,255,0.6),  /* Luz desde arriba */
    0 -1px 1px rgba(44,36,24,0.15);   /* Sombra desde abajo */
}
```

Los números no flotan sobre la superficie: parecen hundidos o tallados
en la arcilla.

---

## 7. Animaciones — "Arcilla viva"

| Nombre | Duración | Timing | Descripción |
|--------|----------|--------|-------------|
| `clay-squash` | 300ms | ease-out | Card se comprime 2% en Y al soltar DnD |
| `clay-stretch` | 400ms | ease-out | Card se estira 1% al levantar en DnD |
| `clay-impress` | 150ms | ease-in | Botón se hunde al presionar |
| `clay-release` | 200ms | bounce-out | Botón rebota al soltar |
| `bowl-rise` | 500ms | ease-out | Modal emerge desde abajo |
| `bubble-up` | 400ms | ease-out | Toast emerge flotando |
| `clay-glow` | 2s | ease-in-out | Glow pulsante en elemento activo |
| `squish-load` | 600ms | ease-out | Skeleton: arcilla que se moldea |

**Todas las animaciones usan `cubic-bezier(0.34, 1.56, 0.64, 1)`** para
el rebote característico de la arcilla (overshoot suave).

---

## 8. Iconos — Lucide re-estilizados

Los iconos de Lucide se mantienen pero se modifican visualmente:

```css
.icon-clay {
  filter: drop-shadow(0 1px 1px rgba(255,255,255,0.4))
          drop-shadow(0 -1px 1px rgba(44,36,24,0.1));
  opacity: 0.7; /* Parecen hundidos en la superficie */
}
```

En vez de iconos planos, parecen bajorrelieves: ligeramente hundidos
en la arcilla con highlight desde arriba.

---

## 9. Layout — "Composición asimétrica"

El layout pierde la simetría perfecta.

### Estado actual (simétrico):
```
┌────────────────────────────────────────────┐
│               Header centrado               │
├────────────┬────────────────┬───────────────┤
│  Columna 1 │  Columna 2     │  Columna 3    │
│  (33%)     │  (33%)         │  (33%)        │
├────────────┴────────────────┴───────────────┤
│   Insights (50%)     │  Chart (50%)         │
└────────────────────────────────────────────┘
```

### Estado propuesto (asimétrico):
```
┌────────────────────────────────────────────┐
│   Header con losa orgánica descentrada      │
│   (el título pesa más a la izquierda)       │
├───────────────────┬────────────────────────┤
│                   │                         │
│  Col Alta + Media │   Col Baja             │
│  (60%)            │   (40%)                │
│                   │                         │
├────────┬──────────┴──────────┬──────────────┤
│        │                     │              │
│Hábitos │   Insights          │   Chart      │
│ (25%)  │   (45%)             │   (30%)      │
│        │                     │              │
└────────┴─────────────────────┴──────────────┘
```

Las columnas del TaskBoard pasan de 3 iguales a 2+1, donde Alta y Media
comparten un contenedor más grande y Baja está a la derecha como
"bandeja de entrada". Esto refleja que la mayoría de las tareas están
en Alta/Media y Baja es secundaria.

En mobile:

```
┌─────────────────┐
│   Header        │
├─────────────────┤
│  Alta + Media   │ ← scroll horizontal (como losas)
├─────────────────┤
│  Baja (bandeja) │ ← más angosta, scroll
├─────────────────┤
│  Hábitos        │
├─────────────────┤
│  Insights       │
├─────────────────┤
│  Chart          │
└─────────────────┘
```

---

## 10. Detalles extra

| Detalle | Descripción |
|---------|-------------|
| **Loading skeleton** | No es shimmer: es arcilla gris que "se moldea" con reveal animado |
| **Drag overlay** | La tarea arrastrada se convierte en una masa de arcilla deformada (scale + rotate como si la estiraras) |
| **Drop zone** | La zona donde se suelta brilla con glow cálido, como arcilla fresca |
| **404 / empty states** | Un amasijo de arcilla sin forma con texto "Acá no hay nada modelado aún" |
| **Borde inferior del header** | Línea ondulada (SVG wave) en vez de borde recto |
| **Separadores** | No son líneas: son "cortes" en la arcilla (línea con sombra interior) |
| **Cursors** | Cursor personalizado tipo mano de arcilla (opcional) |

---

## 11. Esfuerzo estimado

| Ítem | Tiempo |
|------|--------|
| Tokens clay (paleta + sombras) | ~2h |
| Clip-path orgánicos para cards | ~3h |
| TaskCard clay redesign | ~4h |
| Column layout asimétrico + clay | ~3h |
| Heatmap → jardín de bolitas | ~4h |
| Metrics → piedras grabadas | ~3h |
| Header losa + botones clay | ~2h |
| Dialog cuenco + toast burbuja | ~2h |
| Animaciones arcilla | ~3h |
| Tipografía grabada | ~1h |
| Iconos bajorrelieve | ~1h |
| Responsive + test | ~3h |
| **Total** | **~31h** |

---

## 12. Pros / Contras

| Pro | Contra |
|-----|--------|
| **Único** — No hay muchas apps con este estilo | Mayor esfuerzo (~31h) |
| **Tactilidad** — La UI invita a interactuar | Riesgo de rendimiento (sombras, clip-path) |
| **Coherente** — El tema arcilla se aplica a TODO | Clip-path puede romper en browsers viejos |
| **Portfolio** — Visualmente impactante | Accesibilidad: contraste marrón/beige requiere cuidado |
| **Memorable** — El usuario recuerda la experiencia | Paleta tierra no es para todos los gustos |
| **Mobile** — El gesto de "deslizar losas" es natural | Animaciones complejas en devices low-end |

---

## 13. Quick wins (si el presupuesto es limitado)

Si 31h es mucho, estos items individuales dan alto impacto:

1. **Sombras clay** en cards existentes (~1h) — Cambia la percepción táctil
2. **Paleta tierra** (~30min) — Solo cambiar variables CSS
3. **Botones clay** con squash/stretch (~2h) — Los botones se sienten vivos
4. **Checkbox arcilla** con animación de hundido (~2h) — Cada interacción es satisfactoria
5. **Métricas grabadas** con text-shadow (~1h) — Los números parecen tallados

Estos 5 cambios toman ~6-7h y transforman la sensación general sin
necesidad de rediseñar cada componente.
