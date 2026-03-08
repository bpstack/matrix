# GUIA MATRIX — Entendiendo tu proyecto

## Que es Matrix?

Matrix es una app de escritorio que te ayuda a decidir **en que trabajar cada dia** de forma estrategica. No es una agenda ni un to-do list — es un **motor de decision** que analiza tus proyectos, calcula prioridades con una formula matematica, y te dice: "hoy trabaja en esto, con esta herramienta, por esta razon".

---

## Como funciona tecnicamente?

Matrix es una app **Electron**. Electron permite crear apps de escritorio usando tecnologias web. VS Code, Discord y Slack estan hechas con Electron.

### 1. Main Process (Backend) — `src/backend/`
- **Express** (servidor HTTP en localhost:3939) — recibe peticiones de la UI
- **SQLite** (better-sqlite3) — almacena datos localmente
- **Drizzle ORM** — queries type-safe en TypeScript

### 2. Renderer Process (Frontend) — `src/frontend/`
- **React 18** — la interfaz
- **Tailwind CSS 3.4** — estilos (dark theme, golden accent)
- **Zustand** — estado global de la UI
- **React Query** — peticiones al backend con cache

### Comunicacion
```
[React UI] --fetch()--> [Express :3939] --Drizzle ORM--> [SQLite DB]
```

---

## Base de Datos (8 tablas)

| Tabla           | Proposito                                      |
| --------------- | ---------------------------------------------- |
| `settings`      | Config global (tema, idioma, puerto)           |
| `mission`       | Mision principal (1 activa)                    |
| `objectives`    | Objetivos vinculados a la mision               |
| `plans`         | Planes para alcanzar objetivos                 |
| `tasks`         | Tareas concretas dentro de planes              |
| `projects`      | Proyectos registrados                          |
| `project_links` | Links polimorficos (proyecto ↔ cualquier entidad) |
| `ideas`         | Captura rapida (promovibles a task)            |

Jerarquia: **Mission → Objectives → Plans → Tasks**

---

## Donde se guardan mis datos?

```
Windows:  C:\Users\dz\AppData\Roaming\Matrix\data\matrix.db
Linux:    ~/.config/Matrix/data/matrix.db
```

---

## Comandos

```bash
pnpm start          # Lanza la app
pnpm test           # Ejecuta tests
pnpm run package    # Empaqueta como ejecutable
```

---

## Stack

Electron Forge (Vite) | React 18 | Tailwind CSS 3.4 | Poppins font | Zustand | Drizzle ORM | Express 4 | Zod | Vitest
