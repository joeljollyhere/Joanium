// ─────────────────────────────────────────────
//  openworld — Packages/Main/IPC/AgentsIPC.js
//  Reads agent .md files from Agents/ directory.
//  Manages active agent persistence in Data/ActiveAgent.json
// ─────────────────────────────────────────────

import { ipcMain } from 'electron';
import fs   from 'fs';
import path from 'path';
import Paths from '../Paths.js';
import { invalidate as invalidateSysPrompt } from '../Services/SystemPromptService.js';

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

export function register() {
  /* ── List all agents ── */
  ipcMain.handle('get-agents', () => {
    try {
      if (!fs.existsSync(Paths.AGENTS_DIR)) return { ok: true, agents: [] };

      const files = fs.readdirSync(Paths.AGENTS_DIR).filter(f => f.endsWith('.md'));
      const agents = files.map(filename => {
        try {
          const raw = fs.readFileSync(path.join(Paths.AGENTS_DIR, filename), 'utf-8');
          const { meta, body } = parseFrontmatter(raw);
          return {
            filename,
            name:         meta.name         || filename.replace('.md', ''),
            personality:  meta.personality  || '',
            description:  meta.description  || '',
            instructions: body,
          };
        } catch { return null; }
      }).filter(Boolean);

      return { ok: true, agents };
    } catch (err) {
      return { ok: false, error: err.message, agents: [] };
    }
  });

  /* ── Get active agent ── */
  ipcMain.handle('get-active-agent', () => {
    try {
      if (!fs.existsSync(Paths.ACTIVE_AGENT_FILE)) return { ok: true, agent: null };

      const data = JSON.parse(fs.readFileSync(Paths.ACTIVE_AGENT_FILE, 'utf-8'));

      // Verify the agent file still exists — if deleted, clear active
      if (data?.filename) {
        const agentPath = path.join(Paths.AGENTS_DIR, data.filename);
        if (!fs.existsSync(agentPath)) {
          fs.unlinkSync(Paths.ACTIVE_AGENT_FILE);
          invalidateSysPrompt();
          return { ok: true, agent: null };
        }
      }

      return { ok: true, agent: data };
    } catch {
      return { ok: true, agent: null };
    }
  });

  /* ── Set active agent ── */
  ipcMain.handle('set-active-agent', (_e, agentData) => {
    try {
      const dir = path.dirname(Paths.ACTIVE_AGENT_FILE);
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(
        Paths.ACTIVE_AGENT_FILE,
        JSON.stringify(agentData, null, 2),
        'utf-8',
      );
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });

  /* ── Reset to default assistant ── */
  ipcMain.handle('reset-active-agent', () => {
    try {
      if (fs.existsSync(Paths.ACTIVE_AGENT_FILE))
        fs.unlinkSync(Paths.ACTIVE_AGENT_FILE);
      invalidateSysPrompt();
      return { ok: true };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  });
}
