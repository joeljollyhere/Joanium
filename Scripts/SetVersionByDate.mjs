import fs from 'fs';
import path from 'path';

function formatDateVersion(date) {
  // Emit YEAR.MONTHDAY as the base version (e.g. 2026.406 for April 6th).
  // The CI workflow appends the per-day build counter as the patch component,
  // producing valid 3-part semver: 2026.406.1, 2026.406.2, etc.
  // Concatenating month+day avoids leading zeros (406, not 0406).
  const year = date.getFullYear();
  const month = date.getMonth() + 1;
  const day = date.getDate();
  return `${year}.${month * 100 + day}`;
}

const repoRoot = process.cwd();
const manifestPath = path.join(repoRoot, 'package.json');

if (!fs.existsSync(manifestPath)) {
  console.error(`Could not find package.json at ${manifestPath}`);
  process.exit(1);
}

const manifestRaw = fs.readFileSync(manifestPath, 'utf8');
const manifest = JSON.parse(manifestRaw);

const nextVersion = formatDateVersion(new Date());
const prevVersion = manifest.version;

manifest.version = nextVersion;

if (prevVersion === nextVersion) {
  process.stdout.write(`${nextVersion}\n`);
  process.exit(0);
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
process.stdout.write(`${nextVersion}\n`);
