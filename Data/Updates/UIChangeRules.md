# UI Change Rules

This file exists because "UI update" is not one thing in this repo.

Some UI is fully hand-built.
Some UI is mostly generated from config or saved data.

The right question is:

`Is the existing UI already capable of rendering the new thing, or does the shape of the UI itself need to change?`

## Rule 1: Do Not Touch UI Just Because Data Changed

If the current renderer already loops over a registry or a saved list and renders generic cards, rows, or options, you usually do not need to touch templates or CSS.

Examples:

- adding a new provider model to `Data/Models.json`
- changing provider ranking or descriptions
- adding a free connector that fits the existing connector card pattern
- adding more MCP servers through saved config
- new usage records in `Data/Usage.json`
- new event history entries in agents or automations

## Rule 2: Touch UI When The Shape Changes

You must edit renderer code when the change introduces:

- a new tab, page, panel, modal, or route
- a new form layout
- a new field type or grouped fields
- new buttons, toggles, badges, or status behavior
- new DOM structure or class names
- new shared shell behavior
- new browser preview layout

## Current Config-Driven UI Areas

### Providers

Provider forms are built from metadata in:

- `Packages/Renderer/Pages/Setup/Providers/SetupProviders.js`

Settings reuses that metadata in:

- `Packages/Renderer/Shared/Modals/SettingsModal.js`

That means:

- adding a provider with the same field patterns is mostly metadata plus backend support
- adding a provider with a custom auth flow or custom UI states means editing renderer logic too

### Connectors

Connector cards are defined in:

- `Packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`

Rendered by:

- `Packages/Renderer/Features/Connectors/Catalog/ConnectorCards.js`
- `Packages/Renderer/Features/Connectors/index.js`

That means:

- standard token or OAuth-style connectors can often be added without new markup
- connectors with custom validation steps, custom sub-sections, or non-standard fields need renderer edits

### Automations

Automation actions are editor-driven from metadata plus action-specific sub-controls:

- `Packages/Renderer/Pages/Automations/Config/Constants.js`
- `Packages/Renderer/Pages/Automations/Components/ActionRenderer.js`
- `Packages/Renderer/Pages/Automations/Builders/FieldBuilders.js`
- `Packages/Renderer/Pages/Automations/Events/SubEvents.js`

That means:

- a very simple action may fit current field builders
- most new action types will need both metadata and custom renderer or extractor logic

### Agents

Agent sources and outputs are selected from constants and rendered by page builders:

- `Packages/Renderer/Pages/Agents/Config/Constants.js`
- `Packages/Renderer/Pages/Agents/Builders/JobBuilder.js`
- `Packages/Renderer/Pages/Agents/Components/`

That means:

- new source and output types almost always need UI work, not just engine work

### Events And Usage

These pages are data-driven.

Most data-only changes do not need layout edits unless:

- a new status needs a different visual treatment
- a new metric must be charted
- a new card or section must appear

## Page-Level Versus Settings-Level UI

Before editing UI, decide which surface owns the feature.

### Sidebar page

Use a page under `Packages/Renderer/Pages/` when the feature is a primary destination.

Current examples:

- chat
- automations
- agents
- events
- skills
- personas
- usage

### Settings panel

Use `Packages/Renderer/Features/` plus `SettingsModal.js` when the feature is mostly configuration.

Current examples:

- providers
- connectors
- channels
- MCP
- user profile and instructions

## Shared Shell Changes

If the update changes navigation, modal behavior, titlebar controls, theme switching, or cross-page layout, the owning files are usually:

- `Packages/Renderer/Application/Main.js`
- `Packages/Renderer/Shared/Navigation/Sidebar.js`
- `Packages/Renderer/Shared/Modals/SettingsModal.js`
- `Public/index.html`
- shell CSS files under `Public/Assets/Styles/`

Do not hide these changes inside a single page file.

## Styles Rule

Touch CSS only where the visual ownership actually lives.

Typical mapping:

- shared layout: `Layout.css`, `Root.css`, `Sidebar.css`, `Settings.css`, `Titlebar.css`
- chat: `Chat.css`, `ChatPage.css`, `Input.css`, `Markdown.css`, `CodeBlock.css`
- automations: `Automations.css`, `AutomationsPage.css`
- agents: `Agents.css`, `AgentsPage.css`, `AgentLog.css`
- events: `Events.css`, `EventsPage.css`
- usage: `Usage.css`, `UsagePage.css`
- setup: `Setup.css`, `SetupPage.css`, `Providers.css`
- connectors: `Connectors.css`, `FreeConnectors.css`

If a new class name is introduced in JS, make sure the correct stylesheet owns it.

## Theme Changes

Theme switching currently depends on:

- `Packages/Renderer/Features/Themes/index.js`
- `Packages/Renderer/Shared/Navigation/Sidebar.js`
- CSS variables in `Public/Assets/Styles/Root.css`

If you add a theme, update both the theme list and the CSS variable definitions.

## Browser Preview Changes

Browser preview is not normal page UI. It is split between main and renderer:

- renderer layout: `Packages/Renderer/Pages/Chat/Features/BrowserPreview.js`
- main BrowserView logic: `Packages/Main/Services/BrowserPreviewService.js`
- IPC: `Packages/Main/IPC/BrowserPreviewIPC.js`

If the preview changes size, visibility, lifecycle, or state shape, update both sides.

## Legacy UI Warning

Do not spend time updating these unless the routing itself is being restored:

- `Packages/Renderer/Pages/Channels/`
- `Packages/Renderer/Pages/Live/`
- legacy standalone HTML pages under `Public/`

The live product route map is controlled by `Packages/Renderer/Application/Main.js`.
