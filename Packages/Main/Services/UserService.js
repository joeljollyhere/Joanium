import fs from 'fs';
import path from 'path';
import Paths from '../Core/Paths.js';

const DEFAULT_USER = {
  name: '',
  setup_complete: false,
  created_at: null,
  api_keys: {},
  provider_settings: {},
  preferences: {
    theme: 'light',
    default_provider: null,
    default_model: null,
  },
};

const LOCAL_PROVIDER_RUNTIME = {
  lmstudio: {
    defaultEndpoint: 'http://127.0.0.1:1234/v1/chat/completions',
    modelTemplate: {
      description: 'Local model served through LM Studio',
      rank: 1,
      context_window: 128000,
      max_output: 4096,
      inputs: {
        text: true,
        image: true,
        pdf: false,
        docx: false,
      },
      pricing: {
        input: 0,
        output: 0,
      },
    },
  },
  ollama: {
    defaultEndpoint: 'http://127.0.0.1:11434/v1/chat/completions',
    modelTemplate: {
      description: 'Local model served through Ollama',
      rank: 1,
      context_window: 128000,
      max_output: 4096,
      inputs: {
        text: true,
        image: true,
        pdf: false,
        docx: false,
      },
      pricing: {
        input: 0,
        output: 0,
      },
    },
  },
};

function readJSON(filePath, fallback) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8').replace(/^\uFEFF/, ''));
  } catch {
    return fallback;
  }
}

export function ensureDataDir() {
  if (!fs.existsSync(Paths.DATA_DIR)) {
    fs.mkdirSync(Paths.DATA_DIR, { recursive: true });
  }
}

function ensureParentDir(filePath) {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function merge(existing = {}, updates = {}) {
  return {
    ...DEFAULT_USER,
    ...existing,
    ...updates,
    api_keys: {
      ...DEFAULT_USER.api_keys,
      ...(existing.api_keys ?? {}),
      ...(updates.api_keys ?? {}),
    },
    provider_settings: {
      ...DEFAULT_USER.provider_settings,
      ...(existing.provider_settings ?? {}),
      ...(updates.provider_settings ?? {}),
    },
    preferences: {
      ...DEFAULT_USER.preferences,
      ...(existing.preferences ?? {}),
      ...(updates.preferences ?? {}),
    },
  };
}

function getLocalProviderRuntime(providerId) {
  return LOCAL_PROVIDER_RUNTIME[providerId] ?? null;
}

function normalizeModelIndexEntries(indexData) {
  const rawEntries = Array.isArray(indexData)
    ? indexData
    : Array.isArray(indexData?.files)
      ? indexData.files
      : Array.isArray(indexData?.providers)
        ? indexData.providers
        : [];

  return rawEntries
    .map((entry) => {
      if (typeof entry === 'string') return entry.trim();
      if (entry && typeof entry.file === 'string') return entry.file.trim();
      return '';
    })
    .filter(Boolean);
}

function normalizeLocalEndpoint(providerId, value) {
  const runtime = getLocalProviderRuntime(providerId);
  const trimmed = String(value ?? '').trim();
  if (!trimmed) return runtime?.defaultEndpoint ?? '';

  const normalized = trimmed.replace(/\/+$/, '');
  if (/\/v1\/chat\/completions$/i.test(normalized)) return normalized;
  if (/\/v1$/i.test(normalized)) return `${normalized}/chat/completions`;
  return `${normalized}/v1/chat/completions`;
}

function toOpenAICompatibleBaseUrl(endpoint) {
  return String(endpoint ?? '')
    .trim()
    .replace(/\/+$/, '')
    .replace(/\/chat\/completions$/i, '');
}

function toLocalServerBaseUrl(endpoint) {
  return toOpenAICompatibleBaseUrl(endpoint).replace(/\/v1$/i, '');
}

function withUniqueValues(values = []) {
  const seen = new Set();
  return values.filter((value) => {
    if (!value || seen.has(value)) return false;
    seen.add(value);
    return true;
  });
}

function sortModelEntriesByRank(models = {}) {
  return Object.entries(models).sort(
    ([leftId, leftInfo], [rightId, rightInfo]) =>
      (leftInfo?.rank ?? 999) - (rightInfo?.rank ?? 999) ||
      String(leftInfo?.name ?? leftId).localeCompare(String(rightInfo?.name ?? rightId)),
  );
}

function normalizeDiscoveredLocalModels(models = []) {
  const seen = new Set();

  return models
    .map((model) => {
      const id = String(model?.id ?? model?.modelId ?? model?.name ?? '').trim();
      if (!id || seen.has(id)) return null;
      seen.add(id);

      return {
        id,
        name: String(model?.name ?? id).trim() || id,
        description: String(model?.description ?? '').trim(),
        context_window: Number.isFinite(model?.context_window)
          ? Number(model.context_window)
          : null,
        max_output: Number.isFinite(model?.max_output) ? Number(model.max_output) : null,
      };
    })
    .filter(Boolean);
}

async function fetchJSON(url, { timeoutMs = 1500 } = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.json();
  } finally {
    clearTimeout(timer);
  }
}

async function discoverOpenAICompatibleModels(endpoint) {
  const baseUrl = toOpenAICompatibleBaseUrl(endpoint);
  if (!baseUrl) return [];

  const payload = await fetchJSON(`${baseUrl}/models`);
  return Array.isArray(payload?.data)
    ? payload.data.map((model) => ({
        id: model?.id,
        name: model?.id,
      }))
    : [];
}

async function discoverOllamaModels(endpoint) {
  const baseUrl = toLocalServerBaseUrl(endpoint);
  if (!baseUrl) return [];

  const payload = await fetchJSON(`${baseUrl}/api/tags`);
  return Array.isArray(payload?.models)
    ? payload.models.map((model) => ({
        id: model?.model ?? model?.name,
        name: model?.name ?? model?.model,
      }))
    : [];
}

async function discoverLocalModels(providerId, endpoint) {
  const discoverers =
    providerId === 'ollama'
      ? [discoverOllamaModels, discoverOpenAICompatibleModels]
      : [discoverOpenAICompatibleModels];

  for (const discover of discoverers) {
    try {
      const models = normalizeDiscoveredLocalModels(await discover(endpoint));
      if (models.length) return models;
    } catch {
      /* local server may not be reachable yet; fall back quietly */
    }
  }

  return [];
}

function buildLocalModels(providerId, settings = {}, baseModels = {}, discoveredModels = []) {
  const runtime = getLocalProviderRuntime(providerId);
  if (!runtime?.modelTemplate) return {};

  const preferredModelId = String(settings.modelId ?? '').trim();
  const staticModelIds = sortModelEntriesByRank(baseModels).map(([modelId]) => modelId);
  const discovered = normalizeDiscoveredLocalModels(discoveredModels);
  const discoveredById = new Map(discovered.map((model) => [model.id, model]));
  const discoveredIds = discovered
    .map((model) => model.id)
    .sort((left, right) =>
      String(discoveredById.get(left)?.name ?? left).localeCompare(
        String(discoveredById.get(right)?.name ?? right),
      ),
    );
  const modelIds = withUniqueValues([preferredModelId, ...staticModelIds, ...discoveredIds]);

  if (!modelIds.length) return {};

  return Object.fromEntries(
    modelIds.map((modelId, index) => {
      const staticModel = baseModels?.[modelId] ?? {};
      const discoveredModel = discoveredById.get(modelId) ?? {};
      const model = {
        ...runtime.modelTemplate,
        ...staticModel,
        name: String(discoveredModel.name ?? staticModel.name ?? modelId).trim() || modelId,
        description:
          String(discoveredModel.description ?? staticModel.description ?? '').trim() ||
          runtime.modelTemplate.description,
        rank: index + 1,
      };

      if (Number.isFinite(discoveredModel.context_window)) {
        model.context_window = discoveredModel.context_window;
      }
      if (Number.isFinite(discoveredModel.max_output)) {
        model.max_output = discoveredModel.max_output;
      }

      return [modelId, model];
    }),
  );
}

export function readUser() {
  try {
    return merge(JSON.parse(fs.readFileSync(Paths.USER_FILE, 'utf-8')));
  } catch {
    return merge();
  }
}

export function writeUser(updates = {}) {
  ensureParentDir(Paths.USER_FILE);
  const next = merge(readUser(), updates);
  fs.writeFileSync(Paths.USER_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function isFirstRun() {
  try {
    return readUser().setup_complete !== true;
  } catch {
    return true;
  }
}

export function readModels() {
  const indexEntries = normalizeModelIndexEntries(readJSON(Paths.MODELS_INDEX_FILE, null));

  return indexEntries
    .map((fileName) => readJSON(path.join(Paths.MODELS_DIR, fileName), null))
    .filter((provider) => provider && typeof provider === 'object' && !Array.isArray(provider));
}

export async function readModelsWithKeys() {
  const models = readModels();
  const user = readUser();
  const apiKeys = user.api_keys ?? {};
  const providerSettings = user.provider_settings ?? {};

  return Promise.all(
    models.map(async (provider) => {
      const settings = providerSettings[provider.provider] ?? {};
      const api = String(apiKeys[provider.provider] ?? '').trim();
      const localRuntime = getLocalProviderRuntime(provider.provider);
      const endpoint = localRuntime
        ? normalizeLocalEndpoint(provider.provider, settings.endpoint ?? provider.endpoint)
        : provider.endpoint;
      const discoveredLocalModels =
        localRuntime && endpoint ? await discoverLocalModels(provider.provider, endpoint) : [];
      const resolvedModels = localRuntime
        ? buildLocalModels(
            provider.provider,
            settings,
            provider.models ?? {},
            discoveredLocalModels,
          )
        : (provider.models ?? {});
      const configured =
        provider.requires_api_key === false
          ? Boolean(endpoint && Object.keys(resolvedModels ?? {}).length)
          : Boolean(api);

      return {
        ...provider,
        endpoint,
        models: resolvedModels,
        api: api || null,
        settings,
        configured,
      };
    }),
  );
}

export function saveApiKeys(keysMap) {
  const normalized = Object.fromEntries(
    Object.entries(keysMap ?? {}).map(([id, value]) => [
      id,
      typeof value === 'string' || value === null ? { apiKey: value } : value,
    ]),
  );
  return saveProviderConfigurations(normalized);
}

export function saveProviderConfigurations(configMap) {
  const user = readUser();
  const nextKeys = { ...(user.api_keys ?? {}) };
  const nextSettings = { ...(user.provider_settings ?? {}) };

  Object.entries(configMap ?? {}).forEach(([id, patch]) => {
    if (patch === null) {
      delete nextKeys[id];
      delete nextSettings[id];
      return;
    }

    if (typeof patch === 'string') {
      const trimmed = patch.trim();
      if (trimmed) nextKeys[id] = trimmed;
      else delete nextKeys[id];
      return;
    }

    if (!patch || typeof patch !== 'object' || Array.isArray(patch)) return;

    if (Object.prototype.hasOwnProperty.call(patch, 'apiKey')) {
      const trimmedApiKey = String(patch.apiKey ?? '').trim();
      if (trimmedApiKey) nextKeys[id] = trimmedApiKey;
      else delete nextKeys[id];
    }

    const currentSettings = { ...(nextSettings[id] ?? {}) };
    if (Object.prototype.hasOwnProperty.call(patch, 'endpoint')) {
      const endpoint = String(patch.endpoint ?? '').trim();
      if (endpoint) currentSettings.endpoint = endpoint;
      else delete currentSettings.endpoint;
    }
    if (Object.prototype.hasOwnProperty.call(patch, 'modelId')) {
      const modelId = String(patch.modelId ?? '').trim();
      if (modelId) currentSettings.modelId = modelId;
      else delete currentSettings.modelId;
    }

    if (Object.keys(currentSettings).length > 0) nextSettings[id] = currentSettings;
    else delete nextSettings[id];
  });

  ensureParentDir(Paths.USER_FILE);
  const next = {
    ...merge(user, {}),
    api_keys: nextKeys,
    provider_settings: nextSettings,
  };
  fs.writeFileSync(Paths.USER_FILE, JSON.stringify(next, null, 2), 'utf-8');
  return next;
}

export function readText(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return '';
  }
}

export function writeText(filePath, content) {
  ensureParentDir(filePath);
  fs.writeFileSync(filePath, content, 'utf-8');
}
