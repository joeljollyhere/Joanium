# Add A New Free Connector

Use this guide for public APIs or low-friction tools such as:

- News APIs
- Movie databases
- sports data
- public geo APIs
- no-key APIs
- free APIs with optional or required keys

## There Are Two Ways To Do This In This Repo

### Recommended path: feature-based free connector

Use this for new work.

Why this is better:

- auto-discovered
- cleaner ownership
- can grow into automations and agents later
- avoids editing old static connector lists

### Legacy path: old built-in capability plus static connector lists

Use this only when:

- you are extending the old built-in capability system on purpose
- you want the new API to sit next to old modules like Weather, Crypto, Photo, Country, Astronomy, or Url

## Recommended Path: Feature-Based Free Connector

Even though the current repo examples are mostly service features, the feature system already supports free connectors.

That support is already in:

- `FeatureRegistry.getConnectorDefaults()`
- `FeatureRegistry.getBootPayload()`
- `loadFeatureConnectorDefs()` in the renderer
- `ConnectorEngine` default state merge

So you can use it.

## Files You Usually Touch For The Recommended Path

1. `packages/Features/<Product>/feature.js`
2. `packages/Features/<Product>/Tools.js`
3. `packages/Features/<Product>/ChatExecutor.js`
4. optional `packages/Automation/Integrations/<Product>.js`

## Recommended Feature Template

```js
import defineFeature from '../Core/defineFeature.js';
import { FREE_PRODUCT_TOOLS } from './Tools.js';
import { executeFreeProductChatTool } from './ChatExecutor.js';

export default defineFeature({
  id: 'free-product',
  name: 'Free Product',
  connectors: {
    free: [
      {
        id: 'free_product',
        name: 'Free Product',
        icon: 'FP',
        description: 'Public API description.',
        noKey: false,
        optionalKey: true,
        keyLabel: 'API Key',
        keyPlaceholder: 'Paste your key',
        keyHint: 'Optional but recommended for higher rate limits.',
        docsUrl: 'https://example.com/docs',
        toolHint: 'Ask: "Use Free Product to ..."',
        defaultState: {
          enabled: true,
          credentials: { apiKey: '' },
        },
      },
    ],
  },
  main: {
    methods: {
      async executeChatTool(ctx, { toolName, params }) {
        return executeFreeProductChatTool(ctx, toolName, params);
      },
    },
  },
  renderer: {
    chatTools: FREE_PRODUCT_TOOLS,
  },
});
```

## Tool Definition Pattern

```js
export const FREE_PRODUCT_TOOLS = [
  {
    name: 'free_product_lookup',
    description: 'Look something up using Free Product.',
    category: 'free_product',
    connectorId: 'free_product',
    parameters: {
      query: { type: 'string', required: true, description: 'Search query' },
    },
  },
];
```

## Executor Pattern

Because feature executors run in main context, they can read free connector credentials directly from `ctx.connectorEngine`.

Pattern:

```js
export async function executeFreeProductChatTool(ctx, toolName, params = {}) {
  const config = ctx.connectorEngine?.getConnector('free_product');
  const apiKey = config?.credentials?.apiKey?.trim() ?? '';

  switch (toolName) {
    case 'free_product_lookup': {
      const { query } = params;
      if (!query) throw new Error('Missing required param: query');
      return await lookupSomething(query, apiKey);
    }

    default:
      throw new Error(`Unknown tool: ${toolName}`);
  }
}
```

## Why This Path Is Better

With this path, you do not need to touch:

- `packages/Connectors/Core/ConnectorEngine.js`
- `packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`
- `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
- `packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

The feature system already feeds the connector card and tool list.

## Legacy Path: Static Free Connector Plus Built-In Capability

This is the older pattern used by current built-in modules such as:

- Weather
- Crypto
- Photo
- Astronomy
- Country
- Url

Use this path only if you intentionally want to extend that old system.

## Files You Touch In The Legacy Path

1. Add connector default state:
   - `packages/Connectors/Core/ConnectorEngine.js`
2. Add connector card metadata:
   - `packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`
3. Add the tool definition:
   - `packages/Renderer/Features/Chat/Capabilities/<Family>/Tools.js`
4. Add the executor logic:
   - `packages/Renderer/Features/Chat/Capabilities/<Family>/Executor.js`
5. If it is a brand new capability family, register it:
   - `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
   - `packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

## Legacy Path Checklist

### Step 1: Add the connector to `ConnectorEngine.js`

Example shape:

```js
movie_db: {
  enabled: true,
  isFree: true,
  noKey: false,
  credentials: { apiKey: '' },
  connectedAt: null,
},
```

### Step 2: Add the connector card to `ConnectorDefs.js`

Example shape:

```js
{
  id: 'movie_db',
  name: 'Movie DB',
  icon: 'MD',
  description: 'Search movies and TV shows.',
  noKey: false,
  optionalKey: true,
  keyLabel: 'API Key',
  keyPlaceholder: 'themoviedb.org',
  keyHint: 'Free key available in developer settings.',
  docsUrl: 'https://developer.example.com',
  toolHint: 'Ask: "Search for sci-fi movies from 2024"',
}
```

### Step 3: Add the capability tool and executor

If this is a new family:

- create `Tools.js`
- create `Executor.js`
- register both in the capability registries

If this is just another tool in an existing family:

- only edit that family's `Tools.js` and `Executor.js`

### Step 4: Make connector gating explicit

For old built-in tools, connector gating can happen through:

- `tool.connectorId`
- or the category map in `Registry/Tools.js`

For new work, prefer `connectorId`.

## Which Path Should You Pick?

Pick the feature path if:

- this is a brand new public API integration
- you may want automations or agents later
- you want cleaner ownership

Pick the legacy path only if:

- you are intentionally extending the old built-in capability area
- you want the new API to live with those old renderer executors

## Short Recommendation

For brand new free connectors, the safer modern default is:

```md
Create a feature-based free connector first.
Only use the static built-in path if you are extending old capability modules on purpose.
```
