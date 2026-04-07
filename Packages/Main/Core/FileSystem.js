import fs from 'fs';
import path from 'path';

function cloneValue(value) {
  if (value == null) return value;

  if (typeof globalThis.structuredClone === 'function') {
    return globalThis.structuredClone(value);
  }

  return JSON.parse(JSON.stringify(value));
}

function sortDirEntries(entries = []) {
  return [...entries].sort((left, right) => left.name.localeCompare(right.name));
}

export function resolveFallback(fallback) {
  return typeof fallback === 'function' ? fallback() : cloneValue(fallback);
}

export function pathExists(targetPath) {
  return Boolean(targetPath) && fs.existsSync(targetPath);
}

export function directoryExists(dirPath) {
  if (!pathExists(dirPath)) return false;

  try {
    return fs.statSync(dirPath).isDirectory();
  } catch {
    return false;
  }
}

export function fileExists(filePath) {
  if (!pathExists(filePath)) return false;

  try {
    return fs.statSync(filePath).isFile();
  } catch {
    return false;
  }
}

export function ensureDir(dirPath) {
  if (!dirPath) return dirPath;

  if (!directoryExists(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }

  return dirPath;
}

export function ensureParentDir(filePath) {
  if (!filePath) return '';
  return ensureDir(path.dirname(filePath));
}

export function loadText(filePath, fallback = '', options = {}) {
  const { stripBom = true } = options;

  try {
    if (!fileExists(filePath)) return resolveFallback(fallback);

    const raw = fs.readFileSync(filePath, 'utf-8');
    return stripBom ? raw.replace(/^\uFEFF/, '') : raw;
  } catch {
    return resolveFallback(fallback);
  }
}

export function loadJson(filePath, fallback = null) {
  try {
    if (!fileExists(filePath)) return resolveFallback(fallback);
    return JSON.parse(loadText(filePath, '', { stripBom: true }));
  } catch {
    return resolveFallback(fallback);
  }
}

export function persistText(filePath, content, options = {}) {
  const { normalizeLineEndings = false, finalNewline = false } = options;

  ensureParentDir(filePath);

  let next = String(content ?? '');
  if (normalizeLineEndings) {
    next = next.replace(/\r\n/g, '\n');
  }
  if (finalNewline && !next.endsWith('\n')) {
    next += '\n';
  }

  fs.writeFileSync(filePath, next, 'utf-8');
  return next;
}

export function persistJson(filePath, data, options = {}) {
  const { space = 2 } = options;

  ensureParentDir(filePath);
  fs.writeFileSync(filePath, JSON.stringify(data, null, space), 'utf-8');
  return data;
}

function readSortedEntries(dirPath) {
  return sortDirEntries(fs.readdirSync(dirPath, { withFileTypes: true }));
}

export function scanFiles(dirPath, predicate = () => true) {
  if (!directoryExists(dirPath)) return [];

  return readSortedEntries(dirPath).flatMap((entry) => {
    if (!entry.isFile()) return [];

    const fullPath = path.join(dirPath, entry.name);
    return predicate(entry, fullPath) ? [fullPath] : [];
  });
}

export function scanFilesRecursive(rootDir, predicate = () => true) {
  const results = [];
  if (!directoryExists(rootDir)) return results;

  function visit(currentDir) {
    for (const entry of readSortedEntries(currentDir)) {
      const fullPath = path.join(currentDir, entry.name);

      if (entry.isDirectory()) {
        visit(fullPath);
        continue;
      }

      if (entry.isFile() && predicate(entry, fullPath)) {
        results.push(fullPath);
      }
    }
  }

  visit(rootDir);
  return results;
}
