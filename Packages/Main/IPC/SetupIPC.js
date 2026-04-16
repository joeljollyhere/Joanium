import { ipcMain } from 'electron';
import * as UserService from '../Services/UserService.js';
import * as SystemInfoService from '../Services/SystemInfoService.js';
import { loadPage } from '../Core/Window.js';
import Paths from '../Core/Paths.js';
import { wrapHandler } from './IPCWrapper.js';
export const ipcMeta = { needs: [] };
export function register() {
  (ipcMain.handle(
    'save-user',
    wrapHandler((userData) => ({ user: UserService.writeUser(userData) })),
  ),
    ipcMain.handle(
      'save-api-keys',
      wrapHandler((keysMap) => ({ user: UserService.saveApiKeys(keysMap) })),
    ),
    ipcMain.handle(
      'save-provider-configs',
      wrapHandler((configMap) => ({ user: UserService.saveProviderConfigurations(configMap) })),
    ),
    ipcMain.handle(
      'collect-static-system-info',
      wrapHandler(async () => {
        await SystemInfoService.ensureStaticSystemInfo();
        return { ok: true };
      }),
    ),
    ipcMain.handle(
      'launch-main',
      wrapHandler(async () => {
        loadPage(Paths.INDEX_PAGE);
        return { ok: true };
      }),
    ),
    ipcMain.handle(
      'launch-skills',
      (event) => (event.sender.send('navigate', 'skills'), { ok: true }),
    ),
    ipcMain.handle(
      'launch-personas',
      (event) => (event.sender.send('navigate', 'personas'), { ok: true }),
    ));
}
