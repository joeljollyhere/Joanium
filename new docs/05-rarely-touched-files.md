# Rarely Touched Files

This file answers:

- which code is very stable
- when it should be changed
- when it should not be changed

If you are adding tools or connectors, read this before changing core files.

## Almost Never Touched For Normal Feature Work

### `App.js`

Why it is stable:

- it already loads all features automatically
- it already creates the engines
- it already registers generic feature IPC

Touch it only when:

- a completely new top-level engine is added
- a brand new global startup step is needed
- a brand new IPC module must be registered at app boot

Do not touch it when:

- adding a normal product feature
- adding a feature connector
- adding a feature chat tool

## `packages/Features/Core/FeatureRegistry.js`

Why it is stable:

- it already discovers features
- it already builds boot payloads
- it already routes chat tools, automation actions, and agent hooks

Touch it only when:

- the feature contract itself changes
- a new feature subsystem is introduced
- boot payload shape must change
- connector merge behavior itself must change

Do not touch it when:

- adding another feature
- adding another tool inside a feature
- adding another normal connector card through a feature

## `packages/Features/Core/defineFeature.js`

Why it is stable:

- it is just the schema wrapper for feature definitions

Touch it only when:

- the allowed feature shape changes
- you are adding a new top-level feature section

Do not touch it for ordinary product additions.

## `packages/Main/IPC/FeatureIPC.js`

Why it is stable:

- it already exposes generic feature boot and invoke methods

Touch it only when:

- the feature bridge protocol changes
- feature boot needs a different IPC contract

Do not touch it for normal feature work.

## `packages/Electron/Bridge/Preload.js`

Why it is stable:

- `featureAPI.getBoot(...)`
- `featureAPI.invoke(...)`
- connector IPC
- file IPC
- MCP IPC

are already exposed

Touch it only when:

- the renderer needs a brand new top-level global API
- you are not able to use the existing `featureAPI` or `electronAPI`

Do not touch it for:

- normal feature methods
- normal feature tools
- normal feature connectors

## `packages/Renderer/Features/Core/FeatureBoot.js`

Why it is stable:

- it is just the renderer cache for feature boot payload

Touch it only when:

- boot payload shape changes
- boot cache behavior changes

Do not touch it for ordinary feature additions.

## `packages/System/Prompting/SystemPrompt.js`

Why it is stable:

- features can already inject prompt context through `prompt.getContext`

Touch it only when:

- global prompt structure changes
- app-wide prompt policy changes
- the whole prompt layout needs rethinking

Do not touch it when:

- one product just needs extra context

For product-specific prompt context, use the feature's `prompt.getContext`.

## Usually Stable, But Sometimes Touched

### `packages/Main/Core/Paths.js`

Touch it when:

- you are adding a brand new root-level persisted file or folder
- a new app resource path is needed

Do not touch it when:

- all new data can live inside existing feature data or connector storage

## `packages/Main/IPC/ConnectorIPC.js`

Touch it when:

- connector lifecycle rules change
- you need a new connector-wide IPC operation
- normal save/remove/validate is not enough

Do not touch it when:

- the connector can use the existing save/remove/validate flow

## `packages/Connectors/Core/ConnectorEngine.js`

Touch it when:

- you are adding legacy static connectors
- connector storage shape changes
- free connector default state must be hardcoded for old systems

Do not touch it when:

- you are adding a new feature-based service connector
- you are adding a new feature-based free connector

The feature registry already feeds connector defaults into the engine.

## `packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`

Touch it when:

- you are extending the old static connector cards
- you need to change fallback static connector definitions

Do not touch it when:

- you are adding a new feature-based service connector
- you are adding a new feature-based free connector

The renderer already merges feature connector definitions into this UI.

## `packages/Renderer/Features/Connectors/index.js`

Touch it when:

- connector UI behavior changes
- a custom OAuth flow is added
- the connect/disconnect UX must become product-specific

This file matters for new OAuth connectors because the current code has special Google handling.

Do not touch it for:

- normal token-based connectors
- normal feature connector cards

## `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`

Touch it when:

- adding a new built-in capability family
- changing legacy built-in tool registration
- changing built-in connector gating rules

Do not touch it when:

- adding a feature tool

Feature tools already come through boot payload.

## `packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

Touch it when:

- adding a new built-in capability family
- changing built-in executor routing

Do not touch it when:

- adding a feature tool

Feature tool execution already goes through `featureAPI.invoke(...)`.

## `packages/Automation/Core/AutomationEngine.js`

Touch it when:

- the automation engine itself changes
- scheduling or execution semantics change
- global automation history behavior changes

Do not touch it when:

- you only need a new feature automation action

For normal product actions, add them through the feature's `automation` section.

## `packages/Agents/Core/AgentsEngine.js`

Touch it when:

- the agent engine itself changes
- global data collection behavior changes
- global output execution behavior changes
- model failover policy changes

Do not touch it when:

- you only need a new feature data source or output type

For normal product additions, use the feature's `agents` section.

## Rare Rich-UI Files

### `packages/Renderer/Features/Chat/Core/Agent.js`

Touch it only when:

- tool call orchestration itself changes
- special tool result markers need custom handling
- browser approval logic changes

Normal tools should not need changes here.

## `packages/Renderer/Features/Chat/UI/ChatBubble.js`

Touch it only when:

- the tool result needs custom rendering
- the normal markdown/text flow is not enough

Examples:

- photo gallery
- custom media layout
- embedded tool visualization

## Safe Default Summary

If you are adding:

- a product tool
- a new service connector
- a new free connector

then the safest assumption is:

```md
Stay inside the feature folder first.
Only leave that area if the current architecture clearly cannot support the use case.
```

That one rule will prevent most unnecessary edits in this repo.
