# Ownership Map

This file answers one question fast:

`If I change X, which files actually own X in this repo?`

## App Bootstrap And Windowing

Owns startup, engine creation, IPC registration, and BrowserWindow creation.

- `App.js`
- `Packages/Main/Core/Paths.js`
- `Packages/Main/Core/Window.js`
- `Packages/Main/Services/WindowStateService.js`
- `Packages/Electron/Bridge/Preload.js`
- `Public/index.html`
- `Public/Setup.html`

Use this area when the update changes:

- app startup behavior
- first-run routing
- preload exposure
- BrowserWindow config
- window controls
- filesystem path constants

## Shared Renderer Shell

Owns SPA routing, sidebar navigation, shared modals, and shell state.

- `Packages/Renderer/Application/Main.js`
- `Packages/Renderer/Shared/Core/State.js`
- `Packages/Renderer/Shared/Core/DOM.js`
- `Packages/Renderer/Shared/Navigation/Sidebar.js`
- `Packages/Renderer/Shared/Modals/SettingsModal.js`
- `Packages/Renderer/Shared/Modals/AboutModal.js`
- `Packages/Renderer/Shared/Modals/LibraryModal.js`
- `Packages/Renderer/Shared/Modals/ProjectsModal.js`

Primary shell styles:

- `Public/Assets/Styles/Layout.css`
- `Public/Assets/Styles/Sidebar.css`
- `Public/Assets/Styles/Settings.css`
- `Public/Assets/Styles/Titlebar.css`
- `Public/Assets/Styles/Root.css`
- `Public/Assets/Styles/Animations.css`

## Chat And Tooling

Owns chat orchestration, tool planning, tool execution, attachments, and persistence wiring.

Core chat files:

- `Packages/Renderer/Pages/Chat/index.js`
- `Packages/Renderer/Features/Chat/index.js`
- `Packages/Renderer/Features/Chat/Core/Agent.js`
- `Packages/Renderer/Features/Chat/Data/ChatPersistence.js`
- `Packages/Renderer/Features/Chat/UI/ChatTimeline.js`
- `Packages/Renderer/Features/Chat/UI/ChatBubble.js`
- `Packages/Renderer/Features/Chat/UI/TerminalComponent.js`

Tool registries:

- `Packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
- `Packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

Tool families live here:

- `Packages/Renderer/Features/Chat/Capabilities/Gmail/`
- `Packages/Renderer/Features/Chat/Capabilities/Github/`
- `Packages/Renderer/Features/Chat/Capabilities/Weather/`
- `Packages/Renderer/Features/Chat/Capabilities/Crypto/`
- `Packages/Renderer/Features/Chat/Capabilities/Finance/`
- `Packages/Renderer/Features/Chat/Capabilities/Photo/`
- `Packages/Renderer/Features/Chat/Capabilities/Wiki/`
- `Packages/Renderer/Features/Chat/Capabilities/Geo/`
- `Packages/Renderer/Features/Chat/Capabilities/Fun/`
- `Packages/Renderer/Features/Chat/Capabilities/Joke/`
- `Packages/Renderer/Features/Chat/Capabilities/Quote/`
- `Packages/Renderer/Features/Chat/Capabilities/Country/`
- `Packages/Renderer/Features/Chat/Capabilities/Astronomy/`
- `Packages/Renderer/Features/Chat/Capabilities/HackerNews/`
- `Packages/Renderer/Features/Chat/Capabilities/Url/`
- `Packages/Renderer/Features/Chat/Capabilities/Terminal/`
- `Packages/Renderer/Features/Chat/Capabilities/Repo/`
- `Packages/Renderer/Features/Chat/Capabilities/Review/`
- `Packages/Renderer/Features/Chat/Capabilities/Utility/`
- `Packages/Renderer/Features/Chat/Capabilities/Search/`
- `Packages/Renderer/Features/Chat/Capabilities/Dictionary/`
- `Packages/Renderer/Features/Chat/Capabilities/DateTime/`
- `Packages/Renderer/Features/Chat/Capabilities/Password/`
- `Packages/Renderer/Features/Chat/Capabilities/MCP/`

Attachment and parsing support:

- `Packages/Renderer/Features/Composer/index.js`
- `Packages/Renderer/Features/Composer/Core/ComposerParsers.js`
- `Packages/Renderer/Features/Composer/Core/ComposerFileTypes.js`
- `Packages/Main/Services/DocumentExtractionService.js`
- `Packages/Main/IPC/TerminalIPC.js`

## AI Providers And Model Transport

Owns provider catalog, saved credentials, local endpoint normalization, model selector, and request format conversion.

- `Data/Models.json`
- `Data/User.json`
- `Packages/Main/Services/UserService.js`
- `Packages/Main/IPC/SetupIPC.js`
- `Packages/Renderer/Pages/Setup/index.js`
- `Packages/Renderer/Pages/Setup/Providers/SetupProviders.js`
- `Packages/Renderer/Pages/Setup/Steps/SetupSteps.js`
- `Packages/Renderer/Shared/Modals/SettingsModal.js`
- `Packages/Renderer/Features/ModelSelector/index.js`
- `Packages/Renderer/Features/AI/index.js`

Provider icons and setup styling:

- `Public/Assets/Icons/`
- `Public/Assets/Styles/Setup.css`
- `Public/Assets/Styles/SetupPage.css`
- `Public/Assets/Styles/Providers.css`
- `Public/Assets/Styles/ModelSelector.css`

## Connectors

Owns saved connector state and the settings UI for service and free connectors.

State and IPC:

- `Packages/Connectors/Core/ConnectorEngine.js`
- `Packages/Main/IPC/ConnectorIPC.js`
- `Packages/Electron/Bridge/Preload.js`

Connector-specific integration surfaces:

- `Packages/Main/IPC/GmailIPC.js`
- `Packages/Main/IPC/GithubIPC.js`
- `Packages/Automation/Integrations/Gmail.js`
- `Packages/Automation/Integrations/Github.js`

Renderer connector UI:

- `Packages/Renderer/Features/Connectors/index.js`
- `Packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`
- `Packages/Renderer/Features/Connectors/Catalog/ConnectorCards.js`
- `Public/Assets/Styles/Connectors.css`
- `Public/Assets/Styles/FreeConnectors.css`

## Automations

Owns deterministic scheduled action chains.

- `Packages/Automation/Core/AutomationEngine.js`
- `Packages/Automation/Scheduling/Scheduling.js`
- `Packages/Automation/Actions/`
- `Packages/Automation/Integrations/`
- `Packages/Main/IPC/AutomationIPC.js`
- `Packages/Renderer/Pages/Automations/index.js`
- `Packages/Renderer/Pages/Automations/Config/Constants.js`
- `Packages/Renderer/Pages/Automations/Components/ActionRenderer.js`
- `Packages/Renderer/Pages/Automations/Builders/FieldBuilders.js`
- `Packages/Renderer/Pages/Automations/Events/SubEvents.js`
- `Packages/Renderer/Pages/Automations/Templates/Template.js`
- `Data/Automations.json`

Styles:

- `Public/Assets/Styles/Automations.css`
- `Public/Assets/Styles/AutomationsPage.css`

## Agents

Owns scheduled AI jobs, their sources, outputs, and runtime history.

- `Packages/Agents/Core/AgentsEngine.js`
- `Packages/Main/IPC/AgentsIPC.js`
- `Packages/Renderer/Pages/Agents/index.js`
- `Packages/Renderer/Pages/Agents/Config/Constants.js`
- `Packages/Renderer/Pages/Agents/Builders/JobBuilder.js`
- `Packages/Renderer/Pages/Agents/Components/Grid.js`
- `Packages/Renderer/Pages/Agents/Components/HistoryModal.js`
- `Packages/Renderer/Pages/Agents/Components/ModelPicker.js`
- `Packages/Renderer/Pages/Agents/State/State.js`
- `Data/Agents.json`

Styles:

- `Public/Assets/Styles/Agents.css`
- `Public/Assets/Styles/AgentsPage.css`
- `Public/Assets/Styles/AgentLog.css`

## Channels

Owns external message polling plus the renderer gateway that routes incoming messages through the normal chat loop.

- `Packages/Channels/Core/ChannelEngine.js`
- `Packages/Main/IPC/ChannelsIPC.js`
- `Packages/Electron/Bridge/Preload.js`
- `Packages/Renderer/Features/Channels/index.js`
- `Packages/Renderer/Features/Channels/Gateway.js`
- `Data/Channels.json`

Styles:

- `Public/Assets/Styles/Settings.css`

## MCP And Browser Preview

Owns MCP server persistence, connection lifecycle, tool surfacing, and the in-app browser view.

- `Packages/Main/IPC/MCPIPC.js`
- `Packages/MCP/Core/MCPClient.js`
- `Packages/MCP/Builtin/BrowserMCPServer.js`
- `Packages/Main/Services/BrowserPreviewService.js`
- `Packages/Main/IPC/BrowserPreviewIPC.js`
- `Packages/Renderer/Features/MCP/index.js`
- `Packages/Renderer/Pages/Chat/Features/BrowserPreview.js`
- `Data/MCPServers.json`

Styles:

- `Public/Assets/Styles/HtmlPreview.css`
- `Public/Assets/Styles/ChatPage.css`

## Projects, Workspace Tools, And Chat Storage

Owns project records, active workspace context, project-scoped chats, and workspace file tooling.

- `Packages/Main/Services/ProjectService.js`
- `Packages/Main/Services/ChatService.js`
- `Packages/Main/IPC/ProjectIPC.js`
- `Packages/Main/IPC/ChatIPC.js`
- `Packages/Main/IPC/TerminalIPC.js`
- `Packages/Renderer/Shared/Modals/ProjectsModal.js`
- `Packages/Renderer/Pages/Chat/index.js`
- `Packages/Renderer/Shared/Core/State.js`
- `Data/Projects/`
- `Data/Chats/`

## Prompt, Skills, Personas, User Memory

Owns the final system prompt and everything injected into it.

- `Packages/System/Prompting/SystemPrompt.js`
- `Packages/Main/Services/SystemPromptService.js`
- `Packages/Main/IPC/SystemIPC.js`
- `Packages/Main/IPC/SkillsIPC.js`
- `Packages/Main/IPC/PersonasIPC.js`
- `Packages/Main/IPC/UserIPC.js`
- `Data/Memory.md`
- `Data/CustomInstructions.md`
- `Data/Skills.json`
- `Data/ActivePersona.json`
- `Skills/`
- `Personas/`

## Usage And Events

Owns token accounting and the operational timeline.

- `Packages/Main/IPC/UsageIPC.js`
- `Packages/Main/IPC/AgentsIPC.js`
- `Packages/Renderer/Pages/Usage/`
- `Packages/Renderer/Pages/Events/`
- `Data/Usage.json`

Styles:

- `Public/Assets/Styles/Usage.css`
- `Public/Assets/Styles/UsagePage.css`
- `Public/Assets/Styles/Events.css`
- `Public/Assets/Styles/EventsPage.css`

## Current Primary Navigation Versus Non-Primary Files

Primary current sidebar pages:

- `Packages/Renderer/Pages/Chat/`
- `Packages/Renderer/Pages/Automations/`
- `Packages/Renderer/Pages/Agents/`
- `Packages/Renderer/Pages/Events/`
- `Packages/Renderer/Pages/Skills/`
- `Packages/Renderer/Pages/Personas/`
- `Packages/Renderer/Pages/Usage/`

Settings-only features:

- `Packages/Renderer/Features/Connectors/`
- `Packages/Renderer/Features/Channels/`
- `Packages/Renderer/Features/MCP/`
- `Packages/Renderer/Shared/Modals/SettingsModal.js`

Present but not in the current SPA route map:

- `Packages/Renderer/Pages/Channels/`
- `Packages/Renderer/Pages/Live/`
- standalone HTML pages under `Public/` other than `index.html` and `Setup.html`
