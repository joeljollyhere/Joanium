# Development Workflow

This document covers the practical day-to-day workflow for working on Joanium as a contributor.

## 1. Install and Run

Basic setup:

```bash
npm install
npm start
```

Development mode:

```bash
npm run dev
```

Build packaged artifacts:

```bash
npm run build
```

Lint the repo:

```bash
npm run lint
```

Audit workspace discovery:

```bash
npm run packages:audit
```

If PowerShell blocks npm scripts, run:

```powershell
cmd /c npm run packages:audit
```

## 2. What the Main Scripts Do

| Script                   | Purpose                                                         |
| ------------------------ | --------------------------------------------------------------- |
| `npm start`              | Launches Electron normally.                                     |
| `npm run dev`            | Launches Electron with the `--dev` flag.                        |
| `npm run lint`           | Runs ESLint across the repo.                                    |
| `npm run build`          | Date-stamps the version and runs `electron-builder`.            |
| `npm run packages:audit` | Prints discovery and workspace relationship information.        |
| `npm run version:date`   | Updates the app version using the date-based versioning script. |

## 3. Recommended Contributor Flow

1. Read the relevant docs in `Docs/` before making a broad architectural change.
2. Run the app and reproduce the current behavior.
3. Identify whether your change belongs in `Packages/Main`, `Packages/Features`, `Packages/Capabilities`, `Packages/Pages`, or `Packages/Renderer`.
4. Make the smallest coherent change that matches the architecture.
5. Run `npm run packages:audit` if you touched workspace discovery or package structure.
6. Run `npm run lint` if you touched JavaScript files.
7. Manually verify the affected page or flow in the Electron app.

## 4. Workspace and Discovery Hygiene

Joanium uses npm workspaces and discovery metadata heavily. If you add a package or move files:

- make sure the package is covered by the root workspace patterns
- make sure its `package.json` has the correct `joanium.discovery` entries
- make sure discovered files follow expected naming conventions such as `Feature.js`, `*Engine.js`, `*IPC.js`, `Page.js`, and `*Service.js`

The audit script is especially useful after structural changes.

## 5. Development-State Warning

Because development mode writes app state into the repo root:

- local chats and usage data can appear in the working tree
- connector state can appear in `Data/Features`
- window state and user config can be modified locally

Before committing, it is worth checking whether a file changed because of product use or because of intentional code work.

## 6. Packaging Notes

`electron-builder.json` controls:

- packaged files
- bundled extra resources
- output directory
- platform targets
- GitHub release publishing settings

The current configuration builds:

- Windows NSIS installers
- macOS DMG artifacts
- Linux AppImage artifacts

The build also includes seeded skills, personas, model catalogs, and window state resources.

## 7. Versioning

The repo uses a date-based versioning helper through `Scripts/SetVersionByDate.mjs`.

That means release builds are not just reading a manually maintained static version number. If you are doing packaging work, be aware that `npm run build` will update the version as part of the process.

## 8. Useful Files During Debugging

- `App.js` for startup behavior
- `Packages/Main/Boot.js` for assembly and discovery
- `Core/Electron/Bridge/Preload.js` for renderer-accessible APIs
- `Packages/Renderer/Application/Main.js` for page mounting
- `Packages/Pages/Chat/UI/Render/index.js` for the main experience
- `Packages/Main/IPC/TerminalIPC.js` for local file and shell tools
- `Packages/Capabilities/Core/FeatureRegistry.js` for capability composition
- `Packages/Features/Core/FeatureStorage.js` for persisted feature state

## 9. When to Run Which Verification

Run `npm run packages:audit` when:

- adding or moving workspace packages
- changing discovery roots
- adding a new engine, page package, feature package, or IPC package

Run `npm run lint` when:

- changing JS modules
- updating page logic
- changing shared helpers

Run the app manually when:

- changing renderer behavior
- changing provider setup
- changing automations or agents
- changing discovery and feature boot behavior
- changing persistence and prompt assembly

## 10. Good Habits for This Repo

- Prefer following the existing discovery architecture over adding one-off central wiring.
- Keep integration logic close to the corresponding capability package.
- Keep UI concerns in pages and renderer code, not in random services.
- Be careful with broad changes in the chat orchestration path because they can affect chat, agents, channels, and tool execution at once.
- Treat `Data`, `Memories`, `Skills`, and `Personas` as mixed code-plus-runtime territory in development.

## 11. Best Companion Docs

Use these docs together:

- [Architecture.md](Architecture.md)
- [Features.md](Features.md)
- [Data-And-Persistence.md](Data-And-Persistence.md)
- [Extension-Guide.md](Extension-Guide.md)
- [Where-To-Change-What.md](Where-To-Change-What.md)

That set gives you both the conceptual map and the practical change map.
