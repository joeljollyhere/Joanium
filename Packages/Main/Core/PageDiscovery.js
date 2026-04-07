import path from 'path';
import { pathToFileURL } from 'url';
import { PAGE_DISCOVERY_ROOTS } from './DiscoveryManifest.js';
import { scanFilesRecursive } from './FileSystem.js';

let cachedPagePromise = null;
let cachedRootSignature = '';

function normalizePage(rawPage = {}, filePath = '') {
  if (!rawPage?.id || !rawPage?.moduleUrl) {
    console.warn(`[PageDiscovery] Skipping invalid page manifest: ${filePath}`);
    return null;
  }

  return {
    ...rawPage,
    css: rawPage.css ?? null,
    label: rawPage.label ?? rawPage.id,
    order: rawPage.order ?? 999,
    section: rawPage.section === 'bottom' ? 'bottom' : 'top',
    showInSidebar: rawPage.showInSidebar !== false,
  };
}

function normalizeScanRoots(scanRoots) {
  const roots = Array.isArray(scanRoots) ? scanRoots : [scanRoots];
  return roots
    .filter((root) => typeof root === 'string' && root.trim())
    .map((root) => path.resolve(root));
}

function buildRootSignature(scanRoots) {
  return [...scanRoots].sort((a, b) => a.localeCompare(b)).join('|');
}

export async function discoverPages(scanRoots = PAGE_DISCOVERY_ROOTS) {
  const roots = normalizeScanRoots(scanRoots);
  const rootSignature = buildRootSignature(roots);

  if (cachedPagePromise && cachedRootSignature === rootSignature) {
    return cachedPagePromise;
  }

  cachedRootSignature = rootSignature;
  cachedPagePromise = (async () => {
    const pageFiles = [];
    const pages = [];
    const seenIds = new Set();

    for (const root of roots) {
      pageFiles.push(...scanFilesRecursive(root, (entry) => entry.name === 'Page.js'));
    }

    for (const filePath of pageFiles.sort((a, b) => a.localeCompare(b))) {
      try {
        const mod = await import(pathToFileURL(filePath).href);
        const page = normalizePage(mod.default, filePath);
        if (!page) continue;

        if (seenIds.has(page.id)) {
          throw new Error(`[PageDiscovery] Duplicate page id "${page.id}" found at ${filePath}`);
        }

        seenIds.add(page.id);
        pages.push(page);
      } catch (error) {
        console.warn(`[PageDiscovery] Failed to load page manifest: ${filePath}`, error.message);
      }
    }

    return pages.sort((a, b) => {
      const orderDelta = (a.order ?? 999) - (b.order ?? 999);
      if (orderDelta !== 0) return orderDelta;
      return String(a.label ?? a.id).localeCompare(String(b.label ?? b.id));
    });
  })();

  try {
    return await cachedPagePromise;
  } catch (error) {
    cachedPagePromise = null;
    cachedRootSignature = '';
    throw error;
  }
}
