# Data and Persistence

Joanium is strongly local-first. This document explains where state lives, how that changes between development and packaged builds, and which files matter for backup, migration, and debugging.

## 1. State Roots

`Packages/Main/Core/Paths.js` defines two important runtime roots.

### Bundled root

- In development: the repo root
- In packaged builds: `process.resourcesPath`

This is where bundled assets such as model catalogs and seeded content are read from.

### State root

- In development: the repo root
- In packaged builds: `app.getPath('userData')`

This is where mutable runtime state is stored.

## 2. Why This Matters

In development mode, the repo itself acts as the app's state directory. That is convenient because contributors can inspect everything directly, but it has two consequences:

- local chats, usage, feature state, and memory files may show up as working tree changes
- contributors need to be careful not to commit personal or machine-specific runtime state

In packaged builds, that mutable state moves outside the installed application into Electron's normal `userData` area.

## 3. Main Storage Map

| Path                                     | Purpose                                        |
| ---------------------------------------- | ---------------------------------------------- |
| `Config/User.json`                       | User profile and provider setup data.          |
| `Config/WindowState.json`                | Window dimensions and placement state.         |
| `Config/Models/*.json`                   | Bundled provider/model catalogs.               |
| `Data/Chats/*.json`                      | Global chat history when not inside a project. |
| `Data/Projects/<projectId>/Project.json` | Project metadata and project-level state.      |
| `Data/Projects/<projectId>/Chats/*.json` | Project-scoped chat history.                   |
| `Data/Skills.json`                       | Skill enable/disable state.                    |
| `Data/ActivePersona.json`                | Current persona selection.                     |
| `Data/Usage.json`                        | Token and model usage records.                 |
| `Data/MCPServers.json`                   | User-configured MCP server definitions.        |
| `Data/Features/<featureKey>/<file>.json` | Engine/feature-specific JSON storage.          |
| `Instructions/CustomInstructions.md`     | User custom instruction file.                  |
| `Memories/*.md`                          | Personal memory markdown library.              |
| `Skills/**/*.md`                         | Installed user skill markdown files.           |
| `Personas/**/*.md`                       | Installed user persona markdown files.         |

## 4. Seeded Libraries vs User Libraries

Joanium has two concepts for skills and personas:

- bundled seed libraries
- user libraries

`Packages/Main/Services/ContentLibraryService.js` copies markdown files from the bundled seed directories into the user library on first run if the user library is empty.

### Seed sources

- `Skills/`
- `Personas/`

### User libraries

- In development: those same repo folders are also the active library roots
- In packaged builds: user-specific copies live under the app state root

This is a smart design because it lets the packaged app ship defaults while still giving users editable local copies.

## 5. Personal Memory Files

`Packages/Main/Services/MemoryService.js` initializes a personal memory library under `Memories/`.

These are markdown files, not opaque database rows. That makes them:

- easy to inspect
- easy to back up
- easy to edit manually if needed

It also means contributors should treat them as user content, not as code assets.

## 6. Chat Persistence

`Packages/Main/Services/ChatService.js` handles chat persistence.

### Important behavior

- global chats are stored in `Data/Chats`
- project chats are stored inside the matching project folder
- internal tool-only leakage is stripped before persistence
- chats can be marked for personal memory synchronization

This split between global chats and project chats is important. It lets Joanium behave like a personal assistant and a project assistant at the same time without forcing everything into one flat history.

## 7. Project Persistence

`Packages/Main/Services/ProjectService.js` stores each project under:

`Data/Projects/<projectId>/`

That project folder contains:

- `Project.json`
- a local `Chats/` folder for project chat history

This gives Joanium a clean per-project boundary without needing a database server.

## 8. Feature and Engine Storage

Feature and engine JSON state is created through `Packages/Features/Core/FeatureStorage.js`.

### How it works

- engines can declare storage descriptors in `engineMeta.storage`
- features can declare storage descriptors in `feature.storage`
- boot collects all descriptors and creates storage handles
- each handle persists JSON under `Data/Features/<featureKey>/<fileName>`

### Current examples in the repo

- `Data/Features/agenticAgents/AgenticAgents.json`
- `Data/Features/Agents/Agents.json`
- `Data/Features/Automations/Automations.json`
- `Data/Features/Channels/Channels.json`
- `Data/Features/Connectors/Connectors.json`

One thing to notice is that feature keys and storage keys are descriptor-driven. Contributors should not assume every folder name matches one simple package name.

## 9. Usage Data

Usage is written to `Data/Usage.json`.

The automation engine also records usage during automation runs, and the chat side records provider/model usage for interactive work. That file powers the usage page and acts as a useful local analytics source during debugging.

## 10. MCP Server Persistence

Custom MCP server entries are stored in `Data/MCPServers.json`.

The builtin browser MCP server is still merged in at runtime, so the user file represents configurable additions rather than the full effective set by itself.

## 11. Prompt and Instruction Data

Prompt composition uses both bundled and user-owned data.

### Bundled

- `SystemInstructions/SystemPrompt.json`

### User-owned or runtime-owned

- `Config/User.json`
- `Instructions/CustomInstructions.md`
- `Data/ActivePersona.json`
- `Memories/*.md`
- connector state from `Data/Features`

This is why a prompt-related bug may require checking more than one file family.

## 12. Packaged Resources

`electron-builder.json` bundles several resources that are important at runtime:

- `Config/Models`
- `Config/WindowState.json`
- markdown files from `Skills`
- markdown files from `Personas`

That means packaged builds still have the data they need to bootstrap user libraries and provider catalogs.

## 13. Backup Guidance

If you want to preserve a Joanium setup, the most valuable things to back up are:

- `Config/User.json`
- `Data/`
- `Instructions/`
- `Memories/`
- `Skills/`
- `Personas/`

If you are only trying to preserve user-authored content and preferences, those are the main areas that matter.

## 14. Safe Editing Guidance

If you are debugging or manually editing runtime state:

- prefer editing the smallest relevant file rather than deleting whole folders
- keep JSON valid and preserve expected top-level keys
- be careful with `Data/Usage.json` because it can become large over time
- be careful with `Data/Features/*` because engines may expect specific shapes
- remember that the app may rewrite some files after the next run

## 15. Contributor Warning for Dev Mode

Because development mode uses the repo root as the state root:

- `git status` can include chats, usage records, window state, connector state, and other local artifacts
- docs and code changes can be mixed with runtime data unless you are intentional
- repo hygiene matters a lot more than in apps that store everything outside the workspace

That tradeoff is worth understanding before making broad filesystem changes.
