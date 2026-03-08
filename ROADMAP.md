# Matrix — Roadmap

## Phase 0: Infrastructure + DB ✅
- Electron Forge + Vite + TypeScript scaffold
- React 18 + Tailwind 3.4 dark theme (Poppins font, golden accent)
- Express on :3939 with health check
- SQLite + Drizzle ORM (8 tables: mission, objectives, plans, tasks, projects, project_links, ideas, settings)
- AppShell with sidebar (6 tabs)
- Preload with window.matrix.apiBase
- i18n dictionary (EN/ES)

## Phase 1: Core CRUD
- Mission/Objectives/Plans/Tasks full CRUD (routes + controllers + repositories)
- Projects CRUD + project_links management
- Ideas pipeline (create, list, promote to task)
- Settings API (key-value store)
- React Query hooks for all entities
- Basic list/detail views per tab

## Phase 2: Dashboard + Views
- Overview dashboard with stats (total tasks, completion rate, active plans)
- Project detail view with linked entities
- Task board view (kanban-style by status)
- Drag-and-drop reordering (sort_order)
- Progress auto-calculation (plans from tasks)

## Phase 3: Advanced Features
- Recharts integration (progress over time, task burndown)
- Idea evaluation scoring (local scoring service)
- Deadline tracking + overdue highlighting
- Search/filter across all entities
- Bulk operations (multi-select tasks, batch status change)

## Phase 4: Passwords + Security
- Password categories + encrypted password storage
- Master password with argon2 hashing
- Password generator
- Copy-to-clipboard with auto-clear

## Phase 5: AI + Tokens + Strategy
- Strategy engine: Vision → Strategy → Pillars → Objectives hierarchy
- Strategic scoring formula: (Impact × Alignment × Probability) / (Time × ResourceCost × Risk)
- AI integration (Ollama/OpenCode — local, optional)
- Subscription/token budget tracking
- AI-assisted idea evaluation
- Strategic recommendations + daily briefing

## Phase 6: Polish + Distribution
- Notifications (daily briefing, deadline reminders)
- Keyboard shortcuts
- Export/import data
- Auto-updater
- Installer builds (Squirrel, DMG, AppImage)
- Tests with Vitest, error handling, logging
