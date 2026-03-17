// ─────────────────────────────────────────────
//  openworld — App.js
//  Electron main process · root entry point
// ─────────────────────────────────────────────

import { app, BrowserWindow, ipcMain, shell } from 'electron';
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ── Paths ── */
const DATA_DIR = path.join(__dirname, 'Data');
const USER_FILE = path.join(DATA_DIR, 'User.json');
const MODELS_FILE = path.join(DATA_DIR, 'Models.json');
const CUSTOM_INSTRUCTIONS_FILE = path.join(DATA_DIR, 'CustomInstructions.md');
const CHATS_DIR = path.join(DATA_DIR, 'Chats');
const PRELOAD = path.join(__dirname, 'Packages', 'Electron', 'Preload.js');
const SETUP_PAGE = path.join(__dirname, 'Public', 'Setup.html');
const MAIN_PAGE = path.join(__dirname, 'Public', 'index.html');

/* ══════════════════════════════════════════
   HELPERS
══════════════════════════════════════════ */
const DEFAULT_USER = {
  name: '',
  setup_complete: false,
  created_at: null,
  api_keys: {},
  preferences: {
    theme: 'dark',
    default_provider: null,
    default_model: null,
  },
};

const ensureDataDir = () => {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
};

const readJSON = (f) => JSON.parse(fs.readFileSync(f, 'utf-8'));
const writeJSON = (f, d) => {
  ensureDataDir();
  fs.writeFileSync(f, JSON.stringify(d, null, 2), 'utf-8');
};
const readText = (f) => fs.readFileSync(f, 'utf-8');
const writeText = (f, text) => {
  ensureDataDir();
  fs.writeFileSync(f, text, 'utf-8');
};

function mergeUserData(existing = {}, updates = {}) {
  return {
    ...DEFAULT_USER,
    ...existing,
    ...updates,
    api_keys: {
      ...DEFAULT_USER.api_keys,
      ...(existing.api_keys ?? {}),
      ...(updates.api_keys ?? {}),
    },
    preferences: {
      ...DEFAULT_USER.preferences,
      ...(existing.preferences ?? {}),
      ...(updates.preferences ?? {}),
    },
  };
}

function readUserData() {
  try {
    return mergeUserData(readJSON(USER_FILE));
  } catch {
    return mergeUserData();
  }
}

function writeUserData(updates = {}) {
  const nextUser = mergeUserData(readUserData(), updates);
  writeJSON(USER_FILE, nextUser);
  return nextUser;
}

function readCustomInstructions() {
  try {
    return readText(CUSTOM_INSTRUCTIONS_FILE);
  } catch {
    return '';
  }
}

const isFirstRun = () => {
  try { return readJSON(USER_FILE).setup_complete !== true; }
  catch { return true; }
};

/* ══════════════════════════════════════════
   WINDOW
══════════════════════════════════════════ */
let win = null;

function createWindow(page) {
  win = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 1100,
    minHeight: 720,
    frame: false,
    titleBarStyle: 'hidden',
    backgroundColor: '#1a1a1a',
    show: false,
    webPreferences: {
      preload: PRELOAD,
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  win.loadFile(page);
  win.once('ready-to-show', () => win.show());

  win.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });
}

/* ══════════════════════════════════════════
   LIFECYCLE
══════════════════════════════════════════ */
app.whenReady().then(() => {
  // Ensure Chats directory exists
  if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });

  createWindow(isFirstRun() ? SETUP_PAGE : MAIN_PAGE);
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0)
      createWindow(isFirstRun() ? SETUP_PAGE : MAIN_PAGE);
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

/* ══════════════════════════════════════════
   IPC — SETUP
══════════════════════════════════════════ */
ipcMain.handle('save-user', (_e, userData) => {
  try {
    const user = writeUserData(userData);
    return { ok: true, user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('save-api-keys', (_e, keysMap) => {
  try {
    const user = readUserData();
    const nextKeys = { ...(user.api_keys ?? {}) };

    Object.entries(keysMap ?? {}).forEach(([providerId, apiKey]) => {
      if (typeof apiKey === 'string') {
        const trimmed = apiKey.trim();
        if (trimmed) nextKeys[providerId] = trimmed;
        return;
      }

      if (apiKey === null) delete nextKeys[providerId];
    });

    const nextUser = mergeUserData(user, { api_keys: nextKeys });
    writeJSON(USER_FILE, nextUser);
    return { ok: true, user: nextUser };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('save-user-profile', (_e, profile) => {
  try {
    const updates = {};

    if (typeof profile?.name === 'string') {
      updates.name = profile.name.trim();
    }

    const user = writeUserData(updates);
    return { ok: true, user };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('get-custom-instructions', () => {
  return readCustomInstructions();
});

ipcMain.handle('save-custom-instructions', (_e, content) => {
  try {
    writeText(CUSTOM_INSTRUCTIONS_FILE, String(content ?? '').replace(/\r\n/g, '\n'));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('launch-main', () => {
  win?.loadFile(MAIN_PAGE);
  return { ok: true };
});

/* ══════════════════════════════════════════
   IPC — RUNTIME READS
══════════════════════════════════════════ */
ipcMain.handle('get-user', () => readUserData());

ipcMain.handle('get-models', () => {
  const models = readJSON(MODELS_FILE);
  const apiKeys = readUserData().api_keys ?? {};
  return models.map(provider => ({
    ...provider,
    api: apiKeys[provider.provider] ?? null,
  }));
});

ipcMain.handle('get-api-key', (_e, providerId) => {
  return readUserData()?.api_keys?.[providerId] ?? null;
});

/* ══════════════════════════════════════════
   IPC — CHAT STORAGE
══════════════════════════════════════════ */
ipcMain.handle('save-chat', (_e, chatData) => {
  try {
    if (!fs.existsSync(CHATS_DIR)) fs.mkdirSync(CHATS_DIR, { recursive: true });
    const filename = chatData.id + '.json';
    writeJSON(path.join(CHATS_DIR, filename), chatData);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

ipcMain.handle('get-chats', () => {
  try {
    if (!fs.existsSync(CHATS_DIR)) return [];
    return fs.readdirSync(CHATS_DIR)
      .filter(f => f.endsWith('.json'))
      .map(f => {
        try { return readJSON(path.join(CHATS_DIR, f)); }
        catch { return null; }
      })
      .filter(Boolean)
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
  } catch (err) {
    return [];
  }
});

ipcMain.handle('load-chat', (_e, chatId) => {
  return readJSON(path.join(CHATS_DIR, chatId + '.json'));
});

ipcMain.handle('delete-chat', (_e, chatId) => {
  try {
    fs.unlinkSync(path.join(CHATS_DIR, chatId + '.json'));
    return { ok: true };
  } catch (err) {
    return { ok: false, error: err.message };
  }
});

/* ══════════════════════════════════════════
   IPC — FRAMELESS WINDOW CONTROLS
══════════════════════════════════════════ */
ipcMain.on('window-minimize', () => win?.minimize());
ipcMain.on('window-maximize', () => win?.isMaximized() ? win.unmaximize() : win.maximize());
ipcMain.on('window-close', () => win?.close());
