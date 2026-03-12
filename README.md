# Matrix — Strategic Personal Professional System

<p align="center">
  <strong>All-in-one desktop app for developers to organize ideas, projects, planning, roadmaps, tasks, and development metrics</strong>
</p>

<p align="center">
  <br/>
  <a href="#availability">Available on</a> •
  <a href="#features">Features</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#getting-started">Getting Started</a> •
  <a href="#development">Development</a>
</p>

---

## The Problem

How many times have you had an idea and written it in a `.txt` file… and later lost it?

How many times have you had multiple projects in mind and didn't know how to organize them or where to put the focus?

Questions start appearing:

- What's the actual plan?
- What are the objectives?
- What's the hierarchy of plans?

Then more practical questions:

- How many lines of code does your project have?
- How many dependencies are you using?
- How is the roadmap progressing?

And when it comes to daily work:

- What tasks should you actually do today?
- How do you properly assign Claude Code tokens to the complex tasks that really require them?
- Which code should you just write yourself?

And then there's another common developer problem:

- Do you have encrypted passwords hidden somewhere in your computer?
- Do you constantly fight with `.env` files, secret configs, and credentials stored in random places?

## The Solution

**Matrix** is a desktop application for developers designed to organize:

- 💡 **Ideas** — Capture, evaluate, and promote ideas into actionable items
- 📁 **Projects** — Track multiple projects with progress metrics
- 📋 **Planning** — Mission → Objectives → Plans → Tasks hierarchy
- 🗺️ **Roadmaps** — Visualize your project's evolution
- ✅ **Tasks** — Daily task management with board view
- 🔐 **Passwords** — Secure, encrypted password vault
- 📊 **Metrics** — Development analytics and insights

All in one place.

---

## Availability

**Matrix** is a desktop application built with [Electron](https://www.electronjs.org/) — not a web app. This means:

- 📥 Download the source → run locally on your machine
- 🖥️ Opens as a real desktop window (not in browser)
- 🌐 Works offline — no internet required after setup

### Install & Run

```bash
git clone https://github.com/bpstack/matrix.git
cd matrix
pnpm install
pnpm start
```

### Build Installers

```bash
pnpm make   # Creates .exe/.dmg/.deb for your OS
```

---

## Features

### Ideas Management

- Capture ideas with rich descriptions
- Evaluate ideas using alignment, impact, cost, and risk scores
- Promote ideas to projects, objectives, plans, or tasks with one click

### Project Tracking

- Link projects to any entity (missions, objectives, plans, tasks)
- Track progress through the hierarchy
- Monitor dependencies and relationships

### Planning Hierarchy

- **Mission** → **Objectives** → **Plans** → **Tasks**
- Visual progress calculation at each level
- Automatic progress aggregation

### Task Management

- Kanban-style board view
- Status tracking: Todo → In Progress → Done
- Drag-and-drop organization → WIP

### Password Vault

- AES-256-GCM encrypted storage
- Master password protection
- Import/export support (1Password, Bitwarden, CSV)
- Secure password generation → WIP

### Development Metrics

- Track project lines of code
- Monitor dependencies
- Visualize progress over time

### Settings

- Light/Dark theme
- Language: English / Spanish
- Customizable experience

---

## Tech Stack

| Layer        | Technology                                       |
| ------------ | ------------------------------------------------ |
| Framework    | Electron Forge (Vite)                            |
| Frontend     | React 18, Tailwind CSS 3.4, Zustand, React Query |
| Backend      | Express 4, better-sqlite3 (WAL mode)             |
| ORM          | Drizzle ORM                                      |
| Validation   | Zod                                              |
| Testing      | Vitest                                           |
| Code Quality | ESLint, Prettier, TypeScript                     |

---

## Getting Started

### Prerequisites

- Node.js 20+
- pnpm 10+

```bash
git clone https://github.com/bpstack/matrix.git
cd matrix
pnpm install
pnpm start
```

The app opens as a desktop window at `http://localhost:3939`.

---

## Development

### Commands

| Command             | Description                      |
| ------------------- | -------------------------------- |
| `pnpm start`        | Start development server         |
| `pnpm make`         | Build installer (.exe/.dmg/.deb) |
| `pnpm test`         | Run tests                        |
| `pnpm lint`         | Run ESLint                       |
| `pnpm lint:fix`     | Fix ESLint issues                |
| `pnpm format`       | Format code with Prettier        |
| `pnpm format:check` | Check code formatting            |
| `pnpm typecheck`    | TypeScript type checking         |

### Architecture

```
src/
├── backend/              # Electron main process
│   ├── controllers/    # Business logic
│   ├── db/             # Schema & migrations
│   ├── engines/        # Crypto, import parsers
│   ├── repositories/   # Drizzle queries
│   ├── routes/        # Express routes
│   └── index.ts       # Entry point
└── frontend/           # React renderer
    ├── components/    # UI components
    ├── hooks/         # React Query hooks
    ├── lib/           # API, i18n, utilities
    └── stores/        # Zustand stores
```

---

## Current Status

🚧 **In Development**

The project is still in progress, but it's functional and ready to test.

- Currently free to use
- Feedback and contributions welcome
- Roadmap progress tracked in `ROADMAP.md`

---

## License

MIT License — see [LICENSE](LICENSE) for details.

---

## Author

**razyd** — contact.bstack@gmail.com

---

<p align="center">
  Built with 💻 for developers who think in systems.
</p>
