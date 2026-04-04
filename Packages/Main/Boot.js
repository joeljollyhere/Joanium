import FeatureRegistry from '../Capabilities/Core/FeatureRegistry.js';
import createFeatureStorageMap from '../Features/Core/FeatureStorage.js';
import {
  IPC_SCAN_DIRS,
  SERVICE_SCAN_DIRS,
  ENGINE_DISCOVERY_ROOTS,
  FEATURE_DISCOVERY_ROOTS,
} from './Core/DiscoveryManifest.js';
import { discoverAndRegisterIPC } from './Core/DiscoverIPC.js';
import { discoverEngines } from './Core/EngineDiscovery.js';
import Paths from './Core/Paths.js';
import { getBrowserPreviewService } from './Services/BrowserPreviewService.js';
import { invalidate as invalidateSystemPrompt } from './Services/SystemPromptService.js';
import * as UserService from './Services/UserService.js';

function getProvidedKey(engine = {}) {
  return engine.meta?.provides;
}

function unmetEngineNeeds(meta = {}, context = {}) {
  return (meta.needs ?? []).filter((key) => context[key] == null);
}

export async function boot() {
  const featureRegistry = await FeatureRegistry.load(FEATURE_DISCOVERY_ROOTS);
  const browserPreviewService = getBrowserPreviewService();

  // Discover engine modules and build them via engineMeta.create(context)
  const discovered = await discoverEngines(ENGINE_DISCOVERY_ROOTS);
  const featureStorage = createFeatureStorageMap(Paths, {
    featureRegistry,
    engines: discovered,
  });
  const engines = {};

  // Build context incrementally so engines can request the same shared services.
  const context = {
    paths: Paths,
    featureRegistry,
    featureStorage,
    engines,
    invalidateSystemPrompt,
    userService: UserService,
  };

  const providers = new Map();
  for (const engine of discovered) {
    const key = getProvidedKey(engine);
    if (providers.has(key)) {
      throw new Error(
        `[Boot] Duplicate engine provider "${key}" from ${providers.get(key)} and ${engine.filePath}`,
      );
    }
    providers.set(key, engine.filePath);
  }

  const pending = [...discovered];
  while (pending.length) {
    let progressed = false;

    for (let index = 0; index < pending.length; index += 1) {
      const { name, meta } = pending[index];
      if (typeof meta.create !== 'function') {
        pending.splice(index, 1);
        index -= 1;
        continue;
      }

      if (unmetEngineNeeds(meta, context).length) continue;

      const provideKey = getProvidedKey(pending[index]);
      const instance = meta.create(context);

      context[provideKey] = instance;
      engines[provideKey] = instance;
      pending.splice(index, 1);
      index -= 1;
      progressed = true;
    }

    if (progressed) continue;

    const details = pending
      .map(({ name, meta }) => {
        const missing = unmetEngineNeeds(meta, context);
        return `${name} [missing: ${missing.join(', ') || 'unknown'}]`;
      })
      .join('; ');

    throw new Error(`[Boot] Unable to instantiate engines: ${details}`);
  }

  featureRegistry.setBaseContext({
    connectorEngine: context.connectorEngine,
    featureStorage,
    paths: Paths,
    invalidateSystemPrompt,
  });
  await featureRegistry.runLifecycle('onBoot', context);

  const registered = await discoverAndRegisterIPC(
    IPC_SCAN_DIRS,
    {
      ...context,
      browserPreviewService,
    },
    {
      serviceDirs: SERVICE_SCAN_DIRS,
    },
  );

  console.log(`[Boot] Auto-discovered ${registered.length} IPC modules: ${registered.join(', ')}`);

  return {
    featureRegistry,
    browserPreviewService,
    ...context,
  };
}

export function startEngines(payload = {}) {
  const instances =
    payload.engines ??
    Object.fromEntries(Object.entries(payload).filter(([key]) => key.endsWith('Engine')));
  for (const engine of Object.values(instances)) {
    engine?.start?.();
  }
}

export function stopEngines(payload = {}) {
  const instances =
    payload.engines ??
    Object.fromEntries(Object.entries(payload).filter(([key]) => key.endsWith('Engine')));
  for (const engine of Object.values(instances)) {
    engine?.stop?.();
  }
}
