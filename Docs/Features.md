# Joanium Features

This document describes the current product surface and the major feature families already present in the repository.

## 1. Product Surfaces

Joanium is already more than a single assistant page. The repo contains multiple user-facing surfaces that together form a desktop AI workspace.

| Surface     | Main area                    | What users get                                                                                     |
| ----------- | ---------------------------- | -------------------------------------------------------------------------------------------------- |
| Setup       | `Packages/Pages/Setup`       | First-run onboarding, profile capture, and provider configuration.                                 |
| Chat        | `Packages/Pages/Chat`        | The primary assistant experience with tool use, attachments, project context, and model switching. |
| Automations | `Packages/Pages/Automations` | Scheduled or repeatable jobs that gather inputs, run AI, and trigger outputs.                      |
| Agents      | `Packages/Pages/Agents`      | Reusable autonomous prompts with schedule, model selection, and workspace/project context.         |
| Skills      | `Packages/Pages/Skills`      | Skill library discovery, enable/disable controls, and bulk management.                             |
| Personas    | `Packages/Pages/Personas`    | Persona activation and chat-start flows.                                                           |
| Marketplace | `Packages/Pages/Marketplace` | Remote browsing and installation for skills and personas.                                          |
| Events      | `Packages/Pages/Events`      | Unified background run history, including failures.                                                |
| Usage       | `Packages/Pages/Usage`       | Local usage analytics by provider and model.                                                       |

## 2. Chat Is the Product Center

The chat page is Joanium's primary interaction surface, but it is also an orchestration layer reused by other features.

### Chat already supports

- model/provider selection
- workspace-aware prompting
- active project context
- text and file attachments
- document extraction for common office and code formats
- browser preview integration
- planner-driven tool selection
- iterative tool calling
- MCP tool usage
- feature-contributed chat tools
- sub-agent orchestration support
- failover model selection
- chat persistence
- personal memory sync markers

### Important code areas

- `Packages/Pages/Chat/UI/Render`
- `Packages/Pages/Chat/Features/Core`
- `Packages/Pages/Chat/Features/Composer`
- `Packages/Pages/Chat/Features/ModelSelector`
- `Packages/Pages/Chat/Features/Capabilities`
- `Packages/Features/AI`

## 3. Background Work: Automations and Agents

Joanium has two distinct but related background systems.

### Automations

Automations are job-like workflows. They can:

- run on a schedule
- collect data from built-in or feature-provided data sources
- generate output with AI
- trigger built-in or feature-provided outputs/actions
- record history and usage

Built-in automation data sources include examples such as:

- RSS feed
- Reddit
- Hacker News
- weather
- crypto price
- URL fetch
- file read
- custom context
- system stats

Built-in actions and outputs include examples such as:

- notifications
- file creation and file movement
- running commands or scripts
- HTTP requests and webhooks
- clipboard actions
- terminal work
- opening apps or sites

### Agents

Agents are scheduled prompts that run with:

- a name and description
- a prompt
- an enabled/disabled state
- a primary model
- a schedule
- optional workspace/project binding
- run history

They are ideal for repeated review, monitoring, or work-steering behaviors.

## 4. Connectors and Integrations

Joanium separates platform behavior from integration behavior.

### Platform-level integration systems

- `Packages/Features/Connectors` manages connector state and credentials.
- `Packages/Features/MCP` manages MCP sessions for builtin, stdio, and HTTP servers.
- `Packages/Features/Channels` handles channel polling and replies.
- `Packages/Features/BrowserPreview` supports in-app browser preview events and state.

### Capability packages currently present

- `Packages/Capabilities/FreeConnectors`
- `Packages/Capabilities/Github`
- `Packages/Capabilities/Gitlab`
- `Packages/Capabilities/Google`

## 5. Current Integration Families

### Free connectors

The free connector capability contributes lightweight data and utility integrations, including examples such as:

- weather and geolocation
- finance and exchange rates
- NASA and FRED
- CoinGecko
- Wikipedia
- countries
- jokes, quotes, and fun facts
- Hacker News
- image-related integrations such as Unsplash

### GitHub and GitLab

These packages contribute:

- connector definitions
- chat tools
- prompt context
- automation data sources
- automation outputs

GitHub also contributes review-related behavior through feature outputs.

### Google Workspace family

The Google capability is a feature family rather than a single flat integration. The root package handles shared Google connector behavior, and sub-capabilities extend it with service-specific behavior.

Current Google service folders include:

- Calendar
- Contacts
- Docs
- Drive
- Forms
- Gmail
- Photos
- Sheets
- Slides
- Tasks
- YouTube

This structure is a good example of why Joanium's feature registry matters. A shared connector can be extended incrementally by multiple related capability modules.

## 6. MCP and Browser Work

MCP support is a major differentiator in the codebase.

### Current MCP characteristics

- builtin MCP sessions
- stdio MCP sessions
- HTTP MCP sessions
- persisted custom server config
- builtin browser MCP server

This means Joanium can expose a hybrid tool surface:

- local workspace and shell tooling
- feature-defined tools
- MCP tools
- browser-oriented tools

## 7. Channel Support

The channels engine currently includes handling for:

- Telegram
- WhatsApp
- Discord
- Slack

It polls incoming messages, forwards them into the renderer-side orchestration path, and sends responses back through the corresponding channel implementation.

This is a useful architectural point: channel conversations are not a separate AI system. They reuse the same core orchestration philosophy as the main assistant.

## 8. Skills, Personas, and Marketplace

Joanium treats skills and personas as markdown-native content libraries.

### Skills

Skills are markdown documents with frontmatter and instructions. Users can:

- browse installed skills
- enable or disable them
- enable all or disable all
- use them as part of assistant planning and runtime prompting

### Personas

Personas are markdown documents that influence the system prompt and assistant behavior. Users can:

- browse personas
- activate a persona
- deactivate a persona
- start a chat with a persona context

### Marketplace

The marketplace page can fetch remote skills and personas from the Joanium marketplace API, inspect details, and install items into the local library.

This makes Joanium's skill/persona system both local-first and distributable.

## 9. Usage and Observability

Joanium already includes observability-oriented surfaces:

- usage tracking written to a local usage file
- events page for background activity and errors
- per-agent history
- per-automation history
- update progress hooks in preload for packaged releases

This is valuable because many agent products skip visibility once background execution begins.

## 10. How Features Compose Across Surfaces

One of Joanium's strongest ideas is that a single feature package can contribute to multiple user experiences at once.

For example, one capability package can add:

- a connector in setup
- prompt context in chat
- a chat tool during conversation
- a data source in automations
- an output handler in automations
- a feature page in the sidebar

That makes the system much more powerful than a "plugin adds one button" architecture.

## 11. Feature Inventory by Package Family

### `Packages/Features`

These are platform/runtime features:

- Agents
- AI
- Automation
- BrowserPreview
- Channels
- Connectors
- Core
- MCP
- Skills
- Themes

### `Packages/Capabilities`

These are integration or capability contributors:

- FreeConnectors
- Github
- Gitlab
- Google

### `Packages/Pages`

These are user-facing app surfaces:

- Agents
- Automations
- Chat
- Events
- Marketplace
- Personas
- Setup
- Skills
- Usage

## 12. Feature Maturity Notes

The repo already has strong breadth:

- multiple provider support
- local persistence
- page-based product structure
- background execution
- integrations
- marketplace
- skills/personas
- MCP

The most important thing for contributors is to recognize that Joanium is already an ecosystem-shaped app, not a single assistant screen. Changes should be made with that broader product surface in mind.
