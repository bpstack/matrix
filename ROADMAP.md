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

## Phase 3: Ideas Pipeline ✅

Sistema de captura, evaluación y promoción de ideas con Kanban visual.

### 3.1 Schema & Migration Updates ✅
- ✅ `ideas`: añadidos `target_type` TEXT (mission|objective|plan|task|null), `target_id` INTEGER (nullable), `project_id` INTEGER (nullable, FK → projects)
- ✅ Nueva tabla `idea_evaluations`: id, idea_id (FK unique 1:1), alignment_score (1-10), impact_score (1-10), cost_score (1-10), risk_score (1-10), total_score REAL, reasoning TEXT, decision (pending|approved|rejected), decided_at, created_at
- ✅ Migración: ALTER TABLE ideas + CREATE TABLE idea_evaluations
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

### 3.3 UI: Kanban de Ideas ✅
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

### 3.4 Centro de Ayuda ✅
- ✅ Botón `?` junto al título "Ideas" para abrir/cerrar panel de ayuda
- ✅ Panel completo debajo del Kanban (sin scroll interno, contenido completo visible)
- ✅ Secciones: flujo de trabajo, descripción de las 4 etapas, sistema de evaluación con fórmula, promoción, leyenda de iconos
- ✅ Bilingüe (EN/ES)

### 3.5 API Endpoints ✅
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
```

### 3.6 Arquitectura por entidad ✅
Siguiendo el patrón establecido en Phase 1:
- ✅ `routes/ideas.routes.ts`
- ✅ `controllers/ideas.controller.ts`
- ✅ `repositories/ideas.repository.ts`
- ✅ `hooks/useIdeas.ts`
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
> - **Keyboard Shortcuts**: lista de atajos → implementar shortcuts reales (Phase 6)
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

## Phase 5: Passwords + Security ✅ DONE

Módulo de passwords 100% local. Protegido con master password, cifrado AES-256-GCM individual por entry, CRUD completo, import TXT/CSV con preview editable, búsqueda instantánea y bulk operations. Zero dependencias externas de crypto.

### Diseño de seguridad

**Flujo criptográfico:**
```
Master Password (input del usuario)
  ├─ PBKDF2("auth:" + password, salt_auth, 600k iterations, sha512) → auth_hash  [verificar login]
  └─ PBKDF2("enc:"  + password, salt_enc,  600k iterations, sha512) → enc_key    [cifrar/descifrar]

Cada entry en DB:
  plaintext → AES-256-GCM(enc_key, random_iv) → "v1:base64(iv):base64(authTag):base64(ciphertext)"
```

**Principios:**
- `auth_hash` + `salt_auth` + `salt_enc` → guardados en tabla `settings` (keys: `passwords_auth_hash`, `passwords_salt_auth`, `passwords_salt_enc`)
- La master password **nunca se almacena** — solo su hash PBKDF2
- **Separación de dominio**: prefijos `auth:` y `enc:` en PBKDF2 evitan que auth_hash y enc_key puedan coincidir (retrocompatible con vaults legacy sin prefijo)
- **Prefijo `v1:`** en datos encriptados permite detección fiable vs plaintext legacy (sin heurísticas frágiles)
- La `enc_key` vive **solo en memoria** del proceso Node.js — nunca en disco, nunca en renderer
- Al hacer lock, el Buffer de `enc_key` se limpia con `.fill(0)` antes de setear a `null` (evita residuos en heap)
- `label`, `domain`, `username` → en claro (necesario para búsqueda SQL LIKE)
- `password` y `notes` → cifrados con AES-256-GCM + IV aleatorio por entry
- `getAll` **NO** descifra passwords — solo devuelve metadatos. El descifrado es bajo demanda vía `getById`
- Auto-lock al cambiar de tab Y por inactividad (5 min configurable): la `enc_key` se destruye de memoria
- Clipboard se limpia automáticamente a los 30 segundos tras copiar (con try/catch en timer)
- **Rate limiting**: 5 intentos fallidos → lockout 60s en unlock/setup/changeMaster
- **Re-key atómico**: `changeMasterPassword` usa transacción SQLite — si falla, rollback completo sin corrupción
- **Validación de IDs**: `parseInt` + `Number.isInteger` + `> 0` en todos los endpoints con `:id`
- **Import size limit**: máximo 10 MB por archivo

**Advertencia para mostrar en UI:**
> "Esta vault es local y no reemplaza a un password manager dedicado (Bitwarden, 1Password). Si alguien accede al archivo `.db`, puede ver dominios y usernames — las contraseñas sí están cifradas."

---

### Tabla `passwords`

```sql
CREATE TABLE IF NOT EXISTS passwords (
  id                 INTEGER PRIMARY KEY AUTOINCREMENT,
  label              TEXT NOT NULL,               -- nombre descriptivo: "Gmail personal", "API OpenAI"
  domain             TEXT,                        -- sitio/URL (opcional)
  username           TEXT,                        -- email o username (opcional)
  encrypted_password TEXT NOT NULL,               -- "base64(iv):base64(authTag):base64(ciphertext)"
  category           TEXT NOT NULL DEFAULT 'other', -- email|social|dev|finance|gaming|work|other
  favorite           INTEGER NOT NULL DEFAULT 0,  -- 0|1 — permite pin/favoritos para acceso rápido
  notes              TEXT,                        -- notas adicionales (opcional, también cifradas)
  created_at         TEXT NOT NULL,
  updated_at         TEXT NOT NULL
)
```

---

### 5.1 Schema + Migration ✅

**Archivos a modificar:**
- `src/backend/db/schema.ts` — añadir tabla `passwords` con Drizzle (mismo patrón que `activity_log`)
- `src/backend/db/migrate.ts` — añadir `CREATE TABLE IF NOT EXISTS passwords`

```typescript
// En schema.ts — añadir al final:
export const passwords = sqliteTable('passwords', {
  id:                integer('id').primaryKey({ autoIncrement: true }),
  label:             text('label').notNull(),
  domain:            text('domain'),
  username:          text('username'),
  encryptedPassword: text('encrypted_password').notNull(),
  category:          text('category').notNull().default('other'),
  favorite:          integer('favorite').notNull().default(0),
  notes:             text('notes'),
  createdAt:         text('created_at').notNull(),
  updatedAt:         text('updated_at').notNull(),
});
```

---

### 5.2 Crypto Engine *(nuevo — paralelo con 5.1)* ✅

**Archivo nuevo:** `src/backend/engines/crypto.ts`

Usa **solo** `node:crypto` (built-in de Node.js — zero install).

```typescript
import { randomBytes, pbkdf2Sync, createCipheriv, createDecipheriv, timingSafeEqual } from 'node:crypto';

const PBKDF2_ITERATIONS = 600_000; // OWASP 2023+ recommendation for SHA-512
const PBKDF2_KEYLEN     = 32;      // 256 bits
const PBKDF2_DIGEST     = 'sha512';

// --- AUTH ---
export function deriveAuthHash(masterPassword: string): { salt: string; hash: string } {
  const saltBuf = randomBytes(32);
  const hashBuf = pbkdf2Sync(masterPassword, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  return { salt: saltBuf.toString('base64'), hash: hashBuf.toString('base64') };
}

export function verifyAuthHash(masterPassword: string, storedSalt: string, storedHash: string): boolean {
  const saltBuf = Buffer.from(storedSalt, 'base64');
  const derived  = pbkdf2Sync(masterPassword, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
  // timingSafeEqual previene timing attacks — NUNCA comparar hashes con ===
  return timingSafeEqual(derived, Buffer.from(storedHash, 'base64'));
}

// --- ENCRYPTION KEY ---
export function generateEncSalt(): string { return randomBytes(32).toString('base64'); }

export function deriveEncryptionKey(masterPassword: string, storedSalt: string): Buffer {
  const saltBuf = Buffer.from(storedSalt, 'base64');
  return pbkdf2Sync(masterPassword, saltBuf, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST);
}

// --- AES-256-GCM ---
export function encrypt(plaintext: string, key: Buffer): string {
  const iv         = randomBytes(12); // 96-bit IV para GCM
  const cipher     = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag    = cipher.getAuthTag();
  return `${iv.toString('base64')}:${authTag.toString('base64')}:${ciphertext.toString('base64')}`;
}

export function decrypt(encrypted: string, key: Buffer): string {
  const [ivB64, tagB64, ctB64] = encrypted.split(':');
  if (!ivB64 || !tagB64 || !ctB64) throw new Error('Invalid encrypted format');
  const decipher = createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64'));
  return decipher.update(Buffer.from(ctB64, 'base64')) + decipher.final('utf8');
}
```

> **Test manual**: `encrypt("mi_pass", key)` → string cifrado. `decrypt(ese_string, key)` → `"mi_pass"`. Con key distinta → lanza error (authTag falla). Verificar antes de continuar.

---

### 5.3 Repository *(nuevo — depends on 5.1)* ✅

**Archivo nuevo:** `src/backend/repositories/passwords.repository.ts`

Patrón: igual que `settings.repository.ts`. Solo queries Drizzle, sin lógica de negocio.

```typescript
// Métodos:
findAll(category?: string): PasswordRow[]                   // ORDER BY favorite DESC, label ASC. Filtro opcional por category
findById(id: number): PasswordRow | undefined
search(query: string, category?: string): PasswordRow[]     // OR LIKE en label, domain, username + filtro category
findByDomainAndUsername(domain: string, username: string): PasswordRow | undefined
create(data: NewPassword): PasswordRow
update(id: number, data: Partial<NewPassword>): PasswordRow
delete(id: number): void
bulkCreate(entries: NewPassword[]): { inserted: number }    // en transacción SQLite
count(): number
```

Para `search`, usar `or(like(...), like(...), like(...))` de drizzle-orm.

Para `bulkCreate`, usar `getDb().transaction(...)` de better-sqlite3 para atomicidad.

---

### 5.4 Import TXT/CSV Parser *(nuevo — paralelo con 5.3)* ✅

**Archivo nuevo:** `src/backend/engines/import-parser.ts`

```typescript
export interface ParsedEntry {
  lineNumber: number; raw: string;
  label: string; domain?: string; username?: string; password: string;
  confidence: 'high' | 'medium' | 'low';
}
export interface UnmatchedLine { lineNumber: number; raw: string; reason: string; }
export interface ParseResult   { parsed: ParsedEntry[]; unmatched: UnmatchedLine[]; format: 'csv' | 'txt'; }
```

**Detección de formato:**
1. Si la primera línea contiene headers CSV comunes (`name,url,username,password` o variantes de Chrome/Firefox/Bitwarden) → modo CSV
2. Si no → modo TXT (parsing heurístico)

**Modo CSV** (formato principal — es lo que exportan Chrome, Firefox, Bitwarden, 1Password):
- Parsear headers de la primera línea (case-insensitive, trim)
- Mapear columnas conocidas: `name|title|label` → label, `url|website|login_uri` → domain, `username|login|email` → username, `password` → password, `notes|extra` → notes
- Si no se detecta columna `password` → `unmatched` todo el archivo con reason "No password column detected"
- Manejar valores con comillas (CSV estándar: campos con comas van entre `"..."`, `""` escapa comillas)
- Todas las entries CSV → `confidence = 'high'`

**Modo TXT** (fallback heurístico — para cada línea en orden de prioridad):

1. Trim + skip si vacía o whitespace
2. **Pair mode**: si la línea actual no tiene separador reconocible Y la siguiente línea parece una password (sin espacios, >6 chars) → `label = línea_actual`, `password = línea_siguiente`, marcar siguiente como consumida, `confidence = 'low'`
3. **Separador `:`**: split en los primeros 2 `:` únicamente
   - 2 tokens `[A, B]`: si A tiene `@` → `username=A`, `password=B`, `conf=high`; si A parece dominio → `domain=A`, `password=B`, `conf=high`; si no → `label=A`, `password=B`, `conf=medium`
   - 3+ tokens: `label/domain=token[0]`, `username=token[1]`, `password=tokens.slice(2).join(':')`, `conf=high`
4. **Separador `|`**: misma lógica con 2-3 tokens
5. **Split por primer espacio**: `[A, ...rest]` — si A parece email/dominio → `username/domain=A`, `password=rest.join(' ')`, `conf=medium`
6. **No reconocida** → `unmatched` con reason descriptivo

**Heurísticas:**
```typescript
const isEmail  = (s: string) => s.includes('@') && s.includes('.');
const isDomain = (s: string) => /\.(com|org|net|io|dev|app|es|co|uk|me|info)(\/|$)/i.test(s);
const isUrl    = (s: string) => s.startsWith('http://') || s.startsWith('https://');
```

**Post-parse (ambos modos):**
- Si `domain` es URL → extraer hostname con `new URL(domain).hostname` (en try-catch)
- Si `label` sin asignar → usar `domain || username || 'Imported'`
- Entries con `password` vacío → mover a `unmatched`

**Función exportada:** `export function parseImportContent(content: string): ParseResult`

---

### 5.5 Controller *(nuevo — depends on 5.2, 5.3, 5.4)* ✅

**Archivo nuevo:** `src/backend/controllers/passwords.controller.ts`

**Variable de módulo (encryption key en memoria):**
```typescript
// Al inicio del archivo — vive solo en proceso Node.js, nunca en disco
let encryptionKey: Buffer | null = null;
let inactivityTimer: ReturnType<typeof setTimeout> | null = null;
const INACTIVITY_TIMEOUT_MS = 5 * 60 * 1000; // 5 min — configurable vía settings

function resetInactivityTimer() {
  if (inactivityTimer) clearTimeout(inactivityTimer);
  if (encryptionKey) {
    inactivityTimer = setTimeout(() => lockVault(), INACTIVITY_TIMEOUT_MS);
  }
}

function lockVault() {
  if (encryptionKey) encryptionKey.fill(0); // limpiar de heap antes de soltar referencia
  encryptionKey = null;
  if (inactivityTimer) { clearTimeout(inactivityTimer); inactivityTimer = null; }
}
```

**Middleware:**
```typescript
function requireUnlocked(req: Request, res: Response, next: NextFunction) {
  if (!encryptionKey) return res.status(401).json({ error: 'Vault is locked' });
  next();
}
```

**Endpoints:**

| Endpoint | Lógica |
|----------|--------|
| `isSetup` | Leer `passwords_auth_hash` de settings → `{ isSetup: !!hash, isUnlocked: !!encryptionKey }` |
| `setup` | Zod: `{ masterPassword: string min(8) }`. `deriveAuthHash()` → settings `passwords_auth_hash` + `passwords_salt_auth`. `generateEncSalt()` → settings `passwords_salt_enc`. Responde `{ ok: true }` |
| `unlock` | Zod: `{ masterPassword }`. Leer `passwords_salt_auth` de settings. Verificar con `verifyAuthHash()` → si falla, 401. `deriveEncryptionKey()` → asignar `encryptionKey`. Iniciar `resetInactivityTimer()`. Responde `{ ok: true }` |
| `lock` | `lockVault()` (fill(0) + null). Responde `{ ok: true }` |
| `getAll` | `requireUnlocked`. `resetInactivityTimer()`. Leer `req.query.search` y `req.query.category`. Si search → `repo.search(query)`, si category → filtrar, si no → `repo.findAll()`. Devolver **solo metadatos** (label, domain, username, category, favorite, timestamps) — **NO descifrar passwords ni notes** |
| `getById` | `requireUnlocked`. `resetInactivityTimer()`. `repo.findById()` → 404 si no. Descifrar `encryptedPassword` y `notes`. Devolver con campos en claro |
| `create` | `requireUnlocked`. `resetInactivityTimer()`. Zod `createSchema`. `encrypt(password)` + `encrypt(notes)`. `repo.create()`. Activity log |
| `update` | `requireUnlocked`. `resetInactivityTimer()`. Zod `updateSchema` (partial). Si viene `password` → re-cifrar. Si viene `notes` → re-cifrar. `repo.update()` |
| `delete` | `requireUnlocked`. `resetInactivityTimer()`. `repo.delete()`. Activity log |
| `toggleFavorite` | `requireUnlocked`. `resetInactivityTimer()`. `repo.findById()` → toggle `favorite` 0↔1. `repo.update()` |
| `parseImportFile` | `requireUnlocked`. `resetInactivityTimer()`. Body: `{ content: string }`. Llamar `parseImportContent()`. Devolver `{ parsed, unmatched }`. **NO inserta nada** |
| `confirmImport` | `requireUnlocked`. `resetInactivityTimer()`. Body: `{ entries: ParsedEntry[] }`. Para cada entry: `findByDomainAndUsername()` para detectar duplicados. `encrypt(password)`. `repo.bulkCreate()`. Activity log. Responder `{ inserted, skippedDuplicates }` |
| `changeMasterPassword` | `requireUnlocked`. `resetInactivityTimer()`. Zod: `{ currentPassword, newPassword min(8) }`. Verificar current con `passwords_salt_auth`. Obtener todas las entries → descifrar → re-cifrar con nueva key → bulk update. Generar nuevos salts (auth + enc) → guardar en settings. Asignar nueva key |

**Zod schemas:**
```typescript
const setupSchema          = z.object({ masterPassword: z.string().min(8) });
const unlockSchema         = z.object({ masterPassword: z.string().min(1) });
const createSchema         = z.object({
  label: z.string().min(1), domain: z.string().optional(), username: z.string().optional(),
  password: z.string().min(1), category: z.enum(['email','social','dev','finance','gaming','work','other']).default('other'),
  favorite: z.number().min(0).max(1).default(0),
  notes: z.string().optional(),
});
const updateSchema         = createSchema.partial();
const importConfirmSchema  = z.object({
  entries: z.array(z.object({ label: z.string().min(1), domain: z.string().optional(),
    username: z.string().optional(), password: z.string().min(1),
    category: z.enum(['email','social','dev','finance','gaming','work','other']).default('other'),
  }))
});
const changeMasterSchema   = z.object({ currentPassword: z.string().min(1), newPassword: z.string().min(8) });
```

---

### 5.6 Routes *(nuevo — depends on 5.5)* ✅

**Archivo nuevo:** `src/backend/routes/passwords.routes.ts`

```typescript
import { Router } from 'express';
import { passwordsController } from '../controllers/passwords.controller';

const router = Router();

// Auth + status (no requieren unlock)
router.get('/passwords/status',          passwordsController.isSetup);
router.post('/passwords/setup',          passwordsController.setup);
router.post('/passwords/unlock',         passwordsController.unlock);
router.post('/passwords/lock',           passwordsController.lock);

// Import (requieren unlock — rutas literales ANTES de :id)
router.post('/passwords/import/parse',   passwordsController.parseImportFile);
router.post('/passwords/import/confirm', passwordsController.confirmImport);

// Operaciones protegidas (requieren unlock)
router.post('/passwords/change-master',  passwordsController.changeMasterPassword);
router.get('/passwords',                 passwordsController.getAll);
router.get('/passwords/:id',             passwordsController.getById);
router.post('/passwords',                passwordsController.create);
router.patch('/passwords/:id',           passwordsController.update);
router.patch('/passwords/:id/favorite',  passwordsController.toggleFavorite);
router.delete('/passwords/:id',          passwordsController.delete);

export { router as passwordsRouter };
```

> ⚠️ **Orden importante**: rutas con paths literales (`/status`, `/setup`, `/import/parse`) deben registrarse **antes** de `/passwords/:id` para que Express no trate `status` como un `:id`.

**En `src/backend/server.ts`** añadir:
```typescript
import { passwordsRouter } from './routes/passwords.routes';
app.use('/api', passwordsRouter);
```

---

### 5.7 IPC para File Picker *(modifica archivos existentes)* ✅

**En `src/backend/index.ts`** — añadir junto a los IPC handlers existentes:
```typescript
import { readFileSync } from 'node:fs';

ipcMain.handle('select-import-file', async () => {
  const result = await dialog.showOpenDialog({
    properties: ['openFile'],
    filters: [{ name: 'Password Files', extensions: ['csv', 'txt'] }],
    title: 'Seleccionar archivo de contraseñas',
  });
  if (result.canceled || !result.filePaths[0]) return null;
  // El archivo se lee en main process — el renderer nunca accede al filesystem
  return readFileSync(result.filePaths[0], 'utf-8');
});
```

**En `src/backend/preload.ts`** — añadir en el objeto expuesto:
```typescript
selectImportFile: () => ipcRenderer.invoke('select-import-file'),
```

**En `src/backend/types.d.ts`** — añadir interfaz global de `window.matrix` (actualmente solo declara electron-squirrel-startup):
```typescript
interface MatrixAPI {
  apiBase: string;
  platform: string;
  selectDirectory: () => Promise<string | null>;
  openDirectory: (path: string) => Promise<void>;
  onThemeChange: (callback: (theme: string) => void) => void;
  selectImportFile: () => Promise<string | null>; // nuevo
}
declare global {
  interface Window { matrix: MatrixAPI; }
}
```

---

### 5.8 Hook *(nuevo — depends on 5.6)* ✅

**Archivo nuevo:** `src/frontend/hooks/usePasswords.ts`

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiFetch } from '../lib/api';

// Metadatos (lo que devuelve getAll — sin password ni notes descifrados)
export interface PasswordEntry {
  id: number; label: string; domain?: string; username?: string;
  category: string; favorite: number;
  createdAt: string; updatedAt: string;
}

// Entry completa con datos descifrados (lo que devuelve getById)
export interface PasswordEntryFull extends PasswordEntry {
  password: string; notes?: string;
}

export function usePasswordStatus() {
  return useQuery<{ isSetup: boolean; isUnlocked: boolean }>({
    queryKey: ['passwords', 'status'],
    queryFn: () => apiFetch('/passwords/status'),
    // Sin refetchInterval — se invalida manualmente tras lock/unlock/setup
  });
}

export function usePasswords(search?: string, category?: string, enabled = false) {
  return useQuery<PasswordEntry[]>({
    queryKey: ['passwords', 'list', search, category],
    queryFn: () => {
      const params = new URLSearchParams();
      if (search)   params.set('search', search);
      if (category && category !== 'all') params.set('category', category);
      return apiFetch(`/passwords?${params}`);
    },
    enabled,
  });
}

// Mutations a implementar siguiendo patrón useIdeas.ts:
// useSetupMaster, useUnlockVault, useLockVault,
// useCreatePassword, useUpdatePassword, useDeletePassword,
// useToggleFavorite, useParseImport, useConfirmImport, useChangeMasterPassword
// Todas con onSuccess → invalidateQueries(['passwords', ...])
// useUnlockVault y useLockVault deben también invalidar ['passwords', 'status']
// useGetPasswordById(id) → apiFetch(`/passwords/${id}`) para descifrado bajo demanda
```

---

### 5.9 PasswordsView — 3 estados *(nuevo — depends on 5.8)* ✅

**Archivo nuevo:** `src/frontend/components/passwords/PasswordsView.tsx`

**Estructura controlada por `usePasswordStatus()`:**
```
status.isSetup === false      →  <SetupScreen />
status.isSetup && !isUnlocked →  <LockScreen />
status.isUnlocked             →  <VaultView />
```

**`<SetupScreen />`:**
- Input "Master Password" + Input "Confirmar"
- Indicador de fuerza por colores: rojo <8 chars → amarillo 8-11 → verde ≥12
- Botón deshabilitado si no coinciden o <8 chars
- Advertencia: "Esta contraseña no se puede recuperar. Guárdala fuera de la app."

**`<LockScreen />`:**
- Icono 🔒 grande centrado
- Input password (Enter para submit)
- Botón "Desbloquear" / "Unlock"
- Error con fade-out tras 3s si falla

**`<VaultView />`:**
```
Header: "Passwords" + badge N  |  [🔒 Bloquear]  [+ Nueva]  [↑ Importar]
Controls: [🔍 Buscar...]  [Categoría ▼]  [★ Solo favoritos]
Tabla: ★ | Label | Domain | Username | Password | Category | Acciones
       ★   Gmail  | goo...  | user@... | ••••••••  | email    | 👁 📋 ✏️ 🗑
Footer: "234 contraseñas" — ordenadas por favorite DESC, label ASC
```

**Lógica de acciones por fila:**
- **★ Favorito**: click → `PATCH /passwords/:id/favorite` → toggle. Favoritos aparecen primero
- **👁 Revelar**: al click → `GET /passwords/:id` (descifra bajo demanda) → mostrar 5s → auto-ocultar. No se descifra en getAll
- **📋 Copiar**: `GET /passwords/:id` → `navigator.clipboard.writeText(password)`. Icono → "✓" 2s. `setTimeout(() => navigator.clipboard.writeText(''), 30_000)` para auto-clear
- **✏️ Editar**: `GET /passwords/:id` → modal pre-cargado con todos los campos (incluye password y notes descifrados)
- **🗑 Eliminar**: confirmación inline ("¿Eliminar?" + botón rojo)

**Modal Crear/Editar:**
- Campos: Label*, Domain, Username, Password* (toggle show/hide), Category (select), Notes (textarea)
- Botón "Generar" → string aleatorio seguro de 16 chars (letras + números + símbolos)

---

### 5.10 Import Flow UI *(integrado en VaultView)* ✅

**Modal en 4 pasos** activado por botón "↑ Importar":

**Paso 1 — Selección:**
```
[📁 Seleccionar archivo .csv / .txt]
Nota: "Soporta exports de Chrome, Firefox, Bitwarden, 1Password (CSV) y archivos de texto."
      "El archivo se lee localmente. Ningún dato sale de tu equipo."
```
Click → `window.matrix.selectImportFile()` → IPC → file picker nativo → `POST /api/passwords/import/parse`

**Paso 2 — Parsing:** spinner "Analizando archivo..."

**Paso 3 — Preview:**
```
234 entradas detectadas · 18 no reconocidas
[✓ Válidas (234)]  [⚠ No reconocidas (18)]

  [✓] Gmail personal   | gmail.com | user@.. | ••••  | 🟢 Alta
  [✓] App desconocida  | —         | —       | ••••  | 🟡 Media
  [ ] ???              | —         | —       | ••••  | 🔴 Baja  ← desmarcado por defecto
```
- Confianza 🔴 Baja → desmarcado por defecto
- Celdas label/domain/username editables inline (click para editar)
- Botón "Seleccionar todas / Ninguna"

**Paso 4 — Confirmación:**
```
A importar: 221 · Descartadas: 13 · Duplicados detectados: 4 (se saltarán)
[Cancelar]  [Confirmar importación →]
→ resultado: ✓ 217 insertadas · 4 duplicados · 13 descartadas
```

---

### 5.11 Sidebar + AppShell + Auto-lock ✅

**`src/frontend/stores/ui.store.ts`:**
```typescript
export type Tab = 'overview' | 'projects' | 'tasks' | 'ideas' | 'analytics' | 'passwords' | 'settings';
```

**`src/frontend/components/layout/Sidebar.tsx`:**
```typescript
{ id: 'passwords', label: t('passwords', language), icon: '🔒' }
// Entre analytics y settings
```

**`src/frontend/components/layout/AppShell.tsx`:**
```tsx
case 'passwords': return <PasswordsView />;
```

**Auto-lock al salir del tab:**
```tsx
const prevTab = useRef(activeTab);
useEffect(() => {
  if (prevTab.current === 'passwords' && activeTab !== 'passwords') {
    apiFetch('/passwords/lock', { method: 'POST' }).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ['passwords', 'status'] });
  }
  prevTab.current = activeTab;
}, [activeTab]);
```

**Auto-lock por inactividad (server-side):**
El timer de inactividad vive en el controller (§5.5). Cada endpoint protegido llama `resetInactivityTimer()`. Si pasan 5 min sin actividad, `lockVault()` se ejecuta automáticamente. El frontend detecta el cambio via `usePasswordStatus()` que retornará `isUnlocked: false` → muestra `<LockScreen />`.

---

### 5.12 i18n *(src/frontend/lib/i18n.ts)* ✅

```typescript
passwords:          { en: 'Passwords',              es: 'Contraseñas' },
vault:              { en: 'Vault',                   es: 'Bóveda' },
setupVault:         { en: 'Setup Vault',             es: 'Configurar Bóveda' },
masterPassword:     { en: 'Master Password',         es: 'Contraseña maestra' },
confirmPassword:    { en: 'Confirm Password',        es: 'Confirmar contraseña' },
unlock:             { en: 'Unlock',                  es: 'Desbloquear' },
lock:               { en: 'Lock',                    es: 'Bloquear' },
incorrectPassword:  { en: 'Incorrect password',      es: 'Contraseña incorrecta' },
passwordsDontMatch: { en: 'Passwords do not match',  es: 'Las contraseñas no coinciden' },
newPassword:        { en: 'New Password',            es: 'Nueva contraseña' },
editPassword:       { en: 'Edit Password',           es: 'Editar contraseña' },
generatePassword:   { en: 'Generate',                es: 'Generar' },
showPassword:       { en: 'Show',                    es: 'Mostrar' },
hidePassword:       { en: 'Hide',                    es: 'Ocultar' },
copyPassword:       { en: 'Copy',                    es: 'Copiar' },
copied:             { en: 'Copied! Clears in 30s',   es: '¡Copiado! Se borrará en 30s' },
notes:              { en: 'Notes',                   es: 'Notas' },
importPasswords:    { en: 'Import Passwords',        es: 'Importar contraseñas' },
importPreview:      { en: 'Import Preview',          es: 'Vista previa de importación' },
linesMatched:       { en: 'entries detected',        es: 'entradas detectadas' },
linesUnmatched:     { en: 'not recognized',          es: 'no reconocidas' },
duplicatesSkipped:  { en: 'duplicates skipped',      es: 'duplicados saltados' },
confirmImport:      { en: 'Confirm Import',          es: 'Confirmar importación' },
confidenceHigh:     { en: 'High',                    es: 'Alta' },
confidenceMedium:   { en: 'Medium',                  es: 'Media' },
confidenceLow:      { en: 'Low',                     es: 'Baja' },
catEmail:           { en: 'Email',                   es: 'Email' },
catSocial:          { en: 'Social',                  es: 'Social' },
catDev:             { en: 'Dev',                     es: 'Dev' },
catFinance:         { en: 'Finance',                 es: 'Finanzas' },
catGaming:          { en: 'Gaming',                  es: 'Gaming' },
catWork:            { en: 'Work',                    es: 'Trabajo' },
catOther:           { en: 'Other',                   es: 'Otros' },
```

---

### Resumen de archivos

**Nuevos:**
- `src/backend/engines/crypto.ts` — PBKDF2 + AES-256-GCM (código completo en §5.2)
- `src/backend/engines/import-parser.ts` — parser best-effort multi-formato (§5.4)
- `src/backend/repositories/passwords.repository.ts` — patrón: `settings.repository.ts`
- `src/backend/controllers/passwords.controller.ts` — patrón: `ideas.controller.ts`
- `src/backend/routes/passwords.routes.ts` — patrón: `settings.routes.ts`
- `src/frontend/hooks/usePasswords.ts` — patrón: `useIdeas.ts`
- `src/frontend/components/passwords/PasswordsView.tsx` — patrón: `IdeasView.tsx`

**Modificados:**
- `src/backend/db/schema.ts` — tabla `passwords`
- `src/backend/db/migrate.ts` — `CREATE TABLE IF NOT EXISTS passwords`
- `src/backend/server.ts` — `app.use('/api', passwordsRouter)`
- `src/backend/index.ts` — IPC handler `select-import-file`
- `src/backend/preload.ts` — `selectImportFile` en contextBridge
- `src/backend/types.d.ts` — tipo `selectImportFile`
- `src/frontend/stores/ui.store.ts` — tab type `'passwords'`
- `src/frontend/components/layout/Sidebar.tsx` — tab Passwords 🔒
- `src/frontend/components/layout/AppShell.tsx` — case passwords + auto-lock
- `src/frontend/lib/i18n.ts` — ~30 keys EN/ES

---

### Verification

1. **Crypto roundtrip**: `encrypt("test", key)` → `decrypt(result, key)` === `"test"`. Key incorrecta → throw.
2. **Auth**: `verifyAuthHash("pass", salt, hash)` === true (usa `timingSafeEqual`). String distinto → false.
3. **Parser CSV**: export de Chrome (`name,url,username,password`) → todas las entries con `confidence: high`. Headers case-insensitive.
4. **Parser TXT**: probar cada formato manualmente. Líneas basura → `unmatched` con reason legible.
5. **Flujo completo manual**:
   - Tab Passwords → Setup screen → crear master password ≥8 chars
   - Lock screen → desbloquear → Vault vacío
   - Crear entry → aparece en tabla con password oculto (getAll no descifra)
   - Revelar → `GET /passwords/:id` → visible 5s → vuelve a `••••••`
   - Copiar → `GET /passwords/:id` → clipboard → esperar 30s → clipboard vacío
   - Favorito → click ★ → entry sube al top de la lista
   - Editar → guardar → tabla actualizada
   - Eliminar → confirmación → desaparece
   - Import CSV (Chrome export) → preview → ajustar → confirmar → resultado
   - Import TXT → preview → ajustar → confirmar → resultado
   - Cambiar de tab → volver → **Lock screen** (auto-lock funciona)
   - Esperar 5 min sin actividad → **Lock screen** (inactivity lock funciona)
   - Cerrar y reabrir → Lock screen (master persiste, vault bloqueado)
6. **Seguridad**:
   - `matrix.db` con DB Browser → `encrypted_password` ilegible (formato `b64:b64:b64`)
   - `GET /api/passwords` sin unlock → `401 { error: 'Vault is locked' }`
   - `GET /api/passwords` con unlock → **NO contiene passwords descifrados** (solo metadatos)
   - Encryption key no aparece en archivos, localStorage, ni devtools
   - Auth verification usa `timingSafeEqual` (no vulnerable a timing attacks)
   - Al hacer lock, el Buffer se limpia con `fill(0)` antes de soltar referencia

---

## Phase 6: Polish + Distribution

### 6.1 Daily Quote API ✅

Reemplazar el array estático de citas en `RightPanel.tsx` con fetching desde una API externa.

- ✅ **API externa**: Integración con `https://zenquotes.io/api/random` (o fallback local)
- ✅ **Backend**: Nuevo endpoint `/api/external/daily-quote` en `external.controller.ts`
- ✅ **Frontend**: Nuevo hook `useDailyQuote()` en `src/frontend/hooks/useDailyQuote.ts`
- ✅ **UI**: Reemplazar cita estática por datos dinámicos del hook
- ✅ **Fallback**: API local con citas hardcodeadas si falla la request
- ✅ **Refresh button**: Botón discreto ↻ para obtener nueva cita

**Comportamiento:**
- Fetch de una cita nueva cada vez que el usuario inicia sesión (abre la app)
- Cachear la cita en localStorage con timestamp para no re-fetch si se abre la app múltiples veces en el mismo día
- Botón de refresh para obtener nueva cita manualmente
- Si la API falla, usar fallback local (citas hardcodeadas rotando aleatoriamente)

---

### 6.2 Developer APIs (Hacker News + GitHub Trending) ✅

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

### 6.2 Developer APIs (Hacker News + GitHub Trending) ✅

Complementar la sidebar derecha con APIs orientadas a desarrolladores.

- ✅ **Backend**: Endpoint `/api/external/dev-feed` en `external.controller.ts`
- ✅ **HN Integration**: Fetch a `https://hacker-news.firebaseio.com/v0/topstories.json`, obtener top 10
- ✅ **GitHub Trending**: Fetch a GitHub API con repos trending de la última semana
- ✅ **Frontend**: Hook `useDevFeed()` + componente en `RightPanel.tsx`
- ✅ **Cache**: localStorage con TTL de 1 hora
- ✅ **UI**: Dos secciones en RightPanel - "Hacker News" + "GitHub Trending"

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

### 6.3 Notifications (deadline reminders, daily briefing)
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
