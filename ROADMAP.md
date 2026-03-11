# Matrix — Roadmap

> Proyecto simplificado extraído de matrix-v2. Migración modular: una feature a la vez,
> simplificando donde matrix-v2 era innecesariamente complejo.

---

## Phase 0: Infrastructure + DB ✅

- Electron Forge + Vite + TypeScript scaffold
- React 18 + Tailwind 3.4 dark theme (Poppins font, golden accent)
- Express on :3939 with health check (`/api/health`)
- SQLite + Drizzle ORM (8 tables: mission, objectives, plans, tasks, projects, project_links, ideas, settings)
- AppShell with sidebar (6 tabs: Overview, Projects, Tasks, Ideas, Analytics, Settings)
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

## Phase 3: Ideas Pipeline + AI Budget ✅

Sistema de captura, evaluación y promoción de ideas con Kanban visual. Incluye tracking de presupuesto AI (adelantado de Phase 6).

### 3.1 Schema & Migration Updates ✅
- ✅ `ideas`: añadidos `target_type` TEXT (mission|objective|plan|task|null), `target_id` INTEGER (nullable), `project_id` INTEGER (nullable, FK → projects)
- ✅ Nueva tabla `idea_evaluations`: id, idea_id (FK unique 1:1), alignment_score (1-10), impact_score (1-10), cost_score (1-10), risk_score (1-10), total_score REAL, reasoning TEXT, decision (pending|approved|rejected), decided_at, created_at
- ✅ Nueva tabla `subscriptions` (AI Budget): id, name, cycle (weekly|monthly), reset_day INTEGER, budget INTEGER (default 100, %), current_used INTEGER (default 0, %), updated_at
- ✅ Migración: ALTER TABLE ideas + CREATE TABLE idea_evaluations + CREATE TABLE subscriptions
- ✅ Migración correctiva: scores antiguos en rango 0-1 multiplicados x10 a rango 1-10

### 3.2 Ideas CRUD + Evaluations + Promotion ✅
- ✅ CRUD completo con filtro por status + vinculación a schema estratégico y proyecto
- ✅ POST `/api/ideas/:id/evaluate` — crear/actualizar evaluación (4 sliders manuales)
- ✅ GET `/api/ideas/:id/evaluation` — obtener evaluación
- ✅ PATCH `/api/ideas/:id/decide` — aprobar/rechazar (cambia status de idea)
- ✅ POST `/api/ideas/:id/promote` — body: { type, parent_id } → crea entidad destino, actualiza promoted_to_type/id, status='promoted'
- ✅ Repository: `ideas.repository.ts` — findAll, findByStatus, findById, create, update, delete, findEvaluation, upsertEvaluation, updateEvaluationDecision
- ✅ Controller: `ideas.controller.ts` — validación Zod, scoring, promote logic
- ✅ Routes: `ideas.routes.ts` — 9 endpoints

**Fórmula de scoring (rango 1-10):**
```
totalScore = alignment × 0.4 + impact × 0.3 + (10 - cost) × 0.15 + (10 - risk) × 0.15
```

**Decisiones simplificadas vs roadmap original:**
- ✅ Los 4 scores son sliders manuales (sin auto-cálculo NLP)
- ✅ Ideas se vinculan opcionalmente al schema estratégico (target_type + target_id) Y a un proyecto (project_id)

### 3.3 Subscriptions CRUD (AI Budget) ✅
- ✅ CRUD + PATCH `/api/subscriptions/:id/usage` (actualizar current_used)
- ✅ Tracking de suscripciones AI: nombre, ciclo, % presupuesto usado
- ✅ Repository: `subscriptions.repository.ts` — findAll, findById, create, update, delete
- ✅ Controller: `subscriptions.controller.ts` — validación Zod, usage endpoint
- ✅ Routes: `subscriptions.routes.ts` — 5 endpoints

### 3.4 UI: Kanban de Ideas ✅
4 columnas: **Pending → Evaluating → Approved → Rejected**

- ✅ **Card de idea**: título, descripción truncada, badges (target, proyecto, promoted_to), fecha
- ✅ **Scores en la card**: Alineación, Impacto, Coste, Riesgo con valores + total score (visible para ideas evaluadas)
- ✅ **Labels responsive**: palabra completa en `xl`, abreviatura (ALI, IMP, CST, RSK) en ventanas más pequeñas
- ✅ **Acciones como iconos** siempre visibles con tooltip descriptivo al hover (bilingüe EN/ES)
- ✅ **Navegación entre estados**: cada idea puede retroceder al estado anterior o volver a pending desde cualquier columna
- ✅ **Formulario de captura** (modal): título, descripción, selector jerárquico de schema (tipo → entidad), selector de proyecto
- ✅ **Panel de evaluación** (modal): 4 sliders 1-10, score total en tiempo real, reasoning, botones aprobar/rechazar/guardar
- ✅ **Pre-carga de evaluación**: al editar, los sliders se cargan con los valores previamente guardados
- ✅ **Modal de promoción**: seleccionar destino (Task/Plan/Objective/Project), seleccionar padre, confirmar
- ✅ Hook: `useIdeas.ts` — 9 hooks (queries + mutations con invalidación en cascada)

### 3.5 UI: AI Budget en Settings ✅
- ✅ Sección "AI Budget" dentro de SettingsView
- ✅ Lista de suscripciones como cards compactas: nombre, ciclo, barra de progreso (% usado), input editable
- ✅ Colores: verde (<50%), amarillo (50-80%), rojo (>80%)
- ✅ Botón "+" para agregar suscripción con formulario inline (nombre, ciclo, reset day, budget)
- ✅ Botón reset por suscripción + botón eliminar
- ✅ Hook: `useSubscriptions.ts` — 5 hooks

### 3.6 Banner de AI Budget en Ideas ✅
- ✅ Banner sutil arriba del Kanban
- ✅ Muestra suscripciones >70%: "! Claude Code: 82% usado"
- ✅ Doble alerta (!!) para suscripciones >90%
- ✅ Solo aparece si hay suscripciones configuradas y alguna está alta

### 3.7 Centro de Ayuda ✅
- ✅ Botón `?` junto al título "Ideas" para abrir/cerrar panel de ayuda
- ✅ Panel completo debajo del Kanban (sin scroll interno, contenido completo visible)
- ✅ Secciones: flujo de trabajo, descripción de las 4 etapas, sistema de evaluación con fórmula, promoción, leyenda de iconos
- ✅ Bilingüe (EN/ES)

### 3.8 API Endpoints ✅
```
Ideas: ✅
  GET    /api/ideas                    → listar (filtrable por ?status=)
  GET    /api/ideas/:id                → detalle
  POST   /api/ideas                    → crear
  PATCH  /api/ideas/:id                → actualizar
  DELETE /api/ideas/:id                → borrar
  POST   /api/ideas/:id/evaluate       → crear/actualizar evaluación
  GET    /api/ideas/:id/evaluation     → obtener evaluación
  PATCH  /api/ideas/:id/decide         → aprobar/rechazar
  POST   /api/ideas/:id/promote        → promover a entidad

Subscriptions: ✅
  GET    /api/subscriptions            → listar todas
  POST   /api/subscriptions            → crear
  PATCH  /api/subscriptions/:id        → actualizar
  DELETE /api/subscriptions/:id        → borrar
  PATCH  /api/subscriptions/:id/usage  → actualizar % usado
```

### 3.9 Arquitectura por entidad ✅
Siguiendo el patrón establecido en Phase 1:
- ✅ `routes/ideas.routes.ts` + `routes/subscriptions.routes.ts`
- ✅ `controllers/ideas.controller.ts` + `controllers/subscriptions.controller.ts`
- ✅ `repositories/ideas.repository.ts` + `repositories/subscriptions.repository.ts`
- ✅ `hooks/useIdeas.ts` + `hooks/useSubscriptions.ts`
- ✅ `components/ideas/IdeasView.tsx` — vista Kanban completa
- ✅ Rutas registradas en `server.ts`, vista conectada en `AppShell.tsx`

---

## Phase 4: Dashboard + Views Avanzadas ✅

### 4.1 DB: Activity Log ✅
- ✅ Nueva tabla `activity_log`: id, action (created|completed|promoted|scanned|deleted|decided), entity_type (task|idea|project|plan|objective), entity_id, description (human-readable), created_at
- ✅ Migración en `migrate.ts`
- ✅ Schema Drizzle en `schema.ts`

### 4.2 Backend: Activity + Stats ✅
- ✅ Repository: `activity.repository.ts` — log(action, entityType, entityId, description) + findRecent(limit)
- ✅ Controller: `activity.controller.ts` — getRecent con ?limit= opcional
- ✅ Routes: `activity.routes.ts` — GET /api/activity
- ✅ Controller: `stats.controller.ts` — endpoint único que calcula totalTasks, completedTasks, completionRate, activePlans, pendingIdeas
- ✅ Routes: `stats.routes.ts` — GET /api/stats
- ✅ Ambas rutas registradas en `server.ts`

### 4.3 Activity Logging en Controllers Existentes ✅
Cada mutación relevante inserta un log automáticamente:
- ✅ `tasks.controller.ts`: on create, on status change to 'done', on delete
- ✅ `ideas.controller.ts`: on create, on promote, on decide
- ✅ `projects.controller.ts`: on create, on scan
- ✅ `plans.controller.ts`: on create
- ✅ `objectives.controller.ts`: on create

### 4.4 Frontend: Hooks ✅
- ✅ `useStats.ts` — useStats() → GET /api/stats
- ✅ `useActivity.ts` — useActivity(limit) → GET /api/activity?limit=

### 4.5 Overview Dashboard — 10 Cards funcionales ✅
Layout en pantallas xl+: Strategic Schema a la izquierda con 4 cards debajo, columna derecha con 6 cards adicionales. En pantallas menores todo apila verticalmente.

**Cards originales (datos reales):**
- ✅ **Stats Globales**: 4 mini-stats (tasks completadas/total, planes activos, ideas pendientes, % completion rate) + barra de progreso
- ✅ **Proyectos Activos**: lista de hasta 5 proyectos con status badge, click navega a tab Projects
- ✅ **Actividad Reciente**: feed vertical de últimas 10 acciones con iconos (✓ completed, + created, ↑ promoted, ⟲ scanned) y tiempo relativo
- ✅ **Captura Rápida**: toggle Idea/Task, formulario inline para crear sin cambiar de tab, feedback visual "Guardado ✓"

**Cards adicionales (datos reales + mock fallback):**
- ✅ **Objectives at a Glance**: barras de progreso por objetivo con % (datos reales)
- ✅ **Focus Queue**: top 6 tareas pendientes ordenadas por prioridad, con toggle de status clickeable (datos reales)
- ✅ **Task Breakdown**: barra apilada horizontal de distribución por estado + leyenda con contadores (datos reales)
- ✅ **Activity Heatmap**: grid estilo GitHub de actividad de las últimas 4 semanas, con leyenda de intensidad (datos reales, mock fallback)
- ✅ **Upcoming Deadlines**: tareas con deadline más cercano + días restantes coloreados (datos reales, mock fallback si no hay deadlines)
- ✅ **Scratchpad**: bloc de notas rápido persistente en localStorage

### 4.6 Strategic Schema — Polish Visual ✅
- ✅ Progress bars con color por valor: 0-33% rojo, 34-66% amber, 67-100% verde
- ✅ Mission header con `border-l-2 border-matrix-accent` para destacar
- ✅ Transiciones suaves `transition-all duration-300` en secciones expandibles

### 4.7 Task Board (Kanban) ✅
- ✅ Toggle lista/board en header de TasksView (iconos ☰ / ◫)
- ✅ Nuevo componente `TaskBoard.tsx`
- ✅ 4 columnas: Pending | In Progress | Done | Blocked — cada una con header + badge count
- ✅ Cards: título, dot de prioridad con color, nombre del plan
- ✅ Drag-and-drop HTML5 nativo entre columnas → actualiza status via React Query
- ✅ Filtros: por plan (dropdown) y por prioridad (dropdown)
- ✅ Status `blocked` añadido al schema de validación Zod del backend

### 4.8 Analytics Tab ✅
Reemplaza "Passwords" en el sidebar.
- ✅ Dependencia `recharts` v3 instalada
- ✅ Tab type actualizado: `'passwords'` → `'analytics'` en ui.store.ts
- ✅ Sidebar actualizado: icono ◪, sin disabled
- ✅ AppShell actualizado: case 'analytics' → `<AnalyticsView />`
- ✅ **Progreso de Objetivos**: BarChart horizontal, cada barra = un objetivo con %, colores rojo/amber/verde según valor
- ✅ **Distribución de Tareas**: PieChart donut con slices por status (pending, in_progress, done, blocked) + leyenda
- ✅ **Pipeline de Ideas**: PieChart donut con slices por status (pending, evaluating, approved, rejected, promoted) + leyenda

### 4.9 Right Panel — Widgets Contextuales ✅ (MOCK DATA)
Panel lateral derecho visible en pantallas xl+ (1280px+), 288px de ancho. Muestra widgets con datos mock que varían según el tab activo.

> **⚠ MOCK DATA — Candidatos a funcionalidades reales:**
> - **Daily Focus / Pomodoro tracker**: pomodorosToday/Goal, focusMinutes, currentTask → convertir en timer real con persistencia en DB
> - **Upcoming Deadlines**: mock deadlines con prioridad y días restantes → ya parcialmente real en Overview, unificar
> - **Productivity Streak**: streak de días consecutivos, tasks/semana, gráfico de barras semanal → calcular desde activity_log
> - **Weekly Burndown**: remaining vs completed por día → calcular desde tasks + activity_log
> - **Tech Radar**: tecnologías con rings Adopt/Trial/Assess/Hold → nueva tabla `tech_radar` con CRUD
> - **Dependencies Health**: versiones current vs latest, status ok/patch/minor/major → leer de package.json real + npm registry API
> - **Top Scored Ideas**: ideas ordenadas por totalScore → ya disponible desde ideas API, conectar
> - **Idea Funnel**: contadores por etapa del pipeline → calcular desde ideas API
> - **Key Metrics (KPIs)**: velocity, cycle time, throughput, WIP → calcular desde tasks + activity_log
> - **Weekly Trends**: completed vs created por semana → calcular desde activity_log
> - **Keyboard Shortcuts**: lista de atajos → implementar shortcuts reales (Phase 7)
> - **System Status**: API server, DB, sync, backups → health checks reales
> - **Motivational Quote**: rotación diaria de citas → podría ser configurable o AI-generated

| Overview | Daily Focus, Upcoming Deadlines, Productivity Streak, Daily Quote |
| Tasks | Productivity Streak, Weekly Burndown, Upcoming Deadlines |
| Projects | Tech Radar, Dependencies Health, System Status, Dev Feed |
| Ideas | Idea Funnel, Top Scored Ideas, Daily Quote |
| Analytics | Key Metrics, Weekly Trends, Productivity Streak |
| Settings | Keyboard Shortcuts, System Status, Daily Quote |

### 4.10 i18n ✅
18 keys nuevos añadidos en EN/ES:
- globalStats, activeProjects, recentActivity, quickCapture, completionRate, activePlans, pendingIdeas, noActivity
- idea, task, saved, analytics, objectivesProgress, taskDistribution, ideasPipeline
- board, list, blocked, pending, inProgress, done

### 4.11 API Endpoints Nuevos ✅
```
Activity: ✅
  GET    /api/activity             → últimas acciones (?limit= opcional, default 20)

Stats: ✅
  GET    /api/stats                → { totalTasks, completedTasks, completionRate, activePlans, pendingIdeas }
```

### 4.12 Archivos Nuevos ✅
- `src/backend/repositories/activity.repository.ts`
- `src/backend/controllers/activity.controller.ts`
- `src/backend/routes/activity.routes.ts`
- `src/backend/controllers/stats.controller.ts`
- `src/backend/routes/stats.routes.ts`
- `src/frontend/hooks/useStats.ts`
- `src/frontend/hooks/useActivity.ts`
- `src/frontend/components/tasks/TaskBoard.tsx`
- `src/frontend/components/analytics/AnalyticsView.tsx`
- `src/frontend/components/layout/RightPanel.tsx`

### 4.13 Archivos Modificados ✅
- `src/backend/db/schema.ts` — tabla activity_log
- `src/backend/db/migrate.ts` — CREATE TABLE activity_log
- `src/backend/server.ts` — registrar activity + stats routes
- `src/backend/controllers/tasks.controller.ts` — activity logging + status 'blocked'
- `src/backend/controllers/ideas.controller.ts` — activity logging
- `src/backend/controllers/projects.controller.ts` — activity logging
- `src/backend/controllers/plans.controller.ts` — activity logging
- `src/backend/controllers/objectives.controller.ts` — activity logging
- `src/frontend/stores/ui.store.ts` — Tab type: passwords → analytics
- `src/frontend/components/layout/Sidebar.tsx` — passwords → analytics
- `src/frontend/components/layout/AppShell.tsx` — analytics + RightPanel
- `src/frontend/components/overview/OverviewView.tsx` — 10 cards + visual polish + layout xl
- `src/frontend/components/tasks/TasksView.tsx` — toggle lista/board
- `src/frontend/lib/i18n.ts` — 18 keys nuevos

---

## Phase 5: Passwords + Security

You are helping me develop a local desktop application using Electron.

Context:

* The app runs completely locally.
* There is no global authentication system.
* I want to create a protected module called "Passwords".

Goal:
Create a clean and modular "Passwords" module inside my Electron application.

Requirements:

1. Access Protection

* The module must require a password before accessing it.
* The password must NOT be hardcoded.
* The password hash must be stored in a file called `settings.json`.

2. Password Security

* The password must be stored as a SHA-256 hash.
* The validation logic must hash the user input and compare it with the stored hash.
* Never store the password in plaintext.

3. Project Structure
   Create a modular structure like this:

Backend:
├── db/schema.ts           → + tabla passwords
├── db/migrate.ts          → + migración passwords
├── repositories/passwords.repository.ts  (nuevo)
├── controllers/passwords.controller.ts   (nuevo)
├── routes/passwords.routes.ts            (nuevo)
└── server.ts            → + router passwords
Frontend:
├── components/passwords/PasswordsView.tsx (nuevo)
├── hooks/usePasswords.ts                  (nuevo)
└── components/layout/Sidebar.tsx          → + tab Passwords

4. UI Behavior
   The Passwords module must contain:

Step 1 – Locked screen

* Password input
* Unlock button
* Error message if password is incorrect

Step 2 – Unlocked view

* Search bar
* Table listing passwords with columns:
  domain
  username
  password

5. Database
   Use SQLite locally to store the passwords.

Table structure:

passwords

* id
* domain
* username
* password

6. Import Feature
   Include a function to import a TXT file with thousands of lines and automatically insert them into the database.

Example format:

domain:username:password

The import function should:

* read the file
* split lines
* parse entries
* insert into SQLite.

7. Security Warning
   Add comments explaining that:

* Even if the app runs locally, hashes and database files can still be inspected.
* Suggest stronger practices like bcrypt and encrypted vaults.

Output requirements:

Generate:

* the folder structure
* the code for each file
* explanations of how the module integrates into Electron
* example code showing how to load the module from the main app


Refactor this module using a service layer and IPC communication between renderer and main process.

---

## Phase 6: AI Integration

### 6.1 AI Integration (opcional, local)
- Ollama integration para evaluación de ideas con AI
- AI reasoning como complemento al scoring manual
- Recomendaciones estratégicas
- Daily briefing ("hoy trabaja en esto, por esta razón")

> **Nota**: Token/AI Budget tracking se adelantó a Phase 3 (subscriptions en Settings)

---

## Phase 7: Polish + Distribution

### 7.1 Online Daily Quote (API Integration)

Reemplazar el array estático de citas en `RightPanel.tsx` con fetching desde una API externa.

**API a utilizar:**
- **Primary**: `https://zenquotes.io/api/random` (gratuita, sin API key, rate limit generoso)
- **Fallback**: API local con citas hardcodeadas si falla la request

**Comportamiento:**
- Fetch de una cita nueva cada vez que el usuario inicia sesión (abre la app)
- Cachear la cita en localStorage con timestamp para no re-fetch si se abre la app múltiples veces en el mismo día
- Si la API falla, usar fallback local (citas hardcodeadas rotando por índice)

**Riesgos y complejidad:**

| Aspecto | Nivel | Descripción |
|---------|-------|-------------|
| Conectividad | Medio | Requiere internet; manejar offline gracefully |
| Rate limiting | Bajo | zenquotes.io tiene límite amplio, pero implementar retry con backoff |
| Latencia | Bajo | La request es rápida (~200ms), pero debe ser no-bloqueante |
| Privacidad | Bajo | No se envía información sensible, solo se recibe texto |
| Offline fallback | Requerido | Si no hay conexión, mostrar cita local (array actual) |
| Error handling | Requerido | Timeout de 5s, si falla usar fallback |

**Implementación sugerida:**

1. **Nuevo hook** `useDailyQuote()` en `src/frontend/hooks/useDailyQuote.ts`:
   - Check localStorage por fecha actual
   - Si no hay cita hoy → fetch a zenquotes.io
   - Si fetch falla → usar array fallback con índice basado en fecha
   - Devolver `{ quote: string, author: string, isLoading: boolean }`

2. **Modificar** `RightPanel.tsx`:
   - Importar `useDailyQuote()` 
   - Reemplazar `QUOTES[Math.floor(Date.now() / 86400000) % QUOTES.length]` por datos del hook
   - Mostrar loading state (skeleton) mientras carga

3. **Cache en localStorage**:
   ```ts
   {
     date: "2026-03-10",
     quote: "...",
     author: "..."
   }
   ```

**APIs alternativas** (si zenquotes.io no funciona):
- `https://api.quotable.io/random` (puede tener rate limits más estrictos)
- `https://quotesondesign.com/wp-json/wp/v2/posts/?orderby=rand`
- Array local expandido (20-50 citas) como fallback definitivo

---

### 7.2 Developer APIs (Hacker News + GitHub Trending)

Complementar la sidebar derecha con APIs orientadas a desarrolladores.

**APIs a utilizar:**
- **Hacker News**: `https://hacker-news.firebaseio.com/v0/topstories.json` + `https://hacker-news.firebaseio.com/v0/item/{id}.json`
- **GitHub Trending**: `https://api.github.com/search/repositories?q=created:>${lastWeek}&sort=stars&order=desc` (sin auth, rate limit 60/hr)
- **Fallback**: Cache local con TTL de 1 hora si falla la request

**Widgets a mostrar:**
- **Top Stories (HN)**: 5 titulares de Hacker News con link externo
- **GitHub Trending**: 5 repositorios populares de la semana

**Comportamiento:**
- Fetch al cargar la app solo si el cache tiene más de 1 hora
- Mostrar skeleton mientras carga
- Si falla, usar cache antiguo (no bloquear UI)
- Links abiertos en navegador externo (Electron shell.openExternal)

**Riesgos y complejidad:**

| Aspecto | Nivel | Descripción |
|---------|-------|-------------|
| Conectividad | Medio | Requiere internet; manejar offline gracefully |
| Rate limiting | Medio | GitHub: 60 requests/hr sin auth, implementar cache agresivo |
| Latencia | Medio | HN es rápido (~100ms), GitHub puede tardar ~500ms |
| Privacidad | Bajo | Solo se reciben datos públicos |
| Error handling | Requerido | Timeout 5s, si falla usar cache o mostrar estado offline |
| Seguridad | Requerido | Sanitizar HTML de titulares, no usar innerHTML directo |

**Implementación sugerida:**

1. **Nuevo hook** `useDevFeed()` en `src/frontend/hooks/useDevFeed.ts`:
   - Check localStorage por cache con timestamp
   - Si cache vacío o expirado (>1h) → fetch HN + GitHub en paralelo
   - Devolver `{ hnStories: [], trendingRepos: [], isLoading: boolean, lastUpdated: Date }`

2. **Nuevo componente** `DevFeed.tsx`:
   - Sección "Hacker News" con lista de 5 titulares (título + dominio)
   - Sección "GitHub Trending" con lista de 5 repos (nombre + estrellas + descripción truncada)
   - Links con `target="_blank"` o `shell.openExternal()`

3. **Cache en localStorage**:
   ```ts
   {
     hnStories: [{ id, title, url, domain, time }],
     trendingRepos: [{ name, full_name, description, stargazers_count, html_url }],
     fetchedAt: "2026-03-10T14:30:00Z"
   }
   ```

4. **Modificar** `RightPanel.tsx`:
   - Importar `useDevFeed()` y `DevFeed`
   - Reemplazar widgets mock por datos reales donde corresponda

---

### 7.3 Notifications (deadline reminders, daily briefing)
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
| 18 tablas | 8 tablas + 3 nuevas (scans, evaluations, subscriptions) |
| Webpack | Vite |
| PostgreSQL/Supabase ready | SQLite only (local-first) |
| Scoring con sinónimos hardcodeados | Scoring semántico simplificado |
| Proyecto = entidad promovida de idea | Proyecto = entidad independiente + linkeable |
