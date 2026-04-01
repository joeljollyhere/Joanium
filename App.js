import { app, BrowserWindow } from 'electron';
import fs from 'fs';

import Paths from './Packages/Main/Core/Paths.js';
import { create as createWindow } from './Packages/Main/Core/Window.js';
import { isFirstRun } from './Packages/Main/Services/UserService.js';
import { boot, startEngines, stopEngines } from './Packages/Main/Boot.js';
import { BUILTIN_BROWSER_USER_AGENT } from './Packages/Main/Services/BrowserPreviewService.js';
import * as MCPIPC from './Packages/Features/MCP/IPC/MCPIPC.js';

app.commandLine.appendSwitch('disable-http2');
app.commandLine.appendSwitch('lang', 'en-US');
app.userAgentFallback = BUILTIN_BROWSER_USER_AGENT;

let engines = null;

app.whenReady().then(async () => {
  if (!fs.existsSync(Paths.DATA_DIR)) fs.mkdirSync(Paths.DATA_DIR, { recursive: true });
  if (!fs.existsSync(Paths.CHATS_DIR)) fs.mkdirSync(Paths.CHATS_DIR, { recursive: true });
  if (!fs.existsSync(Paths.PROJECTS_DIR)) fs.mkdirSync(Paths.PROJECTS_DIR, { recursive: true });
  if (!fs.existsSync(Paths.FEATURES_DATA_DIR)) fs.mkdirSync(Paths.FEATURES_DATA_DIR, { recursive: true });

  engines = await boot();
  startEngines(engines);

  const { featureRegistry, channelEngine, browserPreviewService } = engines;

  const startPage = isFirstRun() ? Paths.SETUP_PAGE : Paths.INDEX_PAGE;
  const mainWindow = createWindow(startPage);
  browserPreviewService.attachToWindow(mainWindow);
  channelEngine.setWindow(mainWindow);
  featureRegistry.attachWindow(mainWindow);

  MCPIPC.autoConnect().catch(err => console.warn('[App] MCP auto-connect failed:', err.message));

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      const win = createWindow(isFirstRun() ? Paths.SETUP_PAGE : Paths.INDEX_PAGE);
      browserPreviewService.attachToWindow(win);
      channelEngine.setWindow(win);
      featureRegistry.attachWindow(win);
    }
  });
});

app.on('window-all-closed', () => {
  if (engines) stopEngines(engines);
  if (process.platform !== 'darwin') app.quit();
});
