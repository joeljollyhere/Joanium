# Update Scenarios

Use this file as the exact touchpoint checklist.

If a change fits multiple sections, apply all of them.

## 1. Any New Cross-Boundary Feature

If the renderer needs new data, a new action, or a new mutation from main:

Always update:

- main service or engine that owns the behavior
- `Packages/Main/IPC/<Domain>.js`
- `Packages/Electron/Bridge/Preload.js`
- renderer page or feature that consumes it

Usually also update:

- `App.js` if a brand new IPC module must be registered
- `Packages/Main/Core/Paths.js` if new persisted files are involved
- `Docs/*.md` for the changed subsystem

## 2. UI-Only Change

Use this when product behavior is the same and only presentation changes.

Always update:

- the owning renderer module under `Packages/Renderer/Pages/` or `Packages/Renderer/Features/`
- the owning stylesheet under `Public/Assets/Styles/`

Do not update:

- preload
- main IPC
- engine code

Unless:

- a new user interaction now needs new data or a new main-process action

## 3. New Sidebar Page

Always update:

- `Packages/Renderer/Pages/<Feature>/index.js`
- any supporting page files under `Packages/Renderer/Pages/<Feature>/`
- `Packages/Renderer/Application/Main.js`
- `Packages/Renderer/Shared/Navigation/Sidebar.js`
- the page stylesheet under `Public/Assets/Styles/`

Update if needed:

- `Public/index.html` only if the shared shell needs new mount points
- preload and IPC only if the page reads or writes new main-process data

Do not default to:

- creating a new standalone HTML file

## 4. New Settings Tab Or Settings-Owned Feature

Always update:

- `Packages/Renderer/Shared/Modals/SettingsModal.js`
- the feature panel entry under `Packages/Renderer/Features/<Feature>/`
- preload and domain IPC if the panel needs new data or actions

Update if needed:

- `Public/Assets/Styles/Settings.css`
- subsystem-specific CSS

## 5. New Service Connector

Always update:

- `Packages/Connectors/Core/ConnectorEngine.js`
- `Packages/Main/IPC/ConnectorIPC.js`
- `Packages/Electron/Bridge/Preload.js`
- `Packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`

Update if the generic connector UI is enough:

- `Packages/Renderer/Features/Connectors/index.js`

Update if the UI needs custom flow or fields:

- `Packages/Renderer/Features/Connectors/Catalog/ConnectorCards.js`
- connector styles under `Public/Assets/Styles/Connectors.css`

Update if the connector has dedicated runtime actions:

- `Packages/Main/IPC/<Connector>IPC.js`
- integration code under `Packages/Automation/Integrations/`

Update if chat should use it:

- `Packages/Renderer/Features/Chat/Capabilities/<Connector>/Tools.js`
- `Packages/Renderer/Features/Chat/Capabilities/<Connector>/Executor.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

Update if automations should use it:

- `Packages/Automation/Core/AutomationEngine.js`
- `Packages/Renderer/Pages/Automations/Config/Constants.js`
- `Packages/Renderer/Pages/Automations/Components/ActionRenderer.js`
- `Packages/Renderer/Pages/Automations/Builders/FieldBuilders.js`
- `Packages/Renderer/Pages/Automations/Events/SubEvents.js`

Update if agents should use it:

- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/Renderer/Pages/Agents/Config/Constants.js`
- `Packages/Renderer/Pages/Agents/Builders/JobBuilder.js`

Update if prompt enrichment should use it:

- `Packages/Main/Services/SystemPromptService.js`
- `Packages/System/Prompting/SystemPrompt.js`

## 6. New Free Connector

Always update:

- `Packages/Connectors/Core/ConnectorEngine.js`
- `Packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`

Update if the connector uses an existing generic toggle or key flow:

- no extra renderer markup is required

Update if the connector exposes new chat tools:

- `Packages/Renderer/Features/Chat/Capabilities/<Family>/Tools.js`
- `Packages/Renderer/Features/Chat/Capabilities/<Family>/Executor.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`

If the tool category is new, also update:

- `CATEGORY_TO_CONNECTOR` in `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`

Only update preload or `ConnectorIPC.js` if:

- the generic free-connector API is not enough

## 7. Add A Model To An Existing AI Provider

Usually update only:

- `Data/Models.json`

Then verify:

- rank
- description
- input capabilities
- token limits
- pricing

Also update if the new model changes behavior assumptions:

- `Packages/Renderer/Features/ModelSelector/index.js`
- `Packages/Renderer/Features/Composer/index.js`
- `Packages/Renderer/Features/AI/index.js`

## 8. New AI Provider Family

Always update:

- `Data/Models.json`
- `Packages/Main/Services/UserService.js`
- `Packages/Renderer/Pages/Setup/Providers/SetupProviders.js`
- `Packages/Renderer/Shared/Modals/SettingsModal.js`
- `Packages/Renderer/Features/ModelSelector/index.js`
- `Packages/Renderer/Features/AI/index.js`
- `Public/Assets/Icons/` if the provider needs a new icon

Update if the provider has unusual auth or local-runtime rules:

- `Packages/Main/Services/UserService.js`

Update if the provider uses a different request or streaming format:

- `Packages/Renderer/Features/AI/index.js`

## 9. New Chat Tool Or Capability

Always update:

- `Packages/Renderer/Features/Chat/Capabilities/<Family>/Tools.js`
- `Packages/Renderer/Features/Chat/Capabilities/<Family>/Executor.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

Update if the tool needs main-process powers:

- the owning IPC file in `Packages/Main/IPC/`
- `Packages/Electron/Bridge/Preload.js`
- main service or integration code

Update if the tool needs connector gating:

- `CATEGORY_TO_CONNECTOR` in `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`

Update if the tool is workspace-scoped:

- `WORKSPACE_SCOPED_TOOL_NAMES` in `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`

Update if the tool changes planning or risk behavior:

- `Packages/Renderer/Features/Chat/Core/Agent.js`

## 10. New File Attachment Type Or Document Extraction Type

Always update:

- `Packages/Renderer/Features/Composer/Core/ComposerFileTypes.js`
- `Packages/Renderer/Features/Composer/Core/ComposerParsers.js`
- `Packages/Main/Services/DocumentExtractionService.js`

Update if the model capability logic changes:

- `Packages/Renderer/Features/ModelSelector/index.js`
- `Packages/Renderer/Pages/Chat/index.js`

Update if new IPC surface is needed:

- `Packages/Main/IPC/TerminalIPC.js`
- `Packages/Electron/Bridge/Preload.js`

## 11. New Automation Action

Always update:

- `Packages/Automation/Core/AutomationEngine.js`
- any action or integration helper under `Packages/Automation/Actions/` or `Packages/Automation/Integrations/`
- `Packages/Renderer/Pages/Automations/Config/Constants.js`
- `Packages/Renderer/Pages/Automations/Components/ActionRenderer.js`

Update if new field rendering is needed:

- `Packages/Renderer/Pages/Automations/Builders/FieldBuilders.js`
- `Packages/Renderer/Pages/Automations/Events/SubEvents.js`

Update if the action needs main-process APIs not already present:

- the owning IPC file
- preload

Remember:

- automation engine behavior is sequential
- a thrown action error stops the remaining chain

## 12. Change Automation Trigger Semantics

Always update:

- `Packages/Automation/Scheduling/Scheduling.js`
- `Packages/Automation/Core/AutomationEngine.js`
- `Packages/Agents/Core/AgentsEngine.js` if agents share the same trigger behavior
- `Packages/Renderer/Pages/Automations/index.js`
- `Packages/Renderer/Pages/Automations/Templates/Template.js`

## 13. New Agent Data Source

Always update:

- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/Renderer/Pages/Agents/Config/Constants.js`
- `Packages/Renderer/Pages/Agents/Builders/JobBuilder.js`

Update if it depends on connectors or IPC:

- connector integration files
- main IPC
- preload

Update if the source needs special labels or history formatting:

- `Packages/Renderer/Pages/Agents/Components/HistoryModal.js`
- agent utility or renderer files under `Packages/Renderer/Pages/Agents/`

## 14. New Agent Output Type

Always update:

- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/Renderer/Pages/Agents/Config/Constants.js`
- `Packages/Renderer/Pages/Agents/Builders/JobBuilder.js`

Update if it writes to another subsystem:

- the owning IPC, integration, or service layer

## 15. New Channel

Always update:

- `Packages/Channels/Core/ChannelEngine.js`
- `Packages/Main/IPC/ChannelsIPC.js`
- `Packages/Electron/Bridge/Preload.js`
- `Packages/Renderer/Features/Channels/index.js`
- `Data/Channels.json`

Update if the renderer reply flow changes:

- `Packages/Renderer/Features/Channels/Gateway.js`

Update if the channel should be mentioned or configured elsewhere:

- `Packages/Renderer/Shared/Modals/SettingsModal.js`

This is both backend and UI work. A channel is never renderer-only.

## 16. New MCP Behavior Or Built-In MCP Server

Always update:

- `Packages/Main/IPC/MCPIPC.js`
- `Packages/MCP/Core/MCPClient.js`

Update if it is a built-in server:

- `Packages/MCP/Builtin/<Server>.js`
- builtin registration inside `Packages/Main/IPC/MCPIPC.js`

Update if the chat tool surface changes:

- `Packages/Renderer/Features/Chat/Capabilities/MCP/Executor.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`

Update renderer settings UI if server metadata or transport fields change:

- `Packages/Renderer/Features/MCP/index.js`

## 17. Browser Preview Change

Always update both sides:

- `Packages/Main/Services/BrowserPreviewService.js`
- `Packages/Main/IPC/BrowserPreviewIPC.js`
- `Packages/Renderer/Pages/Chat/Features/BrowserPreview.js`

Update if shell layout changes:

- `Packages/Renderer/Pages/Chat/index.js`
- relevant chat styles

## 18. Project And Workspace Change

Always update the owner based on what changed:

- project record lifecycle: `Packages/Main/Services/ProjectService.js`, `Packages/Main/IPC/ProjectIPC.js`
- active workspace UI: `Packages/Renderer/Shared/Modals/ProjectsModal.js`, `Packages/Renderer/Pages/Chat/index.js`, `Packages/Renderer/Shared/Core/State.js`
- workspace tools: `Packages/Main/IPC/TerminalIPC.js`, chat capability files, planner/runtime hints in `Packages/Renderer/Features/Chat/Core/Agent.js`
- project-scoped chat storage: `Packages/Main/Services/ChatService.js`, `Packages/Main/IPC/ChatIPC.js`, `Packages/Renderer/Features/Chat/Data/ChatPersistence.js`

If new project metadata is persisted, also update:

- `Packages/Main/Core/Paths.js` if paths change

## 19. Prompt, Skill, Persona, Memory, Or User Context Change

Always update based on source:

- prompt assembly: `Packages/System/Prompting/SystemPrompt.js`
- prompt cache: `Packages/Main/Services/SystemPromptService.js`
- system prompt IPC: `Packages/Main/IPC/SystemIPC.js`
- user profile and memory: `Packages/Main/IPC/UserIPC.js`, `Data/Memory.md`, `Data/CustomInstructions.md`
- skills: `Packages/Main/IPC/SkillsIPC.js`, `Data/Skills.json`, `Skills/`
- personas: `Packages/Main/IPC/PersonasIPC.js`, `Data/ActivePersona.json`, `Personas/`

If a change should invalidate cached prompt content, make sure:

- `Packages/Main/Services/SystemPromptService.js`
  is invalidated from the code path that saves the change

## 20. Gmail Or GitHub Capability Change

These two are shared subsystems, not one-off features.

If Gmail changes, check:

- `Packages/Automation/Integrations/Gmail.js`
- `Packages/Main/IPC/GmailIPC.js`
- `Packages/Main/IPC/ConnectorIPC.js`
- `Packages/Renderer/Features/Chat/Capabilities/Gmail/`
- `Packages/Automation/Core/AutomationEngine.js`
- `Packages/Renderer/Pages/Automations/Config/Constants.js`
- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/System/Prompting/SystemPrompt.js`

If GitHub changes, check:

- `Packages/Automation/Integrations/Github.js`
- `Packages/Main/IPC/GithubIPC.js`
- `Packages/Main/IPC/ConnectorIPC.js`
- `Packages/Renderer/Features/Chat/Capabilities/Github/`
- `Packages/Renderer/Features/Chat/Capabilities/Repo/`
- `Packages/Renderer/Features/Chat/Capabilities/Review/`
- `Packages/Automation/Core/AutomationEngine.js`
- `Packages/Renderer/Pages/Automations/Config/Constants.js`
- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/System/Prompting/SystemPrompt.js`

## 21. New Persisted Data File Or Domain

Always update:

- `Packages/Main/Core/Paths.js`
- the main service or engine that reads and writes the file

Update if the renderer needs access:

- domain IPC file
- preload
- renderer consumer

Update if the new file affects the prompt or shared state:

- `Packages/Main/Services/SystemPromptService.js`
- `Packages/System/Prompting/SystemPrompt.js`

## 22. Usage Analytics Change

Always update:

- `Packages/Main/IPC/UsageIPC.js`
- `Packages/Renderer/Pages/Usage/Data/UsageData.js`
- `Packages/Renderer/Pages/Usage/Renderers/UsageRenderers.js`
- `Packages/Renderer/Pages/Usage/Formatters/UsageFormatters.js`
- `Data/Usage.json` expectations if shape changed

Update if agents or chat write new fields:

- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/Renderer/Features/Chat/Data/ChatPersistence.js`

## 23. Events Timeline Change

Always update:

- source histories in `Packages/Automation/Core/AutomationEngine.js` and/or `Packages/Agents/Core/AgentsEngine.js`
- clear-history IPC in `Packages/Main/IPC/AgentsIPC.js`
- `Packages/Renderer/Pages/Events/Data/EventsFetcher.js`
- `Packages/Renderer/Pages/Events/Components/EventsCards.js`
- `Packages/Renderer/Pages/Events/index.js`

Important:

- Events page is aggregated live data, not its own persisted subsystem

## 24. Build, Packaging, Or App-Level Runtime Change

Always update the actual owner:

- package scripts and packaging: `package.json`
- app startup wiring: `App.js`
- electron preload or window config: `Packages/Main/Core/Window.js`
- build assets: `Icons/`, `Public/`, `dist/` inputs

Update if filesystem paths or packaged files change:

- `Packages/Main/Core/Paths.js`
- `package.json` `build.files`

## 25. Theme Change

If changing current theme behavior:

- `Packages/Renderer/Features/Themes/index.js`
- `Packages/Renderer/Shared/Navigation/Sidebar.js`
- `Public/Assets/Styles/Root.css`

If adding a new theme:

- add it to the theme list in `Packages/Renderer/Shared/Navigation/Sidebar.js`
- add the CSS variable set in `Public/Assets/Styles/Root.css`

## 26. Setup Or Onboarding Change

Always update:

- `Public/Setup.html`
- `Packages/Renderer/Pages/Setup/index.js`
- `Packages/Renderer/Pages/Setup/Steps/SetupSteps.js`
- `Packages/Renderer/Pages/Setup/Providers/SetupProviders.js`
- `Packages/Main/IPC/SetupIPC.js`
- `Packages/Main/Services/UserService.js`

Also update:

- setup styles under `Public/Assets/Styles/Setup.css` and `SetupPage.css`

## 27. When You Are Unsure

Start from these questions:

1. Is the change main-process only, renderer only, or cross-boundary?
2. Is the UI already generated from config?
3. Does new state need persistence?
4. Does the feature affect chat, automations, agents, channels, or prompt assembly too?

If the answer to question 4 is yes, the change is cross-cutting and should be checked against multiple sections above before implementation.
