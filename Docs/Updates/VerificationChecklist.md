# Verification Checklist

Use this after any non-trivial update.

## Always

- run `npm run lint`
- confirm the app still boots
- confirm the changed page or settings panel still mounts without breaking the shell
- confirm no preload or IPC method names drifted between main and renderer
- confirm docs match the final behavior

## If You Changed UI Only

- confirm the correct stylesheet owns the new classes
- confirm desktop layout still works
- confirm modal-open and overlay states still behave correctly
- confirm navigation and Escape handling still work

## If You Changed A Provider

- confirm the provider appears in setup and settings
- confirm credentials can be saved
- confirm the provider becomes selectable in the model selector
- confirm chat can complete a request with it
- confirm image or document input flags are accurate

## If You Changed Connectors

- confirm the connector card renders
- confirm connect, disconnect, and validation flows work
- confirm enabled state persists in `Data/Connectors.json`
- confirm related chat tools are gated correctly
- confirm prompt enrichment still works if applicable

## If You Changed A Chat Tool

- confirm the tool is discoverable in the tool registry
- confirm executor dispatch reaches the correct handler
- confirm connector or workspace gating is correct
- confirm user-facing answers do not leak tool internals

## If You Changed Automations

- confirm the action appears in the editor
- confirm action fields save and reload correctly
- confirm the engine can execute the action
- confirm history entries and `lastRun` look right in `Data/Automations.json`
- confirm failures stop the remaining action chain as expected

## If You Changed Agents

- confirm the new source or output appears in the editor
- confirm save and reload preserve the new fields
- confirm `run-agent-now` works
- confirm history entries and `lastRun` look right in `Data/Agents.json`
- confirm nothing-to-report behavior still makes sense

## If You Changed Channels

- confirm the channel card renders in Settings
- confirm validation and save paths work
- confirm enabled state persists in `Data/Channels.json`
- confirm incoming messages still reach `Packages/Renderer/Features/Channels/Gateway.js`
- confirm replies still use the normal chat model and prompt

## If You Changed MCP Or Browser Preview

- confirm MCP server list loads
- confirm connect and disconnect still work
- confirm tools appear in chat when connected
- confirm browser preview bounds and visibility still sync correctly
- confirm modal opening hides or suspends preview correctly

## If You Changed Projects Or Workspace Tooling

- confirm project create, update, open, and delete still work
- confirm active project updates `state.activeProject` and `state.workspacePath`
- confirm project-scoped chats save under `Data/Projects/<id>/Chats/`
- confirm workspace tools stay hidden when no workspace is active

## If You Changed Prompt, Skills, Personas, Or Memory

- confirm the saved data lands in the right file
- confirm prompt cache invalidation happens
- confirm the rebuilt prompt reflects the change
- confirm skills and personas still toggle or activate correctly

## If You Changed Usage Or Events

- confirm new records are still written
- confirm the page renders with old and new records
- confirm clear actions still work
- confirm events still reflect the true source histories

## If You Added A New Persisted File

- confirm `Packages/Main/Core/Paths.js` is the single source of truth
- confirm missing-file startup is safe
- confirm corrupt-file fallback is safe
- confirm packaged builds still include the needed path or default data
