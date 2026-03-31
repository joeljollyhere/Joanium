# Joanium Extension Guide

This folder explains the safest and simplest way to add new tools and connectors in this repo.

The main thing to know is this:

- New product work should usually go through the feature system in `packages/Features/`.
- Old generic chat-only tools still exist in `packages/Renderer/Features/Chat/Capabilities/`.
- You should not touch core bootstrap files unless the feature system cannot already do what you need.

## Start Here

Use this guide based on what you are adding:

| What you want to add | Best guide |
| --- | --- |
| A new tool for an existing product like GitHub, Gmail, Drive, or Calendar | [01-add-tool-to-existing-product.md](./01-add-tool-to-existing-product.md) |
| A brand new authenticated connector like Notion, Slack, Jira, Linear, etc. | [02-add-new-service-connector.md](./02-add-new-service-connector.md) |
| A brand new free connector or public API based tool | [03-add-new-free-connector.md](./03-add-new-free-connector.md) |
| A generic AI/chat tool not tied to a product, account, or connector | [04-add-new-built-in-ai-tool.md](./04-add-new-built-in-ai-tool.md) |
| A list of stable core files that are rarely touched, plus when they really should change | [05-rarely-touched-files.md](./05-rarely-touched-files.md) |

## The Real Registration Flow In This Repo

This is the actual high-level flow from the code:

1. `App.js` loads all `feature.js` files from `packages/Features/` through `FeatureRegistry.load(...)`.
2. `FeatureRegistry` builds one boot payload with:
   - service connectors
   - free connectors
   - chat tools
   - automation actions
   - agent data sources
   - agent output types
3. The renderer reads that boot payload through:
   - `window.featureAPI.getBoot()`
   - `packages/Renderer/Features/Core/FeatureBoot.js`
4. The connectors UI merges feature connectors into its card list.
5. The chat tool registry merges feature tools with built-in tools and MCP tools.
6. The executor first tries feature tools, then falls back to the old built-in executor registry.

That means:

- If you add a proper feature, it is auto-discovered.
- You usually do not need to edit `App.js`.
- You usually do not need to edit `Preload.js`.
- You usually do not need to edit the chat tool registries.

## The Best Default Rule

If the thing you are adding belongs to a named product or connector, prefer a feature.

Examples:

- GitHub tool -> add under `packages/Features/Github/`
- Gmail tool -> add under `packages/Features/GoogleWorkspace/Gmail/`
- New product like Notion -> create a new feature under `packages/Features/Notion/`

Only use the old built-in capability system when the tool is truly generic, such as:

- date and time helpers
- text utilities
- file or terminal helpers
- search helpers
- small connector-less AI tools

## Golden Rules

1. If the product already exists in `packages/Features`, keep the new work inside that feature.
2. Prefer `connectorId` on new feature chat tools so connector gating stays explicit.
3. Do not edit `packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js` for new feature service connectors. Feature boot already feeds the connector UI.
4. Do not edit `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js` or `Executors.js` for new feature tools. Feature boot already feeds the tool list and feature executor path.
5. If the connector uses custom OAuth, check the connectors UI first. Right now Google has special handling there.

## Fast Decision Tree

Ask these questions in order:

1. Is this tied to an existing product feature?
   - Yes -> use the existing feature folder.
2. Is this tied to a brand new product/account/connector?
   - Yes -> create a new feature.
3. Is this only a generic chat helper?
   - Yes -> use the built-in capability system.
4. Does the connector need custom OAuth UI?
   - Yes -> plan for extra work in the connectors UI.
5. Does the result need custom rich rendering in chat?
   - Yes -> you may also touch `Agent.js` and `ChatBubble.js`.

## Files You Usually Do Not Need To Touch

These are stable for most extension work:

- `App.js`
- `packages/Features/Core/FeatureRegistry.js`
- `packages/Features/Core/defineFeature.js`
- `packages/Main/IPC/FeatureIPC.js`
- `packages/Electron/Bridge/Preload.js`
- `packages/Renderer/Features/Core/FeatureBoot.js`
- `packages/System/Prompting/SystemPrompt.js`

Read [05-rarely-touched-files.md](./05-rarely-touched-files.md) before changing any of them.
