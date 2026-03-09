# Matrix — Roadmap

> Proyecto simplificado extraído de matrix-v2. Migración modular: una feature a la vez,
> simplificando donde matrix-v2 era innecesariamente complejo.

---

## Phase 0: Infrastructure + DB ✅

- Electron Forge + Vite + TypeScript scaffold
- React 18 + Tailwind 3.4 dark theme (Poppins font, golden accent)
- Express on :3939 with health check (`/api/health`)
- SQLite + Drizzle ORM (8 tables: mission, objectives, plans, tasks, projects, project_links, ideas, settings)
- AppShell with sidebar (6 tabs: Overview, Projects, Tasks, Ideas, Passwords, Settings)
- Preload with `window.matrix.apiBase` via contextBridge
- i18n dictionary (EN/ES)

---

## Phase 1: Core CRUD — Jerarquía estratégica ✅

La columna vertebral de Matrix: **Mission → Objectives → Plans → Tasks**.
El progreso fluye de abajo hacia arriba en cascada automática.

### Modelo de progreso en cascada ✅

```
Mission (progress = media de objectives)
  └─ Objective (progress = media de plans)
       └─ Plan (progress = media de tasks)
            └─ Task (progress = 0% pending, 50% in_progress, 100% done, 0% blocked)
```

- ✅ **Task**: El progreso es discreto según su status: pending=0%, in_progress=50%, done=100%, blocked=0%
- ✅ **Plan**: Su progress es la **media aritmética** del progress de todas sus tasks. Ej: 3 tasks (done + in_progress + pending) = (100+50+0)/3 = 50%
- ✅ **Objective**: Su progress es la **media aritmética** del progress de todos sus plans. Ej: 2 plans al 50% y 80% = (50+80)/2 = 65%
- ✅ **Mission**: Su progress es la **media aritmética** del progress de todos sus objectives. Ej: 2 objectives al 40% y 70% = (40+70)/2 = 55%
- ✅ El progress **nunca se almacena manualmente** — siempre se calcula en tiempo real al hacer GET
- ✅ Si una entidad no tiene hijos, su progress es 0%

### 1.1 Schema & Migration Updates ✅
- ✅ `mission`: añadido `status TEXT NOT NULL DEFAULT 'in_progress'` (valores: in_progress / completed)
- ✅ `objectives`: cambiado status default de `'active'` → `'in_progress'` (valores: in_progress / completed)
- ✅ `plans`: cambiado status default de `'active'` → `'in_progress'`, eliminada columna `progress REAL` (se calcula, nunca se almacena), añadido `deadline TEXT`
- ✅ `ideas`: reemplazado `promoted_to_task_id` por `promoted_to_type TEXT` + `promoted_to_id INTEGER` (polimórfico, para Phase 3)
- ✅ Sin ON DELETE CASCADE — lógica de borrado manejada en controllers con opciones reassign/cascade
- ✅ Migration: tablas recreadas en `migrate.ts` (pre-producción, sin datos reales)

### 1.2 Mission (singleton) ✅
- ✅ CRUD completo: crear, leer, actualizar y borrar en cualquier momento
- ✅ Restricción: solo **1 misión activa** a la vez (crear una nueva devuelve 409 si ya existe)
- ✅ Campos: title, description, status (in_progress / completed)
- ✅ Progress: auto-calculado como media de sus objectives (no se almacena, se calcula en GET)
- ✅ Vista en Overview como **header principal** del dashboard
- ✅ **Borrar misión**: elimina en cascada todos sus objectives → plans → tasks
- ✅ Repository: `mission.repository.ts` — findAll, findById, create, update, delete
- ✅ Controller: `mission.controller.ts` — validación Zod, progress calculation, cascade delete
- ✅ Routes: `mission.routes.ts` — GET/POST/PATCH/DELETE /api/mission
- ✅ Hook: `useMission.ts` — useQuery + useMutation con invalidateQueries

### 1.3 Objectives ✅
- ✅ CRUD completo: crear, modificar y borrar objectives en cualquier momento
- ✅ Campos: title, description, status (in_progress / completed), sort_order
- ✅ Vinculados a mission_id (FK obligatorio)
- ✅ Progress: auto-calculado como media de sus plans
- ✅ **Borrar objective**: opción cascade (elimina plans → tasks) o reassign (mueve plans a otro objective)
- ✅ **Crear/borrar objective**: recalcula automáticamente el progress de la misión
- ✅ Repository: `objectives.repository.ts` — findAll, findByMissionId, findById, countByMissionId, create, update, reassignToMission, delete
- ✅ Controller: `objectives.controller.ts` — validación Zod, progress calculation, delete con action param
- ✅ Routes: `objectives.routes.ts` — GET/POST/PATCH/DELETE /api/objectives
- ✅ Hook: `useObjectives.ts` — useQuery (filtrable por missionId) + mutations

### 1.4 Plans ✅
- ✅ CRUD completo: crear, modificar y borrar plans en cualquier momento
- ✅ Campos: title, description, status (in_progress / completed), deadline (opcional), sort_order
- ✅ Vinculados a objective_id (FK obligatorio)
- ✅ Progress: auto-calculado como media de sus tasks
- ✅ **Borrar plan**: opción cascade (elimina tasks) o reassign (mueve tasks a otro plan)
- ✅ **Crear/borrar plan**: recalcula automáticamente el progress del objective → mission
- ✅ Repository: `plans.repository.ts` — findAll, findByObjectiveId, findById, countByObjectiveId, create, update, reassignToObjective, delete
- ✅ Controller: `plans.controller.ts` — validación Zod, progress calculation, delete con action param
- ✅ Routes: `plans.routes.ts` — GET/POST/PATCH/DELETE /api/plans
- ✅ Hook: `usePlans.ts` — useQuery (filtrable por objectiveId) + mutations

### 1.5 Tasks ✅
- ✅ CRUD completo: crear, modificar y borrar tasks en cualquier momento
- ✅ Campos: title, description, status (pending / in_progress / done / blocked), priority (low / medium / high / urgent), deadline (opcional), sort_order
- ✅ Vinculados a plan_id (FK obligatorio)
- ✅ Progress: derivado del status (pending=0%, in_progress=50%, done=100%, blocked=0%)
- ✅ **Cambiar status de task**: recalcula progress del plan → objective → mission en cascada (via React Query invalidation)
- ✅ **completedAt**: se auto-setea al marcar done, se limpia al cambiar a otro status
- ✅ Repository: `tasks.repository.ts` — findAll, findByPlanId, findByStatus, findFiltered, findById, countByPlanId, create, update, reassignToPlan, delete
- ✅ Controller: `tasks.controller.ts` — validación Zod, auto-completedAt logic, simple delete (no children)
- ✅ Routes: `tasks.routes.ts` — GET/POST/PATCH/DELETE /api/tasks
- ✅ Hook: `useTasks.ts` — useQuery (filtrable por planId, status) + mutations

### 1.6 Settings ✅
- ✅ API key-value store (tema, idioma, etc.)
- ✅ Repository: `settings.repository.ts` — findAll (devuelve object { key: value }), findByKey, upsert
- ✅ Controller: `settings.controller.ts` — validación Zod, getAll, getByKey, upsert
- ✅ Routes: `settings.routes.ts` — GET /api/settings, GET /api/settings/:key, PUT /api/settings/:key
- ✅ Hook: `useSettings.ts` — useQuery + useUpdateSetting mutation

### 1.7 API Endpoints ✅

```
Mission: ✅
  GET    /api/mission          → misión activa (con progress calculado)
  POST   /api/mission          → crear misión (singleton enforced)
  PATCH  /api/mission/:id      → actualizar misión
  DELETE /api/mission/:id      → borrar misión + cascada

Objectives: ✅
  GET    /api/objectives              → listar (filtrable por ?mission_id=, con progress calculado)
  GET    /api/objectives/:id          → detalle (con progress)
  POST   /api/objectives              → crear (requiere missionId)
  PATCH  /api/objectives/:id          → actualizar
  DELETE /api/objectives/:id          → borrar (requiere action: cascade|reassign si tiene hijos)

Plans: ✅
  GET    /api/plans                    → listar (filtrable por ?objective_id=, con progress calculado)
  GET    /api/plans/:id                → detalle (con progress)
  POST   /api/plans                    → crear (requiere objectiveId)
  PATCH  /api/plans/:id                → actualizar
  DELETE /api/plans/:id                → borrar (requiere action si tiene hijos)

Tasks: ✅
  GET    /api/tasks                    → listar (filtrable por ?plan_id=, ?status=)
  GET    /api/tasks/:id                → detalle
  POST   /api/tasks                    → crear (requiere planId)
  PATCH  /api/tasks/:id                → actualizar (auto-completedAt en done)
  DELETE /api/tasks/:id                → borrar (simple, sin hijos)

Settings: ✅
  GET    /api/settings                 → todos los settings como { key: value }
  GET    /api/settings/:key            → un setting
  PUT    /api/settings/:key            → crear/actualizar setting (upsert)
```

### 1.8 Arquitectura por entidad ✅
Cada entidad sigue el patrón:
- ✅ `routes/*.routes.ts` → solo routing, delega a controller
- ✅ `controllers/*.controller.ts` → lógica de negocio + validación Zod + progress calculation
- ✅ `repositories/*.repository.ts` → queries Drizzle only
- ✅ `hooks/use*.ts` → React Query wrapper en frontend con invalidateQueries para cascade refresh
- ✅ Todas las rutas registradas en `server.ts`

### 1.9 Frontend — React Query + Vistas ✅
- ✅ Instalado `@tanstack/react-query` + QueryClientProvider en App.tsx
- ✅ **OverviewView**: header de misión con progress bar, objectives expandibles → plans → tasks, inline forms para crear, toggle status de tasks, delete con confirmación
- ✅ **TasksView**: lista de tasks agrupadas por plan, filtro por status, crear task (seleccionar plan + título), toggle status con click, badges de prioridad, delete on hover
- ✅ **SettingsView**: selector de idioma (EN/ES) que persiste en DB, muestra stored settings
- ✅ AppShell actualizado para renderizar vistas reales (overview, tasks, settings)
- ✅ i18n expandido con keys adicionales (noMission, createMission, objectives, plans, loading)

### 1.10 Delete con reassign/cascade ✅
- ✅ Mission delete: solo cascade (elimina todo el árbol)
- ✅ Objective delete: cascade (elimina plans + tasks) o reassign (mueve plans a otro objective, requiere newParentId)
- ✅ Plan delete: cascade (elimina tasks) o reassign (mueve tasks a otro plan, requiere newParentId)
- ✅ Task delete: simple (no tiene hijos)
- ✅ Si la entidad tiene hijos y no se provee action, devuelve 400 con mensaje informativo

---

## Phase 2: Projects — Scanner + Resumen inteligente ✅

El módulo de Projects es el corazón operativo: conecta Matrix con tus proyectos reales del filesystem.

### 2.1 CRUD de Projects ✅
- ✅ Campos: name, path (ruta local del proyecto en filesystem), description, url (GitHub/repo), status (active/paused/completed/archived), tags (JSON array)
- ✅ Sin slug (no hay routing público que lo necesite)
- ✅ project_links: vinculación polimórfica a cualquier entidad (mission, objective, plan, task) — ya existe en schema
- ✅ Al crear un proyecto con path, scan manual disponible (no auto-scan)
- ✅ Repository: `projects.repository.ts` — findAll, findById, create, update, delete, getLatestScan, upsertScan, getLinks, addLink, removeLink
- ✅ Controller: `projects.controller.ts` — validación Zod, scan endpoint, tech stats auto-collect
- ✅ Routes: `projects.routes.ts` — GET/POST/PATCH/DELETE /api/projects, POST /api/projects/:id/scan, POST/DELETE /api/projects/:id/links
- ✅ Hook: `useProjects.ts` — useQuery + mutations (CRUD + scan)

### 2.2 Project Scanner Engine ✅
Escanea el directorio del proyecto buscando archivos de progreso:
- ✅ **Archivos objetivo**: roadmap.md, plan.md, todo.md, guia.md, README.md, CHANGELOG.md
- ✅ **Detección de checkboxes**: `[ ]` (pendiente) y `[x]` (completado)
- ✅ **Detección de headers**: `## Sección ✅` (completado) / `## Sección` sin ✅ (pendiente)
- ✅ **Detección de anotaciones**: `BLOCKER:` (bloqueantes, rojo), `WIP:` (en progreso, amarillo)
- ✅ **Cálculo de progreso**: `(completedTasks / totalTasks) * 100`
- ✅ Solo scan manual (botón). Sin watcher/chokidar por ahora
- ✅ Resultado del último scan se guarda en tabla `project_scans` (solo último, sin historial)
- ✅ Engine: `engines/scanner.ts` — scanProject() + collectTechStats()

### 2.3 Resumen pormenorizado por proyecto ✅
Cada proyecto muestra una ficha estilo GitHub con:

**Progreso (del último scan):**
- ✅ Barra de progreso con % auto-calculado
- ✅ Desglose por archivo (ej: "roadmap.md: 12/20 tareas, 60%")
- ✅ Contadores de BLOCKERs y WIPs

**Información técnica (almacenada en tabla `projects`):**
- ✅ Número total de líneas de código (excluyendo node_modules, dist, etc.)
- ✅ Lenguajes/tecnologías detectados (por extensión: .ts, .tsx, .py, .rs, etc.) — circulitos de color estilo GitHub
- ✅ Si tiene tests (detectar carpetas test/, __tests__/, archivos *.test.*, *.spec.*)
- ✅ Si tiene CI/CD (detectar .github/workflows/, .gitlab-ci.yml)
- ✅ Número de dependencias (parsear package.json, requirements.txt, Cargo.toml)
- ✅ Último commit (fecha + mensaje, via git log)
- ✅ Estado del repo git (branch actual, cambios sin commitear)

### 2.4 Project Detail View ✅
- ✅ Header: nombre, descripción, estado, URL (link clickeable)
- ✅ Cards de info estilo GitHub: progreso %, ruta, stats técnicos con iconos
- ✅ Barra de progreso grande
- ✅ Desglose del último scan por archivo
- ✅ Entidades vinculadas (objectives, plans, tasks relacionados)

### 2.5 Tablas ✅

**projects (actualizada):**
```
projects:
  id, name, path, description, url, status, tags (JSON),
  tech_stats (JSON: líneas, lenguajes, tests, ci_cd, deps, git_info),
  created_at, updated_at
```

**project_scans (nueva — solo último scan por proyecto):**
```
project_scans:
  id, project_id (FK), total_tasks, completed_tasks,
  blockers, wip_items, progress_percent,
  raw_data (JSON: desglose por archivo),
  scanned_at
```

### 2.6 API Endpoints ✅
```
Projects:
  GET    /api/projects              → listar todos (con scan + techStats)
  GET    /api/projects/:id          → detalle (con scan + techStats + links)
  POST   /api/projects              → crear (auto-collect techStats si tiene path)
  PATCH  /api/projects/:id          → actualizar
  DELETE /api/projects/:id          → borrar (cascada: scans + links)
  POST   /api/projects/:id/scan     → ejecutar scan manual + refresh techStats
  POST   /api/projects/:id/links    → vincular a entidad (mission/objective/plan/task)
  DELETE /api/projects/:id/links/:linkId → desvincular
```

---

## Phase 3: Ideas Pipeline — Captura, evaluación y promoción

Sistema para capturar ideas rápidamente y decidir si merecen convertirse en algo accionable.

### 3.1 UI: Kanban de 4 columnas
Inspirado en matrix-v2, la vista de Ideas es un **pipeline visual**:

| Pending | Evaluating | Approved | Rejected |
|---------|------------|----------|----------|
| Ideas recién capturadas | En proceso de evaluación | Aprobadas / promovidas | Descartadas |

- Cada card muestra: título, descripción (truncada), proyecto vinculado (opcional), fecha
- Click en card → expande detalle
- Acciones por columna:
  - **Pending**: Evaluar, Eliminar
  - **Evaluating**: Ver evaluación, Aprobar, Rechazar, Eliminar
  - **Approved**: Ver a qué se promovió (link a task/plan/objective)
  - **Rejected**: Restaurar a Pending, Eliminar

### 3.2 Captura rápida de ideas
- Formulario simple: título (requerido), descripción (opcional), proyecto vinculado (select, opcional)
- Objetivo: capturar con fricción mínima, evaluar después
- Status inicial: `pending`

### 3.3 Evaluación de ideas
Sistema de scoring para decidir si una idea merece acción:

**Scores (1-10):**
- **Alignment** (alineación con misión/objetivos) — auto-calculado
- **Impact** (impacto potencial) — auto-calculado
- **Cost** (coste estimado, menor = mejor) — ajustable manualmente
- **Risk** (riesgo, menor = mejor) — ajustable manualmente

**Fórmula de scoring:**
```
totalScore = (alignment × 0.4 + impact × 0.3 + (10 - cost) × 0.15 + (10 - risk) × 0.15) / 10
```

**Motor de scoring local (Phase 3):**
- Tokeniza título + descripción de la idea
- Compara semánticamente contra objetivos y planes existentes
- Calcula alignment e impact basándose en coincidencias
- Sin dependencia de AI — funciona 100% offline

**Panel de evaluación:**
- Barras visuales para cada score
- Sliders para ajustar Cost y Risk manualmente
- Razonamiento generado (texto explicativo)
- Botones: Aprobar → Promover, Rechazar

### 3.4 Promoción de ideas (TODO: definir flujo)
Cuando una idea se aprueba, ¿a qué se convierte? Opciones a definir:

- **→ Task**: La idea se convierte en una tarea concreta dentro de un plan existente
- **→ Plan**: La idea genera un nuevo plan dentro de un objetivo
- **→ Objective**: La idea es tan grande que merece un nuevo objetivo
- **→ Project**: La idea da origen a un proyecto nuevo (como en matrix-v2)

> ⚠️ **Pendiente de diseñar**: El flujo de promoción necesita un modal/wizard donde el usuario:
> 1. Elige el tipo de destino (Task / Plan / Objective / Project)
> 2. Selecciona la entidad padre (ej: "¿dentro de qué plan va esta task?")
> 3. Confirma y la idea queda vinculada (`promoted_to_type` + `promoted_to_id`)
>
> Campos en tabla ideas: `status = 'promoted'`, `promoted_to_type`, `promoted_to_id`

### 3.5 Tabla idea_evaluations (nueva)
```
idea_evaluations:
  id, idea_id (FK), impact_score, cost_score, risk_score,
  alignment_score, total_score, reasoning,
  decision (pending/approved/rejected), decided_at, created_at
```

---

## Phase 4: Dashboard + Views avanzadas

### 4.1 Overview Dashboard
- Misión actual como header
- Stats globales: total tasks, completion rate, active plans, ideas pendientes
- Objetivos con barras de progreso
- Proyectos activos con % de progreso
- Ideas pendientes de evaluar (contador)

### 4.2 Task Board (Kanban)
- Vista kanban por status: Pending → In Progress → Done → Blocked
- Drag-and-drop entre columnas (cambia status)
- Drag-and-drop vertical (cambia sort_order)
- Filtros: por plan, por proyecto, por prioridad

### 4.3 Gráficos (Recharts)
- Progreso de objetivos/planes a lo largo del tiempo
- Task burndown chart
- Distribución de ideas por status (pie chart)

---

## Phase 5: Passwords + Security

- Categorías de contraseñas (Personal, Work, Finance, etc.)
- Almacenamiento cifrado (AES-256-GCM)
- Master password con argon2 hashing
- Generador de contraseñas (longitud, caracteres, símbolos)
- Copy-to-clipboard con auto-clear (30 segundos)
- Búsqueda y filtrado

---

## Phase 6: AI + Tokens

### 6.1 AI Integration (opcional, local)
- Ollama integration para evaluación de ideas con AI
- AI reasoning como complemento al scoring local
- Recomendaciones estratégicas
- Daily briefing ("hoy trabaja en esto, por esta razón")

### 6.2 Token Budget Tracking
- Registro de suscripciones/APIs con coste mensual
- Tracking de tokens consumidos por servicio
- Alertas de presupuesto

---

## Phase 7: Polish + Distribution

- Notifications (deadline reminders, daily briefing)
- Keyboard shortcuts globales
- Export/import data (JSON backup)
- Auto-updater (Electron)
- Installer builds (Squirrel para Windows, DMG, AppImage)
- Tests con Vitest
- Error handling + logging centralizado

---

## Origen

Este proyecto es una **reimplementación simplificada** de [matrix-v2](../matrix-v2/).
Se migra módulo a módulo, eliminando complejidad innecesaria:

| matrix-v2 (complejo) | matrix (simplificado) |
|-----------------------|----------------------|
| Vision → Strategy → Pillars → Objectives | Mission → Objectives → Plans → Tasks |
| 18 tablas | 8 tablas + 2 nuevas (scans, evaluations) |
| Webpack | Vite |
| PostgreSQL/Supabase ready | SQLite only (local-first) |
| Scoring con sinónimos hardcodeados | Scoring semántico simplificado |
| Proyecto = entidad promovida de idea | Proyecto = entidad independiente + linkeable |
