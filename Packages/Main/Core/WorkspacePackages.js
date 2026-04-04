import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const ROOT_PACKAGE_PATH = path.join(REPO_ROOT, 'package.json');

let workspacePackagesCache = null;

function readJson(filePath) {
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function normalizeWorkspacePatterns(workspaces) {
  return Array.isArray(workspaces)
    ? workspaces.filter((pattern) => typeof pattern === 'string' && pattern.trim())
    : [];
}

function expandWorkspacePattern(pattern) {
  const normalized = pattern.replace(/\\/g, '/');
  if (!normalized.includes('*')) {
    return [path.resolve(REPO_ROOT, normalized)];
  }

  if (!normalized.endsWith('/*') || normalized.indexOf('*') !== normalized.length - 1) {
    console.warn(`[WorkspacePackages] Unsupported workspace pattern "${pattern}"`);
    return [];
  }

  const parentDir = path.resolve(REPO_ROOT, normalized.slice(0, -2));
  if (!fs.existsSync(parentDir)) return [];

  return fs
    .readdirSync(parentDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(parentDir, entry.name));
}

function toPackageDescriptor(rootDir) {
  const manifestPath = path.join(rootDir, 'package.json');
  if (!fs.existsSync(manifestPath)) return null;

  const manifest = readJson(manifestPath);
  return Object.freeze({
    name: manifest.name ?? path.basename(rootDir),
    manifest,
    manifestPath,
    rootDir,
  });
}

export function getRepoRoot() {
  return REPO_ROOT;
}

export function loadWorkspacePackages() {
  if (workspacePackagesCache) return workspacePackagesCache;

  const rootManifest = readJson(ROOT_PACKAGE_PATH);
  const packageDirs = normalizeWorkspacePatterns(rootManifest.workspaces)
    .flatMap(expandWorkspacePattern)
    .map((dir) => path.resolve(dir))
    .filter((dir, index, values) => values.indexOf(dir) === index)
    .sort((a, b) => a.localeCompare(b));

  workspacePackagesCache = Object.freeze(packageDirs.map(toPackageDescriptor).filter(Boolean));

  return workspacePackagesCache;
}

export function resolvePackageDiscoveryRoots(pkg, kind) {
  const value = pkg?.manifest?.joanium?.discovery?.[kind];
  const roots = Array.isArray(value) ? value : value ? [value] : [];

  return roots
    .filter((root) => typeof root === 'string' && root.trim())
    .map((root) => path.resolve(pkg.rootDir, root))
    .filter((root, index, values) => values.indexOf(root) === index);
}
