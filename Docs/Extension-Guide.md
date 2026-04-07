# Extension Guide

This document explains how to add new capabilities to Joanium without fighting the existing architecture.

## 1. Start With the Right Mental Model

Joanium is extended through discovery, not by editing one giant registry file.

In practice that means you usually add one of these:

- a workspace package
- a feature manifest
- an engine
- an IPC module
- a service
- a page manifest

The boot layer discovers and assembles them.

## 2. Discovery Entry Point: `joanium.discovery`

Every extension starts with a workspace package manifest.

Example shape:

```json
{
  "name": "@Joanium/my-package",
  "private": true,
  "type": "module",
  "joanium": {
    "discovery": {
      "features": ["./Core"],
      "engines": ["./Core"],
      "ipc": ["./IPC"],
      "pages": ["."],
      "services": ["./Services"]
    }
  }
}
```

You only need the discovery kinds your package actually provides.

## 3. Adding a New Feature Package

Use a feature package when you want to contribute one or more of:

- connectors
- chat tools
- automation data sources
- automation outputs
- prompt context
- feature pages
- lifecycle hooks
- feature storage

### Minimal feature example

```js
import { defineFeature } from '../../Core/defineFeature.js';

export default defineFeature({
  id: 'acme',
  name: 'Acme',
  storage: {
    key: 'Acme',
    featureKey: 'Acme',
    fileName: 'Acme.json',
  },
  renderer: {
    chatTools: [
      {
        name: 'acme_lookup',
        description: 'Look up data from Acme',
        parameters: {
          query: { type: 'string', description: 'What to search', required: true },
        },
      },
    ],
  },
  main: {
    methods: {
      async executeChatTool(ctx, { toolName, params }) {
        if (toolName !== 'acme_lookup') return null;
        return `Acme result for ${params.query}`;
      },
    },
  },
  prompt: {
    async getContext() {
      return {
        connectedServices: ['Acme'],
        sections: ['Acme is connected and available.'],
      };
    },
  },
});
```

### Important notes

- Feature `id` values must be unique.
- `dependsOn` is supported if your feature extends another feature family.
- Feature storage keys must be unique across both features and engines.
- Feature pages can be returned through the feature boot payload and loaded by the renderer shell.

## 4. Adding a New Engine

Use an engine when you need long-lived runtime behavior such as:

- scheduling
- polling
- background queues
- persisted runtime state
- a service that should start with the app

Engines are defined with `Packages/System/Contracts/DefineEngine.js`.

### Minimal engine example

```js
import defineEngine from '../../../System/Contracts/DefineEngine.js';

export const engineMeta = defineEngine({
  id: 'acme-engine',
  provides: 'acmeEngine',
  needs: ['paths'],
  storage: {
    key: 'Acme',
    featureKey: 'Acme',
    fileName: 'Acme.json',
  },
  create(context) {
    return {
      start() {},
      stop() {},
      getAll() {
        return context.featureStorage.get('Acme')?.load(() => ({ items: [] }));
      },
    };
  },
});
```

### Engine guidance

- `provides` is the key injected into the boot context.
- `needs` lets the boot layer delay creation until dependencies are available.
- Use an engine when state and lifecycle matter.
- Do not use an engine for a simple static helper that belongs in a normal module.

## 5. Adding a New IPC Module

Use an IPC module when the renderer needs access to main-process behavior.

### Minimal IPC example

```js
import { ipcMain } from 'electron';

export const ipcMeta = { needs: ['acmeEngine'] };

export function register(acmeEngine) {
  ipcMain.handle('acme:list', () => acmeEngine.getAll());
}
```

### Important behavior

`Packages/Main/Core/DiscoverIPC.js` auto-loads services and passes context objects into IPC modules based on `ipcMeta.needs`.

That means:

- services become injectable if the file name ends with `Service.js`
- engines become injectable if they were created during boot
- path and registry helpers from boot context can also be injected

## 6. Adding a New Service

Use a service when you want a reusable main-process helper module that may also be auto-injected into IPC.

Examples already in the repo:

- `ChatService.js`
- `ProjectService.js`
- `MarketplaceService.js`
- `SystemPromptService.js`

If a service is discovered, the loader exposes it in camelCase based on file name. For example, `UserService.js` becomes `userService` in IPC injection context.

## 7. Adding a New Page

Use a page when the user needs a dedicated surface in the app shell.

Pages are defined with `Packages/System/Contracts/DefinePage.js`.

### Minimal page manifest example

```js
import definePage from '../../System/Contracts/DefinePage.js';

export default definePage({
  id: 'acme',
  label: 'Acme',
  icon: 'sparkles',
  order: 80,
  section: 'top',
  moduleUrl: './UI/Render/index.js',
  css: './UI/Styles/AcmePage.css',
});
```

### Typical page structure

- `Page.js`
- optional `*.html`
- `UI/Render/index.js`
- `UI/Styles/*.css`
- optional `Components`, `Templates`, `Features`, `State`, or `Utils`

### Built-in vs feature-contributed pages

- Built-in pages are discovered from page roots and loaded through `get-pages`.
- Feature-contributed pages are returned through the feature boot payload and registered by the renderer shell.

Use a built-in page when it is a core app surface. Use a feature-contributed page when it belongs tightly to a specific capability.

## 8. Adding a New Connector or Integration

If you are integrating a third-party service, your usual path is:

1. add or update a capability package under `Packages/Capabilities`
2. define connector metadata in `Feature.js`
3. optionally add chat tools, prompt context, automation collectors, output handlers, or service extensions
4. use `ConnectorEngine` state for enablement and credentials

### Good fit for a capability package

- Git provider support
- SaaS APIs
- productivity apps
- knowledge sources
- feature-specific automation outputs

### Good fit for platform feature packages instead

- generic scheduling
- generic storage
- MCP session management
- browser preview plumbing
- cross-cutting UI theming

## 9. Adding a New AI Provider

Provider support is a cross-cutting change, not a single-file edit.

You usually need to update:

- `Config/Models/index.json`
- a new or existing file under `Config/Models`
- `Packages/Pages/Setup/UI/Render/Providers/SetupProviders.js`
- `Packages/Features/AI/index.js`

That split exists because:

- the setup page controls what the user sees and configures
- model catalogs define model metadata
- the AI runtime layer defines how requests are translated for that provider

## 10. Adding New Automation Building Blocks

For automations, there are two levels of extension:

### Built-in automation building blocks

These live under:

- `Packages/Features/Automation/DataSources`
- `Packages/Features/Automation/Actions`
- `Packages/Features/Automation/Core`

### Feature-contributed automation building blocks

Capability packages can contribute:

- `automation.dataSources`
- `automation.dataSourceCollectors`
- `automation.outputTypes`
- `automation.outputHandlers`
- `automation.instructionTemplates`

Use built-in automation modules for generic platform behavior. Use capability features for integration-specific automation behavior.

## 11. Validation Checklist

After adding a new package or discovery root:

1. Run `npm run packages:audit`.
2. Confirm your package shows the expected discovery hooks.
3. Start the app and verify no duplicate IDs are reported.
4. Verify the boot path can instantiate your engine or load your feature.
5. Verify packaged resource assumptions if your feature depends on bundled files.

On Windows PowerShell, `cmd /c npm run packages:audit` may be more reliable if script execution is restricted.

## 12. Common Pitfalls

- Forgetting to add `joanium.discovery` in the workspace package.
- Using duplicate feature IDs, page IDs, or storage keys.
- Adding a page file without a valid `moduleUrl`.
- Treating development-state paths and packaged-state paths as identical.
- Adding integration logic in the renderer when it should live in a feature or main-process layer.
- Making provider changes in setup without updating the AI runtime adapters.

## 13. When to Choose Which Extension Point

| You want to add...                      | Best place                                                     |
| --------------------------------------- | -------------------------------------------------------------- |
| A new external integration              | `Packages/Capabilities/<Name>`                                 |
| A new background runtime system         | `Packages/Features/<Name>/Core/*Engine.js`                     |
| A new main-process API for the renderer | `*IPC.js` in an IPC discovery root                             |
| A reusable main helper                  | `*Service.js` in a services discovery root                     |
| A new core app surface                  | `Packages/Pages/<Name>`                                        |
| A feature-owned page                    | a feature page contribution through `Feature.js`               |
| A new model provider                    | `Config/Models`, setup provider UI, and `Packages/Features/AI` |

## 14. Final Advice

If you follow the architecture instead of bypassing it, Joanium is a pleasant repo to extend.

The safest approach is:

- keep integration logic inside capability packages
- keep long-lived runtime behavior inside engines
- keep renderer pages focused on UI and interaction
- use discovery instead of manual central registration whenever possible

If you are unsure where a change belongs, use [Where-To-Change-What.md](Where-To-Change-What.md) as the practical map.
