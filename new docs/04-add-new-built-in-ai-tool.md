# Add A New Built-In AI Tool

Use this guide only when the tool is not really a product feature.

Good examples:

- date and time helpers
- text transformers
- password or utility helpers
- search helpers
- workspace helpers
- generic terminal or local tools

Bad examples:

- GitHub actions
- Gmail actions
- Google Drive tools
- any product or account-specific integration

If the tool belongs to a product, use the feature system instead.

## This Path Is The Older Built-In Capability System

The built-in capability system lives here:

- `packages/Renderer/Features/Chat/Capabilities/`

Every family usually has:

- `Tools.js`
- `Executor.js`

And then the family is wired into the registries.

## Files You Usually Touch

For a new built-in family:

1. `packages/Renderer/Features/Chat/Capabilities/<Name>/Tools.js`
2. `packages/Renderer/Features/Chat/Capabilities/<Name>/Executor.js`
3. `packages/Renderer/Features/Chat/Capabilities/Registry/Tools.js`
4. `packages/Renderer/Features/Chat/Capabilities/Registry/Executors.js`

For a new tool inside an existing family:

1. that family's `Tools.js`
2. that family's `Executor.js`

## What You Usually Do Not Touch

Normally you do not need:

- `App.js`
- `FeatureRegistry.js`
- `Preload.js`
- `FeatureIPC.js`
- connector UI files

Because this system is renderer-local and already wired up.

## Step By Step

### Step 1: Decide whether it really belongs here

Use this system only if the tool is:

- generic
- renderer-side
- chat-focused
- not really a named product integration

If the tool may later need:

- connector cards
- automation actions
- agent data sources
- prompt context

then a feature is usually better.

## Step 2: Add the tool definition

Example:

```js
export const MY_TOOLS = [
  {
    name: 'format_json_pretty',
    description: 'Format JSON into a readable pretty-printed form.',
    category: 'utility',
    parameters: {
      input: { type: 'string', required: true, description: 'JSON text to format' },
    },
  },
];
```

If the tool depends on a connector, prefer:

```js
connectorId: 'your_connector_id'
```

instead of depending only on category mapping.

## Step 3: Add the executor

Pattern:

```js
const HANDLED = new Set(['format_json_pretty']);

export function handles(toolName) {
  return HANDLED.has(toolName);
}

export async function execute(toolName, params, onStage = () => {}) {
  if (toolName !== 'format_json_pretty') {
    throw new Error(`Unknown tool: ${toolName}`);
  }

  const { input } = params;
  if (!input) throw new Error('Missing required param: input');

  onStage('Formatting JSON...');

  const parsed = JSON.parse(input);
  return JSON.stringify(parsed, null, 2);
}
```

Keep this file responsible for:

- validation
- execution
- result formatting

## Step 4: Register the family if it is new

If this is a brand new capability family, update:

### `Registry/Tools.js`

You need to:

- import the new tools constant
- export it if needed
- spread it into `STATIC_TOOLS`

### `Registry/Executors.js`

You need to:

- import the executor module
- add it to the `EXECUTORS` array

If you skip either one, the tool will not fully work.

## Step 5: Handle connector gating if needed

If the tool should only be available when a connector is enabled, use one of these:

1. add `connectorId` to the tool
2. or update the category map in `Registry/Tools.js`

For new work, `connectorId` is clearer.

## Step 6: Only add custom UI if absolutely needed

Most tools should return normal text.

Only touch extra chat files if the result needs a special visual treatment.

Examples of rare special cases:

- image gallery
- embedded terminal block
- browser view integration

Only then touch:

- `packages/Renderer/Features/Chat/Core/Agent.js`
- `packages/Renderer/Features/Chat/UI/ChatBubble.js`

The existing photo gallery flow is the reference example for this.

## When This Path Is Wrong

This path is probably wrong if:

- you are adding a new connector at the same time
- the tool needs prompt enrichment
- the tool should also appear in automations
- the tool should also appear in agents
- the tool belongs to a real product like GitHub, Slack, or Notion

In those cases, use a feature.

## Fast Checklist

```md
1. Put the tool in a capability family
2. Add the executor logic
3. If new family, register it in Tools.js and Executors.js
4. Add connectorId if connector gating is needed
5. Avoid changing core files unless you need custom rich rendering
```
