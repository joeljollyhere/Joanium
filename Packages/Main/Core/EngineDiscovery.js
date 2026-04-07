import path from 'path';
import { pathToFileURL } from 'url';
import { scanFilesRecursive } from './FileSystem.js';

function normalizeEngineMeta(name, rawMeta) {
  if (!rawMeta || typeof rawMeta !== 'object' || Array.isArray(rawMeta)) {
    throw new Error(`[EngineDiscovery] "${name}" must export engineMeta.`);
  }

  if (!rawMeta.id || !rawMeta.provides || typeof rawMeta.create !== 'function') {
    throw new Error(
      `[EngineDiscovery] "${name}" must export engineMeta with id, provides, and create(context).`,
    );
  }

  return rawMeta;
}

/**
 * Discover engine modules under one or more roots.
 * Each engine should export:
 *   - engineMeta.needs (optional): array of dependency keys
 *   - engineMeta.create(context): factory function that creates the engine instance
 */
export async function discoverEngines(scanRoots = []) {
  const engineFiles = scanRoots.flatMap((root) =>
    scanFilesRecursive(root, (entry) => entry.name.endsWith('Engine.js')),
  );

  const engines = [];
  for (const fullPath of engineFiles.sort((a, b) => a.localeCompare(b))) {
    try {
      const mod = await import(pathToFileURL(fullPath).href);
      const name = path.basename(fullPath, '.js');
      const meta = normalizeEngineMeta(name, mod.engineMeta);

      engines.push({
        id: meta.id,
        name,
        module: mod,
        meta,
        provides: meta.provides,
        filePath: fullPath,
      });
    } catch (err) {
      console.warn(`[EngineDiscovery] Failed to load: ${fullPath}`, err.message);
    }
  }

  return engines.sort((a, b) => a.name.localeCompare(b.name));
}
