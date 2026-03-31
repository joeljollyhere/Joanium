# Add A New Service Connector

Use this guide for a brand new authenticated product such as:

- Notion
- Slack
- Jira
- Linear
- Dropbox
- ClickUp

In this repo, the preferred path is a feature-based connector under `packages/Features/`.

## The Two Connector Shapes In This Repo

There are two common service connector shapes:

1. Token or credential based connector
   - easiest path
   - supported well by the current generic connector UI
2. Custom OAuth connector
   - possible
   - needs extra UI handling
   - Google Workspace is the current example

If you can ship the connector with:

- API key
- personal access token
- account id plus token
- workspace id plus token

then use the token path first.

## Best Default File Layout

For a new product called `Notion`, a clean starting structure is:

```text
packages/Features/Notion/
  feature.js
  Tools.js
  ChatExecutor.js
  Common.js
  AutomationHandlers.js        (optional)
  AgentHandlers.js             (optional)
```

And if you need a shared low-level API helper:

```text
packages/Automation/Integrations/Notion.js
```

You do not have to copy every optional file on day one.

## What You Usually Touch

For a new token-based service connector, you usually touch only:

1. `packages/Features/<Product>/feature.js`
2. `packages/Features/<Product>/Tools.js`
3. `packages/Features/<Product>/ChatExecutor.js`
4. `packages/Features/<Product>/Common.js` if you want credential helpers
5. `packages/Automation/Integrations/<Product>.js` if you need shared HTTP logic

## What You Usually Do Not Touch

Normally you do not need to change:

- `App.js`
- `packages/Features/Core/FeatureRegistry.js`
- `packages/Main/IPC/FeatureIPC.js`
- `packages/Electron/Bridge/Preload.js`
- `packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`
- `packages/Connectors/Core/ConnectorEngine.js`
- `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
- `packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

Why:

- feature connectors are discovered automatically
- connector defaults are pulled from the feature registry
- connector cards are fed by feature boot
- feature tools are fed by feature boot

## Real Flow For A New Feature Connector

This is what the code already does for you:

1. `FeatureRegistry.load(...)` finds every `feature.js`
2. `feature.connectors.services` becomes part of the boot payload
3. the connectors UI reads that boot payload and renders the connector card
4. `ConnectorEngine` also receives default connector state from the feature registry
5. feature chat tools become available automatically

That means a proper feature is the registration step.

## Step By Step For A Token Based Connector

### Step 1: Create the feature definition

Minimal example:

```js
import defineFeature from '../Core/defineFeature.js';
import { ProductAPI } from './Common.js';
import { PRODUCT_TOOLS } from './Tools.js';
import { executeProductChatTool } from './ChatExecutor.js';

export default defineFeature({
  id: 'product',
  name: 'Product',
  connectors: {
    services: [
      {
        id: 'product',
        name: 'Product',
        icon: 'PR',
        description: 'Short connector description.',
        helpUrl: 'https://product.example.com/docs',
        helpText: 'Create credentials ->',
        oauthType: null,
        subServices: [],
        setupSteps: [
          'Open Product settings',
          'Create an API token',
          'Paste it below',
        ],
        capabilities: [
          'Read product data in chat',
          'Use the product in automations and agents',
        ],
        fields: [
          {
            key: 'token',
            label: 'API Token',
            placeholder: 'prod_...',
            type: 'password',
            hint: 'Create this in the Product developer settings page.',
          },
        ],
        automations: [],
        defaultState: { enabled: false, credentials: {} },
        async validate(ctx) {
          const credentials = ctx.connectorEngine?.getCredentials('product');
          if (!credentials?.token) return { ok: false, error: 'No token stored' };
          const me = await ProductAPI.getCurrentUser(credentials);
          ctx.connectorEngine?.updateCredentials('product', { username: me.username });
          return { ok: true, username: me.username };
        },
      },
    ],
  },
  main: {
    methods: {
      async executeChatTool(ctx, { toolName, params }) {
        return executeProductChatTool(ctx, toolName, params);
      },
    },
  },
  renderer: {
    chatTools: PRODUCT_TOOLS,
  },
});
```

## Step 2: Add chat tools

Use `connectorId` on every tool so connector gating is explicit:

```js
export const PRODUCT_TOOLS = [
  {
    name: 'product_list_items',
    description: 'List items from Product.',
    category: 'product',
    connectorId: 'product',
    parameters: {
      limit: { type: 'number', required: false, description: 'How many items to return' },
    },
  },
];
```

## Step 3: Add the chat executor

Pattern:

```js
import { requireProductCredentials } from './Common.js';
import { ProductAPI } from './Common.js';

export async function executeProductChatTool(ctx, toolName, params = {}) {
  const credentials = requireProductCredentials(ctx);

  switch (toolName) {
    case 'product_list_items': {
      const { limit = 10 } = params;
      const items = await ProductAPI.listItems(credentials, limit);
      return items.length ? items.map(item => `- ${item.name}`).join('\n') : 'No items found.';
    }

    default:
      throw new Error(`Unknown Product tool: ${toolName}`);
  }
}
```

## Step 4: Add a small `Common.js`

This keeps credential loading and shared helpers in one place:

```js
import * as ProductAPI from '../../Automation/Integrations/Product.js';

export function getProductCredentials(ctx) {
  const credentials = ctx.connectorEngine?.getCredentials('product');
  return credentials?.token ? credentials : null;
}

export function requireProductCredentials(ctx) {
  const credentials = getProductCredentials(ctx);
  if (!credentials) throw new Error('Product not connected');
  return credentials;
}

export { ProductAPI };
```

## Step 5: Add the low-level integration helper

This should contain:

- base URL
- auth headers
- request helper
- response parsing
- nice thrown errors

Keep final chat formatting out of this file.

## Step 6: Decide whether this connector needs more than chat

If yes, extend the same feature with:

- `automation.actions`
- `automation.handlers`
- `agents.dataSources`
- `agents.outputTypes`
- `prompt.getContext`

If no, you are done after the feature, tools, executor, and integration files.

## When You Must Touch Extra Files

### Case 1: Custom OAuth

The current connectors UI only has special connect logic for Google.

You will likely need to update:

- `packages/Renderer/Features/Connectors/index.js`

Why:

- current UI path is either `handleGoogleConnect(...)` or `handleTokenConnect(...)`
- there is not yet a generic custom OAuth connector flow

For OAuth connectors, the normal pattern is:

1. add `feature.main.methods.oauthStart`
2. add UI connect logic that calls that method
3. save returned credentials into the connector engine

### Case 2: New generic connector lifecycle behavior

Only then touch:

- `packages/Main/IPC/ConnectorIPC.js`

Examples:

- custom validation flow not covered by `validateConnector`
- new connect/remove behavior
- a new connector-specific save primitive

### Case 3: Renderer needs brand new global IPC

Only then touch:

- `packages/Electron/Bridge/Preload.js`

Most feature work does not need this because `featureAPI.invoke(...)` already exists.

## Multi-Service Connector Pattern

If one sign-in unlocks several related products, copy the Google pattern.

Use:

- one service connector in `connectors.services`
- product modules that add `serviceExtensions`

Use this when:

- one account grants several APIs
- one auth flow is shared

Do not create separate stored connectors if the credentials are truly shared.

## Quick Rule For New Service Connectors

If the connector is new and token-based:

```md
Create a feature.
Put the connector in `connectors.services`.
Put tools in `renderer.chatTools`.
Use `connectorId`.
Add a validate function.
Do not edit static connector files.
```

That is the normal path in this repo now.
