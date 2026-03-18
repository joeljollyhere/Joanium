// ─────────────────────────────────────────────
//  openworld — Packages/Main/IPC/SkillsIPC.js
//  Reads skill .md files from Skills/ directory.
// ─────────────────────────────────────────────

import { ipcMain } from 'electron';
import fs   from 'fs';
import path from 'path';
import Paths from '../Paths.js';

function parseFrontmatter(content) {
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

// Files to skip — internal/empty stubs
const SKIP_FILES = new Set(['Debug.md']);

export function register() {
  ipcMain.handle('get-skills', () => {
    try {
      if (!fs.existsSync(Paths.SKILLS_DIR)) return { ok: true, skills: [] };

      const files = fs.readdirSync(Paths.SKILLS_DIR)
        .filter(f => f.endsWith('.md') && !SKIP_FILES.has(f));

      const skills = files.map(filename => {
        try {
          const raw  = fs.readFileSync(path.join(Paths.SKILLS_DIR, filename), 'utf-8');
          const { meta, body } = parseFrontmatter(raw);

          // Skip files that have no name and no body content
          if (!meta.name && !body.trim()) return null;

          return {
            filename,
            name:        meta.name        || filename.replace('.md', ''),
            trigger:     meta.trigger     || '',
            description: meta.description || '',
            body,
            raw,
          };
        } catch { return null; }
      }).filter(Boolean);

      return { ok: true, skills };
    } catch (err) {
      return { ok: false, error: err.message, skills: [] };
    }
  });
}
