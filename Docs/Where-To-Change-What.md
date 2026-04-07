# Where To Change What

This is the practical maintenance guide for Joanium. Use it when you already know what you want to change and need to know the best file or folder to start with.

## 1. App Boot, Windowing, and Process Wiring

- Change startup flow, first-run behavior, runtime directory creation, or MCP auto-connect in `App.js`.
- Change boot-time discovery, engine instantiation, lifecycle execution, or IPC assembly in `Packages/Main/Boot.js`.
- Change path resolution, state root behavior, or bundled resource paths in `Packages/Main/Core/Paths.js`.
- Change the BrowserWindow configuration, preload path, or window chrome behavior in `Packages/Main/Core/Window.js`.
- Change what the renderer can access from the preload layer in `Core/Electron/Bridge/Preload.js`.

## 2. Sidebar, Routing, and Page Discovery

- Change app-wide navigation and page mounting in `Packages/Renderer/Application/Main.js`.
- Change how built-in pages and feature pages are merged in `Packages/Renderer/Application/PagesManifest.js`.
- Change page discovery rules in `Packages/Main/Core/PageDiscovery.js`.
- Change sidebar layout or navigation rendering in `Packages/Pages/Shared/Navigation/Sidebar.js`.
- Add or reorder a top-level page by editing that page's `Page.js` manifest under `Packages/Pages/<Page>/Page.js`.

## 3. Setup and Provider Configuration

- Change the first-run setup UI in `Packages/Pages/Setup`.
- Change which providers appear in setup, their labels, colors, icons, and fields in `Packages/Pages/Setup/UI/Render/Providers/SetupProviders.js`.
- Change bundled provider/model catalogs in `Config/Models/index.json` and the matching provider JSON file in `Config/Models/`.
- Change provider request formatting, streaming behavior, retries, reasoning support, or tool-call translation in `Packages/Features/AI/index.js`.
- Change user profile persistence or first-run checks in `Packages/Main/Services/UserService.js` and `Packages/Main/IPC/UserIPC.js`.

## 4. Chat Experience

- Change chat page mounting, welcome state, project bar behavior, or page-level interactions in `Packages/Pages/Chat/UI/Render/index.js`.
- Change message orchestration, planning, tool-call loops, fallback models, or sub-agent flow in `Packages/Pages/Chat/Features/Core/Agent.js`.
- Change chat persistence behavior in `Packages/Pages/Chat/Features/Data/ChatPersistence.js` and `Packages/Main/Services/ChatService.js`.
- Change attachment acceptance, parsing, or composer behavior in `Packages/Pages/Chat/Features/Composer`.
- Change built-in chat tool definitions and executors in `Packages/Pages/Chat/Features/Capabilities`.
- Change model dropdown behavior in `Packages/Pages/Chat/Features/ModelSelector`.
- Change chat bubble rendering, timeline behavior, terminal embedding, or sub-agent panels in `Packages/Pages/Chat/Features/UI`.

## 5. Workspace and Terminal Tools

- Change workspace inspection, directory tree building, local file read/write helpers, shell execution, or command risk assessment in `Packages/Main/IPC/TerminalIPC.js`.
- Change document extraction logic for PDF, DOCX, spreadsheets, or slides in `Packages/Main/Services/DocumentExtractionService.js`.
- Change project open/close behavior and project metadata persistence in `Packages/Main/Services/ProjectService.js` and `Packages/Main/IPC/ProjectIPC.js`.
- If a chat tool uses local workspace actions, review both `Packages/Pages/Chat/Features/Capabilities/Terminal` and `Packages/Main/IPC/TerminalIPC.js`.

## 6. Prompting, Personas, Skills, and Memory

- Change the base assistant system instructions in `SystemInstructions/SystemPrompt.json`.
- Change runtime prompt assembly in `Packages/System/Prompting/SystemPrompt.js` and `Packages/Main/Services/SystemPromptService.js`.
- Change skill library reading, enablement persistence, or first-run seeding in `Packages/Main/Services/ContentLibraryService.js`.
- Change skill page behavior in `Packages/Pages/Skills`.
- Change persona activation, default persona behavior, or persona library parsing in `Packages/Main/Services/ContentLibraryService.js` and `Packages/Pages/Personas`.
- Change personal memory file initialization in `Packages/Main/Services/MemoryService.js`.
- Change custom instruction persistence or retrieval through `Instructions/CustomInstructions.md` handling in the relevant services and IPC modules.

## 7. Automations

- Change the automation engine, scheduling loop, usage tracking, or job execution flow in `Packages/Features/Automation/Core/AutomationEngine.js`.
- Change schedule evaluation rules in `Packages/Features/Automation/Scheduling/Scheduling.js`.
- Add or edit built-in automation data sources in `Packages/Features/Automation/DataSources`.
- Add or edit built-in automation actions in `Packages/Features/Automation/Actions`.
- Change automation IPC in `Packages/Features/Automation/IPC/AutomationIPC.js`.
- Change the automations page UI in `Packages/Pages/Automations`.
- If an automation uses a connector-specific input or output, also inspect the relevant capability `Feature.js`.

## 8. Agents

- Change scheduling, queueing, concurrency, run history, or renderer dispatch for scheduled agents in `Packages/Features/Agents/Core/AgentsEngine.js`.
- Change agent IPC in `Packages/Features/Agents/IPC/AgentsIPC.js`.
- Change renderer-side scheduled agent gateway behavior in `Packages/Pages/Agents/Features/Gateway.js`.
- Change the agents page UI in `Packages/Pages/Agents`.
- If agent execution results look wrong, check both the engine and the shared chat/agent loop in `Packages/Pages/Chat/Features/Core/Agent.js`.

## 9. Events and Usage

- Change aggregated background history UI in `Packages/Pages/Events`.
- Change usage analytics UI in `Packages/Pages/Usage`.
- Change usage write behavior in `Packages/Main/IPC/UsageIPC.js` and automation usage recording in `Packages/Features/Automation/Core/AutomationEngine.js`.
- If you change agent or automation history shape, also update the events page and any IPC payload readers that consume it.

## 10. Connectors, MCP, Browser Preview, and Channels

- Change connector credential state, enabled defaults, or validation flow in `Packages/Features/Connectors/Core/ConnectorEngine.js` and `Packages/Features/Connectors/IPC/ConnectorIPC.js`.
- Change MCP session handling, stdio/HTTP behavior, or builtin server wiring in `Packages/Features/MCP/Core/MCPClient.js` and `Packages/Features/MCP/IPC/MCPIPC.js`.
- Change the builtin browser MCP server in `Packages/Features/MCP/Builtin/BrowserMCPServer.js`.
- Change browser preview attachment/state behavior in `Packages/Main/Services/BrowserPreviewService.js` and `Packages/Features/BrowserPreview`.
- Change channel polling, reply behavior, or supported messaging platforms in `Packages/Features/Channels/Core/ChannelEngine.js`.
- Change renderer-side handling for incoming channel messages in `Packages/Pages/Channels/Features/Gateway.js`.

## 11. Marketplace

- Change marketplace API fetch behavior, item normalization, install flow, or remote URLs in `Packages/Main/Services/MarketplaceService.js`.
- Change marketplace IPC in `Packages/Main/IPC/MarketplaceIPC.js`.
- Change marketplace browsing UI, templates, or styles in `Packages/Pages/Marketplace`.
- If marketplace-installed content behaves strangely after install, also inspect `Packages/Main/Services/ContentLibraryService.js`.

## 12. Capability Packages and Integrations

- Add or change GitHub integration behavior in `Packages/Capabilities/Github`.
- Add or change GitLab integration behavior in `Packages/Capabilities/Gitlab`.
- Add or change Google root connector behavior in `Packages/Capabilities/Google/Feature.js`.
- Add or change Google service-specific behavior in the relevant folder under `Packages/Capabilities/Google`.
- Add or change free connector definitions in `Packages/Capabilities/FreeConnectors/Feature.js`.
- If an integration needs connector UI, prompt context, chat tools, and automations, the main place to coordinate that is its `Feature.js`.

## 13. Feature Registry and Discovery

- Change how features are defined in `Packages/Capabilities/Core/defineFeature.js`.
- Change how features are loaded, sorted, indexed, and invoked in `Packages/Capabilities/Core/FeatureRegistry.js`.
- Change workspace package scanning or discovery root resolution in `Packages/Main/Core/WorkspacePackages.js` and `Packages/Main/Core/DiscoveryManifest.js`.
- Change engine discovery rules in `Packages/Main/Core/EngineDiscovery.js`.
- Change auto-discovered IPC wiring in `Packages/Main/Core/DiscoverIPC.js`.
- Change feature/engine storage creation in `Packages/Features/Core/FeatureStorage.js`.

## 14. Styling and Shared UI

- Change shared renderer DOM helpers in `Packages/Pages/Shared/Core/DOM.js`.
- Change shared sidebar/navigation visuals in `Packages/Pages/Shared/Navigation`.
- Change modal behavior in `Packages/Modals`.
- Change global utility helpers used by multiple renderer modules in `Packages/System/Utils` and related shared system files.

## 15. Packaging, Assets, and Release Behavior

- Change packaged file inclusion or extra resources in `electron-builder.json`.
- Change application icons in `Assets/Logo`.
- Change update behavior in `Packages/Main/Services/AutoUpdateService.js`.
- Change build-time version stamping in `Scripts/SetVersionByDate.mjs`.
- Change workspace package reporting and architecture audit output in `Scripts/AuditWorkspacePackages.mjs`.

## 16. Common Change Scenarios

### "I want to add a new AI provider"

Touch:

- `Config/Models/index.json`
- `Config/Models/<Provider>.json`
- `Packages/Pages/Setup/UI/Render/Providers/SetupProviders.js`
- `Packages/Features/AI/index.js`

### "I want to add a new top-level page"

Touch:

- `Packages/Pages/<NewPage>/Page.js`
- `Packages/Pages/<NewPage>/UI/Render/index.js`
- optional styles/templates/components
- page discovery only if you change discovery rules, not for a normal new page

### "I want to add a new integration"

Touch:

- `Packages/Capabilities/<Integration>/package.json`
- `Packages/Capabilities/<Integration>/**/Feature.js`
- optional API helpers, tools, automation handlers, and prompt context files inside that package

### "I want to change how the assistant thinks"

Touch:

- `SystemInstructions/SystemPrompt.json`
- `Packages/System/Prompting/SystemPrompt.js`
- `Packages/Main/Services/SystemPromptService.js`
- personas, custom instructions, and feature prompt hooks if the change depends on them

### "I want to change scheduled execution"

Touch:

- agents: `Packages/Features/Agents/Core/AgentsEngine.js`
- automations: `Packages/Features/Automation/Core/AutomationEngine.js`
- shared schedule rules: `Packages/Features/Automation/Scheduling/Scheduling.js`

## 17. Practical Rule of Thumb

If your change feels:

- integration-specific, start in `Packages/Capabilities`
- long-lived and runtime-oriented, start in `Packages/Features`
- UI-first, start in `Packages/Pages`
- app-shell-wide, start in `Packages/Renderer` or `Packages/Main`
- prompt/persona/skill-related, start in the prompt and content-library services

That rule will usually put you in the right place quickly.
