# CLAUDE.md — Joanium Project Context

This file gives Claude (and other AI coding assistants) essential context about
the Joanium codebase so it can assist effectively without asking repetitive questions.

---

## What is Joanium?

A **local-first AI desktop assistant** built with Electron + pure JavaScript (ESM, Node ≥ 24).
It exposes multi-model chat, agent scheduling, MCP server connections, automations,
personas, and skills — all running entirely on the user's machine.

Supported model providers: **Anthropic, OpenAI, Gemini, Ollama** (and others via OpenAI-compatible API).

---

## Tech Stack

- **Runtime:** Node.js ≥ 24, Electron 41
- **Language:** Vanilla JavaScript (ESM only, no TypeScript)
- **Package manager:** npm (workspaces)
- **Linting:** ESLint 10 with `eslint-plugin-unused-imports`
- **Formatting:** Prettier 3
- **Git hooks:** Husky 9 + lint-staged
- **Testing:** Jest 30
- **Packaging:** electron-builder 26, with `electron-updater` for auto-updates
- **Notable deps:** xterm.js (terminal), exceljs, jszip, mammoth, pdf-parse

---

## Workspace Structure

```
Core/Electron/          Main-process entry + window management
Packages/Capabilities/  Integration modules (APIs, system tools)
Packages/Features/      Feature modules (chat, agents, automations)
Packages/Main/          Additional main-process packages
Packages/Modals/        Modal components
Packages/Pages/         Renderer pages
Packages/Renderer/      Renderer-side utilities
Packages/System/        OS-level utilities
```

## Import Aliases

Use `#capabilities/`, `#core/`, `#features/`, `#main/`, `#modals/`, `#pages/`,
`#renderer/`, `#system/` — all defined in the root `package.json` `imports` field.
**Never** use relative paths across workspace boundaries.

---

## Things Claude Should Know

- This is **not a web app** — it is a desktop Electron application.
- No bundler (no webpack/vite/rollup). Files are loaded by Electron directly.
- There is **no TypeScript** — do not add `.ts` files or `tsconfig.json`.
- **ESM only** — use `import`/`export`. Never `require()` (except in legacy CJS contexts explicitly noted).
- Do not suggest adding pnpm or yarn — the project uses **npm workspaces**.
- The `dist/` folder is generated and gitignored — do not modify it.
- Prefer Node 24 native APIs over polyfills (e.g., native `fetch`, `crypto`, `fs/promises`).
- User data is stored **locally** — no cloud sync, no telemetry. Keep it that way.

---

## Common Tasks

| Task          | Command                |
| ------------- | ---------------------- |
| Run in dev    | `npm run dev`          |
| Build release | `npm run build`        |
| Format code   | `npm run format`       |
| Lint          | `npm run lint`         |
| Run tests     | `npx jest`             |
| Bump version  | `npm run version:date` |
