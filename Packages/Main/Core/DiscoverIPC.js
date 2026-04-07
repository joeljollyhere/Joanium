import path from 'path';
import { pathToFileURL } from 'url';
import { directoryExists, scanFiles, scanFilesRecursive } from './FileSystem.js';

/**
 * Discover and register all IPC modules found in the given directories.
 *
 * @param {string[]} dirs - Directories to scan recursively for *IPC.js files
 * @param {object} context - Pre-built dependency context (engines, services, etc.)
 * @param {object} [options]
 * @param {string[]} [options.serviceDirs] - Directories to scan for *Service.js modules
 *   that will be auto-imported and merged into the context
 * @returns {Promise<string[]>} List of registered IPC module filenames
 */
export async function discoverAndRegisterIPC(dirs, context = {}, options = {}) {
  // Auto-discover services and merge into context
  const enrichedContext = { ...context };

  for (const serviceDir of options.serviceDirs ?? []) {
    if (!directoryExists(serviceDir)) continue;
    const serviceFiles = scanFiles(serviceDir, (entry) => entry.name.endsWith('Service.js'));

    for (const filePath of serviceFiles) {
      const file = path.basename(filePath);
      try {
        const mod = await import(pathToFileURL(filePath).href);
        // Key is camelCase of filename without .js: UserService.js -> userService
        const key = file.replace(/\.js$/, '');
        const camelKey = key.charAt(0).toLowerCase() + key.slice(1);
        enrichedContext[camelKey] = mod;
      } catch (err) {
        console.warn(`[DiscoverIPC] Failed to load service: ${file}`, err.message);
      }
    }
  }

  // Discover and register IPC modules
  const allFiles = dirs.flatMap((dir) =>
    scanFilesRecursive(dir, (entry) => /IPC\.js$/.test(entry.name)),
  );

  const registered = [];
  const warnings = [];

  for (const filePath of allFiles) {
    const mod = await import(pathToFileURL(filePath).href);
    if (typeof mod.register !== 'function') continue;

    const needs = mod.ipcMeta?.needs ?? [];
    const args = needs.map((key) => {
      if (!(key in enrichedContext)) {
        warnings.push(`"${path.basename(filePath)}" needs "${key}" but it's not in context`);
        return undefined;
      }
      return enrichedContext[key];
    });

    mod.register(...args);
    registered.push(path.basename(filePath));
  }

  if (warnings.length) {
    console.warn(`[DiscoverIPC] Missing dependencies:\n  ${warnings.join('\n  ')}`);
  }

  return registered;
}
