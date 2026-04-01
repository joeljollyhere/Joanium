/**
 * Wrap an IPC handler with standard try/catch and { ok, error } contract.
 *
 * If the handler throws, returns { ok: false, error: err.message }.
 * If the handler returns { ok: ... }, passes it through (already has contract).
 * If the handler returns nothing, returns { ok: true }.
 * If the handler returns a value without 'ok', spreads it: { ok: true, ...result }.
 *
 * Usage:
 *   ipcMain.handle('save-chat', wrapHandler((chatData, opts) => {
 *     ChatService.save(chatData, opts);
 *   }));
 *
 *   ipcMain.handle('create-project', wrapHandler((data) => {
 *     return { project: ProjectService.create(data) };
 *   }));
 *
 * @param {Function} fn - The handler function. Receives args after (_event).
 * @returns {Function} ipcMain-compatible handler
 */
export function wrapHandler(fn) {
  return async (_event, ...args) => {
    try {
      const result = await fn(...args);
      if (result === undefined || result === null) {
        return { ok: true };
      }
      if (typeof result === 'object' && 'ok' in result) {
        return result;
      }
      return { ok: true, ...result };
    } catch (err) {
      return { ok: false, error: err.message };
    }
  };
}

/**
 * Wrap a read-only IPC handler that returns raw data (no { ok } wrapper).
 * Returns null on error.
 *
 * @param {Function} fn
 * @returns {Function}
 */
export function wrapRead(fn) {
  return async (_event, ...args) => {
    try {
      return await fn(...args);
    } catch {
      return null;
    }
  };
}
