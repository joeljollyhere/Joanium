import { state } from '../../../../../System/State.js';
import { getFeatureBoot } from '../../../../../Features/Core/FeatureBoot.js';
import { WEATHER_TOOLS } from '../Weather/Tools.js';
import { CRYPTO_TOOLS } from '../Crypto/Tools.js';
import { FINANCE_TOOLS } from '../Finance/Tools.js';
import { PHOTO_TOOLS } from '../Photo/Tools.js';
import { WIKI_TOOLS } from '../Wiki/Tools.js';
import { GEO_TOOLS } from '../Geo/Tools.js';
import { FUN_TOOLS } from '../Fun/Tools.js';
import { JOKE_TOOLS } from '../Joke/Tools.js';
import { QUOTE_TOOLS } from '../Quote/Tools.js';
import { COUNTRY_TOOLS } from '../Country/Tools.js';
import { ASTRONOMY_TOOLS } from '../Astronomy/Tools.js';
import { HACKERNEWS_TOOLS } from '../HackerNews/Tools.js';
import { URL_TOOLS } from '../Url/Tools.js';
import { TERMINAL_TOOLS } from '../Terminal/Tools.js';
import { UTILITY_TOOLS } from '../Utility/Tools.js';
import { SEARCH_TOOLS } from '../Search/Tools.js';
import { DICTIONARY_TOOLS } from '../Dictionary/Tools.js';
import { DATETIME_TOOLS } from '../DateTime/Tools.js';
import { PASSWORD_TOOLS } from '../Password/Tools.js';
import { SUBAGENT_TOOLS } from '../SubAgents/Tools.js';
import { MEMORY_TOOLS } from '../Memory/Tools.js';
import { matchTriggeredGroups, TRIGGERED_GROUPS } from './TriggerRegistry.js';

export {
  WEATHER_TOOLS,
  CRYPTO_TOOLS,
  FINANCE_TOOLS,
  PHOTO_TOOLS,
  WIKI_TOOLS,
  GEO_TOOLS,
  FUN_TOOLS,
  JOKE_TOOLS,
  QUOTE_TOOLS,
  COUNTRY_TOOLS,
  ASTRONOMY_TOOLS,
  HACKERNEWS_TOOLS,
  URL_TOOLS,
  TERMINAL_TOOLS,
  UTILITY_TOOLS,
  SEARCH_TOOLS,
  DICTIONARY_TOOLS,
  DATETIME_TOOLS,
  PASSWORD_TOOLS,
  SUBAGENT_TOOLS,
  MEMORY_TOOLS,
};

/* ══════════════════════════════════════════════════════════════════════
   REQUEST_ALL_TOOLS — meta-tool the AI can call to expand its toolset
   ══════════════════════════════════════════════════════════════════════ */
const REQUEST_ALL_TOOLS_TOOL = {
  name: 'request_all_tools',
  description:
    'Request the full catalog of specialized tools when your current toolset is insufficient. ' +
    'Use this when the user asks about a topic that may need tools not currently loaded ' +
    '(e.g. GitHub, Weather, Finance, Google services). ' +
    'Your toolset will be expanded after this call.',
  category: 'utility',
  parameters: {},
};

/* ══════════════════════════════════════════════════════════════════════
   DEFAULT_TOOLS — always loaded regardless of user message
   ══════════════════════════════════════════════════════════════════════ */
export const DEFAULT_TOOLS = [
  ...TERMINAL_TOOLS,
  ...SEARCH_TOOLS,
  ...UTILITY_TOOLS,
  ...MEMORY_TOOLS,
  ...SUBAGENT_TOOLS,
  REQUEST_ALL_TOOLS_TOOL,
];

/* ══════════════════════════════════════════════════════════════════════
   TRIGGERED_STATIC_TOOLS — only loaded when trigger words match
   ══════════════════════════════════════════════════════════════════════ */
const TRIGGERED_STATIC_TOOLS = [
  ...WEATHER_TOOLS,
  ...CRYPTO_TOOLS,
  ...FINANCE_TOOLS,
  ...PHOTO_TOOLS,
  ...WIKI_TOOLS,
  ...GEO_TOOLS,
  ...FUN_TOOLS,
  ...JOKE_TOOLS,
  ...QUOTE_TOOLS,
  ...COUNTRY_TOOLS,
  ...ASTRONOMY_TOOLS,
  ...HACKERNEWS_TOOLS,
  ...URL_TOOLS,
  ...DICTIONARY_TOOLS,
  ...DATETIME_TOOLS,
  ...PASSWORD_TOOLS,
];

export const STATIC_TOOLS = [...DEFAULT_TOOLS, ...TRIGGERED_STATIC_TOOLS];

export const TOOLS = STATIC_TOOLS;

const CATEGORY_TO_CONNECTOR = {
  gmail: 'google',
  drive: 'google',
  calendar: 'google',
  github: 'github',
  github_review: 'github',
  gitlab: 'gitlab',
  open_meteo: 'open_meteo',
  coingecko: 'coingecko',
  exchange_rate: 'exchange_rate',
  treasury: 'treasury',
  fred: 'fred',
  openweathermap: 'openweathermap',
  unsplash: 'unsplash',
  wikipedia: 'wikipedia',
  ipgeo: 'ipgeo',
  funfacts: 'funfacts',
  jokeapi: 'jokeapi',
  quotes: 'quotes',
  restcountries: 'restcountries',
  nasa: 'nasa',
  hackernews: 'hackernews',
  cleanuri: 'cleanuri',
  search: null,
  dictionary: null,
  translate: null,
  news: null,
  datetime: null,
  security: null,
  utility: null,
  terminal: null,
  mcp: null,
};

const WORKSPACE_SCOPED_TOOL_NAMES = new Set([
  'inspect_workspace',
  'search_workspace',
  'find_file_by_name',
  'git_status',
  'git_diff',
  'git_create_branch',
  'run_project_checks',
  'start_local_server',
]);

function normalizeSchemaType(type = 'string') {
  const normalized = String(type || 'string').toLowerCase();
  if (['string', 'number', 'integer', 'boolean', 'object', 'array'].includes(normalized)) {
    return normalized === 'integer' ? 'number' : normalized;
  }
  return 'string';
}

function schemaPropToParameter(prop = {}, required = false) {
  const fallbackType = Array.isArray(prop.anyOf)
    ? prop.anyOf.find((value) => value?.type)?.type
    : prop.type;

  return {
    type: normalizeSchemaType(fallbackType),
    required,
    description: prop.description || prop.title || '',
  };
}

function normalizeMCPTool(tool) {
  const schema = tool.inputSchema || tool.input_schema || {};
  const properties = schema.properties || {};
  const required = new Set(schema.required || []);

  return {
    name: tool.name,
    description: tool.description || `Tool from MCP server ${tool._mcpServerName || 'unknown'}.`,
    category: 'mcp',
    source: 'mcp',
    parameters: Object.fromEntries(
      Object.entries(properties).map(([key, value]) => [
        key,
        schemaPropToParameter(value, required.has(key)),
      ]),
    ),
  };
}

function dedupeTools(tools = []) {
  const byName = new Map();
  for (const tool of tools) {
    if (!tool?.name) continue;
    if (!byName.has(tool.name)) byName.set(tool.name, tool);
  }
  return [...byName.values()];
}

function getConnectorName(tool = {}) {
  if (tool.connectorId) return tool.connectorId;
  return CATEGORY_TO_CONNECTOR[tool.category];
}

function filterToolListByConnectors(tools = [], connectorStatuses = {}) {
  return tools.filter((tool) => {
    const connectorName = getConnectorName(tool);
    if (connectorName == null) return true;
    return connectorStatuses?.[connectorName]?.enabled === true;
  });
}

function filterToolListByWorkspace(tools = [], workspacePath = state.workspacePath) {
  if (workspacePath) return tools;
  return tools.filter((tool) => !WORKSPACE_SCOPED_TOOL_NAMES.has(tool.name));
}

export function filterToolsByConnectors(connectorStatuses = {}) {
  return filterToolListByConnectors(STATIC_TOOLS, connectorStatuses);
}

export async function getAvailableTools(options = {}) {
  const workspacePath = Object.prototype.hasOwnProperty.call(options, 'workspacePath')
    ? String(options.workspacePath ?? '').trim()
    : state.workspacePath;
  let connectorStatuses = {};
  try {
    connectorStatuses = (await window.electronAPI?.invoke?.('get-connectors')) ?? {};
  } catch {}

  let mcpTools = [];
  try {
    const res = await window.electronAPI?.invoke?.('mcp-get-tools');
    if (res?.ok) mcpTools = (res.tools ?? []).map(normalizeMCPTool).filter(Boolean);
  } catch {}

  let featureTools = [];
  try {
    const boot = await getFeatureBoot();
    featureTools = boot?.chat?.tools ?? [];
  } catch {}

  return dedupeTools([
    ...filterToolListByWorkspace(
      filterToolListByConnectors(featureTools, connectorStatuses),
      workspacePath,
    ),
    ...filterToolListByWorkspace(
      filterToolListByConnectors(STATIC_TOOLS, connectorStatuses),
      workspacePath,
    ),
    ...mcpTools,
  ]);
}

export function buildToolsPrompt(tools = TOOLS) {
  return tools
    .map((tool) => {
      const params = Object.entries(tool.parameters ?? {})
        .map(
          ([key, value]) =>
            `    - ${key} (${value.type}${value.required ? ', required' : ', optional'}): ${value.description}`,
        )
        .join('\n');

      return [
        `* ${tool.name}`,
        `  Description: ${tool.description}`,
        params ? `  Parameters:\n${params}` : '  Parameters: none',
      ].join('\n');
    })
    .join('\n\n');
}

/* ══════════════════════════════════════════════════════════════════════
   TRIGGER-BASED TOOL FILTERING
   ══════════════════════════════════════════════════════════════════════ */

export const REQUEST_ALL_TOOLS_TOOL_NAME = 'request_all_tools';

/** Names of tools that are always available (default tier). */
const DEFAULT_TOOL_NAMES = new Set(DEFAULT_TOOLS.map((t) => t.name));

/**
 * Map each triggered group name → Set of internal tool names it owns.
 * Used to match STATIC_TOOLS by name (reliable, exact).
 */
const TOOL_ARRAYS_BY_GROUP = {
  weather: WEATHER_TOOLS,
  crypto: CRYPTO_TOOLS,
  finance: FINANCE_TOOLS,
  photo: PHOTO_TOOLS,
  wiki: WIKI_TOOLS,
  geo: GEO_TOOLS,
  fun: FUN_TOOLS,
  joke: JOKE_TOOLS,
  quote: QUOTE_TOOLS,
  astronomy: ASTRONOMY_TOOLS,
  hackernews: HACKERNEWS_TOOLS,
  url: URL_TOOLS,
  dictionary: DICTIONARY_TOOLS,
  datetime: DATETIME_TOOLS,
  password: PASSWORD_TOOLS,
  country: COUNTRY_TOOLS,
};

const TRIGGERED_TOOL_NAMES_MAP = new Map();
for (const [groupName, tools] of Object.entries(TOOL_ARRAYS_BY_GROUP)) {
  TRIGGERED_TOOL_NAMES_MAP.set(groupName, new Set(tools.map((t) => t.name)));
}

/**
 * Categories that are always allowed through the filter.
 * 'restcountries' stays here until a Country/Trigger.js is added.
 */
const DEFAULT_CATEGORIES = new Set(['terminal', 'search', 'utility', 'mcp', 'news']);

/** All trigger-gated categories (from TRIGGERED_GROUPS.featureCategories). */
const ALL_TRIGGERED_CATEGORIES = new Set();
for (const group of TRIGGERED_GROUPS) {
  for (const cat of group.featureCategories) {
    ALL_TRIGGERED_CATEGORIES.add(cat);
  }
}

/** Union of default + triggered — anything NOT in here is treated as unknown and included. */
const ALL_KNOWN_CATEGORIES = new Set([...DEFAULT_CATEGORIES, ...ALL_TRIGGERED_CATEGORIES]);

/**
 * Filter a full tool list down to defaults + trigger-matched tools.
 *
 * @param {Array} allTools   — unfiltered tools (from getAvailableTools / cache)
 * @param {string} userText  — raw user message content
 * @returns {Array}          — filtered tools
 */
export function filterToolsByUserText(allTools, userText) {
  if (!userText?.trim()) return allTools;

  const matchedGroups = matchTriggeredGroups(userText);

  // Build allowed categories from matched groups
  const allowedCategories = new Set(DEFAULT_CATEGORIES);
  for (const groupName of matchedGroups) {
    const group = TRIGGERED_GROUPS.find((g) => g.name === groupName);
    if (group) {
      for (const cat of group.featureCategories) {
        allowedCategories.add(cat);
      }
    }
  }

  // Build allowed tool names from matched groups
  const allowedToolNames = new Set(DEFAULT_TOOL_NAMES);
  for (const groupName of matchedGroups) {
    const names = TRIGGERED_TOOL_NAMES_MAP.get(groupName);
    if (names) {
      for (const name of names) {
        allowedToolNames.add(name);
      }
    }
  }

  const filtered = allTools.filter((tool) => {
    // 1. Always include by exact name (defaults + matched triggered)
    if (allowedToolNames.has(tool.name)) return true;
    // 2. Always include MCP tools (dynamic, user-configured)
    if (tool.source === 'mcp') return true;
    // 3. Include by category (for feature-boot / external tools)
    if (allowedCategories.has(tool.category)) return true;
    // 4. Safe fallback: include tools with unknown categories
    if (tool.category && !ALL_KNOWN_CATEGORIES.has(tool.category)) return true;
    return false;
  });

  if (matchedGroups.size > 0) {
    console.log(
      `[Tools] Trigger-matched: ${[...matchedGroups].join(', ')} | ${allTools.length} → ${filtered.length} tools`,
    );
  } else {
    console.log(
      `[Tools] No triggers matched | ${allTools.length} → ${filtered.length} tools (defaults only)`,
    );
  }

  return filtered;
}

/**
 * Build a human-readable catalog of tool groups for the AI.
 * Only lists groups that have at least one available tool.
 *
 * @param {Array} availableTools — the full (unfiltered) tool list
 * @returns {string}
 */
export function buildToolCatalog(availableTools = []) {
  const availableCategories = new Set(availableTools.map((t) => t.category).filter(Boolean));
  const availableNames = new Set(availableTools.map((t) => t.name));

  const activeGroups = TRIGGERED_GROUPS.filter((group) => {
    const toolNames = TRIGGERED_TOOL_NAMES_MAP.get(group.name);
    if (toolNames) {
      for (const name of toolNames) {
        if (availableNames.has(name)) return true;
      }
    }
    for (const cat of group.featureCategories) {
      if (availableCategories.has(cat)) return true;
    }
    return false;
  });

  if (!activeGroups.length) return 'No additional tool groups are available.';

  return [
    'Your toolset has been expanded. The following tool groups are now available:',
    '',
    ...activeGroups.map((g) => `- ${g.name}: ${g.description}`),
    '',
    "Proceed with the appropriate tool calls for the user's request.",
  ].join('\n');
}
