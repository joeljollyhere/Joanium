// ─────────────────────────────────────────────
//  openworld — Packages/Main/IPC/AgentsIPC.js
// ─────────────────────────────────────────────

import { ipcMain } from 'electron';
import { loadPage } from '../Window.js';
import Paths        from '../Paths.js';

export function register(agentsEngine) {

  ipcMain.handle('launch-agents', () => {
    loadPage(Paths.AGENTS_PAGE);
    return { ok: true };
  });

  ipcMain.handle('launch-events', () => {
    loadPage(Paths.EVENTS_PAGE);
    return { ok: true };
  });

  ipcMain.handle('get-agents', () => {
    try {
      agentsEngine.reload();
      return { ok: true, agents: agentsEngine.getAll() };
    } catch (err) { return { ok: false, error: err.message, agents: [] }; }
  });

  ipcMain.handle('get-running-jobs', () => {
    try   { return { ok: true, running: agentsEngine.getRunning() }; }
    catch (err) { return { ok: false, error: err.message, running: [] }; }
  });

  /**
   * Wipe all job history + lastRun from Agents.json,
   * and clear lastRun from Automations.json.
   * This is what the Events page "Clear" button calls.
   */
  ipcMain.handle('clear-events-history', async () => {
    try {
      // 1 — Clear agent job history
      agentsEngine.clearAllHistory();

      // 2 — Clear automation lastRun from disk
      const { default: fs } = await import('fs');
      if (fs.existsSync(Paths.AUTOMATIONS_FILE)) {
        const raw  = fs.readFileSync(Paths.AUTOMATIONS_FILE, 'utf-8');
        const data = JSON.parse(raw);
        if (Array.isArray(data.automations)) {
          for (const auto of data.automations) {
            auto.lastRun = null;
          }
          fs.writeFileSync(Paths.AUTOMATIONS_FILE, JSON.stringify(data, null, 2), 'utf-8');
        }
      }

      return { ok: true };
    } catch (err) {
      console.error('[AgentsIPC] clear-events-history error:', err);
      return { ok: false, error: err.message };
    }
  });

  ipcMain.handle('save-agent', (_e, agent) => {
    try {
      const saved = agentsEngine.saveAgent(agent);
      return { ok: true, agent: saved };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('delete-agent', (_e, id) => {
    try {
      agentsEngine.deleteAgent(id);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('toggle-agent', (_e, id, enabled) => {
    try {
      agentsEngine.toggleAgent(id, enabled);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });

  ipcMain.handle('run-agent-now', async (_e, agentId) => {
    try {
      await agentsEngine.runNow(agentId);
      return { ok: true };
    } catch (err) { return { ok: false, error: err.message }; }
  });
}
