# OpenWorld Update Handbook

This folder is the repo-specific scaling guide for the current OpenWorld architecture.

It covers every update class that exists in this codebase today:

- app shell and navigation
- settings panels
- AI providers
- service and free connectors
- chat tools and capabilities
- automations
- agents
- channels
- MCP and browser preview
- projects and workspace tooling
- prompt, skills, personas, and memory
- persistence and data files
- usage, events, attachments, styles, and packaging

If one change touches more than one subsystem, use the union of all matching scenarios.

## Start Here

1. Read `OwnershipMap.md` to find the owning files.
2. Read `UIChangeRules.md` to decide whether the UI is already dynamic or must be edited.
3. Read `UpdateScenarios.md` to get the exact file checklist for the change.
4. Run through `VerificationChecklist.md` before calling the update done.

## Most Important Rule

In this repo, most real features cross the Electron boundary.

If the renderer needs new data, a new action, or a new mutation from main, the normal path is:

1. main service or engine
2. main IPC handler
3. preload bridge
4. renderer page or feature
5. docs and verification

If you skip one layer, the feature usually looks half-done.

## Dynamic UI Versus Structural UI

Some UI in this app is config-driven and some is hand-built.

You do not need to touch renderer markup just because product behavior changed.

### Usually dynamic already

- connector cards built from `Packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`
- provider forms built from `Packages/Renderer/Pages/Setup/Providers/SetupProviders.js`
- model selector options built from `Data/Models.json`
- MCP server list built from saved MCP configs plus `Packages/Renderer/Features/MCP/index.js`
- events list built from automation and agent history
- usage charts built from `Data/Usage.json`

### Usually requires UI edits

- new settings tab
- new sidebar page
- new custom form controls or field groups
- new page layout or card layout
- new browser preview behavior
- new modal or shell interaction
- new styling hooks or class names

Read `UIChangeRules.md` before assuming either case.

## Current Live Shell

The live app shell is:

- `Public/index.html`
- `Packages/Renderer/Application/Main.js`

The onboarding shell is:

- `Public/Setup.html`

Current sidebar-routed pages are:

- `chat`
- `automations`
- `agents`
- `events`
- `skills`
- `personas`
- `usage`

Current settings-only areas are:

- user profile, memory, custom instructions
- AI providers
- connectors
- channels
- MCP servers

That means new operational features should usually land in the SPA shell, not in a new standalone HTML file.

## Important Current Sources Of Truth

- `App.js`: app bootstrap, engine startup, IPC registration
- `Packages/Main/Core/Paths.js`: all persistent file paths
- `Packages/Electron/Bridge/Preload.js`: everything renderer code can call in main
- `Packages/Renderer/Application/Main.js`: page routing and shared shell boot
- `Packages/Renderer/Shared/Navigation/Sidebar.js`: current navigation and theme picker
- `Packages/Renderer/Shared/Modals/SettingsModal.js`: current settings tabs
- `Packages/Renderer/Pages/Setup/Providers/SetupProviders.js`: provider form metadata
- `Packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`: connector UI metadata
- `Packages/Renderer/Pages/Automations/Config/Constants.js`: automation action metadata
- `Packages/Renderer/Pages/Agents/Config/Constants.js`: agent source and output metadata
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`: chat tool registry
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`: chat executor registry

## Legacy Or Non-Primary Paths

These exist in the repo but are not the primary current product path:

- standalone HTML files under `Public/` other than `index.html` and `Setup.html`
- `Packages/Renderer/Pages/Channels/`
- `Packages/Renderer/Pages/Live/`

Do not update those just because a current feature changed unless you are deliberately reviving or re-routing them.
