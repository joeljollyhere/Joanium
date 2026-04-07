import { loadJson, persistJson, scanFiles as scanDirectoryFiles } from '../Core/FileSystem.js';

/**
 * Parse YAML-style frontmatter from markdown content.
 * Returns { meta: Record<string, string>, body: string }
 */
export function parseFrontmatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { meta: {}, body: content };
  const meta = {};
  for (const line of match[1].split('\n')) {
    const idx = line.indexOf(':');
    if (idx < 1) continue;
    const key = line.slice(0, idx).trim();
    const val = line.slice(idx + 1).trim();
    if (key && val) meta[key] = val;
  }
  return { meta, body: content.slice(match[0].length).trim() };
}

/**
 * Load a JSON file, returning a fallback if missing or invalid.
 */
export { loadJson, persistJson };

/**
 * Persist data as JSON to disk. Creates parent directories as needed.
 */
export function scanFiles(dirPath, filter = () => true) {
  return scanDirectoryFiles(dirPath, (entry) => filter(entry.name));
}
