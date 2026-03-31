# Add A Tool To An Existing Product

Use this guide when the product already exists in `packages/Features/`.

Current examples in this repo:

- `packages/Features/Github/`
- `packages/Features/GoogleWorkspace/Gmail/`
- `packages/Features/GoogleWorkspace/Drive/`
- `packages/Features/GoogleWorkspace/Calendar/`

This is the easiest and safest type of extension in the current codebase.

## What You Usually Touch

For an existing product tool, you normally touch 2 to 4 files:

1. The product tool list:
   - `packages/Features/<Feature>/<Area>/Tools.js`
2. The product chat executor:
   - `packages/Features/<Feature>/<Area>/ChatExecutor.js`
3. Sometimes the product feature definition, if feature-level metadata or reusable methods change:
   - `packages/Features/<Feature>/<Area>/feature.js`
4. The integration layer if a new API call is needed:
   - usually `packages/Automation/Integrations/<Something>.js`
   - or a helper inside the product folder like `DriveApi.js`

## What You Usually Do Not Touch

For this kind of work, do not start by editing these:

- `App.js`
- `packages/Features/Core/FeatureRegistry.js`
- `packages/Electron/Bridge/Preload.js`
- `packages/Main/IPC/FeatureIPC.js`
- `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
- `packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`
- `packages/Connectors/Core/ConnectorEngine.js`
- `packages/Renderer/Features/Connectors/Catalog/ConnectorDefs.js`

The reason is simple:

- existing features are auto-loaded
- feature tools are auto-exposed to chat
- feature methods are already callable through `featureAPI.invoke(...)`

## The Real Flow

For an existing product tool, the code path is:

1. Add a tool definition in `Tools.js`
2. Handle it in `ChatExecutor.js`
3. Update `feature.js` only if the feature-level contract needs to change
4. The renderer picks it up automatically from feature boot
5. The executor calls the feature automatically

## Step By Step

### Step 1: Add the tool definition

Add a new tool object to the product `Tools.js`.

Use this shape:

```js
{
  name: 'product_do_something',
  description: 'What the tool does in plain English.',
  category: 'product',
  connectorId: 'product-connector-id',
  parameters: {
    id: { type: 'string', required: true, description: 'The target item id' },
    limit: { type: 'number', required: false, description: 'Optional max count' },
  },
}
```

Important notes:

- Prefer adding `connectorId`.
- Do not rely only on category-to-connector mapping for new work.
- Keep parameter names simple and API-shaped.

## Step 2: Handle the tool in the chat executor

Add one new `case` to `ChatExecutor.js`.

Use this pattern:

```js
case 'product_do_something': {
  const { id, limit = 10 } = params;
  if (!id) throw new Error('Missing required param: id');

  const result = await SomeAPI.doSomething(credentials, id, limit);
  return formatResult(result);
}
```

What belongs here:

- input validation
- parameter normalization
- user-friendly response formatting

What does not belong here:

- connector loading logic if you already have a shared helper
- low-level HTTP details
- unrelated automation or agent logic

## Step 3: Update `feature.js` only if needed

The feature file is the product's public contract, but for many simple new chat tools the existing `executeChatTool` wiring is already enough.

If the executor can call an existing API helper directly, you may only need a small wrapper.
If the operation is new, add a new method under `main.methods`.

Pattern:

```js
main: {
  methods: {
    async doSomething(ctx, { id, limit = 10 }) {
      return withProduct(ctx, async credentials => {
        if (!id) return { ok: false, error: 'id is required' };
        return { ok: true, data: await SomeAPI.doSomething(credentials, id, limit) };
      });
    },

    async executeChatTool(ctx, { toolName, params }) {
      return executeProductChatTool(ctx, toolName, params);
    },
  },
}
```

Why this matters:

- chat can use it
- automations or agents can reuse it later
- the feature stays consistent

## Step 4: Add or extend the integration helper

If the product needs a brand new external API call, add it to the existing integration file.

Examples from this repo:

- GitHub helpers live in `packages/Automation/Integrations/Github.js`
- Google shared auth lives in `packages/Automation/Integrations/GoogleWorkspace.js`
- Drive-specific calls live in `packages/Features/GoogleWorkspace/Drive/DriveApi.js`

Keep the integration layer focused on:

- request building
- auth headers
- response parsing
- throwing clear errors

Do not format final chat text there.

## Step 5: Decide if the tool is chat-only or product-wide

If the tool should also show up in:

- automations
- agents
- prompt context

then also update the matching part of the same feature:

- `automation.actions`
- `automation.handlers`
- `agents.dataSources`
- `agents.outputTypes`
- `agents.dataSourceCollectors`
- `agents.outputHandlers`
- `prompt.getContext`

If it is only a chat tool, stop after the chat pieces.

## Example File Set For A Typical Product Tool

If you add one new GitHub tool, the normal change set is usually:

- `packages/Features/Github/Tools.js`
- `packages/Features/Github/ChatExecutor.js`
- `packages/Features/Github/feature.js`
- `packages/Automation/Integrations/Github.js`

If you add one new Gmail tool, the normal change set is usually:

- `packages/Features/GoogleWorkspace/Gmail/Tools.js`
- `packages/Features/GoogleWorkspace/Gmail/ChatExecutor.js`
- `packages/Features/GoogleWorkspace/Gmail/feature.js`
- `packages/Automation/Integrations/Gmail.js`

## If The Product Shares A Bigger Connector

Google Workspace is the important example here.

In this repo:

- the stored connector id is `google`
- sub-products are `gmail`, `drive`, and `calendar`

For new work under Google Workspace:

- it is safer to set `connectorId: 'google'` on the tool
- do not create a second stored connector just for Gmail or Drive
- use the shared Google credential helpers from `packages/Features/GoogleWorkspace/Common.js`

## When You Need More Than The Normal Files

Touch extra files only in these cases:

### Need a new automation action

Also update:

- the same product `feature.js`
- product automation handler file

### Need a new agent data source or output

Also update:

- the same product `feature.js`
- product agent handler file

### Need rich custom chat rendering

Only then touch:

- `packages/Renderer/Features/Chat/Core/Agent.js`
- `packages/Renderer/Features/Chat/UI/ChatBubble.js`

This is rare. The existing photo gallery flow is an example of this kind of special case.

## Simple Template

Use this as a checklist:

```md
1. Add tool object in Tools.js
2. Add case in ChatExecutor.js
3. Add main method in feature.js if needed
4. Add low-level API helper if needed
5. If needed, add automation/agent/prompt support in the same feature
6. Do not touch bootstrap or registries unless the feature path cannot already do it
```

## Good Sign You Chose The Right Path

You probably chose the right approach if:

- the feature folder contains almost all changes
- no core bootstrap file was edited
- the tool appears through feature boot automatically

If you find yourself editing `App.js` for a normal product tool, stop and re-check the architecture first.


